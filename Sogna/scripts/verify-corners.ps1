# Verifica Capa 2 corners — exit 0 = OK
$ErrorActionPreference = 'Stop'

$sognaRoot = Split-Path $PSScriptRoot -Parent
$cornersSsot = Join-Path $sognaRoot 'Curator\corners'
$failures = @()

$expectedFiles = @(
    @{ Corner = '.cursor/rules'; Files = @('sogna-bridge.mdc', 'sogna-ecosystem.mdc') },
    @{ Corner = '.claude'; Files = @('sogna-bridge.md', 'sogna-ecosystem.md') },
    @{ Corner = '.agents/rules'; Files = @('sogna-bridge.md', 'sogna-ecosystem.md') }
)

$staleCapa1 = @('general-rules.md', 'general-rules-r8.md')

function Test-HostLayer2 {
    param([string]$HostRoot, [string]$Label)

    Write-Host "=== $Label : $HostRoot ==="

    foreach ($group in $expectedFiles) {
        $dir = Join-Path $HostRoot $group.Corner
        foreach ($f in $group.Files) {
            $p = Join-Path $dir $f
        if (-not (Test-Path $p)) {
            $failures += "$Label missing: $p"
            Write-Host "  FAIL  $($group.Corner)/$f"
            continue
        }
        $ssotRel = if ($f -eq 'sogna-bridge.mdc') {
            'cursor\sogna-bridge.mdc'
        } elseif ($f -eq 'sogna-ecosystem.mdc') {
            'cursor\sogna-ecosystem.mdc'
        } elseif ($f -eq 'sogna-bridge.md' -and $group.Corner -eq '.claude') {
            'claude\sogna-bridge.md'
        } elseif ($f -eq 'sogna-ecosystem.md' -and $group.Corner -eq '.claude') {
            'claude\sogna-ecosystem.md'
        } elseif ($f -eq 'sogna-bridge.md') {
            'antigravity\sogna-bridge.md'
        } else {
            'antigravity\sogna-ecosystem.md'
        }
        $ssotPath = Join-Path $cornersSsot $ssotRel
        if ((Test-Path $ssotPath) -and ((Get-FileHash $p).Hash -ne (Get-FileHash $ssotPath).Hash)) {
            $failures += "$Label DRIFT: $p (re-run deploy-corners.ps1)"
            Write-Host "  FAIL  $($group.Corner)/$f  DRIFT vs SSOT"
            continue
        }
        Write-Host "  OK  $($group.Corner)/$f"
        }
    }

    foreach ($s in $staleCapa1) {
        $sp = Join-Path $HostRoot ".agents\rules\$s"
        if (Test-Path $sp) {
            $failures += "$Label stale Capa 1: $sp"
            Write-Host "  FAIL  stale Capa 1: $s"
        }
    }

    if ($Label -eq 'embedded-host') {
        $idx = Join-Path $HostRoot 'CLAUDE.md'
        if (-not (Test-Path $idx)) {
            $failures += 'Missing git root CLAUDE.md index'
            Write-Host '  FAIL  CLAUDE.md index'
        } else { Write-Host '  OK  CLAUDE.md index' }
    }

    Write-Host ''
}

Write-Host '=== SSOT Curator/corners ==='
foreach ($check in @(
        @{ Path = Join-Path $sognaRoot 'platform.manifest.json'; Name = 'platform.manifest.json' },
        @{ Path = Join-Path $cornersSsot 'cursor\sogna-bridge.mdc'; Name = 'Curator/corners/cursor/sogna-bridge.mdc' },
        @{ Path = Join-Path $cornersSsot 'cursor\sogna-ecosystem.mdc'; Name = 'Curator/corners/cursor/sogna-ecosystem.mdc' },
        @{ Path = Join-Path $cornersSsot 'claude\sogna-bridge.md'; Name = 'Curator/corners/claude/sogna-bridge.md' },
        @{ Path = Join-Path $cornersSsot 'claude\sogna-ecosystem.md'; Name = 'Curator/corners/claude/sogna-ecosystem.md' },
        @{ Path = Join-Path $cornersSsot 'antigravity\sogna-bridge.md'; Name = 'Curator/corners/antigravity/sogna-bridge.md' },
        @{ Path = Join-Path $cornersSsot 'antigravity\sogna-ecosystem.md'; Name = 'Curator/corners/antigravity/sogna-ecosystem.md' }
    )) {
    if (-not (Test-Path $check.Path)) {
        $failures += "SSOT missing: $($check.Name)"
        Write-Host "FAIL  $($check.Name)"
    } else { Write-Host "OK  $($check.Name)" }
}
Write-Host ''

Test-HostLayer2 -HostRoot $sognaRoot -Label 'monorepo'

$hostRoot = Split-Path $sognaRoot -Parent
if (Test-Path (Join-Path $hostRoot 'Sogna\platform.manifest.json')) {
    Test-HostLayer2 -HostRoot $hostRoot -Label 'embedded-host'
}

if ($failures.Count -gt 0) {
    Write-Host 'RESULTADO: FAIL'
    $failures | ForEach-Object { Write-Host "  - $_" }
    Write-Host ''
    Write-Host 'Reparar: powershell -File Sogna/scripts/deploy-corners.ps1'
    exit 1
}

Write-Host 'RESULTADO: OK — Capa 2 corners completa'
