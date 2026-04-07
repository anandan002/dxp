# FHIR Data vs Mock Data — Payer Portal

This document describes exactly which data is real (served from HAPI FHIR via the BFF) and which data is mock (static fallback in the portal), across every page and module.

---

## How the Pattern Works

Every portal page follows the same rule:

```
const rawData = hookData ?? mockData;
```

- **BFF is running + FHIR has data** → hook returns real data, mock is never used
- **BFF is running + no FHIR data for that member** → hook returns empty/null, mock is used
- **BFF is down / unreachable** → hook throws/returns null, mock is used

The portal never crashes. It degrades gracefully to mock.

---

## Member Switcher

The portal header shows an "Active Member" dropdown (click the user avatar). This is backed by `GET /member/list` → FHIR `Patient?_sort=family`. Selecting a member stores their ID in `localStorage` and passes it as `X-Dev-Member-Id` on every subsequent API call. All React Query cache is invalidated immediately, so every page re-fetches for the new member.

---

## Module-by-Module Breakdown

### Member Portal

| Page | SDK Hook | BFF Endpoint | FHIR Resources | Mock Fallback |
|------|----------|-------------|----------------|---------------|
| **Dashboard** | `useMemberDashboard` | `GET /member/dashboard` | `Patient`, `Coverage`, `ExplanationOfBenefit`, `Claim`, `MeasureReport` | `memberProfile`, `coverage` from `mock.ts` |
| **Benefits** | `useBenefits` | `GET /eligibility/benefits` | `Coverage` (benefits breakdown) | `benefits` mock |
| | `useAccumulators` | `GET /eligibility/accumulators` | `Coverage` (cost/deductible) | `accumulators` mock |
| | `useIdCard` | `GET /eligibility/id-card` | `Coverage` (plan details) | `coverage` mock |
| **Digital ID Card** | `useIdCard` | `GET /eligibility/id-card` | `Coverage` | `coverage` mock |
| **Claims** | `useClaims` | `GET /claims` | `ExplanationOfBenefit` (paginated) | `claims` mock |
| **Claim Detail** | `useClaimDetail` | `GET /claims/:id` | `ExplanationOfBenefit` | `claims[0]` mock |
| **Find Provider** | `useProviderSearch` | `GET /providers/search` | `Practitioner`, `PractitionerRole`, `Organization` | `providers` mock |
| **Prior Auth** | `usePriorAuths` | `GET /prior-auth` | `Claim` (use=preauthorization) | `priorAuths` mock |
| **Cost Estimate** | `useCostEstimate` | `GET /eligibility/cost-estimate` | `Coverage` | cost estimate mock |
| **Care Timeline** | `useCareTimeline` | `GET /care/timeline` | `Encounter` | `careTimeline` mock |
| **Care Team** | `useCareTeam` | `GET /care/team` | `CareTeam` + `Practitioner` (`_include`) | `careTeam` mock |
| **Programs** | `usePrograms` | `GET /care/programs` | `CarePlan` | `programs` mock |
| **Messages** | — | — | None — pure local state | Static message list in component |
| **Settings** | `useMemberProfile` | `GET /member/profile` | `Patient`, `Coverage` | `memberProfile`, `coverage` mock |

---

### Provider Portal

| Page | SDK Hook | BFF Endpoint | FHIR Resources | Mock Fallback |
|------|----------|-------------|----------------|---------------|
| **Provider Dashboard** | `usePADashboard` | `GET /prior-auth/dashboard` | `Claim`, `ClaimResponse` (counts) | `providerStats` mock |
| **Provider Prior Auth** | `usePAQueue` | `GET /prior-auth/queue` | `Claim` (use=preauthorization, active) | `mockPAQueue` |
| | `usePASubmit` | `POST /prior-auth/submit` | Creates `Claim` resource | N/A (write) |
| **Provider Eligibility** | `useBenefits` | `GET /eligibility/benefits` | `Coverage` | `sampleEligibilityResult` mock |
| **Provider Claims** | `useClaims` | `GET /claims` | `ExplanationOfBenefit` | `mockClaims` |

---

### Internal (Payer Operations) Portal

