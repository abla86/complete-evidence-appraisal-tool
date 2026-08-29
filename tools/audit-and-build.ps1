[CmdletBinding()]
param(
    [string]$RepoPath = $null,
    [switch]$SkipBuild,
    [switch]$SkipTests
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if ([string]::IsNullOrWhiteSpace($RepoPath)) {
    if (-not [string]::IsNullOrWhiteSpace($PSScriptRoot)) {
        $RepoPath = Split-Path -Parent $PSScriptRoot
    } else {
        $RepoPath = (Get-Location).Path
    }
}

function Invoke-Step {
    param([string]$Name, [scriptblock]$Action)

    Write-Host "`n=== $Name ===" -ForegroundColor Cyan
    $global:LASTEXITCODE = 0
    & $Action
    $exitCode = if ($null -eq $global:LASTEXITCODE) { 0 } else { [int]$global:LASTEXITCODE }
    if ($exitCode -ne 0) {
        throw "$Name failed with exit code $exitCode"
    }
}

function Require-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $Name"
    }
}

if (-not (Test-Path $RepoPath -PathType Container)) {
    throw "Repository path not found: $RepoPath"
}

Set-Location $RepoPath

Require-Command git
Require-Command dotnet
Require-Command node
Require-Command npm

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
        'docs/methodology/CFIR_KTA_IMPLEMENTATION.md',
        'backend/EvidenceAppraisal.Api/Data/EvidenceDbContext.cs',
        'backend/EvidenceAppraisal.Api/Models/ResearchOperationsModels.cs',
        'backend/EvidenceAppraisal.Api/Services/ResearchOperationsEndpoints.cs',
        'backend/EvidenceAppraisal.Api/Services/ResearchSystemGate.cs',
        'frontend/src/App.jsx',
        'frontend/src/components/ResearchModuleHub.jsx'
    )

    foreach ($path in $required) {
        if (-not (Test-Path $path)) {
            throw "Required path missing: $path"
        }
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

    $files = git ls-files | Where-Object {
        $_ -notmatch '(^|/)(node_modules|bin|obj|dist|coverage)/'
    }

    foreach ($file in $files) {
        $text = Get-Content -Raw -LiteralPath $file -ErrorAction SilentlyContinue
        foreach ($pattern in $patterns) {
            if ($text -match $pattern) {
                throw "Potential secret pattern found in $file"
            }
        }
    }
}

