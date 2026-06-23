# Verifica Capa 1 instalada desde Sogna/Capa 1 — exit 0 = OK
$ErrorActionPreference = 'Stop'

$Capa1 = Split-Path $PSScriptRoot -Parent
$skillNames = @(
    'plan-before-build','systematic-debug','code-review','safe-refactor',
    'api-contract-design','meaningful-tests','technical-docs','git-workflow',
    'pragmatic-performance','secure-by-default','explore-codebase','commit-prepare','find-skills'
)
$workflowFiles = @('implement.md','fix-bug.md','review.md','explore.md','refactor.md','ship.md')
$failures = @()

Write-Host '=== REGLAS ==='
foreach ($item in @(
        @{ N='GEMINI.md'; P=Join-Path $env:USERPROFILE '.gemini\GEMINI.md' },
        @{ N='GEMINI-R8.md'; P=Join-Path $env:USERPROFILE '.gemini\GEMINI-R8.md' },
        @{ N='CLAUDE.md Capa1'; P=Join-Path $env:USERPROFILE '.claude\CLAUDE.md' }
    )) {
    if (Test-Path $item.P) { Write-Host "OK  $($item.N)" }
    else { $failures += "FALTA $($item.N)"; Write-Host "FAIL  $($item.N)" }
}

Write-Host ''
Write-Host '=== SKILLS (13) ==='
foreach ($name in $skillNames) {
    $p = Join-Path $env:USERPROFILE ".cursor\skills\$name\SKILL.md"
    if (Test-Path $p) { Write-Host "OK  $name" }
    else { $failures += "FALTA skill $name"; Write-Host "FAIL  $name" }
}

Write-Host ''
Write-Host '=== WORKFLOWS (6) ==='
foreach ($f in $workflowFiles) {
    $p = Join-Path $env:USERPROFILE ".cursor\commands\$f"
    if (Test-Path $p) { Write-Host "OK  $f" }
    else { $failures += "FALTA workflow $f"; Write-Host "FAIL  $f" }
}

Write-Host ''
Write-Host '=== SSOT en repo (Capa 1/) ==='
foreach ($check in @(
        'REGLAS\general-rules.md',
        'REGLAS\general-rules-r8.md',
        'SKILLS\plan-before-build\SKILL.md',
        'WORKFLOWS\implement.md'
    )) {
    $p = Join-Path $Capa1 $check
    if (Test-Path $p) { Write-Host "OK  $check" }
    else { $failures += "FALTA repo $check"; Write-Host "FAIL  $check" }
}

Write-Host ''
if ($failures.Count -gt 0) {
    Write-Host 'RESULTADO: FAIL'
    $failures | ForEach-Object { Write-Host "  - $_" }
    Write-Host ''
    Write-Host 'Ejecutar: powershell -File scripts/instalar-capa1-completa.ps1'
    exit 1
}
Write-Host 'RESULTADO: OK — Capa 1 instalada (Cursor User Rules: confirmar manualmente)'
