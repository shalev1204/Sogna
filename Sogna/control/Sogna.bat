@echo off
:: SOGNA UMA IGNITION SCRIPT
:: Autonomía Total: Usa el entorno virtual interno y rutas relativas al núcleo.
cd /d "%~dp0..\"

echo 🚀 SOGNA: Despertando Memoria UMA...
.venv\Scripts\python.exe memory\identity\mcp_uma_server.py
