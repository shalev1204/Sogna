# Verifica Capa 2 corners + ignores — exit 0 = OK
$ErrorActionPreference = 'Stop'

$sognaRoot = Split-Path $PSScriptRoot -Parent
$cornersSsot = Join-Path $sognaRoot 'Curator\corners'
$ignoresSsot = Join-Path $cornersSsot 'ignores'
$failures = @()

$expectedFiles = @(
    @{ Corner = '.cursor/rules'; Files = @('sogna-bridge.mdc', 'sogna-ecosystem.mdc') },
    @{ Corner = '.claude'; Files = @('sogna-bridge.md', 'sogna-ecosystem.md') },
    @{ Corner = '.agents/rules'; Files = @('sogna-bridge.md', 'sogna-ecosystem.md', 'sogna-index-exclusions.md') }
)

$staleCapa1 = @('general-rules.md', 'general-rules-r8.md')

function Test-Mojibake {
    param([string]$FilePath, [string]$Label)
    if (-not (Test-Path $FilePath)) { return }
    $bytes = [System.IO.File]::ReadAllBytes($FilePath)
    $text = [System.Text.Encoding]::UTF8.GetString($bytes)
    # UTF-8 leido como Latin-1/Windows-1252: secuencias tipicas (solo ASCII en el script)
    $markers = @(
        ([char]0x00E2).ToString() + ([char]0x20AC).ToString(),
        ([char]0x00C3).ToString() + ([char]0x00A9).ToString(),
        ([char]0x00C3).ToString() + ([char]0x00AD).ToString(),
        ([char]0x00C3).ToString() + ([char]0x00B3).ToString(),
        'Justificaci' + ([char]0x00C3).ToString() + ([char]0x00B3).ToString() + 'n'
    )
    foreach ($m in $markers) {
        if ($text.Contains($m)) {
            $script:failures += "$Label MOJIBAKE: $FilePath"
            Write-Host "  FAIL  MOJIBAKE $(Split-Path $FilePath -Leaf)"
            return
        }
    }
}

function Test-CornerEncoding {
    param([string]$HostRoot, [string]$Label)
    Write-Host "=== encoding/$Label : $HostRoot ==="
    $paths = @(
        (Join-Path $HostRoot '.cursor\rules\sogna-bridge.mdc'),
        (Join-Path $HostRoot '.cursor\rules\sogna-ecosystem.mdc'),
        (Join-Path $HostRoot '.claude\sogna-bridge.md'),
        (Join-Path $HostRoot '.claude\sogna-ecosystem.md'),
        (Join-Path $HostRoot '.agents\rules\sogna-bridge.md'),
        (Join-Path $HostRoot '.agents\rules\sogna-ecosystem.md'),
        (Join-Path $HostRoot '.gitignore'),
        (Join-Path $HostRoot '.gitattributes'),
        (Join-Path $HostRoot '.rgignore'),
        (Join-Path $HostRoot '.cursorignore'),
        (Join-Path $HostRoot '.claudeignore'),
        (Join-Path $HostRoot '.agents\rules\sogna-index-exclusions.md')
    )
    if ($Label -eq 'embedded-host') {
        $paths += (Join-Path $HostRoot 'CLAUDE.md')
    }
    foreach ($p in $paths) {
        if (Test-Path $p) {
            Test-Mojibake $p "encoding/$Label"
        }
    }
    Write-Host ''
}

function Test-HashMatch {
    param([string]$Deployed, [string]$Ssot, [string]$Label)
    if (-not (Test-Path $Deployed)) {
        $script:failures += "$Label missing: $Deployed"
        Write-Host "  FAIL  missing $(Split-Path $Deployed -Leaf)"
        return $false
    }
    if (-not (Test-Path $Ssot)) {
        $script:failures += "SSOT missing: $Ssot"
        Write-Host "  FAIL  SSOT missing for $(Split-Path $Deployed -Leaf)"
        return $false
    }
    if ((Get-FileHash $Deployed).Hash -ne (Get-FileHash $Ssot).Hash) {
        $script:failures += "$Label DRIFT: $Deployed"
        Write-Host "  FAIL  DRIFT $(Split-Path $Deployed -Leaf)"
        return $false
    }
    Write-Host "  OK  $(Split-Path $Deployed -Leaf)"
    return $true
}

function Test-Ignores {
    param([string]$Root, [string]$Layout, [switch]$IncludeGit)

    $suffix = if ($Layout -eq 'host') { 'host' } else { 'monorepo' }
    Write-Host "=== ignores/$Layout : $Root ==="

    if ($IncludeGit) {
        Test-HashMatch (Join-Path $Root '.gitignore') (Join-Path $ignoresSsot "gitignore.$suffix") "ignores/$Layout" | Out-Null
        Test-HashMatch (Join-Path $Root '.gitattributes') (Join-Path $ignoresSsot 'gitattributes') "ignores/$Layout" | Out-Null
    }

    Test-HashMatch (Join-Path $Root '.rgignore') (Join-Path $ignoresSsot "rgignore.$suffix") "ignores/$Layout" | Out-Null

    $aiSsot = Join-Path $ignoresSsot "ai-index.$suffix"
    foreach ($name in @('.cursorignore', '.claudeignore')) {
        Test-HashMatch (Join-Path $Root $name) $aiSsot "ignores/$Layout" | Out-Null
    }

    $staleAgIgnore = Join-Path $Root '.antigravityignore'
    if (Test-Path $staleAgIgnore) {
        $script:failures += "ignores/$Layout stale .antigravityignore: $staleAgIgnore (re-run deploy-corners.ps1)"
        Write-Host '  FAIL  stale .antigravityignore (Antigravity no lo carga)'
    }
    Write-Host ''
}

