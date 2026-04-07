# Architecture Overview

## System Diagram (Local)

```text
Browser (:5020 / :5022)
    |
    v
Nginx (/dxp, /dxp/payer, /dxp/storybook, /dxp/api)
    |
    v
NestJS BFF (:5021) --- adapter pattern, auth, orchestration
    |
    +--- Keycloak (:5025) --- OIDC auth, RBAC
    +--- PostgreSQL (:5432) --- primary data store
    +--- Redis (:6379, optional in no-docker flow)
    +--- HAPI FHIR (:5028/fhir)
    +--- [Client Systems] --- via adapter modules
```

## Layers

### API Gateway (Kong)
- Declarative config (DB-less) for docker-first environments
- Routing and gateway policies for `/api/v1/*`
- Config: `infra/kong/kong.yml`

### Backend for Frontend (NestJS)
- Adapter modules using port/adapter pattern
- Keycloak JWT validation via Passport
- Role-based access control via `RolesGuard`
- Swagger/OpenAPI auto-generated

### Identity (Keycloak)
- OIDC and SAML 2.0
- Pre-configured `dxp` realm with roles and test users
- Config: `infra/keycloak/dxp-realm.json`

### Frontend
- `@dxp/ui`: shared React + Tailwind component library
- `@dxp/sdk-react`: typed hooks for BFF APIs
- Starters: insurance portal and payer portal

## Directory Structure

```text
dxp/
  apps/bff/              # NestJS BFF
  packages/contracts/    # Shared TypeScript types
  packages/ui/           # Component library (@dxp/ui)
  packages/sdk-react/    # React hooks (@dxp/sdk-react)
  starters/              # Portal starters
  infra/                 # Keycloak realm, Kong config
  scripts/               # Windows setup/deploy/service scripts
  docs/                  # Documentation
```
