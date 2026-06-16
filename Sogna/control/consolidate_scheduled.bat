@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0.."
set "PROJECT=%CD%"
set "LOG_DIR=%PROJECT%\memory\operational\logs"
set "LOG_FILE=%LOG_DIR%\consolidation_scheduler.log"

if not exist "%PROJECT%\Sognatore\" (
    echo [%DATE% %TIME%] ERROR: proyecto invalido %PROJECT%>> "%LOG_FILE%"
    exit /b 1
)

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

cd /d "%~dp0"
node "%~dp0sogna.mjs" consolidate
exit /b %ERRORLEVEL%
