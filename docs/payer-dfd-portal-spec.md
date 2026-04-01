# Payer Digital Front Door — Portal Design Specification

> Source: HTC DFD for Payers (March 2026)
> Target: DXP Delivery Accelerator framework
> Date: 2026-03-31

### Implementation Note for Builders

> **This portal is also a showcase for the DXP component library.** When building pages,
> maximize usage of `@dxp/ui` primitives and composed components — both what's listed
> in this spec and any components added to the library after this document was written.
> Before creating any custom component, check `packages/ui/src/` for an existing primitive
> or composed component that fits. The payer portal should serve as a reference
> implementation demonstrating the full breadth of the `@dxp/ui` library in a real-world
> enterprise context. If a `@dxp/ui` component can be used — use it.

---

## 1. Overview

A unified, FHIR-enabled member and provider portal consolidating 11 use cases across three domains:

| Domain | Use Cases |
|--------|-----------|
| **Member-Facing** | Member Engagement, Care Coordination, Long-Term Follow-Up (LTFU) |
| **Clinical & Operational** | Population Health, Prior Authorization, Claims & Adjudication, Provider Data Normalization |
| **Analytics & Compliance** | Risk Adjustment & HCC, Utilization Management, Contract Analytics, Quality Reporting |

### Portal Channels

| Channel | Role |
|---------|------|
| Web Portal | Primary member + provider self-service |
| Mobile App | On-the-go access (benefits, claims, care gaps) |
| AI Chatbot | 24/7 self-service with intent detection |
| IVR | Voice-based self-service |
| Provider Portal | PA submission, claims, eligibility lookup |
| Broker Portal | Plan comparison, enrollment tools |

---

## 2. DXP Framework Mapping

### 2.1 Architecture Layers (maps to DFD Orchestration Framework)

```
Channels          → React apps (starters/payer-portal)
Orchestration     → Kong gateway + Keycloak SSO + BFF workflow module
Core Services     → BFF adapter modules (NestJS port+adapter)
Data & Interop    → FHIR R4 adapters, HL7/X12 adapters, analytics adapters
Compliance        → Keycloak RBAC, audit module, consent module
```

### 2.2 Existing DXP Modules → Payer DFD Mapping

| DXP Module | Payer DFD Function |
|------------|--------------------|
| `auth` | Keycloak OIDC/SAML, member + provider SSO |
| `identity` | Member identity resolution, MPI lookup |
| `cms` | Benefits content, plan documents, EOB explanations |
| `documents` | EOB documents, PA attachments, appeal uploads |
| `notifications` | Care gap alerts, PA decisions, claim status push |
| `chat` | AI chatbot with intent detection + agent escalation |
| `workflow` | PA workflow (CRD→DTR→PAS), appeals, LTFU sequences |
| `search` | Provider directory search, formulary lookup |
| `analytics` | Utilization dashboards, quality reporting, risk scores |
| `audit` | HIPAA audit trail, PA decision logging |
| `payments` | Cost estimator, copay/accumulator tracking |
| `scheduling` | Appointment booking, care manager outreach scheduling |
| `storage` | Clinical document storage (chart attachments, PA docs) |
| `rules` | PA rules engine, benefits determination, eligibility |
| `integration` | FHIR R4 hub, HL7v2 ADT feeds, X12 EDI claims |

### 2.3 New BFF Modules Required

| New Module | Port (Contract) | Adapter Examples | Env Var |
|------------|-----------------|------------------|---------|
| `claims` | `ClaimsPort` | `x12-edi`, `fhir-claim` | `CLAIMS_ADAPTER=x12-edi` |
| `eligibility` | `EligibilityPort` | `fhir-coverage`, `x12-270` | `ELIGIBILITY_ADAPTER=fhir-coverage` |
| `prior-auth` | `PriorAuthPort` | `davinci-pas`, `manual` | `PRIOR_AUTH_ADAPTER=davinci-pas` |
| `care-plan` | `CarePlanPort` | `fhir-careplan`, `custom` | `CARE_PLAN_ADAPTER=fhir-careplan` |
| `risk-stratification` | `RiskStratPort` | `hcc-engine`, `ml-model` | `RISK_STRAT_ADAPTER=hcc-engine` |
| `provider-directory` | `ProviderDirPort` | `fhir-provider`, `nppes` | `PROVIDER_DIR_ADAPTER=fhir-provider` |
| `quality-measures` | `QualityMeasuresPort` | `hedis-engine`, `stars-api` | `QUALITY_ADAPTER=hedis-engine` |
| `consent` | `ConsentPort` | `fhir-consent`, `custom` | `CONSENT_ADAPTER=fhir-consent` |

---

## 3. Functional Specification by Use Case

### UC-1: Member Engagement (Self-Service)

**Goal**: Unified portal replacing fragmented logins — benefits, claims, PA status, care navigation in one view.

**Pages / Views**:

| Page | Key Functions |
|------|---------------|
| **Dashboard** | Personalized home: benefits summary, active claims, open PAs, care gap alerts, recent EOBs |
| **Benefits & Coverage** | Plan details, covered services, formulary, accumulator (deductible/OOP) |
| **Digital ID Card** | Virtual member ID with QR code for provider scanning |
| **Claims & EOB** | Claim list with status (submitted → adjudicated → paid/denied), EOB detail, denial reason, appeal action |
| **Find a Provider** | Provider search by specialty/location/network, quality ratings, accepting-new-patients filter |
| **Cost Estimator** | Out-of-pocket estimate for planned procedures using benefits + network pricing |
| **Messages / Inbox** | Secure messaging with care team, PA notifications, EOB alerts |
| **Profile & Preferences** | Contact info, communication preferences, language, authorized representatives |

**BFF Endpoints**:

```
GET    /api/member/dashboard          → aggregates benefits, claims, PAs, care gaps
GET    /api/member/benefits           → eligibility + coverage detail
GET    /api/member/id-card            → digital ID card data
GET    /api/member/claims             → claim list with status
GET    /api/member/claims/:id         → claim detail + EOB
POST   /api/member/claims/:id/appeal  → initiate appeal
GET    /api/member/providers          → provider directory search
GET    /api/member/cost-estimate      → cost estimator
GET    /api/member/notifications      → notification feed
PUT    /api/member/preferences        → update preferences
```

**SDK Hooks** (`@dxp/sdk-react`):

```ts
useMemberDashboard()
useBenefits(memberId)
useClaims(filters)
useClaimDetail(claimId)
useProviderSearch(query)
useCostEstimate(procedureCode, providerId)
useNotifications()
useMemberPreferences()
```

**UI Components** (`@dxp/ui`):

- `<BenefitsSummaryCard />` — plan name, deductible/OOP progress bars
- `<ClaimStatusTimeline />` — visual claim lifecycle (submitted → processing → decision)
- `<DigitalIdCard />` — member/group/plan IDs with QR
- `<ProviderSearchResults />` — card list with ratings, distance, network badge
- `<CostEstimateBreakdown />` — procedure cost, plan pays, member pays
- `<CareGapAlert />` — actionable alert for overdue screenings
- `<EOBDetail />` — service line breakdown, amounts, denial codes

**Non-Functional**:
- WCAG 2.1 AA, ADA compliant
- Multilingual (EN, ES minimum)
- Push notification support (FCM/APNS)
- Target: reduce call center volume by 30%+ (68% of calls are self-serviceable)

---

### UC-2: Care Coordination & Event-Driven Interoperability

**Goal**: Real-time clinical event notification (ADT) triggering automated care transitions.

**Pages / Views**:

| Page | Key Functions |
|------|---------------|
| **Care Timeline** | Member-facing chronological view of care events, admissions, discharges, follow-ups |
| **My Care Team** | Assigned PCP, specialists, care manager with contact options |
| **Post-Discharge Checklist** | Next steps after hospital discharge (meds, follow-up appts, instructions) |

**BFF Endpoints**:

```
GET    /api/member/care-timeline         → care events chronologically
GET    /api/member/care-team             → assigned providers + care manager
GET    /api/member/discharge-plan/:id    → post-discharge checklist
POST   /api/care/adt-webhook             → inbound ADT (HL7/FHIR) webhook
POST   /api/care/notify-team             → trigger care team notification
```

**Integration Adapters**:
- `integration` module: HL7v2 ADT feed ingestion (A01/A03/A04)
- `integration` module: FHIR R4 Encounter subscription
- `workflow` module: discharge → care team notification → follow-up scheduling (automated)
- `notifications` module: push/SMS to member + care manager

---

### UC-3: Long-Term Follow-Up (LTFU)

**Goal**: Automated chronic condition management workflows between provider visits.

**Pages / Views**:

| Page | Key Functions |
|------|---------------|
| **My Health Programs** | Enrolled programs (diabetes mgmt, CHF, COPD, BH), progress tracking |
| **Health Checklist** | Upcoming screenings, medication refills, lab orders |
| **Outreach Preferences** | Preferred contact channel (SMS, app push, phone), frequency |

**BFF Endpoints**:

```
GET    /api/member/programs              → enrolled LTFU programs
GET    /api/member/programs/:id          → program detail + milestones
GET    /api/member/health-checklist      → upcoming actions
PUT    /api/member/outreach-preferences  → channel + frequency
```

**Workflow Triggers** (via `workflow` module):
- Discharge event → enroll in condition-specific LTFU program
- Missed milestone → escalation to care manager
- Automated SMS/push at configured intervals

---

### UC-4: Population Health & Risk Stratification

**Goal**: Risk scoring and care gap dashboards for care managers (internal portal).

**Pages / Views** (Care Manager / Internal):

| Page | Key Functions |
|------|---------------|
| **Population Dashboard** | Risk distribution, segment counts, trending metrics |
| **Risk Worklist** | Prioritized member list sorted by risk score + open gaps |
| **Member Risk Profile** | Individual risk score breakdown (claims, clinical, SDOH) |
| **Care Gap Tracker** | HEDIS/Stars gaps by member with closure status |

