# Phase Scoping — What to Build When

## The Golden Rule

Phase 1 must deliver a **usable portal** that real users can log into and accomplish one meaningful task. Not a demo. Not a shell. A thing that replaces a spreadsheet or email thread.

---

## Phase 1 — The Foundation (4-8 weeks)

### Always include
- [ ] Authentication flow (login, logout, session management)
- [ ] Role-based access (2-3 roles max)
- [ ] Dashboard with key metrics (4-6 cards)
- [ ] One primary workflow (the reason the portal exists)
- [ ] Basic document upload/download
- [ ] Responsive layout (sidebar + content area)

### Always defer
- [ ] Notification preferences / complex notification routing
- [ ] Full-text search (simple filters are enough for Phase 1)
- [ ] Localization / multi-language
- [ ] Advanced analytics / reporting dashboards
- [ ] Integration with > 2 external systems
- [ ] User self-registration (admin creates users in Phase 1)
- [ ] White-labeling / multi-tenant theming

### Phase 1 BFF modules typically used
- auth (always)
- identity (always — user profile)
- documents (usually — most portals need file upload)
- cms OR a domain-specific module
- 1-2 integration adapters for client systems

### Acceptance criteria template
```
A [role] can log in, see their [primary data] on a dashboard,
[perform primary action], and upload/download [documents].
```

Example: "A policyholder can log in, see their active policies on a dashboard, file a new claim, and upload supporting documents."

---

## Phase 2 — The Value Add (4-8 weeks)

### Typical additions
- [ ] Notifications (email/in-app for status changes)
- [ ] Search across portal content
- [ ] 2-3 more integrations (CRM, ERP, etc.)
- [ ] Reporting / data export
- [ ] User self-service (profile edit, password reset)
- [ ] Approval workflows (if needed)
- [ ] Audit trail

### Phase 2 BFF modules typically added
- notifications (SMTP or SendGrid)
- search (PostgreSQL FTS)
- integration (additional client systems)

---

## Phase 3 — Scale & Polish (ongoing)

### Typical additions
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] White-labeling for sub-brands
- [ ] Mobile optimization / PWA
- [ ] SSO with additional identity providers
- [ ] API for third-party consumption
- [ ] Performance optimization (caching, CDN)

---

## Red Flags in Scoping

| Red flag | What to say |
|----------|-------------|
| "We need everything in Phase 1" | "Which one workflow would you demo to your board next month?" |
| "Can we add a chatbot?" | "Let's get the core workflow working first. Chatbot is a Phase 2 integration." |
| "We need to support 10 languages" | "Phase 1 in English. Phase 2 adds the highest-traffic language. Phase 3 completes." |
| "The portal needs to work offline" | "Phase 1 online-only. If offline is validated as a need, Phase 2 adds PWA." |
| "We need real-time dashboards" | "Phase 1 refreshes on page load. Phase 2 adds polling. Phase 3 adds WebSocket if justified." |

---

## Effort Multipliers

| Factor | Multiplier | Why |
|--------|-----------|-----|
| Each external integration | 1.5-2 weeks | Discovery + adapter + error handling + testing |
| Client's existing IdP (vs our Keycloak) | +1 week | SAML/OIDC config, testing with their IdP |
| Client's API gateway (vs our Kong) | +0.5 weeks | Route config, auth plugin alignment |
| Compliance documentation | +1-2 weeks | Security review, pen test support, doc prep |
| Data migration from legacy system | +2-4 weeks | Schema mapping, validation, testing |
