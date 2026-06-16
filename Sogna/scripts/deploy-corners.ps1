# Despliega Capa 2 desde SSOT — delega en implementacion Node (Win/Mac/Linux)
$ErrorActionPreference = 'Stop'
$nodeScript = Join-Path $PSScriptRoot 'deploy-corners.mjs'
& node $nodeScript
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
