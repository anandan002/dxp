# Production Hardening Checklist

Items identified by automated security scan and code review. Not needed for POC/demo — required before shipping to a real client.

## Security (from Phase 4 scan)

### High Priority

- [ ] **Add Helmet security headers** — `pnpm add helmet` then `app.use(helmet())` in `main.ts`
- [ ] **Gate Swagger on NODE_ENV** — only expose `/api/docs` when `NODE_ENV !== 'production'`
- [ ] **Bind Kong admin to localhost** — change `5027:8001` to `127.0.0.1:5027:8001` in docker-compose
- [ ] **Parameterize Keycloak start mode** — `${KC_START_MODE:-start-dev}` in docker-compose
- [ ] **SSRF protection in integration proxy** — validate `request.path` (no `..`), strip `Host`/`Authorization`/`Cookie` headers
- [ ] **SQL injection prevention in search** — allowlist `table` parameter against known searchable tables
- [ ] **Add role guards to write endpoints**:
  - CMS create/publish/delete → `@Roles('portal-admin')`
  - Identity update/resetPassword → self-only OR `@Roles('portal-admin')`
  - Identity listUsers → `@Roles('portal-admin')`
  - Notifications send/sendBulk → `@Roles('portal-admin')` + validate recipient
  - Storage operations → tenant-prefix keys, validate no path traversal
- [ ] **Log auth failures in RolesGuard** — add Logger, log userId + requested roles on denial
- [ ] **CORS from env var** — `origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5020']`

### Medium Priority

- [ ] **Replace default passwords in .env.example** — use `<change-me>` placeholders
- [ ] **Keycloak realm: tighten redirectUris** — exact-match for production, keep wildcard for dev only
- [ ] **Move default creds in AuthPanel behind env var** — empty in non-dev builds
- [ ] **Add schema validation to INTEGRATIONS_CONFIG** — use zod before JSON.parse

### Low Priority

- [ ] **Truncate PII in notification adapter logs** — hash or truncate email addresses
- [ ] **MinIO adapter: use credentials provider** — don't store root creds as instance vars

## Code Quality (from Phase 5 review)

### Important

- [ ] **Add error handling to all adapters** — wrap axios calls in try/catch, rethrow as HttpException with upstream status
- [ ] **Convert DTOs from interfaces to classes** — add class-validator decorators so ValidationPipe actually validates
- [ ] **Implement real presigned URLs** — use `@aws-sdk/s3-request-presigner` in MinIO adapter (or throw NotImplementedException)
- [ ] **Import types from @dxp/contracts** — or delete the contracts package. Types are currently duplicated between BFF ports and SDK hooks.
- [ ] **Fix DxpProvider race condition** — call `configureDxp()` synchronously, not in useEffect
- [ ] **Create QueryClient inside component** — not module-level singleton (breaks test isolation)

### Minor

- [ ] **Remove stale tsconfig paths** — `@dxp/sdk-core`, `@dxp/sdk-components` don't exist
- [ ] **Remove stale Swagger tags** — `workflow`, `rules`, `analytics` modules don't exist
- [ ] **Fix HttpExceptionFilter** — preserve array validation messages
- [ ] **Generate requestId UUID fallback** — `crypto.randomUUID()` when no X-Request-ID header
- [ ] **Use Promise.allSettled in sendBulk** — handle partial failures
- [ ] **Add focus trap + Escape key to DetailPanel** — use `@radix-ui/react-dialog`
- [ ] **Use row ID as React key in DataTable** — not array index
- [ ] **Add `screen_*.png` to .gitignore**

