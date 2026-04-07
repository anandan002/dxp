param(
  [string]$NodeDir = "D:\soft\node-v24.14.0-win-x64",
  [string]$HapiWarPath = "",
  [string]$SnakeyamlJarPath = "",
  [string]$JettyRunnerJarPath = "",
  [switch]$StartBff,
  [switch]$StartPortal,
  [switch]$StartPayer,
  [switch]$StartFhir,
  [switch]$StopFhir,
  [switch]$FhirStatus,
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

function Write-Info {
  param([string]$Message)
  Write-Host "  - $Message" -ForegroundColor Gray
}

function Test-Command {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-ListeningProcessOnPort {
  param(
    [int]$Port
  )

  try {
    if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
      $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
      if ($conn) {
        return [int]$conn.OwningProcess
      }
    }
  } catch {}

  try {
    $line = netstat -ano | Select-String -Pattern "LISTENING\s+(\d+)$" | ForEach-Object { $_.Line } | Where-Object { $_ -match "[:\.]$Port\s+" } | Select-Object -First 1
    if ($line -and $line -match "LISTENING\s+(\d+)$") {
      return [int]$matches[1]
    }
  } catch {}

  return $null
}

function Test-TcpPortOpen {
  param(
    [string]$HostName = "localhost",
    [int]$Port,
    [int]$TimeoutMs = 1500
  )

  try {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
      $ar = $client.BeginConnect($HostName, $Port, $null, $null)
      if (-not $ar.AsyncWaitHandle.WaitOne($TimeoutMs, $false)) {
        return $false
      }
      $client.EndConnect($ar) | Out-Null
      return $true
    } finally {
      $client.Close()
    }
  } catch {
    return $false
  }
}

