#!/usr/bin/env bash
# ========================================================================
# SISTEMA DE SOLICITUD DE RESERVAS Y DESPACHO EN TIEMPO REAL
# Servidor de Ejecución Remota mediante IP (Python 3)
# ========================================================================

echo "========================================================================"
echo "  SISTEMA DE SOLICITUD DE RESERVAS Y DESPACHO EN TIEMPO REAL"
echo "  SERVIDOR DE EJECUCIÓN REMOTA MEDIANTE IP (PYTHON 3)"
echo "========================================================================"
echo ""

# 1. Comprobar Python 3
if command -v python3 &>/dev/null; then
    echo "[✓] Python 3 detectado: $(python3 --version)"
    echo "Iniciando servidor en modo remoto IP (0.0.0.0:8080)..."
    echo "Accede desde tu red local mediante tu IP local (ej: http://192.168.1.X:8080)"
    echo ""
    exec python3 server.py --host 0.0.0.0 --port 8080
elif command -v python &>/dev/null; then
    echo "[✓] Python detectado: $(python --version)"
    echo "Iniciando servidor en modo remoto IP (0.0.0.0:8080)..."
    echo ""
    exec python server.py --host 0.0.0.0 --port 8080
fi

# 2. Fallback a Node.js si no tiene Python
echo "[AVISO] No se detectó Python 3 instalado. Verificando Node.js..."
if command -v npm &>/dev/null; then
    if [ ! -d "node_modules" ]; then
        echo "Instalando dependencias Node.js..."
        npm install
    fi
    echo "Iniciando con Node.js en puerto 8080..."
    PORT=8080 npm run start
    exit 0
fi

echo "[ERROR] No se encontró Python 3 ni Node.js instalado."
echo "Instala Python 3 con: sudo apt install python3"
exit 1
