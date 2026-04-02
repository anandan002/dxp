param(
  [string]$NodeDir = "D:\soft\node-v24.14.0-win-x64",
  [string]$RepoRoot = "D:\dxp"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$nodeExe = Join-Path $NodeDir "node.exe"
if (-not (Test-Path $nodeExe)) {
  throw "node.exe not found at '$nodeExe'."
}

$bffDir = Join-Path $RepoRoot "apps\bff"
$entryCandidates = @(
  (Join-Path $bffDir "dist\main.js"),
  (Join-Path $bffDir "dist\apps\bff\src\main.js"),
  (Join-Path $bffDir "dist\apps\bff\main.js")
)

$entry = $entryCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $entry) {
  throw "BFF build output missing. Checked: $($entryCandidates -join ', '). Build apps/bff before starting service."
}

$env:Path = "$NodeDir;$env:Path"
Set-Location $bffDir

& $nodeExe $entry
