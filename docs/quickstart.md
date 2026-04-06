# Quick Start

This quick start is split by operating system and runtime mode.

## Runtime Matrix

| OS | Recommended mode | Infra model |
|---|---|---|
| Windows | No-docker local mode | Use local/external infra endpoints; start apps via PowerShell scripts |
| macOS | Docker flow | Start Keycloak/Kong/HAPI with `make up` |
| Linux | Docker flow | Start Keycloak/Kong/HAPI with `make up` |

## Common Prerequisites

- Node.js >= 22
- pnpm >= 10 (via corepack)
- PostgreSQL local
- Redis local (optional in no-docker mode)

## 1. Clone and install

```bash
git clone <repo-url> dxp
cd dxp
pnpm install
cp .env.example .env
```

## 2. Windows (no-docker path)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\configure-dxp.ps1 -NonInteractive -NodeDir "D:\soft\node-v24.14.0-win-x64"
powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -StartBff -StartPortal -StartPayer -HealthCheck -NodeDir "D:\soft\node-v24.14.0-win-x64"
```

Notes:
- Do not use `make` in this path.
- `-StartFhir` supports local no-docker mode (Java 17 + PostgreSQL required).
- For FHIR features, set `FHIR_BASE_URL` to a reachable endpoint.
- Payer starter defaults to `VITE_BFF_URL=/dxp/api/v1` (works with nginx route `/dxp/api -> BFF`).
- `DEV_MEMBER_ID` must be a plain UUID (example: `7de24de3-a6ee-464e-88ad-004799281205`), not `DEV_MEMBER_ID=<uuid>`.

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

## 5. FHIR Seed

Seed only when `FHIR_BASE_URL` is reachable:

```powershell
cd apps\bff
& "D:\soft\node-v24.14.0-win-x64\corepack.cmd" pnpm seed:fhir
```

Or on macOS/Linux:

```bash
make fhir-seed
```

## 6. Windows Redeploy (scripts folder)

Use this when code has changed and you need to republish/restart services:

```powershell
# 1) Re-apply environment/config if needed
powershell -ExecutionPolicy Bypass -File .\scripts\configure-dxp.ps1 -NonInteractive -NodeDir "D:\soft\node-v24.14.0-win-x64"

# 2) Rebuild + publish static portals to nginx
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-dxp-static.ps1 -NodeDir "D:\soft\node-v24.14.0-win-x64" -RepoRoot "D:\dxp" -NginxHtmlRoot "C:\nginx\html"

# 3) Rebuild + reinstall/restart BFF Windows service
powershell -ExecutionPolicy Bypass -File .\scripts\install-dxp-bff-service.ps1 -NodeDir "D:\soft\node-v24.14.0-win-x64" -RepoRoot "D:\dxp" -ServiceName "DxpBff" -NssmExe "C:\nssm\win64\nssm.exe" -BuildBff

# 4) Start and verify local FHIR (optional)
powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -StartFhir -NodeDir "D:\soft\node-v24.14.0-win-x64"
powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -FhirStatus -NodeDir "D:\soft\node-v24.14.0-win-x64"
```

## 7. Troubleshooting seeded data not showing in payer portal

If FHIR seed succeeds but `/dxp/payer` still shows fallback/mock data:

1. Fix malformed member id in `.env` (plain UUID only), then restart BFF.
2. In browser DevTools Console, run `localStorage.removeItem('dxp_dev_member_id')`.
3. Reload `/dxp/payer` and select a member from the avatar menu.