| Page | SDK Hook | BFF Endpoint | FHIR Resources | Mock Fallback |
|------|----------|-------------|----------------|---------------|
| **Population Dashboard** | `usePopulationDashboard` | `GET /population/dashboard` | `Patient` (count), `Condition` (aggregates) | `populationMetrics` mock |
| **Risk Worklist** | `useRiskWorklist` | `GET /population/worklist` | `Patient`, `Condition`, `MeasureReport` | `mockRiskWorklist` |
| **Member Risk Profile** | `useMemberRiskProfile` | `GET /population/member/:id/risk` | `Patient`, `Condition`, `Observation` | `mockMember` |
| **PA Queue** | `usePAQueue` | `GET /prior-auth/queue` | `Claim` (use=preauthorization) | `mockPAQueue` |
| **PA Dashboard** | `usePADashboard` | `GET /prior-auth/dashboard` | `Claim`, `ClaimResponse` | `paDashboardMetrics` mock |
| **Claims Dashboard** | `useClaimsDashboard` | `GET /claims/dashboard` | `ExplanationOfBenefit` (aggregated) | `claimsDashboardMetrics` mock |
| **Provider Data Quality** | — | — | None | `providerQualityData` mock (static) |
| **HCC Dashboard** | `useCareGaps` | `GET /population/care-gaps` | `MeasureReport` | `hccGaps` mock |
| **Utilization Dashboard** | `useUtilizationDashboard` | `GET /analytics/utilization` | `Encounter`, `ExplanationOfBenefit` | `utilizationTrends` mock |
| **Contract Analytics** | `useContractScorecards` | `GET /analytics/scorecards` | — | `contractScorecards` mock (stub) |
| **Quality Dashboard** | `useQualityDashboard` | `GET /quality/dashboard` | `MeasureReport` (HEDIS) | `hedisMetrics` mock |

---

## BFF Adapters and Which Ones Are Active

Each BFF module selects its adapter from an env var. The default (active) adapter is shown first.

| Module | Env Var | Default | Alternative | What Changes |
|--------|---------|---------|------------|--------------|
| `claims` | `CLAIMS_ADAPTER` | `fhir-claim` | — | Maps `ExplanationOfBenefit` |
| `eligibility` | `ELIGIBILITY_ADAPTER` | `fhir-coverage` | — | Maps `Coverage` + `CoverageEligibilityResponse` |
| `prior-auth` | `PRIOR_AUTH_ADAPTER` | `davinci-pas` | `manual-pa` | See Da Vinci section below |
| `care-plan` | `CARE_PLAN_ADAPTER` | `fhir-careplan` | — | Maps `CarePlan`, `Encounter`, `CareTeam` |
| `provider-directory` | `PROVIDER_DIR_ADAPTER` | `fhir-provider` | `nppes` | `nppes` hits NPI Registry REST API |

---

## Da Vinci Implementation Guide Coverage

The prior-auth module implements three Da Vinci IGs. Here is the honest status of each.

### Da Vinci PAS — Prior Authorization Support (`PRIOR_AUTH_ADAPTER=davinci-pas`)

**What is fully implemented against FHIR:**

| Operation | FHIR Resource | Status |
|-----------|--------------|--------|
| List prior auths | `Claim?use=preauthorization` | ✅ Real FHIR — HAPI |
| Get PA detail | `Claim/:id` | ✅ Real FHIR — HAPI |
| Submit new PA | `POST Claim` (use=preauthorization) | ✅ Real FHIR — creates resource |
| Record decision | `POST ClaimResponse` | ✅ Real FHIR — creates resource |
| Dashboard metrics | `Claim` + `ClaimResponse` count queries | ✅ Real FHIR — HAPI |
| Review queue | `Claim?use=preauthorization&status=active` | ✅ Real FHIR — HAPI |

**Where mock/stub logic is used:**

| Operation | What Happens | Why |
|-----------|-------------|-----|
| `checkRequirement` (CRD) | Queries `CoverageEligibilityResponse` — if any exist for the patient, returns `requiresAuth: true`. Does **not** call a real CDS Hooks endpoint. | CDS Hooks requires a real-time payer endpoint. HAPI doesn't simulate one. |
| `getDocTemplate` (DTR) | Queries `Questionnaire?code=<serviceCode>`. If none found, returns a **hardcoded 3-question template** (clinical justification, date, attachment). | HAPI has no seeded Questionnaire resources for service codes. |
| `automationRate` in dashboard | Always returns `0` | Computed from a proprietary rules engine, not FHIR. |
| `avgTurnaroundHours` | Always returns `0` | Requires timestamp comparison logic not yet implemented. |
| `topRequestedServices` | Always returns `[]` | Requires aggregation query not supported in HAPI basic mode. |

**The `manual-pa` adapter** is a pure stub — all methods return hardcoded empty/placeholder data. Use it when no FHIR server is available.

---

### Da Vinci CRD — Coverage Requirements Discovery

**Status: Partial stub.** The `checkRequirement` method exists and queries FHIR, but it does not implement the CDS Hooks protocol (no `POST /cds-services/coverage-requirements-prefetch`). It approximates by checking if any `CoverageEligibilityResponse` exists for the patient.

**To implement fully:** The BFF would need to act as a CDS Hooks client, calling the payer's CRD server at order-entry time. The `checkRequirement` method signature supports this — swap the internals.

---

### Da Vinci DTR — Documentation Templates and Rules

**Status: Partial stub.** The `getDocTemplate` method queries `Questionnaire` resources from HAPI. Since no Questionnaires are seeded, it always falls through to the hardcoded 3-question template. The questionnaire rendering UI in `ProviderPriorAuth.tsx` uses this template.

**To implement fully:** Seed FHIR `Questionnaire` resources per CPT code, or point `FHIR_BASE_URL` at a DTR-capable payer FHIR server.

---

### Da Vinci PDex — Payer Data Exchange (`payer-exchange` module)

