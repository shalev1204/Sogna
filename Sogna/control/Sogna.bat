@echo off
setlocal EnableDelayedExpansion

:: ============================================================
::  SOGNA — Motor de control (SSOT)
::  Operador: Encender.bat / Apagar.bat
::  Auto:     Sogna_App.vbs (inicio de Windows)
::  Avanzado: Sogna.bat [on|off|check|sync|dashboard]
:: ============================================================

cd /d "%~dp0.."
set "PROJECT=%CD%"
set "CONTROL=%~dp0"
if "%CONTROL:~-1%"=="\" set "CONTROL=%CONTROL:~0,-1%"
set "PYTHON=%PROJECT%\.venv\Scripts\python.exe"
set "DIAG_DIR=%PROJECT%\memory\operational\logs\diagnostics"
set "LOG_DIR=%PROJECT%\memory\operational\logs"
set "RESIDENT_LOG=%LOG_DIR%\resident.log"
set "MCP_UMA_LOG=%LOG_DIR%\mcp_uma.log"
set "SENTINEL_LOG=%LOG_DIR%\sentinel_watcher.log"
set "BRIDGE_LOG=%LOG_DIR%\mcp_bridge.log"
set "DASHBOARD=http://127.0.0.1:8001/dashboard/"

if not exist "%PROJECT%\Sognatore\" (
    echo [SOGNA ERROR] Directorio de proyecto no valido: %PROJECT%
    exit /b 1
)

set "CMD=%~1"
if "%CMD%"=="" goto :help

if /i "%CMD%"=="help" goto :help
if /i "%CMD%"=="--help" goto :help
if /i "%CMD%"=="on" goto :cmd_on
if /i "%CMD%"=="off" goto :cmd_off
if /i "%CMD%"=="encender" goto :cmd_on
if /i "%CMD%"=="apagar" goto :cmd_off
if /i "%CMD%"=="up" goto :cmd_up
if /i "%CMD%"=="down" goto :cmd_off
if /i "%CMD%"=="stop" goto :cmd_off
if /i "%CMD%"=="check" goto :cmd_check
if /i "%CMD%"=="sync" goto :cmd_sync
if /i "%CMD%"=="hologram" goto :cmd_hologram
if /i "%CMD%"=="pulse" goto :cmd_hologram
if /i "%CMD%"=="dashboard" goto :cmd_dashboard

echo [SOGNA ERROR] Comando desconocido: %CMD%
goto :help

:: --- Arranque residente (segundo plano, no bloquea) ---
:cmd_on
call :start_resident
if /i "%~2"=="silent" goto :eof
echo.
echo [OK] Sogna en linea (modo residente).
echo      UMA 8080 ^| MCP UMA 8000 ^| Bridge 8001
echo      Dashboard: %DASHBOARD%
goto :eof

:: --- Parada manual de reserva ---
:cmd_off
echo.
echo  SOGNA — Apagado manual
echo  ======================
for %%P in (8080 8000 8001 5173) do (
    echo [SOGNA] Puerto %%P...
    for /f "tokens=5" %%a in ('netstat -ano 2^>NUL ^| findstr ":%%P" ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a > NUL 2>&1
    )
)
echo [OK] Servicios detenidos.
goto :eof

:: --- UP: consola foreground en Bridge (depuracion) ---
:cmd_up
echo.
echo  SOGNA UP — Consola en primer plano (Bridge bloqueante)
echo  ======================================================
call :start_resident
if !ERRORLEVEL! neq 0 exit /b !ERRORLEVEL!
echo [4/4] MCP Bridge (8001) — Ctrl+C para detener
echo  Dashboard: %DASHBOARD%
cd /d "%PROJECT%"
node engines\MCP-Bridge\build\index.js
goto :eof

:start_resident
if not exist "%PYTHON%" (
    echo [ERROR] Python no encontrado: %PYTHON%
    exit /b 1
)
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

set "PORT_CONFLICT=0"
for %%P in (8080 8000 8001 5173) do (
    netstat -ano | findstr "LISTENING" | findstr /C:":%%P " > NUL
    if !ERRORLEVEL! equ 0 set "PORT_CONFLICT=1"
)
if "!PORT_CONFLICT!"=="1" (
    echo [SOGNA] Servicios ya activos o puertos ocupados. Use Apagar.bat si necesita reiniciar.
    exit /b 0
)

echo [%TIME%] Arranque residente >> "%RESIDENT_LOG%"
echo [1/5] API UMA 8080...
start /b "" "%PYTHON%" "%PROJECT%\memory\identity\uma_server.py" >> "%RESIDENT_LOG%" 2>&1
ping -n 3 127.0.0.1 > NUL
echo [2/5] MCP UMA 8000...
start /b "" "%PYTHON%" "%PROJECT%\memory\identity\mcp_uma_server.py" >> "%MCP_UMA_LOG%" 2>&1
echo [3/5] Sentinel Watcher...
start /b "" cmd /c "cd /d "%PROJECT%" && node Sognatore\dist\Sognatore\src\scripts\utils\sentinel-watcher.js >> "%SENTINEL_LOG%" 2>&1"
echo [4/5] MCP Bridge 8001 (background)...
start /b "" cmd /c "cd /d "%PROJECT%" && node engines\MCP-Bridge\build\index.js >> "%BRIDGE_LOG%" 2>&1"
echo [5/5] Sogna Web App (Vite puerto 5173)...
start /b "" cmd /c "cd /d "%PROJECT%" && pnpm sogna:dev >> "%LOG_DIR%\web.log" 2>&1"
exit /b 0

:cmd_check
echo.
echo  SOGNA CHECK
echo  ===========
if not exist "%DIAG_DIR%" mkdir "%DIAG_DIR%"
set "DIAG_LOG=%DIAG_DIR%\check_latest.txt"
cd /d "%PROJECT%"
node Sognatore\dist\Sognatore\diagnose.js > "%DIAG_LOG%" 2>&1
set "CHECK_RC=!ERRORLEVEL!"
type "%DIAG_LOG%"
exit /b !CHECK_RC!

:cmd_sync
echo.
echo  SOGNA SYNC
echo  =========
if not exist "%PYTHON%" (
    echo [ERROR] Python no encontrado: %PYTHON%
    exit /b 1
)
cd /d "%PROJECT%"
node Sognatore\dist\Sognatore\src\scripts\utils\SentinelSigner.js
"%PYTHON%" memory\identity\consolidate.py
exit /b %ERRORLEVEL%

:cmd_hologram
cd /d "%PROJECT%"
node Sognatore\dist\Sognatore\src\core\viz\session-hologram.js
goto :eof

:cmd_dashboard
start "" "%DASHBOARD%"
echo [SOGNA] %DASHBOARD%
goto :eof

:help
echo.
echo  SOGNA — Comandos (motor: control\Sogna.bat)
echo  ===========================================
echo.
echo  Operador (doble clic):
echo    Encender.bat     Encendido manual (on, segundo plano)
echo    Apagar.bat       Apagado manual (off)
echo.
echo  Arranque automatico: Sogna_App.vbs (Windows + MCP residentes)
echo.
echo  Linea de comandos:
echo    on / encender    Servicios en background (8080, 8000, 8001)
echo    off / apagar     Detiene los tres puertos
echo    up               Igual que on pero Bridge en esta consola
echo    check / sync     Diagnostico y consolidacion
echo    dashboard        Panel web :8001
echo    hologram         Telemetria de sesion
echo.
echo  Documentacion: control\docs\
echo.
goto :eof
endlocal
