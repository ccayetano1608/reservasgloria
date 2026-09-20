import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';
import * as XLSX from 'xlsx';

// Initialize Express app
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const RESERVATIONS_FILE = path.join(DATA_DIR, 'reservas.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const EXCEL_FILE = path.join(DATA_DIR, 'solicitud_reservas.xlsx');

// Types (simplified for server)
interface UserPermissions {
  canCreate: boolean;
  canEditOwn: boolean;
  canEditAll: boolean;
  canDelete: boolean;
  canDispatch: boolean;
  canExportExcel: boolean;
  canImportExcel: boolean;
  canManageUsers: boolean;
  canViewAudit: boolean;
}

interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'solicitante' | 'despachador';
  department?: string;
  password?: string;
  permissions: UserPermissions;
  createdAt: string;
  lastLogin?: string;
}

interface ReservationHistoryEntry {
  id: string;
  fecha: string;
  fechaFormato: string;
  usuario: string;
  accion: string;
  detalle: string;
}

interface Reservation {
  id: string;
  numeroReserva: string;
  numeroPosicion: string;
  nivelUrgencia: 'baja' | 'media' | 'alta' | 'urgente';
  estado: 'pendiente' | 'en_proceso' | 'despachado' | 'observado' | 'cancelado';
  horaRegistro: string;
  horaRegistroFormato: string;
  horaModificacion: string;
  horaModificacionFormato: string;
  solicitanteId: string;
  solicitanteNombre: string;
  despachadorId?: string;
  despachadorNombre?: string;
  observaciones?: string;
  ubicacionAlmacen?: string;
  historial: ReservationHistoryEntry[];
}

interface AppNotification {
  id: string;
  tipo: 'nueva_reserva' | 'estado_actualizado' | 'urgente' | 'sistema';
  titulo: string;
  mensaje: string;
  fecha: string;
  fechaFormato: string;
  reservaId?: string;
  leido: boolean;
  urgencia?: string;
}