Invoke-Step 'Static source contracts' {
    $models = Get-Content -Raw 'backend/EvidenceAppraisal.Api/Models/ResearchOperationsModels.cs'
    $ops = Get-Content -Raw 'backend/EvidenceAppraisal.Api/Services/ResearchOperationsEndpoints.cs'
    $db = Get-Content -Raw 'backend/EvidenceAppraisal.Api/Data/EvidenceDbContext.cs'
    $hub = Get-Content -Raw 'frontend/src/components/ResearchModuleHub.jsx'
    $doc = Get-Content -Raw 'backend/EvidenceAppraisal.Api/Services/DocumentAnalysisService.cs'
    $gate = Get-Content -Raw 'backend/EvidenceAppraisal.Api/Services/ResearchSystemGate.cs'
    $integrity = Get-Content -Raw 'backend/EvidenceAppraisal.Api/Services/ResearchIntegrityEndpoints.cs'
    $program = Get-Content -Raw 'backend/EvidenceAppraisal.Api/Program.cs'
    $registry = Get-Content -Raw 'backend/EvidenceAppraisal.Api/Models/MethodologyRegistry.cs'
    $workflowDoc = Get-Content -Raw 'docs/WORKFLOW.md'
    $methodologyDoc = Get-Content -Raw 'docs/METHODOLOGY-SOURCES-AND-VERSIONS.md'

    foreach ($required in @(
        'RegistryReviewedDate',
        'SourceReferenceStatus',
        'jbi-qualitative-2017',
        'casp-qualitative-2024',
        'MethodologyRegistry.Definitions'
    )) {
        if ($registry -notmatch [regex]::Escape($required)) {
            throw "Methodology registry contract missing: $required"
        }
    }

    foreach ($required in @(
        'Historical and legacy functionality',
        'exact methodology ID/version',
        'Release gate'
    )) {
        if ($workflowDoc -notmatch [regex]::Escape($required)) {
            throw "Workflow governance contract missing: $required"
        }
    }

    if ($methodologyDoc -match '|s*casps*|') {
        throw 'Ambiguous generic CASP methodology entry remains in methodology documentation'
    }
    if ($methodologyDoc -match '|s*jbis*|') {
        throw 'Ambiguous generic JBI methodology entry remains in methodology documentation'
    }

    foreach ($required in @(
        'record ScreeningDecisionRequest(Guid ProjectId',
        'record ExtractionRequest(Guid ProjectId',
        'EnableDualReview',
        'EnablePrismaTracking',
        'EnableAuditTrail',
        'RequireHumanVerification',
        'PreviousHash',
        'CurrentHash'
    )) {
        if ($models -notmatch [regex]::Escape($required)) {
            throw "Missing model contract: $required"
        }
    }

    foreach ($required in @(
        'request.ProjectId == Guid.Empty',
        'project.EnableDualReview',
        'project.EnablePrismaTracking',
        'x.ProjectId == projectId'
    )) {
        if ($ops -notmatch [regex]::Escape($required)) {
            throw "Missing server-side project rule: $required"
        }
    }

    if ($db -notmatch 'ValueComparer<List<string>>') {
        throw 'StudyMetadata.Authors ValueComparer missing'
    }
    if ($db -notmatch 'SetValueComparer\(authorsComparer\)') {
        throw 'StudyMetadata.Authors ValueComparer not attached'
    }
    if ($db -notmatch 'ResearchGovernanceEntity') {
        throw 'Research governance is not mapped in EF Core'
    }
    if ($hub -match "setSelected\(''\)") {
        throw 'ResearchModuleHub still performs synchronous setState inside effect'
    }
    if ($hub -notmatch "const effectiveSelected = current \? selected : '';") {
        throw 'ResearchModuleHub effectiveSelected contract missing'
    }
    if ($doc -notmatch 'DtdProcessing\s*=\s*DtdProcessing\.Ignore') {
        throw 'XML DTD processing is not explicitly disabled'
    }
    if ($doc -notmatch 'XmlResolver\s*=\s*null') {
        throw 'XML resolver is not explicitly disabled'
    }

    if ($gate -notmatch 'CheckWriteAccessAsync') {
        throw 'Central ResearchSystemGate missing write-access contract'
    }

    foreach ($route in @(
        '/api/research/integrity/protocol',
        '/api/research/integrity/reviewer-decision',
        '/api/research/integrity/consensus',
        '/api/research/integrity/prisma-event',
        '/api/research/integrity/provenance'
    )) {
        if ($integrity -notmatch [regex]::Escape($route)) {
            throw "Research integrity route missing: $route"
        }
    }

    if ($integrity -notmatch 'ResearchSystemGate gate') {
        throw 'ResearchIntegrityEndpoints do not use the central gate'
    }

    if ($program -notmatch 'AddScoped<ResearchSystemGate>') {
        throw 'ResearchSystemGate is not registered in dependency injection'
    }
}

if (-not $SkipBuild) {
    Invoke-Step 'Backend restore' {
        dotnet restore EvidenceAppraisalTool.sln
    }

    Invoke-Step 'Backend build' {
        dotnet build EvidenceAppraisalTool.sln --configuration Release --no-restore
    }
}

if (-not $SkipTests) {
    Invoke-Step 'Backend tests' {
        if ($SkipBuild) {
            dotnet test EvidenceAppraisalTool.sln --configuration Release
        } else {
            dotnet test EvidenceAppraisalTool.sln --configuration Release --no-build
        }
    }
}

Push-Location frontend
try {
    Invoke-Step 'Frontend dependency verification' {
        npm ci --ignore-scripts
    }

    if (-not $SkipTests) {
        Invoke-Step 'Frontend tests' {
            npm test
        }
    }

    Invoke-Step 'Frontend lint' {
        npm run lint
    }

    if (-not $SkipBuild) {
        Invoke-Step 'Frontend production build' {
            npm run build
        }
    }
}
finally {
    Pop-Location
}

Invoke-Step 'Methodological boundary audit' {
    $readme = Get-Content -Raw README.md
    foreach ($notice in @('researcher','CFIR','KTA','limitations')) {
        if ($readme -notmatch [regex]::Escape($notice)) {
            throw "README methodological notice missing: $notice"
        }
    }
}

Write-Host "`nAUDIT RESULT: PASS" -ForegroundColor Green
Write-Host 'All configured repository checks completed successfully on this machine.'
Write-Host 'PASS does not establish methodological validity, clinical validity, legal compliance, security certification, or production readiness.'