**BFF Endpoints**:

```
GET    /api/population/dashboard         → aggregate risk metrics
GET    /api/population/worklist          → prioritized member list
GET    /api/population/member/:id/risk   → individual risk breakdown
GET    /api/population/care-gaps         → gaps list with filters
POST   /api/population/care-gaps/:id/close → mark gap as closed
```

**SDK Hooks**:

```ts
usePopulationDashboard(filters)
useRiskWorklist(pagination, sortBy)
useMemberRiskProfile(memberId)
useCareGaps(filters)
```

**Data Sources** (via adapters):
- Claims data → `claims` module
- Clinical data → `integration` module (FHIR)
- SDOH data → `integration` module (community resource APIs)
- Risk model → `risk-stratification` module

---

### UC-5: Prior Authorization Modernization

**Goal**: End-to-end FHIR-based PA workflow: CRD → DTR → PAS.

**Pages / Views**:

| Page | Role | Key Functions |
|------|------|---------------|
| **PA Status Tracker** | Member | View active PAs, status, timeline, decision |
| **PA Submission** | Provider | Submit PA request, attach clinical docs |
| **PA Review Queue** | Internal | Review pending PAs, approve/deny/pend |
| **PA Dashboard** | Internal | Automation rate, turnaround times, volume |

**BFF Endpoints**:

```
# Member-facing
GET    /api/member/prior-auths                → list member's PAs
GET    /api/member/prior-auths/:id            → PA detail + status timeline

# Provider-facing
POST   /api/provider/prior-auth/check         → CRD: is PA required?
POST   /api/provider/prior-auth/submit        → PAS: submit PA request
GET    /api/provider/prior-auth/template/:code → DTR: get doc template
POST   /api/provider/prior-auth/docs           → upload clinical docs

# Internal
GET    /api/internal/prior-auth/queue          → review queue
PUT    /api/internal/prior-auth/:id/decide     → approve/deny/pend
GET    /api/internal/prior-auth/dashboard      → metrics
```

**Prior Auth Adapter** (`prior-auth` module):

```
Port: PriorAuthPort
  - checkRequirement(serviceCode, memberId) → CRD response
  - getDocTemplate(serviceCode) → DTR template
  - submitRequest(paRequest) → PAS submission
  - getStatus(paId) → status + decision
  - decide(paId, decision, rationale) → finalize

Adapters:
  - DaVinciPASAdapter (FHIR — production)
  - ManualPAAdapter (legacy fallback)

Env: PRIOR_AUTH_ADAPTER=davinci-pas
```

**Compliance**:
- CMS mandate: 72hr urgent / 7-day standard SLA
- Full audit trail on every PA decision
- FHIR R4 Prior Auth API by January 2027

---

### UC-6: Claims Intake & Adjudication

**Goal**: Streamlined claims with real-time status and transparent EOBs.

**Pages / Views**:

| Page | Role | Key Functions |
|------|------|---------------|
| **Claims List** | Member | Status tracking, filter by date/status/type |
| **Claim Detail / EOB** | Member | Service lines, amounts, denial codes, appeal button |
| **Appeal Submission** | Member | Guided appeal form, document upload, tracking |
| **Claims Dashboard** | Internal | Volume, denial rate, turnaround, auto-adjudication rate |

**BFF Endpoints**:

```
GET    /api/member/claims                     → paginated claim list
GET    /api/member/claims/:id                 → claim + EOB detail
POST   /api/member/claims/:id/appeal          → submit appeal
POST   /api/member/claims/:id/appeal/docs     → upload appeal docs
GET    /api/claims/status/:claimId            → real-time status (FHIR)
POST   /api/claims/ingest                     → X12 837 claim intake
GET    /api/internal/claims/dashboard         → metrics
```

**Claims Adapter** (`claims` module):

```
Port: ClaimsPort
  - ingest(x12Payload) → claim created
  - getStatus(claimId) → adjudication status
  - getEOB(claimId) → explanation of benefits
  - submitAppeal(claimId, appealData) → appeal created

Adapters:
  - X12EDIAdapter (X12 837/835)
  - FHIRClaimAdapter (FHIR ExplanationOfBenefit)

Env: CLAIMS_ADAPTER=x12-edi
```

**UI Components**:
- `<ClaimStatusTimeline />` — submitted → pre-adjudication → adjudicated → paid/denied
- `<EOBServiceLineTable />` — procedure, billed, allowed, plan paid, member owes
- `<AppealWizard />` — multi-step form: reason → docs → review → submit
- `<DenialReasonExplainer />` — plain-language denial explanation + next steps

---

### UC-7: Provider Data Normalization

**Goal**: Unified provider MDM with real-time validation and FHIR directory.

**Pages / Views**:

| Page | Role | Key Functions |
|------|------|---------------|
| **Provider Search** | Member | Search by specialty, location, network, accepting patients |
| **Provider Profile** | Member | Credentials, ratings, locations, network status |
| **Provider Directory Admin** | Internal | Data quality dashboard, ingestion status, anomaly alerts |

**BFF Endpoints**:

```
GET    /api/providers/search                → search with filters
GET    /api/providers/:npi                  → provider detail
GET    /api/providers/:npi/validate         → real-time network validation
GET    /api/internal/providers/quality      → data quality metrics
POST   /api/internal/providers/ingest       → trigger ingestion from source
```

**Provider Directory Adapter** (`provider-directory` module):

```
Port: ProviderDirPort
  - search(query) → provider list
  - getByNPI(npi) → provider detail
  - validate(npi) → network status + credentialing
  - ingest(source) → bulk load from NPPES, state feeds, EHRs

Adapters:
  - FHIRProviderAdapter (FHIR PractitionerRole / Organization)
  - NPPESAdapter (NPI registry)

Env: PROVIDER_DIR_ADAPTER=fhir-provider
```

---

### UC-8: Risk Adjustment & HCC Recapture

**Goal**: AI-driven HCC gap identification with audit-ready capture workflows.

**Pages / Views** (Internal):

| Page | Key Functions |
|------|---------------|
| **HCC Dashboard** | Recapture rate, revenue impact, open gaps by condition category |
| **Member HCC Profile** | Documented vs. suspected HCCs, evidence, chart review status |
| **Chart Review Queue** | Prioritized charts for coder/provider review |

**BFF Endpoints**:

```
GET    /api/internal/hcc/dashboard           → aggregate metrics
GET    /api/internal/hcc/member/:id          → member HCC gaps
GET    /api/internal/hcc/review-queue        → prioritized chart queue
PUT    /api/internal/hcc/:gapId/capture      → mark HCC as captured + evidence
```

---

### UC-9: Utilization Management

**Goal**: Predictive analytics dashboards for proactive cost management.

**Pages / Views** (Internal):

| Page | Key Functions |
|------|---------------|
| **Utilization Dashboard** | ED, inpatient, specialty trends by geography/cohort |
| **Anomaly Alerts** | Real-time triggers when utilization deviates from baseline |
| **Benchmarking** | NCQA/CMS norms comparison, peer plan benchmarks |

**BFF Endpoints**:

```
GET    /api/internal/utilization/dashboard    → trend data with filters
GET    /api/internal/utilization/anomalies    → active anomaly alerts
GET    /api/internal/utilization/benchmarks   → peer comparisons
```

---

### UC-10: Contract & Payer Analytics

**Goal**: VBC contract performance tracking and network optimization.

**Pages / Views** (Internal / Executive):

| Page | Key Functions |
|------|---------------|
| **Contract Performance** | Scorecards by provider: cost, quality, utilization |
| **VBC Tracking** | Gainshare calculations, shared savings, contract terms |
| **Network Analysis** | Corridor analysis, high-cost/low-quality referral patterns |
| **Scenario Modeling** | Contract redesign simulations |

**BFF Endpoints**:

```
GET    /api/internal/contracts/scorecards     → provider performance
GET    /api/internal/contracts/vbc/:id        → VBC detail + savings
GET    /api/internal/contracts/network        → corridor analysis
POST   /api/internal/contracts/simulate       → scenario modeling
```

---

### UC-11: Quality Reporting Automation

**Goal**: Automated HEDIS/Stars calculation with near-real-time gap closure.

**Pages / Views** (Internal):

| Page | Key Functions |
|------|---------------|
| **Quality Dashboard** | HEDIS measures, Stars ratings, year-over-year trends |
| **Care Gap Worklist** | Members with open gaps, outreach status, closure tracking |
| **Submission Tracker** | CMS submission status, data lineage, audit readiness |

**BFF Endpoints**:

```
GET    /api/internal/quality/dashboard        → measures + Stars
GET    /api/internal/quality/care-gaps        → gap worklist
POST   /api/internal/quality/outreach/:id     → trigger outreach
GET    /api/internal/quality/submissions      → CMS submission tracker
```

**Quality Measures Adapter** (`quality-measures` module):

```
Port: QualityMeasuresPort
  - getMeasures(filters) → HEDIS/Stars measures
  - getCareGaps(memberId?) → open gaps
  - triggerOutreach(gapId, channel) → automated outreach
  - getSubmissionStatus() → CMS submission readiness

Adapters:
  - HEDISEngineAdapter (HEDIS calculation engine)
  - StarsAPIAdapter (CMS Stars submission)

Env: QUALITY_ADAPTER=hedis-engine
```

---

## 4. `@dxp/ui` Component Usage Guide

> The component library may have grown since this spec was written. Always check
> `packages/ui/src/index.ts` for the latest exports. Use everything available.

Below maps **known** components to portal pages. This is a starting point — not exhaustive.

### Primitives

| Component | Portal Usage |
|-----------|-------------|
| `Button` | All CTAs, form submits, approve/deny actions |
| `Input` | Search fields, form inputs, filters |
| `Select` | Dropdowns (plan type, specialty, status filters) |
| `Badge` | Status labels (claim status, PA decision, network tier) |
| `Card` | Content containers throughout all pages |
| `Tabs` | Dashboard sections, claim detail views, provider profile tabs |
| `Slider` | Cost estimator ranges, date range selectors |

