# Estimation — Effort Benchmarks

## Per-Component Effort (experienced developer)

### BFF Adapters

| Adapter type | New adapter | Existing adapter | Notes |
|-------------|-------------|-----------------|-------|
| CMS (Strapi, Payload) | 3-5 days | 0 days | Content mapping is the work |
| CMS (AEM, Sitecore) | 7-10 days | — | Complex APIs, auth flows |
| Storage (S3-compatible) | 1-2 days | 0 days | Standard SDK |
| Storage (SharePoint) | 5-7 days | — | Graph API complexity |
| Notifications (SMTP) | 0.5 days | 0 days | Template rendering is the work |
| Notifications (SendGrid) | 1-2 days | — | |
| Search (Postgres FTS) | 1-2 days | 0 days | Index setup + queries |
| Search (OpenSearch/ES) | 3-5 days | — | Mapping + deployment |
| Identity (Keycloak admin) | 0 days | 0 days | Pre-built |
| Identity (Azure AD) | 3-5 days | — | Graph API + token mgmt |
| Integration (REST) | 0.5-1 day | 0 days | Config-based |
| Integration (SOAP) | 2-3 days | — | WSDL parsing |
| Integration (SAP) | 5-10 days | — | RFC/BAPI + testing |

### UI Components

| Component | From @dxp/ui | Custom build | Notes |
|-----------|-------------|-------------|-------|
| DataTable (basic) | 0 days | 2-3 days | Sorting, pagination |
| DataTable (advanced) | 0.5 days config | 5-7 days | Inline edit, export, column resize |
| Dashboard cards | 0 days | 1 day | |
| Detail panel (slide-over) | 0 days | 1-2 days | |
| Multi-step form | 0.5 days config | 3-5 days | Validation, save draft |
| Document upload | 0.5 days config | 2-3 days | Drag-drop, preview |
| Filter bar | 0 days | 2-3 days | Composable chips |
| Page layout (sidebar) | 0 days | 1-2 days | |
| Custom component | — | 1-3 days | Depends on complexity |

### Portal Pages

| Page type | Effort | What's involved |
|-----------|--------|----------------|
| Dashboard | 2-3 days | 4-6 metric cards + 2 list sections |
| List page (DataTable) | 1-2 days | Table + filters + pagination |
| Detail page | 2-3 days | Data display + actions + related records |
| Form page (create/edit) | 2-4 days | Validation + API integration + error handling |
| Multi-step form | 3-5 days | Step navigation + validation per step + draft save |
| Document management | 2-3 days | Upload + list + download + categorization |
| Settings/profile | 1-2 days | Form + password change |

---

## Engagement-Level Estimates

### Small portal (Profile A)
- Phase 1: **4-6 weeks** (1 developer)
  - Auth + dashboard + 2 CRUD pages + document upload
  - 2 adapters (existing)
  - ~15-20 developer-days

### Mid-market portal (Profile B)
- Phase 1: **8-12 weeks** (2 developers)
  - Auth + dashboard + 4-5 pages + documents + notifications
  - 4-6 adapters (2 existing + 2-4 new)
  - ~30-45 developer-days

### Enterprise portal (Profile C)
- Phase 1: **10-16 weeks** (2-3 developers)
  - Auth integration + dashboard + 5-7 pages + documents + search + notifications
  - 6-10 adapters (mostly new, integrating with client systems)
  - ~50-70 developer-days
  - +2-3 weeks for compliance documentation and security review

---

## Overhead Budget

| Activity | % of total effort | Notes |
|----------|------------------|-------|
| Requirements/discovery | 10-15% | Client workshops, system access |
| Development | 50-60% | The actual build |
| Testing | 15-20% | Manual + automated |
| Deployment/DevOps | 5-10% | Client environment setup |
| Documentation/handover | 5-10% | For client's team |

---

## Velocity Benchmarks

After 3+ engagements with DXP framework, target velocities:

| Metric | Target | How |
|--------|--------|-----|
| Auth integration | 2 days | Pre-built Keycloak + SDK |
| Standard CRUD page | 1 day | DataTable + DetailPanel + SDK hooks |
| New adapter (REST-based) | 2-3 days | Port pattern + existing examples |
| Dashboard | 1 day | DashboardCard + mock data, then wire |
| Document upload flow | 1 day | Pre-built DocumentUpload + S3 adapter |

**The accelerator effect**: By engagement 3, Phase 1 delivery should be 30-40% faster than from-scratch because adapters, components, and patterns are reused.
