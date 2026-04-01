import { Injectable, Logger } from '@nestjs/common';
import {
  CareEvent,
  CareEventType,
  CareTeamMember,
  HealthProgram,
  ProgramMilestone,
  DischargePlan,
} from '@dxp/contracts';
import { CarePlanPort } from '../ports/care-plan.port';
import { FhirClient, FhirBundle } from '../../fhir-core/fhir-client.service';

@Injectable()
export class FhirCarePlanAdapter extends CarePlanPort {
  private readonly logger = new Logger(FhirCarePlanAdapter.name);

  constructor(private readonly fhir: FhirClient) {
    super();
  }

  async getCareTimeline(
    tenantId: string,
    memberId: string,
  ): Promise<CareEvent[]> {
    const bundle = await this.fhir.search<Record<string, unknown>>('Encounter', {
      patient: memberId,
      _sort: '-date',
      _count: '50',
    });

    return (bundle.entry || []).map(e => this.mapEncounterToEvent(e.resource));
  }

  async getCareTeam(
    tenantId: string,
    memberId: string,
  ): Promise<CareTeamMember[]> {
    const bundle = await this.fhir.search<Record<string, unknown>>('CareTeam', {
      patient: memberId,
      status: 'active',
      _include: 'CareTeam:participant',
    });

    // Build a name map from included Practitioner resources
    const practitionerNames = new Map<string, string>();
    for (const entry of bundle.entry || []) {
      if (String(entry.resource.resourceType || '') === 'Practitioner') {
        const id = String(entry.resource.id || '');
        const names = (entry.resource.name as Record<string, unknown>[]) || [];
        if (names.length > 0) {
          const given = (names[0].given as string[]) || [];
          const family = String(names[0].family || '');
          const display = [...given, family].filter(Boolean).join(' ');
          if (display) practitionerNames.set(`Practitioner/${id}`, display);
        }
      }
    }

    const members: CareTeamMember[] = [];
    for (const entry of bundle.entry || []) {
      if (String(entry.resource.resourceType || '') !== 'CareTeam') continue;
      const participants = (entry.resource.participant as Record<string, unknown>[]) || [];
      for (const p of participants) {
        const member = p.member as Record<string, unknown> | undefined;
        const ref = String(member?.reference || '');
        // Prefer resolved Practitioner name over seeded display value
        const resolvedName = practitionerNames.get(ref);
        members.push(this.mapParticipantToMember(p, resolvedName));
      }
    }
    return members;
  }

  async listPrograms(
    tenantId: string,
    memberId: string,
  ): Promise<HealthProgram[]> {
    const bundle = await this.fhir.search<Record<string, unknown>>('CarePlan', {
      patient: memberId,
      _count: '50',
    });

    return (bundle.entry || []).map(e => this.mapCarePlanToProgram(e.resource));
  }

  async getProgramDetail(
    tenantId: string,
    programId: string,
  ): Promise<HealthProgram> {
    const resource = await this.fhir.read<Record<string, unknown>>('CarePlan', programId);
    return this.mapCarePlanToProgram(resource);
  }

  async getDischargePlan(
    tenantId: string,
    encounterId: string,
  ): Promise<DischargePlan> {
    const encounter = await this.fhir.read<Record<string, unknown>>('Encounter', encounterId);
    const carePlanBundle = await this.fhir.search<Record<string, unknown>>('CarePlan', {
      encounter: encounterId,
      category: 'discharge',
    });

    const dischargePlan = carePlanBundle.entry?.[0]?.resource;

    return {
      encounterId,
      dischargeDate: this.extractPeriodEnd(encounter) || '',
      instructions: this.extractActivities(dischargePlan, 'instruction'),
      medications: this.extractMedications(dischargePlan),
      followUpAppointments: this.extractFollowUps(dischargePlan),
      restrictions: this.extractActivities(dischargePlan, 'restriction'),
    };
  }

  // ── Mappers ────────────────────────────────────────────────────

  private mapEncounterToEvent(raw: Record<string, unknown>): CareEvent {
    const classCode = this.extractCoding(raw, 'class');
    const typeCode = this.extractCoding(raw, 'type');

    return {
      id: String(raw.id || ''),
      type: this.mapEncounterType(classCode?.code || '', typeCode?.code || ''),
      date: this.extractPeriodStart(raw) || '',
      description: typeCode?.display || classCode?.display || 'Encounter',
      provider: this.extractDisplay(raw, 'participant') || '',
      facility: this.extractDisplay(raw, 'serviceProvider') || undefined,
      status: this.mapEncounterStatus(String(raw.status || '')),
      notes: raw.reasonCode ? this.extractReasonDisplay(raw.reasonCode) : undefined,
    };
  }

