# Adapter Selection — Decision Matrix

## How to Choose Adapters Per Engagement

For each BFF module, pick the adapter that matches the client's existing systems. If they don't have a system for that domain, use our default.

---

## CMS Module

| Client has... | Use adapter | Notes |
|--------------|-------------|-------|
| Nothing (new content needs) | `StrapiAdapter` (default) | Deploy Strapi alongside portal |
| WordPress | Build `WordPressAdapter` | REST API integration |
| Contentful | Build `ContentfulAdapter` | GraphQL/REST API |
| AEM | Build `AemAdapter` | Content Services API |
| Sitecore | Build `SitecoreAdapter` | Headless API |
| No CMS needed | Skip module | Remove from app.module.ts |

**Effort**: Existing adapter = 0 days. New adapter = 3-5 days.

---

## Storage Module

| Client has... | Use adapter | Notes |
|--------------|-------------|-------|
| AWS S3 | `S3Adapter` (default) | Standard AWS SDK |
| Azure Blob | Build `AzureBlobAdapter` | @azure/storage-blob SDK |
| Google Cloud Storage | Build `GcsAdapter` | Similar to S3 |
| On-prem file server | Build `SmbAdapter` | SMB/CIFS protocol |
| SharePoint document library | Build `SharePointAdapter` | Microsoft Graph API |

**Effort**: S3-compatible = 0 days. Azure/GCS = 2-3 days. SharePoint = 5-7 days.

---

## Notifications Module

| Client has... | Use adapter | Notes |
|--------------|-------------|-------|
| SMTP server | `SmtpAdapter` (default) | nodemailer |
| SendGrid | Build `SendGridAdapter` | REST API |
| AWS SES | Build `SesAdapter` | AWS SDK |
| Twilio (SMS) | Build `TwilioAdapter` | REST API |
| Client's notification platform | Build custom adapter | Per their API |

**Effort**: SMTP = 0 days. SendGrid/SES = 1-2 days. Custom = 3-5 days.

---

## Identity Module

| Client has... | Use adapter | Notes |
|--------------|-------------|-------|
| Nothing (we manage users) | `KeycloakAdminAdapter` (default) | Full user lifecycle |
| Azure AD | Build `AzureAdAdapter` | Microsoft Graph API |
| Okta | Build `OktaAdapter` | Okta Users API |
| LDAP / Active Directory | Build `LdapAdapter` | ldapjs library |
| Client manages users themselves | Skip module | Auth-only, no user management |

**Effort**: Keycloak = 0 days. Azure AD/Okta = 3-5 days. LDAP = 5-7 days.

---

## Search Module

| Client's data volume | Use adapter | Notes |
|---------------------|-------------|-------|
| < 100K records | `PostgresFtsAdapter` (default) | tsvector/tsquery |
| 100K-1M records | Consider OpenSearch | Deploy OpenSearch from optional/ |
| Client has Elasticsearch | Build `ElasticsearchAdapter` | Client's cluster |
| Client has Azure Cognitive Search | Build `AzureSearchAdapter` | REST API |

**Effort**: Postgres FTS = 0 days. OpenSearch = 2-3 days setup. Client search = 3-5 days.

---

## Integration Module

| Client system | Adapter approach | Effort |
|--------------|-----------------|--------|
| REST API (any) | `RestAdapter` (default) | Config only: 0.5 days |
| SOAP / XML API | Build `SoapAdapter` | 2-3 days |
| SAP (RFC/BAPI) | Build `SapAdapter` | 5-10 days (SAP connector) |
| Salesforce | Build `SalesforceAdapter` | 3-5 days (jsforce SDK) |
| ServiceNow | Build `ServiceNowAdapter` | 3-5 days (REST API) |
| Oracle DB direct | Build `OracleAdapter` | 3-5 days (oracledb driver) |
| File-based (SFTP/FTP) | Build `SftpAdapter` | 2-3 days |

**Key rule**: The RestAdapter handles 60% of integrations. Only build specialized adapters when the client system requires OAuth flows, custom serialization, or connection pooling.

---

## Quick Reference: "Which Adapters for This Engagement?"

### Insurance portal
- Auth: Keycloak or client's IdP
- CMS: Strapi (policy content, FAQ)
- Storage: S3 (claim documents)
- Notifications: SMTP or SendGrid (claim updates)
- Search: Postgres FTS (policy search)
- Documents: S3 (declarations, claim files)
- Integration: REST (claims system, billing system)

### Banking portal
- Auth: Client's IdP (always — regulated)
- CMS: Client's existing
- Storage: Client's (regulated data)
- Notifications: Client's (regulated communications)
- Search: Client's Elasticsearch
- Documents: Client's DMS
- Integration: SOAP (core banking), REST (card services)

### Employee portal
- Auth: Azure AD (most companies)
- CMS: Strapi (company news, policies)
- Storage: SharePoint or S3
- Notifications: SMTP (via Exchange)
- Search: Postgres FTS
- Documents: SharePoint
- Integration: REST (HRIS, payroll)
