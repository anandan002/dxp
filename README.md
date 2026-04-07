# DXP - Digital Experience Platform

A delivery accelerator for building enterprise portals with a shared BFF, UI library, SDK, and starter apps.

## Platform Support

| OS | Recommended Local Mode | Deployment Mode |
|---|---|---|
| Windows | Script-first, no-docker | Windows services + nginx static |
| macOS | Docker-first | Docker compose + nginx/static hosting |
| Linux | Docker-first | Docker compose + nginx/static hosting |

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | >= 22 | Windows: use `-NodeDir`; macOS/Linux: `nvm` or system package |
| pnpm | >= 10 | Use `corepack` |
| PostgreSQL | >= 16 | Required for BFF + local HAPI |
| Java | >= 17 | Required only for Windows local HAPI no-docker flow |
| Docker | latest | Required for docker-first macOS/Linux flow |

## Quick Start

```bash
git clone <repo-url> dxp
cd dxp
pnpm install
cp .env.example .env
```

Set at least:

```env
POSTGRES_USER=dxp
POSTGRES_PASSWORD=<password>
POSTGRES_DB=dxp
VITE_BFF_URL=/dxp/api/v1
FHIR_BASE_URL=http://localhost:5028/fhir
```

### Windows (No-Docker, Script-First)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\configure-dxp.ps1 -NonInteractive -NodeDir "D:\soft\node-v24.14.0-win-x64"
powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -StartBff -StartPortal -StartPayer -HealthCheck -NodeDir "D:\soft\node-v24.14.0-win-x64"
```

### macOS/Linux (Docker-First)

```bash
make up
make status
make dev
```

## Deployment

Canonical public base path is `/dxp`:
- Portal: `/dxp/`
- BFF: `/dxp/api/*` -> `http://localhost:5021/api/*`
- Payer: `/dxp/payer`
- Storybook: `/dxp/storybook`

For full OS-specific deployment steps (Windows services, Linux `systemd`, macOS `launchd`, nginx publish flow), see:
- [docs/deployment.md](docs/deployment.md)

## Local URLs (Dev)

| Service | URL |
|---|---|
| Portal | http://localhost:5020 |
| BFF API | http://localhost:5021/api/v1 |
| Swagger | http://localhost:5021/api/docs |
| Payer portal | http://localhost:5022 |
| Keycloak | http://localhost:5025 |
| Kong proxy | http://localhost:5026 |
| Kong admin | http://localhost:5027 |
| HAPI FHIR | http://localhost:5028/fhir |

## Command Reference

### Windows

```powershell
# Configure + install dependencies
powershell -ExecutionPolicy Bypass -File .\scripts\configure-dxp.ps1 -NonInteractive -NodeDir "D:\soft\node-v24.14.0-win-x64"

# Start app processes
powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -StartBff -StartPortal -StartPayer -NodeDir "D:\soft\node-v24.14.0-win-x64"

# Local FHIR lifecycle
powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -StartFhir -NodeDir "D:\soft\node-v24.14.0-win-x64"
powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -FhirStatus -NodeDir "D:\soft\node-v24.14.0-win-x64"
powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -SeedFhir -NodeDir "D:\soft\node-v24.14.0-win-x64"
```

### macOS/Linux

```bash
make up
make dev
make status
make down
make fhir-seed
```

## Troubleshooting

### Windows: `make` is not recognized

Use `scripts/configure-dxp.ps1` and `scripts/run-dxp.ps1` instead of `make`.

### Seed fails with `fetch failed`

`FHIR_BASE_URL` is unreachable:

```bash
curl http://localhost:5028/fhir/metadata
```

### BFF health returns 500

`/api/v1/health` checks upstream dependencies (for example Keycloak). Verify `.env` URLs and credentials.

## Repository Structure

```text
apps/bff/                    NestJS BFF
apps/playground/             API playground app
packages/ui/                 Shared UI components
packages/sdk-react/          React SDK hooks/client
packages/contracts/          Shared TypeScript contracts
starters/insurance-portal/   Portal starter
starters/payer-portal/       Payer starter
infra/                       Keycloak and Kong configuration
scripts/                     Windows setup/start/deploy helpers
docs/                        Documentation
```