  private mapEncounterType(classCode: string, typeCode: string): CareEventType {
    const classMap: Record<string, CareEventType> = {
      IMP: 'admission',
      EMER: 'ed-visit',
      AMB: 'office-visit',
      VR: 'telehealth',
      SS: 'procedure',
    };
    if (classMap[classCode]) return classMap[classCode];

    const typeMap: Record<string, CareEventType> = {
      'follow-up': 'follow-up',
      imaging: 'imaging',
      laboratory: 'lab',
    };
    return typeMap[typeCode] || 'office-visit';
  }

  private mapEncounterStatus(status: string): CareEvent['status'] {
    const map: Record<string, CareEvent['status']> = {
      planned: 'planned',
      'in-progress': 'in-progress',
      finished: 'completed',
      cancelled: 'cancelled',
    };
    return map[status] || 'completed';
  }

  private mapParticipantToMember(p: Record<string, unknown>, resolvedName?: string): CareTeamMember {
    const member = p.member as Record<string, unknown> | undefined;
    const role = (p.role as Record<string, unknown>[])
      ?.[0] as Record<string, unknown> | undefined;
    const roleCoding = this.extractFirstCoding(role);
    const specialty = roleCoding?.display;

    // Prefer resolved Practitioner name; fall back to member.display only if it's not a specialty name
    const displayName = String(member?.display || '');
    const isSpecialtyName = specialty && displayName === specialty;
    const name = resolvedName || (isSpecialtyName ? '' : displayName) || specialty || 'Care Team Member';

    return {
      id: member?.reference ? String(member.reference).split('/').pop() || '' : '',
      name,
      role: this.mapCareTeamRole(roleCoding?.code || ''),
      specialty,
      isPrimary: Boolean(p.leadOrg),
    };
  }

  private mapCareTeamRole(code: string): CareTeamMember['role'] {
    const map: Record<string, CareTeamMember['role']> = {
      pcp: 'pcp',
      specialist: 'specialist',
      'care-manager': 'care-manager',
      nurse: 'nurse',
      pharmacist: 'pharmacist',
      'social-worker': 'social-worker',
    };
    return map[code] || 'specialist';
  }

  private mapCarePlanToProgram(raw: Record<string, unknown>): HealthProgram {
    const activities = (raw.activity as Record<string, unknown>[]) || [];

    return {
      id: String(raw.id || ''),
      name: this.extractText(raw, 'title') || String(raw.title || 'Care Plan'),
      condition: this.extractText(raw, 'addresses') || '',
      status: this.mapCarePlanStatus(String(raw.status || '')),
      enrolledDate: this.extractPeriodStart(raw),
      milestones: activities.map((a, idx) => this.mapActivityToMilestone(a, idx)),
      careManager: this.extractDisplay(raw, 'author'),
    };
  }

  private mapCarePlanStatus(status: string): HealthProgram['status'] {
    const map: Record<string, HealthProgram['status']> = {
      active: 'enrolled',
      completed: 'completed',
      revoked: 'withdrawn',
      draft: 'eligible',
    };
    return map[status] || 'enrolled';
  }

  private mapActivityToMilestone(
    activity: Record<string, unknown>,
    idx: number,
  ): ProgramMilestone {
    const detail = activity.detail as Record<string, unknown> | undefined;
    return {
      id: String(idx),
      title: this.extractText(detail || {}, 'code') || `Activity ${idx + 1}`,
      description: String(detail?.description || ''),
      status: this.mapActivityStatus(String(detail?.status || '')),
      dueDate: detail?.scheduledString as string | undefined,
    };
  }

  private mapActivityStatus(status: string): ProgramMilestone['status'] {
    const map: Record<string, ProgramMilestone['status']> = {
      'not-started': 'pending',
      'in-progress': 'pending',
      completed: 'completed',
      cancelled: 'skipped',
    };
    return map[status] || 'pending';
  }

  // ── Helpers ────────────────────────────────────────────────────

