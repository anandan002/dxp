# Architecture Overview

## System Diagram

```
Browser (4200)
    |
    v
Kong Gateway (8000) --- rate limiting, CORS, routing
    |
    v
NestJS BFF (4201) --- adapter pattern, auth, orchestration
    |
    +--- Keycloak (8080) --- OIDC auth, RBAC
    +--- PostgreSQL (5432) --- primary data store
    +--- Redis (6379) --- cache, sessions
    +--- [Client Systems] --- via adapter modules
```

## Layers

### API Gateway (Kong)
- Declarative config (no database)
- Rate limiting, CORS, request ID correlation
- Routes all `/api/v1/*` to the BFF
- Config: `infra/kong/kong.yml`

### Backend for Frontend (NestJS)
- 9 adapter modules, each with port + adapter pattern
- Keycloak JWT validation via Passport
- Role-based access control via `RolesGuard`
- Swagger/OpenAPI auto-generated
- Global exception filter with structured error responses

### Identity (Keycloak)
- OIDC and SAML 2.0
- Pre-configured `dxp` realm with roles and test users
- PKCE flow for browser clients
- Tenant isolation via `tenant_id` user attribute
- Config: `infra/keycloak/dxp-realm.json`

### Frontend
- `@dxp/ui` — enterprise component library (React + Tailwind)
- `@dxp/sdk-react` — hooks backed by TanStack Query
- Starters: Vite (insurance portal) and Next.js (generic)

## Directory Structure

```
dxp/
  apps/bff/              # NestJS BFF (the core product)
  packages/contracts/    # Shared TypeScript types
  packages/ui/           # Component library (@dxp/ui)
  packages/sdk-react/    # React hooks (@dxp/sdk-react)
  starters/              # Portal starters (clone per engagement)
  optional/              # Bring-if-needed (Go services, Kafka)
  infra/                 # Keycloak realm, Kong config
  docs/                  # This documentation
```
