param(
  [string]$NodeDir = "D:\soft\node-v24.14.0-win-x64",
  [string]$RepoRoot = "D:\dxp",
  [string]$HapiWarPath = "",
  [string]$SnakeyamlJarPath = "",
  [string]$JettyRunnerJarPath = "",
  [int]$FhirPort = 5028
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

  if (-not (Test-TcpPortOpen -HostName "localhost" -Port 5432 -TimeoutMs 1500)) {
    throw "PostgreSQL is not reachable on localhost:5432."
  }

  if (-not (Test-Command "psql") -and -not (Test-Command "createdb")) {
    Write-Info "PostgreSQL CLI tools (psql/createdb) are unavailable in service context. Skipping DB create/check for '$($DbConfig.Name)'."
    return
  }

  $candidateUsers = @($DbConfig.User, "postgres", $env:USERNAME) |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
    Select-Object -Unique

  $dbNameSql = $DbConfig.Name.Replace("'", "''")
  $connectUser = $null
  $connectWithPassword = $true

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
  }

  if (-not $connectUser) {
    throw "Could not connect to PostgreSQL to create/check '$($DbConfig.Name)'."
  }

  $existsResult = Invoke-PsqlAttempt -User $connectUser -Database "postgres" -Sql "SELECT 1 FROM pg_database WHERE datname = '$dbNameSql';" -UsePassword $connectWithPassword -Password $DbConfig.Password
  if ($existsResult.ExitCode -eq 0 -and $existsResult.Output -eq "1") {
    Write-Ok "PostgreSQL database '$($DbConfig.Name)' already exists."
    return
  }

  $dbNameQuoted = '"' + ($DbConfig.Name.Replace('"', '""')) + '"'
  $ownerQuoted = '"' + ($DbConfig.User.Replace('"', '""')) + '"'
  $createWithOwner = Invoke-PsqlAttempt -User $connectUser -Database "postgres" -Sql "CREATE DATABASE $dbNameQuoted OWNER $ownerQuoted;" -UsePassword $connectWithPassword -Password $DbConfig.Password
  if ($createWithOwner.ExitCode -eq 0) {
    Write-Ok "Created PostgreSQL database '$($DbConfig.Name)' (owner: $($DbConfig.User))."
    return
  }

  $createDefault = Invoke-PsqlAttempt -User $connectUser -Database "postgres" -Sql "CREATE DATABASE $dbNameQuoted;" -UsePassword $connectWithPassword -Password $DbConfig.Password
  if ($createDefault.ExitCode -eq 0) {
    Write-Ok "Created PostgreSQL database '$($DbConfig.Name)' with default owner."
    return
  }

  throw "Could not create PostgreSQL database '$($DbConfig.Name)'."
}

function Resolve-JavaExecutable {
  if (-not [string]::IsNullOrWhiteSpace($env:JAVA_HOME)) {
    $javaFromHome = Join-Path $env:JAVA_HOME "bin\java.exe"
    if (Test-Path $javaFromHome) {
      return $javaFromHome
    }
  }

  $javaCommand = Get-Command java -ErrorAction SilentlyContinue
  if ($javaCommand -and $javaCommand.CommandType -eq 'Application' -and -not [string]::IsNullOrWhiteSpace($javaCommand.Source)) {
    return $javaCommand.Source
  }

  $registryKeys = @(
    "HKLM:\SOFTWARE\JavaSoft\JDK",
    "HKLM:\SOFTWARE\JavaSoft\Java Development Kit",
    "HKLM:\SOFTWARE\Eclipse Adoptium\JDK"
  )

  foreach ($key in $registryKeys) {
    if (-not (Test-Path $key)) {
      continue
    }

    $subkeys = Get-ChildItem -Path $key -ErrorAction SilentlyContinue | Sort-Object PSChildName -Descending
    foreach ($subkey in $subkeys) {
      try {
        $javaHome = (Get-ItemProperty -Path $subkey.PSPath -ErrorAction SilentlyContinue).JavaHome
        if (-not [string]::IsNullOrWhiteSpace($javaHome)) {
          $javaExe = Join-Path $javaHome "bin\java.exe"
          if (Test-Path $javaExe) {
            return $javaExe
          }
        }
      } catch {}
    }
  }

  $rootCandidates = @(
    "C:\Program Files\Eclipse Adoptium",
    "C:\Program Files\Java",
    "C:\Program Files\Microsoft"
  )

  foreach ($root in $rootCandidates) {
    if (-not (Test-Path $root)) { continue }
    $candidate = Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue |
      Sort-Object Name -Descending |
      ForEach-Object { Join-Path $_.FullName "bin\java.exe" } |
      Where-Object { Test-Path $_ } |
      Select-Object -First 1
    if ($candidate) {
      return $candidate
    }
  }

  return $null
}

