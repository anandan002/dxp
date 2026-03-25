# DXP — Digital Experience Platform

A delivery accelerator for building enterprise portals in weeks, not months.

Developed by **Bharath** | Co-authored with **Claude** (Anthropic)

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >= 22 | `brew install node` |
| pnpm | >= 10 | `brew install pnpm` |
| Docker | Latest | [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| PostgreSQL | >= 16 | `brew install postgresql@16 && brew services start postgresql@16` |
| Redis | >= 7 | `brew install redis && brew services start redis` |

## Setup — From Clone to Running

### 1. Clone and Install

```bash
git clone https://github.com/beedev/dxp.git
cd dxp
pnpm install
```

### 2. Set Up PostgreSQL

PostgreSQL runs locally (not in Docker). If you just installed it:

```bash
# Verify PostgreSQL is running
pg_isready
# Should output: /tmp:5432 - accepting connections

# Create the DXP database
createdb dxp

# Verify
psql -d dxp -c "SELECT 1;"
```

If your local Postgres uses a different user or requires a password:

```bash
# Create a dedicated user (optional)
psql -d postgres -c "CREATE USER dxp WITH PASSWORD 'your-password';"
psql -d postgres -c "CREATE DATABASE dxp OWNER dxp;"
```

### 3. Set Up Redis

Redis also runs locally:

```bash
# Verify Redis is running
redis-cli ping
# Should output: PONG
```

If Redis isn't running:

```bash
brew services start redis
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your local Postgres credentials:

```env
# If using default Homebrew Postgres (no password, your OS username):
POSTGRES_USER=<your-username>
POSTGRES_PASSWORD=
POSTGRES_DB=dxp

# If using the dedicated dxp user:
POSTGRES_USER=dxp
POSTGRES_PASSWORD=your-password
POSTGRES_DB=dxp
```

### 5. Start Keycloak and Kong

You have two options — Docker (recommended, easiest) or local install (no Docker needed).

#### Option A: Docker (recommended)

```bash
make up
```

This starts Keycloak and Kong in Docker containers that connect to your local PostgreSQL. Wait ~30 seconds for Keycloak to start, then verify:

```bash
make status
```

#### Option B: Local Install (no Docker)

If you can't or don't want to run Docker, install Keycloak and Kong natively.

**Install Keycloak locally:**

```bash
# Download Keycloak 26.x
curl -LO https://github.com/keycloak/keycloak/releases/download/26.2.5/keycloak-26.2.5.tar.gz
tar xzf keycloak-26.2.5.tar.gz
cd keycloak-26.2.5

# Configure to use your local PostgreSQL
export KC_DB=postgres
export KC_DB_URL=jdbc:postgresql://localhost:5432/dxp
export KC_DB_USERNAME=<your-postgres-user>
export KC_DB_PASSWORD=<your-postgres-password>
export KC_BOOTSTRAP_ADMIN_USERNAME=admin
export KC_BOOTSTRAP_ADMIN_PASSWORD=admin
export KC_HEALTH_ENABLED=true

# Start in dev mode (first run creates tables)
bin/kc.sh start-dev --import-realm

# Keycloak is now at http://localhost:8080
```

**Import the DXP realm:**

```bash
# Copy realm config to Keycloak's import directory
cp /path/to/dxp/infra/keycloak/dxp-realm.json data/import/

# Restart Keycloak — it auto-imports on start
bin/kc.sh start-dev --import-realm
```

Or import manually via the admin console:
1. Open http://localhost:8080 → log in as `admin` / `admin`
2. Click the realm dropdown → **Create realm**
3. Click **Browse** → select `infra/keycloak/dxp-realm.json`
4. Click **Create**

**Install Kong locally:**

```bash
# macOS via Homebrew
brew install kong

# Create Kong config directory
mkdir -p /etc/kong

# Copy the declarative config
cp /path/to/dxp/infra/kong/kong.yml /etc/kong/kong.yml

# Set environment variables
export KONG_DATABASE=off
export KONG_DECLARATIVE_CONFIG=/etc/kong/kong.yml
export KONG_PROXY_LISTEN=0.0.0.0:8000
export KONG_ADMIN_LISTEN=127.0.0.1:8001

# Start Kong
kong start

# Kong proxy is now at http://localhost:8000
# Kong admin is at http://localhost:8001
```

**Update the BFF CORS** (if Keycloak is on a non-default port):

If your local Keycloak runs on a different port, update `.env`:

```env
KEYCLOAK_URL=http://localhost:<your-port>
```

**Verify local setup:**

```bash
# Check Keycloak
curl -sf http://localhost:8080/realms/dxp | python3 -c "import sys,json; print('Keycloak:', json.load(sys.stdin)['realm'])"

# Check Kong
curl -sf http://localhost:8001/status | python3 -c "import sys,json; print('Kong:', json.load(sys.stdin)['server']['connections_accepted'], 'connections')"

# Check Postgres
pg_isready && echo "PostgreSQL: UP"

# Check Redis
redis-cli ping
```

**Run without `make up`:**

Since Keycloak and Kong are running locally, skip `make up` and go straight to:

```bash
make dev
```

#### Both options — expected status

```
--- Service Health ---
PostgreSQL: UP (local)
Redis:      UP (local)
Keycloak:   UP (dxp realm)
Kong:       UP
```

### 6. Verify Keycloak Setup

Keycloak auto-imports the `dxp` realm with pre-configured users and clients.

Open `http://localhost:8080` and log in with:
- **Username**: `admin`
- **Password**: `admin`

Click "dxp" realm in the dropdown. You should see:

| Item | Pre-configured |
|------|---------------|
| Realm | `dxp` |
| Clients | `dxp-bff` (confidential), `dxp-shell` (public/PKCE) |
| Roles | `platform-admin`, `portal-admin`, `portal-user` |
| Test Users | `admin@dxp.local` / `admin`, `user@acme.local` / `user` |

### 7. Start the Platform

```bash
make dev
```

This starts both the BFF (backend) and the Portal (frontend). Wait ~10 seconds, then open:

**http://localhost:4200**

You should see the Insurance Customer Service Portal with:
- Dashboard (metric cards, claims, notifications)
- Sidebar navigation (Dashboard, My Policies, Claims, Documents)
- Dev Tools in the sidebar bottom (API Playground, Docs, Storybook, Swagger)

### 8. Test Authentication

1. Click **API Playground** in the sidebar
2. In the Keycloak Authentication panel, click **Login with Keycloak**
3. Default credentials are pre-filled: `admin@dxp.local` / `admin`
4. You should see: user profile, roles (`platform-admin`), tenant ID
5. Now click any endpoint in the playground and hit **Send Request** — the JWT token is automatically attached

## All URLs

| Service | URL |
|---------|-----|
| Portal (everything) | http://localhost:4200 |
| API Playground | http://localhost:4200/playground |
| Documentation | http://localhost:4200/docs |
| Storybook | http://localhost:4200/storybook |
| Swagger API Docs | http://localhost:4200/api/docs |
| Keycloak Admin | http://localhost:8080 |
| Kong Admin | http://localhost:8001 |

## Make Commands

```
make up              Start Keycloak + Kong (uses local Postgres & Redis)
make dev             Start BFF + Portal (everything on localhost:4200)
make dev-bff         Start BFF only (localhost:4201)
make dev-portal      Start portal only (requires BFF running)
make down            Stop Docker services
make status          Health check all services
make build-storybook Rebuild Storybook static build
make test            Run all tests
make lint            Run linters
```

## Troubleshooting

### "Port 5432 already in use" or Keycloak can't connect to Postgres

Keycloak connects to your local Postgres via `host.docker.internal:5432`. Make sure:

```bash
# Postgres is running
pg_isready

# The dxp database exists
psql -l | grep dxp

# Postgres accepts connections from Docker
# Check pg_hba.conf allows connections from 172.x.x.x (Docker network)
# On macOS with Homebrew, this usually works out of the box
```

### Keycloak shows "realm not found"

The realm auto-imports on first start. If Keycloak started before Postgres was ready:

```bash
make down
make up
# Wait 30 seconds
make status
```

### "CORS error" or "Failed to fetch" in the Playground

The BFF must be running. Check:

```bash
curl http://localhost:4201/api/v1/health
```

If it's not running, start it:

```bash
make dev-bff
```

### Kong returns 502 Bad Gateway

Kong routes to the BFF at `localhost:4201`. If the BFF isn't running, Kong returns 502.

```bash
# Start BFF
make dev-bff

# Verify Kong can reach it
curl http://localhost:8000/api/v1/health
```

### Redis connection refused

```bash
brew services start redis
redis-cli ping  # Should return PONG
```

### "Cannot find module" errors after clone

```bash
pnpm install
```

### Storybook page is blank at /storybook

Storybook is served as a static build. Rebuild it:

```bash
make build-storybook
```

## Project Structure

```
dxp/
  apps/bff/               NestJS BFF — 9 adapter modules
  packages/ui/             Component library (@dxp/ui) — 16 components
  packages/sdk-react/      React hooks (@dxp/sdk-react)
  packages/contracts/      Shared TypeScript types
  starters/
    insurance-portal/      Sample insurance portal (the demo)
    portal-nextjs/         Generic Next.js starter (clone per engagement)
  optional/                Bring-if-needed (Go services, Kafka)
  infra/                   Keycloak realm, Kong config
  docs/                    Documentation + engagement playbook
  TODO-PRODUCTION.md       Production hardening checklist
```

## What's Next

- Read the [full documentation](http://localhost:4200/docs) for architecture, adapters, components, and the engagement playbook
- Explore the [API Playground](http://localhost:4200/playground) to see all BFF endpoints
- Browse [Storybook](http://localhost:4200/storybook) to see all UI components with interactive controls
- Check `TODO-PRODUCTION.md` for the production hardening checklist
