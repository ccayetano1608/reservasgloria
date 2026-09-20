@echo off
title Sistema de Solicitud de Reservas - Ejecucion Remota en Python 3
color 0b
echo ========================================================================
echo   SISTEMA DE SOLICITUD DE RESERVAS Y DESPACHO EN TIEMPO REAL
echo   SERVIDOR DE EJECUCION REMOTA MEDIANTE IP (PYTHON 3)
echo ========================================================================
echo.

:: 1. Comprobar si Python 3 está disponible
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Servidor Python 3 detectado.
    echo Iniciando en modo remoto IP (0.0.0.0:8080)...
    echo Accede desde cualquier PC, movil o tablet en tu red mediante tu direccion IP local.
    echo.
    python server.py --host 0.0.0.0 --port 8080
    pause
    exit /b 0
)

where py >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Python Launcher detectado.
    echo Iniciando en modo remoto IP (0.0.0.0:8080)...
    echo.
    py server.py --host 0.0.0.0 --port 8080
    pause
    exit /b 0
)

:: 2. Fallback a Node.js si no tiene Python
echo [AVISO] No se detecto Python instalado. Probando con Node.js...
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    if not exist "node_modules" (
        echo Instalando dependencias Node.js...
        call npm install
    )
    set PORT=8080
    call npm run start
    pause
    exit /b 0
)

echo [ERROR] No se encontro ni Python 3 ni Node.js instalados en tu equipo.
echo Por favor instala Python 3 desde: https://www.python.org/
echo.
pause
