# Quick Start

This quick start is split by operating system and runtime model.

## Runtime Matrix

| OS | Recommended mode | Infra model |
|---|---|---|
| Windows | No-docker, script-first | Local/external infra endpoints, optional local HAPI |
| macOS | Docker-first | `docker compose` via `make up` |
| Linux | Docker-first | `docker compose` via `make up` |

## Common Prerequisites

- Node.js >= 22
- pnpm >= 10 (`corepack`)
- PostgreSQL local
- `.env` from `.env.example`

## 1. Clone and install

```bash
git clone <repo-url> dxp
cd dxp
pnpm install
cp .env.example .env
```

Set minimum values in `.env`:

```env
POSTGRES_USER=dxp
POSTGRES_PASSWORD=<password>
POSTGRES_DB=dxp
VITE_BFF_URL=/dxp/api/v1
FHIR_BASE_URL=http://localhost:5028/fhir
```

## 2. Windows (no-docker path)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\configure-dxp.ps1 -NonInteractive -NodeDir "D:\soft\node-v24.14.0-win-x64"
powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -StartBff -StartPortal -StartPayer -HealthCheck -NodeDir "D:\soft\node-v24.14.0-win-x64"
```

Notes:
- Do not use `make` in this path.
- `-StartFhir` runs local HAPI FHIR without Docker (Java 17 + PostgreSQL).
- For seeded payer data, `FHIR_BASE_URL` must be reachable.

## 3. macOS/Linux (docker path)

```bash
make up
make status
make dev
```

## 4. Verify

- Portal: http://localhost:5020
- BFF API: http://localhost:5021/api/v1
- Swagger: http://localhost:5021/api/docs
- Payer portal: http://localhost:5022
- Keycloak: http://localhost:5025
- Kong admin: http://localhost:5027
- HAPI FHIR: http://localhost:5028/fhir

## 5. FHIR seed

Windows:

```powershell
cd apps\bff
& "D:\soft\node-v24.14.0-win-x64\corepack.cmd" pnpm seed:fhir
```

macOS/Linux:

```bash
make fhir-seed
```

## 6. Routing contract for deployment

Canonical public base path is `/dxp`:
- `/dxp/` -> insurance portal static
- `/dxp/api/*` -> BFF API
- `/dxp/payer` -> payer portal static
- `/dxp/storybook` -> Storybook static

See full deployment steps in [deployment.md](deployment.md).

## 7. Troubleshooting (payer shows mock data after seed)

If seed succeeds but `/dxp/payer` still shows fallback data:

1. Ensure `.env` has `DEV_MEMBER_ID` as plain UUID only.
2. Restart BFF.
3. In browser console: `localStorage.removeItem('dxp_dev_member_id')`
4. Reload `/dxp/payer` and select a member from avatar menu.
