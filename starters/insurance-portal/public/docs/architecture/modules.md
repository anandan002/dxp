# BFF Modules

All modules live under `apps/bff/src/modules/`. Each follows the same structure:

```
modules/<name>/
  ports/<name>.port.ts      # Abstract contract
  adapters/<impl>.adapter.ts # Concrete implementation(s)
  <name>.module.ts           # NestJS module with factory
  <name>.controller.ts       # REST endpoints
```

## Auth Module
**Purpose**: JWT validation and role-based access control.

- Strategy: Keycloak JWT via `passport-jwt` + JWKS
- Guard: `RolesGuard` — decorates endpoints with `@Roles('portal-admin')`
- No port/adapter — auth is always Keycloak (client's IdP connects via OIDC federation)

**Endpoints**: None (middleware only)

## Health Module
**Purpose**: Aggregated health checks for monitoring.

**Endpoints**:
- `GET /api/v1/health` — checks Keycloak connectivity

## CMS Module
**Purpose**: Content management — pages, articles, FAQs.

**Adapters**: Strapi, Payload

**Endpoints**:
- `GET /api/v1/cms/:type` — list content
- `GET /api/v1/cms/:type/:id` — get content
- `POST /api/v1/cms/:type` — create content
- `POST /api/v1/cms/:type/:id/publish` — publish
- `DELETE /api/v1/cms/:type/:id` — delete

## Storage Module
**Purpose**: File storage — presigned URLs for upload/download.

**Adapters**: S3/MinIO, Azure Blob

**Endpoints**:
- `POST /api/v1/storage/presign/upload` — get upload URL
- `POST /api/v1/storage/presign/download` — get download URL
- `DELETE /api/v1/storage/:key` — delete object
- `GET /api/v1/storage/list` — list by prefix

## Notifications Module
**Purpose**: Send notifications (email, SMS).

**Adapters**: SMTP, SendGrid

**Endpoints**:
- `POST /api/v1/notifications/send` — send one
- `POST /api/v1/notifications/send-bulk` — send multiple

## Search Module
**Purpose**: Full-text search and autocomplete.

**Adapters**: PostgreSQL FTS

**Endpoints**:
- `GET /api/v1/search?table=X&q=Y` — search
- `GET /api/v1/search/suggest?table=X&q=Y` — autocomplete

## Documents Module
**Purpose**: Document lifecycle — upload, metadata, download URLs.

**Adapters**: S3

**Endpoints**:
- `GET /api/v1/documents` — list
- `GET /api/v1/documents/:id` — get metadata
- `GET /api/v1/documents/:id/download-url` — presigned download
- `POST /api/v1/documents` — upload
- `DELETE /api/v1/documents/:id` — delete

## Identity Module
**Purpose**: User profile management.

**Adapters**: Keycloak Admin API

**Endpoints**:
- `GET /api/v1/identity/me` — current user
- `GET /api/v1/identity/users` — list tenant users
- `PUT /api/v1/identity/users/:id` — update profile
- `POST /api/v1/identity/users/:id/reset-password` — trigger reset

## Integration Module
**Purpose**: Generic proxy to external client systems.

**Adapters**: REST (config-based)

**Endpoints**:
- `GET /api/v1/integrations` — list configured integrations
- `POST /api/v1/integrations/:name/call` — call an integration
