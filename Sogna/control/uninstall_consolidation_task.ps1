#Requires -Version 5.1
<#
.SYNOPSIS
    Elimina la tarea programada de consolidacion UMA.
#>
$ErrorActionPreference = 'Stop'

$TaskName = 'Sogna Memory Consolidation'
$Existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if (-not $Existing) {
    Write-Host "La tarea '$TaskName' no existe."
    exit 0
}

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Write-Host "Tarea eliminada: $TaskName"
