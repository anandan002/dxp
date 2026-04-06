param(
  [switch]$NonInteractive,
  [string]$NodeDir = "D:\soft\node-v24.14.0-win-x64"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ScriptVersion = "2026-04-02.2"

$RedisWindowsRepo = "https://github.com/redis-windows/redis-windows"
$RancherDesktopUrl = "https://rancherdesktop.io/"
$RedisWindowsLatestReleaseApi = "https://api.github.com/repos/redis-windows/redis-windows/releases/latest"
$RancherDesktopExePath = "C:\Program Files\Rancher Desktop\Rancher Desktop.exe"

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

function Write-WarnMsg {
  param([string]$Message)
  Write-Host "  ! $Message" -ForegroundColor Yellow
}

function Read-Value {
  param(
    [string]$Prompt,
    [string]$Default
  )
  if ($NonInteractive) {
    return $Default
  }

  $label = if ([string]::IsNullOrWhiteSpace($Default)) { "$Prompt" } else { "$Prompt [$Default]" }
  $value = Read-Host $label
  if ([string]::IsNullOrWhiteSpace($value)) {
    return $Default
  }
  return $value
}

function Get-DotEnvValue {
  param(
    [string]$FilePath,
    [string]$Key
  )

  if (-not (Test-Path $FilePath)) {
    return $null
  }

  try {
    $line = Select-String -Path $FilePath -Pattern ("^\s*" + [regex]::Escape($Key) + "=") -SimpleMatch:$false | Select-Object -First 1
    if (-not $line) {
      return $null
    }
    $raw = $line.Line.Substring($line.Line.IndexOf('=') + 1)
    return $raw.Trim()
  } catch {
    return $null
  }
}

function Read-YesNo {
  param(
    [string]$Prompt,
    [bool]$Default = $true
  )
  if ($NonInteractive) {
    return $Default
  }

  $suffix = if ($Default) { "[Y/n]" } else { "[y/N]" }
  $raw = (Read-Host "$Prompt $suffix").Trim().ToLowerInvariant()
  if ([string]::IsNullOrWhiteSpace($raw)) {
    return $Default
  }
  return @('y', 'yes') -contains $raw
}

function Test-Command {
  param([string]$Name)
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Ensure-UserPathContains {
  param(
    [string]$DirectoryPath
  )

  if ([string]::IsNullOrWhiteSpace($DirectoryPath) -or -not (Test-Path $DirectoryPath)) {
    return
  }

  try {
    $currentUserPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $entries = @()
    if (-not [string]::IsNullOrWhiteSpace($currentUserPath)) {
      $entries = $currentUserPath.Split(';') | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    }

    $exists = $false
    foreach ($entry in $entries) {
      if ($entry.TrimEnd('\') -ieq $DirectoryPath.TrimEnd('\')) {
        $exists = $true
        break
      }
    }

    if (-not $exists) {
      $newUserPath = if ([string]::IsNullOrWhiteSpace($currentUserPath)) {
        $DirectoryPath
      } else {
        "$currentUserPath;$DirectoryPath"
      }
      [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
      Write-Ok "Persisted to user PATH: $DirectoryPath"
      Write-Info "Open a new terminal window to use updated PATH."
    }
  } catch {
    Write-WarnMsg "Could not update user PATH for '$DirectoryPath': $($_.Exception.Message)"
  }
}

function Test-IsAdmin {
  try {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  } catch {
    return $false
  }
}

function Wait-ForRedis {
  param(
    [int]$MaxAttempts = 20,
    [int]$DelaySeconds = 3
  )

  if (-not (Test-Command "redis-cli")) {
    Write-WarnMsg "redis-cli not found in PATH; cannot verify Redis readiness."
    return $false
  }

  Write-Info "Waiting for Redis to become ready..."
  for ($i = 1; $i -le $MaxAttempts; $i++) {
    try {
      if (-not [string]::IsNullOrWhiteSpace($script:RedisPasswordForChecks)) {
        $pong = (& redis-cli -a $script:RedisPasswordForChecks --no-auth-warning ping 2>$null)
      } else {
        $pong = (& redis-cli ping 2>$null)
      }
      if ($pong -match "PONG") {
        Write-Ok "Redis is ready (redis-cli ping => PONG)."
        return $true
      }
    } catch {}
    Start-Sleep -Seconds $DelaySeconds
  }

  Write-WarnMsg "Redis did not become ready after $MaxAttempts attempts."
  return $false
}

function Wait-ForDocker {
  param(
    [int]$MaxAttempts = 40,
    [int]$DelaySeconds = 5
  )

  if (-not (Test-Command "docker")) {
    Write-WarnMsg "docker command not found; cannot verify Docker readiness."
    return $false
  }

  Write-Info "Waiting for Docker daemon to become ready..."
  for ($i = 1; $i -le $MaxAttempts; $i++) {
    try {
      docker info > $null 2>&1
      if ($LASTEXITCODE -eq 0) {
        Write-Ok "Docker daemon is ready."
        return $true
      }
    } catch {}
    Start-Sleep -Seconds $DelaySeconds
  }

  Write-WarnMsg "Docker daemon did not become ready after $MaxAttempts attempts."
  return $false
}

function Configure-Wsl2ForRancherDesktop {
  Write-Step "Configuring WSL2 for Rancher Desktop"

  if (-not (Test-Command "wsl")) {
    Write-WarnMsg "wsl command not found."
    if ($SkipAutoInstallPrereqs) {
      Write-WarnMsg "Auto-install disabled. Install WSL2 manually, then re-run the script."
      return $false
    }
    if (Test-IsAdmin) {
      try {
        wsl --install --no-distribution | Out-Null
        Write-Ok "WSL install command executed."
        Write-WarnMsg "A reboot may be required to complete WSL installation."
      } catch {
        Write-WarnMsg "Failed to run 'wsl --install --no-distribution'."
      }
    } else {
      Write-WarnMsg "Run PowerShell as Administrator and execute: wsl --install --no-distribution"
    }
    return $false
  }

  try {
    $status = (wsl --status 2>&1 | Out-String)
    Write-Info ($status.Trim())
  } catch {
    Write-WarnMsg "Unable to read WSL status."
  }

  $needsReboot = $false
  if (Test-IsAdmin) {
    try {
      $wslFeature = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
      $vmFeature = Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform

      if ($wslFeature.State -ne "Enabled") {
        Write-Info "Enabling Microsoft-Windows-Subsystem-Linux feature..."
        dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart | Out-Null
        $needsReboot = $true
      }
      if ($vmFeature.State -ne "Enabled") {
        Write-Info "Enabling VirtualMachinePlatform feature..."
        dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart | Out-Null
        $needsReboot = $true
      }
    } catch {
      Write-WarnMsg "Could not verify/enable Windows optional features for WSL2."
    }
  } else {
    Write-Info "Not running as Administrator. Skipping Windows feature enablement check."
  }

  $defaultIs2 = $false
  try {
    wsl --set-default-version 2 | Out-Null
    Write-Ok "Set default WSL version to 2."
    # Treat successful command as authoritative to avoid locale-dependent parsing issues.
    $defaultIs2 = $true
  } catch {
    Write-WarnMsg "Failed to set default WSL version to 2."
  }

  $statusConfirmed = $false
  try {
    $statusAfter = (wsl --status 2>&1 | Out-String)
    if ($statusAfter -match "Default\s+Version\s*:\s*2") {
      $statusConfirmed = $true
      $defaultIs2 = $true
    }
  } catch {
    Write-WarnMsg "Unable to validate WSL default version."
  }
  if (-not $defaultIs2 -and -not $statusConfirmed) {
    Write-WarnMsg "WSL default version is not confirmed as 2. Rancher Desktop requires WSL2."
  }

  $hasWsl1Distro = $false
  try {
    $wslList = (wsl -l -v 2>&1 | Out-String)
    if ($wslList -match "\s1\s*$") {
      Write-WarnMsg "One or more WSL distros are still on version 1. Convert them with: wsl --set-version <DistroName> 2"
      $hasWsl1Distro = $true
    }
  } catch {}

  if ($needsReboot) {
    Write-WarnMsg "System reboot is required to finish enabling WSL2 components."
    return $false
  }

  if ($hasWsl1Distro) {
    Write-WarnMsg "WSL2 is not fully configured. Rancher Desktop setup will not proceed until all required distros are on WSL2."
    return $false
  }

  Write-Info "Rancher Desktop recommendation: Preferences -> WSL -> enable integration and use dockerd (Moby)."
  return [bool]$defaultIs2
}

function Start-RancherDesktopIfNeeded {
  if (Get-Process | Where-Object { $_.ProcessName -like "*Rancher*Desktop*" }) {
    Write-Info "Rancher Desktop is already running."
    return
  }

  if (Test-Path $RancherDesktopExePath) {
    Start-Process -FilePath $RancherDesktopExePath -ArgumentList "docker" | Out-Null
    Write-Ok "Started Rancher Desktop with 'docker' argument."
  } else {
    Write-WarnMsg "Rancher Desktop executable not found at '$RancherDesktopExePath'."
  }
}

function Add-DockerCliFromRancher {
  $candidateDirs = @(
    "C:\Program Files\Rancher Desktop\resources\resources\win32\bin",
    (Join-Path $env:LOCALAPPDATA "Programs\Rancher Desktop\resources\resources\win32\bin")
  )

  foreach ($dir in $candidateDirs) {
    $dockerExe = Join-Path $dir "docker.exe"
    if (Test-Path $dockerExe) {
      if (-not ($env:Path.Split(';') -contains $dir)) {
        $env:Path = "$dir;$env:Path"
      }
      Write-Ok "Docker CLI path added from Rancher Desktop: $dir"
      return $true
    }
  }
  return $false
}

function Invoke-Pnpm {
  param(
    [string[]]$PnpmArgs
  )

  if ($script:PnpmCmd) {
    & $script:PnpmCmd @PnpmArgs
    return
  }

  if ($script:CorepackCmd) {
    & $script:CorepackCmd pnpm @PnpmArgs
    return
  }

  throw "pnpm not found in NodeDir '$NodeDir'. Ensure pnpm.cmd or corepack.cmd exists there."
}

function Create-PostgresDbIfNeeded {
  param(
    [string]$DbName,
    [string]$DbUser,
    [string]$DbPassword
  )

  $oldPgPassword = $env:PGPASSWORD
  if (-not [string]::IsNullOrWhiteSpace($DbPassword)) {
    $env:PGPASSWORD = $DbPassword
  }

  $dbNameSql = $DbName.Replace("'", "''")

  if (Get-Command Test-NetConnection -ErrorAction SilentlyContinue) {
    try {
      $pgPortOpen = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet
      if (-not $pgPortOpen) {
        Write-WarnMsg "PostgreSQL is not reachable on localhost:5432. Start PostgreSQL service first."
        $env:PGPASSWORD = $oldPgPassword
        return
      }
    } catch {}
  }

  $lastDbError = $null

function Invoke-PsqlAttempt {
    param(
      [string]$User,
      [string]$Database,
      [string]$Sql,
      [bool]$UsePassword
    )

    $prevPassword = $env:PGPASSWORD
    if (-not $UsePassword) {
      $env:PGPASSWORD = $null
    }
    try {
      $output = & psql -h localhost -p 5432 -U $User -d $Database --no-password -tAc $Sql 2>&1
      $exitCode = $LASTEXITCODE
    } catch {
      $output = $_.Exception.Message
      $exitCode = 1
    } finally {
      $env:PGPASSWORD = $prevPassword
    }

    return [pscustomobject]@{
      ExitCode = $exitCode
      Output = (($output | Out-String).Trim())
    }
  }

  if (Test-Command "psql") {
    $candidateUsers = @($DbUser, "postgres", $env:USERNAME) |
      Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
      Select-Object -Unique

    $connectUser = $null
    $connectWithPassword = $true
    foreach ($u in $candidateUsers) {
      $withPassword = Invoke-PsqlAttempt -User $u -Database "postgres" -Sql "SELECT current_user;" -UsePassword $true
      if ($withPassword.ExitCode -eq 0) {
        $connectUser = $u
        $connectWithPassword = $true
        break
      }
      $withoutPassword = Invoke-PsqlAttempt -User $u -Database "postgres" -Sql "SELECT current_user;" -UsePassword $false
      if ($withoutPassword.ExitCode -eq 0) {
        $connectUser = $u
        $connectWithPassword = $false
        break
      }
      $lastDbError = if (-not [string]::IsNullOrWhiteSpace($withoutPassword.Output)) { $withoutPassword.Output } else { $withPassword.Output }
    }

    if ($connectUser) {
      try {
        $existsResult = Invoke-PsqlAttempt -User $connectUser -Database "postgres" -Sql "SELECT 1 FROM pg_database WHERE datname = '$dbNameSql';" -UsePassword $connectWithPassword
        if ($existsResult.ExitCode -eq 0 -and ($existsResult.Output -eq "1")) {
          Write-Ok "Database '$DbName' already exists."
          $env:PGPASSWORD = $oldPgPassword
          return
        }

        # Try create with requested owner first; fall back to default owner if role is missing.
        $dbNameQuoted = '"' + ($DbName.Replace('"', '""')) + '"'
        $ownerQuoted = '"' + ($DbUser.Replace('"', '""')) + '"'
        $created = $false
        $createWithOwner = Invoke-PsqlAttempt -User $connectUser -Database "postgres" -Sql "CREATE DATABASE $dbNameQuoted OWNER $ownerQuoted;" -UsePassword $connectWithPassword
        if ($createWithOwner.ExitCode -eq 0) {
          $created = $true
        } else {
          $lastDbError = $createWithOwner.Output
        }

        if (-not $created) {
          $createDefault = Invoke-PsqlAttempt -User $connectUser -Database "postgres" -Sql "CREATE DATABASE $dbNameQuoted;" -UsePassword $connectWithPassword
          if ($createDefault.ExitCode -eq 0) {
            $created = $true
          } else {
            $lastDbError = $createDefault.Output
          }
        }

        if ($created) {
          $authMode = if ($connectWithPassword) { "password" } else { "no-password" }
          Write-Ok "Created database '$DbName' using psql (user: $connectUser, auth: $authMode)."
          $env:PGPASSWORD = $oldPgPassword
          return
        }
      } catch {
        $lastDbError = $_.Exception.Message
        Write-WarnMsg "psql create attempt failed for '$DbName'."
      }
    } else {
      Write-WarnMsg "Could not connect to PostgreSQL with users: $($candidateUsers -join ', ')"
    }
  }

  if (Test-Command "createdb") {
    try {
      & createdb -h localhost -p 5432 -U $DbUser --no-password -- $DbName 2>$null
      if ($LASTEXITCODE -eq 0) {
        Write-Ok "Ensured database '$DbName' exists (createdb, user: $DbUser)."
        $env:PGPASSWORD = $oldPgPassword
        return
      }
    } catch {}

    try {
      & createdb --no-password -- $DbName 2>$null
      if ($LASTEXITCODE -eq 0) {
        Write-Ok "Ensured database '$DbName' exists (createdb default user)."
        $env:PGPASSWORD = $oldPgPassword
        return
      }
    } catch {}
  }

  Write-WarnMsg "Automatic database creation failed for '$DbName'."
  if (-not [string]::IsNullOrWhiteSpace($lastDbError)) {
    Write-WarnMsg "Last PostgreSQL error: $lastDbError"
  }
  Write-WarnMsg "Manual fallback: open psql and run CREATE DATABASE $DbName;"
  $env:PGPASSWORD = $oldPgPassword
}

function Ensure-PostgresReady {
  param(
    [string]$DbName,
    [string]$DbUser,
    [string]$DbPassword
  )

  if (-not (Test-Command "psql") -and -not (Test-Command "createdb")) {
    Write-WarnMsg "PostgreSQL CLI tools (psql/createdb) not found. Skipping DB checks."
    return
  }

  Create-PostgresDbIfNeeded -DbName $DbName -DbUser $DbUser -DbPassword $DbPassword
}

function Stop-RedisRuntimeIfRunning {
  $serviceName = "DxpRedis"
  $stoppedAnything = $false

  try {
    $svc = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if ($svc -and $svc.Status -ne "Stopped") {
      Stop-Service -Name $serviceName -Force -ErrorAction Stop
      Write-Info "Stopped Redis service '$serviceName' before binary update."
      $stoppedAnything = $true
    }
  } catch {
    Write-WarnMsg "Could not stop Redis service '$serviceName': $($_.Exception.Message)"
  }

  try {
    $procs = Get-Process -ErrorAction SilentlyContinue | Where-Object {
      $_.ProcessName -in @("RedisService", "redis-server")
    }
    if ($procs) {
      $procs | Stop-Process -Force -ErrorAction SilentlyContinue
      Write-Info "Stopped running Redis processes before binary update."
      $stoppedAnything = $true
    }
  } catch {
    Write-WarnMsg "Could not stop Redis processes cleanly: $($_.Exception.Message)"
  }

  if ($stoppedAnything) {
    Start-Sleep -Seconds 1
  }
}

function Ensure-RedisOrGuideInstall {
  param(
    [string]$RedisPassword
  )

  $script:RedisPasswordForChecks = $RedisPassword
  $toolsRoot = Join-Path (Get-Location) ".tools\redis-windows"
  $extractRoot = Join-Path $toolsRoot "latest"
  $zipPath = Join-Path $toolsRoot "redis-windows-latest.zip"

  $localRedisService = $null
  $localRedisServer = $null
  $localRedisCli = $null
  if (Test-Path $extractRoot) {
    $localRedisService = Get-ChildItem -Path $extractRoot -Recurse -File -Filter "RedisService.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    $localRedisServer = Get-ChildItem -Path $extractRoot -Recurse -File -Filter "redis-server.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    $localRedisCli = Get-ChildItem -Path $extractRoot -Recurse -File -Filter "redis-cli.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
  }

  if (Test-Command "redis-cli") {
    Write-Ok "redis-cli found"
    return (Wait-ForRedis)
  }

  if ($localRedisService -and $localRedisServer -and $localRedisCli) {
    $redisBin = Split-Path -Parent $localRedisServer.FullName
    $env:Path = "$redisBin;$env:Path"
    Write-Ok "Using existing local Redis binaries: $redisBin"
    Ensure-UserPathContains -DirectoryPath $redisBin
  } else {
    Write-WarnMsg "Redis CLI not found."
    if ($SkipAutoInstallPrereqs) {
      Write-WarnMsg "Auto-install is disabled. Install Redis from: $RedisWindowsRepo"
      $env:PGPASSWORD = $oldPgPassword
      return $false
    }

    Write-Step "Auto-installing Redis from redis-windows"
    New-Item -ItemType Directory -Path $toolsRoot -Force | Out-Null

    try {
      Stop-RedisRuntimeIfRunning

      if (Test-Path $zipPath) {
        Write-Info "Using cached Redis zip: $zipPath"
      } else {
        Write-Info "No cached Redis zip found. Downloading latest release asset."
        $release = Invoke-RestMethod -Uri $RedisWindowsLatestReleaseApi -Headers @{ "User-Agent" = "dxp-configure-script" }
        $asset = $release.assets |
          Where-Object { $_.name -match 'windows' -and $_.name -like '*.zip' } |
          Select-Object -First 1
        if (-not $asset) {
          $asset = $release.assets | Where-Object { $_.name -like '*.zip' } | Select-Object -First 1
        }
        if (-not $asset) {
          throw "No .zip asset found in latest release."
        }
        Write-Info "Downloading asset: $($asset.name)"
        Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zipPath
      }
      if (Test-Path $extractRoot) {
        try {
          Remove-Item -LiteralPath $extractRoot -Recurse -Force -ErrorAction Stop
        } catch {
          throw "Cannot replace existing Redis binaries at '$extractRoot'. Ensure Redis service/process is stopped and retry. Details: $($_.Exception.Message)"
        }
      }
      New-Item -ItemType Directory -Path $extractRoot -Force | Out-Null
      Expand-Archive -Path $zipPath -DestinationPath $extractRoot -Force

      $localRedisServer = Get-ChildItem -Path $extractRoot -Recurse -File -Filter "redis-server.exe" | Select-Object -First 1
      $localRedisCli = Get-ChildItem -Path $extractRoot -Recurse -File -Filter "redis-cli.exe" | Select-Object -First 1
      $localRedisService = Get-ChildItem -Path $extractRoot -Recurse -File -Filter "RedisService.exe" | Select-Object -First 1
      if (-not $localRedisServer -or -not $localRedisCli -or -not $localRedisService) {
        throw "RedisService.exe, redis-server.exe or redis-cli.exe not found after extraction."
      }

      $redisBin = Split-Path -Parent $localRedisServer.FullName
      $env:Path = "$redisBin;$env:Path"
      Write-Ok "Redis binaries prepared at: $redisBin"
      Ensure-UserPathContains -DirectoryPath $redisBin
    } catch {
      Write-WarnMsg "Redis auto-install failed: $($_.Exception.Message)"
      Write-WarnMsg "Install manually from: $RedisWindowsRepo"
      return $false
    }
  }

  try {
    $redisServer = $localRedisServer
    $redisCli = $localRedisCli
    $redisService = $localRedisService
    if (-not $redisServer -or -not $redisCli -or -not $redisService) {
      throw "Redis binaries are unavailable after setup."
    }

    $runtimeRoot = Join-Path $toolsRoot "runtime"
    $configDir = Join-Path $runtimeRoot "config"
    $dataDir = Join-Path $runtimeRoot "data"
    $logsDir = Join-Path $runtimeRoot "logs"
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

    $redisConfPath = Join-Path $configDir "redis.conf"
    $dataDirPosix = $dataDir.Replace('\', '/')
    $logPathPosix = (Join-Path $logsDir "redis.log").Replace('\', '/')

    $confLines = @(
      "bind 127.0.0.1",
      "port 6379",
      "dir $dataDirPosix",
      "logfile $logPathPosix",
      "appendonly yes",
      "save 900 1",
      "save 300 10",
      "save 60 10000"
    )
    if (-not [string]::IsNullOrWhiteSpace($RedisPassword)) {
      $confLines += "requirepass $RedisPassword"
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($redisConfPath, ($confLines -join [Environment]::NewLine), $utf8NoBom)
    Write-Ok "Generated Redis config: $redisConfPath"

    $serviceName = "DxpRedis"
    if (Test-IsAdmin) {
      Write-Info "Installing Redis Windows service '$serviceName' via RedisService.exe"
      & $redisService.FullName install -c $redisConfPath --dir $dataDir --port 6379 --service-name $serviceName --start-mode auto | Out-Null
      try {
        Start-Service -Name $serviceName -ErrorAction Stop
      } catch {}
      Write-Ok "Redis service installation attempted."
    } else {
      Write-WarnMsg "Not running as Administrator. Starting RedisService in background (non-service mode)."
      $args = @("run", "-c", $redisConfPath, "--dir", $dataDir, "--port", "6379", "--foreground")
      Start-Process -FilePath $redisService.FullName -ArgumentList $args -WindowStyle Hidden | Out-Null
      Write-Ok "Started RedisService background process."
    }
  } catch {
    Write-WarnMsg "Redis configuration/start failed: $($_.Exception.Message)"
    return $false
  }

  return (Wait-ForRedis)
}

function Ensure-DockerOrGuideRancher {
  $wslReady = [bool](Configure-Wsl2ForRancherDesktop)
  if (-not $wslReady) {
    Write-WarnMsg "WSL2 is not fully ready. Skipping Rancher Desktop/Docker validation until WSL2 is fixed."
    return $false
  }

  $dockerFound = Test-Command "docker"
  if ($dockerFound) {
    Write-Ok "docker found"
    try {
      docker info > $null 2>&1
      Write-Ok "docker daemon is reachable"
      return $true
    } catch {
      Write-WarnMsg "docker is installed but daemon is not reachable"
      Start-RancherDesktopIfNeeded
      [void](Add-DockerCliFromRancher)
      if (-not $SkipAutoInstallPrereqs) {
        return (Wait-ForDocker)
      }
      return $false
    }
  } else {
    Write-WarnMsg "docker not found"
  }

  Write-WarnMsg "Docker unavailable. Rancher Desktop will be used: $RancherDesktopUrl"
  if ($SkipAutoInstallPrereqs) {
    return $false
  }

  if (Test-Command "winget") {
    try {
      winget install -e --id SUSE.RancherDesktop --accept-source-agreements --accept-package-agreements
      Write-Ok "Rancher Desktop install command completed."
      Start-RancherDesktopIfNeeded
      if (-not (Test-Command "docker")) {
        [void](Add-DockerCliFromRancher)
      }
      return (Wait-ForDocker)
    } catch {
      Write-WarnMsg "Rancher Desktop install command failed. Use $RancherDesktopUrl"
      return $false
    }
  } else {
    Write-WarnMsg "winget not found. Install Rancher Desktop manually: $RancherDesktopUrl"
    return $false
  }

  return $false
}

Write-Step "DXP auto-configuration"
Write-Info "Script version: $ScriptVersion"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot
Write-Info "Repository root: $repoRoot"

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found. Run this script from inside the dxp repository."
}

Write-Step "Configuring Node toolchain from custom path"
$nodeExe = Join-Path $NodeDir "node.exe"
$pnpmCmd = Join-Path $NodeDir "pnpm.cmd"
$corepackCmd = Join-Path $NodeDir "corepack.cmd"

if (-not (Test-Path $nodeExe)) {
  throw "node.exe not found at '$nodeExe'. Update -NodeDir or install Node there."
}

$script:PnpmCmd = if (Test-Path $pnpmCmd) { $pnpmCmd } else { $null }
$script:CorepackCmd = if (Test-Path $corepackCmd) { $corepackCmd } else { $null }

if (-not $script:PnpmCmd -and -not $script:CorepackCmd) {
  throw "Neither pnpm.cmd nor corepack.cmd found under '$NodeDir'."
}

$env:Path = "$NodeDir;$env:Path"
Write-Ok "Using node from: $nodeExe"
if ($script:PnpmCmd) {
  Write-Ok "Using pnpm from: $script:PnpmCmd"
} else {
  Write-Ok "Using corepack from: $script:CorepackCmd (pnpm via corepack)"
}

$ports = [ordered]@{
  PORTAL     = 5020
  BFF        = 5021
  PAYER      = 5022
  PLAYGROUND = 5023
  STORYBOOK  = 5024
  KEYCLOAK   = 5025
  KONG_PROXY = 5026
  KONG_ADMIN = 5027
  FHIR       = 5028
  STRAPI     = 5029
  PAYLOAD    = 5030
  MINIO      = 5031
  N8N        = 5032
}

Write-Step "Collecting environment inputs"
$existingEnvPath = Join-Path $repoRoot ".env"
$defaultPostgresUser = Get-DotEnvValue -FilePath $existingEnvPath -Key "POSTGRES_USER"
$defaultPostgresPass = Get-DotEnvValue -FilePath $existingEnvPath -Key "POSTGRES_PASSWORD"
$defaultPostgresDb = Get-DotEnvValue -FilePath $existingEnvPath -Key "POSTGRES_DB"
$defaultRedisPass = Get-DotEnvValue -FilePath $existingEnvPath -Key "REDIS_PASSWORD"
$defaultKcAdmin = Get-DotEnvValue -FilePath $existingEnvPath -Key "KEYCLOAK_ADMIN"
$defaultKcAdminPass = Get-DotEnvValue -FilePath $existingEnvPath -Key "KEYCLOAK_ADMIN_PASSWORD"

if ([string]::IsNullOrWhiteSpace($defaultPostgresUser)) { $defaultPostgresUser = "dxp" }
if ([string]::IsNullOrWhiteSpace($defaultPostgresPass)) { $defaultPostgresPass = "dxp_local_pass" }
if ([string]::IsNullOrWhiteSpace($defaultPostgresDb)) { $defaultPostgresDb = "dxp" }
if ([string]::IsNullOrWhiteSpace($defaultRedisPass)) { $defaultRedisPass = "dxp_redis_pass" }
if ([string]::IsNullOrWhiteSpace($defaultKcAdmin)) { $defaultKcAdmin = "admin" }
if ([string]::IsNullOrWhiteSpace($defaultKcAdminPass)) { $defaultKcAdminPass = "admin" }

$postgresUser = Read-Value -Prompt "PostgreSQL user" -Default $defaultPostgresUser
$postgresPass = Read-Value -Prompt "PostgreSQL password" -Default $defaultPostgresPass
$postgresDb   = Read-Value -Prompt "PostgreSQL database" -Default $defaultPostgresDb
$redisPass    = Read-Value -Prompt "Redis password" -Default $defaultRedisPass
$kcAdmin      = Read-Value -Prompt "Keycloak admin username" -Default $defaultKcAdmin
$kcAdminPass  = Read-Value -Prompt "Keycloak admin password" -Default $defaultKcAdminPass

Write-Step "Validating local prerequisites"
try {
  $nodeVersion = & $nodeExe --version
  Write-Ok "node version: $nodeVersion"
} catch {
  Write-WarnMsg "Unable to execute node from '$nodeExe'"
}

try {
  if ($script:PnpmCmd) {
    $pnpmVersion = & $script:PnpmCmd --version
  } else {
    $pnpmVersion = & $script:CorepackCmd pnpm --version
  }
  Write-Ok "pnpm version: $pnpmVersion"
} catch {
  Write-WarnMsg "Unable to execute pnpm from NodeDir"
}

Write-Step "Skipping local infra setup"
Write-Info "Docker/Rancher/Redis provisioning is disabled in this script."
Write-Info "Use external or pre-provisioned infrastructure endpoints as needed."

$envContent = @"
# DXP Platform - Local Environment Configuration

# --- Core Platform ---
BFF_PORT=$($ports.BFF)
DEV_AUTH_BYPASS=false
DEV_MEMBER_ID=7de24de3-a6ee-464e-88ad-004799281205

# --- Frontend ---
VITE_ALLOWED_HOSTS=localhost,127.0.0.1
VITE_BFF_URL=/dxp/api/v1

# --- PostgreSQL ---
POSTGRES_USER=$postgresUser
POSTGRES_PASSWORD=$postgresPass
POSTGRES_DB=$postgresDb

# --- Redis ---
REDIS_PASSWORD=$redisPass

# --- Keycloak ---
KEYCLOAK_ADMIN=$kcAdmin
KEYCLOAK_ADMIN_PASSWORD=$kcAdminPass
KEYCLOAK_URL=http://localhost:$($ports.KEYCLOAK)
KEYCLOAK_REALM=dxp

# --- FHIR ---
FHIR_BASE_URL=http://localhost:$($ports.FHIR)/fhir
FHIR_AUTH_TOKEN=

# --- Adapter Selection ---
CMS_ADAPTER=strapi
STORAGE_PROVIDER=minio
NOTIFICATION_ADAPTER=smtp
DOCUMENT_PROVIDER=s3
IDENTITY_PROVIDER=keycloak
WORKFLOW_PROVIDER=n8n
AUDIT_PROVIDER=postgres
ESIGNATURE_PROVIDER=docusign
CHAT_PROVIDER=intercom
PAYMENTS_PROVIDER=stripe
SCHEDULING_PROVIDER=google
CLAIMS_ADAPTER=fhir-claim
ELIGIBILITY_ADAPTER=fhir-coverage
PRIOR_AUTH_ADAPTER=davinci-pas
PROVIDER_DIRECTORY_ADAPTER=fhir-provider
CARE_PLAN_ADAPTER=fhir-careplan
RISK_STRAT_ADAPTER=hcc-engine
QUALITY_ADAPTER=hedis-engine
CONSENT_ADAPTER=fhir-consent
PAYER_EXCHANGE_ADAPTER=pdex

# --- CMS ---
STRAPI_URL=http://localhost:$($ports.STRAPI)
STRAPI_API_TOKEN=
PAYLOAD_URL=http://localhost:$($ports.PAYLOAD)

# --- Storage: S3 ---
S3_ENDPOINT=
S3_REGION=us-east-1
S3_BUCKET=dxp-documents
S3_ACCESS_KEY=
S3_SECRET_KEY=

# --- Storage: MinIO ---
MINIO_ENDPOINT=http://localhost:$($ports.MINIO)
MINIO_DEFAULT_BUCKET=dxp-documents
MINIO_ROOT_USER=dxp_minio
MINIO_ROOT_PASSWORD=dxp_minio_pass

# --- Storage: Azure Blob ---
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER=dxp-documents

# --- Notifications ---
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=portal@example.com

# --- Integrations ---
INTEGRATIONS_CONFIG=[]

# --- Workflow (n8n) ---
N8N_URL=http://localhost:$($ports.N8N)
N8N_API_KEY=

# --- Identity / Azure AD ---
AZURE_AD_TENANT_ID=
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=

# --- Documents / SharePoint ---
SHAREPOINT_SITE_ID=
SHAREPOINT_DRIVE_ID=

# --- E-Signature (DocuSign) ---
DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi
DOCUSIGN_ACCOUNT_ID=
DOCUSIGN_ACCESS_TOKEN=
DOCUSIGN_RETURN_URL=http://localhost:$($ports.PORTAL)

# --- Chat ---
INTERCOM_ACCESS_TOKEN=

# --- Payments ---
STRIPE_SECRET_KEY=
"@

Write-Step "Writing .env"
$envPath = Join-Path $repoRoot ".env"
if ((Test-Path $envPath) -and -not (Read-YesNo -Prompt ".env already exists. Overwrite it?" -Default $false)) {
  Write-WarnMsg "Skipped writing .env (existing file kept)."
} else {
  Set-Content -Path $envPath -Value $envContent -Encoding UTF8
  Write-Ok "Created/updated .env"
}

if (Read-YesNo -Prompt "Install dependencies now with pnpm install?" -Default $true) {
  Write-Step "Installing dependencies"
  Invoke-Pnpm -PnpmArgs @("install")
  Write-Ok "Dependency installation finished."
  Write-Info "If pnpm shows 'Ignored build scripts ...', run 'pnpm approve-builds' only if you trust those packages."
}

if (Read-YesNo -Prompt "Run pnpm approve-builds now?" -Default $false) {
  Write-Step "Approving pnpm build scripts"
  Invoke-Pnpm -PnpmArgs @("approve-builds")
  Write-Ok "pnpm approve-builds completed."
}

if (Read-YesNo -Prompt "Create PostgreSQL database '$postgresDb' if missing?" -Default $true) {
  Write-Step "Ensuring PostgreSQL database exists"
  Create-PostgresDbIfNeeded -DbName $postgresDb -DbUser $postgresUser -DbPassword $postgresPass
}

Write-Step "Done"
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "  1) Run all via script: powershell -ExecutionPolicy Bypass -File .\\scripts\\run-dxp.ps1 -All -NodeDir '$NodeDir'" -ForegroundColor Gray
Write-Host "  2) Start FHIR local:  powershell -ExecutionPolicy Bypass -File .\\scripts\\run-dxp.ps1 -StartFhir -NodeDir '$NodeDir'" -ForegroundColor Gray
Write-Host "  3) FHIR status:       powershell -ExecutionPolicy Bypass -File .\\scripts\\run-dxp.ps1 -FhirStatus -NodeDir '$NodeDir'" -ForegroundColor Gray
Write-Host "  4) Seed FHIR:         powershell -ExecutionPolicy Bypass -File .\\scripts\\run-dxp.ps1 -SeedFhir -NodeDir '$NodeDir'" -ForegroundColor Gray
Write-Host "  5) Stop FHIR:         powershell -ExecutionPolicy Bypass -File .\\scripts\\run-dxp.ps1 -StopFhir -NodeDir '$NodeDir'" -ForegroundColor Gray
Write-Host "  6) Start BFF:         cd apps\\bff; pnpm start:dev" -ForegroundColor Gray
Write-Host "  7) Start Portal:      cd starters\\insurance-portal; pnpm dev" -ForegroundColor Gray
Write-Host "  8) Start Payer:       cd starters\\payer-portal; pnpm dev" -ForegroundColor Gray
Write-Host "  9) Optional checks:   curl http://localhost:$($ports.BFF)/api/v1/health" -ForegroundColor Gray
if ($script:PnpmCmd) {
  Write-Host " 10) Approve builds:    & '$script:PnpmCmd' approve-builds" -ForegroundColor Gray
} else {
  Write-Host " 10) Approve builds:    & '$script:CorepackCmd' pnpm approve-builds" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Local URLs (current configured ports):" -ForegroundColor Green
Write-Host "  Portal:      http://localhost:$($ports.PORTAL)" -ForegroundColor Gray
Write-Host "  BFF:         http://localhost:$($ports.BFF)/api/v1" -ForegroundColor Gray
Write-Host "  Payer:       http://localhost:$($ports.PAYER) (run starters\\payer-portal to enable)" -ForegroundColor Gray
Write-Host "  HAPI FHIR:   http://localhost:$($ports.FHIR)/fhir (local Java, start via run-dxp.ps1 -StartFhir)" -ForegroundColor Gray
Write-Host "  Keycloak:    http://localhost:$($ports.KEYCLOAK)" -ForegroundColor Gray
Write-Host "  Note: Kong/Redis are not provisioned by this script." -ForegroundColor Gray
