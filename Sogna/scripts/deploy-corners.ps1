# Despliega Capa 2 desde SSOT (Sogna/Curator/corners/) a esquinas del repo
$ErrorActionPreference = 'Stop'

$sognaRoot = Split-Path $PSScriptRoot -Parent
$cornersSsot = Join-Path $sognaRoot 'Curator\corners'
$ignoresSsot = Join-Path $cornersSsot 'ignores'
$manifest = Join-Path $sognaRoot 'platform.manifest.json'

if (-not (Test-Path $manifest)) { throw "Missing manifest: $manifest" }
if (-not (Test-Path $cornersSsot)) { throw "Missing corners SSOT: $cornersSsot" }
if (-not (Test-Path $ignoresSsot)) { throw "Missing ignores SSOT: $ignoresSsot" }

function Copy-Verify {
    param([string]$Src, [string]$Dest)
    if (-not (Test-Path $Src)) { throw "Missing SSOT: $Src" }
    Copy-Item -LiteralPath $Src -Destination $Dest -Force
    $h1 = (Get-FileHash $Src -Algorithm SHA256).Hash
    $h2 = (Get-FileHash $Dest -Algorithm SHA256).Hash
    if ($h1 -ne $h2) { throw "Hash mismatch: $Dest" }
}

function Deploy-Ignores {
    param(
        [string]$Root,
        [string]$Layout,
        [switch]$IncludeGit
    )
    $suffix = if ($Layout -eq 'host') { 'host' } else { 'monorepo' }
    Write-Host "  [ignores/$Layout] $Root"

    if ($IncludeGit) {
        Copy-Verify (Join-Path $ignoresSsot "gitignore.$suffix") (Join-Path $Root '.gitignore')
        Write-Host '    OK  .gitignore'
        Copy-Verify (Join-Path $ignoresSsot 'gitattributes') (Join-Path $Root '.gitattributes')
        Write-Host '    OK  .gitattributes'
    }

    Copy-Verify (Join-Path $ignoresSsot "rgignore.$suffix") (Join-Path $Root '.rgignore')
    Write-Host '    OK  .rgignore'

    $aiSrc = Join-Path $ignoresSsot "ai-index.$suffix"
    foreach ($name in @('.cursorignore', '.claudeignore')) {
        Copy-Verify $aiSrc (Join-Path $Root $name)
        Write-Host "    OK  $name"
    }

    $staleAgIgnore = Join-Path $Root '.antigravityignore'
    if (Test-Path $staleAgIgnore) {
        Remove-Item -LiteralPath $staleAgIgnore -Force
        Write-Host '    REMOVED stale .antigravityignore (Antigravity no lo carga; usar .agents/rules/sogna-index-exclusions.md)'
    }
}

function Deploy-Corner {
    param(
        [string]$HostRoot,
        [string]$Label
    )
    Write-Host "-- $Label : $HostRoot --"

    $cursorDest = Join-Path $HostRoot '.cursor\rules'
    $claudeDest = Join-Path $HostRoot '.claude'
    $agDest = Join-Path $HostRoot '.agents\rules'

    New-Item -ItemType Directory -Force -Path $cursorDest | Out-Null
    New-Item -ItemType Directory -Force -Path $claudeDest | Out-Null
    New-Item -ItemType Directory -Force -Path $agDest | Out-Null

    $pairs = @(
        @{ Src = Join-Path $cornersSsot 'cursor\sogna-bridge.mdc'; Dest = Join-Path $cursorDest 'sogna-bridge.mdc' },
        @{ Src = Join-Path $cornersSsot 'cursor\sogna-ecosystem.mdc'; Dest = Join-Path $cursorDest 'sogna-ecosystem.mdc' },
        @{ Src = Join-Path $cornersSsot 'claude\sogna-bridge.md'; Dest = Join-Path $claudeDest 'sogna-bridge.md' },
        @{ Src = Join-Path $cornersSsot 'claude\sogna-ecosystem.md'; Dest = Join-Path $claudeDest 'sogna-ecosystem.md' },
        @{ Src = Join-Path $cornersSsot 'antigravity\sogna-bridge.md'; Dest = Join-Path $agDest 'sogna-bridge.md' },
        @{ Src = Join-Path $cornersSsot 'antigravity\sogna-ecosystem.md'; Dest = Join-Path $agDest 'sogna-ecosystem.md' },
        @{ Src = Join-Path $cornersSsot 'antigravity\sogna-index-exclusions.md'; Dest = Join-Path $agDest 'sogna-index-exclusions.md' }
    )

    foreach ($p in $pairs) {
        Copy-Verify $p.Src $p.Dest
        Write-Host "  OK  $(Split-Path $p.Dest -Leaf)"
    }

    foreach ($stale in @('general-rules.md', 'general-rules-r8.md')) {
        $stalePath = Join-Path $agDest $stale
        if (Test-Path $stalePath) {
            Remove-Item -LiteralPath $stalePath -Force
            Write-Host "  REMOVED stale Capa 1: $stale"
        }
    }

    if ($Label -eq 'embedded-host') {
        $indexSsot = Join-Path $cornersSsot 'claude\CLAUDE.index.host.md'
        $claudeIndex = Join-Path $HostRoot 'CLAUDE.md'
        Copy-Verify $indexSsot $claudeIndex
        Write-Host '  OK  CLAUDE.md (index Capa 2)'
    }
}

Write-Host '=== Deploy Capa 2 corners ==='
Write-Host "SSOT: $cornersSsot"
Write-Host ''

Write-Host '=== Deploy ignores (git / rg / IDE index) ==='

Deploy-Corner -HostRoot $sognaRoot -Label 'monorepo'

$hostRoot = Split-Path $sognaRoot -Parent
$embeddedManifest = Join-Path $hostRoot 'Sogna\platform.manifest.json'
if ((Test-Path $embeddedManifest) -and ($hostRoot -ne $sognaRoot)) {
    Deploy-Ignores -Root $hostRoot -Layout 'host' -IncludeGit
    Deploy-Ignores -Root $sognaRoot -Layout 'monorepo'
    Write-Host ''
    Deploy-Corner -HostRoot $hostRoot -Label 'embedded-host'
} else {
    Deploy-Ignores -Root $sognaRoot -Layout 'monorepo' -IncludeGit
    Write-Host '-- embedded-host: skip (no Sogna/ subfolder layout) --'
}

Write-Host ''
Write-Host 'Done. Run: powershell -File scripts/verify-corners.ps1'