### Composed → Page Mapping

| Component | Portal Pages |
|-----------|-------------|
| `PageLayout` | All pages — consistent nav, header, sidebar |
| `DashboardCard` | Member Dashboard (benefits summary, claims snapshot, care gaps) |
| `DataTable` | Claims list, PA list, provider search results, worklists, care gaps |
| `FilterBar` | Claims filters, provider search, PA queue, utilization dashboards |
| `StatusBadge` | Claim status, PA decision, program enrollment status |
| `DetailPanel` | Claim/EOB detail, PA detail, provider profile, member risk profile |
| `StepIndicator` | Claim lifecycle (submitted→processing→decided), PA workflow (CRD→DTR→PAS) |
| `ProgressTracker` | Deductible/OOP accumulator, LTFU program milestones, HEDIS gap closure |
| `MultiStepForm` | Appeal submission, PA request (provider portal), enrollment |
| `ApprovalCard` | PA review queue (approve/deny/pend), appeal review |
| `NotificationInbox` | Messages page — care gap alerts, PA decisions, EOB availability |
| `FileUploadZone` | Appeal doc upload, PA clinical doc attachment |
| `DocumentCard` | EOB documents, PA attachments, care plan documents |
| `Chart` | Utilization dashboards, population health trends, quality metrics, contract analytics |
| `StatsDisplay` | Dashboard KPI tiles (open claims, pending PAs, care gaps count) |
| `QuestionFlow` | DTR questionnaire (prior auth documentation), health risk assessments |
| `DynamicForm` | Provider PA submission, appeal forms, member profile edit |
| `FormField` | All form contexts |
| `OptionList` | Plan comparison, provider selection, care program enrollment |
| `PlanView` | Benefits detail, care plan milestones, LTFU program view |
| `PreferencesPanel` | Member settings (communication channel, language, notification prefs) |
| `OrderSummary` | Cost estimator breakdown (procedure cost, plan pays, member owes) |
| `ItemCarousel` | Care gap alerts on dashboard, recommended providers |
| `Citation` | Clinical evidence in HCC review, quality measure references |
| `LinkPreview` | External resources (drug info, provider website, CMS links) |
| `ImageGallery` | Provider facility photos (if available) |
| `FormDesigner` | Internal: build custom DTR questionnaire templates |

### SDK Hooks (Existing → Reuse)

| Existing Hook | Portal Usage |
|---------------|-------------|
| `useAuth()` | Member/provider SSO via Keycloak |
| `useCms()` | Benefits content, plan documents, FAQ |
| `useDocuments()` | EOB docs, PA attachments, appeal uploads |
| `useSearch()` | Provider directory search, formulary lookup |
| `useNotifications()` | Care gap alerts, PA decisions, claim status push |
| `useStorage()` | Clinical document storage (PA docs, appeal files) |

---

## 5. Portal Structure Summary

### Member Portal (public-facing)

```
/                          → Dashboard (personalized home)
/benefits                  → Benefits & Coverage
/id-card                   → Digital ID Card
/claims                    → Claims list
/claims/:id                → Claim detail / EOB
/claims/:id/appeal         → Appeal submission
/find-provider             → Provider search
/find-provider/:npi        → Provider profile
/cost-estimate             → Cost estimator
/prior-auth                → PA status list
/prior-auth/:id            → PA detail + timeline
/care-timeline             → Care events timeline
/care-team                 → My care team
/programs                  → Health programs (LTFU)
/programs/:id              → Program detail + checklist
/messages                  → Secure inbox
/settings                  → Profile & preferences
```

### Provider Portal

```
/provider/dashboard        → Provider home (PA queue, claims, eligibility)
/provider/prior-auth       → Submit / track PAs
/provider/eligibility      → Member eligibility lookup
/provider/claims           → Claims status
```

### Internal Portal (care managers, operations, executives)

```
/internal/population       → Population health dashboard
/internal/worklist         → Risk-prioritized member worklist
/internal/member/:id       → Member risk profile + HCC gaps
/internal/pa-queue         → PA review queue
/internal/pa-dashboard     → PA metrics
/internal/claims-dashboard → Claims metrics
/internal/providers        → Provider data quality
/internal/hcc              → HCC recapture dashboard
/internal/utilization      → Utilization management
/internal/contracts        → VBC contract analytics
/internal/quality          → Quality reporting (HEDIS/Stars)
```

---

## 5. Integration Architecture

### FHIR R4 Resources Used

| FHIR Resource | Use Case |
|---------------|----------|
| `Patient` | Member identity |
| `Coverage` | Eligibility & benefits |
| `Claim` / `ExplanationOfBenefit` | Claims & EOB |
| `ClaimResponse` | Adjudication result |
| `CoverageEligibilityRequest/Response` | Real-time eligibility |
| `Encounter` | ADT events, care timeline |
| `CarePlan` | LTFU programs |
| `PractitionerRole` / `Organization` | Provider directory |
| `Consent` | Member consent management |
| `MeasureReport` | Quality measures (HEDIS) |
| `ServiceRequest` | Prior authorization |

### EDI/HL7 Interfaces

| Standard | Transaction | Use |
|----------|-------------|-----|
| X12 837 | Claim submission | Claims intake |
| X12 835 | Remittance advice | Payment posting |
| X12 270/271 | Eligibility inquiry/response | Real-time eligibility |
| X12 278 | Prior auth request/response | PA (legacy) |
| HL7v2 ADT | A01/A03/A04 | Admission/discharge/transfer events |

### DaVinci FHIR Workflows (Prior Auth)

```
CRD (Coverage Requirements Discovery)
  EHR → POST /api/provider/prior-auth/check → payer FHIR endpoint
  Returns: PA required? + documentation requirements

DTR (Documentation Templates & Rules)
  EHR → GET /api/provider/prior-auth/template/:code → questionnaire
  Returns: pre-populated clinical data template

PAS (Prior Authorization Support)
  EHR → POST /api/provider/prior-auth/submit → payer decision engine
  Returns: approved / denied / pended + rationale
```

---

## 6. Env Var Configuration (DXP Pattern)

```env
# Auth
AUTH_PROVIDER=keycloak
KEYCLOAK_REALM=payer-portal
KEYCLOAK_CLIENT_ID=dfd-web

# Adapters — swap via env, zero code changes
CMS_ADAPTER=strapi
CLAIMS_ADAPTER=x12-edi
ELIGIBILITY_ADAPTER=fhir-coverage
PRIOR_AUTH_ADAPTER=davinci-pas
CARE_PLAN_ADAPTER=fhir-careplan
RISK_STRAT_ADAPTER=hcc-engine
PROVIDER_DIR_ADAPTER=fhir-provider
QUALITY_ADAPTER=hedis-engine
CONSENT_ADAPTER=fhir-consent
STORAGE_PROVIDER=s3
NOTIFICATION_PROVIDER=sns
SEARCH_PROVIDER=elasticsearch
ANALYTICS_PROVIDER=custom

# FHIR
FHIR_BASE_URL=https://fhir.payer.example.com/r4
FHIR_CLIENT_ID=dfd-bff
FHIR_AUTH_METHOD=smart-backend

# EDI
EDI_GATEWAY_URL=https://edi.payer.example.com
EDI_SENDER_ID=PAYERID
EDI_RECEIVER_ID=CLEARINGHOUSE

# HL7
HL7_ADT_LISTENER_PORT=2575
HL7_ADT_PROTOCOL=mllp
```

---

## 7. Key Metrics & KPIs

| Metric | Target | Source Use Case |
|--------|--------|-----------------|
| Portal adoption rate | >60% (from 30-40% baseline) | UC-1 |
| Call center volume reduction | 30%+ | UC-1 |
| PA automation rate | >82% via FHIR | UC-5 |
| PA turnaround (urgent) | <72 hours | UC-5 |
| PA turnaround (standard) | <7 days | UC-5 |
| Claim denial rate reduction | 20%+ | UC-6 |
| Hospital readmission reduction | 47% (via risk analytics) | UC-2, UC-4 |
| HEDIS gap closure rate | +18% screening completion | UC-11 |
| HCC recapture rate | Close 20% coding gap | UC-8 |
| Provider directory accuracy | >95% (from ~50%) | UC-7 |
| Cost per interaction | $0.10-0.25 digital vs. $6-8 call | UC-1 |

---

## 8. Compliance Requirements

| Regulation | Requirement | Portal Impact |
|------------|-------------|---------------|
| CMS Interoperability Rule | FHIR R4 APIs for claims, coverage, PA | All FHIR adapters |
| CMS Prior Auth Rule (Jan 2027) | Real-time PA via FHIR | UC-5 (CRD/DTR/PAS) |
| HIPAA | PHI protection, audit trail, BAA | Audit module, encryption, Keycloak |
| TEFCA | Trusted exchange framework | Integration module |
| WCAG 2.1 AA | Accessibility | All member-facing UI |
| ADA | Disability access | All member-facing UI |
| AES-256 | Data encryption at rest and in transit | Infrastructure layer |
| Zero-Trust IAM | Identity verification at every layer | Keycloak + Kong + BFF auth |

---

## 9. Starter Template

Create as `starters/payer-portal/` following the existing `insurance-portal` pattern:

```
starters/payer-portal/
  src/
    pages/
      Dashboard.tsx
      Benefits.tsx
      Claims.tsx
      ClaimDetail.tsx
      FindProvider.tsx
      ProviderProfile.tsx
      CostEstimate.tsx
      PriorAuth.tsx
      PriorAuthDetail.tsx
      CareTimeline.tsx
      CareTeam.tsx
      Programs.tsx
      Messages.tsx
      Settings.tsx
    components/          (page-specific compositions of @dxp/ui)
    layouts/
      MemberLayout.tsx
      ProviderLayout.tsx
      InternalLayout.tsx
```