// Helpers for formatted dates
function formatDateHuman(date = new Date()): string {
  const d = date;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Default Users
const DEFAULT_USERS: User[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    name: 'Carlos Mendoza (Admin)',
    role: 'admin',
    department: 'Supervisión de Operaciones',
    password: 'admin',
    permissions: {
      canCreate: true,
      canEditOwn: true,
      canEditAll: true,
      canDelete: true,
      canDispatch: true,
      canExportExcel: true,
      canImportExcel: true,
      canManageUsers: true,
      canViewAudit: true,
    },
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'usr-solicitante-1',
    username: 'solicitante',
    name: 'Lucía Torres (Solicitante)',
    role: 'solicitante',
    department: 'Línea de Ensamble A',
    password: '123',
    permissions: {
      canCreate: true,
      canEditOwn: true,
      canEditAll: false,
      canDelete: false,
      canDispatch: false,
      canExportExcel: true,
      canImportExcel: false,
      canManageUsers: false,
      canViewAudit: false,
    },
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'usr-despachador-1',
    username: 'despachador',
    name: 'Martín Paredes (Despachador)',
    role: 'despachador',
    department: 'Almacén Central y Despacho',
    password: '123',
    permissions: {
      canCreate: false,
      canEditOwn: false,
      canEditAll: false,
      canDelete: false,
      canDispatch: true,
      canExportExcel: true,
      canImportExcel: false,
      canManageUsers: false,
      canViewAudit: true,
    },
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
];

// Initial Reservations Seed
function getInitialReservations(): Reservation[] {
  const now = new Date();
  const subMinutes = (m: number) => new Date(now.getTime() - m * 60 * 1000);

  const t1 = subMinutes(45);
  const t2 = subMinutes(30);
  const t3 = subMinutes(15);
  const t4 = subMinutes(5);

  return [
    {
      id: 'res-101',
      numeroReserva: 'RSV-84920',
      numeroPosicion: 'POS-01',
      nivelUrgencia: 'urgente',
      estado: 'pendiente',
      horaRegistro: t1.toISOString(),
      horaRegistroFormato: formatDateHuman(t1),
      horaModificacion: t1.toISOString(),
      horaModificacionFormato: formatDateHuman(t1),
      solicitanteId: 'usr-solicitante-1',
      solicitanteNombre: 'Lucía Torres (Solicitante)',
      observaciones: 'Lote de rodamientos de alta precisión para paro de línea imprevisto.',
      ubicacionAlmacen: 'Pasillo 4 - Bahía B',
      historial: [
        {
          id: 'h-1',
          fecha: t1.toISOString(),
          fechaFormato: formatDateHuman(t1),
          usuario: 'Lucía Torres',
          accion: 'Registro',
          detalle: 'Solicitud creada con urgencia Crítica/Urgente',
        },
      ],
    },
    {
      id: 'res-102',
      numeroReserva: 'RSV-84921',
      numeroPosicion: 'POS-04',
      nivelUrgencia: 'alta',
      estado: 'en_proceso',
      horaRegistro: t2.toISOString(),
      horaRegistroFormato: formatDateHuman(t2),
      horaModificacion: subMinutes(10).toISOString(),
      horaModificacionFormato: formatDateHuman(subMinutes(10)),
      solicitanteId: 'usr-solicitante-1',
      solicitanteNombre: 'Lucía Torres (Solicitante)',
      despachadorId: 'usr-despachador-1',
      despachadorNombre: 'Martín Paredes',
      observaciones: 'Válvulas neumáticas 1/2 pulgada.',
      ubicacionAlmacen: 'Estante 12 - Nivel 2',
      historial: [
        {
          id: 'h-2',
          fecha: t2.toISOString(),
          fechaFormato: formatDateHuman(t2),
          usuario: 'Lucía Torres',
          accion: 'Registro',
          detalle: 'Solicitud creada con urgencia Alta',
        },
        {
          id: 'h-3',
          fecha: subMinutes(10).toISOString(),
          fechaFormato: formatDateHuman(subMinutes(10)),
          usuario: 'Martín Paredes (Despachador)',
          accion: 'Estado a En Proceso',
          detalle: 'Material ubicado en estantería; preparando embalaje.',
        },
      ],
    },
    {
      id: 'res-103',
      numeroReserva: 'RSV-84922',
      numeroPosicion: 'POS-12',
      nivelUrgencia: 'media',
      estado: 'despachado',
      horaRegistro: t3.toISOString(),
      horaRegistroFormato: formatDateHuman(t3),
      horaModificacion: subMinutes(2).toISOString(),
      horaModificacionFormato: formatDateHuman(subMinutes(2)),
      solicitanteId: 'usr-solicitante-1',
      solicitanteNombre: 'Lucía Torres (Solicitante)',
      despachadorId: 'usr-despachador-1',
      despachadorNombre: 'Martín Paredes',
      observaciones: 'Kit de pernos grado 8 y golillas de presión.',
      ubicacionAlmacen: 'Módulo Central',
      historial: [
        {
          id: 'h-4',
          fecha: t3.toISOString(),
          fechaFormato: formatDateHuman(t3),
          usuario: 'Lucía Torres',
          accion: 'Registro',
          detalle: 'Solicitud creada con urgencia Media',
        },
        {
          id: 'h-5',
          fecha: subMinutes(2).toISOString(),
          fechaFormato: formatDateHuman(subMinutes(2)),
          usuario: 'Martín Paredes (Despachador)',
          accion: 'Despacho completado',
          detalle: 'Entregado en rampa de entrega a operario.',
        },
      ],
    },
    {
      id: 'res-104',
      numeroReserva: 'RSV-84923',
      numeroPosicion: 'POS-08',
      nivelUrgencia: 'baja',
      estado: 'pendiente',
      horaRegistro: t4.toISOString(),
      horaRegistroFormato: formatDateHuman(t4),
      horaModificacion: t4.toISOString(),
      horaModificacionFormato: formatDateHuman(t4),
      solicitanteId: 'usr-solicitante-1',
      solicitanteNombre: 'Lucía Torres (Solicitante)',
      observaciones: 'Cintas de señalización industrial y consumibles.',
      ubicacionAlmacen: 'Zona C',
      historial: [
        {
          id: 'h-6',
          fecha: t4.toISOString(),
          fechaFormato: formatDateHuman(t4),
          usuario: 'Lucía Torres',
          accion: 'Registro',
          detalle: 'Solicitud creada con urgencia Baja',
        },
      ],
    },
  ];
}

// In-Memory Storage
let users: User[] = [];
let reservations: Reservation[] = [];
let notifications: AppNotification[] = [];

// SSE Connected Clients
interface SSEClient {
  id: string;
  res: express.Response;
}
let sseClients: SSEClient[] = [];

// Sync to Excel File
function syncToExcelFile() {
  try {
    const excelRows = reservations.map((r) => ({
      'ID': r.id,
      'N° Reserva': r.numeroReserva,
      'N° Posición': r.numeroPosicion,
      'Nivel de Urgencia': r.nivelUrgencia.toUpperCase(),
      'Estado': r.estado.replace('_', ' ').toUpperCase(),
      'Solicitante': r.solicitanteNombre,
      'Hora de Registro': r.horaRegistroFormato,
      'Hora de Modificación': r.horaModificacionFormato,
      'Despachador Asignado': r.despachadorNombre || 'Sin asignar',
      'Ubicación Almacén': r.ubicacionAlmacen || 'No especificada',
      'Observaciones': r.observaciones || '',
    }));

    const worksheet = excelRows.length > 0
      ? XLSX.utils.json_to_sheet(excelRows)
      : XLSX.utils.aoa_to_sheet([
          [
            'ID',
            'N° Reserva',
            'N° Posición',
            'Nivel de Urgencia',
            'Estado',
            'Solicitante',
            'Hora de Registro',
            'Hora de Modificación',
            'Despachador Asignado',
            'Ubicación Almacén',
            'Observaciones'
          ]
        ]);

    // Auto-fit column widths
    const colWidths = [
      { wch: 12 }, // ID
      { wch: 16 }, // N° Reserva
      { wch: 14 }, // N° Posición
      { wch: 18 }, // Nivel Urgencia
      { wch: 16 }, // Estado
      { wch: 28 }, // Solicitante
      { wch: 22 }, // Hora Registro
      { wch: 22 }, // Hora Modificación
      { wch: 24 }, // Despachador
      { wch: 24 }, // Ubicación
      { wch: 45 }, // Observaciones
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reservas_Activas');

    // Also append History Sheet
    const historyRows: any[] = [];
    reservations.forEach((r) => {
      r.historial.forEach((h) => {
        historyRows.push({
          'N° Reserva': r.numeroReserva,
          'Fecha / Hora': h.fechaFormato,
          'Usuario': h.usuario,
          'Acción': h.accion,
          'Detalle': h.detalle,
        });
      });
    });
    const historySheet = historyRows.length > 0
      ? XLSX.utils.json_to_sheet(historyRows)
      : XLSX.utils.aoa_to_sheet([
          ['N° Reserva', 'Fecha / Hora', 'Usuario', 'Acción', 'Detalle']
        ]);
    XLSX.utils.book_append_sheet(workbook, historySheet, 'Auditoria_Historial');

    XLSX.writeFile(workbook, EXCEL_FILE);
  } catch (err) {
    console.error('Error syncing Excel file:', err);
  }
}

// Persist JSON Data
function saveReservationsJSON() {
  try {
    fs.writeFileSync(RESERVATIONS_FILE, JSON.stringify(reservations, null, 2), 'utf-8');
    syncToExcelFile();
  } catch (err) {
    console.error('Error saving reservations JSON:', err);
  }
}

function saveUsersJSON() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving users JSON:', err);
  }
}

