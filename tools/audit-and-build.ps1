[CmdletBinding()]
param(
    [string]$RepoPath = (Split-Path -Parent $PSScriptRoot),
    [switch]$SkipBuild,
    [switch]$SkipTests
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Invoke-Step {
    param([string]$Name, [scriptblock]$Action)
    Write-Host "`n=== $Name ===" -ForegroundColor Cyan
    & $Action
    if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE" }
}

function Require-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $Name"
    }
}

if (-not (Test-Path $RepoPath -PathType Container)) { throw "Repository path not found: $RepoPath" }
Set-Location $RepoPath

Write-Host "Evidence Appraisal Tool - strict audit" -ForegroundColor Green
Write-Host "Repository: $RepoPath"

Require-Command git
Require-Command dotnet
Require-Command node
Require-Command npm

Invoke-Step 'Git status' { git status --short --branch }
Invoke-Step 'Repository structure' {
    $required = @(
        'EvidenceAppraisalTool.sln',
        'backend/EvidenceAppraisal.Api/EvidenceAppraisal.Api.csproj',
        'frontend/package.json',
        'frontend/package-lock.json',
        '.github/workflows/ci.yml',
        '.github/workflows/codeql.yml',
        '.github/dependabot.yml',
        'SECURITY.md',
        'docs/methodology/AMSTAR2_IMPLEMENTATION.md',
        'docs/methodology/CFIR_KTA_IMPLEMENTATION.md'
    )
    foreach ($path in $required) {
        if (-not (Test-Path $path)) { throw "Required path missing: $path" }
        Write-Host "OK  $path"
    }
}

Invoke-Step 'Secret-pattern scan' {
    $patterns = @(
        'AKIA[0-9A-Z]{16}',
        'ghp_[A-Za-z0-9_]{20,}',
        'github_pat_[A-Za-z0-9_]{20,}',
        '-----BEGIN (RSA|OPENSSH|EC|DSA|PRIVATE) KEY-----',
        '(?i)password\s*=\s*["''][^"'']+["'']'
    )
    $files = git ls-files | Where-Object { $_ -notmatch '(^|/)(node_modules|bin|obj|dist|coverage)/' }
    foreach ($file in $files) {
        $text = Get-Content -Raw -LiteralPath $file -ErrorAction SilentlyContinue
        foreach ($pattern in $patterns) {
            if ($text -match $pattern) { throw "Potential secret pattern found in $file" }
        }
    }
    Write-Host 'No configured secret patterns detected.'
}

if (-not $SkipBuild) {
    Invoke-Step 'Backend restore' { dotnet restore EvidenceAppraisalTool.sln }
    Invoke-Step 'Backend build' { dotnet build EvidenceAppraisalTool.sln --configuration Release --no-restore }
}

if (-not $SkipTests) {
    Invoke-Step 'Backend tests' { dotnet test EvidenceAppraisalTool.sln --configuration Release --no-build }
}

Push-Location frontend
try {
    Invoke-Step 'Frontend dependency verification' { npm ci --ignore-scripts }
    if (-not $SkipTests) { Invoke-Step 'Frontend tests' { npm test } }
    Invoke-Step 'Frontend lint' { npm run lint }
    if (-not $SkipBuild) { Invoke-Step 'Frontend production build' { npm run build } }
}
finally { Pop-Location }

Write-Host "`n=== Methodological boundary audit ===" -ForegroundColor Cyan
$readme = Get-Content -Raw README.md
$requiredNotices = @(
    'no numerical total score',
    'researcher',
    'CFIR',
    'KTA',
    'limitations'
)
foreach ($notice in $requiredNotices) {
    if ($readme -notmatch [regex]::Escape($notice)) { throw "README methodological notice missing: $notice" }
}

Write-Host "`nAUDIT RESULT: PASS" -ForegroundColor Green
Write-Host 'This script proves only that the configured repository checks passed on the machine where it is run.'
Write-Host 'It does not establish methodological validity, clinical validity, security certification, or production readiness.'