---

## 10. Implementation Priority (Phased)

### Phase 1 — High-ROI Quick Wins (Weeks 1-6)
1. **UC-1: Member Engagement** — Dashboard, benefits, claims/EOB, digital ID
2. **UC-5: Prior Auth (member view)** — PA status tracker
3. **UC-6: Claims (member view)** — Claims list, EOB, appeal flow

### Phase 2 — Clinical Operations (Weeks 7-12)
4. **UC-5: Prior Auth (full CRD/DTR/PAS)** — Provider submission + internal review
5. **UC-7: Provider Directory** — Search, validation, FHIR endpoint
6. **UC-2: Care Coordination** — ADT integration, care timeline

### Phase 3 — Analytics & Population Health (Weeks 13-18)
7. **UC-4: Population Health** — Risk dashboards, worklists
8. **UC-3: LTFU** — Automated chronic care workflows
9. **UC-11: Quality Reporting** — HEDIS/Stars automation

### Phase 4 — Advanced Analytics (Weeks 19-24)
10. **UC-8: HCC Recapture** — AI-driven chart review
11. **UC-9: Utilization Management** — Predictive dashboards
12. **UC-10: Contract Analytics** — VBC tracking, scenario modeling

---

## 11. FHIR R4 Standard API Integration

### 11.1 Public FHIR Test / Sandbox Servers

Use these for development and adapter testing before connecting to payer production systems.

| Server | URL | Auth | Notes |
|--------|-----|------|-------|
| **HAPI FHIR** | `https://hapi.fhir.org/baseR4` | None | All R4 resources, regularly purged |
| **SMART Dev Sandbox** | `https://launch.smarthealthit.org` | SMART on FHIR | Full patient/provider data, OAuth flows |
| **Grahame's Test Server** | `http://test.fhir.org/r4` | None | HL7 official, all resources |
| **AEGIS WildFHIR** | `https://wildfhir4.wildfhir.org/fhir4-0-1` | None | All resources, batch/transaction |

### 11.2 CMS Production FHIR APIs

These are real CMS APIs the BFF will integrate with in production.

#### Blue Button 2.0 (Medicare Claims Data)

| Attribute | Details |
|-----------|---------|
| **Production** | `https://api.bluebutton.cms.gov/v2/fhir` |
| **Sandbox** | `https://sandbox.bluebutton.cms.gov/v2/fhir` |
| **Auth** | OAuth 2.0 (member-authorized) |
| **Resources** | `Patient`, `Coverage`, `ExplanationOfBenefit` |
| **Data** | 4 years historical Medicare Part A/B/D claims, 60M+ beneficiaries |
| **Refresh** | Weekly; CMS recommends daily polling |

**BFF Adapter Integration**:
```
Port: ClaimsPort
Adapter: BlueButtonAdapter
Env: CLAIMS_ADAPTER=blue-button

Endpoints consumed:
  GET /Patient/{id}
  GET /Coverage?beneficiary={id}
  GET /ExplanationOfBenefit?patient={id}
```

#### Data at the Point of Care (DPC)

| Attribute | Details |
|-----------|---------|
| **Sandbox** | `https://sandbox.dpc.cms.gov/api/v2` |
| **Production** | `https://dpc.cms.gov/api/v1` |
| **Auth** | OAuth 2.0 + API key |
| **Resources** | `Patient`, `Coverage`, `ExplanationOfBenefit`, `Encounter`, `Condition`, `MedicationStatement`, `Observation`, `Procedure` |
| **Use Case** | Provider-facing: clinical data at point of care |

**BFF Adapter Integration**:
```
Port: ClinicalDataPort (new)
Adapter: CMSDPCAdapter
Env: CLINICAL_DATA_ADAPTER=cms-dpc

Key operation:
  POST /Group/{id}/$davinci-data-export  → bulk clinical data export
```

#### Beneficiary Claims Data API (BCDA)

| Attribute | Details |
|-----------|---------|
| **Production** | `https://api.bcda.cms.gov/api/v2` |
| **Auth** | OAuth 2.0 (entity-level) |
| **Format** | Bulk FHIR (NDJSON) |
| **Resources** | `Patient`, `Coverage`, `ExplanationOfBenefit` |
| **Use Case** | ACO/DCE bulk claims export for risk adjustment, quality reporting |

**BFF Adapter Integration**:
```
Port: BulkDataPort (new)
Adapter: BCDAAdapter
Env: BULK_DATA_ADAPTER=bcda

Key operation:
  POST /Patient/$export → bulk NDJSON export (async polling)
```

#### CMS Provider Directory

| Attribute | Details |
|-----------|---------|
| **Standard** | Da Vinci PDex Plan Network IG |
| **Auth** | Public (no auth required) |
| **Resources** | `Practitioner`, `PractitionerRole`, `Organization`, `Location`, `HealthcareService`, `Endpoint` |
| **Update SLA** | Changes reflected within 30 calendar days |

**BFF Adapter Integration**:
```
Port: ProviderDirPort
Adapter: CMSProviderDirAdapter
Env: PROVIDER_DIR_ADAPTER=cms-provider-dir

Endpoints consumed:
  GET /Practitioner?name={name}
  GET /Practitioner?identifier={npi}
  GET /PractitionerRole?specialty={code}
  GET /Organization?name={name}
  GET /Location?address-postalcode={zip}
```

### 11.3 Standard FHIR R4 Endpoint Reference

Complete REST endpoint catalog used by BFF adapters.

#### Financial Resources

```
# Patient (Member Identity)
GET  [base]/Patient                               # search
GET  [base]/Patient/{id}                          # read
POST [base]/Patient/$member-match                 # cross-payer member lookup (HRex)

# Coverage (Eligibility & Benefits)
GET  [base]/Coverage?beneficiary={patient}        # coverage by member
GET  [base]/Coverage/{id}                         # specific coverage

# ExplanationOfBenefit (Claims / EOB)
GET  [base]/ExplanationOfBenefit?patient={id}     # claims by member
GET  [base]/ExplanationOfBenefit?date=ge{start}&date=le{end}  # by date range
GET  [base]/ExplanationOfBenefit/{id}             # specific EOB

# Claim (Submission)
POST [base]/Claim                                 # submit claim or PA request
GET  [base]/Claim/{id}                            # read claim

# ClaimResponse (Adjudication)
GET  [base]/ClaimResponse?request={claim-id}      # response for claim

# CoverageEligibilityRequest / Response
POST [base]/CoverageEligibilityRequest            # real-time eligibility check
GET  [base]/CoverageEligibilityResponse?request={id}  # eligibility result
```

#### Clinical Resources

```
# Encounter (ADT, Care Timeline)
GET  [base]/Encounter?patient={id}                # member encounters
GET  [base]/Encounter?date=ge{start}&type={code}  # by date + type

# Condition (Diagnoses, HCC)
GET  [base]/Condition?patient={id}                # member conditions
GET  [base]/Condition?clinical-status=active       # active only

# CarePlan (LTFU, Care Programs)
GET  [base]/CarePlan?patient={id}&status=active   # active care plans
POST [base]/CarePlan                               # create care plan

# ServiceRequest (Prior Auth, Referrals)
POST [base]/ServiceRequest                         # create PA request
GET  [base]/ServiceRequest?patient={id}&status={status}

# Observation (Labs, Vitals, SDOH)
GET  [base]/Observation?patient={id}&code={loinc}  # by LOINC code
GET  [base]/Observation?patient={id}&category=social-history  # SDOH

# Procedure
GET  [base]/Procedure?patient={id}&date=ge{start}
```

#### Provider Directory Resources

```
# Practitioner
GET  [base]/Practitioner?identifier={npi}         # by NPI
GET  [base]/Practitioner?name={name}              # by name

# PractitionerRole
GET  [base]/PractitionerRole?specialty={code}     # by specialty
GET  [base]/PractitionerRole?organization={id}    # by org
GET  [base]/PractitionerRole?location={id}        # by location

# Organization
GET  [base]/Organization?name={name}
GET  [base]/Organization?address={address}

# Location
GET  [base]/Location?address-postalcode={zip}
GET  [base]/Location?organization={org-id}

# HealthcareService
GET  [base]/HealthcareService?organization={id}
```

#### Quality & Compliance Resources

```
# MeasureReport (HEDIS, Stars)
POST [base]/Measure/$evaluate-measure             # generate measure report
GET  [base]/MeasureReport?patient={id}            # member reports
GET  [base]/MeasureReport?period=ge{start}&period=le{end}

# Consent
POST [base]/Consent                                # create consent
GET  [base]/Consent?patient={id}&status=active    # active consents

# Task (Async workflows)
POST [base]/Task                                   # create async task
GET  [base]/Task?focus={resource-ref}&status={status}
PUT  [base]/Task/{id}                              # update status
```

#### Common Search Modifiers

| Modifier | Example | Use |
|----------|---------|-----|
| `_include` | `?_include=ExplanationOfBenefit:patient` | Include referenced resources |
| `_revinclude` | `?_revinclude=Claim:patient` | Include reverse references |
| `_sort` | `?_sort=-date` | Sort (prefix `-` for descending) |
| `_count` | `?_count=50` | Page size |
| `_summary` | `?_summary=true` | Minimal response |
| `:exact` | `?name:exact=Smith` | Exact string match |
| `ge` / `le` | `?date=ge2025-01-01` | Date range operators |

### 11.4 SMART on FHIR Backend Services Auth

System-to-system auth flow used by BFF to call FHIR servers (no user in the loop).

