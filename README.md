# DXP - Digital Experience Platform

A delivery accelerator for building enterprise portals with a shared BFF, UI library, SDK, and starter apps.

## Platform Support

| OS | Recommended Local Mode | Notes |
|---|---|---|
| Windows | No-docker local mode | Script-first flow using PowerShell; `make` is not required. |
| macOS | Docker flow | Use `make up` / `make dev` for infra + app startup. |
| Linux | Docker flow | Use `make up` / `make dev` for infra + app startup. |

## Prerequisites

| Tool | Version | Windows | macOS | Linux |
|---|---|---|---|---|
| Node.js | >= 22 | Use custom Node path (example used here: `D:\soft\node-v24.14.0-win-x64`) | Install via Homebrew/nvm | Install via distro package/nvm |
| pnpm | >= 10 | Use `corepack` from the same Node path | `corepack enable` | `corepack enable` |
| PostgreSQL | >= 16 | Local service | Local service | Local service |
| Redis | >= 7 | Optional in no-docker mode | Local service | Local service |
| Docker | latest | Optional | Required for docker flow | Required for docker flow |

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/beedev/dxp.git
cd dxp
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Set at least:

```env
POSTGRES_USER=dxp
POSTGRES_PASSWORD=<your-password-or-empty>
POSTGRES_DB=dxp
FHIR_BASE_URL=http://localhost:5028/fhir
```

### 3. Start by OS

#### Windows (no-docker, script-first)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\configure-dxp.ps1 -NonInteractive -NodeDir "D:\soft\node-v24.14.0-win-x64"
powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -StartBff -StartPortal -StartPayer -HealthCheck -NodeDir "D:\soft\node-v24.14.0-win-x64"
```

Windows notes:
- `make` commands are not used in this path.
- `-StartFhir` needs Docker. In no-docker mode, use an external/manual FHIR endpoint.
- Seed command works only when `FHIR_BASE_URL` is reachable.

#### macOS/Linux (docker flow)

```bash
make up
make status
make dev
```

#### macOS/Linux (no-docker optional flow)

```bash
cd apps/bff && pnpm start:dev
cd starters/insurance-portal && pnpm dev
```

## Local URLs

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

### Windows (PowerShell)

```powershell
# Full local setup
powershell -ExecutionPolicy Bypass -File .\scripts\configure-dxp.ps1 -NodeDir "D:\soft\node-v24.14.0-win-x64"

# Start app processes
powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -StartBff -StartPortal -StartPayer -NodeDir "D:\soft\node-v24.14.0-win-x64"

# Optional checks and approvals
powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -HealthCheck -ApproveBuilds -NodeDir "D:\soft\node-v24.14.0-win-x64"
```

### macOS/Linux (`make`)

```bash
make up              # Start infra (Keycloak + Kong + HAPI FHIR via docker compose)
make dev             # Start BFF + portal
make dev-bff         # Start BFF only
make dev-portal      # Start portal only
make status          # Health check services
make down            # Stop docker services
make fhir-seed       # Seed FHIR data
make fhir-reset      # Reset + reseed FHIR
make build-storybook # Rebuild Storybook static
```

## Troubleshooting

### Windows: `make` is not recognized

Use PowerShell scripts instead:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -StartBff -StartPortal -NodeDir "D:\soft\node-v24.14.0-win-x64"
```

### Windows: pnpm uses wrong Node version

Use NodeDir-based commands:

```powershell
& "D:\soft\node-v24.14.0-win-x64\corepack.cmd" pnpm --version
```

### FHIR seed fails with `fetch failed`

`FHIR_BASE_URL` is unreachable.

Check:

```powershell
curl http://localhost:5028/fhir/metadata
```

If running no-docker Windows mode, point `FHIR_BASE_URL` to an external/manual FHIR endpoint.

### BFF health returns 500

`/api/v1/health` checks upstream dependencies (for example Keycloak). Verify related URLs and credentials in `.env`.

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