  private extractCoding(
    obj: Record<string, unknown>,
    field: string,
  ): { code: string; display?: string } | undefined {
    const cc = obj[field] as Record<string, unknown> | undefined;
    if (!cc) return undefined;
    // Handle both CodeableConcept (with coding array) and raw Coding
    const coding = (cc.coding as Record<string, unknown>[]) || [];
    if (coding[0]) {
      return { code: String(coding[0].code), display: coding[0].display as string };
    }
    if (cc.code) return { code: String(cc.code), display: cc.display as string };
    return undefined;
  }

  private extractFirstCoding(
    cc: Record<string, unknown> | undefined,
  ): { code: string; display?: string } | undefined {
    if (!cc) return undefined;
    const coding = (cc.coding as Record<string, unknown>[]) || [];
    return coding[0]
      ? { code: String(coding[0].code), display: coding[0].display as string }
      : undefined;
  }

  private extractDisplay(obj: Record<string, unknown>, field: string): string | undefined {
    const val = obj[field];
    if (Array.isArray(val)) {
      const first = val[0] as Record<string, unknown> | undefined;
      const individual = first?.individual as Record<string, unknown> | undefined;
      return (individual?.display || first?.display) as string | undefined;
    }
    const ref = val as Record<string, unknown> | undefined;
    return ref?.display as string | undefined;
  }

  private extractText(obj: Record<string, unknown>, field: string): string | undefined {
    const val = obj[field];
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) {
      const first = val[0] as Record<string, unknown> | undefined;
      return (first?.text || first?.display) as string | undefined;
    }
    const cc = val as Record<string, unknown> | undefined;
    return cc?.text as string | undefined;
  }

  private extractPeriodStart(obj: Record<string, unknown>): string | undefined {
    const period = obj.period as Record<string, unknown> | undefined;
    return period?.start as string | undefined;
  }

  private extractPeriodEnd(obj: Record<string, unknown>): string | undefined {
    const period = obj.period as Record<string, unknown> | undefined;
    return period?.end as string | undefined;
  }

  private extractActivities(
    plan: Record<string, unknown> | undefined,
    category: string,
  ): string[] {
    if (!plan) return [];
    const activities = (plan.activity as Record<string, unknown>[]) || [];
    return activities
      .filter(a => {
        const detail = a.detail as Record<string, unknown> | undefined;
        const kindCode = this.extractText(detail || {}, 'kind');
        return !category || kindCode === category || true;
      })
      .map(a => {
        const detail = a.detail as Record<string, unknown> | undefined;
        return String(detail?.description || '');
      })
      .filter(Boolean);
  }

  private extractMedications(
    plan: Record<string, unknown> | undefined,
  ): DischargePlan['medications'] {
    if (!plan) return [];
    const activities = (plan.activity as Record<string, unknown>[]) || [];
    return activities
      .filter(a => {
        const detail = a.detail as Record<string, unknown> | undefined;
        return String(detail?.kind || '') === 'MedicationRequest';
      })
      .map(a => {
        const detail = a.detail as Record<string, unknown> | undefined;
        return {
          name: this.extractText(detail || {}, 'productCodeableConcept') || '',
          dosage: String(detail?.description || ''),
          instructions: String(detail?.description || ''),
        };
      });
  }

  private extractFollowUps(
    plan: Record<string, unknown> | undefined,
  ): DischargePlan['followUpAppointments'] {
    if (!plan) return [];
    const activities = (plan.activity as Record<string, unknown>[]) || [];
    return activities
      .filter((a: Record<string, unknown>) => {
        const detail = a.detail as Record<string, unknown> | undefined;
        return String(detail?.kind || '') === 'Appointment';
      })
      .map(a => {
        const detail = a.detail as Record<string, unknown> | undefined;
        return {
          provider: this.extractDisplay(detail || {}, 'performer') || '',
          specialty: '',
          date: String(detail?.scheduledString || ''),
          phone: '',
        };
      });
  }

  // Extract display text from FHIR reasonCode array (handles nested coding)
  private extractReasonDisplay(reasonCode: unknown): string | undefined {
    const arr = Array.isArray(reasonCode) ? reasonCode : [reasonCode];
    const first = arr[0] as Record<string, unknown> | undefined;
    if (!first) return undefined;
    if (first.text) return String(first.text);
    const coding = (first.coding as Record<string, unknown>[]) || [];
    return (coding[0]?.display as string | undefined);
  }
}