```
┌─────────────┐                        ┌──────────────┐
│   DXP BFF   │                        │  FHIR Server │
│  (NestJS)   │                        │  (Payer/CMS) │
└──────┬──────┘                        └──────┬───────┘
       │                                      │
       │  1. Create JWT assertion              │
       │     iss = client_id                   │
       │     sub = client_id                   │
       │     aud = token_endpoint              │
       │     exp = now + 300s                  │
       │     sign with RS384 private key       │
       │                                      │
       │  2. POST /oauth2/token               │
       │     grant_type=client_credentials     │
       │     client_assertion_type=jwt-bearer  │
       │     client_assertion={jwt}            │
       │     scope=system/*.read               │
       ├─────────────────────────────────────►│
       │                                      │
       │  3. { access_token, expires_in }     │
       │◄─────────────────────────────────────┤
       │                                      │
       │  4. GET /fhir/Patient/{id}           │
       │     Authorization: Bearer {token}     │
       ├─────────────────────────────────────►│
       │                                      │
       │  5. FHIR Resource response           │
       │◄─────────────────────────────────────┤
```

**Scopes by use case**:

| Use Case | Scopes |
|----------|--------|
| Member data read | `system/Patient.read system/Coverage.read system/ExplanationOfBenefit.read` |
| Bulk data export | `system/Patient.read system/Group.read` |
| Prior auth submit | `system/Claim.write system/ClaimResponse.read` |
| Provider directory | `system/Practitioner.read system/Organization.read system/Location.read` |
| Care plan management | `system/CarePlan.read system/CarePlan.write` |

**Env config**:
```env
FHIR_AUTH_METHOD=smart-backend
FHIR_CLIENT_ID=dfd-bff
FHIR_TOKEN_ENDPOINT=https://auth.payer.example.com/oauth2/token
FHIR_PRIVATE_KEY_PATH=/secrets/fhir-key.pem
FHIR_KEY_ID=dfd-bff-key-001
```

---

## 12. Da Vinci Implementation Guides — Full Integration Map

The Da Vinci Project defines FHIR implementation guides (IGs) for payer interoperability. Each maps to a DXP BFF module.

### 12.1 Da Vinci IG → DXP Module Matrix

| Da Vinci IG | Version | DXP Module | Use Case | CMS Mandate? |
|-------------|---------|------------|----------|--------------|
| **PAS** (Prior Auth Support) | v2.1.0 | `prior-auth` | PA submission & decision via FHIR | Yes — Jan 2027 |
| **CRD** (Coverage Requirements Discovery) | v2.1.0 | `prior-auth` | Real-time PA requirement check | Yes — Jan 2027 |
| **DTR** (Documentation Templates & Rules) | v2.1.0 | `prior-auth` | Auto-populate PA clinical docs | Yes — Jan 2027 |
| **PDex** (Payer Data Exchange) | v2.1.0 | `integration` | Payer-to-payer clinical data exchange | Yes — CMS-0057 |
| **PDex Formulary** | v2.1.0 | `eligibility` | Drug formulary for plan comparison | Yes |
| **PDex Plan Net** | v1.2.0 | `provider-directory` | Provider/pharmacy network publishing | Yes |
| **HRex** (Health Record Exchange) | v1.1.0 | `identity` | `$member-match` cross-payer ID resolution | Yes — CMS-0057 |
| **CDex** (Clinical Data Exchange) | v2.1.0 | `integration` | Provider→payer clinical data (attachments) | Yes |
| **ATR** (Member Attribution) | v2.1.0 | `risk-stratification` | Member attribution lists for VBC | No (VBC enabler) |
| **Risk Adjustment** | v2.1.0 | `risk-stratification` | HCC coding gap reports | No (revenue enabler) |
| **PCDE** (Payer Coverage Decision Exchange) | v1.0.0 | `care-plan` | Coverage transition when member changes plan | Yes — CMS-0057 |

### 12.2 PAS — Prior Authorization Support (Detailed)

**IG**: `http://hl7.org/fhir/us/davinci-pas/`
**Reference Implementation**: `https://github.com/HL7-DaVinci/prior-auth`
**Inferno Test Kit**: `https://inferno.healthit.gov/test-kits/davinci-pas/`

**FHIR Resources**:
- `Claim` (PA request — profiled as PAS Claim)
- `ClaimResponse` (PA decision)
- `Task` (async PA tracking)
- `Condition`, `ServiceRequest` (supporting clinical data)

**BFF Integration**:

```typescript
// apps/bff/src/modules/prior-auth/adapters/davinci-pas.adapter.ts

@Injectable()
export class DaVinciPASAdapter extends PriorAuthPort {

  // CRD: Check if PA is required (CDS Hooks)
  async checkRequirement(serviceCode: string, memberId: string): Promise<CRDResponse> {
    // POST to payer CDS Hook endpoint
    // Hook: order-select or order-sign
    // Returns: cards with PA requirement info
  }

  // DTR: Get documentation template
  async getDocTemplate(serviceCode: string): Promise<fhir4.Questionnaire> {
    // GET [base]/Questionnaire?context={serviceCode}
    // Returns: FHIR Questionnaire with CQL auto-population rules
  }

  // DTR: Submit populated questionnaire
  async submitDocumentation(response: fhir4.QuestionnaireResponse): Promise<void> {
    // POST [base]/QuestionnaireResponse
  }

  // PAS: Submit PA request
  async submitRequest(paRequest: PASClaimBundle): Promise<fhir4.ClaimResponse> {
    // POST [base]/Claim/$submit
    // Bundle contains: Claim + supporting Condition/ServiceRequest
    // Returns: ClaimResponse with decision (approved/denied/pended)
  }

  // PAS: Check PA status (async/pended)
  async getStatus(paId: string): Promise<PAStatus> {
    // GET [base]/ClaimResponse?request=Claim/{paId}
    // Or poll via Task resource for async decisions
  }

  // PAS: Update/cancel PA
  async updateRequest(paId: string, update: Partial<PASClaim>): Promise<fhir4.ClaimResponse> {
    // PUT [base]/Claim/{paId}
  }
}
```

**CDS Hooks Integration** (CRD):

```
POST https://payer.example.com/cds-services/pa-check

{
  "hookInstance": "uuid",
  "hook": "order-sign",
  "context": {
    "userId": "Practitioner/123",
    "patientId": "Patient/456",
    "draftOrders": {
      "resourceType": "Bundle",
      "entry": [
        { "resource": { "resourceType": "ServiceRequest", "code": {...} } }
      ]
    }
  },
  "prefetch": {
    "patient": { "resourceType": "Patient", ... },
    "coverage": { "resourceType": "Coverage", ... }
  }
}

Response:
{
  "cards": [
    {
      "summary": "Prior authorization required for MRI Lumbar Spine",
      "indicator": "warning",
      "source": { "label": "Payer PA Engine" },
      "suggestions": [
        {
          "label": "Launch DTR Questionnaire",
          "actions": [{ "type": "create", "resource": { "resourceType": "Task" } }]
        }
      ],
      "links": [
        { "label": "Complete PA Documentation", "url": "https://...", "type": "smart" }
      ]
    }
  ]
}
```

### 12.3 PDex — Payer Data Exchange

**IG**: `http://hl7.org/fhir/us/davinci-pdex/`
**Purpose**: When a member switches plans, the new payer can request clinical data from the old payer.

**Key Operations**:

```
# Member match (find member at old payer)
POST [old-payer]/Patient/$member-match
Body: Parameters { MemberPatient, CoverageToMatch, CoverageToLink }
Returns: Patient reference at old payer

# Retrieve member data from old payer
GET [old-payer]/ExplanationOfBenefit?patient={matched-patient}
GET [old-payer]/Condition?patient={matched-patient}
GET [old-payer]/Encounter?patient={matched-patient}
GET [old-payer]/MedicationRequest?patient={matched-patient}

# Or use $everything operation
GET [old-payer]/Patient/{id}/$everything
```

**BFF Integration**:
```
Port: PayerDataExchangePort (new)
Adapter: PDexAdapter
Env: PAYER_EXCHANGE_ADAPTER=pdex

Methods:
  - memberMatch(demographics, oldCoverage) → matched Patient reference
  - fetchMemberData(patientRef, oldPayerUrl) → clinical data bundle
  - publishMemberData(patientId) → expose data for requesting payers
```

### 12.4 CDex — Clinical Data Exchange

**IG**: `http://hl7.org/fhir/us/davinci-cdex/`
**Purpose**: Payer requests clinical data from providers (replaces fax-based attachments).

**Exchange Methods**:

| Method | Flow | Use Case |
|--------|------|----------|
| **Direct Query** | Payer → `GET [provider]/Condition?patient={id}` | Simple data pull |
| **Task-Based** | Payer → `POST [provider]/Task` → provider fulfills async | Complex requests needing human review |
| **Attachments** | Provider → `POST [payer]/$submit-attachment` | Claims/PA supporting docs |

**BFF Integration**:
```
Port: ClinicalDataExchangePort (new)
Adapter: CDexAdapter
Env: CLINICAL_EXCHANGE_ADAPTER=cdex

Methods:
  - queryProviderData(providerUrl, patientId, resources[]) → clinical bundle
  - createDataRequest(taskSpec) → Task (async request to provider)
  - receiveAttachment(attachmentBundle) → process incoming docs
```

### 12.5 ATR — Member Attribution

**IG**: `http://hl7.org/fhir/us/davinci-atr/`
**Purpose**: Exchange member attribution lists for value-based contracts.

**Key Operations**:

```
# Create attribution list
POST [base]/Group
Body: { resourceType: "Group", type: "person", member: [...] }

# Bulk export attributed members
POST [base]/Group/{id}/$davinci-data-export
  _type=Patient,Coverage,ExplanationOfBenefit
  _since=2025-01-01

# Poll for export completion
GET [polling-url]
Returns: { output: [{ type: "Patient", url: "https://.../ndjson" }] }
```

**BFF Integration**:
```
Port: AttributionPort (new — extends RiskStratPort)
Adapter: DaVinciATRAdapter
Env: ATTRIBUTION_ADAPTER=davinci-atr

Methods:
  - getAttributionList(groupId) → member list
  - exportAttributedData(groupId, since?) → bulk NDJSON files
  - reconcileAttribution(groupId, changes) → updated list
```

