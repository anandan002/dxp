# DXP Documentation

DXP is a delivery accelerator for enterprise portals: shared BFF adapters, reusable UI components, React SDK hooks, and starter apps.

## Start Here by OS

| OS | Recommended local mode | Primary startup commands |
|---|---|---|
| Windows | No-docker mode | `scripts/configure-dxp.ps1`, `scripts/run-dxp.ps1` |
| macOS | Docker flow | `make up`, `make dev`, `make status` |
| Linux | Docker flow | `make up`, `make dev`, `make status` |

## Local Setup Commands

### Windows (PowerShell, no-docker)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\configure-dxp.ps1 -NonInteractive -NodeDir "D:\soft\node-v24.14.0-win-x64"
powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -StartBff -StartPortal -StartPayer -HealthCheck -NodeDir "D:\soft\node-v24.14.0-win-x64"
```

Notes:
- Windows path is script-first; `make` is not required.
- `-StartFhir` requires Docker. In no-docker Windows mode, use external/manual FHIR and set `FHIR_BASE_URL` in `.env`.

### macOS/Linux (docker flow)

```bash
make up
make status
make dev
```

## URLs

| Service | URL |
|---|---|
| Portal | http://localhost:5020 |
| BFF | http://localhost:5021/api/v1 |
| Swagger | http://localhost:5021/api/docs |
| Payer portal | http://localhost:5022 |
| Keycloak | http://localhost:5025 |
| Kong proxy | http://localhost:5026 |
| Kong admin | http://localhost:5027 |
| HAPI FHIR | http://localhost:5028/fhir |

## Core Concepts

- BFF modules use a port/adapter pattern for provider swaps by environment variable.
- `@dxp/ui` contains reusable enterprise UI components.
- `@dxp/sdk-react` exposes typed client hooks for portal apps.
- Starters provide engagement-ready portal scaffolding.

## Documentation Map

### Architecture
- [architecture/overview.md](architecture/overview.md)
- [architecture/modules.md](architecture/modules.md)
- [architecture/adapter-pattern.md](architecture/adapter-pattern.md)

### Starters
- [starters/insurance-portal.md](starters/insurance-portal.md)
- [starters/nextjs.md](starters/nextjs.md)

### SDK and UI
- [sdk-react.md](sdk-react.md)
- [components.md](components.md)
- [theming.md](theming.md)

### Delivery Playbook
- [playbook/client-profiles.md](playbook/client-profiles.md)
- [playbook/phase-scoping.md](playbook/phase-scoping.md)
- [playbook/adapter-selection.md](playbook/adapter-selection.md)
- [playbook/tech-approval.md](playbook/tech-approval.md)
- [playbook/estimation.md](playbook/estimation.md)

## Command Reference

### Windows

```powershell
# Start app processes
powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -StartBff -StartPortal -StartPayer -NodeDir "D:\soft\node-v24.14.0-win-x64"

# Optional checks
powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -HealthCheck -NodeDir "D:\soft\node-v24.14.0-win-x64"
```

### macOS/Linux

```bash
make up
make dev
make down
make status
make fhir-seed
make fhir-reset
```
