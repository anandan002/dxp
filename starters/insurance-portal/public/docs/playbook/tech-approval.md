# Tech Approval — Navigating Security Reviews

## Pre-Meeting Checklist

Before presenting to client's security/architecture team:

- [ ] Know which components are deployed in client's environment vs SaaS
- [ ] Prepare dependency list with versions and license types
- [ ] Have answers for OWASP Top 10 for each component
- [ ] Know the data flow — where does PII go? Where is it stored?
- [ ] Prepare network diagram showing which services talk to which

---

## Common Objections and Responses

### "We don't allow open-source databases in production"
**Response**: "PostgreSQL is used by [client's peer companies]. We can also adapt to your existing database — the BFF adapter pattern means swapping the data layer is a config change, not a rewrite. What database does your team prefer?"

### "We need all code reviewed before deployment"
**Response**: "Absolutely. Our codebase is TypeScript with strict mode enabled. We'll provide full source, run your SAST tools, and walk through the architecture. The adapter pattern means the integration points are well-defined and auditable."

### "We already have an API gateway / identity provider / [service]"
**Response**: "Perfect — we integrate with yours. Our BFF is designed to sit behind your existing gateway and authenticate against your existing IdP. We don't install competing infrastructure."

### "Why NestJS and not [Java/C#/.NET]?"
**Response**: "The BFF is an orchestration layer, not business logic. TypeScript gives us: shared types with the frontend (fewer integration bugs), faster iteration on adapter code, and a smaller runtime footprint. Heavy business logic runs in your existing backend systems — we just aggregate and present."

### "What happens if your company goes away?"
**Response**: "The code is yours. It's standard NestJS (150K+ npm downloads/week), React, and PostgreSQL. Any TypeScript developer can maintain it. There's no proprietary runtime or lock-in. The adapter pattern means you can replace any component independently."

### "We need SOC 2 / HIPAA / PCI compliance"
**Response**: "The portal itself doesn't store sensitive data — it proxies through the BFF to your existing systems of record. Auth tokens are JWT with short expiry, stored in httpOnly cookies. We can provide our security architecture document and support your compliance audit."

### "How do you handle multi-tenancy?"
**Response**: "Tenant isolation happens at the Keycloak realm level (each tenant gets their own realm or a tenant_id attribute) and the BFF enforces tenant scoping on every API call. The database uses row-level filtering by tenant_id. This is configurable — we can adapt to your existing tenant model."

---

## Security Architecture Talking Points

### Authentication
- Keycloak (or client's IdP) handles all authentication
- OIDC/SAML 2.0 standard protocols
- PKCE flow for browser clients (no client secrets in frontend)
- JWT tokens with configurable expiry
- Refresh token rotation

### Authorization
- Role-based access control via Keycloak realm roles
- BFF RolesGuard enforces at the API level
- Frontend hides UI elements based on roles (defense in depth, not security boundary)

### Data Protection
- No PII stored in the portal database unless explicitly required
- Portal acts as a pass-through to client's systems of record
- HTTPS everywhere (TLS 1.2+)
- Secrets in environment variables, never in code
- No sensitive data in logs

### API Security
- Kong (or client's gateway) handles rate limiting and IP filtering
- Request validation via class-validator (NestJS)
- CORS configured per deployment
- Request ID tracing for audit trail

---

## License Summary

| Component | License | Risk |
|-----------|---------|------|
| NestJS | MIT | Low |
| React | MIT | Low |
| Tailwind CSS | MIT | Low |
| PostgreSQL | PostgreSQL License (BSD-like) | Low |
| Redis | BSD 3-Clause | Low |
| Keycloak | Apache 2.0 | Low |
| Kong | Apache 2.0 | Low |
| TanStack Query | MIT | Low |
| Radix UI | MIT | Low |

All core dependencies are MIT or Apache 2.0 — no copyleft, no commercial restrictions.