| Operation | FHIR Operation | Status |
|-----------|---------------|--------|
| `memberMatch` | `POST Patient/$member-match` | ⚠️ Calls HAPI — but HAPI does not support `$member-match` out-of-the-box. Returns empty match. |
| `exportMemberData` | `GET Patient/:id/$everything` | ⚠️ Stub — generates a job ID but does not actually trigger a FHIR bulk export. |
| `getExportStatus` | — | ⚠️ Stub — always returns `status: complete`. |

**PDex is not exercised by any portal page currently.** The `payer-exchange` controller exists and is registered, but no SDK hook or UI page calls it. It is ready for a future Payer-to-Payer data exchange screen.

---

## FHIR Resources Seeded in HAPI

The seed script (`pnpm seed:fhir`) populates these resources for 50 synthetic patients:

| Resource | Count | Used by |
|----------|-------|---------|
| `Patient` | 50 | All member-scoped endpoints |
| `Coverage` | 50 | Eligibility, Benefits, ID Card, Settings |
| `ExplanationOfBenefit` | ~200 | Claims |
| `Claim` (preauth) | ~30 | Prior Auth |
| `Practitioner` | 100 | Provider Directory, Care Team |
| `PractitionerRole` | 100 | Provider Directory |
| `Organization` | 20 | Provider Directory |
| `Encounter` | ~250 | Care Timeline |
| `CareTeam` | ~50 | Care Team (with `_include: CareTeam:participant`) |
| `CarePlan` | ~50 | Programs |
| `MeasureReport` | ~100 | Quality Dashboard, HCC, Care Gaps |
| `Consent` | ~20 | Consent module |

**Not seeded (no FHIR data available for these):**

| Resource | Pages affected | Behavior |
|----------|---------------|---------|
| `Questionnaire` | Prior Auth — DTR template | Returns hardcoded 3-question template |
| `Appointment` | Dashboard — next appointment | Shows `undefined` / hidden |
| `Communication` / `MessageHeader` | Messages page | Messages page uses local state only |
| `Observation` | Risk Profile chart | Falls back to mock risk scores |
| Utilization aggregates | Utilization Dashboard | Uses mock trend data |
| Contract data | Contract Analytics | Full mock |

---

## Fields That Are Always Mock

Even when using the FHIR adapter, some fields cannot come from standard FHIR R4 and always fall back to mock or a static default:

| Field | Page | Why |
|-------|------|-----|
| Provider phone/email | Care Team | `CareTeam.participant` doesn't carry contact details. Seeded Practitioners have no telecom. |
| Provider facility name | Care Team | Not in `CareTeam` resource structure |
| Provider distance / rating | Find Provider | Not a FHIR concept |
| Provider languages | Find Provider | Present in `Practitioner.communication` but not seeded |
| Claim procedure code | Claims | EOB items have procedure codes but seed uses minimal items |
| Claim primary diagnosis | Claims | EOB `diagnosis` array present; adapter not yet mapping it |
| HbA1c / clinical values | Risk Profile | Requires `Observation` resources — not seeded |
| Automation rate / turnaround | PA Dashboard | Computed metric, not in FHIR |
| Contract VBC details | Contract Analytics | Proprietary data, no FHIR mapping |

---

## Running Without FHIR (Mock-Only Mode)

Stop the BFF or point it at nothing:

```bash
# Linux/macOS: stop BFF running on :5021
lsof -ti:5021 | xargs kill -9

# Portal will use 100% mock data on every page
cd starters/payer-portal && pnpm dev
```

```powershell
# Windows: stop BFF running on :5021
Get-NetTCPConnection -LocalPort 5021 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
cd starters\payer-portal; pnpm dev
```

Every page still renders. The only visual difference from FHIR mode is member data (names, dates, claim numbers) — the mock uses "James Martinez", the FHIR data uses real seeded names.

---

## Quick Reference: Is This Data Real?

| You see this in the portal | Is it FHIR? |
|---------------------------|-------------|
| Member name in Dashboard header | ✅ Yes — `Patient.name` |
| "James Garcia" / "Mark Anderson" etc. | ✅ Yes — seeded patients |
| "Sarah Thompson" | ❌ No — mock fallback (BFF not reachable) |
| Claims with UUIDs in Claim # column | ✅ Yes — FHIR EOB |
| Claims with "CLM-2024-xxxxx" format | ❌ No — mock data |
| Prior auths with UUID auth numbers | ✅ Yes — FHIR Claim |
| Prior auths with "PA-2024-xxxxx" format | ❌ No — mock data |
| Care Team names ("Maria Patel", "Robert Wu") | ✅ Yes — resolved via `_include` |
| Care Team names ("Nephrology", "Care Management") | ❌ No — stale seed or BFF down |
| Programs with "Activity 1/2/3" milestones | ✅ Yes — FHIR CarePlan activities (seed has generic titles) |
| Provider specialty as plain string | ✅ Yes — normalized from `{code, display}` object |
| Messages content | ❌ Always mock — no FHIR `Communication` resources seeded |
