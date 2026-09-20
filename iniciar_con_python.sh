#!/usr/bin/env bash
# ========================================================================
# SISTEMA DE SOLICITUD DE RESERVAS Y DESPACHO EN TIEMPO REAL
# Servidor de Ejecución Remota mediante IP (Python 3)
# ========================================================================

set -e

echo "========================================================================"
echo "  SISTEMA DE SOLICITUD DE RESERVAS Y DESPACHO EN TIEMPO REAL"
echo "  SERVIDOR DE EJECUCIÓN REMOTA MEDIANTE IP (PYTHON 3)"
echo "========================================================================"
echo ""

# Buscar ejecutable de Python 3
if command -v python3 &>/dev/null; then
    PY_BIN="python3"
elif command -v python &>/dev/null; then
    PY_BIN="python"
else
    echo "[ERROR] Python 3 no está instalado en este equipo."
    echo "Instálalo usando: sudo apt install python3 (Debian/Ubuntu) o brew install python (macOS)"
    exit 1
fi

echo "[✓] Intérprete detectado: $($PY_BIN --version)"
echo ""
echo "Iniciando servidor HTTP/SSE en host 0.0.0.0 y puerto 8080..."
echo "Permite el acceso remoto por dirección IP desde cualquier PC, tablet o celular."
echo ""

exec "$PY_BIN" server.py --host 0.0.0.0 --port 8080
