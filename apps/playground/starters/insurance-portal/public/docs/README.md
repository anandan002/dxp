# DXP — Delivery Accelerator

A lean framework for building enterprise portals fast. Not a platform engineering showcase — a **delivery accelerator**.

## Three Pieces of Real IP

### 1. BFF Adapter Library
Pre-built NestJS adapters (port + adapter pattern) for the integrations every enterprise portal needs. Swap providers by changing one environment variable — zero code changes.

| Module | Adapters | Env Var |
|--------|----------|---------|
| CMS | Strapi, Payload | `CMS_ADAPTER=strapi\|payload` |
| Storage | S3, Azure Blob | `STORAGE_PROVIDER=s3\|azure` |
| Notifications | SMTP, SendGrid | `NOTIFICATION_ADAPTER=smtp\|sendgrid` |
| Search | PostgreSQL FTS | default |
| Documents | S3-compatible | default |
| Identity | Keycloak Admin | default |
| Integration | Generic REST | default |

### 2. Component Library (`@dxp/ui`)
Battle-tested React + Tailwind components for enterprise portal patterns:

`DataTable` | `DashboardCard` | `StatusBadge` | `DetailPanel` | `MultiStepForm` | `FilterBar` | `NotificationInbox` | `PageLayout`

### 3. Engagement Playbook
Which pieces to propose for which client, how to scope phases, how to navigate tech approval conversations.

## Stack

| Layer | Technology |
|-------|-----------|
| BFF | NestJS (TypeScript) |
| Auth | Keycloak (OIDC/SAML) |
| Gateway | Kong (declarative) |
| Database | PostgreSQL (client's or ours) |
| Cache | Redis |
| Frontend | React + Tailwind + @dxp/ui |
| SDK | @dxp/sdk-react (TanStack Query) |
| Monorepo | Nx + pnpm |

## Philosophy

> Every component you carry is a component your delivery team has to learn, debug, and defend in client security reviews.

- If the client has it, integrate with theirs — don't run your own
- Adapters are the IP. Runtimes are the client's problem.
- Docker Compose runs **2 services** (Keycloak + Kong). Postgres and Redis run locally.