### 12.6 Risk Adjustment IG

**IG**: `https://build.fhir.org/ig/HL7/davinci-ra/`
**Purpose**: Standardize HCC coding gap reporting between payers and providers.

**Key Operations**:

```
# Generate risk adjustment coding gap report
POST [base]/Measure/$evaluate-measure
Body: Parameters {
  subject: "Patient/123",
  periodStart: "2025-01-01",
  periodEnd: "2025-12-31",
  measure: "Measure/risk-adjustment-model"
}

# Returns: MeasureReport with:
#   - Documented HCC codes
#   - Suspected (gap) HCC codes
#   - Evidence references (Condition, Encounter)
#   - Confidence scores
```

**BFF Integration**:
```
Port: RiskStratPort (extended)
Adapter: DaVinciRiskAdjAdapter
Env: RISK_STRAT_ADAPTER=davinci-ra

Methods:
  - generateCodingGapReport(patientId, period) → MeasureReport
  - getCodingGaps(filters) → gap list with severity + evidence
  - submitGapClosure(gapId, evidence) → mark gap as captured
```

### 12.7 PDex Formulary

**IG**: `http://hl7.org/fhir/us/davinci-drug-formulary/`
**Purpose**: Publish drug formulary data for plan comparison during enrollment.

**Key Resources**:

```
# Search formulary drugs
GET [base]/MedicationKnowledge?code={rxnorm}
GET [base]/MedicationKnowledge?doseform={code}

# Get formulary item (tier, cost, PA required)
GET [base]/Basic?code=formulary-item&formulary={plan-id}

# Get insurance plan details
GET [base]/InsurancePlan?type=drug&coverage-area={location}
```

**BFF Integration**:
```
Port: FormularyPort (new)
Adapter: PDexFormularyAdapter
Env: FORMULARY_ADAPTER=pdex-formulary

Methods:
  - searchDrugs(query, planId) → drug list with tier/cost
  - getDrugDetail(rxnorm, planId) → formulary item (copay, PA required, step therapy)
  - comparePlans(drugList, planIds[]) → cost comparison across plans
```

### 12.8 PCDE — Payer Coverage Decision Exchange

**IG**: `http://hl7.org/fhir/us/davinci-pcde/`
**Purpose**: When a member switches plans, share active treatment/coverage decisions so care isn't disrupted.

**BFF Integration**:
```
Port: CoverageDecisionPort (new)
Adapter: PCDEAdapter
Env: COVERAGE_DECISION_ADAPTER=pcde

Methods:
  - requestCoverageDecisions(matchedPatient, oldPayerUrl) → active treatments
  - publishCoverageDecisions(patientId) → expose for requesting payers
```

---

## 13. Domain-Specific Integration APIs

Beyond FHIR/DaVinci, payer portals integrate with healthcare-specific external systems.

### 13.1 NPPES (National Provider Registry)

| Attribute | Details |
|-----------|---------|
| **API** | `https://npiregistry.cms.hhs.gov/api/?version=2.1` |
| **Auth** | None (public) |
| **Format** | JSON |
| **Use** | NPI lookup, provider validation, credential verification |

```
GET https://npiregistry.cms.hhs.gov/api/?version=2.1&number={npi}
GET https://npiregistry.cms.hhs.gov/api/?version=2.1&first_name={first}&last_name={last}&state={st}
```

**BFF Adapter**: `NPPESAdapter` in `provider-directory` module.

### 13.2 RxNorm (Drug Terminology)

| Attribute | Details |
|-----------|---------|
| **API** | `https://rxnav.nlm.nih.gov/REST/` |
| **Auth** | None (public) |
| **Use** | Drug name normalization, NDC→RxCUI mapping, interaction checks |

```
GET /REST/rxcui.json?name={drug-name}              # lookup by name
GET /REST/rxcui/{rxcui}/related.json?tty=SBD+SCD   # related drugs
GET /REST/interaction/list.json?rxcuis={rxcui1}+{rxcui2}  # interactions
GET /REST/ndcstatus.json?ndc={ndc}                  # NDC status
```

**BFF Adapter**: Used by `FormularyPort` and cost estimator.

### 13.3 ICD-10 / SNOMED CT Terminology

| API | URL | Use |
|-----|-----|-----|
| **FHIR Terminology Server** | `https://tx.fhir.org/r4` | Code system lookups, value set expansion |
| **NLM VSAC** | `https://vsac.nlm.nih.gov/vsac/` | Value set authority (requires UMLS login) |

```
# Validate ICD-10 code
GET https://tx.fhir.org/r4/CodeSystem/$validate-code?system=http://hl7.org/fhir/sid/icd-10-cm&code={code}

# Expand value set (e.g., diabetes diagnoses)
GET https://tx.fhir.org/r4/ValueSet/$expand?url={valueset-url}

# SNOMED concept lookup
GET https://tx.fhir.org/r4/CodeSystem/$lookup?system=http://snomed.info/sct&code={code}
```

**BFF Adapter**: Used by `claims`, `risk-stratification`, and `quality-measures` modules for code validation.

### 13.4 HEDIS / NCQA Quality Measures

| Attribute | Details |
|-----------|---------|
| **Standard** | NCQA HEDIS (Healthcare Effectiveness Data and Information Set) |
| **FHIR** | eCQM (electronic Clinical Quality Measures) via FHIR `Measure` + `MeasureReport` |
| **CQL** | Clinical Quality Language for measure logic |
| **Repository** | `https://ecqi.healthit.gov/ecqm` |

```
# Evaluate HEDIS measure
POST [base]/Measure/$evaluate-measure
  periodStart=2025-01-01
  periodEnd=2025-12-31
  subject=Patient/{id}
  measure=Measure/CMS125  # Breast Cancer Screening

# Bulk evaluation for population
POST [base]/Measure/$evaluate-measure
  subject=Group/{population-id}
  reportType=subject-list
```

### 13.5 X12 EDI Transactions

| Transaction | Code | Direction | Use |
|-------------|------|-----------|-----|
| **Eligibility Inquiry** | 270 | BFF → Payer | Real-time eligibility check |
| **Eligibility Response** | 271 | Payer → BFF | Coverage/benefit details |
| **Claim Submission** | 837P/837I | Provider → BFF | Professional/institutional claims |
| **Claim Payment** | 835 | BFF → Provider | Remittance advice |
| **PA Request** | 278 | Provider → BFF | Prior auth (legacy, pre-PAS) |
| **PA Response** | 278R | BFF → Provider | PA decision |
| **Claim Status Inquiry** | 276 | Provider → BFF | Where's my claim? |
| **Claim Status Response** | 277 | BFF → Provider | Claim status update |

**BFF Integration**: `X12EDIAdapter` in `claims` and `eligibility` modules. Use clearinghouse gateway (e.g., Change Healthcare, Availity) or direct payer connection.

### 13.6 HL7v2 ADT Messages

| Message Type | Event | Trigger |
|-------------|-------|---------|
| **ADT^A01** | Admit | Patient admitted to inpatient |
| **ADT^A02** | Transfer | Patient transferred between units |
| **ADT^A03** | Discharge | Patient discharged |
| **ADT^A04** | Register | Outpatient/ED registration |
| **ADT^A08** | Update | Patient info updated |

**BFF Integration**: `integration` module listens on MLLP (port 2575) or receives via FHIR Subscription. Triggers `workflow` module for care coordination.

### 13.7 CDS Hooks (Clinical Decision Support)

| Hook | Trigger | DXP Use |
|------|---------|---------|
| `order-select` | Provider selects an order | CRD: check if PA required |
| `order-sign` | Provider signs/submits order | CRD: final PA check before submit |
| `appointment-book` | Appointment scheduled | Care gap reminder |
| `encounter-start` | Visit begins | Surface open care gaps, risk alerts |
| `encounter-discharge` | Patient discharged | Trigger LTFU workflows |

**BFF exposes CDS Hooks service**:
```
GET  /cds-services                     → discovery endpoint (lists available hooks)
POST /cds-services/pa-check            → CRD hook handler
POST /cds-services/care-gap-alert      → care gap hook handler
```

---

## 14. Mock Data & Local Development

### 14.1 Architecture for Local Dev

```
┌────────────────────────────────────────────────────────┐
│  Local Development Stack                                │
├────────────────────────────────────────────────────────┤
│                                                         │
│  React App (payer-portal)  ──► BFF (NestJS)            │
│        :4200                      :3000                 │
│                                    │                    │
│                    ┌───────────────┼───────────────┐   │
│                    ▼               ▼               ▼   │
│              HAPI FHIR       PostgreSQL         Redis  │
│               :8070            :5432             :6379  │
│           (mock FHIR)       (BFF state)        (cache) │
│                │                                        │
│                ▼                                        │
│         Synthea Data                                    │
│      + Custom Generators                                │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### 14.2 HAPI FHIR Server (Docker)

Add to the DXP docker-compose:

```yaml
# infra/docker-compose.fhir.yml
services:
  hapi-fhir:
    image: hapiproject/hapi:latest
    container_name: dxp-hapi-fhir
    environment:
      spring.datasource.url: jdbc:postgresql://postgres:5432/hapi_fhir
      spring.datasource.username: ${POSTGRES_USER:-postgres}
      spring.datasource.password: ${POSTGRES_PASSWORD:-postgres}
      spring.datasource.driverClassName: org.postgresql.Driver
      spring.jpa.database-platform: org.hibernate.dialect.PostgreSQL10Dialect
      hapi.fhir.fhir_version: R4
      hapi.fhir.cors.allow_credentials: "true"
      hapi.fhir.cors.allowed_origins: "*"
      hapi.fhir.subscription.resthook_enabled: "true"
    ports:
      - "8070:8080"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/fhir/metadata"]
      interval: 10s
      timeout: 5s
      retries: 5
    depends_on:
      - postgres