function Get-HttpStatusFast {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 8
  )

  if (Test-Command "curl.exe") {
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

function Get-DotEnvValue {
  param(
    [string]$FilePath,
    [string]$Key
  )

  if (-not (Test-Path $FilePath)) {
    return $null
  }

  $line = Get-Content -Path $FilePath -ErrorAction SilentlyContinue |
    Where-Object { $_ -match "^\s*$([regex]::Escape($Key))\s*=" } |
    Select-Object -Last 1

  if (-not $line) {
    return $null
  }

  return ($line -replace "^\s*$([regex]::Escape($Key))\s*=\s*", '').Trim()
}

function Invoke-PsqlAttempt {
  param(
    [string]$User,
    [string]$Database,
    [string]$Sql,
    [bool]$UsePassword,
    [string]$Password
  )

  $prevPassword = $env:PGPASSWORD
  if ($UsePassword -and -not [string]::IsNullOrWhiteSpace($Password)) {
    $env:PGPASSWORD = $Password
  } else {
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
    Output   = (($output | Out-String).Trim())
  }
}

function Ensure-PostgresDbExists {
  param(
    [pscustomobject]$DbConfig
  )

  if (-not (Test-Command "psql") -and -not (Test-Command "createdb")) {
    Write-WarnMsg "PostgreSQL CLI tools (psql/createdb) not found. Cannot auto-create DB '$($DbConfig.Name)'."
    return $false
  }

  if (-not (Test-TcpPortOpen -HostName "localhost" -Port 5432 -TimeoutMs 1500)) {
    Write-WarnMsg "PostgreSQL is not reachable on localhost:5432."
    return $false
  }

  $candidateUsers = @($DbConfig.User, "postgres", $env:USERNAME) |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
    Select-Object -Unique

  $dbNameSql = $DbConfig.Name.Replace("'", "''")
  $connectUser = $null
  $connectWithPassword = $true
  $lastDbError = $null

  if (Test-Command "psql") {
    foreach ($u in $candidateUsers) {
      $withPassword = Invoke-PsqlAttempt -User $u -Database "postgres" -Sql "SELECT current_user;" -UsePassword $true -Password $DbConfig.Password
      if ($withPassword.ExitCode -eq 0) {
        $connectUser = $u
        $connectWithPassword = $true
        break
      }

      $withoutPassword = Invoke-PsqlAttempt -User $u -Database "postgres" -Sql "SELECT current_user;" -UsePassword $false -Password $DbConfig.Password
      if ($withoutPassword.ExitCode -eq 0) {
        $connectUser = $u
        $connectWithPassword = $false
        break
      }

      $lastDbError = if (-not [string]::IsNullOrWhiteSpace($withoutPassword.Output)) {
        $withoutPassword.Output
      } else {
        $withPassword.Output
      }
    }

    if ($connectUser) {
      $existsResult = Invoke-PsqlAttempt -User $connectUser -Database "postgres" -Sql "SELECT 1 FROM pg_database WHERE datname = '$dbNameSql';" -UsePassword $connectWithPassword -Password $DbConfig.Password
      if ($existsResult.ExitCode -eq 0 -and $existsResult.Output -eq "1") {
        Write-Ok "PostgreSQL database '$($DbConfig.Name)' already exists."
        return $true
      }

      $dbNameQuoted = '"' + ($DbConfig.Name.Replace('"', '""')) + '"'
      $ownerQuoted = '"' + ($DbConfig.User.Replace('"', '""')) + '"'

      $createWithOwner = Invoke-PsqlAttempt -User $connectUser -Database "postgres" -Sql "CREATE DATABASE $dbNameQuoted OWNER $ownerQuoted;" -UsePassword $connectWithPassword -Password $DbConfig.Password
      if ($createWithOwner.ExitCode -eq 0) {
        Write-Ok "Created PostgreSQL database '$($DbConfig.Name)' (owner: $($DbConfig.User))."
        return $true
      }

      $createDefault = Invoke-PsqlAttempt -User $connectUser -Database "postgres" -Sql "CREATE DATABASE $dbNameQuoted;" -UsePassword $connectWithPassword -Password $DbConfig.Password
      if ($createDefault.ExitCode -eq 0) {
        Write-Ok "Created PostgreSQL database '$($DbConfig.Name)' with default owner."
        return $true
      }

      $lastDbError = if (-not [string]::IsNullOrWhiteSpace($createDefault.Output)) {
        $createDefault.Output
      } else {
        $createWithOwner.Output
      }
    }
  }

  if (Test-Command "createdb") {
    $oldPassword = $env:PGPASSWORD
    if (-not [string]::IsNullOrWhiteSpace($DbConfig.Password)) {
      $env:PGPASSWORD = $DbConfig.Password
    }
    try {
      & createdb -h localhost -p 5432 -U $DbConfig.User --no-password -- $DbConfig.Name 2>$null
      if ($LASTEXITCODE -eq 0) {
        Write-Ok "Created PostgreSQL database '$($DbConfig.Name)' using createdb."
        return $true
      }
    } catch {} finally {
      $env:PGPASSWORD = $oldPassword
    }
  }

  Write-WarnMsg "Could not ensure PostgreSQL database '$($DbConfig.Name)'."
  if (-not [string]::IsNullOrWhiteSpace($lastDbError)) {
    Write-WarnMsg "Last PostgreSQL error: $lastDbError"
  }
  Write-WarnMsg "Manual fallback: CREATE DATABASE $($DbConfig.Name);"
  return $false
}

function Resolve-JavaExecutable {
  param(
    [string]$PreferredBin
  )

  $candidates = @()
  if (-not [string]::IsNullOrWhiteSpace($PreferredBin)) {
    $candidates += (Join-Path $PreferredBin "java.exe")
  }

  if (-not [string]::IsNullOrWhiteSpace($script:JavaExe)) {
    $candidates += $script:JavaExe
  }

  $javaCommand = Get-Command java -ErrorAction SilentlyContinue
  if ($javaCommand -and $javaCommand.CommandType -eq 'Application' -and -not [string]::IsNullOrWhiteSpace($javaCommand.Source)) {
    $candidates += $javaCommand.Source
  }

  $rootCandidates = @(
    "C:\Program Files\Eclipse Adoptium",
    "C:\Program Files\Java",
    "C:\Program Files\Microsoft"
  )

  foreach ($root in $rootCandidates) {
    if (-not (Test-Path $root)) { continue }
    $binCandidates = Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue |
      Sort-Object Name -Descending |
      ForEach-Object { Join-Path $_.FullName "bin\java.exe" }
    $candidates += $binCandidates
  }

  foreach ($candidate in ($candidates | Select-Object -Unique)) {
    if (-not [string]::IsNullOrWhiteSpace($candidate) -and (Test-Path $candidate)) {
      return $candidate
    }
  }

  return $null
}

function Get-JavaMajorVersion {
  param(
    [string]$JavaExe
  )

  if ([string]::IsNullOrWhiteSpace($JavaExe)) {
    $JavaExe = Resolve-JavaExecutable
  }

  if ([string]::IsNullOrWhiteSpace($JavaExe) -or -not (Test-Path $JavaExe)) {
    return $null
  }

  try {
    $versionText = (& $JavaExe -version 2>&1 | Out-String)
    $match = [regex]::Match($versionText, '(?im)(openjdk|java)\s+version\s+"?(?<v>\d+(\.\d+)*)"')
    if (-not $match.Success) {
      $match = [regex]::Match($versionText, '"(?<v>\d+(\.\d+)*)"')
    }
    if (-not $match.Success) {
      return $null
    }

    $versionString = $match.Groups['v'].Value
    $parts = $versionString.Split('.')
    if ($parts[0] -eq '1' -and $parts.Length -ge 2) {
      return [int]$parts[1]
    }
    return [int]$parts[0]
  } catch {
    return $null
  }
}

function Ensure-Java17 {
  $script:JavaExe = Resolve-JavaExecutable
  $major = Get-JavaMajorVersion -JavaExe $script:JavaExe
  if (-not $major -and -not [string]::IsNullOrWhiteSpace($script:JavaExe)) {
    $pathMatch = [regex]::Match($script:JavaExe, '(?i)jdk-(?<major>\d+)')
    if ($pathMatch.Success) {
      $major = [int]$pathMatch.Groups['major'].Value
    }
  }
  if ($major -ge 17) {
    Write-Ok "Java $major detected ($script:JavaExe)."
    return
  }

  if (-not (Test-Command "winget")) {
    throw "Java 17+ not found and winget is unavailable. Install Temurin/OpenJDK 17+ and rerun."
  }

  Write-Step "Installing Java 17 (Temurin) via winget"
  $wingetFailed = $false
  try {
    & winget install --id EclipseAdoptium.Temurin.17.JDK -e --accept-package-agreements --accept-source-agreements --silent
    if ($LASTEXITCODE -ne 0) {
      $wingetFailed = $true
      Write-WarnMsg "winget Java install returned exit code $LASTEXITCODE."
    }
  } catch {
    $wingetFailed = $true
    Write-WarnMsg "winget Java install command failed: $($_.Exception.Message)"
  }

  $candidateBin = Get-ChildItem -Path "C:\Program Files\Eclipse Adoptium" -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    ForEach-Object { Join-Path $_.FullName "bin" } |
    Where-Object { Test-Path (Join-Path $_ "java.exe") } |
    Select-Object -First 1

  if ($candidateBin -and -not ($env:Path.Split(';') -contains $candidateBin)) {
    $env:Path = "$candidateBin;$env:Path"
    Write-Info "Added Java bin to current session PATH: $candidateBin"
  }

  Start-Sleep -Seconds 1
  $script:JavaExe = Resolve-JavaExecutable -PreferredBin $candidateBin
  $major = Get-JavaMajorVersion -JavaExe $script:JavaExe
  if (-not $major -and -not [string]::IsNullOrWhiteSpace($script:JavaExe)) {
    $pathMatch = [regex]::Match($script:JavaExe, '(?i)jdk-(?<major>\d+)')
    if ($pathMatch.Success) {
      $major = [int]$pathMatch.Groups['major'].Value
    }
  }
  if ($major -lt 17) {
    if ($wingetFailed) {
      throw "Java 17+ is unavailable after winget attempt. Install Java 17+ manually and rerun."
    }
    throw "Java 17+ is still unavailable after install attempt."
  }

  Write-Ok "Java $major is ready ($script:JavaExe)."
}

function Get-FhirDbConfig {
  $envPath = Join-Path $repoRoot ".env"
  $dbUser = Get-DotEnvValue -FilePath $envPath -Key "POSTGRES_USER"
  $dbPassword = Get-DotEnvValue -FilePath $envPath -Key "POSTGRES_PASSWORD"
  $dbName = Get-DotEnvValue -FilePath $envPath -Key "HAPI_FHIR_DB"

  if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "dxp" }
  if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "hapi_fhir" }
  if ($null -eq $dbPassword) { $dbPassword = "" }

  return [pscustomobject]@{
    Host = "localhost"
    Port = 5432
    Name = $dbName
    User = $dbUser
    Password = $dbPassword
  }
}

