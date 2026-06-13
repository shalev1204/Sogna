# Instala esquinas Capa 2 en la raiz git del host que contiene carpeta Sogna/
param(
    [string]$SognaSubpath = 'Sogna'
)

$ErrorActionPreference = 'Stop'

$scriptDir = $PSScriptRoot
$sognaRoot = Split-Path $scriptDir -Parent

$manifest = Join-Path $sognaRoot 'platform.manifest.json'
if (-not (Test-Path $manifest)) {
    throw "No Sogna installation at $sognaRoot (missing platform.manifest.json)."
}

$hostRoot = Split-Path $sognaRoot -Parent
Write-Host "Host root: $hostRoot"
Write-Host "Sogna root: $sognaRoot"
Write-Host ''

& (Join-Path $scriptDir 'deploy-corners.ps1')

Write-Host ''
Write-Host 'Capa 2 instalada. Commit .cursor/, .claude/, .agents/, CLAUDE.md (host), Sogna/Curator/corners/ y manifest.'
