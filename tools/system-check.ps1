[CmdletBinding()]
param(
    [string]$RepoPath = $null,
    [switch]$SkipRender
)

$ErrorActionPreference = 'Continue'
Set-StrictMode -Version Latest

if ([string]::IsNullOrWhiteSpace($RepoPath)) {
    if (-not [string]::IsNullOrWhiteSpace($PSScriptRoot)) {
        $RepoPath = Split-Path -Parent $PSScriptRoot
    } else {
        $RepoPath = (Get-Location).Path
    }
}

Set-Location $RepoPath

$script:OverallOk = $true
$script:Results = [System.Collections.Generic.List[object]]::new()

function Invoke-SystemStep {
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][scriptblock]$Action
    )

    Write-Host "`n=== $Name ===" -ForegroundColor Cyan

    try {
        & $Action
        $exitCode = if ($null -eq $LASTEXITCODE) { 0 } else { [int]$LASTEXITCODE }

        if ($exitCode -ne 0) {
            throw "Exit code $exitCode"
        }

        $script:Results.Add([pscustomobject]@{ Step = $Name; Status = 'OK' })
        Write-Host "$Name : OK" -ForegroundColor Green
    }
    catch {
        $script:OverallOk = $false
        $message = $_.Exception.Message
        $script:Results.Add([pscustomobject]@{ Step = $Name; Status = 'FAILED'; Detail = $message })
        Write-Host "$Name : FEIL - $message" -ForegroundColor Red
    }
}

function Require-Command {
    param([Parameter(Mandatory)][string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Command not found: $Name"
    }
}

Write-Host '============================================' -ForegroundColor Cyan
Write-Host 'EVIDENCE APPRAISAL TOOL - SYSTEM CHECK' -ForegroundColor Cyan
Write-Host '============================================' -ForegroundColor Cyan

Invoke-SystemStep 'TOOLCHAIN' {
    Require-Command git
    Require-Command dotnet
    Require-Command node
    Require-Command npm
}

Invoke-SystemStep 'MAIN SYNC' {
    git fetch origin
    git checkout main
    git reset --hard origin/main
}

Invoke-SystemStep 'REPOSITORY / SECURITY / FULL AUDIT' {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\tools\audit-and-build.ps1'
    if ($LASTEXITCODE -ne 0) { throw "audit-and-build.ps1 failed with exit code $LASTEXITCODE" }
}

Invoke-SystemStep 'BACKEND REGRESSION' {
    dotnet test '.\EvidenceAppraisalTool.sln' --configuration Release --no-build
    if ($LASTEXITCODE -ne 0) { throw "Backend tests failed with exit code $LASTEXITCODE" }
}

Push-Location '.\frontend'
try {
    Invoke-SystemStep 'FRONTEND TESTS' {
        npm.cmd test -- --run
        if ($LASTEXITCODE -ne 0) { throw "Frontend tests failed with exit code $LASTEXITCODE" }
    }

    Invoke-SystemStep 'FRONTEND LINT' {
        npm.cmd run lint
        if ($LASTEXITCODE -ne 0) { throw "Frontend lint failed with exit code $LASTEXITCODE" }
    }

    Invoke-SystemStep 'FRONTEND PRODUCTION BUILD' {
        npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw "Frontend production build failed with exit code $LASTEXITCODE" }
    }
}
finally {
    Pop-Location
}

Invoke-SystemStep 'SYSTEM GATE CONTRACT' {
    $gate = Get-Content '.\backend\EvidenceAppraisal.Api\Services\ResearchSystemGate.cs' -Raw
    $ops  = Get-Content '.\backend\EvidenceAppraisal.Api\Services\ResearchIntegrityEndpoints.cs' -Raw
    $prog = Get-Content '.\backend\EvidenceAppraisal.Api\Program.cs' -Raw

    foreach ($required in @(
        'ResearchSystemGate',
        'CheckWriteAccessAsync',
        'ResearchGovernanceEntity',
        'IsLocked',
        'EnablePrismaTracking',
        'ResearchIntegrityEndpoints'
    )) {
        if (($gate -notmatch [regex]::Escape($required)) -and
            ($ops  -notmatch [regex]::Escape($required)) -and
            ($prog -notmatch [regex]::Escape($required))) {
            throw "System gate contract missing: $required"
        }
    }
}

Invoke-SystemStep 'DOCUMENT / JATS SAFETY' {
    $doc = Get-Content '.\backend\EvidenceAppraisal.Api\Services\DocumentAnalysisService.cs' -Raw
    $viewer = Get-Content '.\frontend\src\components\EvidenceDocumentViewer.jsx' -Raw

    foreach ($required in @(
        'DtdProcessing = DtdProcessing.Ignore',
        'XmlResolver = null',
        '.jats',
        'URL.createObjectURL',
        'URL.revokeObjectURL'
    )) {
        if (($doc -notmatch [regex]::Escape($required)) -and ($viewer -notmatch [regex]::Escape($required))) {
            throw "Document safety contract missing: $required"
        }
    }
}

if (-not $SkipRender) {
    Invoke-SystemStep 'RENDER HEALTH' {
        $health = Invoke-RestMethod -Uri 'https://evidence-appraisal-tool.onrender.com/health' -TimeoutSec 30
        if ($health.status -ne 'Healthy') { throw 'Render health is not Healthy.' }
    }

    Invoke-SystemStep 'RENDER API' {
        $api = Invoke-RestMethod -Uri 'https://evidence-appraisal-tool.onrender.com/api' -TimeoutSec 30
        if ($api.application -ne 'Evidence Appraisal Tool API') { throw 'Unexpected Render API response.' }
    }

    Invoke-SystemStep 'RESEARCH API' {
        $items = @(Invoke-RestMethod -Uri 'https://evidence-appraisal-tool.onrender.com/api/instruments' -TimeoutSec 30)
        if ($items.Count -lt 1) { throw 'Instrument API returned no instruments.' }
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
$script:Results | Format-Table -AutoSize

if ($script:OverallOk) {
    Write-Host 'ALT VERIFISERT GRØNT - HELE SYSTEMET' -ForegroundColor Green
} else {
    Write-Host 'FEIL FUNNET - SE RADENE OVER' -ForegroundColor Red
}

Write-Host '============================================' -ForegroundColor Cyan
Write-Host 'PowerShell forblir åpent. Ingen automatisk exit.' -ForegroundColor Yellow
