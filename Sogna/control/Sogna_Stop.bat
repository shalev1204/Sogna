@echo off
TITLE Apagando Sogna UMA
echo ==================================================
echo   Desconectando el Cerebro UMA en segundo plano...
echo ==================================================

:: Busca qué proceso está usando el puerto 8000 y lo asesina silenciosamente
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /f /pid %%a > NUL 2>&1

echo.
echo Sistema desconectado y puerto liberado con exito.
timeout /t 3 /nobreak > NUL