function Get-JavaMajorVersion {
  param(
    [string]$JavaExe
  )

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
  $javaExe = Resolve-JavaExecutable
  if ([string]::IsNullOrWhiteSpace($javaExe) -or -not (Test-Path $javaExe)) {
    throw "Java 17+ is required for local HAPI FHIR service. java.exe was not found."
  }

  $major = Get-JavaMajorVersion -JavaExe $javaExe
  if (-not $major) {
    $pathMatch = [regex]::Match($javaExe, '(?i)jdk-(?<major>\d+)')
    if ($pathMatch.Success) {
      $major = [int]$pathMatch.Groups['major'].Value
    }
  }
  if ($major -lt 17) {
    throw "Java 17+ is required for local HAPI FHIR service. Detected '$javaExe' (major=$major)."
  }

  Write-Ok "Java $major detected ($javaExe)."
  return $javaExe
}

function Ensure-Download {
  param(
    [string]$TargetPath,
    [string[]]$Urls
  )

  if (Test-Path $TargetPath) {
    $size = (Get-Item -LiteralPath $TargetPath).Length
    if ($size -gt 0) {
      return
    }
  }

  New-Item -ItemType Directory -Path (Split-Path -Parent $TargetPath) -Force | Out-Null
  $errors = @()
  foreach ($url in ($Urls | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)) {
    try {
      Write-Info "Trying: $url"
      Invoke-WebRequest -Uri $url -OutFile $TargetPath -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 120
      if ((Test-Path $TargetPath) -and ((Get-Item -LiteralPath $TargetPath).Length -gt 0)) {
        return
      }
      $errors += "Empty file from $url"
    } catch {
      $errors += "$url -> $($_.Exception.Message)"
    }
  }

  throw "Failed to download artifact '$TargetPath'. Errors: $($errors -join '; ')"
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
    return $warPath
  }

  Ensure-Download -TargetPath $warPath -Urls @(
    $script:HapiWarUrl,
    "https://repo1.maven.org/maven2/ca/uhn/hapi/fhir/hapi-fhir-jpaserver-starter/$($script:HapiVersion)/$($script:HapiWarName)"
  )

  return $warPath
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
    return $jarPath
  }

  Ensure-Download -TargetPath $jarPath -Urls @(
    $script:SnakeyamlJarUrl,
    "https://repo1.maven.org/maven2/org/yaml/snakeyaml/$($script:SnakeyamlVersion)/$($script:SnakeyamlJarName)"
  )

  return $jarPath
}

function Ensure-JettyRunnerJar {
  $libRoot = Join-Path $script:HapiToolsRoot "lib"
  $jarPath = Join-Path $libRoot $script:JettyRunnerJarName

  if (-not [string]::IsNullOrWhiteSpace($JettyRunnerJarPath)) {
    if (-not (Test-Path $JettyRunnerJarPath)) {
      throw "Provided -JettyRunnerJarPath does not exist: $JettyRunnerJarPath"
    }
    New-Item -ItemType Directory -Path $libRoot -Force | Out-Null
    Copy-Item -LiteralPath $JettyRunnerJarPath -Destination $jarPath -Force
    return $jarPath
  }

  Ensure-Download -TargetPath $jarPath -Urls @(
    $script:JettyRunnerJarUrl,
    "https://repo.maven.apache.org/maven2/org/eclipse/jetty/jetty-runner/$($script:JettyRunnerVersion)/$($script:JettyRunnerJarName)"
  )

  return $jarPath
}

