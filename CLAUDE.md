# DXP — Delivery Accelerator

## What is this?
A lean framework for building enterprise portals fast. Not a platform engineering showcase — a delivery accelerator. Three pieces of real IP:

1. **BFF Adapter Library** — pre-built NestJS adapters (port+adapter pattern) for common enterprise integrations
2. **Component Library** — battle-tested React + Tailwind components for enterprise portal patterns
3. **SDK React** — hooks for consuming BFF from React apps

## Stack
- **BFF**: NestJS with adapter pattern (port → swappable adapters via env var)
- **Auth**: Keycloak (OIDC/SAML, RBAC via realm roles)
- **Gateway**: Kong (DB-less, declarative)
- **Database**: PostgreSQL (client provides or we provision)
- **Cache**: Redis
- **Frontend**: React + Tailwind + @dxp/ui component library
- **Monorepo**: Nx + pnpm

## Philosophy
- Every component carried = component delivery team must learn, debug, defend in security review
- If client has it, integrate with theirs (analytics, notifications, search) — don't run your own
- Adapters are the IP. Runtimes are the client's problem.
- `optional/` has bring-if-needed components (Go services, Kafka, Temporal)

## Directory Layout
- `apps/bff/` — NestJS BFF with adapter modules
- `packages/contracts/` — shared TypeScript types
- `packages/ui/` — enterprise component library (@dxp/ui)
- `packages/sdk-react/` — React hooks (@dxp/sdk-react)
- `starters/insurance-portal/` — sample portal (Insurance Customer Service)
- `optional/` — bring-if-needed (Go template, Kafka, audit service)
- `infra/` — Keycloak realm, Kong config

## BFF Adapter Pattern
- Port = abstract class in `ports/` (the contract)
- Adapter = injectable class in `adapters/` (the implementation)
- Module factory selects adapter from env: `CMS_ADAPTER=strapi`, `STORAGE_PROVIDER=s3`
- Swapping = one env var change, zero code changes

## Commands
- `make up` — start 4 infra services
- `make dev` — start BFF in dev mode
- `make down` — stop everything
- `make status` — health check
