# DXP Documentation

DXP is a delivery accelerator for enterprise portals: shared BFF adapters, reusable UI components, React SDK hooks, and starter apps.

## Start Here by OS

| OS | Recommended local mode | Primary docs |
|---|---|---|
| Windows | Script-first, no-docker | [quickstart.md](quickstart.md), [deployment.md](deployment.md) |
| macOS | Docker-first | [quickstart.md](quickstart.md), [deployment.md](deployment.md) |
| Linux | Docker-first | [quickstart.md](quickstart.md), [deployment.md](deployment.md) |

## Core Setup Commands

### Windows

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\configure-dxp.ps1 -NonInteractive -NodeDir "D:\soft\node-v24.14.0-win-x64"
powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -StartBff -StartPortal -StartPayer -HealthCheck -NodeDir "D:\soft\node-v24.14.0-win-x64"
```

### macOS/Linux

```bash
make up
make status
make dev
```

## Canonical Public Routing

Deploy under `/dxp`:
- `/dxp/` -> insurance portal
- `/dxp/api/*` -> BFF (`http://localhost:5021/api/*`)
- `/dxp/payer` -> payer portal
- `/dxp/storybook` -> Storybook static

## URLs (Local Dev)

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

## Documentation Map

### Setup and Deployment
- [quickstart.md](quickstart.md)
- [deployment.md](deployment.md)

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