function Get-FhirDbConfig {
  $envPath = Join-Path $RepoRoot ".env"
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
    "hapi.fhir.tester.home.server_address=http://localhost:$FhirPort/fhir",
    "hapi.fhir.tester.home.refuse_to_fetch_third_party_urls=false"
  )

  Set-Content -LiteralPath $script:HapiConfigPath -Value ($props -join [Environment]::NewLine) -Encoding UTF8
  $legacyYaml = Join-Path $script:HapiRuntimeDir "application.yaml"
  if (Test-Path $legacyYaml) {
    Remove-Item -LiteralPath $legacyYaml -Force -ErrorAction SilentlyContinue
  }
}

$script:HapiVersion = "5.4.0"
$script:HapiWarName = "hapi-fhir-jpaserver-starter-$($script:HapiVersion).war"
$script:HapiWarUrl = "https://repo.maven.apache.org/maven2/ca/uhn/hapi/fhir/hapi-fhir-jpaserver-starter/$($script:HapiVersion)/$($script:HapiWarName)"
$script:SnakeyamlVersion = "1.33"
$script:SnakeyamlJarName = "snakeyaml-$($script:SnakeyamlVersion).jar"
$script:SnakeyamlJarUrl = "https://repo.maven.apache.org/maven2/org/yaml/snakeyaml/$($script:SnakeyamlVersion)/$($script:SnakeyamlJarName)"
$script:JettyRunnerVersion = "9.4.57.v20241219"
$script:JettyRunnerJarName = "jetty-runner-$($script:JettyRunnerVersion).jar"
$script:JettyRunnerJarUrl = "https://repo1.maven.org/maven2/org/eclipse/jetty/jetty-runner/$($script:JettyRunnerVersion)/$($script:JettyRunnerJarName)"
$script:HapiToolsRoot = Join-Path $RepoRoot ".tools\hapi-fhir"
$script:HapiRuntimeDir = Join-Path $script:HapiToolsRoot "runtime"
$script:HapiConfigPath = Join-Path $script:HapiRuntimeDir "application.properties"

Write-Step "Preparing local HAPI FHIR service runtime"
$javaExe = Ensure-Java17
$warPath = Ensure-HapiWar
$snakeyamlJar = Ensure-SnakeyamlJar
$jettyRunnerJar = Ensure-JettyRunnerJar
$dbConfig = Get-FhirDbConfig
Write-Info "Using PostgreSQL: $($dbConfig.User)@localhost:$($dbConfig.Port)/$($dbConfig.Name)"
Ensure-PostgresDbExists -DbConfig $dbConfig
Write-HapiRuntimeConfig -DbConfig $dbConfig
Write-Ok "FHIR runtime configuration prepared."

$portOwnerPid = Get-ListeningProcessOnPort -Port $FhirPort
if ($portOwnerPid -and $portOwnerPid -ne $PID) {
  $proc = Get-Process -Id $portOwnerPid -ErrorAction SilentlyContinue
  if ($proc) {
    throw "Port $FhirPort is already in use by PID $portOwnerPid ($($proc.ProcessName))."
  }
  throw "Port $FhirPort is already in use by PID $portOwnerPid."
}

$configUri = ([System.Uri]::new($script:HapiConfigPath)).AbsoluteUri
$classpath = (@($jettyRunnerJar, $snakeyamlJar) -join ";")
$args = @(
  "-Dspring.config.location=$configUri",
  "-cp",
  $classpath,
  "org.eclipse.jetty.runner.Runner",
  "--port",
  "$FhirPort",
  "--path",
  "/",
  $warPath
)

Write-Step "Starting local HAPI FHIR in foreground on :$FhirPort"
Set-Location -Path (Split-Path -Parent $warPath)
& $javaExe @args
$exitCode = $LASTEXITCODE
if ($exitCode -ne 0) {
  throw "HAPI FHIR process exited with code $exitCode."
}
