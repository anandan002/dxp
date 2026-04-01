// FHIR / Da Vinci adapter module definitions for the payer-portal Playground.
// Follows the same AdapterModule shape as starters/insurance-portal/src/data/modules.ts.

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  sampleBody?: string;
}

interface AdapterInfo {
  name: string;
  envValue: string;
  description: string;
  config: string;
}

export interface AdapterModule {
  name: string;
  description: string;
  port: string;
  portInterface: string;
  adapters: AdapterInfo[];
  envVar: string;
  endpoints: Endpoint[];
  sdkUsage: string;
  setupGuide: string;
}

const SAMPLE_MEMBER_ID = 'ff4a99a5-cb4e-447a-a103-cf830d12be8d';
const SAMPLE_PA_ID     = '7c208610-89bc-4749-a152-2c8b51625750';
const SAMPLE_NPI       = '1000000000';

export const fhirModules: AdapterModule[] = [
  // ── 1. Prior Auth (Da Vinci PAS) ──────────────────────────────────────────
  {
    name: 'Prior Auth (Da Vinci PAS)',
    description:
      'Prior Authorization Support following the HL7 Da Vinci PAS IG. Maps FHIR Claim (use=preauthorization) + ClaimResponse. Also implements CRD (Coverage Requirements Discovery) and DTR (Documentation Templates & Rules).',
    port: 'PriorAuthPort',
    portInterface: `abstract class PriorAuthPort {
  abstract listPriorAuths(
    tenantId: string,
    filters: PAQueueFilters,
  ): Promise<FhirPaginatedResult<PriorAuthSummary>>;

  abstract getPriorAuthDetail(
    tenantId: string,
    id: string,
  ): Promise<PriorAuthDetail>;

  // CRD — check if prior auth is required before ordering
  abstract checkRequirement(
    tenantId: string,
    serviceCode: string,
    memberId: string,
  ): Promise<CRDResponse>;

  // DTR — fetch questionnaire for a service code
  abstract getDocTemplate(
    tenantId: string,
    serviceCode: string,
  ): Promise<DTRTemplate>;

  // PAS — submit a new prior auth request
  abstract submitRequest(
    tenantId: string,
    data: PASubmission,
  ): Promise<PriorAuthSummary>;

  // Record a payer decision (approved / denied / pended)
  abstract decide(
    tenantId: string,
    id: string,
    decision: PADecision,
  ): Promise<PriorAuthDetail>;

  abstract getDashboardMetrics(tenantId: string): Promise<PADashboardMetrics>;
  abstract getReviewQueue(
    tenantId: string,
    filters: PAQueueFilters,
  ): Promise<FhirPaginatedResult<PriorAuthSummary>>;
}`,
    adapters: [
      {
        name: 'DaVinciPASAdapter',
        envValue: 'davinci-pas',
        description:
          'Reads/writes FHIR R4 Claim (use=preauthorization) and ClaimResponse resources. Uses _include=Claim:patient to resolve member names in a single round-trip. Follows the Da Vinci PAS v2.0 IG.',
        config: `PRIOR_AUTH_ADAPTER=davinci-pas
FHIR_BASE_URL=http://localhost:8090/fhir
# Optional SMART-on-FHIR token if payer FHIR server requires auth:
FHIR_AUTH_TOKEN=`,
      },
      {
        name: 'ManualPAAdapter',
        envValue: 'manual-pa',
        description:
          'Returns stub data — no FHIR server required. Useful for demos, CI, and environments without a payer FHIR endpoint.',
        config: `PRIOR_AUTH_ADAPTER=manual-pa
# No FHIR server needed`,
      },
    ],
    envVar: 'PRIOR_AUTH_ADAPTER',
    endpoints: [
      { method: 'GET',  path: '/prior-auth',                      description: 'List prior authorizations (member or payer view)' },
      { method: 'GET',  path: `/prior-auth/${SAMPLE_PA_ID}`,      description: 'Get prior auth detail by ID' },
      { method: 'GET',  path: '/prior-auth/queue',                 description: 'Get clinical review queue (internal payer use)' },
      { method: 'GET',  path: '/prior-auth/dashboard',             description: 'Dashboard metrics (approval rate, turnaround, top services)' },
      { method: 'GET',  path: '/prior-auth/template/27447',        description: 'DTR — get documentation questionnaire for CPT 27447' },
      {
        method: 'POST',
        path: '/prior-auth/check',
        description: 'CRD — check if prior auth is required for a service',
        sampleBody: JSON.stringify({
          serviceCode: '27447',
          memberId: SAMPLE_MEMBER_ID,
        }, null, 2),
      },
      {
        method: 'POST',
        path: '/prior-auth/submit',
        description: 'PAS — submit a new prior authorization request',
        sampleBody: JSON.stringify({
          memberId: SAMPLE_MEMBER_ID,
          serviceCode: '27447',
          urgency: 'routine',
          clinicalReasonCode: 'M17.11',
          requestedServiceDate: { start: '2026-05-01', end: '2026-05-01' },
          notes: 'Patient has failed conservative treatment for 6 months.',
        }, null, 2),
      },
      {
        method: 'PUT',
        path: `/prior-auth/${SAMPLE_PA_ID}/decide`,
        description: 'Record a payer decision (approved / denied / pended)',
        sampleBody: JSON.stringify({
          decision: 'approved',
          rationale: 'Medical necessity criteria met. Conservative treatment exhausted.',
          expirationDate: '2026-12-31',
        }, null, 2),
      },
    ],
    sdkUsage: `import {
  usePriorAuths, usePriorAuthDetail,
  usePACheck, usePASubmit, usePADecide,
  usePAQueue, usePADashboard,
} from '@dxp/sdk-react';

// Member — list their PAs
const { data } = usePriorAuths({ status: 'in-review' });

// Provider — CRD check before ordering
const check = usePACheck();
const { requiresAuth } = await check.mutateAsync({
  serviceCode: '27447',
  memberId: 'member-001',
});

// Provider — submit PAS request
const submit = usePASubmit();
submit.mutate({ memberId, serviceCode: '27447', urgency: 'routine', ... });

// Internal — payer review queue
const { data: queue } = usePAQueue({ urgency: 'urgent' });

// Internal — decision
const decide = usePADecide();
decide.mutate({ id, decision: 'approved', rationale: '...' });`,
    setupGuide: `Da Vinci PAS (Prior Authorization Support)
─────────────────────────────────────────
1. Set PRIOR_AUTH_ADAPTER=davinci-pas in .env
2. Set FHIR_BASE_URL=http://localhost:8090/fhir (or your payer FHIR endpoint)
3. Run "make up" to start HAPI FHIR server
4. Run "pnpm seed:fhir" to populate 30 prior auth requests in various states
5. Restart BFF — all /prior-auth endpoints now read from HAPI FHIR

FHIR Resource Mapping:
  Claim (use=preauthorization) ──► PriorAuthSummary / PriorAuthDetail
  ClaimResponse                ──► decision, rationale, expirationDate
  CoverageEligibilityResponse  ──► CRD check (POST /prior-auth/check)
  Questionnaire                ──► DTR template (GET /prior-auth/template/:code)

Da Vinci IGs implemented:
  PAS  v2.0 — Prior Authorization Support
  CRD  v2.0 — Coverage Requirements Discovery
  DTR  v2.0 — Documentation Templates & Rules

For a real payer FHIR server: set FHIR_BASE_URL to the payer endpoint.
For demo/stub mode: set PRIOR_AUTH_ADAPTER=manual-pa. Zero FHIR setup.`,
  },

  // ── 2. Claims (FHIR ExplanationOfBenefit) ────────────────────────────────
  {
    name: 'Claims (FHIR EOB)',
    description:
      'Reads claims and Explanations of Benefit from FHIR R4. Maps ExplanationOfBenefit resources to member-friendly ClaimSummary / EOBDetail. Supports appeal submission.',
    port: 'ClaimsPort',
    portInterface: `abstract class ClaimsPort {
  abstract listClaims(
    tenantId: string,
    memberId: string,
    filters: ClaimFilters,
  ): Promise<FhirPaginatedResult<ClaimSummary>>;

  abstract getClaimDetail(
    tenantId: string,
    id: string,
  ): Promise<ClaimSummary>;

  abstract getEOB(
    tenantId: string,
    id: string,
  ): Promise<EOBDetail>;

  abstract submitAppeal(
    tenantId: string,
    claimId: string,
    data: AppealSubmission,
  ): Promise<Appeal>;

  abstract getDashboardMetrics(
    tenantId: string,
  ): Promise<ClaimDashboardMetrics>;
}`,
    adapters: [
      {
        name: 'FhirClaimAdapter',
        envValue: 'fhir-claim',
        description:
          'Queries FHIR R4 ExplanationOfBenefit resources. Resolves patient via _include. Maps adjudication arrays to billed/allowed/paid amounts.',
        config: `CLAIMS_ADAPTER=fhir-claim
FHIR_BASE_URL=http://localhost:8090/fhir`,
      },
      {
        name: 'ManualClaimAdapter',
        envValue: 'manual',
        description: 'Returns stub claims data. No FHIR server required.',
        config: `CLAIMS_ADAPTER=manual`,
      },
    ],
    envVar: 'CLAIMS_ADAPTER',
    endpoints: [
      { method: 'GET', path: `/claims?memberId=${SAMPLE_MEMBER_ID}`, description: 'List claims for a member' },
      { method: 'GET', path: '/claims/dashboard',                    description: 'Claims dashboard metrics (totals, denial rate, avg processing)' },
      {
        method: 'POST',
        path: '/claims/eob-id-here/appeal',
        description: 'Submit a claim appeal',
        sampleBody: JSON.stringify({
          reason: 'Medical necessity not properly evaluated',
          supportingNotes: 'See attached clinical documentation',
          documentIds: [],
        }, null, 2),
      },
    ],
    sdkUsage: `import { useClaims, useClaimDetail, useClaimEOB, useAppeal } from '@dxp/sdk-react';

// Member — list their claims
const { data } = useClaims({ status: 'processed', page: 1, pageSize: 20 });

// EOB detail (itemized breakdown)
const { data: eob } = useClaimEOB(claimId);
// eob.billedAmount, eob.allowedAmount, eob.memberResponsibility

// Submit appeal
const appeal = useAppeal();
appeal.mutate({
  claimId: 'claim-001',
  reason: 'Billing error on service date',
});`,
    setupGuide: `FHIR Claims (ExplanationOfBenefit)
──────────────────────────────────
1. Set CLAIMS_ADAPTER=fhir-claim
2. Set FHIR_BASE_URL=http://localhost:8090/fhir
3. Run "pnpm seed:fhir" — seeds ~200 ExplanationOfBenefit resources across 50 patients
4. Query: GET /claims?memberId=<patient-uuid>

FHIR Resource Mapping:
  ExplanationOfBenefit ──► ClaimSummary, EOBDetail
    .patient           ──► memberId (resolved via _include)
    .item[]            ──► service line items
    .adjudication[]    ──► billed / allowed / paid amounts
    .outcome           ──► status (complete = processed, queued = pending)

CPCDS Compliance: The FhirClaimAdapter follows CPCDS (Consumer-Directed Payer Data Exchange)
naming conventions so members can export their claims to third-party apps.`,
  },

  // ── 3. Eligibility (FHIR Coverage) ───────────────────────────────────────
  {
    name: 'Eligibility (FHIR Coverage)',
    description:
      'Member benefits, accumulators, cost estimates, and digital ID card. Reads FHIR R4 Coverage + CoverageEligibilityResponse. Enables real-time eligibility verification for providers.',
    port: 'EligibilityPort',
    portInterface: `abstract class EligibilityPort {
  abstract getBenefits(
    tenantId: string,
    memberId: string,
  ): Promise<BenefitCategory[]>;

  abstract getAccumulators(
    tenantId: string,
    memberId: string,
  ): Promise<Accumulators>;

  abstract getCostEstimate(
    tenantId: string,
    serviceCode: string,
    memberId: string,
  ): Promise<CostEstimate>;

  abstract getIdCard(
    tenantId: string,
    memberId: string,
  ): Promise<DigitalIdCard>;
}`,
    adapters: [
      {
        name: 'FhirCoverageAdapter',
        envValue: 'fhir-coverage',
        description:
          'Reads FHIR Coverage resources for benefits and plan details. Uses CoverageEligibilityResponse for real-time eligibility checks.',
        config: `ELIGIBILITY_ADAPTER=fhir-coverage
FHIR_BASE_URL=http://localhost:8090/fhir`,
      },
      {
        name: 'ManualEligibilityAdapter',
        envValue: 'manual',
        description: 'Returns stub benefits and ID card. No FHIR server required.',
        config: `ELIGIBILITY_ADAPTER=manual`,
      },
    ],
    envVar: 'ELIGIBILITY_ADAPTER',
    endpoints: [
      { method: 'GET', path: `/eligibility/benefits?memberId=${SAMPLE_MEMBER_ID}`,       description: 'Get benefit categories (medical, dental, vision, Rx)' },
      { method: 'GET', path: `/eligibility/accumulators?memberId=${SAMPLE_MEMBER_ID}`,    description: 'Deductible and OOP max progress' },
      { method: 'GET', path: `/eligibility/id-card?memberId=${SAMPLE_MEMBER_ID}`,         description: 'Digital ID card (plan, group, member number)' },
      { method: 'GET', path: `/eligibility/cost-estimate?serviceCode=27447&memberId=${SAMPLE_MEMBER_ID}`, description: 'Real-time cost estimate for a service' },
    ],
    sdkUsage: `import { useBenefits, useAccumulators, useIdCard, useCostEstimate } from '@dxp/sdk-react';

// Member dashboard — benefits overview
const { data: benefits } = useBenefits(memberId);

// Deductible progress
const { data: accumulators } = useAccumulators(memberId);
// accumulators.deductible.met / .total, accumulators.oopMax.met / .total

// Digital ID card
const { data: card } = useIdCard(memberId);
// card.memberName, card.memberId, card.planName, card.groupNumber

// Provider — real-time cost estimate
const { data: estimate } = useCostEstimate('27447', memberId);
// estimate.estimatedCost, estimate.memberResponsibility`,
    setupGuide: `FHIR Eligibility (Coverage)
───────────────────────────
1. Set ELIGIBILITY_ADAPTER=fhir-coverage
2. Set FHIR_BASE_URL=http://localhost:8090/fhir
3. Run "pnpm seed:fhir" — seeds Coverage resources for each of the 50 patients
   (HMO, PPO, and Medicare Advantage plans distributed across the population)

FHIR Resource Mapping:
  Coverage                    ──► planName, planType, groupNumber, effectiveDate
  CoverageEligibilityResponse ──► benefit limits, remaining amounts, accumulators

Provider Eligibility Check:
  The /eligibility/id-card endpoint is designed for real-time provider verification.
  Providers call it at point-of-service to confirm active coverage before rendering care.

Da Vinci PDex integration:
  When PAYER_EXCHANGE_ADAPTER=pdex, member coverage can be fetched from prior payer
  via $MemberMatch operation and PDex data export.`,
  },

  // ── 4. Provider Directory ─────────────────────────────────────────────────
  {
    name: 'Provider Directory',
    description:
      'Search, validate, and retrieve quality metrics for providers. Reads FHIR Practitioner, PractitionerRole, Organization, and Location resources. Supports NPPES NPI Registry as an alternative adapter.',
    port: 'ProviderDirectoryPort',
    portInterface: `abstract class ProviderDirectoryPort {
  abstract search(
    tenantId: string,
    params: ProviderSearchParams,
  ): Promise<FhirPaginatedResult<ProviderSummary>>;

  abstract getByNPI(
    tenantId: string,
    npi: string,
  ): Promise<ProviderDetail>;

  abstract validate(
    tenantId: string,
    npi: string,
  ): Promise<ProviderValidation>;

  abstract getQualityMetrics(
    tenantId: string,
  ): Promise<ProviderQualityMetrics[]>;
}`,
    adapters: [
      {
        name: 'FhirProviderAdapter',
        envValue: 'fhir-provider',
        description:
          'Reads Practitioner + PractitionerRole + Organization resources from HAPI. Supports filtering by name, specialty, location, and network status.',
        config: `PROVIDER_DIR_ADAPTER=fhir-provider
FHIR_BASE_URL=http://localhost:8090/fhir`,
      },
      {
        name: 'NppesAdapter',
        envValue: 'nppes',
        description:
          'Queries the CMS NPPES NPI Registry API (public, no auth required). Useful when the client does not maintain an internal FHIR provider directory.',
        config: `PROVIDER_DIR_ADAPTER=nppes
# NPPES public API — no credentials needed
# NPPES_BASE_URL=https://npiregistry.cms.hhs.gov/api`,
      },
    ],
    envVar: 'PROVIDER_DIR_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/providers/search?specialty=Cardiology&pageSize=5', description: 'Search providers by specialty' },
      { method: 'GET', path: `/providers/${SAMPLE_NPI}`,                          description: 'Get full provider profile by NPI' },
      { method: 'GET', path: `/providers/${SAMPLE_NPI}/validate`,                 description: 'Validate NPI — license status, sanctions, network participation' },
      { method: 'GET', path: '/providers/quality?pageSize=10',                    description: 'Provider quality metrics (HEDIS performance, star ratings)' },
    ],
    sdkUsage: `import { useProviderSearch, useProviderDetail } from '@dxp/sdk-react';

// Member — find in-network providers
const { data } = useProviderSearch({
  specialty: 'Cardiology',
  location: '90210',
  network: 'in-network',
  pageSize: 20,
});

// Provider profile + quality metrics
const { data: provider } = useProviderDetail(npi);
// provider.name, provider.specialties[], provider.locations[],
// provider.qualityMetrics.hedisStarRating`,
    setupGuide: `Provider Directory
──────────────────
Option A — Internal FHIR Directory (recommended for health plans):
1. Set PROVIDER_DIR_ADAPTER=fhir-provider
2. Set FHIR_BASE_URL=http://localhost:8090/fhir
3. Run "pnpm seed:fhir" — seeds 100 Practitioner + PractitionerRole + Organization resources
4. GET /providers/search?specialty=Cardiology

Option B — NPPES NPI Registry (public CMS data):
1. Set PROVIDER_DIR_ADAPTER=nppes
2. No credentials needed — NPPES is a public API
3. Providers are resolved from the national NPI registry in real time
4. Slower (external API) but always current

Da Vinci PDex Provider Directory:
  The FHIR adapter follows the Da Vinci PDex Plan Net IG for provider directory
  interoperability. Health plans can exchange their provider directory data with
  other payers and providers in a standardized format.`,
  },

  // ── 5. Risk Stratification (HCC Engine) ──────────────────────────────────
  {
    name: 'Risk Stratification (HCC)',
    description:
      'Population health risk scoring using CMS-HCC (Hierarchical Condition Category) methodology. Computes RAF scores from FHIR Condition and Claim resources. Powers the care manager worklist, member risk profiles, and care gap closure workflows.',
    port: 'RiskStratificationPort',
    portInterface: `abstract class RiskStratificationPort {
  abstract getPopulationDashboard(
    tenantId: string,
  ): Promise<PopulationDashboardMetrics>;

  abstract getRiskWorklist(
    tenantId: string,
    params: WorklistParams,
  ): Promise<WorklistEntry[]>;

  abstract getMemberRiskProfile(
    tenantId: string,
    memberId: string,
  ): Promise<MemberRiskProfile>;

  abstract getCareGaps(
    tenantId: string,
    memberId: string,
  ): Promise<CareGap[]>;

  abstract closeCareGap(
    tenantId: string,
    gapId: string,
    data: CloseGapRequest,
  ): Promise<CareGap>;
}`,
    adapters: [
      {
        name: 'HccEngineAdapter',
        envValue: 'hcc-engine',
        description:
          'Computes CMS-HCC v28 risk scores from FHIR Condition and ExplanationOfBenefit resources. Generates RAF scores, identifies care gaps, and ranks members by risk tier for care manager outreach.',
        config: `RISK_STRAT_ADAPTER=hcc-engine
FHIR_BASE_URL=http://localhost:8090/fhir
# HCC model version (v24 | v28)
HCC_MODEL_VERSION=v28`,
      },
    ],
    envVar: 'RISK_STRAT_ADAPTER',
    endpoints: [
      { method: 'GET',  path: '/population/dashboard',                                description: 'Population health KPIs (high-risk count, avg RAF, gap closure rate)' },
      { method: 'GET',  path: '/population/worklist?tier=high&pageSize=10',           description: 'Care manager worklist — members ranked by risk tier' },
      { method: 'GET',  path: `/population/member/${SAMPLE_MEMBER_ID}/risk`,          description: 'Full member risk profile (RAF score, HCC categories, care gaps)' },
      { method: 'GET',  path: `/population/care-gaps?memberId=${SAMPLE_MEMBER_ID}`,   description: 'Open care gaps for a member (HEDIS-based)' },
      {
        method: 'POST',
        path: '/population/care-gaps/gap-id-here/close',
        description: 'Close a care gap with evidence',
        sampleBody: JSON.stringify({
          closureType: 'documented',
          notes: 'A1c lab resulted 7.2% on 2026-03-15. Gap closed.',
          documentId: null,
        }, null, 2),
      },
    ],
    sdkUsage: `import {
  usePopulationDashboard, useRiskWorklist,
  useMemberRiskProfile, useCareGaps,
} from '@dxp/sdk-react';

// Internal — population KPIs
const { data: pop } = usePopulationDashboard();
// pop.highRiskMembers, pop.avgRafScore, pop.openCareGaps

// Care manager worklist (sorted by RAF score descending)
const { data: worklist } = useRiskWorklist({ tier: 'high', pageSize: 25 });

// Member drill-down
const { data: risk } = useMemberRiskProfile(memberId);
// risk.rafScore, risk.hccCategories[], risk.tier, risk.careGaps[]

// Care gap closure
const close = useCloseCareGap();
close.mutate({ gapId, closureType: 'documented', notes: '...' });`,
    setupGuide: `Risk Stratification (CMS-HCC)
─────────────────────────────
1. Set RISK_STRAT_ADAPTER=hcc-engine
2. Set FHIR_BASE_URL=http://localhost:8090/fhir
3. Run "pnpm seed:fhir" — seeds Condition resources (HCC-mapped ICD-10 codes)
   and links them to the 50 seeded patients. The HCC engine computes RAF scores
   at query time from these Condition resources.

HCC Score Computation:
  Condition.code (ICD-10) ──► HCC Category lookup ──► RAF addend
  Sum of all addend values ──► Member RAF score
  RAF score banding: < 0.8 = low | 0.8–1.5 = medium | > 1.5 = high | > 2.5 = critical

Care Gap Logic:
  The adapter cross-references HEDIS measure definitions against member claims
  and encounters to identify open care gaps (e.g., A1c not tested in 12 months,
  mammogram overdue, colorectal screening missing).

Population Segmentation:
  GET /population/worklist sorts members by RAF score descending — highest-risk
  members appear first for proactive outreach by care managers.`,
  },
];
