param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$RemainingArgs
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot ".env"

if (-not $env:API_KEY) {
  if ($env:TESTSPRITE_API_KEY) {
    $env:API_KEY = $env:TESTSPRITE_API_KEY
  } elseif (Test-Path $envPath) {
    foreach ($line in Get-Content $envPath) {
      if ($line -match '^\s*(?:export\s+)?(TESTSPRITE_API_KEY|API_KEY)\s*=\s*(.+)\s*$') {
        $env:API_KEY = $Matches[2].Trim().Trim('"').Trim("'")
        break
      }
    }
  }
}

if (-not $env:API_KEY) {
  throw "Missing TestSprite API key. Set TESTSPRITE_API_KEY or API_KEY in .env or the process environment."
}

$argsForNpx = @("--yes", "@testsprite/testsprite-mcp@latest") + $RemainingArgs
& npx @argsForNpx
exit $LASTEXITCODE
