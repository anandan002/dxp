# Deployment Guide

This guide documents supported deployment paths for Windows, Linux, and macOS.

## Deployment Matrix

| OS | Recommended path | Process model |
|---|---|---|
| Windows | Script-first + nginx static | NSSM-managed Windows services |
| Linux | Docker-first + nginx static | `docker compose` + `systemd` (optional for BFF) |
| macOS | Docker-first + nginx static | `docker compose` + `launchd` (optional for BFF) |

## Canonical Public Routing

Use `/dxp` as the public base path:
- `/dxp/` -> insurance portal
- `/dxp/api/*` -> `http://localhost:5021/api/*`
- `/dxp/payer` -> payer portal
- `/dxp/storybook` -> Storybook static

## Windows Deployment

### 1) Configure and install dependencies

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\configure-dxp.ps1 -NonInteractive -NodeDir "D:\soft\node-v24.14.0-win-x64"
```

### 2) Build static assets in project folders (no copy)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-dxp-static.ps1 -NodeDir "D:\soft\node-v24.14.0-win-x64" -RepoRoot "D:\dxp"
```

### 3) Install/update BFF Windows service

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-dxp-bff-service.ps1 -NodeDir "D:\soft\node-v24.14.0-win-x64" -RepoRoot "D:\dxp" -ServiceName "DxpBff" -NssmExe "C:\nssm\win64\nssm.exe" -BuildBff
```

### 4) Install/update local FHIR service (optional)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-dxp-fhir-service.ps1 -NodeDir "D:\soft\node-v24.14.0-win-x64" -RepoRoot "D:\dxp" -ServiceName "DxpFhir" -NssmExe "C:\nssm\win64\nssm.exe"
```

## Linux/macOS Deployment (Docker-First)

### 1) Start infra and app runtime dependencies

```bash
make up
make status
```

### 2) Build application artifacts

```bash
make build-storybook
cd starters/insurance-portal && pnpm build
cd ../payer-portal && pnpm build
```

### 3) Serve dist folders directly from nginx

Point nginx `alias`/`root` to project `dist` directories:
- insurance: `<repo-root>/starters/insurance-portal/dist`
- payer: `<repo-root>/starters/payer-portal/dist`

### 4) Run BFF

Option A (recommended for docker-first local stacks): run via development command:

```bash
make dev-bff
```

Option B (host-managed service):
- Linux: create a `systemd` unit for `node apps/bff/dist/main.js`.
- macOS: create a `launchd` plist for the same entrypoint.

## Nginx Route Example

```nginx
location /dxp/ {
  alias D:/dxp/starters/insurance-portal/dist/;
  index index.html;
  try_files $uri $uri/ /dxp/index.html;
}

location /dxp/payer/ {
  alias D:/dxp/starters/payer-portal/dist/;
  index index.html;
  try_files $uri $uri/ /dxp/payer/index.html;
}

location /dxp/api/ {
  proxy_pass http://localhost:5021/api/;
}
```

## Redeploy Checklist

1. Pull latest code.
2. Rebuild static artifacts (`dist`) in project folders.
3. Ensure nginx still points to project `dist` folders.
4. Restart BFF service/process.
5. Validate:
   - `http://localhost:5021/api/v1/health`
   - `/dxp/`, `/dxp/payer`, `/dxp/storybook/index.html`
