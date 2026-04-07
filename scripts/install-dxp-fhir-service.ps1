param(
  [string]$NodeDir = "D:\soft\node-v24.14.0-win-x64",
  [string]$RepoRoot = "D:\dxp",
  [string]$ServiceName = "DxpFhir",
  [string]$NssmExe = "C:\nssm\win64\nssm.exe",
  [string]$ServiceUser = "LocalSystem",
  [string]$ServicePassword = "",
  [ValidateSet("SERVICE_AUTO_START", "SERVICE_DEMAND_START", "SERVICE_DELAYED_AUTO_START")]
  [string]$StartMode = "SERVICE_AUTO_START",
  [string]$HapiWarPath = "",
  [string]$SnakeyamlJarPath = "",
  [string]$JettyRunnerJarPath = ""
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

function Write-Ok {
  param([string]$Message)
  Write-Host "  + $Message" -ForegroundColor Green
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
    [int]$MaxAttempts = 60,
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

function Get-HttpStatusFast {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 8
  )

  if (Get-Command curl.exe -ErrorAction SilentlyContinue) {
    try {
      $code = & curl.exe -s -o NUL -w "%{http_code}" --max-time $TimeoutSeconds $Url
      if ($LASTEXITCODE -eq 0 -and $code -match '^\d{3}$') {
        return [int]$code
      }
    } catch {}
  }

  try {
    $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSeconds
    return [int]$resp.StatusCode
  } catch {
    if ($_.Exception.Response) {
      try { return [int]$_.Exception.Response.StatusCode } catch {}
    }
  }

  return $null
}

if (-not (Test-Path $NssmExe)) {
  throw "nssm.exe not found at '$NssmExe'."
}

$startScript = Join-Path $RepoRoot "scripts\start-fhir-service.ps1"
if (-not (Test-Path $startScript)) {
  throw "FHIR service start script not found: '$startScript'."
}

$runtimeDir = Join-Path $RepoRoot ".tools\hapi-fhir\runtime"
New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
$stdoutPath = Join-Path $runtimeDir "service-stdout.log"
$stderrPath = Join-Path $runtimeDir "service-stderr.log"

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

  if (-not (Wait-ServiceRemoval -Name $ServiceName -MaxAttempts 90 -DelaySeconds 1)) {
    throw "Service '$ServiceName' is still present (likely marked for deletion). Close Services MMC and retry."
  }
}

$psExe = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
$argList = @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-File", "`"$startScript`"",
  "-NodeDir", "`"$NodeDir`"",
  "-RepoRoot", "`"$RepoRoot`""
)

if (-not [string]::IsNullOrWhiteSpace($HapiWarPath)) {
  $argList += @("-HapiWarPath", "`"$HapiWarPath`"")
}
if (-not [string]::IsNullOrWhiteSpace($SnakeyamlJarPath)) {
  $argList += @("-SnakeyamlJarPath", "`"$SnakeyamlJarPath`"")
}
if (-not [string]::IsNullOrWhiteSpace($JettyRunnerJarPath)) {
  $argList += @("-JettyRunnerJarPath", "`"$JettyRunnerJarPath`"")
}
$appArgs = ($argList -join " ")

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
Invoke-Nssm -NssmArgs @("set", $ServiceName, "AppDirectory", $RepoRoot) | Out-Null
Invoke-Nssm -NssmArgs @("set", $ServiceName, "Start", $StartMode) | Out-Null
Invoke-Nssm -NssmArgs @("set", $ServiceName, "AppExit", "Default", "Restart") | Out-Null
Invoke-Nssm -NssmArgs @("set", $ServiceName, "AppRestartDelay", "5000") | Out-Null
Invoke-Nssm -NssmArgs @("set", $ServiceName, "AppStdout", $stdoutPath) | Out-Null
Invoke-Nssm -NssmArgs @("set", $ServiceName, "AppStderr", $stderrPath) | Out-Null

if ($ServiceUser -ne "LocalSystem") {
  if ([string]::IsNullOrWhiteSpace($ServicePassword)) {
    throw "ServicePassword is required when ServiceUser is not LocalSystem."
  }
  Invoke-Nssm -NssmArgs @("set", $ServiceName, "ObjectName", $ServiceUser, $ServicePassword) | Out-Null
}

Write-Step "Starting service '$ServiceName'"
Start-Service -Name $ServiceName
$svc = Get-Service -Name $ServiceName
Write-Ok "Service '$ServiceName' status: $($svc.Status)"

Write-Step "FHIR endpoint check"
$fhirMetadata = "http://localhost:5028/fhir/metadata"
$healthy = $false
for ($i = 1; $i -le 30; $i++) {
  $statusCode = Get-HttpStatusFast -Url $fhirMetadata -TimeoutSeconds 8
  if ($null -ne $statusCode -and $statusCode -ge 200 -and $statusCode -lt 300) {
    Write-Ok "FHIR endpoint ready: $fhirMetadata (HTTP $statusCode)"
    $healthy = $true
    break
  }
  Start-Sleep -Seconds 2
}

if (-not $healthy) {
  Write-Info "FHIR endpoint not ready yet: $fhirMetadata"
  Write-Info "Check logs:"
  Write-Info "  $stdoutPath"
  Write-Info "  $stderrPath"
}

Write-Step "Done"
Write-Host "Commands:" -ForegroundColor Green
Write-Host "  Get-Service $ServiceName" -ForegroundColor Gray
Write-Host "  Start-Service $ServiceName" -ForegroundColor Gray
Write-Host "  Stop-Service $ServiceName" -ForegroundColor Gray
Write-Host "  powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -FhirStatus -NodeDir '$NodeDir'" -ForegroundColor Gray
