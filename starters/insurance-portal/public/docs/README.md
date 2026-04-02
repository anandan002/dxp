# DXP — Digital Experience Platform

**A delivery accelerator for building enterprise portals in weeks, not months.**

DXP is not a product you deploy. It's a framework your delivery team uses to build client portals faster — with pre-built adapters for enterprise integrations, battle-tested UI components, and a playbook that turns institutional knowledge into repeatable delivery.

---

## What Problems Does DXP Solve?

Every enterprise portal engagement starts the same way: authenticate users, fetch data from 3-5 backend systems, display it in tables and dashboards, let users upload documents, send notifications. Teams rebuild this from scratch each time.

DXP eliminates that rework:

| Without DXP | With DXP |
|------------|---------|
| Build auth integration from scratch | `Keycloak JWT + RolesGuard` — pre-configured, one env var |
| Write API clients for each backend | Pick adapters off the shelf — Strapi, S3, SendGrid, REST proxy |
| Build UI components per engagement | Import `@dxp/ui` — DataTable, DashboardCard, FileUpload, ready to use |
| No shared patterns across projects | Same architecture, same conventions, same playbook |
| Week 1-3: infrastructure | Week 1: already building portal pages |

---

## Architecture at a Glance

```
Browser (localhost:5020)
    |
    |--- /                    Portal pages (React + @dxp/ui)
    |--- /playground          API explorer with live auth
    |--- /docs                Documentation (this site)
    |--- /storybook           Component playground
    |
    v
NestJS BFF (localhost:5021)   The orchestration layer
    |
    |--- Auth Module          Keycloak JWT + RBAC
    |--- CMS Module           Port -> Strapi | Payload adapter
    |--- Storage Module       Port -> S3 | Azure Blob adapter
    |--- Notifications Module Port -> SMTP | SendGrid adapter
    |--- Search Module        Port -> Postgres FTS adapter
    |--- Documents Module     Port -> S3 document adapter
    |--- Identity Module      Port -> Keycloak admin adapter
    |--- Integration Module   Port -> Generic REST adapter
    |
    v
Client's Infrastructure
    |--- Keycloak (or client's IdP)
    |--- PostgreSQL (or client's DB)
    |--- Redis (cache/sessions)
    |--- Kong (API gateway)
    |--- Client's CMS, storage, notification service, etc.
```

**Key principle**: The BFF adapter pattern means every integration point is a swappable plugin. Change the CMS from Strapi to Payload by changing one environment variable. Zero code changes.

---

## The Three Pieces of IP

### 1. BFF Adapter Library

Pre-built NestJS modules for the integrations every enterprise portal needs. Each module follows the same pattern:

- **Port** — an abstract TypeScript class defining the contract (what methods exist)
- **Adapter** — a concrete implementation connecting to a specific provider
- **Factory** — selects the adapter based on an environment variable

```
CmsPort (abstract)
    |
    +-- StrapiAdapter (CMS_ADAPTER=strapi)
    +-- PayloadAdapter (CMS_ADAPTER=payload)
    +-- [YourAdapter] (CMS_ADAPTER=yours)
```

**9 modules, 12 adapters** ready to use:

| Module | What it does | Adapters | Env var |
|--------|-------------|----------|---------|
| **Auth** | JWT validation + RBAC | Keycloak | built-in |
| **CMS** | Content management | Strapi, Payload | `CMS_ADAPTER` |
| **Storage** | File upload/download via presigned URLs | S3, Azure Blob | `STORAGE_PROVIDER` |
| **Notifications** | Email/SMS sending | SMTP, SendGrid | `NOTIFICATION_ADAPTER` |
| **Search** | Full-text search + autocomplete | PostgreSQL FTS | default |
| **Documents** | Document lifecycle + metadata | S3 | `DOCUMENT_PROVIDER` |
| **Identity** | User profile management | Keycloak Admin | default |
| **Integration** | Generic proxy to external APIs | REST | `INTEGRATIONS_CONFIG` |
| **Health** | Aggregated health checks | built-in | -- |

### 2. Component Library (`@dxp/ui`)

React components built for enterprise portal patterns. Not generic UI primitives — specifically the components that come up in every portal project.

**Primitives** (foundation-abstracted — today Tailwind + Radix, swappable tomorrow):
- `Button` — primary, secondary, danger, ghost, link variants
- `Input` — with error state, themed borders
- `Badge` — success, warning, danger, info, brand variants
- `Card` — with CardHeader, CardContent, CardFooter
- `Tabs` — pill and underline variants

**Composed** (enterprise patterns built on primitives):
- `DataTable` — sortable, paginated, row click actions
- `DashboardCard` — metric display with trend indicator
- `StatusBadge` — auto-maps "Active" to green, "Pending" to amber
- `DetailPanel` — slide-over panel for record details
- `StepIndicator` — multi-step progress bar
- `FileUploadZone` — drag-drop with uploaded file cards
- `DocumentCard` — file card with icon, category badge, download
- `MultiStepForm` — wizard with validation per step
- `FilterBar` — search input + filter chips
- `NotificationInbox` — bell icon with dropdown
- `PageLayout` — sidebar nav + content area

**Theming**: All components read from CSS custom properties injected by `ThemeProvider`. Change brand colors, radius, density, font — every component updates. No Tailwind classes leak to portal code.

```tsx
<ThemeProvider theme={{
  colors: { brand: '#1d6fb8', brandDark: '#175a96' },
  radius: 'md',
  density: 'comfortable',
}}>
  <App />
</ThemeProvider>
```

### 3. Engagement Playbook

