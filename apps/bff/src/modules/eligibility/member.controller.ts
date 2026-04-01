import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DxpContext } from '../../common/decorators/dxp-context.decorator';
import { DxpRequestContext } from '../../common/interceptors/request-context.interceptor';
import { FhirClient } from '../fhir-core/fhir-client.service';

/**
 * Member profile + dashboard summary endpoint.
 * Aggregates FHIR Patient, Coverage, Claims, PriorAuth, MeasureReport into
 * a single dashboard payload that drives the member portal header and home page.
 */
@ApiTags('member')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('member')
export class MemberController {
  constructor(private readonly fhir: FhirClient) {}

  @Get('list')
  @ApiOperation({ summary: 'List available members (dev mode only — for member switcher)' })
  async list() {
    const bundle = await this.fhir.search<Record<string, unknown>>('Patient', { _count: '50', _sort: 'family' });
    return (bundle.entry || []).map(e => {
      const p = e.resource;
      const names = (p.name as Record<string, unknown>[]) || [];
      const n = names[0] || {};
      const given = (n.given as string[]) || [];
      const family = (n.family as string) || '';
      const fullName = [...given, family].filter(Boolean).join(' ');
      return { id: String(p.id || ''), name: fullName || 'Unknown' };
    });
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Member dashboard summary — counts and next appointment' })
  async dashboard(@DxpContext() ctx: DxpRequestContext) {
    const memberId = ctx.userId;

    const [patientRes, coverageBundle, claimsBundle, paBundle, gapBundle] = await Promise.all([
      this.fhir.read<Record<string, unknown>>('Patient', memberId).catch(() => null),
      this.fhir.search<Record<string, unknown>>('Coverage', { beneficiary: memberId, status: 'active' }),
      this.fhir.search<Record<string, unknown>>('ExplanationOfBenefit', { patient: memberId, _count: '5', _sort: '-created' }),
      this.fhir.search<Record<string, unknown>>('Claim', { patient: memberId, use: 'preauthorization', _count: '100' }),
      this.fhir.search<Record<string, unknown>>('MeasureReport', { patient: memberId, _count: '100' }),
    ]);

    const patient = patientRes as Record<string, unknown> | null;
    const coverage = (coverageBundle.entry || [])[0]?.resource;

    // Open (in-progress) claims
    const openClaims = (claimsBundle.entry || []).filter(e => {
      const s = String(e.resource.status || '');
      return s === 'active' || s === 'draft' || s === 'submitted';
    }).length;

    // Pending prior auths
    const pendingPAs = (paBundle.entry || []).filter(e => {
      const s = String(e.resource.status || '');
      return s === 'active' || s === 'draft';
    }).length;

    // Open care gaps (MeasureReport numerator count = 0)
    const careGaps = (gapBundle.entry || []).filter(e => {
      const groups = (e.resource.group as Record<string, unknown>[]) || [];
      const firstGroup = groups[0] as Record<string, unknown> | undefined;
      const pops = (firstGroup?.population as Record<string, unknown>[]) || [];
      const num = pops.find(p => {
        const code = p.code as Record<string, unknown> | undefined;
        const coding = (code?.coding as Record<string, unknown>[]) || [];
        return coding.some(c => c.code === 'numerator');
      });
      return num && (num.count as number) === 0;
    }).length;

    const planName = this.extractPlanName(coverage);

    return {
      memberId,
      memberName: patient ? this.formatName(patient) : '',
      planName,
      openClaims,
      pendingPAs,
      careGaps,
      recentNotifications: 0,
    };
  }

  @Get('profile')
  @ApiOperation({ summary: 'Member demographic profile from FHIR Patient resource' })
  async profile(@DxpContext() ctx: DxpRequestContext) {
    const memberId = ctx.userId;

    const [patient, coverageBundle] = await Promise.all([
      this.fhir.read<Record<string, unknown>>('Patient', memberId),
      this.fhir.search<Record<string, unknown>>('Coverage', { beneficiary: memberId, status: 'active' }),
    ]);

    const coverage = (coverageBundle.entry || [])[0]?.resource;
    const telecoms = (patient.telecom as Record<string, unknown>[]) || [];
    const addresses = (patient.address as Record<string, unknown>[]) || [];
    const address = addresses[0] || {};

    return {
      id: String(patient.id || memberId),
      name: this.formatName(patient),
      dateOfBirth: patient.birthDate as string,
      gender: patient.gender as string,
      phone: (telecoms.find(t => t.system === 'phone')?.value as string) || '',
      email: (telecoms.find(t => t.system === 'email')?.value as string) || '',
      address: {
        line: (address.line as string[]) || [],
        city: address.city as string,
        state: address.state as string,
        postalCode: address.postalCode as string,
      },
      planName: this.extractPlanName(coverage),
      planType: this.extractPlanType(coverage),
      memberId: String(coverage?.subscriberId || memberId),
      groupNumber: this.extractClassValue(coverage, 'group'),
      effectiveDate: (coverage?.period as Record<string, unknown>)?.start as string || '',
    };
  }

  // ── Helpers ────────────────────────────────────────────────────

  private formatName(patient: Record<string, unknown>): string {
    const names = (patient.name as Record<string, unknown>[]) || [];
    if (names.length === 0) return '';
    const n = names[0];
    const given = (n.given as string[]) || [];
    const family = (n.family as string) || '';
    return [...given, family].filter(Boolean).join(' ');
  }

  private extractPlanName(coverage: Record<string, unknown> | undefined): string {
    if (!coverage) return '';
    const planType = coverage.type as Record<string, unknown> | undefined;
    const coding = (planType?.coding as Record<string, unknown>[]) || [];
    return (planType?.text as string) || (coding[0]?.display as string) || '';
  }

  private extractPlanType(coverage: Record<string, unknown> | undefined): string {
    if (!coverage) return 'PPO';
    const planType = coverage.type as Record<string, unknown> | undefined;
    const coding = (planType?.coding as Record<string, unknown>[]) || [];
    return (coding[0]?.code as string) || 'PPO';
  }

  private extractClassValue(coverage: Record<string, unknown> | undefined, code: string): string {
    if (!coverage) return '';
    const cls = (coverage.class as Record<string, unknown>[]) || [];
    const match = cls.find(c => {
      const t = c.type as Record<string, unknown> | undefined;
      const coding = (t?.coding as Record<string, unknown>[]) || [];
      return coding.some(co => co.code === code);
    });
    return (match?.value as string) || '';
  }
}
