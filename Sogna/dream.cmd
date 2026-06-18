@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1 || (
  echo [dream] ERROR: Node no encontrado. Instale Node 20+ desde https://nodejs.org/
  exit /b 1
)
node scripts\sogna-dream.mjs %*
exit /b %ERRORLEVEL%
