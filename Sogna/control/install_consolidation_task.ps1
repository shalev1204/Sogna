#Requires -Version 5.1
<#
.SYNOPSIS
    Registra la tarea programada de consolidacion UMA (consolidate.py cada 24h).
.DESCRIPTION
    Crea "Sogna Memory Consolidation" en el Programador de tareas de Windows.
    Ejecutar desde PowerShell: .\install_consolidation_task.ps1
#>
$ErrorActionPreference = 'Stop'

$TaskName = 'Sogna Memory Consolidation'
$ControlDir = $PSScriptRoot
$ProjectRoot = (Resolve-Path (Join-Path $ControlDir '..')).Path
$BatchPath = Join-Path $ControlDir 'consolidate_scheduled.bat'

if (-not (Test-Path $BatchPath)) {
    Write-Error "No se encuentra consolidate_scheduled.bat en $ControlDir"
}

if (-not (Test-Path (Join-Path $ProjectRoot 'memory\identity\consolidate.py'))) {
    Write-Error "No se encuentra consolidate.py en $ProjectRoot\memory\identity"
}

$Existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($Existing) {
    Write-Host "Tarea existente detectada. Re-registrando..."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

$Action = New-ScheduledTaskAction `
    -Execute $BatchPath `
    -WorkingDirectory $ProjectRoot

$Trigger = New-ScheduledTaskTrigger -Daily -At '03:00'

$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
    -MultipleInstances IgnoreNew

$Principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Limited

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Principal $Principal `
    -Description 'Sogna UMA: pipeline de consolidacion episodica->semantica (consolidate.py) cada 24 horas.' | Out-Null

Write-Host ""
Write-Host "Tarea registrada: $TaskName"
Write-Host "  Frecuencia : diaria a las 03:00 (hora local)"
Write-Host "  Script     : $BatchPath"
Write-Host "  Log        : $ProjectRoot\memory\operational\logs\consolidation_scheduler.log"
Write-Host ""
Write-Host "Verificacion:"
Get-ScheduledTask -TaskName $TaskName | Format-List TaskName, State, TaskPath
Get-ScheduledTaskInfo -TaskName $TaskName | Format-List LastRunTime, NextRunTime, LastTaskResult
