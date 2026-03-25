# Client Profiles — Which Stack for Which Client

## Profile A: Small Enterprise (50-500 employees)

**Characteristics**: Single-region, 1-2 existing systems, < 5,000 portal users, limited IT team, budget-conscious.

**Recommended stack**:
- BFF + PostgreSQL + Redis + Keycloak (our standard 4)
- CMS: Payload (self-hosted, free tier) or client's existing WordPress
- Storage: Client's existing S3 or Azure Blob
- Notifications: SMTP via client's existing email provider
- Search: PostgreSQL full-text (no separate search engine)
- Auth: Keycloak with social login if customer-facing

**What to skip**: Kong (use BFF directly if < 1,000 concurrent users), complex RBAC (2-3 roles max), separate search engine.

**Phase 1 scope**: Auth + dashboard + 2-3 CRUD pages + document upload. 4-6 weeks.

---

## Profile B: Mid-Market (500-5,000 employees)

**Characteristics**: Multi-department, 3-5 existing systems to integrate, 5K-50K portal users, dedicated IT but not large, compliance requirements (SOC 2, GDPR).

**Recommended stack**:
- Full standard stack: BFF + PostgreSQL + Redis + Keycloak + Kong
- CMS: Strapi (if new content management needed) or headless adapter to client's existing CMS
- Storage: S3 or Azure Blob (client provides credentials)
- Notifications: SendGrid or client's email service
- Search: PostgreSQL FTS for < 100K records, OpenSearch for larger datasets
- Documents: S3 with metadata in PostgreSQL
- Integration: REST adapters for 2-3 client systems (CRM, ERP, DMS)

**What to skip**: Custom Go microservices (BFF handles orchestration), event sourcing, Temporal workflows.

**Phase 1 scope**: Auth + dashboard + core business pages + 2 integrations + document management. 8-12 weeks.

---

## Profile C: Large Enterprise (5,000+ employees)

**Characteristics**: Multi-region, 10+ existing systems, 50K-500K portal users, dedicated platform team, heavy compliance (PCI-DSS, HIPAA, SOX), existing API gateway.

**Recommended stack**:
- BFF adapts to client's existing infrastructure where possible
- Auth: Adapter to client's existing IdP (Azure AD, Okta, Ping) — NOT a new Keycloak
- Gateway: Client's existing API gateway (Apigee, Azure APIM) — NOT a new Kong
- Storage: Client's existing object storage
- CMS: Adapter to client's existing CMS (AEM, Sitecore, Contentful)
- Notifications: Adapter to client's notification platform
- Search: Adapter to client's search (Elasticsearch, Azure Cognitive Search)
- Integration: Multiple REST/SOAP adapters, potentially Apache Camel if > 5 integrations
- Consider: Kafka (if client already has it), Temporal (if complex approval workflows), Go microservices (if high-throughput domains)

**What changes**: We bring the BFF adapter pattern and component library. Client provides the infrastructure. We integrate, not install.

**Phase 1 scope**: Auth integration + dashboard + 3-4 core pages + 3 integrations. 10-16 weeks.

---

## Decision Matrix

| Factor | Small | Mid-Market | Enterprise |
|--------|-------|------------|------------|
| Deploy our Keycloak? | Yes | Yes | No — use theirs |
| Deploy Kong? | No | Yes | No — use theirs |
| CMS choice | Payload / WordPress | Strapi | Client's existing |
| Search engine | PostgreSQL FTS | PostgreSQL FTS | Client's existing |
| Custom Go services | No | No | Maybe (high-throughput) |
| Kafka | No | No | Only if they have it |
| Temporal | No | No | Only for complex workflows |
| Estimated adapters | 2-3 | 4-6 | 6-10 |
