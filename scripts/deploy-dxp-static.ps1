param(
  [string]$NodeDir = "D:\soft\node-v24.14.0-win-x64",
  [string]$RepoRoot = "D:\dxp",
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

function Publish-StaticDist {
  param(
    [string]$SourceDist,
    [string]$DestinationDir
  )

  if (-not (Test-Path $SourceDist)) {
    throw "Build output not found: $SourceDist"
  }

  if (Test-Path $DestinationDir) {
    Remove-Item -LiteralPath $DestinationDir -Recurse -Force
  }
  New-Item -ItemType Directory -Path $DestinationDir -Force | Out-Null
  Copy-Item -Path (Join-Path $SourceDist "*") -Destination $DestinationDir -Recurse -Force
}

$insuranceDir = Join-Path $RepoRoot "starters\insurance-portal"
$payerDir = Join-Path $RepoRoot "starters\payer-portal"

Write-Step "Building insurance portal"
Invoke-PnpmAt -WorkingDir $insuranceDir -PnpmArgs @("exec", "vite", "build")

Write-Step "Building payer portal"
Invoke-PnpmAt -WorkingDir $payerDir -PnpmArgs @("exec", "vite", "build")

Write-Step "Publishing static assets to nginx html root"
$dxpDir = Join-Path $NginxHtmlRoot "dxp"
$dxpPayerDir = Join-Path $dxpDir "payer"

Publish-StaticDist -SourceDist (Join-Path $insuranceDir "dist") -DestinationDir $dxpDir
Publish-StaticDist -SourceDist (Join-Path $payerDir "dist") -DestinationDir $dxpPayerDir

Write-Host "  + Published insurance portal to: $dxpDir" -ForegroundColor Green
Write-Host "  + Published payer portal to:     $dxpPayerDir" -ForegroundColor Green