```

**Verify**: `curl http://localhost:8070/fhir/metadata` returns CapabilityStatement.

### 14.3 Synthea — Synthetic Patient Generator

Generates realistic patient populations with clinical histories.

```bash
# Install (requires Java 11+)
git clone https://github.com/synthetichealth/synthea.git /tmp/synthea
cd /tmp/synthea

# Generate 500 patients in Massachusetts
./run_synthea -p 500 Massachusetts --exporter.fhir.export true

# Output: output/fhir/*.json (one FHIR Bundle per patient)
# Contains: Patient, Encounter, Condition, Observation, Procedure,
#           MedicationRequest, Immunization, DiagnosticReport, CarePlan
```

**Synthea generates** (relevant to payer portal):
- Patient demographics, addresses, contact info
- Encounters (inpatient, outpatient, ED, wellness)
- Conditions with ICD-10 codes (chronic diseases modeled realistically)
- Procedures with CPT/SNOMED codes
- Medications with RxNorm codes
- Lab results (Observations)
- Care plans

**Synthea does NOT generate** (must supplement):
- Coverage / eligibility records
- ExplanationOfBenefit / Claims (financial data)
- Prior authorization requests
- Provider directory (PractitionerRole / Organization)
- HEDIS MeasureReports
- ADT messages (HL7v2)
- HCC coding gaps

### 14.4 Custom Mock Data Generators

For data Synthea doesn't produce, create generators using `@faker-js/faker` + `@types/fhir`.

```bash
# Install dependencies
cd apps/bff
pnpm add -D @faker-js/faker @types/fhir fhir-kit-client
```

#### Seed Script Structure

```
apps/bff/src/seed/
  index.ts                  # orchestrator — runs all generators
  config.ts                 # population size, date ranges, plan options
  generators/
    patients.ts             # wraps Synthea output or generates standalone
    coverage.ts             # Coverage resources (plans, eligibility)
    claims-eob.ts           # Claim + ExplanationOfBenefit from encounters
    prior-auth.ts           # ServiceRequest + Claim (PA requests)
    providers.ts            # Practitioner, PractitionerRole, Organization, Location
    quality-measures.ts     # MeasureReport (HEDIS gaps)
    risk-adjustment.ts      # MeasureReport (HCC coding gaps)
    encounters-adt.ts       # Encounter resources + HL7v2 ADT messages
    care-plans.ts           # CarePlan (LTFU programs)
    consent.ts              # Consent resources
  loader.ts                 # POST bundles to HAPI FHIR server
```

#### Example: Coverage Generator

```typescript
// apps/bff/src/seed/generators/coverage.ts
import { faker } from '@faker-js/faker';
import type { Coverage } from 'fhir/r4';

const PLAN_OPTIONS = [
  { code: 'HMO', display: 'HMO Gold Plus', copay: 25, deductible: 1500 },
  { code: 'PPO', display: 'PPO Silver', copay: 40, deductible: 3000 },
  { code: 'HDHP', display: 'HDHP Bronze', copay: 0, deductible: 7000 },
  { code: 'MA', display: 'Medicare Advantage', copay: 15, deductible: 0 },
];

export function generateCoverage(patientId: string): Coverage {
  const plan = faker.helpers.arrayElement(PLAN_OPTIONS);
  return {
    resourceType: 'Coverage',
    id: faker.string.uuid(),
    status: 'active',
    type: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                  code: plan.code, display: plan.display }],
    },
    subscriber: { reference: `Patient/${patientId}` },
    beneficiary: { reference: `Patient/${patientId}` },
    relationship: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/subscriber-relationship',
                  code: 'self' }],
    },
    period: {
      start: `${new Date().getFullYear()}-01-01`,
      end: `${new Date().getFullYear()}-12-31`,
    },
    payor: [{ reference: 'Organization/payer-001', display: 'Example Health Plan' }],
    class: [
      { type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/coverage-class',
                            code: 'plan' }] },
        value: plan.code, name: plan.display },
      { type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/coverage-class',
                            code: 'group' }] },
        value: `GRP-${faker.string.numeric(6)}` },
    ],
    costToBeneficiary: [
      { type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/coverage-copay-type',
                            code: 'copay' }] },
        valueMoney: { value: plan.copay, currency: 'USD' } },
      { type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/coverage-copay-type',
                            code: 'deductible' }] },
        valueMoney: { value: plan.deductible, currency: 'USD' } },
    ],
  };
}
```

#### Example: Claims / EOB Generator

```typescript
// apps/bff/src/seed/generators/claims-eob.ts
import { faker } from '@faker-js/faker';
import type { ExplanationOfBenefit } from 'fhir/r4';

const CLAIM_TYPES = ['professional', 'institutional', 'pharmacy'];
const OUTCOMES = ['queued', 'complete', 'partial', 'error'];
const CPT_CODES = [
  { code: '99213', display: 'Office visit, est. patient, moderate', price: 150 },
  { code: '99214', display: 'Office visit, est. patient, high', price: 225 },
  { code: '99285', display: 'ED visit, high severity', price: 950 },
  { code: '70553', display: 'MRI Brain w/wo contrast', price: 2800 },
  { code: '27447', display: 'Total knee replacement', price: 35000 },
  { code: '43239', display: 'Upper GI endoscopy w/ biopsy', price: 3500 },
];

export function generateEOB(patientId: string, coverageId: string): ExplanationOfBenefit {
  const claimType = faker.helpers.arrayElement(CLAIM_TYPES);
  const cpt = faker.helpers.arrayElement(CPT_CODES);
  const serviceDate = faker.date.past({ years: 1 });
  const planPays = Math.round(cpt.price * 0.8);
  const memberPays = cpt.price - planPays;

  return {
    resourceType: 'ExplanationOfBenefit',
    id: faker.string.uuid(),
    status: 'active',
    type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/claim-type',
                        code: claimType }] },
    use: 'claim',
    patient: { reference: `Patient/${patientId}` },
    billablePeriod: { start: serviceDate.toISOString().split('T')[0],
                      end: serviceDate.toISOString().split('T')[0] },
    created: new Date().toISOString(),
    insurer: { reference: 'Organization/payer-001' },
    provider: { reference: `Practitioner/${faker.string.uuid()}` },
    outcome: faker.helpers.arrayElement(OUTCOMES) as any,
    insurance: [{ focal: true, coverage: { reference: `Coverage/${coverageId}` } }],
    item: [{
      sequence: 1,
      productOrService: { coding: [{ system: 'http://www.ama-assn.org/go/cpt',
                                      code: cpt.code, display: cpt.display }] },
      servicedDate: serviceDate.toISOString().split('T')[0],
      net: { value: cpt.price, currency: 'USD' },
      adjudication: [
        { category: { coding: [{ code: 'submitted' }] },
          amount: { value: cpt.price, currency: 'USD' } },
        { category: { coding: [{ code: 'benefit' }] },
          amount: { value: planPays, currency: 'USD' } },
        { category: { coding: [{ code: 'copay' }] },
          amount: { value: memberPays, currency: 'USD' } },
      ],
    }],
    total: [
      { category: { coding: [{ code: 'submitted' }] },
        amount: { value: cpt.price, currency: 'USD' } },
      { category: { coding: [{ code: 'benefit' }] },
        amount: { value: planPays, currency: 'USD' } },
    ],
    payment: { amount: { value: planPays, currency: 'USD' },
               date: new Date().toISOString().split('T')[0] },
  };
}
```

#### Example: Prior Auth Generator

```typescript
// apps/bff/src/seed/generators/prior-auth.ts
import { faker } from '@faker-js/faker';
import type { Claim } from 'fhir/r4';

const PA_SERVICES = [
  { code: '70553', display: 'MRI Brain', urgency: 'routine' },
  { code: '27447', display: 'Total Knee Replacement', urgency: 'routine' },
  { code: '99285', display: 'Inpatient Admission', urgency: 'urgent' },
  { code: '90837', display: 'Psychotherapy 60min', urgency: 'routine' },
];
const PA_STATUSES = ['active', 'cancelled', 'draft', 'entered-in-error'];
const DECISIONS = ['approved', 'denied', 'pended'];

export function generatePriorAuth(patientId: string, coverageId: string): Claim {
  const service = faker.helpers.arrayElement(PA_SERVICES);
  return {
    resourceType: 'Claim',
    id: faker.string.uuid(),
    status: faker.helpers.arrayElement(PA_STATUSES) as any,
    type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/claim-type',
                        code: 'professional' }] },
    use: 'preauthorization',
    patient: { reference: `Patient/${patientId}` },
    created: faker.date.past({ years: 1 }).toISOString(),
    insurer: { reference: 'Organization/payer-001' },
    provider: { reference: `Practitioner/${faker.string.uuid()}` },
    priority: { coding: [{ code: service.urgency }] },
    insurance: [{ sequence: 1, focal: true,
                   coverage: { reference: `Coverage/${coverageId}` } }],
    item: [{
      sequence: 1,
      productOrService: { coding: [{ system: 'http://www.ama-assn.org/go/cpt',
                                      code: service.code, display: service.display }] },
      servicedDate: faker.date.future({ years: 1 }).toISOString().split('T')[0],
    }],
    // DaVinci PAS extension for review outcome
    extension: [{
      url: 'http://hl7.org/fhir/us/davinci-pas/StructureDefinition/extension-reviewAction',
      valueCodeableConcept: { coding: [{ code: faker.helpers.arrayElement(DECISIONS) }] },
    }],
  };
}
```

#### Example: HEDIS / Quality Measure Generator

