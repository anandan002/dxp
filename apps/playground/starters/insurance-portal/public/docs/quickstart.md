# Quick Start

## Prerequisites

- Node.js >= 22
- pnpm >= 10
- Docker (for Keycloak + Kong)
- PostgreSQL (local)
- Redis (local)

## Setup

```bash
# Clone and install
git clone <repo-url> dxp && cd dxp
pnpm install

# Start infrastructure (Keycloak + Kong)
make up

# Check everything is healthy
make status
```

Expected output:
```
--- Service Health ---
PostgreSQL: UP (local)
Redis:      UP (local)
Keycloak:   UP (dxp realm)
Kong:       UP
```

## Run the BFF

```bash
cd apps/bff && pnpm start:dev
```

- BFF API: http://localhost:4201/api/v1
- Swagger Docs: http://localhost:4201/api/docs

## Run the Insurance Portal (demo)

```bash
cd starters/insurance-portal && pnpm dev
```

Open http://localhost:4200

## Start a New Engagement

```bash
# Copy the Next.js starter
cp -r starters/portal-nextjs my-client-portal
cd my-client-portal

# Configure for the client
# Edit src/lib/dxp.ts with client's BFF URL and Keycloak settings
# Edit tailwind.config.js with client's brand colors

pnpm dev
```

## Keycloak Admin

- URL: http://localhost:8080
- Username: `admin`
- Password: `admin`
- DXP Realm: pre-configured with `platform-admin`, `portal-admin`, `portal-user` roles
- Test users: `admin@dxp.local` / `admin`, `user@acme.local` / `user`
