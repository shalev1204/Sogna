# Instala Capa 1 completa desde esta carpeta (portable — nuevo equipo)
# Ejecutar: powershell -File "ruta\al\repo\Sogna\Capa 1\scripts\instalar-capa1-completa.ps1"
$ErrorActionPreference = 'Stop'

$Capa1 = Split-Path $PSScriptRoot -Parent
$skillsSrc = Join-Path $Capa1 'SKILLS'
$workflowsSrc = Join-Path $Capa1 'WORKFLOWS'
$reglas = Join-Path $Capa1 'REGLAS'

Write-Host '=========================================='
Write-Host '  CAPA 1 — Instalacion desde Sogna/Capa 1'
Write-Host '=========================================='
Write-Host "Origen: $Capa1"
Write-Host ''

# --- REGLAS ---
Write-Host '=== REGLAS ==='
$gemini1 = Join-Path $reglas 'general-rules.md'
$geminiR8 = Join-Path $reglas 'general-rules-r8.md'
$claudeCapa1 = Join-Path $reglas 'claude\CLAUDE-CAPA1.md'

New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gemini" | Out-Null
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude" | Out-Null

Copy-Item $gemini1 "$env:USERPROFILE\.gemini\GEMINI.md" -Force
Copy-Item $geminiR8 "$env:USERPROFILE\.gemini\GEMINI-R8.md" -Force
Write-Host 'OK  ~/.gemini/GEMINI.md + GEMINI-R8.md'

if (Test-Path $claudeCapa1) {
    Copy-Item $claudeCapa1 "$env:USERPROFILE\.claude\CLAUDE.md" -Force
    Write-Host 'OK  ~/.claude/CLAUDE.md (Capa 1 compacta)'
} else {
    Write-Host 'WARN  Falta REGLAS/claude/CLAUDE-CAPA1.md'
}

Write-Host ''
Write-Host 'CURSOR (manual): Settings -> Rules -> User'
Write-Host "  Regla 1: pegar REGLAS/cursor/USER-RULES-general-rules.md"
Write-Host "  Regla 2: pegar REGLAS/cursor/USER-RULES-general-rules-r8.md"
Write-Host ''

Write-Host 'ANTIGRAVITY UI (manual si hace falta): Customizations -> Rules -> Global x2'
Write-Host "  Pegar REGLAS/antigravity/PASTE-GLOBAL-general-rules.md"
Write-Host "  Pegar REGLAS/antigravity/PASTE-GLOBAL-general-rules-r8.md"
Write-Host ''

# --- SKILLS ---
Write-Host '=== SKILLS (13) ==='
$skillTargets = @(
    (Join-Path $env:USERPROFILE '.cursor\skills'),
    (Join-Path $env:USERPROFILE '.claude\skills'),
    (Join-Path $env:USERPROFILE '.agents\skills'),
    (Join-Path $env:USERPROFILE '.gemini\config\skills'),
    (Join-Path $env:USERPROFILE '.gemini\antigravity\skills')
)
foreach ($t in $skillTargets) { New-Item -ItemType Directory -Force -Path $t | Out-Null }

$skillDirs = Get-ChildItem $skillsSrc -Directory | Where-Object {
    Test-Path (Join-Path $_.FullName 'SKILL.md')
}
foreach ($skill in $skillDirs) {
    $name = $skill.Name
    $src = Join-Path $skill.FullName 'SKILL.md'
    foreach ($t in $skillTargets) {
        $destDir = Join-Path $t $name
        New-Item -ItemType Directory -Force -Path $destDir | Out-Null
        Copy-Item $src (Join-Path $destDir 'SKILL.md') -Force
    }
    Write-Host "OK  skill $name"
}
Write-Host "Total: $($skillDirs.Count) skills"
Write-Host ''

# --- WORKFLOWS ---
Write-Host '=== WORKFLOWS (6) ==='
$wfFiles = @('implement.md','fix-bug.md','review.md','explore.md','refactor.md','ship.md')
$agMeta = @{
    'implement.md' = 'Implementa feature con plan, gate OK del Operador y verify. /implement. Orquesta plan-before-build.'
    'fix-bug.md'   = 'Corrige bug con reproduccion, causa raiz y regresion. /fix-bug. Orquesta systematic-debug.'
    'review.md'    = 'Revision pre-merge con veredicto APPROVE o REQUEST CHANGES. /review. Orquesta code-review.'
    'explore.md'   = 'Explora repo desconocido y entrega mapa operativo. /explore. Solo lectura.'
    'refactor.md'  = 'Refactor seguro sin cambiar comportamiento. /refactor. Orquesta safe-refactor.'
    'ship.md'      = 'Verify, commit y PR bajo mandato. /ship. Orquesta commit-prepare y git-workflow.'
}

$plainWf = @(
    (Join-Path $env:USERPROFILE '.cursor\commands'),
    (Join-Path $env:USERPROFILE '.claude\commands')
)
$agIdeWf = Join-Path $env:USERPROFILE '.gemini\antigravity-ide\global_workflows'
$agGlobalWf = Join-Path $env:USERPROFILE '.gemini\antigravity\global_workflows'
$agConfigWf = Join-Path $env:USERPROFILE '.gemini\config\workflows'

foreach ($d in @($plainWf + @($agIdeWf, $agGlobalWf, $agConfigWf))) {
    New-Item -ItemType Directory -Force -Path $d | Out-Null
}

foreach ($f in $wfFiles) {
    $src = Join-Path $workflowsSrc $f
    if (-not (Test-Path $src)) { throw "Missing workflow $src" }
    $body = Get-Content $src -Raw -Encoding UTF8
    foreach ($t in $plainWf) {
        Copy-Item $src (Join-Path $t $f) -Force
    }
    $agContent = "---`r`ndescription: `"$($agMeta[$f])`"`r`n---`r`n$body"
    foreach ($agDir in @($agIdeWf, $agGlobalWf, $agConfigWf)) {
        [System.IO.File]::WriteAllText((Join-Path $agDir $f), $agContent, [System.Text.UTF8Encoding]::new($false))
    }
    Write-Host "OK  workflow $f  /$($f -replace '\.md$','')"
}

Write-Host ''
Write-Host '=========================================='
Write-Host '  INSTALACION COMPLETA'
Write-Host '=========================================='
Write-Host 'Verificar: powershell -File scripts/verificar-capa1.ps1'
Write-Host 'Cursor: pegar User Rules manualmente (ver arriba)'
Write-Host 'Antigravity workflows UI: pegar manual si vacia (REGLAS/antigravity/workflows/)'
Write-Host ''
