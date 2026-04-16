param(
  [string]$LogPath = "testsprite_tests\round5-terminal-execution.log",
  [int]$TimeoutSeconds = 1200
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runnerPath = Join-Path $repoRoot "scripts\run-testsprite-execution.mjs"
$timeoutMs = $TimeoutSeconds * 1000

& node $runnerPath $LogPath $timeoutMs
exit $LASTEXITCODE
