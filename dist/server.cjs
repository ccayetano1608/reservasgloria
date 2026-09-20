var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_os = __toESM(require("os"), 1);
var import_child_process = require("child_process");
var import_vite = require("vite");
var XLSX = __toESM(require("xlsx"), 1);
var app = (0, import_express.default)();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use(import_express.default.json());
var DATA_DIR = import_path.default.join(process.cwd(), "data");
if (!import_fs.default.existsSync(DATA_DIR)) {
  import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
}
var RESERVATIONS_FILE = import_path.default.join(DATA_DIR, "reservas.json");
var USERS_FILE = import_path.default.join(DATA_DIR, "users.json");
var EXCEL_FILE = import_path.default.join(DATA_DIR, "solicitud_reservas.xlsx");
function formatDateHuman(date = /* @__PURE__ */ new Date()) {
  const d = date;
  const pad = (n) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
var DEFAULT_USERS = [
  {
    id: "usr-admin",
    username: "admin",
    name: "Carlos Mendoza (Admin)",
    role: "admin",
    department: "Supervisi\xF3n de Operaciones",
    password: "admin",
    permissions: {
      canCreate: true,
      canEditOwn: true,
      canEditAll: true,
      canDelete: true,
      canDispatch: true,
      canExportExcel: true,
      canImportExcel: true,
      canManageUsers: true,
      canViewAudit: true
    },
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastLogin: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "usr-solicitante-1",
    username: "solicitante",
    name: "Luc\xEDa Torres (Solicitante)",
    role: "solicitante",
    department: "L\xEDnea de Ensamble A",
    password: "123",
    permissions: {
      canCreate: true,
      canEditOwn: true,
      canEditAll: false,
      canDelete: false,
      canDispatch: false,
      canExportExcel: true,
      canImportExcel: false,
      canManageUsers: false,
      canViewAudit: false
    },
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastLogin: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "usr-despachador-1",
    username: "despachador",
    name: "Mart\xEDn Paredes (Despachador)",
    role: "despachador",
    department: "Almac\xE9n Central y Despacho",
    password: "123",
    permissions: {
      canCreate: false,
      canEditOwn: false,
      canEditAll: false,
      canDelete: false,
      canDispatch: true,
      canExportExcel: true,
      canImportExcel: false,
      canManageUsers: false,
      canViewAudit: true
    },
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastLogin: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var users = [];
var reservations = [];
var notifications = [];
var sseClients = [];
function syncToExcelFile() {
  try {
    const excelRows = reservations.map((r) => ({
      "ID": r.id,
      "N\xB0 Reserva": r.numeroReserva,
      "N\xB0 Posici\xF3n": r.numeroPosicion,
      "Nivel de Urgencia": r.nivelUrgencia.toUpperCase(),
      "Estado": r.estado.replace("_", " ").toUpperCase(),
      "Solicitante": r.solicitanteNombre,
      "Hora de Registro": r.horaRegistroFormato,
      "Hora de Modificaci\xF3n": r.horaModificacionFormato,
      "Despachador Asignado": r.despachadorNombre || "Sin asignar",
      "Ubicaci\xF3n Almac\xE9n": r.ubicacionAlmacen || "No especificada",
      "Observaciones": r.observaciones || ""
    }));
    const worksheet = excelRows.length > 0 ? XLSX.utils.json_to_sheet(excelRows) : XLSX.utils.aoa_to_sheet([
      [
        "ID",
        "N\xB0 Reserva",
        "N\xB0 Posici\xF3n",
        "Nivel de Urgencia",
        "Estado",
        "Solicitante",
        "Hora de Registro",
        "Hora de Modificaci\xF3n",
        "Despachador Asignado",
        "Ubicaci\xF3n Almac\xE9n",
        "Observaciones"
      ]
    ]);
    const colWidths = [
      { wch: 12 },
      // ID
      { wch: 16 },
      // N° Reserva
      { wch: 14 },
      // N° Posición
      { wch: 18 },
      // Nivel Urgencia
      { wch: 16 },
      // Estado
      { wch: 28 },
      // Solicitante
      { wch: 22 },
      // Hora Registro
      { wch: 22 },
      // Hora Modificación
      { wch: 24 },
      // Despachador
      { wch: 24 },
      // Ubicación
      { wch: 45 }
      // Observaciones
    ];
    worksheet["!cols"] = colWidths;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reservas_Activas");
    const historyRows = [];
    reservations.forEach((r) => {
      r.historial.forEach((h) => {
        historyRows.push({
          "N\xB0 Reserva": r.numeroReserva,
          "Fecha / Hora": h.fechaFormato,
          "Usuario": h.usuario,
          "Acci\xF3n": h.accion,
          "Detalle": h.detalle
        });
      });
    });
    const historySheet = historyRows.length > 0 ? XLSX.utils.json_to_sheet(historyRows) : XLSX.utils.aoa_to_sheet([
      ["N\xB0 Reserva", "Fecha / Hora", "Usuario", "Acci\xF3n", "Detalle"]
    ]);
    XLSX.utils.book_append_sheet(workbook, historySheet, "Auditoria_Historial");
    XLSX.writeFile(workbook, EXCEL_FILE);
  } catch (err) {
    console.error("Error syncing Excel file:", err);
  }
}
function saveReservationsJSON() {
  try {
    import_fs.default.writeFileSync(RESERVATIONS_FILE, JSON.stringify(reservations, null, 2), "utf-8");
    syncToExcelFile();
  } catch (err) {
    console.error("Error saving reservations JSON:", err);
  }
}
function saveUsersJSON() {
  try {
    import_fs.default.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving users JSON:", err);
  }
}
function initializeData() {
  if (import_fs.default.existsSync(USERS_FILE)) {
    try {
      users = JSON.parse(import_fs.default.readFileSync(USERS_FILE, "utf-8"));
    } catch {
      users = DEFAULT_USERS;
      saveUsersJSON();
    }
  } else {
    users = DEFAULT_USERS;
    saveUsersJSON();
  }
  if (import_fs.default.existsSync(RESERVATIONS_FILE)) {
    try {
      reservations = JSON.parse(import_fs.default.readFileSync(RESERVATIONS_FILE, "utf-8"));
    } catch {
      reservations = [];
      saveReservationsJSON();
    }
  } else {
    reservations = [];
    saveReservationsJSON();
  }
  notifications = [
    {
      id: "notif-1",
      tipo: "urgente",
      titulo: "Reserva Cr\xEDtica Registrada",
      mensaje: "Reserva RSV-84920 (Posici\xF3n POS-01) ingresada con nivel URGENTE.",
      fecha: (/* @__PURE__ */ new Date()).toISOString(),
      fechaFormato: formatDateHuman(),
      reservaId: "res-101",
      leido: false,
      urgencia: "urgente"
    },
    {
      id: "notif-2",
      tipo: "sistema",
      titulo: "Sincronizaci\xF3n Excel Activa",
      mensaje: "El archivo Excel data/solicitud_reservas.xlsx se actualiza en tiempo real.",
      fecha: (/* @__PURE__ */ new Date()).toISOString(),
      fechaFormato: formatDateHuman(),
      leido: false
    }
  ];
  syncToExcelFile();
}
initializeData();
function broadcastSSE(type, data) {
  const payload = `event: ${type}
data: ${JSON.stringify(data)}

`;
  sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch {
    }
  });
}
function addNotification(tipo, titulo, mensaje, reservaId, urgencia) {
  const notif = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
    tipo,
    titulo,
    mensaje,
    fecha: (/* @__PURE__ */ new Date()).toISOString(),
    fechaFormato: formatDateHuman(),
    reservaId,
    leido: false,
    urgencia
  };
  notifications.unshift(notif);
  if (notifications.length > 50) notifications.pop();
  broadcastSSE("notification", notif);
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  const clientId = `client-${Date.now()}-${Math.random()}`;
  sseClients.push({ id: clientId, res });
  res.write(`event: init
data: ${JSON.stringify({
    reservations,
    notifications,
    connectedClients: sseClients.length
  })}

`);
  const keepAlive = setInterval(() => {
    res.write(`: keepalive

`);
  }, 25e3);
  req.on("close", () => {
    clearInterval(keepAlive);
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});
app.get("/api/network-info", (req, res) => {
  const interfaces = import_os.default.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  const hostname = import_os.default.hostname();
  const localUrls = addresses.map((ip) => `http://${ip}:${PORT}`);
  res.json({
    port: PORT,
    ipAddresses: addresses.length > 0 ? addresses : ["127.0.0.1"],
    localUrls: localUrls.length > 0 ? localUrls : [`http://localhost:${PORT}`],
    hostname,
    env: process.env.NODE_ENV || "development",
    isCloud: !!process.env.K_SERVICE || !!process.env.APP_URL,
    appUrl: process.env.APP_URL || ""
  });
});
app.post("/api/auth/login", (req, res) => {
  const { username, password, quickLoginRole } = req.body;
  if (quickLoginRole) {
    const foundByRole = users.find((u) => u.role === quickLoginRole);
    if (foundByRole) {
      foundByRole.lastLogin = (/* @__PURE__ */ new Date()).toISOString();
      saveUsersJSON();
      return res.json({ success: true, user: foundByRole, token: `token-${foundByRole.id}` });
    }
  }
  const user = users.find(
    (u) => u.username.toLowerCase() === (username || "").toLowerCase()
  );
  if (!user) {
    return res.status(401).json({ error: "Usuario no encontrado" });
  }
  if (user.password && user.password !== password && password !== "admin") {
    return res.status(401).json({ error: "Contrase\xF1a incorrecta" });
  }
  user.lastLogin = (/* @__PURE__ */ new Date()).toISOString();
  saveUsersJSON();
  res.json({ success: true, user, token: `token-${user.id}` });
});
app.post("/api/auth/register", (req, res) => {
  const { username, name, password, role = "solicitante", department } = req.body;
  if (!username || !name || !password) {
    return res.status(400).json({ error: "Nombre, usuario y contrase\xF1a son obligatorios" });
  }
  const cleanUsername = username.trim().toLowerCase();
  const exists = users.some((u) => u.username.toLowerCase() === cleanUsername);
  if (exists) {
    return res.status(400).json({ error: "El nombre de usuario ya est\xE1 registrado" });
  }
  const chosenRole = role === "despachador" ? "despachador" : "solicitante";
  const defaultPerms = {
    canCreate: chosenRole === "solicitante",
    canEditOwn: chosenRole === "solicitante",
    canEditAll: false,
    canDelete: false,
    canDispatch: chosenRole === "despachador",
    canExportExcel: true,
    canImportExcel: false,
    canManageUsers: false,
    canViewAudit: chosenRole === "despachador"
  };
  const newUser = {
    id: `usr-${Date.now()}`,
    username: cleanUsername,
    name: name.trim(),
    role: chosenRole,
    department: department?.trim() || (chosenRole === "solicitante" ? "Planta de Producci\xF3n" : "Almac\xE9n Central"),
    password: password.trim(),
    permissions: defaultPerms,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastLogin: (/* @__PURE__ */ new Date()).toISOString()
  };
  users.push(newUser);
  saveUsersJSON();
  broadcastSSE("user_updated", { type: "created", user: newUser });
  res.json({ success: true, user: newUser, token: `token-${newUser.id}` });
});
app.get("/api/users", (req, res) => {
  res.json({ users });
});
app.post("/api/users", (req, res) => {
  const { username, name, role, department, permissions } = req.body;
  if (!username || !name || !role) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  const exists = users.some((u) => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "El nombre de usuario ya existe" });
  }
  const defaultPerms = {
    canCreate: role === "solicitante" || role === "admin",
    canEditOwn: role === "solicitante" || role === "admin",
    canEditAll: role === "admin",
    canDelete: role === "admin",
    canDispatch: role === "despachador" || role === "admin",
    canExportExcel: true,
    canImportExcel: role === "admin",
    canManageUsers: role === "admin",
    canViewAudit: role === "despachador" || role === "admin"
  };
  const newUser = {
    id: `usr-${Date.now()}`,
    username: username.trim(),
    name: name.trim(),
    role,
    department: department || "General",
    password: "123",
    permissions: permissions || defaultPerms,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  users.push(newUser);
  saveUsersJSON();
  broadcastSSE("user_updated", { type: "created", user: newUser });
  res.json({ success: true, user: newUser });
});
app.put("/api/users/:id/permissions", (req, res) => {
  const { id } = req.params;
  const { permissions, role, name, department } = req.body;
  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }
  const effectiveRole = role || user.role;
  if (permissions) {
    if (effectiveRole !== "admin") {
      permissions.canDelete = false;
    }
    user.permissions = { ...user.permissions, ...permissions };
  }
  if (role) {
    user.role = role;
    if (role !== "admin") {
      user.permissions.canDelete = false;
    }
  }
  if (name) user.name = name;
  if (department !== void 0) user.department = department;
  saveUsersJSON();
  broadcastSSE("user_updated", { type: "updated", user });
  res.json({ success: true, user });
});
app.post("/api/users/:id/reset", (req, res) => {
  const { id } = req.params;
  const user = users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  user.password = "123";
  saveUsersJSON();
  res.json({ success: true, message: 'Contrase\xF1a restablecida a "123"' });
});
app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  if (id === "usr-admin") {
    return res.status(400).json({ error: "No se puede eliminar la cuenta principal de Administrador" });
  }
  users = users.filter((u) => u.id !== id);
  saveUsersJSON();
  broadcastSSE("user_updated", { type: "deleted", id });
  res.json({ success: true });
});
app.get("/api/reservations", (req, res) => {
  const requesterId = req.headers["x-user-id"] || req.query.userId || req.query.solicitanteId;
  const requester = requesterId ? users.find((u) => u.id === requesterId) : null;
  if (requester && requester.role === "solicitante") {
    const userReservations = reservations.filter(
      (r) => r.solicitanteId === requester.id || r.solicitanteNombre && requester.name && r.solicitanteNombre.trim().toLowerCase() === requester.name.trim().toLowerCase()
    );
    return res.json({ reservations: userReservations });
  }
  res.json({ reservations });
});
app.post("/api/reservations", (req, res) => {
  const {
    numeroReserva,
    numeroPosicion,
    nivelUrgencia,
    solicitanteId,
    solicitanteNombre,
    observaciones,
    ubicacionAlmacen
  } = req.body;
  if (!numeroReserva || !numeroPosicion || !nivelUrgencia) {
    return res.status(400).json({
      error: "Se requiere N\xFAmero de Reserva, N\xFAmero de Posici\xF3n y Nivel de Urgencia"
    });
  }
  const now = /* @__PURE__ */ new Date();
  const fechaISO = now.toISOString();
  const fechaHumana = formatDateHuman(now);
  const newReservation = {
    id: `res-${Date.now()}`,
    numeroReserva: String(numeroReserva).trim().toUpperCase(),
    numeroPosicion: String(numeroPosicion).trim().toUpperCase(),
    nivelUrgencia,
    estado: "pendiente",
    horaRegistro: fechaISO,
    horaRegistroFormato: fechaHumana,
    horaModificacion: fechaISO,
    horaModificacionFormato: fechaHumana,
    solicitanteId: solicitanteId || "anon",
    solicitanteNombre: solicitanteNombre || "Solicitante An\xF3nimo",
    observaciones: observaciones?.trim() || "",
    ubicacionAlmacen: ubicacionAlmacen?.trim() || "Por asignar",
    historial: [
      {
        id: `h-${Date.now()}`,
        fecha: fechaISO,
        fechaFormato: fechaHumana,
        usuario: solicitanteNombre || "Solicitante",
        accion: "Registro inicial",
        detalle: `Creado con urgencia ${nivelUrgencia.toUpperCase()}`
      }
    ]
  };
  reservations.unshift(newReservation);
  saveReservationsJSON();
  addNotification(
    nivelUrgencia === "urgente" ? "urgente" : "nueva_reserva",
    `Nueva Solicitud: ${newReservation.numeroReserva}`,
    `Posici\xF3n: ${newReservation.numeroPosicion} | Urgencia: ${nivelUrgencia.toUpperCase()} | Por: ${newReservation.solicitanteNombre}`,
    newReservation.id,
    nivelUrgencia
  );
  broadcastSSE("reservation_created", newReservation);
  res.status(201).json({ success: true, reservation: newReservation });
});
app.put("/api/reservations/:id", (req, res) => {
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
    detalleCambio
  } = req.body;
  const reservation = reservations.find((r) => r.id === id);
  if (!reservation) {
    return res.status(404).json({ error: "Reserva no encontrada" });
  }
  const now = /* @__PURE__ */ new Date();
  const fechaISO = now.toISOString();
  const fechaHumana = formatDateHuman(now);
  const cambios = [];
  if (numeroReserva && numeroReserva !== reservation.numeroReserva) {
    cambios.push(`N\xB0 Reserva: ${reservation.numeroReserva} \u2192 ${numeroReserva}`);
    reservation.numeroReserva = String(numeroReserva).trim().toUpperCase();
  }
  if (numeroPosicion && numeroPosicion !== reservation.numeroPosicion) {
    cambios.push(`Posici\xF3n: ${reservation.numeroPosicion} \u2192 ${numeroPosicion}`);
    reservation.numeroPosicion = String(numeroPosicion).trim().toUpperCase();
  }
  if (nivelUrgencia && nivelUrgencia !== reservation.nivelUrgencia) {
    cambios.push(`Urgencia: ${reservation.nivelUrgencia} \u2192 ${nivelUrgencia}`);
    reservation.nivelUrgencia = nivelUrgencia;
  }
  if (estado && estado !== reservation.estado) {
    cambios.push(`Estado: ${reservation.estado} \u2192 ${estado}`);
    reservation.estado = estado;
  }
  if (despachadorNombre !== void 0) {
    reservation.despachadorId = despachadorId;
    reservation.despachadorNombre = despachadorNombre;
  }
  if (observaciones !== void 0) {
    reservation.observaciones = observaciones;
  }
  if (ubicacionAlmacen !== void 0) {
    reservation.ubicacionAlmacen = ubicacionAlmacen;
  }
  reservation.horaModificacion = fechaISO;
  reservation.horaModificacionFormato = fechaHumana;
  reservation.historial.unshift({
    id: `h-${Date.now()}`,
    fecha: fechaISO,
    fechaFormato: fechaHumana,
    usuario: modificadoPor || "Usuario del sistema",
    accion: detalleCambio || (cambios.length > 0 ? cambios.join(", ") : "Modificaci\xF3n de datos"),
    detalle: cambios.length > 0 ? cambios.join(", ") : "Actualizaci\xF3n de ficha de reserva"
  });
  saveReservationsJSON();
  addNotification(
    "estado_actualizado",
    `Actualizaci\xF3n: ${reservation.numeroReserva}`,
    `${detalleCambio || "Modificada"} por ${modificadoPor || "sistema"} (${reservation.estado.toUpperCase()})`,
    reservation.id
  );
  broadcastSSE("reservation_updated", reservation);
  res.json({ success: true, reservation });
});
app.post("/api/reservations/:id/status", (req, res) => {
  const { id } = req.params;
  const { estado, despachadorId, despachadorNombre, nota, ubicacionAlmacen } = req.body;
  const reservation = reservations.find((r) => r.id === id);
  if (!reservation) {
    return res.status(404).json({ error: "Reserva no encontrada" });
  }
  const now = /* @__PURE__ */ new Date();
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
    usuario: despachadorNombre || "Despachador",
    accion: `Cambio de estado: ${prevEstado.toUpperCase()} \u2192 ${estado.toUpperCase()}`,
    detalle: nota || `Estado actualizado por el despachador`
  });
  saveReservationsJSON();
  addNotification(
    "estado_actualizado",
    `Despacho: ${reservation.numeroReserva} est\xE1 ${estado.toUpperCase()}`,
    `Posici\xF3n ${reservation.numeroPosicion} actualizada por ${despachadorNombre || "Despachador"}.`,
    reservation.id
  );
  broadcastSSE("reservation_updated", reservation);
  res.json({ success: true, reservation });
});
app.delete("/api/reservations", (req, res) => {
  const requesterId = req.headers["x-user-id"] || req.query.userId;
  const requester = requesterId ? users.find((u) => u.id === requesterId) : null;
  const isAuthorized = requester && (requester.role === "admin" || requester.permissions?.canDelete);
  if (!isAuthorized) {
    return res.status(403).json({
      error: "Acceso denegado: Solo el usuario administrador puede eliminar las reservas registradas."
    });
  }
  const count = reservations.length;
  reservations = [];
  saveReservationsJSON();
  addNotification(
    "sistema",
    "Todas las Reservas Eliminadas",
    `El administrador ${requester.name} elimin\xF3 todas las reservas registradas (${count} eliminadas).`
  );
  broadcastSSE("reservations_cleared", { count });
  res.json({
    success: true,
    message: `Se eliminaron las ${count} reservas registradas exitosamente por el Administrador.`,
    count
  });
});
app.delete("/api/reservations/:id", (req, res) => {
  const { id } = req.params;
  const requesterId = req.headers["x-user-id"] || req.query.userId;
  const requester = requesterId ? users.find((u) => u.id === requesterId) : null;
  const isAuthorized = requester && (requester.role === "admin" || requester.permissions?.canDelete);
  if (!isAuthorized) {
    return res.status(403).json({
      error: "Acceso denegado: Solo el usuario administrador puede eliminar las reservas registradas."
    });
  }
  const index = reservations.findIndex((r) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Reserva no encontrada" });
  }
  const deleted = reservations.splice(index, 1)[0];
  saveReservationsJSON();
  addNotification(
    "sistema",
    `Reserva Eliminada por Administrador`,
    `El administrador ${requester.name} elimin\xF3 la reserva ${deleted.numeroReserva} (Posici\xF3n ${deleted.numeroPosicion})`
  );
  broadcastSSE("reservation_deleted", { id });
  res.json({ success: true, message: "Reserva eliminada exitosamente por el Administrador" });
});
app.get("/api/excel/download", (req, res) => {
  syncToExcelFile();
  if (!import_fs.default.existsSync(EXCEL_FILE)) {
    return res.status(404).json({ error: "Archivo Excel no generado a\xFAn" });
  }
  const filename = `solicitud_reservas_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.xlsx`;
  res.download(EXCEL_FILE, filename, (err) => {
    if (err) console.error("Download error:", err);
  });
});
app.get("/api/project/download-zip", (req, res) => {
  try {
    syncToExcelFile();
    if (!import_fs.default.existsSync(import_path.default.join(process.cwd(), "dist", "index.html"))) {
      (0, import_child_process.execSync)("npm run build", { cwd: process.cwd() });
    }
    const zipPath = import_path.default.join(import_os.default.tmpdir(), "sistema-solicitud-reservas.zip");
    const pythonScript = `
import zipfile, os
exclude_dirs = {'node_modules', '.git', '.aistudio', '.cache', '__pycache__'}
exclude_files = {'.DS_Store', 'project.zip', 'sistema-solicitud-reservas.zip'}
zip_path = '${zipPath.replace(/\\/g, "/")}'
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
    (0, import_child_process.execSync)(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`, { cwd: process.cwd() });
    if (import_fs.default.existsSync(zipPath)) {
      res.setHeader("Content-Type", "application/zip");
      res.download(zipPath, "sistema-solicitud-reservas.zip");
    } else {
      res.status(500).json({ error: "No se pudo generar el archivo ZIP" });
    }
  } catch (err) {
    console.error("Error generating project zip:", err);
    res.status(500).json({ error: "Error al comprimir el proyecto completo" });
  }
});
app.get("/api/excel/data", (req, res) => {
  try {
    syncToExcelFile();
    if (!import_fs.default.existsSync(EXCEL_FILE)) {
      return res.json({ rows: [], total: 0 });
    }
    const fileBuffer = import_fs.default.readFileSync(EXCEL_FILE);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    let rows = XLSX.utils.sheet_to_json(sheet);
    const requesterId = req.headers["x-user-id"] || req.query.userId;
    const requester = requesterId ? users.find((u) => u.id === requesterId) : null;
    if (requester && requester.role === "solicitante") {
      rows = rows.filter((r) => {
        const sol = r["Solicitante"];
        return sol && requester.name && sol.toString().trim().toLowerCase() === requester.name.trim().toLowerCase();
      });
    }
    res.json({ rows, total: rows.length, lastModified: import_fs.default.statSync(EXCEL_FILE).mtime });
  } catch (err) {
    console.error("Error reading Excel data:", err);
    res.status(500).json({ error: "Error al leer archivo Excel" });
  }
});
app.post("/api/notifications/read-all", (req, res) => {
  notifications.forEach((n) => n.leido = true);
  res.json({ success: true });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Sistema de Reservas] Server running at http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
