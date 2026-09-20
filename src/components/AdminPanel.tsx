import React, { useState } from 'react';
import { 
  Shield, 
  UserPlus, 
  Key, 
  Trash2, 
  Check, 
  X, 
  FileSpreadsheet, 
  Clock, 
  CheckCircle2, 
  History, 
  Settings, 
  Users, 
  UserCheck, 
  Truck, 
  Edit, 
  Save, 
  RefreshCw,
  Lock,
  Search,
  Filter,
  AlertTriangle,
  Layers,
  MapPin,
  Tag,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { User, UserPermissions, UserRole, UrgencyLevel, ReservationStatus } from '../types';
import { api } from '../utils/api';

export const AdminPanel: React.FC = () => {
  const { users, currentUser, refreshUsers } = useAuth();
  const { reservations, refreshReservations } = useRealtime();

  const [activeAdminTab, setActiveAdminTab] = useState<'reservas' | 'usuarios' | 'auditoria' | 'excel'>('reservas');
  const [isClearingReservations, setIsClearingReservations] = useState(false);

  // Reservations tab state in AdminPanel
  const [reservaSearch, setReservaSearch] = useState('');
  const [reservaFilterUrgencia, setReservaFilterUrgencia] = useState<string>('todos');
  const [reservaFilterEstado, setReservaFilterEstado] = useState<string>('todos');
  const [deletingReservaId, setDeletingReservaId] = useState<string | null>(null);

  // New User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('solicitante');
  const [newDepartment, setNewDepartment] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  // Edit Permissions Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [tempPermissions, setTempPermissions] = useState<UserPermissions | null>(null);
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  const handleOpenPermsModal = (user: User) => {
    setEditingUser(user);
    setTempPermissions({ ...user.permissions });
  };

  const handleTogglePerm = (key: keyof UserPermissions) => {
    if (!tempPermissions) return;
    // Solo el usuario administrador puede tener permiso de eliminar reservas
    if (key === 'canDelete' && editingUser?.role !== 'admin') {
      return;
    }
    setTempPermissions({
      ...tempPermissions,
      [key]: !tempPermissions[key],
    });
  };

  const handleSavePermissions = async () => {
    if (!editingUser || !tempPermissions) return;
    setIsSavingPerms(true);
    try {
      const sanitizedPermissions: UserPermissions = {
        ...tempPermissions,
        canDelete: editingUser.role === 'admin' ? Boolean(tempPermissions.canDelete) : false,
      };
      await api.updateUserPermissions(editingUser.id, {
        permissions: sanitizedPermissions,
      });
      await refreshUsers();
      setEditingUser(null);
    } catch (err: any) {
      alert(err.message || 'Error al guardar permisos');
    } finally {
      setIsSavingPerms(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);
    setIsCreatingUser(true);

    try {
      await api.createUser({
        username: newUsername,
        name: newName,
        role: newRole,
        department: newDepartment,
      });

      setShowAddUserModal(false);
      setNewUsername('');
      setNewName('');
      setNewDepartment('');
      setNewRole('solicitante');
      await refreshUsers();
    } catch (err: any) {
      setUserError(err.message || 'Error al crear usuario');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    if (!confirm(`¿Restablecer la contraseña del usuario ${userName}?`)) return;
    try {
      const msg = await api.resetUserPassword(userId);
      alert(msg);
    } catch (err: any) {
      alert(err.message || 'Error al restablecer contraseña');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`¿Está seguro de eliminar el usuario ${userName}? Esta acción no se puede deshacer.`)) return;
    try {
      await api.deleteUser(userId);
      await refreshUsers();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar usuario');
    }
  };

  const handleClearAllReservations = async () => {
    if (currentUser?.role !== 'admin') {
      alert('Acceso denegado: Solo el Administrador puede eliminar las reservas registradas.');
      return;
    }
    if (!confirm(`¿Está completamente seguro de eliminar TODAS las reservas registradas (${reservations.length})? Se limpiarán de la base de datos y del archivo Excel. Esta acción no se puede deshacer.`)) {
      return;
    }
    setIsClearingReservations(true);
    try {
      const res = await api.clearAllReservations();
      alert(res.message || 'Todas las reservas han sido eliminadas exitosamente.');
      await refreshReservations();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar reservas');
    } finally {
      setIsClearingReservations(false);
    }
  };

  const handleDeleteSingleReservation = async (id: string, numeroReserva: string) => {
    if (currentUser?.role !== 'admin') {
      alert('Acceso denegado: Solo el Administrador puede eliminar reservas registradas.');
      return;
    }
    if (!confirm(`¿Está seguro de eliminar la reserva ${numeroReserva}? Esta acción la borrará de la base de datos y del archivo Excel.`)) {
      return;
    }
    setDeletingReservaId(id);
    try {
      await api.deleteReservation(id);
      await refreshReservations();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la reserva');
    } finally {
      setDeletingReservaId(null);
    }
  };

  // Filtered reservations for Admin view
  const filteredReservasAdmin = reservations.filter((r) => {
    const matchSearch =
      r.numeroReserva.toLowerCase().includes(reservaSearch.toLowerCase()) ||
      r.numeroPosicion.toLowerCase().includes(reservaSearch.toLowerCase()) ||
      r.solicitanteNombre.toLowerCase().includes(reservaSearch.toLowerCase()) ||
      (r.observaciones && r.observaciones.toLowerCase().includes(reservaSearch.toLowerCase())) ||
      (r.ubicacionAlmacen && r.ubicacionAlmacen.toLowerCase().includes(reservaSearch.toLowerCase()));

    const matchUrgencia = reservaFilterUrgencia === 'todos' || r.nivelUrgencia === reservaFilterUrgencia;
    const matchEstado = reservaFilterEstado === 'todos' || r.estado === reservaFilterEstado;

    return matchSearch && matchUrgencia && matchEstado;
  });

  // Compile all audit logs from all reservations
  const allAuditEntries: Array<{
    id: string;
    reservaNumero: string;
    fechaFormato: string;
    usuario: string;
    accion: string;
    detalle: string;
  }> = [];

  reservations.forEach((r) => {
    r.historial?.forEach((h) => {
      allAuditEntries.push({
        id: `${r.id}-${h.id}`,
        reservaNumero: r.numeroReserva,
        fechaFormato: h.fechaFormato,
        usuario: h.usuario,
        accion: h.accion,
        detalle: h.detalle,
      });
    });
  });

  // Sort latest first
  allAuditEntries.sort((a, b) => b.id.localeCompare(a.id));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-500/30 border border-purple-400/30 text-purple-200 uppercase tracking-wide">
                Panel de Administración
              </span>
              <span className="text-xs text-purple-200">Acceso Maestro</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
              Control de Accesos, Permisos Detallados y Auditoría
            </h1>
            <p className="text-sm text-purple-200 mt-0.5 max-w-2xl">
              Configure los privilegios de cada cuenta registrada (creación, despacho, modificación de reservas, exportación Excel), audite todas las marcas de tiempo y supervise la sincronización del sistema.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo Usuario
            </button>
          </div>
        </div>
      </div>

      {/* Admin Tab Buttons */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveAdminTab('reservas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'reservas'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Control y Eliminación de Reservas ({reservations.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('usuarios')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'usuarios'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Gestión de Cuentas y Permisos ({users.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('auditoria')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'auditoria'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          Historial de Auditoría en Tiempo Real ({allAuditEntries.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('excel')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'excel'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Motor de Sincronización Excel
        </button>
      </div>

      {/* TAB: GESTIÓN Y ELIMINACIÓN DE RESERVAS */}
      {activeAdminTab === 'reservas' && (
        <div className="space-y-4">
          {/* Card Summary & Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Total Registradas</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{reservations.length}</div>
              <div className="text-[10px] text-slate-400 mt-1">Sincronizadas con Excel</div>
            </div>
            <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/20 p-4 shadow-xs">
              <div className="text-xs text-amber-800 font-medium">Pendientes</div>
              <div className="text-2xl font-bold text-amber-900 mt-0.5">
                {reservations.filter((r) => r.estado === 'pendiente').length}
              </div>
              <div className="text-[10px] text-amber-700/80 mt-1">En cola de despacho</div>
            </div>
            <div className="bg-white rounded-2xl border border-indigo-200 bg-indigo-50/20 p-4 shadow-xs">
              <div className="text-xs text-indigo-800 font-medium">En Preparación</div>
              <div className="text-2xl font-bold text-indigo-900 mt-0.5">
                {reservations.filter((r) => r.estado === 'en_proceso').length}
              </div>
              <div className="text-[10px] text-indigo-700/80 mt-1">En atención de almacén</div>
            </div>
            <div className="bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 p-4 shadow-xs">
              <div className="text-xs text-emerald-800 font-medium">Despachadas</div>
              <div className="text-2xl font-bold text-emerald-900 mt-0.5">
                {reservations.filter((r) => r.estado === 'despachado').length}
              </div>
              <div className="text-[10px] text-emerald-700/80 mt-1">Entregadas con éxito</div>
            </div>
          </div>

          {/* Main Control Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-rose-600" />
                  Control y Eliminación de Reservas (Exclusivo Administrador)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Como Administrador, puede eliminar reservas individuales o vaciar todas las reservas con confirmación de seguridad y sincronización instantánea en el archivo Excel.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={refreshReservations}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Actualizar
                </button>
                <button
                  type="button"
                  onClick={handleClearAllReservations}
                  disabled={isClearingReservations || reservations.length === 0}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 ${
                    reservations.length === 0
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 active:scale-95'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  {isClearingReservations ? 'Eliminando...' : 'Eliminar Todas las Reservas'}
                </button>
              </div>
            </div>

            {/* Filter toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={reservaSearch}
                  onChange={(e) => setReservaSearch(e.target.value)}
                  placeholder="Buscar reserva, posición, solicitante..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              <div className="relative">
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={reservaFilterEstado}
                  onChange={(e) => setReservaFilterEstado(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="en_proceso">En Preparación</option>
                  <option value="despachado">Despachados</option>
                  <option value="observado">Observados</option>
                </select>
              </div>

              <div className="relative">
                <AlertTriangle className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={reservaFilterUrgencia}
                  onChange={(e) => setReservaFilterUrgencia(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="todos">Todas las Urgencias</option>
                  <option value="urgente">🚨 Urgente / Crítica</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
            </div>

            {/* Reservations Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">N° Reserva</th>
                    <th className="py-3 px-3">Posición</th>
                    <th className="py-3 px-3">Urgencia</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-3">Solicitante</th>
                    <th className="py-3 px-3">Hora Registro</th>
                    <th className="py-3 px-3">Hora Modificación</th>
                    <th className="py-3 px-3">Ubicación</th>
                    <th className="py-3 px-3 text-right">Acción de Administrador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredReservasAdmin.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-slate-400">
                        <Trash2 className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
                        <p className="font-medium text-slate-600">No se encontraron reservas registradas</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {reservations.length === 0
                            ? 'Todas las reservas han sido eliminadas o la cola está vacía.'
                            : 'No hay coincidencias con los filtros aplicados.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredReservasAdmin.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {r.numeroReserva}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold">
                          {r.numeroPosicion}
                        </td>
                        <td className="py-2.5 px-3">
                          {r.nivelUrgencia === 'urgente' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                              URGENTE
                            </span>
                          )}
                          {r.nivelUrgencia === 'alta' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Alta
                            </span>
                          )}
                          {r.nivelUrgencia === 'media' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                              Media
                            </span>
                          )}
                          {r.nivelUrgencia === 'baja' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              Baja
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {r.estado === 'pendiente' && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Pendiente
                            </span>
                          )}
                          {r.estado === 'en_proceso' && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                              En Preparación
                            </span>
                          )}
                          {r.estado === 'despachado' && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Despachado
                            </span>
                          )}
                          {r.estado === 'observado' && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-orange-50 text-orange-800 border border-orange-200">
                              Observado
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">
                          {r.solicitanteNombre}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {r.horaRegistroFormato || r.horaRegistro}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {r.horaModificacionFormato || r.horaModificacion || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {r.ubicacionAlmacen || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteSingleReservation(r.id, r.numeroReserva)}
                            disabled={deletingReservaId === r.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold transition-all shadow-2xs active:scale-95"
                            title="Eliminar esta reserva (Exclusivo Administrador)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {deletingReservaId === r.id ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: USERS & DETAILED PERMISSIONS */}
      {activeAdminTab === 'usuarios' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Usuarios Registrados y Matriz de Permisos
              </h2>
              <p className="text-xs text-slate-500">
                Haga clic en "Permisos Detallados" para activar o revocar privilegios específicos para cada cuenta.
              </p>
            </div>
            <button
              onClick={refreshUsers}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-100"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Actualizar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Usuario</th>
                  <th className="py-2.5 px-3">Nombre Completo</th>
                  <th className="py-2.5 px-3">Rol</th>
                  <th className="py-2.5 px-3">Departamento</th>
                  <th className="py-2.5 px-3">Permisos Clave</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isAdmin = u.role === 'admin';
                  const isSolicitante = u.role === 'solicitante';
                  const isDespachador = u.role === 'despachador';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        @{u.username}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {u.name}
                        {u.id === currentUser?.id && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold">
                            Tú
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {isAdmin && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            Administrador
                          </span>
                        )}
                        {isSolicitante && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            Solicitante
                          </span>
                        )}
                        {isDespachador && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Despachador
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {u.department || 'General'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {u.permissions?.canCreate && (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium border border-blue-100">
                              Crear
                            </span>
                          )}
                          {u.permissions?.canDispatch && (
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-medium border border-emerald-100">
                              Despacho
                            </span>
                          )}
                          {u.permissions?.canEditAll && (
                            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-medium border border-purple-100">
                              Editar Todo
                            </span>
                          )}
                          {u.permissions?.canExportExcel && (
                            <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded text-[10px] font-medium border border-teal-100">
                              Excel
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Permissions Button */}
                          <button
                            onClick={() => handleOpenPermsModal(u)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1"
                            title="Editar permisos granulares"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            Permisos
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => handleResetPassword(u.id, u.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                            title="Restablecer contraseña a '123'"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete User */}
                          {u.id !== 'usr-admin' && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Eliminar cuenta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT TRAIL */}
      {activeAdminTab === 'auditoria' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600" />
              Trazabilidad Completa de Operaciones y Marcas de Tiempo
            </h2>
            <p className="text-xs text-slate-500">
              Cada creación, modificación y despacho queda registrado con fecha exacta, usuario y acción realizada.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">N° Reserva</th>
                  <th className="py-2.5 px-3">Usuario Responsable</th>
                  <th className="py-2.5 px-3">Acción Registrada</th>
                  <th className="py-2.5 px-3">Detalles de Modificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allAuditEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No hay registros de auditoría aún.
                    </td>
                  </tr>
                ) : (
                  allAuditEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {entry.fechaFormato}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {entry.reservaNumero}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {entry.usuario}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                          {entry.accion}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {entry.detalle}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EXCEL SYNC INFO */}
      {activeAdminTab === 'excel' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Sincronización en Archivo Excel (XLSX)
            </h2>
            <p className="text-xs text-slate-500">
              Conformidad total con el requerimiento: los datos se guardan en vivo en el libro de trabajo Excel ubicado en el servidor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Ruta del Archivo</div>
              <div className="font-mono text-sm font-bold text-emerald-950 mt-1">
                data/solicitud_reservas.xlsx
              </div>
              <p className="text-[11px] text-emerald-700 mt-2">
                Generado automáticamente mediante SheetJS (XLSX) en cada alta o modificación.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
              <div className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Hojas del Libro</div>
              <div className="text-sm font-bold text-blue-950 mt-1">
                1. Reservas_Activas <br />
                2. Auditoria_Historial
              </div>
              <p className="text-[11px] text-blue-700 mt-2">
                Columnas auto-ajustadas con timestamps formateados y estados vigentes.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-purple-800 uppercase tracking-wide">Descarga Directa</div>
                <div className="text-sm font-bold text-purple-950 mt-1">
                  Exportación Instantánea
                </div>
              </div>
              <a
                href={api.getExcelDownloadUrl()}
                className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Descargar Excel Actualizado
              </a>
            </div>
          </div>

          {/* Purge / Clear all reservations section */}
          <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-50/50 border border-rose-200/70">
            <div>
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wide">
                  Gestión y Eliminación de Reservas Registradas
                </h4>
              </div>
              <p className="text-xs text-rose-800 mt-1">
                Estado actual: <strong>{reservations.length} reservas registradas</strong>. Esta acción vacía la cola de reservas de la base de datos y deja el libro Excel en blanco preservando únicamente los encabezados.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearAllReservations}
              disabled={isClearingReservations || reservations.length === 0}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all ${
                reservations.length === 0
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 active:scale-95'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              {isClearingReservations ? 'Eliminando...' : 'Eliminar Todas las Reservas'}
            </button>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {editingUser && tempPermissions && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  Permisos Detallados de Cuenta
                </h3>
                <p className="text-xs text-slate-500">
                  Usuario: <strong className="text-slate-800">@{editingUser.username}</strong> ({editingUser.name})
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="text-xs font-semibold text-slate-700">
                Seleccione las operaciones permitidas para este perfil:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'canCreate', label: 'Crear Solicitudes', desc: 'Permite registrar nuevas reservas en el sistema', exclusiveAdmin: false },
                  { key: 'canEditOwn', label: 'Modificar Propias', desc: 'Editar reservas registradas por este usuario', exclusiveAdmin: false },
                  { key: 'canEditAll', label: 'Modificar Cualquiera', desc: 'Privilegio para editar cualquier reserva', exclusiveAdmin: false },
                  { 
                    key: 'canDelete', 
                    label: 'Eliminar Reservas', 
                    desc: editingUser?.role === 'admin' 
                      ? 'Anular y eliminar registros de reserva (Exclusivo Administrador)' 
                      : 'Acceso restringido: Solo el usuario administrador puede eliminar reservas',
                    exclusiveAdmin: true 
                  },
                  { key: 'canDispatch', label: 'Atender Despacho', desc: 'Cambiar estados a En Proceso y Despachado', exclusiveAdmin: false },
                  { key: 'canExportExcel', label: 'Exportar a Excel', desc: 'Descargar archivo Excel sincronizado', exclusiveAdmin: false },
                  { key: 'canManageUsers', label: 'Gestionar Usuarios', desc: 'Acceso a crear y configurar cuentas', exclusiveAdmin: false },
                  { key: 'canViewAudit', label: 'Ver Auditoría', desc: 'Consultar el historial completo de cambios', exclusiveAdmin: false },
                ].map((perm) => {
                  const isLocked = perm.exclusiveAdmin && editingUser?.role !== 'admin';
                  const isChecked = isLocked ? false : Boolean(tempPermissions[perm.key as keyof UserPermissions]);
                  return (
                    <label
                      key={perm.key}
                      onClick={() => !isLocked && handleTogglePerm(perm.key as keyof UserPermissions)}
                      className={`p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                        isLocked
                          ? 'bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed opacity-75'
                          : isChecked
                          ? 'bg-purple-50/60 border-purple-300 text-purple-900 cursor-pointer'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isLocked}
                        onChange={() => {}} // handled by parent onClick
                        className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                      />
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{perm.label}</span>
                          {isLocked && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              Exclusivo Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 leading-snug">{perm.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                disabled={isSavingPerms}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {isSavingPerms ? 'Guardando...' : 'Guardar Permisos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-purple-600" />
              Registrar Nueva Cuenta de Usuario
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cree una cuenta para solicitante, despachador o administrador.
            </p>

            {userError && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs">
                {userError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre de Usuario (Username) *</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                  placeholder="Ej. jrodriguez"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre y Apellidos *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Javier Rodríguez"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rol Inicial *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                >
                  <option value="solicitante">Solicitante (Crea reservas y seguimiento)</option>
                  <option value="despachador">Despachador (Atiende cola y despacha)</option>
                  <option value="admin">Administrador (Control total y permisos)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Área o Departamento</label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="Ej. Planta de Mecanizado / Almacén B"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-500">
                La contraseña inicial por defecto se establecerá en <strong className="text-slate-800">123</strong> para acceso rápido.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/20"
                >
                  {isCreatingUser ? 'Creando...' : 'Crear Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
