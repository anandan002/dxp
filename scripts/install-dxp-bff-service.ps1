param(
  [string]$NodeDir = "D:\soft\node-v24.14.0-win-x64",
  [string]$RepoRoot = "D:\dxp",
  [string]$ServiceName = "DxpBff",
  [string]$NssmExe = "C:\nssm\win64\nssm.exe",
  [string]$ServiceUser = "LocalSystem",
  [string]$ServicePassword = "",
  [switch]$BuildBff
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Info {
  param([string]$Message)
  Write-Host "  - $Message" -ForegroundColor Gray
}

function Invoke-Nssm {
  param(
    [string[]]$NssmArgs,
    [switch]$AllowNonZeroExit
  )

  $output = & $NssmExe @NssmArgs 2>&1
  $exitCode = $LASTEXITCODE
  if (-not $AllowNonZeroExit -and $exitCode -ne 0) {
    $msg = ($output | Out-String).Trim()
    if ([string]::IsNullOrWhiteSpace($msg)) {
      $msg = "nssm failed with exit code $exitCode."
    }
    throw $msg
  }
  return [pscustomobject]@{
    ExitCode = $exitCode
    Output   = (($output | Out-String).Trim())
  }
}

function Test-ServiceExists {
  param([string]$Name)
  return [bool](Get-Service -Name $Name -ErrorAction SilentlyContinue)
}

function Wait-ServiceRemoval {
  param(
    [string]$Name,
    [int]$MaxAttempts = 40,
    [int]$DelaySeconds = 1
  )

  for ($i = 1; $i -le $MaxAttempts; $i++) {
    if (-not (Test-ServiceExists -Name $Name)) {
      return $true
    }
    Start-Sleep -Seconds $DelaySeconds
  }

  return $false
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

if (-not (Test-Path $NssmExe)) {
  throw "nssm.exe not found at '$NssmExe'."
}

$bffDir = Join-Path $RepoRoot "apps\bff"
$startScript = Join-Path $RepoRoot "scripts\start-bff-prod.ps1"
$logsDir = Join-Path $bffDir "logs"
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

if ($BuildBff) {
  Write-Step "Building BFF"
  Invoke-PnpmAt -WorkingDir $bffDir -PnpmArgs @("build")
}

$entryCandidates = @(
  (Join-Path $bffDir "dist\main.js"),
  (Join-Path $bffDir "dist\apps\bff\src\main.js"),
  (Join-Path $bffDir "dist\apps\bff\main.js")
)
$entry = $entryCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $entry) {
  throw "BFF build output missing. Checked: $($entryCandidates -join ', '). Run with -BuildBff or build apps/bff first."
}

Write-Step "Installing/Updating NSSM service '$ServiceName'"
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existingService) {
  Write-Info "Stopping existing service '$ServiceName'."
  try {
    Stop-Service -Name $ServiceName -Force -ErrorAction Stop
  } catch {
    Write-Info "Stop-Service failed for '$ServiceName' ($($_.Exception.Message)). Continuing with remove."
  }

  Write-Info "Removing existing service '$ServiceName'."
  $removeResult = Invoke-Nssm -NssmArgs @("remove", $ServiceName, "confirm") -AllowNonZeroExit
  if ($removeResult.ExitCode -ne 0 -and $removeResult.Output -notmatch "does not exist") {
    throw "Failed to remove existing service '$ServiceName'. $($removeResult.Output)"
  }

  if (-not (Wait-ServiceRemoval -Name $ServiceName -MaxAttempts 60 -DelaySeconds 1)) {
    throw "Service '$ServiceName' is still present (likely marked for deletion). Close any Service Manager handles and retry."
  }
}

$psExe = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
$appArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`" -NodeDir `"$NodeDir`" -RepoRoot `"$RepoRoot`""

$installed = $false
for ($attempt = 1; $attempt -le 5; $attempt++) {
  try {
    Invoke-Nssm -NssmArgs @("install", $ServiceName, $psExe) | Out-Null
    $installed = $true
    break
  } catch {
    $msg = $_.Exception.Message
    if ($msg -match "marked for deletion" -and $attempt -lt 5) {
      Write-Info "Service still marked for deletion. Retry $attempt/5 after wait..."
      Start-Sleep -Seconds 2
      continue
    }
    throw "Failed to install service '$ServiceName'. $msg"
  }
}

if (-not $installed) {
  throw "Failed to install service '$ServiceName' after retries."
}

Invoke-Nssm -NssmArgs @("set", $ServiceName, "AppParameters", $appArgs) | Out-Null
Invoke-Nssm -NssmArgs @("set", $ServiceName, "AppDirectory", $bffDir) | Out-Null
Invoke-Nssm -NssmArgs @("set", $ServiceName, "Start", "SERVICE_AUTO_START") | Out-Null
Invoke-Nssm -NssmArgs @("set", $ServiceName, "AppExit", "Default", "Restart") | Out-Null
Invoke-Nssm -NssmArgs @("set", $ServiceName, "AppRestartDelay", "5000") | Out-Null
Invoke-Nssm -NssmArgs @("set", $ServiceName, "AppStdout", (Join-Path $logsDir "service-stdout.log")) | Out-Null
Invoke-Nssm -NssmArgs @("set", $ServiceName, "AppStderr", (Join-Path $logsDir "service-stderr.log")) | Out-Null

if ($ServiceUser -ne "LocalSystem") {
  if ([string]::IsNullOrWhiteSpace($ServicePassword)) {
    throw "ServicePassword is required when ServiceUser is not LocalSystem."
  }
  Invoke-Nssm -NssmArgs @("set", $ServiceName, "ObjectName", $ServiceUser, $ServicePassword) | Out-Null
}

Write-Step "Starting service '$ServiceName'"
Start-Service -Name $ServiceName
Get-Service -Name $ServiceName | Select-Object Name, Status, StartType
