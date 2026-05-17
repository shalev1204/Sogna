@echo off
TITLE Configurando Inicio Automatico de Sogna UMA
echo ==================================================
echo   Configurando Sogna UMA para Inicio Automatico
echo ==================================================
echo.

powershell -NoProfile -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut($env:APPDATA + '\Microsoft\Windows\Start Menu\Programs\Startup\Sogna_UMA.lnk'); $Shortcut.TargetPath = '%~dp0Sogna_App.vbs'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Save()"

echo [EXITO] Sogna UMA ha sido configurado para iniciarse automaticamente al encender el ordenador.
echo.
ping -n 4 127.0.0.1 > NUL
