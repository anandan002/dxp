param(
  [string]$NodeDir = "D:\soft\node-v24.14.0-win-x64",
  [string]$RepoRoot = "D:\dxp",
  # Deprecated: kept only for backward-compatible invocation; this script no longer copies files to nginx root.
  [string]$NginxHtmlRoot = "C:\nginx\html"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-PnpmAt {
  param(
    [string]$WorkingDir,
    [string[]]$PnpmArgs
  )

  $pnpmCmd = Join-Path $NodeDir "pnpm.cmd"
  $corepackCmd = Join-Path $NodeDir "corepack.cmd"

  Push-Location $WorkingDir
  try {
    if (Test-Path $pnpmCmd) {
      & $pnpmCmd @PnpmArgs
    } elseif (Test-Path $corepackCmd) {
      & $corepackCmd pnpm @PnpmArgs
    } else {
      throw "Neither pnpm.cmd nor corepack.cmd found under '$NodeDir'."
    }
    if ($LASTEXITCODE -ne 0) {
      throw "pnpm command failed in '$WorkingDir' with exit code ${LASTEXITCODE}: pnpm $($PnpmArgs -join ' ')"
    }
  } finally {
    Pop-Location
  }
}

$insuranceDir = Join-Path $RepoRoot "starters\insurance-portal"
$payerDir = Join-Path $RepoRoot "starters\payer-portal"
$uiDir = Join-Path $RepoRoot "packages\ui"
$storybookPublicDir = Join-Path $insuranceDir "public\storybook"

Write-Step "Building Storybook static"
if (Test-Path $storybookPublicDir) {
  Remove-Item -LiteralPath $storybookPublicDir -Recurse -Force
}
Invoke-PnpmAt -WorkingDir $uiDir -PnpmArgs @("exec", "storybook", "build", "-o", $storybookPublicDir)
Write-Host "  + Storybook static generated at: $storybookPublicDir" -ForegroundColor Green

Write-Step "Building insurance portal"
Invoke-PnpmAt -WorkingDir $insuranceDir -PnpmArgs @("exec", "vite", "build")

Write-Step "Building payer portal"
Invoke-PnpmAt -WorkingDir $payerDir -PnpmArgs @("exec", "vite", "build")

$insuranceDist = Join-Path $insuranceDir "dist"
$payerDist = Join-Path $payerDir "dist"
$insuranceStorybookDist = Join-Path $insuranceDist "storybook"

if (-not (Test-Path $insuranceDist)) {
  throw "Insurance portal dist not found: $insuranceDist"
}
if (-not (Test-Path $payerDist)) {
  throw "Payer portal dist not found: $payerDist"
}

Write-Step "Build completed (no copy to nginx root)"
Write-Host "  + Insurance portal build: $insuranceDist" -ForegroundColor Green
Write-Host "  + Payer portal build:     $payerDist" -ForegroundColor Green
if (Test-Path $insuranceStorybookDist) {
  Write-Host "  + Storybook static build:  $insuranceStorybookDist" -ForegroundColor Green
} else {
  Write-Host "  ! Storybook folder not found in insurance dist: $insuranceStorybookDist" -ForegroundColor Yellow
}
Write-Host "  - Configure nginx alias/root to serve these project dist folders directly." -ForegroundColor Gray
