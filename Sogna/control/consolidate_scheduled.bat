@echo off
setlocal EnableDelayedExpansion

:: SOGNA — Consolidacion UMA programada (Task Scheduler, cada 24h)
:: Invocado por install_consolidation_task.ps1; no requiere interaccion del operador.

cd /d "%~dp0.."
set "PROJECT=%CD%"
set "PYTHON=%PROJECT%\.venv\Scripts\python.exe"
set "LOG_DIR=%PROJECT%\memory\operational\logs"
set "LOG_FILE=%LOG_DIR%\consolidation_scheduler.log"

if not exist "%PROJECT%\Sognatore\" (
    echo [%DATE% %TIME%] ERROR: proyecto invalido %PROJECT%>> "%LOG_FILE%"
    exit /b 1
)

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

if not exist "%PYTHON%" (
    where python >nul 2>&1
    if errorlevel 1 (
        echo [%DATE% %TIME%] ERROR: Python no encontrado>> "%LOG_FILE%"
        exit /b 1
    )
    set "PYTHON=python"
)

echo.>> "%LOG_FILE%"
echo ==================================================>> "%LOG_FILE%"
echo [%DATE% %TIME%] SOGNA consolidation pipeline start>> "%LOG_FILE%"
echo ==================================================>> "%LOG_FILE%"

cd /d "%PROJECT%"
"%PYTHON%" memory\identity\consolidate.py >> "%LOG_FILE%" 2>&1
set "RC=!ERRORLEVEL!"

if !RC! equ 0 (
    echo [%DATE% %TIME%] OK — pipeline complete>> "%LOG_FILE%"
) else (
    echo [%DATE% %TIME%] ERROR — exit code !RC!>> "%LOG_FILE%"
)

exit /b !RC!