Documentation that's as valuable as the code:
- **[Client Profiles](playbook/client-profiles.md)** — which stack for small / mid-market / enterprise clients
- **[Phase Scoping](playbook/phase-scoping.md)** — what to build in Phase 1 vs Phase 2, red flags, effort multipliers
- **[Tech Approval](playbook/tech-approval.md)** — security review objections + responses, license summary
- **[Adapter Selection](playbook/adapter-selection.md)** — decision matrix: which adapters for which client systems
- **[Estimation](playbook/estimation.md)** — effort benchmarks per adapter, per component, per page type

---

## How to Build a Portal

### Step 1: Start the Platform

```bash
make up       # Start infrastructure (Keycloak + Kong)
make dev      # Start BFF + Portal on localhost:5020
```

Open `http://localhost:5020` — you get the Insurance Portal demo with all features working.

### Step 2: Clone the Starter

```bash
cp -r starters/insurance-portal my-client-portal
cd my-client-portal
```

Or use the Next.js starter for server-rendered portals:

```bash
cp -r starters/portal-nextjs my-client-portal
```

### Step 3: Configure

**Theme** — change brand colors in `src/main.tsx`:
```tsx
const clientTheme = {
  colors: { brand: '#059669', brandDark: '#047857', brandLight: '#ecfdf5' },
  radius: 'lg',
  fontFamily: 'Poppins, sans-serif',
};
```

**Adapters** — set providers in `.env`:
```env
CMS_ADAPTER=strapi
STORAGE_PROVIDER=azure
NOTIFICATION_ADAPTER=sendgrid
KEYCLOAK_URL=https://client-keycloak.example.com
```

### Step 4: Build Pages

Import components and hooks — write zero infrastructure code:

```tsx
import { DataTable, DashboardCard, StatusBadge } from '@dxp/ui';
import { useCms, useAuth } from '@dxp/sdk-react';

function PolicyList() {
  const { user } = useAuth();
  const { data } = useCms('policies');

  return (
    <DataTable
      columns={[
        { key: 'id', header: 'Policy #', sortable: true },
        { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} /> },
      ]}
      data={data?.data || []}
    />
  );
}
```

### Step 5: Deploy

Standard React/Next.js app. Deploy anywhere — Vercel, Docker, Kubernetes, client's infra.

---

## How to Extend DXP

### Adding a New Adapter

When a client uses a system you don't have an adapter for (e.g., Contentful CMS):

**1. Create the adapter file:**
```
apps/bff/src/modules/cms/adapters/contentful.adapter.ts
```

**2. Implement the port interface:**
```typescript
@Injectable()
export class ContentfulAdapter extends CmsPort {
  constructor(private config: ConfigService) { super(); }

  async getContent(type: string, id: string): Promise<CmsContent> {
    // Call Contentful API, map response to CmsContent
  }
  // ... implement all abstract methods
}
```

**3. Add to the module factory:**
```typescript
// cms.module.ts
case 'contentful': return new ContentfulAdapter(config);
```

**4. Add env vars to `.env.example`**

That's it. The controller, Swagger docs, SDK hooks, and portal code don't change. **Effort**: 2-5 days for a REST-based adapter.

### Adding a New UI Component

**1. Decide**: primitive (generic building block) or composed (enterprise pattern)?

**2. Create the component** in `packages/ui/src/composed/` using primitives — never import from Tailwind/Radix directly.

**3. Export from `packages/ui/src/index.ts`**

**4. Add a Storybook story**, then `make build-storybook`

The component is available to every portal via `import { MyComponent } from '@dxp/ui'`.

### Adding a New BFF Module

**1. Create the module structure:**
```
apps/bff/src/modules/workflow/
  ports/workflow.port.ts       # Abstract contract
  adapters/temporal.adapter.ts # Implementation
  workflow.module.ts            # NestJS module with factory
  workflow.controller.ts        # REST endpoints
```

**2. Define the port, implement the adapter, register in `app.module.ts`**

**3. (Optional) Add SDK hook** in `packages/sdk-react/src/hooks/`

### Adding a New Portal Starter

Copy an existing starter, replace domain-specific data and pages, adjust the theme. The starter becomes a template for all future engagements in that vertical.

---

## Benefits

### For the Delivery Team

- **Start building pages on day 1** — auth, gateway, adapters are pre-built
- **Consistent quality** — same patterns, same components, same architecture across engagements
- **Swap providers without rewriting** — client changes from AWS to Azure? One env var
- **New team members productive in days** — one architecture to learn, not a new one per project

### For the Client

- **Faster time to value** — portal delivered in weeks, not months
- **No lock-in** — standard NestJS, React, PostgreSQL; any developer can maintain it
- **Integrates with their systems** — adapters connect to their IdP, storage, CMS
- **Production-grade from day 1** — auth, RBAC, error handling, API gateway built in

### For the Business

- **Reusable IP compounds over time** — every engagement adds adapters and components
- **Predictable estimation** — benchmarks per adapter, per page, per engagement size
- **Easier hiring** — standard stack, no proprietary framework to learn
- **Competitive advantage** — week 2 looks like week 6 for teams without a framework

---

## Quick Reference

| Service | URL |
|---------|-----|
| Portal + Dev Tools | http://localhost:5020 |
| API Playground | http://localhost:5020/playground |
| Documentation | http://localhost:5020/docs |
| Storybook | http://localhost:5020/storybook |
| Swagger API Docs | http://localhost:5020/api/docs |
| Keycloak Admin | http://localhost:5025 |

| Command | What it does |
|---------|-------------|
| `make up` | Start infrastructure (Keycloak + Kong) |
| `make dev` | Start BFF + Portal (everything) |
| `make down` | Stop Docker services |
| `make status` | Health check all services |
| `make build-storybook` | Rebuild component playground |

| Test User | Password | Role | Tenant |
|-----------|----------|------|--------|
| admin@dxp.local | admin | platform-admin | platform |
| user@acme.local | user | portal-user | acme |

