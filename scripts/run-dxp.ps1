param(
  [string]$NodeDir = "D:\soft\node-v24.14.0-win-x64",
  [switch]$StartBff,
  [switch]$StartPortal,
  [switch]$StartPayer,
  [switch]$StartFhir,
  [switch]$SeedFhir,
  [switch]$HealthCheck,
  [switch]$ApproveBuilds,
  [switch]$All
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Ok {
  param([string]$Message)
  Write-Host "  + $Message" -ForegroundColor Green
}

function Write-WarnMsg {
  param([string]$Message)
  Write-Host "  ! $Message" -ForegroundColor Yellow
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$pnpmCmd = Join-Path $NodeDir "pnpm.cmd"
$corepackCmd = Join-Path $NodeDir "corepack.cmd"

if (-not (Test-Path $pnpmCmd) -and -not (Test-Path $corepackCmd)) {
  throw "pnpm/corepack not found under '$NodeDir'."
}

function Invoke-Pnpm {
  param(
    [string]$WorkingDir,
    [string[]]$Args
  )

  Push-Location $WorkingDir
  try {
    if (Test-Path $pnpmCmd) {
      & $pnpmCmd @Args
    } else {
      & $corepackCmd pnpm @Args
    }
  } finally {
    Pop-Location
  }
}

function Start-PnpmInNewWindow {
  param(
    [string]$WorkingDir,
    [string]$CommandLabel,
    [string]$ScriptCommand
  )

  $cmd = "Set-Location -LiteralPath '$WorkingDir'; $ScriptCommand"
  Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", $cmd | Out-Null
  Write-Ok "$CommandLabel started in a new PowerShell window."
}

function Wait-ForFhir {
  param(
    [int]$MaxAttempts = 40,
    [int]$DelaySeconds = 3
  )

  for ($i = 1; $i -le $MaxAttempts; $i++) {
    try {
      $resp = Invoke-WebRequest -Uri "http://localhost:5028/fhir/metadata" -UseBasicParsing -TimeoutSec 6
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) {
        Write-Ok "FHIR is reachable: http://localhost:5028/fhir/metadata (HTTP $($resp.StatusCode))"
        return $true
      }
    } catch {}
    Start-Sleep -Seconds $DelaySeconds
  }

  Write-WarnMsg "FHIR did not become ready on http://localhost:5028/fhir/metadata"
  return $false
}

if ($All) {
  $ApproveBuilds = $true
  $HealthCheck = $true
  $StartBff = $true
  $StartPortal = $true
  $StartPayer = $true
  $StartFhir = $true
}

if ($SeedFhir) {
  $StartFhir = $true
}

if (-not ($StartBff -or $StartPortal -or $StartPayer -or $StartFhir -or $SeedFhir -or $HealthCheck -or $ApproveBuilds)) {
  Write-WarnMsg "No action selected. Use -All or one/more of: -StartBff -StartPortal -StartPayer -StartFhir -SeedFhir -HealthCheck -ApproveBuilds"
  exit 1
}

if ($ApproveBuilds) {
  Write-Step "Running pnpm approve-builds"
  Invoke-Pnpm -WorkingDir $repoRoot -Args @("approve-builds")
  Write-Ok "approve-builds completed."
}

if ($StartBff) {
  Write-Step "Starting BFF"
  $bffDir = Join-Path $repoRoot "apps\bff"
  if (Test-Path $pnpmCmd) {
    Start-PnpmInNewWindow -WorkingDir $bffDir -CommandLabel "BFF" -ScriptCommand "& '$pnpmCmd' start:dev"
  } else {
    Start-PnpmInNewWindow -WorkingDir $bffDir -CommandLabel "BFF" -ScriptCommand "& '$corepackCmd' pnpm start:dev"
  }
}

if ($StartPortal) {
  Write-Step "Starting Insurance Portal"
  $portalDir = Join-Path $repoRoot "starters\insurance-portal"
  if (Test-Path $pnpmCmd) {
    Start-PnpmInNewWindow -WorkingDir $portalDir -CommandLabel "Portal" -ScriptCommand "& '$pnpmCmd' dev"
  } else {
    Start-PnpmInNewWindow -WorkingDir $portalDir -CommandLabel "Portal" -ScriptCommand "& '$corepackCmd' pnpm dev"
  }
}

if ($StartPayer) {
  Write-Step "Starting Payer Portal"
  $payerDir = Join-Path $repoRoot "starters\payer-portal"
  if (Test-Path $pnpmCmd) {
    Start-PnpmInNewWindow -WorkingDir $payerDir -CommandLabel "Payer Portal" -ScriptCommand "& '$pnpmCmd' dev"
  } else {
    Start-PnpmInNewWindow -WorkingDir $payerDir -CommandLabel "Payer Portal" -ScriptCommand "& '$corepackCmd' pnpm dev"
  }
}

if ($StartFhir) {
  Write-Step "Starting HAPI FHIR on :5028"
  $fhirMetaUrl = "http://localhost:5028/fhir/metadata"
  $canWaitForFhir = $true
  try {
    $probe = Invoke-WebRequest -Uri $fhirMetaUrl -UseBasicParsing -TimeoutSec 5
    if ($probe.StatusCode -ge 200 -and $probe.StatusCode -lt 500) {
      Write-Ok "FHIR already running (HTTP $($probe.StatusCode)): $fhirMetaUrl"
    }
  } catch {
    $composeFile = Join-Path $repoRoot ".docker\compose\docker-compose.yml"
    if ((Test-Path $composeFile) -and (Get-Command docker -ErrorAction SilentlyContinue)) {
      try {
        Push-Location $repoRoot
        try {
          docker compose -f $composeFile up -d hapi-fhir | Out-Null
        } finally {
          Pop-Location
        }
        Write-Ok "Requested docker compose startup for hapi-fhir."
      } catch {
        Write-WarnMsg "Could not start hapi-fhir via docker compose: $($_.Exception.Message)"
      }
    } else {
      Write-WarnMsg "Docker or compose file not available. Start your FHIR server manually on :5028."
      $canWaitForFhir = $false
    }
  }

  if ($canWaitForFhir) {
    [void](Wait-ForFhir)
  }
}

if ($SeedFhir) {
  Write-Step "Seeding FHIR data"
  $seedDir = Join-Path $repoRoot "apps\bff"
  Invoke-Pnpm -WorkingDir $seedDir -Args @("seed:fhir")
  Write-Ok "FHIR seed command completed."
}

if ($HealthCheck) {
  Write-Step "Running optional health check"
  try {
    $resp = Invoke-WebRequest -Uri "http://localhost:5021/api/v1/health" -UseBasicParsing -TimeoutSec 10
    Write-Ok "Health check HTTP $($resp.StatusCode): http://localhost:5021/api/v1/health"
  } catch {
    Write-WarnMsg "Health check failed: $($_.Exception.Message)"
  }

  if ($StartPayer -or $All) {
    try {
      $payerResp = Invoke-WebRequest -Uri "http://localhost:5022/" -UseBasicParsing -TimeoutSec 10
      Write-Ok "Payer portal HTTP $($payerResp.StatusCode): http://localhost:5022/"
    } catch {
      Write-WarnMsg "Payer portal check failed (it may still be booting): $($_.Exception.Message)"
    }
  }

  if ($StartFhir -or $SeedFhir -or $All) {
    try {
      $fhirResp = Invoke-WebRequest -Uri "http://localhost:5028/fhir/metadata" -UseBasicParsing -TimeoutSec 10
      Write-Ok "FHIR metadata HTTP $($fhirResp.StatusCode): http://localhost:5028/fhir/metadata"
    } catch {
      Write-WarnMsg "FHIR health check failed: $($_.Exception.Message)"
    }
  }
}

Write-Step "Done"
Write-Host "Examples:" -ForegroundColor Green
Write-Host "  powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -All -NodeDir 'D:\soft\node-v24.14.0-win-x64'" -ForegroundColor Gray
Write-Host "  powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -StartBff -StartPortal -NodeDir 'D:\soft\node-v24.14.0-win-x64'" -ForegroundColor Gray
Write-Host "  powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -StartBff -StartPayer -HealthCheck -NodeDir 'D:\soft\node-v24.14.0-win-x64'" -ForegroundColor Gray
Write-Host "  powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -StartFhir -SeedFhir -HealthCheck -NodeDir 'D:\soft\node-v24.14.0-win-x64'" -ForegroundColor Gray