function Test-HostLayer2 {
    param([string]$HostRoot, [string]$Label)

    Write-Host "=== corners/$Label : $HostRoot ==="

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
            } elseif ($f -eq 'sogna-index-exclusions.md') {
                'antigravity\sogna-index-exclusions.md'
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
        $indexSsot = Join-Path $cornersSsot 'claude\CLAUDE.index.host.md'
        Test-HashMatch (Join-Path $HostRoot 'CLAUDE.md') $indexSsot "corners/$Label" | Out-Null
    }

    Write-Host ''
}

Write-Host '=== SSOT Curator/corners ==='
foreach ($check in @(
        @{ Path = Join-Path $sognaRoot 'platform.manifest.json'; Name = 'platform.manifest.json' },
        @{ Path = Join-Path $cornersSsot 'cursor\sogna-bridge.mdc'; Name = 'corners/cursor/sogna-bridge.mdc' },
        @{ Path = Join-Path $cornersSsot 'cursor\sogna-ecosystem.mdc'; Name = 'corners/cursor/sogna-ecosystem.mdc' },
        @{ Path = Join-Path $cornersSsot 'claude\sogna-bridge.md'; Name = 'corners/claude/sogna-bridge.md' },
        @{ Path = Join-Path $cornersSsot 'claude\sogna-ecosystem.md'; Name = 'corners/claude/sogna-ecosystem.md' },
        @{ Path = Join-Path $cornersSsot 'claude\CLAUDE.index.host.md'; Name = 'corners/claude/CLAUDE.index.host.md' },
        @{ Path = Join-Path $cornersSsot 'antigravity\sogna-bridge.md'; Name = 'corners/antigravity/sogna-bridge.md' },
        @{ Path = Join-Path $cornersSsot 'antigravity\sogna-ecosystem.md'; Name = 'corners/antigravity/sogna-ecosystem.md' },
        @{ Path = Join-Path $cornersSsot 'antigravity\sogna-index-exclusions.md'; Name = 'corners/antigravity/sogna-index-exclusions.md' },
        @{ Path = Join-Path $ignoresSsot 'gitignore.host'; Name = 'ignores/gitignore.host' },
        @{ Path = Join-Path $ignoresSsot 'gitignore.monorepo'; Name = 'ignores/gitignore.monorepo' },
        @{ Path = Join-Path $ignoresSsot 'gitattributes'; Name = 'ignores/gitattributes' },
        @{ Path = Join-Path $ignoresSsot 'rgignore.host'; Name = 'ignores/rgignore.host' },
        @{ Path = Join-Path $ignoresSsot 'rgignore.monorepo'; Name = 'ignores/rgignore.monorepo' },
        @{ Path = Join-Path $ignoresSsot 'ai-index.host'; Name = 'ignores/ai-index.host' },
        @{ Path = Join-Path $ignoresSsot 'ai-index.monorepo'; Name = 'ignores/ai-index.monorepo' }
    )) {
    if (-not (Test-Path $check.Path)) {
        $failures += "SSOT missing: $($check.Name)"
        Write-Host "FAIL  $($check.Name)"
    } else { Write-Host "OK  $($check.Name)" }
}
Write-Host ''

$hostRoot = Split-Path $sognaRoot -Parent
$isEmbedded = Test-Path (Join-Path $hostRoot 'Sogna\platform.manifest.json')

if ($isEmbedded) {
    Test-Ignores -Root $hostRoot -Layout 'host' -IncludeGit
    Test-Ignores -Root $sognaRoot -Layout 'monorepo'
} else {
    Test-Ignores -Root $sognaRoot -Layout 'monorepo' -IncludeGit
}

Test-HostLayer2 -HostRoot $sognaRoot -Label 'monorepo'
Test-CornerEncoding -HostRoot $sognaRoot -Label 'monorepo'

if ($isEmbedded) {
    Test-HostLayer2 -HostRoot $hostRoot -Label 'embedded-host'
    Test-CornerEncoding -HostRoot $hostRoot -Label 'embedded-host'
}

if ($failures.Count -gt 0) {
    Write-Host 'RESULTADO: FAIL'
    $failures | ForEach-Object { Write-Host "  - $_" }
    Write-Host ''
    Write-Host 'Reparar: powershell -File Sogna/scripts/deploy-corners.ps1'
    exit 1
}

Write-Host 'RESULTADO: OK - Capa 2 corners + ignores completa'
