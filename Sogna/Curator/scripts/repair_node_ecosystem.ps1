#Requires -Version 5.1
<#
.SYNOPSIS
  Repara el ecosistema node_modules: purga ciclos de junction y reinstala pnpm.
.DESCRIPTION
  Elimina todos los node_modules del monorepo (soporta rutas largas en Windows)
  y ejecuta pnpm install desde la raíz Sogna.
#>
$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')

Write-Host "`n[Sogna Repair] Raiz: $Root" -ForegroundColor Cyan

function Remove-DirLongPath {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return }
    $long = if ($Path.StartsWith('\\?\')) { $Path } else { "\\?\$Path" }
    cmd /c "rd /s /q `"$long`"" 2>$null | Out-Null
    if (Test-Path -LiteralPath $Path) {
        # Fallback robocopy mirror (Windows MAX_PATH)
        $empty = Join-Path $env:TEMP ("sogna_empty_" + [guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Path $empty -Force | Out-Null
        robocopy $empty $Path /MIR /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
        Remove-Item -LiteralPath $empty -Force -Recurse -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $Path -Force -Recurse -ErrorAction SilentlyContinue
    }
}

Write-Host "[Sogna Repair] Enumerando node_modules..." -ForegroundColor Yellow
$nmDirs = @()
Get-ChildItem -LiteralPath $Root -Directory -Recurse -Filter 'node_modules' -ErrorAction SilentlyContinue |
    ForEach-Object { $nmDirs += $_.FullName }
$nmDirs = $nmDirs | Sort-Object { $_.Length } -Descending

Write-Host "[Sogna Repair] Eliminando $($nmDirs.Count) directorios node_modules..." -ForegroundColor Yellow
foreach ($dir in $nmDirs) {
    Write-Host "  - $dir"
    Remove-DirLongPath -Path $dir
}

$turbo = Join-Path $Root '.turbo'
if (Test-Path -LiteralPath $turbo) {
    Write-Host "[Sogna Repair] Eliminando .turbo cache..." -ForegroundColor Yellow
    Remove-DirLongPath -Path $turbo
}

Push-Location $Root
try {
    Write-Host "[Sogna Repair] pnpm install..." -ForegroundColor Green
    pnpm install
    if ($LASTEXITCODE -ne 0) { throw "pnpm install fallo con codigo $LASTEXITCODE" }

    $cycle = Join-Path $Root 'Predatore\apps\cli\node_modules\@Sogna\Curator\Sentinel'
    if (Test-Path -LiteralPath $cycle) {
        throw "Ciclo de junction detectado tras install: $cycle"
    }
    Write-Host "[Sogna Repair] Sin ciclo Predatore/Curator." -ForegroundColor Green

    Write-Host "[Sogna Repair] pnpm run check..." -ForegroundColor Green
    pnpm run check
    if ($LASTEXITCODE -ne 0) { throw "pnpm run check fallo con codigo $LASTEXITCODE" }

    Write-Host "`n[Sogna Repair] Completado." -ForegroundColor Green
}
finally {
    Pop-Location
}
