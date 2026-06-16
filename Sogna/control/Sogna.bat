@echo off
setlocal
cd /d "%~dp0"
node "%~dp0sogna.mjs" %*
exit /b %ERRORLEVEL%
