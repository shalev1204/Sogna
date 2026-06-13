# Despliega Capa 2 desde SSOT (Sogna/Curator/corners/) a esquinas del repo
$ErrorActionPreference = 'Stop'

$sognaRoot = Split-Path $PSScriptRoot -Parent
$cornersSsot = Join-Path $sognaRoot 'Curator\corners'
$manifest = Join-Path $sognaRoot 'platform.manifest.json'

if (-not (Test-Path $manifest)) { throw "Missing manifest: $manifest" }
if (-not (Test-Path $cornersSsot)) { throw "Missing corners SSOT: $cornersSsot" }

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
        @{ Src = Join-Path $cornersSsot 'antigravity\sogna-ecosystem.md'; Dest = Join-Path $agDest 'sogna-ecosystem.md' }
    )

    foreach ($p in $pairs) {
        if (-not (Test-Path $p.Src)) { throw "Missing SSOT: $($p.Src)" }
        Copy-Item -LiteralPath $p.Src -Destination $p.Dest -Force
        $h1 = (Get-FileHash $p.Src -Algorithm SHA256).Hash
        $h2 = (Get-FileHash $p.Dest -Algorithm SHA256).Hash
        if ($h1 -ne $h2) { throw "Hash mismatch: $($p.Dest)" }
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
        $claudeIndex = Join-Path $HostRoot 'CLAUDE.md'
        $indexContent = @"
# Claude Code — Capa 2 (repositorio con Sogna)

Antes de cualquier tarea en este repositorio, lea obligatoriamente:

1. ``.claude/sogna-bridge.md``
2. ``.claude/sogna-ecosystem.md``

Manual operativo **Capa 3:** ``Sogna/CLAUDE.md``

Capa 1 global del Operador: ``~/.claude/CLAUDE.md`` (no duplicar aqui).
"@
        [System.IO.File]::WriteAllText($claudeIndex, $indexContent, [System.Text.UTF8Encoding]::new($false))
        Write-Host '  OK  CLAUDE.md (index Capa 2)'
    }
}

Write-Host '=== Deploy Capa 2 corners ==='
Write-Host "SSOT: $cornersSsot"
Write-Host ''

Deploy-Corner -HostRoot $sognaRoot -Label 'monorepo'

$hostRoot = Split-Path $sognaRoot -Parent
$embeddedManifest = Join-Path $hostRoot 'Sogna\platform.manifest.json'
if ((Test-Path $embeddedManifest) -and ($hostRoot -ne $sognaRoot)) {
    Deploy-Corner -HostRoot $hostRoot -Label 'embedded-host'
} else {
    Write-Host '-- embedded-host: skip (no Sogna/ subfolder layout) --'
}

Write-Host ''
Write-Host 'Done. Run: powershell -File scripts/verify-corners.ps1'
