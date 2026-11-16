@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================================
echo   DE UNA, CHANGO! - Instalador de Plantilla OBS (1 Clic)
echo ============================================================
echo.
echo Actualizando rutas locales en DE_UNA_CHANGO_OBS.json...
echo Carpeta detectada: "%~dp0"
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\actualizar-rutas.ps1"

if errorlevel 1 (
    echo.
    echo [ERROR] No se pudieron actualizar las rutas.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   LISTO PARA USAR EN OBS STUDIO:
echo   1. Abre OBS Studio
echo   2. Ve a: Coleccion de escenas ^> Importar
echo   3. Selecciona DE_UNA_CHANGO_OBS.json de esta carpeta
echo ============================================================
echo.
pause
