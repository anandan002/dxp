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
- `-StartFhir` requires Docker; skip it in no-docker mode.
- For FHIR features, set `FHIR_BASE_URL` to a reachable endpoint.

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
