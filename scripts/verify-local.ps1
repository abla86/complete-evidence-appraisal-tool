$ErrorActionPreference = 'Stop'
$project = Join-Path $HOME 'Desktop\complete-evidence-appraisal-tool'
if (-not (Test-Path $project)) { throw "Fant ikke prosjektet: $project" }
Set-Location $project

git fetch origin main --prune
git status --short --branch

$dirty = git status --porcelain
if ($dirty) {
  git stash push -u -m "auto-sync-before-verification-$(Get-Date -Format yyyyMMdd-HHmmss)"
}

git checkout main
git reset --hard origin/main

git clean -fd

npm install

Write-Host "`n=== LINT ===" -ForegroundColor Cyan
npm run lint
if ($LASTEXITCODE -ne 0) { throw "Lint feilet." }

Write-Host "`n=== TEST ===" -ForegroundColor Cyan
npm test
if ($LASTEXITCODE -ne 0) { throw "Tester feilet." }

Write-Host "`n=== BUILD ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build feilet." }

Write-Host "`n=== VERIFIED ===" -ForegroundColor Green
Write-Host "main == origin/main og lint/test/build passerte." -ForegroundColor Green