```typescript
// apps/bff/src/seed/generators/quality-measures.ts
import { faker } from '@faker-js/faker';
import type { MeasureReport } from 'fhir/r4';

const HEDIS_MEASURES = [
  { id: 'BCS', name: 'Breast Cancer Screening', target: 'female 50-74' },
  { id: 'CCS', name: 'Cervical Cancer Screening', target: 'female 21-64' },
  { id: 'COL', name: 'Colorectal Cancer Screening', target: 'all 45-75' },
  { id: 'CBP', name: 'Controlling Blood Pressure', target: 'all 18-85 w/ HTN' },
  { id: 'CDC-HbA1c', name: 'Diabetes: HbA1c Control', target: 'all 18-75 w/ DM' },
  { id: 'FUA', name: 'Follow-Up After ED Visit (Alcohol)', target: 'all 13+' },
  { id: 'AMM', name: 'Antidepressant Medication Management', target: 'all 18+' },
];

export function generateMeasureReport(patientId: string): MeasureReport {
  const measure = faker.helpers.arrayElement(HEDIS_MEASURES);
  const inNumerator = faker.datatype.boolean(0.65); // 65% compliance rate

  return {
    resourceType: 'MeasureReport',
    id: faker.string.uuid(),
    status: 'complete',
    type: 'individual',
    measure: `Measure/hedis-${measure.id.toLowerCase()}`,
    subject: { reference: `Patient/${patientId}` },
    date: new Date().toISOString(),
    period: { start: `${new Date().getFullYear()}-01-01`,
              end: `${new Date().getFullYear()}-12-31` },
    group: [{
      code: { text: measure.name },
      population: [
        { code: { coding: [{ code: 'initial-population' }] }, count: 1 },
        { code: { coding: [{ code: 'denominator' }] }, count: 1 },
        { code: { coding: [{ code: 'numerator' }] }, count: inNumerator ? 1 : 0 },
      ],
      measureScore: { value: inNumerator ? 1.0 : 0.0 },
    }],
  };
}
```

### 14.5 Seed Orchestrator & Loader

```typescript
// apps/bff/src/seed/index.ts
import Client from 'fhir-kit-client';
import { generateCoverage } from './generators/coverage';
import { generateEOB } from './generators/claims-eob';
import { generatePriorAuth } from './generators/prior-auth';
import { generateMeasureReport } from './generators/quality-measures';

const FHIR_BASE = process.env.FHIR_BASE_URL || 'http://localhost:8070/fhir';
const POPULATION = 200;

async function seed() {
  const client = new Client({ baseUrl: FHIR_BASE });

  // Step 1: Load Synthea patients (or generate inline)
  // Read from output/fhir/*.json and POST each bundle
  const patientIds: string[] = []; // collect created patient IDs

  // Step 2: For each patient, generate payer-specific resources
  for (const patientId of patientIds) {
    const coverage = generateCoverage(patientId);
    await client.create({ resourceType: 'Coverage', body: coverage });

    // Generate 3-8 claims per patient
    const claimCount = Math.floor(Math.random() * 6) + 3;
    for (let i = 0; i < claimCount; i++) {
      const eob = generateEOB(patientId, coverage.id!);
      await client.create({ resourceType: 'ExplanationOfBenefit', body: eob });
    }

    // Generate 0-2 prior auths per patient
    const paCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < paCount; i++) {
      const pa = generatePriorAuth(patientId, coverage.id!);
      await client.create({ resourceType: 'Claim', body: pa });
    }

    // Generate HEDIS measure reports
    const measures = generateMeasureReport(patientId);
    await client.create({ resourceType: 'MeasureReport', body: measures });
  }

  console.log(`Seeded ${POPULATION} patients with claims, PAs, coverage, and measures`);
}

seed().catch(console.error);
```

**Run**:
```bash
# Add to apps/bff/package.json scripts
"seed:fhir": "ts-node src/seed/index.ts"

# Execute
cd apps/bff && pnpm seed:fhir
```

### 14.6 NPM Packages Reference

| Package | Purpose | Install |
|---------|---------|---------|
| `fhir-kit-client` | Type-safe FHIR REST client for Node | `pnpm add fhir-kit-client` |
| `@types/fhir` | TypeScript types for all FHIR R4 resources | `pnpm add -D @types/fhir` |
| `@faker-js/faker` | Realistic fake data generation | `pnpm add -D @faker-js/faker` |
| `fhirpath` | FHIRPath expression evaluation | `pnpm add fhirpath` |
| `node-hl7-complete` | HL7v2 message parsing/generation (ADT) | `pnpm add node-hl7-complete` |

### 14.7 Makefile Additions

```makefile
# Add to project Makefile
fhir-up:
	docker-compose -f infra/docker-compose.fhir.yml up -d
	@echo "HAPI FHIR: http://localhost:8070/fhir/metadata"

fhir-down:
	docker-compose -f infra/docker-compose.fhir.yml down

fhir-seed:
	cd apps/bff && pnpm seed:fhir

fhir-reset:
	docker-compose -f infra/docker-compose.fhir.yml down -v
	docker-compose -f infra/docker-compose.fhir.yml up -d
	sleep 10
	cd apps/bff && pnpm seed:fhir
```

### 14.8 Compliance Testing Tools

| Tool | Purpose | URL |
|------|---------|-----|
| **Inferno** | FHIR conformance testing (US Core, Da Vinci CRD, PAS) | `https://inferno.healthit.gov/` |
| **Touchstone** | Interactive FHIR profile testing | `https://touchstone.aegis.net/` |
| **CMS Sandbox** | Real-world X12/HL7 testing | Registration required |
| **FHIR Validator** | Resource validation against profiles | `java -jar validator_cli.jar` |

---

## 15. Updated Env Var Configuration

```env
# === Auth ===
AUTH_PROVIDER=keycloak
KEYCLOAK_REALM=payer-portal
KEYCLOAK_CLIENT_ID=dfd-web

# === FHIR Server ===
FHIR_BASE_URL=http://localhost:8070/fhir        # local HAPI
# FHIR_BASE_URL=https://fhir.payer.example.com/r4  # production
FHIR_AUTH_METHOD=smart-backend
FHIR_CLIENT_ID=dfd-bff
FHIR_TOKEN_ENDPOINT=https://auth.payer.example.com/oauth2/token
FHIR_PRIVATE_KEY_PATH=/secrets/fhir-key.pem
FHIR_KEY_ID=dfd-bff-key-001

# === CMS APIs ===
CMS_BLUEBUTTON_URL=https://sandbox.bluebutton.cms.gov/v2/fhir
CMS_DPC_URL=https://sandbox.dpc.cms.gov/api/v2
CMS_BCDA_URL=https://api.bcda.cms.gov/api/v2

# === BFF Adapters (swap via env, zero code changes) ===
CMS_ADAPTER=strapi
CLAIMS_ADAPTER=fhir-claim           # or: x12-edi, blue-button
ELIGIBILITY_ADAPTER=fhir-coverage   # or: x12-270
PRIOR_AUTH_ADAPTER=davinci-pas      # or: manual, x12-278
CARE_PLAN_ADAPTER=fhir-careplan
RISK_STRAT_ADAPTER=davinci-ra       # or: hcc-engine
PROVIDER_DIR_ADAPTER=fhir-provider  # or: nppes, cms-provider-dir
QUALITY_ADAPTER=hedis-engine
CONSENT_ADAPTER=fhir-consent
FORMULARY_ADAPTER=pdex-formulary
PAYER_EXCHANGE_ADAPTER=pdex
CLINICAL_EXCHANGE_ADAPTER=cdex
ATTRIBUTION_ADAPTER=davinci-atr
COVERAGE_DECISION_ADAPTER=pcde
STORAGE_PROVIDER=s3
NOTIFICATION_PROVIDER=sns
SEARCH_PROVIDER=elasticsearch
ANALYTICS_PROVIDER=custom

# === EDI ===
EDI_GATEWAY_URL=https://edi.payer.example.com
EDI_SENDER_ID=PAYERID
EDI_RECEIVER_ID=CLEARINGHOUSE

# === HL7 ===
HL7_ADT_LISTENER_PORT=2575
HL7_ADT_PROTOCOL=mllp

# === Domain APIs ===
NPPES_API_URL=https://npiregistry.cms.hhs.gov/api
RXNORM_API_URL=https://rxnav.nlm.nih.gov/REST
TERMINOLOGY_SERVER_URL=https://tx.fhir.org/r4

# === CDS Hooks ===
CDS_HOOKS_ENABLED=true
CDS_HOOKS_PA_ENDPOINT=https://payer.example.com/cds-services/pa-check
```

---

## 16. New BFF Module Summary (Updated)

| Module | Port | Adapters | Da Vinci IG |
|--------|------|----------|-------------|
| `claims` | `ClaimsPort` | `FhirClaimAdapter`, `X12EDIAdapter`, `BlueButtonAdapter` | — |
| `eligibility` | `EligibilityPort` | `FhirCoverageAdapter`, `X12270Adapter`, `PDexFormularyAdapter` | Formulary |
| `prior-auth` | `PriorAuthPort` | `DaVinciPASAdapter`, `ManualPAAdapter`, `X12278Adapter` | CRD + DTR + PAS |
| `care-plan` | `CarePlanPort` | `FhirCarePlanAdapter`, `PCDEAdapter` | PCDE |
| `risk-stratification` | `RiskStratPort` | `DaVinciRiskAdjAdapter`, `HCCEngineAdapter`, `DaVinciATRAdapter` | Risk Adj + ATR |
| `provider-directory` | `ProviderDirPort` | `FhirProviderAdapter`, `NPPESAdapter`, `CMSProviderDirAdapter` | PDex Plan Net |
| `quality-measures` | `QualityMeasuresPort` | `HEDISEngineAdapter`, `StarsAPIAdapter` | — |
| `consent` | `ConsentPort` | `FhirConsentAdapter` | — |
| `payer-exchange` | `PayerDataExchangePort` | `PDexAdapter` | PDex + HRex |
| `clinical-exchange` | `ClinicalDataExchangePort` | `CDexAdapter` | CDex |
