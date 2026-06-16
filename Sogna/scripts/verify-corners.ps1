# Verifica Capa 2 corners + ignores — delega en implementacion Node (Win/Mac/Linux)
$ErrorActionPreference = 'Stop'
$nodeScript = Join-Path $PSScriptRoot 'verify-corners.mjs'
& node $nodeScript
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
