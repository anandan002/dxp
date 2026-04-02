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
  & $NssmExe remove $ServiceName confirm | Out-Null
}

$psExe = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
$appArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`" -NodeDir `"$NodeDir`" -RepoRoot `"$RepoRoot`""

& $NssmExe install $ServiceName $psExe $appArgs | Out-Null
& $NssmExe set $ServiceName AppDirectory $bffDir | Out-Null
& $NssmExe set $ServiceName Start SERVICE_AUTO_START | Out-Null
& $NssmExe set $ServiceName AppExit Default Restart | Out-Null
& $NssmExe set $ServiceName AppRestartDelay 5000 | Out-Null
& $NssmExe set $ServiceName AppStdout (Join-Path $logsDir "service-stdout.log") | Out-Null
& $NssmExe set $ServiceName AppStderr (Join-Path $logsDir "service-stderr.log") | Out-Null

if ($ServiceUser -ne "LocalSystem") {
  if ([string]::IsNullOrWhiteSpace($ServicePassword)) {
    throw "ServicePassword is required when ServiceUser is not LocalSystem."
  }
  & $NssmExe set $ServiceName ObjectName $ServiceUser $ServicePassword | Out-Null
}

Write-Step "Starting service '$ServiceName'"
Start-Service -Name $ServiceName
Get-Service -Name $ServiceName | Select-Object Name, Status, StartType
