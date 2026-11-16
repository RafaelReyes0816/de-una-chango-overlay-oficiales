@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================================
echo   DE UNA, CHANGO! - Iniciando Centro de Control en Vivo
echo ============================================================
echo.
echo Abriendo el Panel de Control en http://localhost:4545 ...
echo.

start "" "http://localhost:4545"
node "%~dp0tools\servidor-control.js"

pause
