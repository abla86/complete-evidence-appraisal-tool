$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 22 or newer is required for local server mode.' }
if (-not (Test-Path 'dist/server.cjs')) { npm ci; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
if (-not (Test-Path 'node_modules/express')) { npm ci --omit=dev; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
Start-Process 'http://localhost:10000'
npm start