function Escape-YamlSingleQuoted {
  param([AllowNull()][string]$Value)
  if ($null -eq $Value) { return "''" }
  return "'" + $Value.Replace("'", "''") + "'"
}

function Ensure-HapiWar {
  $versionRoot = Join-Path $script:HapiToolsRoot $script:HapiVersion
  $warPath = Join-Path $versionRoot $script:HapiWarName

  if (-not [string]::IsNullOrWhiteSpace($HapiWarPath)) {
    if (-not (Test-Path $HapiWarPath)) {
      throw "Provided -HapiWarPath does not exist: $HapiWarPath"
    }
    New-Item -ItemType Directory -Path $versionRoot -Force | Out-Null
    Copy-Item -LiteralPath $HapiWarPath -Destination $warPath -Force
    Write-Ok "Using provided HAPI WAR from: $HapiWarPath"
    return $warPath
  }

  if (Test-Path $warPath) {
    Write-Ok "Using cached HAPI WAR: $warPath"
    return $warPath
  }

  New-Item -ItemType Directory -Path $versionRoot -Force | Out-Null
  Write-Step "Downloading HAPI FHIR starter $($script:HapiVersion)"

  try {
    [Net.ServicePointManager]::SecurityProtocol = `
      [Net.SecurityProtocolType]::Tls12 -bor `
      [Net.SecurityProtocolType]::Tls11 -bor `
      [Net.SecurityProtocolType]::Tls
  } catch {}

  $downloadUrls = @(
    $script:HapiWarUrl,
    "https://repo1.maven.org/maven2/ca/uhn/hapi/fhir/hapi-fhir-jpaserver-starter/$($script:HapiVersion)/$($script:HapiWarName)",
    "https://search.maven.org/remotecontent?filepath=ca/uhn/hapi/fhir/hapi-fhir-jpaserver-starter/$($script:HapiVersion)/$($script:HapiWarName)"
  ) | Select-Object -Unique

  $errors = @()
  foreach ($url in $downloadUrls) {
    try {
      Write-Info "Trying: $url"
      Invoke-WebRequest -Uri $url -OutFile $warPath -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 120
      if (Test-Path $warPath) {
        $size = (Get-Item -LiteralPath $warPath).Length
        if ($size -gt 0) {
          Write-Ok "Downloaded HAPI WAR from: $url"
          return $warPath
        }
      }
      $errors += "Empty file from $url"
    } catch {
      $errors += "$url -> $($_.Exception.Message)"
    }
  }

  $errorSummary = ($errors -join "; ")
  throw "Failed to download HAPI starter. Tried: $($downloadUrls -join ', '). Errors: $errorSummary. Download manually to '$warPath' or rerun with -HapiWarPath '<local-war-path>'."
}

function Ensure-SnakeyamlJar {
  $libRoot = Join-Path $script:HapiToolsRoot "lib"
  $jarPath = Join-Path $libRoot $script:SnakeyamlJarName

  if (-not [string]::IsNullOrWhiteSpace($SnakeyamlJarPath)) {
    if (-not (Test-Path $SnakeyamlJarPath)) {
      throw "Provided -SnakeyamlJarPath does not exist: $SnakeyamlJarPath"
    }
    New-Item -ItemType Directory -Path $libRoot -Force | Out-Null
    Copy-Item -LiteralPath $SnakeyamlJarPath -Destination $jarPath -Force
    Write-Ok "Using provided snakeyaml jar from: $SnakeyamlJarPath"
    return $jarPath
  }

  if (Test-Path $jarPath) {
    Write-Ok "Using cached snakeyaml jar: $jarPath"
    return $jarPath
  }

  New-Item -ItemType Directory -Path $libRoot -Force | Out-Null
  Write-Step "Downloading snakeyaml $($script:SnakeyamlVersion)"

  $downloadUrls = @(
    $script:SnakeyamlJarUrl,
    "https://repo1.maven.org/maven2/org/yaml/snakeyaml/$($script:SnakeyamlVersion)/$($script:SnakeyamlJarName)",
    "https://search.maven.org/remotecontent?filepath=org/yaml/snakeyaml/$($script:SnakeyamlVersion)/$($script:SnakeyamlJarName)"
  ) | Select-Object -Unique

  $errors = @()
  foreach ($url in $downloadUrls) {
    try {
      Write-Info "Trying: $url"
      Invoke-WebRequest -Uri $url -OutFile $jarPath -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 120
      if ((Test-Path $jarPath) -and ((Get-Item -LiteralPath $jarPath).Length -gt 0)) {
        Write-Ok "Downloaded snakeyaml from: $url"
        return $jarPath
      }
      $errors += "Empty file from $url"
    } catch {
      $errors += "$url -> $($_.Exception.Message)"
    }
  }

  $errorSummary = ($errors -join "; ")
  throw "Failed to download snakeyaml. Tried: $($downloadUrls -join ', '). Errors: $errorSummary. Download manually to '$jarPath' and rerun with -SnakeyamlJarPath '$jarPath'."
}

function Ensure-JettyRunnerJar {
  $libRoot = Join-Path $script:HapiToolsRoot "lib"
  $target = Join-Path $libRoot $script:JettyRunnerJarName

  if (-not [string]::IsNullOrWhiteSpace($JettyRunnerJarPath)) {
    if (-not (Test-Path $JettyRunnerJarPath)) {
      throw "Provided -JettyRunnerJarPath does not exist: $JettyRunnerJarPath"
    }
    New-Item -ItemType Directory -Path $libRoot -Force | Out-Null
    Copy-Item -LiteralPath $JettyRunnerJarPath -Destination $target -Force
    Write-Ok "Using provided Jetty Runner jar from: $JettyRunnerJarPath"
    return $target
  }

  if (Test-Path $target) {
    Write-Ok "Using cached Jetty Runner jar: $target"
    return $target
  }

  New-Item -ItemType Directory -Path $libRoot -Force | Out-Null
  Write-Step "Downloading Jetty Runner $($script:JettyRunnerVersion)"

  $downloadUrls = @(
    $script:JettyRunnerJarUrl,
    "https://repo.maven.apache.org/maven2/org/eclipse/jetty/jetty-runner/$($script:JettyRunnerVersion)/$($script:JettyRunnerJarName)",
    "https://search.maven.org/remotecontent?filepath=org/eclipse/jetty/jetty-runner/$($script:JettyRunnerVersion)/$($script:JettyRunnerJarName)"
  ) | Select-Object -Unique

  $errs = @()
  foreach ($url in $downloadUrls) {
    try {
      Write-Info "Trying: $url"
      Invoke-WebRequest -Uri $url -OutFile $target -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 120
      if ((Test-Path $target) -and ((Get-Item -LiteralPath $target).Length -gt 0)) {
        Write-Ok "Downloaded Jetty Runner from: $url"
        return $target
      }
      $errs += "Empty file from $url"
    } catch {
      $errs += "$url -> $($_.Exception.Message)"
    }
  }

  $summary = ($errs -join "; ")
  throw "Failed to download Jetty Runner. Tried: $($downloadUrls -join ', '). Errors: $summary. Download manually to '$target' and rerun with -JettyRunnerJarPath '$target'."
}

function Get-HapiWarPathHint {
  $versionRoot = Join-Path $script:HapiToolsRoot $script:HapiVersion
  return Join-Path $versionRoot $script:HapiWarName
}

function Show-HapiManualDownloadHint {
  $target = Get-HapiWarPathHint
  Write-WarnMsg "HAPI WAR download failed in this environment."
  Write-Info "Manual download URL: $($script:HapiWarUrl)"
  Write-Info "Save as: $target"
  Write-Info "Then run with: -HapiWarPath '$target'"
}

function Get-HapiProcessFromPidFile {
  if (-not (Test-Path $script:HapiPidFile)) {
    return $null
  }

  try {
    $pidText = (Get-Content -LiteralPath $script:HapiPidFile -Raw).Trim()
    if ([string]::IsNullOrWhiteSpace($pidText)) {
      Remove-Item -LiteralPath $script:HapiPidFile -Force -ErrorAction SilentlyContinue
      return $null
    }

    $pidValue = [int]$pidText
    $proc = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
    if ($proc) {
      return $proc
    }
  } catch {}

  Remove-Item -LiteralPath $script:HapiPidFile -Force -ErrorAction SilentlyContinue
  return $null
}

function Write-HapiRuntimeConfig {
  param(
    [pscustomobject]$DbConfig
  )

  New-Item -ItemType Directory -Path $script:HapiRuntimeDir -Force | Out-Null

  $props = @(
    "spring.datasource.url=jdbc:postgresql://$($DbConfig.Host):$($DbConfig.Port)/$($DbConfig.Name)",
    "spring.datasource.username=$($DbConfig.User)",
    "spring.datasource.password=$($DbConfig.Password)",
    "spring.datasource.driverClassName=org.postgresql.Driver",
    "spring.batch.job.enabled=false",
    "spring.jpa.properties.hibernate.search.enabled=false",
    "hapi.fhir.fhir_version=R4",
    "hapi.fhir.allow_external_references=true",
    "hapi.fhir.allow_cascading_deletes=true",
    "hapi.fhir.cors.allow_Credentials=true",
    "hapi.fhir.cors.allowed_origin=*",
    "hapi.fhir.tester.home.name=Local Test Server",
    "hapi.fhir.tester.home.server_address=http://localhost:5028/fhir",
    "hapi.fhir.tester.home.refuse_to_fetch_third_party_urls=false"
  )

  Set-Content -LiteralPath $script:HapiConfigPath -Value ($props -join [Environment]::NewLine) -Encoding UTF8
  $legacyYaml = Join-Path $script:HapiRuntimeDir "application.yaml"
  if (Test-Path $legacyYaml) {
    Remove-Item -LiteralPath $legacyYaml -Force -ErrorAction SilentlyContinue
    Write-Info "Removed legacy runtime YAML config: $legacyYaml"
  }
  Write-Ok "Generated HAPI runtime config: $($script:HapiConfigPath)"
}

function Wait-ForFhir {
  param(
    [int]$MaxAttempts = 60,
    [int]$DelaySeconds = 3
  )

  for ($i = 1; $i -le $MaxAttempts; $i++) {
    $statusCode = Get-HttpStatusFast -Url $script:FhirMetadataUrl -TimeoutSeconds 8
    if ($null -ne $statusCode -and $statusCode -ge 200 -and $statusCode -lt 300) {
      Write-Ok "FHIR is reachable: $($script:FhirMetadataUrl) (HTTP $statusCode)"
      return $true
    }
    Start-Sleep -Seconds $DelaySeconds
  }

  Write-WarnMsg "FHIR did not become ready on $($script:FhirMetadataUrl)"
  return $false
}

function Show-FhirStatus {
  $proc = Get-HapiProcessFromPidFile
  if ($proc) {
    Write-Ok "Local HAPI process is running (PID: $($proc.Id), Name: $($proc.ProcessName))."
  } else {
    Write-Info "No local HAPI PID file process found."
  }

  $statusCode = Get-HttpStatusFast -Url $script:FhirMetadataUrl -TimeoutSeconds 8
  if ($null -ne $statusCode -and $statusCode -ge 200 -and $statusCode -lt 300) {
    Write-Ok "FHIR metadata is reachable: HTTP $statusCode at $($script:FhirMetadataUrl)"
  } else {
    if ($null -ne $statusCode) {
      Write-WarnMsg "FHIR metadata endpoint returned HTTP $statusCode (expected 2xx): $($script:FhirMetadataUrl)"
    } else {
      Write-WarnMsg "FHIR metadata endpoint is not reachable: $($script:FhirMetadataUrl)"
    }
  }

  if (Test-Path $script:HapiOutLogPath) {
    Write-Info "stdout log: $($script:HapiOutLogPath)"
  }
  if (Test-Path $script:HapiErrLogPath) {
    Write-Info "stderr log: $($script:HapiErrLogPath)"
  }
}

function Stop-LocalHapiFhir {
  $proc = Get-HapiProcessFromPidFile
  if (-not $proc) {
    Write-Info "No tracked local HAPI process to stop."
    return
  }

  try {
    Stop-Process -Id $proc.Id -Force -ErrorAction Stop
    Write-Ok "Stopped local HAPI process (PID: $($proc.Id))."
  } catch {
    Write-WarnMsg "Failed to stop local HAPI process PID $($proc.Id): $($_.Exception.Message)"
  } finally {
    Remove-Item -LiteralPath $script:HapiPidFile -Force -ErrorAction SilentlyContinue
  }
}

function Start-LocalHapiFhir {
  $existingStatus = Get-HttpStatusFast -Url $script:FhirMetadataUrl -TimeoutSeconds 8
  if ($null -ne $existingStatus -and $existingStatus -ge 200 -and $existingStatus -lt 300) {
    Write-Ok "FHIR already running (HTTP $existingStatus): $($script:FhirMetadataUrl)"
    return $true
  }

  Ensure-Java17
  $warPath = $null
  try {
    $warPath = Ensure-HapiWar
  } catch {
    Show-HapiManualDownloadHint
    throw
  }
  $snakeyamlJar = Ensure-SnakeyamlJar
  $jettyRunnerJar = Ensure-JettyRunnerJar
  $dbConfig = Get-FhirDbConfig
  Write-Info "Using PostgreSQL for HAPI: $($dbConfig.User)@localhost:$($dbConfig.Port)/$($dbConfig.Name)"

  if (-not (Ensure-PostgresDbExists -DbConfig $dbConfig)) {
    throw "Failed to ensure PostgreSQL database '$($dbConfig.Name)' for local HAPI."
  }

  Write-HapiRuntimeConfig -DbConfig $dbConfig

  $existingProc = Get-HapiProcessFromPidFile
  if ($existingProc) {
    Write-WarnMsg "Found existing tracked HAPI process (PID: $($existingProc.Id)). Waiting for readiness."
    return (Wait-ForFhir)
  }

  $portOwnerPid = Get-ListeningProcessOnPort -Port 5028
  if ($portOwnerPid) {
    if ($portOwnerPid -ne $PID) {
      $portProc = Get-Process -Id $portOwnerPid -ErrorAction SilentlyContinue
      if ($portProc) {
        throw "Port 5028 is already in use by PID $portOwnerPid ($($portProc.ProcessName)). Stop that process and rerun -StartFhir."
      }
      throw "Port 5028 is already in use by PID $portOwnerPid. Stop that process and rerun -StartFhir."
    }
  }

  $configUri = ([System.Uri]::new($script:HapiConfigPath)).AbsoluteUri
  New-Item -ItemType Directory -Path $script:HapiRuntimeDir -Force | Out-Null

  $classpath = (@($jettyRunnerJar, $snakeyamlJar) -join ";")
  $args = @(
    "-Dspring.config.location=$configUri",
    "-cp",
    $classpath,
    "org.eclipse.jetty.runner.Runner",
    "--port",
    "5028",
    "--path",
    "/",
    $warPath
  )

  $javaExe = $script:JavaExe
  if ([string]::IsNullOrWhiteSpace($javaExe)) {
    $javaExe = Resolve-JavaExecutable
  }
  if ([string]::IsNullOrWhiteSpace($javaExe) -or -not (Test-Path $javaExe)) {
    throw "java.exe could not be resolved for starting HAPI."
  }

  $proc = Start-Process -FilePath $javaExe -ArgumentList $args -WorkingDirectory (Split-Path -Parent $warPath) -RedirectStandardOutput $script:HapiOutLogPath -RedirectStandardError $script:HapiErrLogPath -PassThru
  Set-Content -LiteralPath $script:HapiPidFile -Value $proc.Id -Encoding ASCII
  Write-Ok "Started local HAPI process (PID: $($proc.Id))."

  if (Wait-ForFhir) {
    return $true
  }

  Write-WarnMsg "Local HAPI logs:"
  Write-Info "stdout: $($script:HapiOutLogPath)"
  Write-Info "stderr: $($script:HapiErrLogPath)"
  return $false
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$pnpmCmd = Join-Path $NodeDir "pnpm.cmd"
$corepackCmd = Join-Path $NodeDir "corepack.cmd"

if (-not (Test-Path $pnpmCmd) -and -not (Test-Path $corepackCmd)) {
  throw "pnpm/corepack not found under '$NodeDir'."
}

$script:FhirMetadataUrl = "http://localhost:5028/fhir/metadata"
$script:HapiVersion = "5.4.0"
$script:HapiWarName = "hapi-fhir-jpaserver-starter-$($script:HapiVersion).war"
$script:HapiWarUrl = "https://repo.maven.apache.org/maven2/ca/uhn/hapi/fhir/hapi-fhir-jpaserver-starter/$($script:HapiVersion)/$($script:HapiWarName)"
$script:SnakeyamlVersion = "1.33"
$script:SnakeyamlJarName = "snakeyaml-$($script:SnakeyamlVersion).jar"
$script:SnakeyamlJarUrl = "https://repo.maven.apache.org/maven2/org/yaml/snakeyaml/$($script:SnakeyamlVersion)/$($script:SnakeyamlJarName)"
$script:JettyRunnerVersion = "9.4.57.v20241219"
$script:JettyRunnerJarName = "jetty-runner-$($script:JettyRunnerVersion).jar"
$script:JettyRunnerJarUrl = "https://repo1.maven.org/maven2/org/eclipse/jetty/jetty-runner/$($script:JettyRunnerVersion)/$($script:JettyRunnerJarName)"
$script:HapiToolsRoot = Join-Path $repoRoot ".tools\hapi-fhir"
$script:HapiRuntimeDir = Join-Path $script:HapiToolsRoot "runtime"
$script:HapiConfigPath = Join-Path $script:HapiRuntimeDir "application.properties"
$script:HapiPidFile = Join-Path $script:HapiRuntimeDir "hapi.pid"
$script:HapiOutLogPath = Join-Path $script:HapiRuntimeDir "hapi.out.log"
$script:HapiErrLogPath = Join-Path $script:HapiRuntimeDir "hapi.err.log"
$script:JavaExe = $null

function Invoke-Pnpm {
  param(
    [string]$WorkingDir,
    [string[]]$PnpmArgs
  )

  Push-Location $WorkingDir
  try {
    if (-not $PnpmArgs -or $PnpmArgs.Count -eq 0) {
      throw "Invoke-Pnpm requires at least one pnpm argument."
    }
    if (Test-Path $pnpmCmd) {
      & $pnpmCmd @PnpmArgs
    } else {
      & $corepackCmd pnpm @PnpmArgs
    }
    if ($LASTEXITCODE -ne 0) {
      throw "pnpm command failed in '$WorkingDir' with exit code ${LASTEXITCODE}: pnpm $($PnpmArgs -join ' ')"
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

if (-not ($StartBff -or $StartPortal -or $StartPayer -or $StartFhir -or $StopFhir -or $FhirStatus -or $SeedFhir -or $HealthCheck -or $ApproveBuilds)) {
  Write-WarnMsg "No action selected. Use -All or one/more of: -StartBff -StartPortal -StartPayer -StartFhir -StopFhir -FhirStatus -SeedFhir -HealthCheck -ApproveBuilds"
  exit 1
}

if ($ApproveBuilds) {
  Write-Step "Running pnpm approve-builds"
  Invoke-Pnpm -WorkingDir $repoRoot -PnpmArgs @("approve-builds")
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

if ($StopFhir) {
  Write-Step "Stopping local HAPI FHIR"
  Stop-LocalHapiFhir
}

if ($StartFhir) {
  Write-Step "Starting local HAPI FHIR on :5028 (no Docker)"
  $ok = Start-LocalHapiFhir
  if (-not $ok) {
    throw "Failed to start local HAPI FHIR."
  }
}

if ($FhirStatus) {
  Write-Step "Checking local HAPI FHIR status"
  Show-FhirStatus
}

if ($SeedFhir) {
  Write-Step "Seeding FHIR data"
  $seedDir = Join-Path $repoRoot "apps\bff"
  Invoke-Pnpm -WorkingDir $seedDir -PnpmArgs @("seed:fhir")
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

  if ($StartFhir -or $SeedFhir -or $FhirStatus -or $All) {
    $fhirStatus = Get-HttpStatusFast -Url $script:FhirMetadataUrl -TimeoutSeconds 10
    if ($null -ne $fhirStatus -and $fhirStatus -ge 200 -and $fhirStatus -lt 300) {
      Write-Ok "FHIR metadata HTTP ${fhirStatus}: $($script:FhirMetadataUrl)"
    } elseif ($null -ne $fhirStatus) {
      Write-WarnMsg "FHIR metadata check returned HTTP ${fhirStatus} (expected 2xx): $($script:FhirMetadataUrl)"
    } else {
      Write-WarnMsg "FHIR health check failed: unable to reach $($script:FhirMetadataUrl)"
    }
  }
}

Write-Step "Done"
Write-Host "Examples:" -ForegroundColor Green
Write-Host "  powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -All -NodeDir 'D:\soft\node-v24.14.0-win-x64'" -ForegroundColor Gray
Write-Host "  powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -StartBff -StartPortal -NodeDir 'D:\soft\node-v24.14.0-win-x64'" -ForegroundColor Gray
Write-Host "  powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -StartBff -StartPayer -HealthCheck -NodeDir 'D:\soft\node-v24.14.0-win-x64'" -ForegroundColor Gray
Write-Host "  powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -StartFhir -SeedFhir -HealthCheck -NodeDir 'D:\soft\node-v24.14.0-win-x64'" -ForegroundColor Gray
Write-Host "  powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -FhirStatus -NodeDir 'D:\soft\node-v24.14.0-win-x64'" -ForegroundColor Gray
Write-Host "  powershell -ExecutionPolicy Bypass -File .\scripts\run-dxp.ps1 -StopFhir -NodeDir 'D:\soft\node-v24.14.0-win-x64'" -ForegroundColor Gray
