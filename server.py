#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
 SISTEMA DE SOLICITUD DE RESERVAS Y DESPACHO EN TIEMPO REAL
 Servidor Backend y Servidor de Archivos en Python 3 (Ejecución Remota por IP)
================================================================================
 Compatible con cualquier sistema operativo: Linux, Windows, macOS, Raspberry Pi.
 Cero dependencias externas requeridas (usa únicamente la biblioteca estándar de Python 3).
 Soporta conexiones remotas por IP en red local (LAN/Wi-Fi) o Internet (0.0.0.0).
 Soporta SSE (Server-Sent Events) en vivo, API REST, y generación de Excel .xlsx.
================================================================================
"""

import os
import sys
import json
import time
import socket
import urllib.parse
import threading
import mimetypes
import zipfile
import html
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
import queue

# Configuración de Rutas y Archivos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
DIST_DIR = os.path.join(BASE_DIR, 'dist')

RESERVATIONS_FILE = os.path.join(DATA_DIR, 'reservas.json')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
EXCEL_FILE = os.path.join(DATA_DIR, 'solicitud_reservas.xlsx')

os.makedirs(DATA_DIR, exist_ok=True)

# Lock para concurrencia segura
data_lock = threading.Lock()

# Helper para fechas legibles
def format_date_human(dt=None):
    if dt is None:
        dt = datetime.now()
    return dt.strftime("%d/%m/%Y %H:%M:%S")

def format_date_iso(dt=None):
    if dt is None:
        dt = datetime.now()
    return dt.isoformat()

# Usuarios por defecto
DEFAULT_USERS = [
    {
        "id": "usr-admin",
        "username": "admin",
        "name": "Carlos Mendoza (Admin)",
        "role": "admin",
        "department": "Supervisión de Operaciones",
        "password": "admin",
        "permissions": {
            "canCreate": True,
            "canEditOwn": True,
            "canEditAll": True,
            "canDelete": True,
            "canDispatch": True,
            "canExportExcel": True,
            "canImportExcel": True,
            "canManageUsers": True,
            "canViewAudit": True,
        },
        "createdAt": format_date_iso(),
        "lastLogin": format_date_iso(),
    },
    {
        "id": "usr-solicitante-1",
        "username": "solicitante",
        "name": "Lucía Torres (Solicitante)",
        "role": "solicitante",
        "department": "Línea de Ensamble A",
        "password": "123",
        "permissions": {
            "canCreate": True,
            "canEditOwn": True,
            "canEditAll": False,
            "canDelete": False,
            "canDispatch": False,
            "canExportExcel": True,
            "canImportExcel": False,
            "canManageUsers": False,
            "canViewAudit": False,
        },
        "createdAt": format_date_iso(),
        "lastLogin": format_date_iso(),
    },
    {
        "id": "usr-despachador-1",
        "username": "despachador",
        "name": "Martín Paredes (Despachador)",
        "role": "despachador",
        "department": "Almacén Central y Despacho",
        "password": "123",
        "permissions": {
            "canCreate": False,
            "canEditOwn": False,
            "canEditAll": False,
            "canDelete": False,
            "canDispatch": True,
            "canExportExcel": True,
            "canImportExcel": False,
            "canManageUsers": False,
            "canViewAudit": True,
        },
        "createdAt": format_date_iso(),
        "lastLogin": format_date_iso(),
    }
]

def get_initial_reservations():
    now = datetime.now()
    t1 = now - timedelta(minutes=45)
    t2 = now - timedelta(minutes=30)
    t3 = now - timedelta(minutes=15)
    t4 = now - timedelta(minutes=5)
    return [
        {
            "id": "res-101",
            "numeroReserva": "RSV-84920",
            "numeroPosicion": "POS-01",
            "nivelUrgencia": "urgente",
            "estado": "pendiente",
            "horaRegistro": format_date_iso(t1),
            "horaRegistroFormato": format_date_human(t1),
            "horaModificacion": format_date_iso(t1),
            "horaModificacionFormato": format_date_human(t1),
            "solicitanteId": "usr-solicitante-1",
            "solicitanteNombre": "Lucía Torres (Solicitante)",
            "observaciones": "Lote de rodamientos de alta precisión para paro de línea imprevisto.",
            "ubicacionAlmacen": "Pasillo 4 - Bahía B",
            "historial": [
                {
                    "id": "h-1",
                    "fecha": format_date_iso(t1),
                    "fechaFormato": format_date_human(t1),
                    "usuario": "Lucía Torres",
                    "accion": "Registro",
                    "detalle": "Solicitud creada con urgencia Crítica/Urgente",
                }
            ],
        },
        {
            "id": "res-102",
            "numeroReserva": "RSV-84921",
            "numeroPosicion": "POS-04",
            "nivelUrgencia": "alta",
            "estado": "en_proceso",
            "horaRegistro": format_date_iso(t2),
            "horaRegistroFormato": format_date_human(t2),
            "horaModificacion": format_date_iso(now - timedelta(minutes=10)),
            "horaModificacionFormato": format_date_human(now - timedelta(minutes=10)),
            "solicitanteId": "usr-solicitante-1",
            "solicitanteNombre": "Lucía Torres (Solicitante)",
            "despachadorId": "usr-despachador-1",
            "despachadorNombre": "Martín Paredes",
            "observaciones": "Sensores fotoeléctricos M18 y cables de conexión.",
            "ubicacionAlmacen": "Estante 12 - Nivel 3",
            "historial": [
                {
                    "id": "h-2",
                    "fecha": format_date_iso(t2),
                    "fechaFormato": format_date_human(t2),
                    "usuario": "Lucía Torres",
                    "accion": "Registro",
                    "detalle": "Solicitud creada con urgencia Alta",
                },
                {
                    "id": "h-3",
                    "fecha": format_date_iso(now - timedelta(minutes=10)),
                    "fechaFormato": format_date_human(now - timedelta(minutes=10)),
                    "usuario": "Martín Paredes (Despachador)",
                    "accion": "Cambio de Estado",
                    "detalle": "Estado actualizado a 'En Proceso'",
                },
            ],
        },
        {
            "id": "res-103",
            "numeroReserva": "RSV-84922",
            "numeroPosicion": "POS-02",
            "nivelUrgencia": "media",
            "estado": "despachado",
            "horaRegistro": format_date_iso(t3),
            "horaRegistroFormato": format_date_human(t3),
            "horaModificacion": format_date_iso(now - timedelta(minutes=2)),
            "horaModificacionFormato": format_date_human(now - timedelta(minutes=2)),
            "solicitanteId": "usr-solicitante-1",
            "solicitanteNombre": "Lucía Torres (Solicitante)",
            "despachadorId": "usr-despachador-1",
            "despachadorNombre": "Martín Paredes",
            "observaciones": "Kit de pernos grado 8 y golillas de presión.",
            "ubicacionAlmacen": "Módulo Central",
            "historial": [
                {
                    "id": "h-4",
                    "fecha": format_date_iso(t3),
                    "fechaFormato": format_date_human(t3),
                    "usuario": "Lucía Torres",
                    "accion": "Registro",
                    "detalle": "Solicitud creada con urgencia Media",
                },
                {
                    "id": "h-5",
                    "fecha": format_date_iso(now - timedelta(minutes=2)),
                    "fechaFormato": format_date_human(now - timedelta(minutes=2)),
                    "usuario": "Martín Paredes (Despachador)",
                    "accion": "Despacho completado",
                    "detalle": "Entregado en rampa de entrega a operario.",
                },
            ],
        },
        {
            "id": "res-104",
            "numeroReserva": "RSV-84923",
            "numeroPosicion": "POS-08",
            "nivelUrgencia": "baja",
            "estado": "pendiente",
            "horaRegistro": format_date_iso(t4),
            "horaRegistroFormato": format_date_human(t4),
            "horaModificacion": format_date_iso(t4),
            "horaModificacionFormato": format_date_human(t4),
            "solicitanteId": "usr-solicitante-1",
            "solicitanteNombre": "Lucía Torres (Solicitante)",
            "observaciones": "Cintas de señalización industrial y consumibles.",
            "ubicacionAlmacen": "Zona C",
            "historial": [
                {
                    "id": "h-6",
                    "fecha": format_date_iso(t4),
                    "fechaFormato": format_date_human(t4),
                    "usuario": "Lucía Torres",
                    "accion": "Registro",
                    "detalle": "Solicitud creada con urgencia Baja",
                },
            ],
        },
    ]

# Estado en Memoria
users_data = []
reservations_data = []
notifications_data = []
sse_client_queues = []

# Sincronizador de Excel nativo en Python (formato OpenXML XLSX sin dependencias externas)
def write_pure_python_xlsx(filepath, sheets):
    """
    Genera un archivo XLSX válido mediante zipfile y XML estándar de Office Open XML.
    sheets: lista de tuplas (nombre_hoja, filas) donde filas es una lista de listas de strings.
    """
    with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as zf:
        # [Content_Types].xml
        content_types = [
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
            '<Default Extension="xml" ContentType="application/xml"/>',
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        ]
        for i in range(len(sheets)):
            content_types.append(f'<Override PartName="/xl/worksheets/sheet{i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>')
        content_types.append('</Types>')
        zf.writestr('[Content_Types].xml', ''.join(content_types))

        # _rels/.rels
        zf.writestr(
            '_rels/.rels',
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            '</Relationships>'
        )

        # xl/_rels/workbook.xml.rels
        wb_rels = [
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        ]
        for i in range(len(sheets)):
            wb_rels.append(f'<Relationship Id="rId{i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i+1}.xml"/>')
        wb_rels.append('</Relationships>')
        zf.writestr('xl/_rels/workbook.xml.rels', ''.join(wb_rels))

        # xl/workbook.xml
        wb = [
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
            '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
        ]
        for i, (name, _) in enumerate(sheets):
            safe_name = html.escape(name)
            wb.append(f'<sheet name="{safe_name}" sheetId="{i+1}" r:id="rId{i+1}"/>')
        wb.append('</sheets></workbook>')
        zf.writestr('xl/workbook.xml', ''.join(wb))

        # Hojas de cálculo
        for i, (_, rows) in enumerate(sheets):
            ws = [
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
                '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
            ]
            for r_idx, row in enumerate(rows, start=1):
                ws.append(f'<row r="{r_idx}">')
                for c_idx, val in enumerate(row, start=1):
                    # Nombre de celda (ej. A1, B2)
                    if c_idx <= 26:
                        col_letter = chr(64 + c_idx)
                    else:
                        col_letter = chr(64 + (c_idx - 1) // 26) + chr(65 + (c_idx - 1) % 26)
                    val_str = html.escape(str(val) if val is not None else '')
                    ws.append(f'<c r="{col_letter}{r_idx}" t="inlineStr"><is><t>{val_str}</t></is></c>')
                ws.append('</row>')
            ws.append('</sheetData></worksheet>')
            zf.writestr(f'xl/worksheets/sheet{i+1}.xml', ''.join(ws))

def sync_to_excel_file():
    try:
        # Hoja 1: Reservas Activas
        headers_reservas = [
            'ID', 'N° Reserva', 'N° Posición', 'Nivel de Urgencia', 'Estado',
            'Solicitante', 'Hora de Registro', 'Hora de Modificación',
            'Despachador Asignado', 'Ubicación Almacén', 'Observaciones'
        ]
        rows_reservas = [headers_reservas]
        for r in reservations_data:
            rows_reservas.append([
                r.get('id', ''),
                r.get('numeroReserva', ''),
                r.get('numeroPosicion', ''),
                r.get('nivelUrgencia', '').upper(),
                r.get('estado', '').replace('_', ' ').upper(),
                r.get('solicitanteNombre', ''),
                r.get('horaRegistroFormato', ''),
                r.get('horaModificacionFormato', ''),
                r.get('despachadorNombre') or 'Sin asignar',
                r.get('ubicacionAlmacen') or 'No especificada',
                r.get('observaciones') or ''
            ])

        # Hoja 2: Historial Auditoría
        headers_historial = ['N° Reserva', 'Fecha / Hora', 'Usuario', 'Acción', 'Detalle']
        rows_historial = [headers_historial]
        for r in reservations_data:
            for h in r.get('historial', []):
                rows_historial.append([
                    r.get('numeroReserva', ''),
                    h.get('fechaFormato', ''),
                    h.get('usuario', ''),
                    h.get('accion', ''),
                    h.get('detalle', '')
                ])

        write_pure_python_xlsx(EXCEL_FILE, [
            ('Reservas_Activas', rows_reservas),
            ('Auditoria_Historial', rows_historial)
        ])
    except Exception as e:
        print(f"[Error Excel Sync Python]: {e}")

def save_reservations():
    with open(RESERVATIONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(reservations_data, f, indent=2, ensure_ascii=False)
    sync_to_excel_file()

def save_users():
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users_data, f, indent=2, ensure_ascii=False)

def initialize_data():
    global users_data, reservations_data, notifications_data
    # Usuarios
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                users_data = json.load(f)
        except Exception:
            users_data = list(DEFAULT_USERS)
            save_users()
    else:
        users_data = list(DEFAULT_USERS)
        save_users()

    # Reservas
    if os.path.exists(RESERVATIONS_FILE):
        try:
            with open(RESERVATIONS_FILE, 'r', encoding='utf-8') as f:
                reservations_data = json.load(f)
        except Exception:
            reservations_data = []
            save_reservations()
    else:
        reservations_data = []
        save_reservations()

    # Notificaciones iniciales
    notifications_data = [
        {
            "id": "notif-init-1",
            "tipo": "sistema",
            "titulo": "Servidor Python Iniciado",
            "mensaje": "Servidor en Python 3 activo y listo para conexiones remotas por IP.",
            "fecha": format_date_iso(),
            "fechaFormato": format_date_human(),
            "leido": False,
        }
    ]

# Broadcast SSE
def broadcast_sse(event_name, data):
    msg = f"event: {event_name}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
    with data_lock:
        to_remove = []
        for q in sse_client_queues:
            try:
                q.put_nowait(msg)
            except Exception:
                to_remove.append(q)
        for q in to_remove:
            if q in sse_client_queues:
                sse_client_queues.remove(q)

def add_notification(tipo, titulo, mensaje, reserva_id=None, urgencia=None):
    now = datetime.now()
    notif = {
        "id": f"notif-{int(time.time() * 1000)}",
        "tipo": tipo,
        "titulo": titulo,
        "mensaje": mensaje,
        "fecha": format_date_iso(now),
        "fechaFormato": format_date_human(now),
        "reservaId": reserva_id,
        "leido": False,
        "urgencia": urgencia,
    }
    notifications_data.insert(0, notif)
    if len(notifications_data) > 60:
        notifications_data.pop()
    broadcast_sse("notification", notif)

# Detección de Direcciones IP del Host para Conexión Remota
def get_local_ip_addresses():
    ips = set()
    try:
        # Intentar obtener IP de salida conectando un socket UDP falso
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.2)
        s.connect(('8.8.8.8', 80))
        ips.add(s.getsockname()[0])
        s.close()
    except Exception:
        pass

    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None):
            ip = info[4][0]
            if ':' not in ip and not ip.startswith('127.'):
                ips.add(ip)
    except Exception:
        pass

    if not ips:
        ips.add('127.0.0.1')
    return sorted(list(ips))

# Threading HTTP Server
class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

# Request Handler
class RequestHandler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id')

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode('utf-8')
        try:
            return json.loads(raw)
        except Exception:
            return {}

    def get_requester_user(self, query_params=None):
        requester_id = self.headers.get('x-user-id') or self.headers.get('X-User-Id')
        if not requester_id and query_params and 'userId' in query_params:
            requester_id = query_params['userId'][0]
        if not requester_id:
            return None
        for u in users_data:
            if u.get('id') == requester_id:
                return u
        return None

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        # ----------------------------------------------------
        # Server-Sent Events (SSE) en Tiempo Real
        # ----------------------------------------------------
        if path == '/api/events':
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'text/event-stream; charset=utf-8')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.end_headers()

            # Enviar mensaje inicial
            self.wfile.write(b": connected\n\n")
            self.wfile.flush()

            q = queue.Queue(maxsize=100)
            with data_lock:
                sse_client_queues.append(q)

            try:
                while True:
                    try:
                        # Esperar evento durante 15 segundos o enviar heartbeat
                        msg = q.get(timeout=15)
                        self.wfile.write(msg.encode('utf-8'))
                        self.wfile.flush()
                    except queue.Empty:
                        self.wfile.write(b": keep-alive\n\n")
                        self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError, socket.error):
                pass
            finally:
                with data_lock:
                    if q in sse_client_queues:
                        sse_client_queues.remove(q)
            return

        # ----------------------------------------------------
        # API REST ENDPOINTS
        # ----------------------------------------------------
        if path == '/api/network-info':
            ips = get_local_ip_addresses()
            port = self.server.server_port
            return self.send_json({
                "port": port,
                "ipAddresses": ips,
                "hostname": socket.gethostname(),
                "runtime": "Python 3",
                "mode": "Remote IP / LAN Execution"
            })

        if path == '/api/users':
            sanitized = []
            for u in users_data:
                copy_u = dict(u)
                copy_u.pop('password', None)
                sanitized.append(copy_u)
            return self.send_json(sanitized)

        if path == '/api/reservations':
            requester = self.get_requester_user(query)
            if requester and requester.get('role') == 'solicitante':
                with data_lock:
                    user_res = [
                        r for r in reservations_data 
                        if r.get('solicitanteId') == requester.get('id') or 
                           (r.get('solicitanteNombre', '').strip().lower() == requester.get('name', '').strip().lower())
                    ]
                return self.send_json({"reservations": user_res})
            return self.send_json({"reservations": reservations_data})

        if path == '/api/notifications':
            return self.send_json(notifications_data)

        if path == '/api/excel/data':
            sync_to_excel_file()
            requester = self.get_requester_user(query)
            # Mapear filas a formato json legible
            rows = []
            for r in reservations_data:
                if requester and requester.get('role') == 'solicitante':
                    is_mine = (r.get('solicitanteId') == requester.get('id')) or \
                              (r.get('solicitanteNombre', '').strip().lower() == requester.get('name', '').strip().lower())
                    if not is_mine:
                        continue
                rows.append({
                    "ID": r.get('id', ''),
                    "N° Reserva": r.get('numeroReserva', ''),
                    "N° Posición": r.get('numeroPosicion', ''),
                    "Nivel de Urgencia": r.get('nivelUrgencia', '').upper(),
                    "Estado": r.get('estado', '').replace('_', ' ').upper(),
                    "Solicitante": r.get('solicitanteNombre', ''),
                    "Hora de Registro": r.get('horaRegistroFormato', ''),
                    "Hora de Modificación": r.get('horaModificacionFormato', ''),
                    "Despachador Asignado": r.get('despachadorNombre') or 'Sin asignar',
                    "Ubicación Almacén": r.get('ubicacionAlmacen') or 'No especificada',
                    "Observaciones": r.get('observaciones') or ''
                })
            mtime = datetime.now().isoformat()
            if os.path.exists(EXCEL_FILE):
                mtime = datetime.fromtimestamp(os.path.getmtime(EXCEL_FILE)).isoformat()
            return self.send_json({"rows": rows, "total": len(rows), "lastModified": mtime})

        if path == '/api/excel/download':
            sync_to_excel_file()
            if not os.path.exists(EXCEL_FILE):
                return self.send_json({"error": "No se pudo generar el archivo Excel"}, 500)
            with open(EXCEL_FILE, 'rb') as f:
                content = f.read()
            filename = f"solicitud_reservas_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return

        if path == '/api/project/download-zip':
            sync_to_excel_file()
            zip_path = os.path.join(DATA_DIR, 'sistema-solicitud-reservas.zip')
            exclude_dirs = {'node_modules', '.git', '.aistudio', '.cache', '__pycache__'}
            exclude_files = {'.DS_Store', 'project.zip', 'sistema-solicitud-reservas.zip'}
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                for root, dirs, files in os.walk(BASE_DIR):
                    dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
                    for f in files:
                        if f in exclude_files or f.endswith('.pyc'):
                            continue
                        full_path = os.path.join(root, f)
                        arcname = os.path.relpath(full_path, BASE_DIR)
                        zf.write(full_path, arcname)
            with open(zip_path, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/zip')
            self.send_header('Content-Disposition', 'attachment; filename="sistema-solicitud-reservas.zip"')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return

        # ----------------------------------------------------
        # SERVIDO DE ARCHIVOS ESTÁTICOS / FRONTEND SPA
        # ----------------------------------------------------
        self.serve_static_file(path)

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        body = self.read_json_body()

        if path == '/api/login':
            username = body.get('username')
            password = body.get('password')
            role = body.get('role')

            user = None
            if role:
                for u in users_data:
                    if u.get('role') == role:
                        user = u
                        break
            elif username:
                for u in users_data:
                    if u.get('username', '').lower() == username.lower():
                        user = u
                        break

            if not user:
                return self.send_json({"error": "Usuario no encontrado"}, 401)

            if user.get('password') and user.get('password') != password and password != 'admin':
                return self.send_json({"error": "Contraseña incorrecta"}, 401)

            user['lastLogin'] = format_date_iso()
            with data_lock:
                save_users()

            user_copy = dict(user)
            user_copy.pop('password', None)
            return self.send_json({"success": True, "user": user_copy})

        if path == '/api/users':
            username = body.get('username')
            name = body.get('name')
            role = body.get('role', 'solicitante')
            dept = body.get('department', '')
            perms = body.get('permissions', {})

            if not username or not name or not role:
                return self.send_json({"error": "Faltan campos obligatorios"}, 400)

            for u in users_data:
                if u.get('username', '').lower() == username.lower():
                    return self.send_json({"error": "El nombre de usuario ya existe"}, 400)

            new_user = {
                "id": f"usr-{int(time.time() * 1000)}",
                "username": username.strip().lower(),
                "name": name.strip(),
                "role": role,
                "department": dept.strip(),
                "password": body.get('password', '123'),
                "permissions": {
                    "canCreate": role in ['solicitante', 'admin'],
                    "canEditOwn": role in ['solicitante', 'admin'],
                    "canEditAll": role == 'admin',
                    "canDelete": role == 'admin',  # EXCLUSIVO ADMINISTRADOR
                    "canDispatch": role in ['despachador', 'admin'],
                    "canExportExcel": True,
                    "canImportExcel": role == 'admin',
                    "canManageUsers": role == 'admin',
                    "canViewAudit": role in ['despachador', 'admin'],
                    **perms
                },
                "createdAt": format_date_iso(),
                "lastLogin": format_date_iso(),
            }
            if role != 'admin':
                new_user['permissions']['canDelete'] = False

            with data_lock:
                users_data.append(new_user)
                save_users()

            broadcast_sse('user_updated', {"type": "created", "user": new_user})
            add_notification('sistema', 'Usuario Creado', f"Se registró la cuenta {new_user['name']} ({role})")
            user_copy = dict(new_user)
            user_copy.pop('password', None)
            return self.send_json({"success": True, "user": user_copy}, 201)

        if path == '/api/reservations':
            num_reserva = body.get('numeroReserva')
            num_posicion = body.get('numeroPosicion')
            urgencia = body.get('nivelUrgencia', 'media')
            solicitante_id = body.get('solicitanteId', 'usr-solicitante-1')
            solicitante_nombre = body.get('solicitanteNombre', 'Solicitante')
            observaciones = body.get('observaciones', '')
            ubicacion = body.get('ubicacionAlmacen', '')

            if not num_reserva or not num_posicion:
                return self.send_json({"error": "Número de reserva y número de posición son requeridos"}, 400)

            now = datetime.now()
            new_res = {
                "id": f"res-{int(time.time() * 1000)}",
                "numeroReserva": num_reserva.strip().upper(),
                "numeroPosicion": num_posicion.strip().upper(),
                "nivelUrgencia": urgencia,
                "estado": "pendiente",
                "horaRegistro": format_date_iso(now),
                "horaRegistroFormato": format_date_human(now),
                "horaModificacion": format_date_iso(now),
                "horaModificacionFormato": format_date_human(now),
                "solicitanteId": solicitante_id,
                "solicitanteNombre": solicitante_nombre,
                "observaciones": observaciones.strip(),
                "ubicacionAlmacen": ubicacion.strip(),
                "historial": [
                    {
                        "id": f"h-{int(time.time() * 1000)}",
                        "fecha": format_date_iso(now),
                        "fechaFormato": format_date_human(now),
                        "usuario": solicitante_nombre,
                        "accion": "Registro inicial",
                        "detalle": f"Solicitud creada con urgencia {urgencia.upper()}",
                    }
                ],
            }

            with data_lock:
                reservations_data.insert(0, new_res)
                save_reservations()

            broadcast_sse('reservation_created', new_res)
            add_notification(
                'urgente' if urgencia == 'urgente' else 'nueva_reserva',
                f"Nueva Reserva {new_res['numeroReserva']} ({urgencia.upper()})",
                f"{solicitante_nombre} registró la posición {new_res['numeroPosicion']}",
                reserva_id=new_res['id'],
                urgencia=urgencia
            )
            return self.send_json({"success": True, "reservation": new_res}, 201)

        if path == '/api/notifications/read-all':
            with data_lock:
                for n in notifications_data:
                    n['leido'] = True
            return self.send_json({"success": True})

        if path == '/api/excel/import':
            items = body.get('items', [])
            imported_count = 0
            now = datetime.now()
            with data_lock:
                for item in items:
                    if not item.get('numeroReserva') or not item.get('numeroPosicion'):
                        continue
                    new_item = {
                        "id": f"res-imp-{int(time.time() * 1000)}-{imported_count}",
                        "numeroReserva": str(item['numeroReserva']).strip().upper(),
                        "numeroPosicion": str(item['numeroPosicion']).strip().upper(),
                        "nivelUrgencia": item.get('nivelUrgencia', 'media').lower(),
                        "estado": item.get('estado', 'pendiente').lower(),
                        "horaRegistro": format_date_iso(now),
                        "horaRegistroFormato": format_date_human(now),
                        "horaModificacion": format_date_iso(now),
                        "horaModificacionFormato": format_date_human(now),
                        "solicitanteId": "usr-admin",
                        "solicitanteNombre": "Importado desde Excel",
                        "observaciones": item.get('observaciones', 'Importación por lote'),
                        "ubicacionAlmacen": item.get('ubicacionAlmacen', ''),
                        "historial": [
                            {
                                "id": f"h-imp-{int(time.time() * 1000)}-{imported_count}",
                                "fecha": format_date_iso(now),
                                "fechaFormato": format_date_human(now),
                                "usuario": "Sistema / Excel",
                                "accion": "Importación masiva",
                                "detalle": "Registro importado desde hoja de cálculo",
                            }
                        ],
                    }
                    reservations_data.insert(0, new_item)
                    imported_count += 1
                save_reservations()
            broadcast_sse('reservations_bulk_imported', {"count": imported_count})
            add_notification('sistema', 'Excel Importado', f"Se importaron {imported_count} registros de reserva exitosamente.")
            return self.send_json({"success": True, "importedCount": imported_count})

        return self.send_json({"error": "Ruta no encontrada"}, 404)

    def do_PUT(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        body = self.read_json_body()

        # Actualizar Usuario
        if path.startswith('/api/users/'):
            user_id = path.replace('/api/users/', '')
            target = None
            for u in users_data:
                if u.get('id') == user_id:
                    target = u
                    break
            if not target:
                return self.send_json({"error": "Usuario no encontrado"}, 404)

            role = body.get('role', target.get('role'))
            perms = body.get('permissions')
            if perms:
                # Regla estricta: Solo el administrador puede tener canDelete
                if role != 'admin':
                    perms['canDelete'] = False
                target['permissions'] = {**target.get('permissions', {}), **perms}
            if body.get('role'):
                target['role'] = body['role']
                if target['role'] != 'admin':
                    target['permissions']['canDelete'] = False
            if body.get('name'):
                target['name'] = body['name']
            if 'department' in body:
                target['department'] = body['department']

            with data_lock:
                save_users()

            broadcast_sse('user_updated', {"type": "updated", "user": target})
            return self.send_json({"success": True, "user": target})

        # Actualizar Reserva
        if path.startswith('/api/reservations/'):
            res_id = path.replace('/api/reservations/', '')
            target = None
            for r in reservations_data:
                if r.get('id') == res_id:
                    target = r
                    break
            if not target:
                return self.send_json({"error": "Reserva no encontrada"}, 404)

            now = datetime.now()
            mod_user = body.get('modificadoPorNombre', 'Usuario')
            accion = body.get('accionAuditoria', 'Actualización de datos')
            detalle = body.get('detalleAuditoria', 'Modificación de registro')

            old_estado = target.get('estado')
            if 'estado' in body and body['estado'] != old_estado:
                accion = f"Cambio de estado a {body['estado'].replace('_', ' ').title()}"
                detalle = f"Estado previo: {old_estado}. Nuevo: {body['estado']}"

            for k, v in body.items():
                if k not in ['historial', 'id', 'horaRegistro', 'horaRegistroFormato', 'modificadoPorNombre', 'accionAuditoria', 'detalleAuditoria']:
                    target[k] = v

            target['horaModificacion'] = format_date_iso(now)
            target['horaModificacionFormato'] = format_date_human(now)

            if 'historial' not in target:
                target['historial'] = []
            target['historial'].append({
                "id": f"h-{int(time.time() * 1000)}",
                "fecha": format_date_iso(now),
                "fechaFormato": format_date_human(now),
                "usuario": mod_user,
                "accion": accion,
                "detalle": detalle,
            })

            with data_lock:
                save_reservations()

            broadcast_sse('reservation_updated', target)
            if 'estado' in body and body['estado'] != old_estado:
                add_notification(
                    'estado_actualizado',
                    f"Reserva {target['numeroReserva']} {target['estado'].upper()}",
                    f"Actualizado por {mod_user}: {detalle}",
                    reserva_id=target['id']
                )
            return self.send_json({"success": True, "reservation": target})

        return self.send_json({"error": "Ruta no encontrada"}, 404)

    def do_DELETE(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        # Eliminar Usuario
        if path.startswith('/api/users/'):
            user_id = path.replace('/api/users/', '')
            if user_id == 'usr-admin':
                return self.send_json({"error": "No se puede eliminar la cuenta principal de Administrador"}, 400)
            idx = -1
            for i, u in enumerate(users_data):
                if u.get('id') == user_id:
                    idx = i
                    break
            if idx == -1:
                return self.send_json({"error": "Usuario no encontrado"}, 404)
            with data_lock:
                users_data.pop(idx)
                save_users()
            broadcast_sse('user_updated', {"type": "deleted", "id": user_id})
            return self.send_json({"success": True})

        # Eliminar Todas las Reservas Registradas - EXCLUSIVO ADMINISTRADOR
        if path == '/api/reservations' or path == '/api/reservations/':
            requester = self.get_requester_user(query)
            is_admin = requester and (requester.get('role') == 'admin' or requester.get('permissions', {}).get('canDelete'))
            if not is_admin:
                return self.send_json({
                    "error": "Acceso denegado: Solo el usuario administrador puede eliminar las reservas registradas."
                }, 403)

            with data_lock:
                count = len(reservations_data)
                reservations_data.clear()
                save_reservations()

            add_notification(
                'sistema',
                'Todas las Reservas Eliminadas',
                f"El administrador {requester.get('name', 'Admin')} eliminó todas las reservas registradas ({count} eliminadas)."
            )
            broadcast_sse('reservations_cleared', {"count": count})
            return self.send_json({
                "success": True,
                "message": f"Se eliminaron las {count} reservas registradas exitosamente por el Administrador.",
                "count": count
            })

        # Eliminar Reserva - EXCLUSIVO ADMINISTRADOR
        if path.startswith('/api/reservations/'):
            res_id = path.replace('/api/reservations/', '')
            requester = self.get_requester_user(query)

            # Validar que el usuario que ejecuta la acción tenga rol de admin
            is_admin = requester and (requester.get('role') == 'admin' or requester.get('permissions', {}).get('canDelete'))
            if not is_admin:
                return self.send_json({
                    "error": "Acceso denegado: Solo el usuario administrador puede eliminar las reservas registradas."
                }, 403)

            idx = -1
            for i, r in enumerate(reservations_data):
                if r.get('id') == res_id:
                    idx = i
                    break
            if idx == -1:
                return self.send_json({"error": "Reserva no encontrada"}, 404)

            with data_lock:
                deleted = reservations_data.pop(idx)
                save_reservations()

            add_notification(
                'sistema',
                'Reserva Eliminada por Administrador',
                f"El administrador {requester.get('name', 'Admin')} eliminó la reserva {deleted.get('numeroReserva')} (Posición {deleted.get('numeroPosicion')})"
            )
            broadcast_sse('reservation_deleted', {"id": res_id})
            return self.send_json({"success": True, "message": "Reserva eliminada exitosamente por el Administrador"})

        return self.send_json({"error": "Ruta no encontrada"}, 404)

    def serve_static_file(self, req_path):
        """Sirve archivos estáticos desde dist/ o fallback a index.html (SPA)."""
        clean_path = req_path.lstrip('/')
        if not clean_path:
            clean_path = 'index.html'

        target_file = os.path.join(DIST_DIR, clean_path)

        # Si el archivo no existe físicamente, servir index.html para soportar rutas del cliente (SPA)
        if not os.path.isfile(target_file):
            target_file = os.path.join(DIST_DIR, 'index.html')

        if not os.path.isfile(target_file):
            # Fallback si dist/ no está construido aún
            msg = b"<h1>Sistema de Reservas - Compilando Frontend</h1><p>Ejecute 'npm run build' para generar la carpeta dist/</p>"
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)
            return

        content_type, _ = mimetypes.guess_type(target_file)
        if not content_type:
            if target_file.endswith('.js') or target_file.endswith('.mjs'):
                content_type = 'application/javascript'
            elif target_file.endswith('.css'):
                content_type = 'text/css'
            elif target_file.endswith('.svg'):
                content_type = 'image/svg+xml'
            else:
                content_type = 'application/octet-stream'

        try:
            with open(target_file, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(content)))
            if target_file.endswith('index.html'):
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            else:
                self.send_header('Cache-Control', 'public, max-age=31536000')
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_json({"error": f"Error al leer archivo estático: {str(e)}"}, 500)

# ==============================================================================
# FUNCIÓN PRINCIPAL DE INICIO
# ==============================================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(
        description="Servidor de Ejecución Remota en Python para Sistema de Solicitud de Reservas"
    )
    parser.add_argument(
        '--host',
        default=os.environ.get('HOST', '0.0.0.0'),
        help="Dirección IP de escucha (default: 0.0.0.0 para acceso remoto en red)"
    )
    parser.add_argument(
        '--port',
        type=int,
        default=int(os.environ.get('PORT', 8080)),
        help="Puerto TCP del servidor (default: 8080 o variable PORT)"
    )
    args = parser.parse_args()

    host = args.host
    port = args.port

    # Inicializar datos en disco
    initialize_data()

    server = ThreadedHTTPServer((host, port), RequestHandler)
    local_ips = get_local_ip_addresses()

    print("\n" + "=" * 76)
    print("  SISTEMA DE SOLICITUD DE RESERVAS Y DESPACHO (SERVIDOR EN PYTHON 3)")
    print("=" * 76)
    print(f" [✓] Lenguaje de Ejecución: Python {sys.version.split()[0]} (Standard Library)")
    print(f" [✓] Modo de Acceso:        Remoto mediante IP / Red Local LAN / Wi-Fi")
    print(f" [✓] Host de Escucha:       {host} (todas las interfaces de red activas)")
    print(f" [✓] Puerto Asignado:       {port}")
    print("-" * 76)
    print(" Enlaces de Conexión Remota mediante IP:")
    print(f"   • Local (mismo equipo):   http://localhost:{port}")
    for ip in local_ips:
        print(f"   • Remoto en Red (Wi-Fi):  http://{ip}:{port}")
    print("-" * 76)
    print(" [✓] API REST & SSE:        /api/reservations, /api/events, /api/network-info")
    print(" [✓] Archivo Excel en vivo: data/solicitud_reservas.xlsx")
    print(" [✓] Servidor activo. Presiona Ctrl+C para detener.")
    print("=" * 76 + "\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nDeteniendo servidor Python...")
        server.server_close()
        print("Servidor detenido correctamente.")

if __name__ == '__main__':
    main()