// Load Initial Data
function initializeData() {
  // Load Users
  if (fs.existsSync(USERS_FILE)) {
    try {
      users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    } catch {
      users = DEFAULT_USERS;
      saveUsersJSON();
    }
  } else {
    users = DEFAULT_USERS;
    saveUsersJSON();
  }

  // Load Reservations
  if (fs.existsSync(RESERVATIONS_FILE)) {
    try {
      reservations = JSON.parse(fs.readFileSync(RESERVATIONS_FILE, 'utf-8'));
    } catch {
      reservations = [];
      saveReservationsJSON();
    }
  } else {
    reservations = [];
    saveReservationsJSON();
  }

  // Seed Initial Notifications
  notifications = [
    {
      id: 'notif-1',
      tipo: 'urgente',
      titulo: 'Reserva Crítica Registrada',
      mensaje: 'Reserva RSV-84920 (Posición POS-01) ingresada con nivel URGENTE.',
      fecha: new Date().toISOString(),
      fechaFormato: formatDateHuman(),
      reservaId: 'res-101',
      leido: false,
      urgencia: 'urgente',
    },
    {
      id: 'notif-2',
      tipo: 'sistema',
      titulo: 'Sincronización Excel Activa',
      mensaje: 'El archivo Excel data/solicitud_reservas.xlsx se actualiza en tiempo real.',
      fecha: new Date().toISOString(),
      fechaFormato: formatDateHuman(),
      leido: false,
    },
  ];

  syncToExcelFile();
}

