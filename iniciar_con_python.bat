@echo off
title Sistema de Solicitud de Reservas - Servidor Remoto Python 3
color 0b
echo ========================================================================
echo   SISTEMA DE SOLICITUD DE RESERVAS Y DESPACHO EN TIEMPO REAL
echo   SERVIDOR DE EJECUCION REMOTA MEDIANTE IP (PYTHON 3)
echo ========================================================================
echo.

:: Verificar si Python está instalado
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    where py >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] No se encontro Python 3 instalado en tu equipo.
        echo Por favor descarga e instala Python 3 desde https://www.python.org/
        echo Asegurate de marcar la casilla "Add Python to PATH" durante la instalacion.
        echo.
        pause
        exit /b 1
    ) else (
        set PY_CMD=py
    )
) else (
    set PY_CMD=python
)

echo [OK] Python detectado en el sistema.
echo.
echo Iniciando servidor Python en modo remoto IP (0.0.0.0:8080)...
echo Conexiones remotas habilitadas por IP en la red local (Wi-Fi / Ethernet).
echo.

%PY_CMD% server.py --host 0.0.0.0 --port 8080

pause
