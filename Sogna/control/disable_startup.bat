@echo off
TITLE Desactivando Inicio Automatico de Sogna UMA
echo ==================================================
echo   Desactivando Inicio Automatico de Sogna UMA
echo ==================================================
echo.

powershell -NoProfile -Command ^
  "Remove-Item -Path \"$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Sogna_UMA.lnk\" -Force -ErrorAction SilentlyContinue"

echo [EXITO] El inicio automatico de Sogna UMA ha sido desactivado con exito.
echo.
ping -n 4 127.0.0.1 > NUL