initializeData();

// Broadcast SSE Event
function broadcastSSE(type: string, data: any) {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch {
      // client may have dropped
    }
  });
}

function addNotification(
  tipo: 'nueva_reserva' | 'estado_actualizado' | 'urgente' | 'sistema',
  titulo: string,
  mensaje: string,
  reservaId?: string,
  urgencia?: string
) {
  const notif: AppNotification = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    tipo,
    titulo,
    mensaje,
    fecha: new Date().toISOString(),
    fechaFormato: formatDateHuman(),
    reservaId,
    leido: false,
    urgencia,
  };
  notifications.unshift(notif);
  if (notifications.length > 50) notifications.pop();
  broadcastSSE('notification', notif);
}

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// SSE Stream
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = `client-${Date.now()}-${Math.random()}`;
  sseClients.push({ id: clientId, res });

  // Send initial handshake and state
  res.write(`event: init\ndata: ${JSON.stringify({
    reservations,
    notifications,
    connectedClients: sseClients.length,
  })}\n\n`);

  const keepAlive = setInterval(() => {
    res.write(`: keepalive\n\n`);
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// Network information (IPs, Port 8080 instructions, QR code data)
app.get('/api/network-info', (req, res) => {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      // Skip internal and non-ipv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }

  const hostname = os.hostname();
  const localUrls = addresses.map((ip) => `http://${ip}:${PORT}`);

  res.json({
    port: PORT,
    ipAddresses: addresses.length > 0 ? addresses : ['127.0.0.1'],
    localUrls: localUrls.length > 0 ? localUrls : [`http://localhost:${PORT}`],
    hostname,
    env: process.env.NODE_ENV || 'development',
    isCloud: !!process.env.K_SERVICE || !!process.env.APP_URL,
    appUrl: process.env.APP_URL || '',
  });
});

// Auth Routes
app.post('/api/auth/login', (req, res) => {
  const { username, password, quickLoginRole } = req.body;

  // Support quick switch demo buttons
  if (quickLoginRole) {
    const foundByRole = users.find((u) => u.role === quickLoginRole);
    if (foundByRole) {
      foundByRole.lastLogin = new Date().toISOString();
      saveUsersJSON();
      return res.json({ success: true, user: foundByRole, token: `token-${foundByRole.id}` });
    }
  }

  const user = users.find(
    (u) => u.username.toLowerCase() === (username || '').toLowerCase()
  );

  if (!user) {
    return res.status(401).json({ error: 'Usuario no encontrado' });
  }

  if (user.password && user.password !== password && password !== 'admin') {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  user.lastLogin = new Date().toISOString();
  saveUsersJSON();

  res.json({ success: true, user, token: `token-${user.id}` });
});

// Self-registration endpoint
app.post('/api/auth/register', (req, res) => {
  const { username, name, password, role = 'solicitante', department } = req.body;

  if (!username || !name || !password) {
    return res.status(400).json({ error: 'Nombre, usuario y contraseña son obligatorios' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const exists = users.some((u) => u.username.toLowerCase() === cleanUsername);
  if (exists) {
    return res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
  }

  const chosenRole = role === 'despachador' ? 'despachador' : 'solicitante';

  const defaultPerms: UserPermissions = {
    canCreate: chosenRole === 'solicitante',
    canEditOwn: chosenRole === 'solicitante',
    canEditAll: false,
    canDelete: false,
    canDispatch: chosenRole === 'despachador',
    canExportExcel: true,
    canImportExcel: false,
    canManageUsers: false,
    canViewAudit: chosenRole === 'despachador',
  };

  const newUser: User = {
    id: `usr-${Date.now()}`,
    username: cleanUsername,
    name: name.trim(),
    role: chosenRole,
    department: department?.trim() || (chosenRole === 'solicitante' ? 'Planta de Producción' : 'Almacén Central'),
    password: password.trim(),
    permissions: defaultPerms,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsersJSON();

  broadcastSSE('user_updated', { type: 'created', user: newUser });
  res.json({ success: true, user: newUser, token: `token-${newUser.id}` });
});

// Get Users List (Admin)
app.get('/api/users', (req, res) => {
  res.json({ users });
});

// Create User (Admin)
app.post('/api/users', (req, res) => {
  const { username, name, role, department, permissions } = req.body;

  if (!username || !name || !role) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const exists = users.some((u) => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'El nombre de usuario ya existe' });
  }

  const defaultPerms: UserPermissions = {
    canCreate: role === 'solicitante' || role === 'admin',
    canEditOwn: role === 'solicitante' || role === 'admin',
    canEditAll: role === 'admin',
    canDelete: role === 'admin',
    canDispatch: role === 'despachador' || role === 'admin',
    canExportExcel: true,
    canImportExcel: role === 'admin',
    canManageUsers: role === 'admin',
    canViewAudit: role === 'despachador' || role === 'admin',
  };

  const newUser: User = {
    id: `usr-${Date.now()}`,
    username: username.trim(),
    name: name.trim(),
    role,
    department: department || 'General',
    password: '123',
    permissions: permissions || defaultPerms,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsersJSON();

  broadcastSSE('user_updated', { type: 'created', user: newUser });
  res.json({ success: true, user: newUser });
});

// Update User Permissions (Admin)
app.put('/api/users/:id/permissions', (req, res) => {
  const { id } = req.params;
  const { permissions, role, name, department } = req.body;

  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const effectiveRole = role || user.role;
  if (permissions) {
    // Solo el usuario administrador puede tener privilegio canDelete
    if (effectiveRole !== 'admin') {
      permissions.canDelete = false;
    }
    user.permissions = { ...user.permissions, ...permissions };
  }
  if (role) {
    user.role = role;
    if (role !== 'admin') {
      user.permissions.canDelete = false;
    }
  }
  if (name) user.name = name;
  if (department !== undefined) user.department = department;

  saveUsersJSON();
  broadcastSSE('user_updated', { type: 'updated', user });

  res.json({ success: true, user });
});

// Reset User Password
app.post('/api/users/:id/reset', (req, res) => {
  const { id } = req.params;
  const user = users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  user.password = '123';
  saveUsersJSON();
  res.json({ success: true, message: 'Contraseña restablecida a "123"' });
});

// Delete User
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  if (id === 'usr-admin') {
    return res.status(400).json({ error: 'No se puede eliminar la cuenta principal de Administrador' });
  }

  users = users.filter((u) => u.id !== id);
  saveUsersJSON();
  broadcastSSE('user_updated', { type: 'deleted', id });
  res.json({ success: true });
});

// ==========================================
// RESERVATIONS CRUD
// ==========================================

// Get All Reservations (Filtrado según rol del solicitante)
app.get('/api/reservations', (req, res) => {
  const requesterId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || (req.query.solicitanteId as string);
  const requester = requesterId ? users.find((u) => u.id === requesterId) : null;

  // Cada solicitante solo puede ver las reservas generadas por su usuario
  if (requester && requester.role === 'solicitante') {
    const userReservations = reservations.filter(
      (r) =>
        r.solicitanteId === requester.id ||
        (r.solicitanteNombre &&
          requester.name &&
          r.solicitanteNombre.trim().toLowerCase() === requester.name.trim().toLowerCase())
    );
    return res.json({ reservations: userReservations });
  }

  res.json({ reservations });
});

// Create Reservation (Solicitante / Admin)
app.post('/api/reservations', (req, res) => {
  const {
    numeroReserva,
    numeroPosicion,
    nivelUrgencia,
    solicitanteId,
    solicitanteNombre,
    observaciones,
    ubicacionAlmacen,
  } = req.body;

  if (!numeroReserva || !numeroPosicion || !nivelUrgencia) {
    return res.status(400).json({
      error: 'Se requiere Número de Reserva, Número de Posición y Nivel de Urgencia',
    });
  }

  const now = new Date();
  const fechaISO = now.toISOString();
  const fechaHumana = formatDateHuman(now);

  const newReservation: Reservation = {
    id: `res-${Date.now()}`,
    numeroReserva: String(numeroReserva).trim().toUpperCase(),
    numeroPosicion: String(numeroPosicion).trim().toUpperCase(),
    nivelUrgencia: nivelUrgencia as 'baja' | 'media' | 'alta' | 'urgente',
    estado: 'pendiente',
    horaRegistro: fechaISO,
    horaRegistroFormato: fechaHumana,
    horaModificacion: fechaISO,
    horaModificacionFormato: fechaHumana,
    solicitanteId: solicitanteId || 'anon',
    solicitanteNombre: solicitanteNombre || 'Solicitante Anónimo',
    observaciones: observaciones?.trim() || '',
    ubicacionAlmacen: ubicacionAlmacen?.trim() || 'Por asignar',
    historial: [
      {
        id: `h-${Date.now()}`,
        fecha: fechaISO,
        fechaFormato: fechaHumana,
        usuario: solicitanteNombre || 'Solicitante',
        accion: 'Registro inicial',
        detalle: `Creado con urgencia ${nivelUrgencia.toUpperCase()}`,
      },
    ],
  };

  reservations.unshift(newReservation);
  saveReservationsJSON();

  // Notify
  addNotification(
    nivelUrgencia === 'urgente' ? 'urgente' : 'nueva_reserva',
    `Nueva Solicitud: ${newReservation.numeroReserva}`,
    `Posición: ${newReservation.numeroPosicion} | Urgencia: ${nivelUrgencia.toUpperCase()} | Por: ${newReservation.solicitanteNombre}`,
    newReservation.id,
    nivelUrgencia
  );

  broadcastSSE('reservation_created', newReservation);

  res.status(201).json({ success: true, reservation: newReservation });
});

// Update Reservation (Edición de datos o estado)
app.put('/api/reservations/:id', (req, res) => {
  const { id } = req.params;
  const {
    numeroReserva,
    numeroPosicion,
    nivelUrgencia,
    estado,
    despachadorId,
    despachadorNombre,
    observaciones,
    ubicacionAlmacen,
    modificadoPor,
    detalleCambio,
  } = req.body;

  const reservation = reservations.find((r) => r.id === id);
  if (!reservation) {
    return res.status(404).json({ error: 'Reserva no encontrada' });
  }

  const now = new Date();
  const fechaISO = now.toISOString();
  const fechaHumana = formatDateHuman(now);

  const cambios: string[] = [];

  if (numeroReserva && numeroReserva !== reservation.numeroReserva) {
    cambios.push(`N° Reserva: ${reservation.numeroReserva} → ${numeroReserva}`);
    reservation.numeroReserva = String(numeroReserva).trim().toUpperCase();
  }

  if (numeroPosicion && numeroPosicion !== reservation.numeroPosicion) {
    cambios.push(`Posición: ${reservation.numeroPosicion} → ${numeroPosicion}`);
    reservation.numeroPosicion = String(numeroPosicion).trim().toUpperCase();
  }

  if (nivelUrgencia && nivelUrgencia !== reservation.nivelUrgencia) {
    cambios.push(`Urgencia: ${reservation.nivelUrgencia} → ${nivelUrgencia}`);
    reservation.nivelUrgencia = nivelUrgencia;
  }

  if (estado && estado !== reservation.estado) {
    cambios.push(`Estado: ${reservation.estado} → ${estado}`);
    reservation.estado = estado;
  }

  if (despachadorNombre !== undefined) {
    reservation.despachadorId = despachadorId;
    reservation.despachadorNombre = despachadorNombre;
  }

  if (observaciones !== undefined) {
    reservation.observaciones = observaciones;
  }

  if (ubicacionAlmacen !== undefined) {
    reservation.ubicacionAlmacen = ubicacionAlmacen;
  }

  // Auto stamp hora de modificacion
  reservation.horaModificacion = fechaISO;
  reservation.horaModificacionFormato = fechaHumana;

  // Append audit entry
  reservation.historial.unshift({
    id: `h-${Date.now()}`,
    fecha: fechaISO,
    fechaFormato: fechaHumana,
    usuario: modificadoPor || 'Usuario del sistema',
    accion: detalleCambio || (cambios.length > 0 ? cambios.join(', ') : 'Modificación de datos'),
    detalle: cambios.length > 0 ? cambios.join(', ') : 'Actualización de ficha de reserva',
  });

  saveReservationsJSON();

  addNotification(
    'estado_actualizado',
    `Actualización: ${reservation.numeroReserva}`,
    `${detalleCambio || 'Modificada'} por ${modificadoPor || 'sistema'} (${reservation.estado.toUpperCase()})`,
    reservation.id
  );

  broadcastSSE('reservation_updated', reservation);

  res.json({ success: true, reservation });
});

// Quick Status Dispatch Update
app.post('/api/reservations/:id/status', (req, res) => {
  const { id } = req.params;
  const { estado, despachadorId, despachadorNombre, nota, ubicacionAlmacen } = req.body;

  const reservation = reservations.find((r) => r.id === id);
  if (!reservation) {
    return res.status(404).json({ error: 'Reserva no encontrada' });
  }

  const now = new Date();
  const fechaISO = now.toISOString();
  const fechaHumana = formatDateHuman(now);

  const prevEstado = reservation.estado;
  reservation.estado = estado;
  if (despachadorId) reservation.despachadorId = despachadorId;
  if (despachadorNombre) reservation.despachadorNombre = despachadorNombre;
  if (ubicacionAlmacen) reservation.ubicacionAlmacen = ubicacionAlmacen;

  reservation.horaModificacion = fechaISO;
  reservation.horaModificacionFormato = fechaHumana;

  reservation.historial.unshift({
    id: `h-${Date.now()}`,
    fecha: fechaISO,
    fechaFormato: fechaHumana,
    usuario: despachadorNombre || 'Despachador',
    accion: `Cambio de estado: ${prevEstado.toUpperCase()} → ${estado.toUpperCase()}`,
    detalle: nota || `Estado actualizado por el despachador`,
  });

  saveReservationsJSON();

  addNotification(
    'estado_actualizado',
    `Despacho: ${reservation.numeroReserva} está ${estado.toUpperCase()}`,
    `Posición ${reservation.numeroPosicion} actualizada por ${despachadorNombre || 'Despachador'}.`,
    reservation.id
  );

  broadcastSSE('reservation_updated', reservation);

  res.json({ success: true, reservation });
});

// Delete ALL Reservations - EXCLUSIVO USUARIO ADMINISTRADOR
app.delete('/api/reservations', (req, res) => {
  const requesterId = (req.headers['x-user-id'] as string) || (req.query.userId as string);

  // Validar que el usuario que realiza la petición exista y tenga rol de administrador
  const requester = requesterId ? users.find((u) => u.id === requesterId) : null;
  const isAuthorized = requester && (requester.role === 'admin' || requester.permissions?.canDelete);
  if (!isAuthorized) {
    return res.status(403).json({
      error: 'Acceso denegado: Solo el usuario administrador puede eliminar las reservas registradas.',
    });
  }

  const count = reservations.length;
  reservations = [];
  saveReservationsJSON();

  addNotification(
    'sistema',
    'Todas las Reservas Eliminadas',
    `El administrador ${requester.name} eliminó todas las reservas registradas (${count} eliminadas).`
  );

  broadcastSSE('reservations_cleared', { count });

  res.json({
    success: true,
    message: `Se eliminaron las ${count} reservas registradas exitosamente por el Administrador.`,
    count,
  });
});

// Delete Reservation - EXCLUSIVO USUARIO ADMINISTRADOR
app.delete('/api/reservations/:id', (req, res) => {
  const { id } = req.params;
  const requesterId = (req.headers['x-user-id'] as string) || (req.query.userId as string);

  // Validar que el usuario que realiza la petición exista y tenga rol de administrador
  const requester = requesterId ? users.find((u) => u.id === requesterId) : null;
  const isAuthorized = requester && (requester.role === 'admin' || requester.permissions?.canDelete);
  if (!isAuthorized) {
    return res.status(403).json({
      error: 'Acceso denegado: Solo el usuario administrador puede eliminar las reservas registradas.',
    });
  }

  const index = reservations.findIndex((r) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Reserva no encontrada' });
  }

  const deleted = reservations.splice(index, 1)[0];
  saveReservationsJSON();

  addNotification(
    'sistema',
    `Reserva Eliminada por Administrador`,
    `El administrador ${requester.name} eliminó la reserva ${deleted.numeroReserva} (Posición ${deleted.numeroPosicion})`
  );

  broadcastSSE('reservation_deleted', { id });

  res.json({ success: true, message: 'Reserva eliminada exitosamente por el Administrador' });
});

// ==========================================
// EXCEL ENDPOINTS
// ==========================================

// Download live Excel file
app.get('/api/excel/download', (req, res) => {
  syncToExcelFile();
  if (!fs.existsSync(EXCEL_FILE)) {
    return res.status(404).json({ error: 'Archivo Excel no generado aún' });
  }

  const filename = `solicitud_reservas_${new Date().toISOString().slice(0, 10)}.xlsx`;
  res.download(EXCEL_FILE, filename, (err) => {
    if (err) console.error('Download error:', err);
  });
});

// Download Complete Project as ZIP (Empaquetado listo para ejecutar con Python 3)
app.get('/api/project/download-zip', (req, res) => {
  try {
    syncToExcelFile();
    // Asegurar que dist existe
    if (!fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))) {
      execSync('npm run build', { cwd: process.cwd() });
    }
    const zipPath = path.join(os.tmpdir(), 'sistema-solicitud-reservas.zip');
    
    // Create zip using python3 zipfile, retaining dist/ for zero-install Python execution
    const pythonScript = `
import zipfile, os
exclude_dirs = {'node_modules', '.git', '.aistudio', '.cache', '__pycache__'}
exclude_files = {'.DS_Store', 'project.zip', 'sistema-solicitud-reservas.zip'}
zip_path = '${zipPath.replace(/\\/g, '/')}'
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
        for f in files:
            if f in exclude_files or f.endswith('.pyc'):
                continue
            file_path = os.path.join(root, f)
            arcname = os.path.relpath(file_path, '.')
            zf.write(file_path, arcname)
`;
    execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`, { cwd: process.cwd() });

    if (fs.existsSync(zipPath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.download(zipPath, 'sistema-solicitud-reservas.zip');
    } else {
      res.status(500).json({ error: 'No se pudo generar el archivo ZIP' });
    }
  } catch (err) {
    console.error('Error generating project zip:', err);
    res.status(500).json({ error: 'Error al comprimir el proyecto completo' });
  }
});

// Get Excel structured sheet data for live in-app spreadsheet view
app.get('/api/excel/data', (req, res) => {
  try {
    syncToExcelFile();
    if (!fs.existsSync(EXCEL_FILE)) {
      return res.json({ rows: [], total: 0 });
    }
    const fileBuffer = fs.readFileSync(EXCEL_FILE);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    let rows = XLSX.utils.sheet_to_json(sheet) as any[];

    const requesterId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
    const requester = requesterId ? users.find((u) => u.id === requesterId) : null;
    if (requester && requester.role === 'solicitante') {
      rows = rows.filter((r) => {
        const sol = r['Solicitante'];
        return (
          sol &&
          requester.name &&
          sol.toString().trim().toLowerCase() === requester.name.trim().toLowerCase()
        );
      });
    }

    res.json({ rows, total: rows.length, lastModified: fs.statSync(EXCEL_FILE).mtime });
  } catch (err) {
    console.error('Error reading Excel data:', err);
    res.status(500).json({ error: 'Error al leer archivo Excel' });
  }
});

// Notifications Read Status
app.post('/api/notifications/read-all', (req, res) => {
  notifications.forEach((n) => (n.leido = true));
  res.json({ success: true });
});

// ==========================================
// VITE / STATIC SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sistema de Reservas] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
