import React, { useState } from 'react';
import { 
  Truck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Layers, 
  Search, 
  Filter, 
  User, 
  MapPin, 
  FileText, 
  ArrowRight, 
  Check, 
  AlertCircle,
  Sparkles,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { Reservation, ReservationStatus, UrgencyLevel } from '../types';
import { api } from '../utils/api';

export const DespachadorView: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const { reservations, refreshReservations } = useRealtime();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgencia, setFilterUrgencia] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('activos'); // 'activos' (pendientes + en proceso), 'todos', 'despachados'
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Dispatch Action Modal State
  const [activeDispatchItem, setActiveDispatchItem] = useState<Reservation | null>(null);
  const [dispatchStatus, setDispatchStatus] = useState<ReservationStatus>('en_proceso');
  const [despachoNota, setDespachoNota] = useState('');
  const [ubicacionAlmacen, setUbicacionAlmacen] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenDispatchModal = (item: Reservation, targetStatus: ReservationStatus) => {
    setActiveDispatchItem(item);
    setDispatchStatus(targetStatus);
    setDespachoNota('');
    setUbicacionAlmacen(item.ubicacionAlmacen || '');
  };

  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDispatchItem) return;

    setIsProcessing(true);
    try {
      await api.updateStatus(activeDispatchItem.id, {
        estado: dispatchStatus,
        despachadorId: currentUser?.id || 'desp-1',
        despachadorNombre: currentUser?.name || 'Despachador Almacén',
        nota: despachoNota.trim() || `Estado cambiado a ${dispatchStatus.toUpperCase()}`,
        ubicacionAlmacen: ubicacionAlmacen.trim(),
      });

      setActiveDispatchItem(null);
      await refreshReservations();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar despacho');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteReservation = async (id: string, numeroReserva: string) => {
    const isAdmin = currentUser?.role === 'admin' || hasPermission('canDelete');
    if (!isAdmin) {
      alert('Acceso restringido: Solo el usuario administrador puede eliminar reservas registradas.');
      return;
    }
    if (!confirm(`¿Está seguro de eliminar la reserva ${numeroReserva}? Esta acción es exclusiva para Administradores y no se puede deshacer.`)) {
      return;
    }
    setIsDeletingId(id);
    try {
      await api.deleteReservation(id);
      await refreshReservations();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar reserva');
    } finally {
      setIsDeletingId(null);
    }
  };

  // Quick single-click status change
  const handleQuickStatus = async (item: Reservation, newStatus: ReservationStatus) => {
    try {
      await api.updateStatus(item.id, {
        estado: newStatus,
        despachadorId: currentUser?.id,
        despachadorNombre: currentUser?.name,
        nota: `Despachador cambió estado a ${newStatus.toUpperCase()}`,
      });
      await refreshReservations();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar');
    }
  };

  // Sort: Priority to 'urgente', then 'alta', then registration time
  const urgencyWeight: Record<UrgencyLevel, number> = {
    urgente: 4,
    alta: 3,
    media: 2,
    baja: 1,
  };

  const sortedAndFiltered = reservations
    .filter((r) => {
      const matchSearch =
        r.numeroReserva.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.numeroPosicion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.solicitanteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.ubicacionAlmacen && r.ubicacionAlmacen.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchUrgencia = filterUrgencia === 'todos' || r.nivelUrgencia === filterUrgencia;

      let matchEstado = true;
      if (filterEstado === 'activos') {
        matchEstado = r.estado === 'pendiente' || r.estado === 'en_proceso';
      } else if (filterEstado !== 'todos') {
        matchEstado = r.estado === filterEstado;
      }

      return matchSearch && matchUrgencia && matchEstado;
    })
    .sort((a, b) => {
      // If both pending or en proceso, sort by urgency weight descending
      const weightA = urgencyWeight[a.nivelUrgencia] || 0;
      const weightB = urgencyWeight[b.nivelUrgencia] || 0;
      if (weightA !== weightB) {
        return weightB - weightA;
      }
      // Then by oldest registration first (FIFO queue)
      return new Date(a.horaRegistro).getTime() - new Date(b.horaRegistro).getTime();
    });

  // KPI calculations
  const totalPendientes = reservations.filter((r) => r.estado === 'pendiente').length;
  const totalEnProceso = reservations.filter((r) => r.estado === 'en_proceso').length;
  const totalUrgentes = reservations.filter((r) => r.nivelUrgencia === 'urgente' && r.estado !== 'despachado').length;
  const totalDespachados = reservations.filter((r) => r.estado === 'despachado').length;

  return (
    <div className="space-y-6">
      
      {/* Top Despachador Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-800 rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/30 border border-emerald-400/30 text-emerald-100 uppercase tracking-wide">
                Módulo Despachador
              </span>
              <span className="text-xs text-emerald-200">Operador: {currentUser?.name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
              Cola de Atención y Despacho de Materiales
            </h1>
            <p className="text-sm text-emerald-100 mt-0.5 max-w-2xl">
              Monitoreo en tiempo real de las reservas solicitadas. Atienda las solicitudes ordenadas por nivel de urgencia y registre la entrega con actualización automática en el Excel corporativo.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
            <div className="text-center px-2">
              <div className="text-2xl font-extrabold text-rose-300 animate-pulse">{totalUrgentes}</div>
              <div className="text-[11px] text-emerald-200 font-semibold">🚨 Críticas</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center px-2">
              <div className="text-2xl font-extrabold text-amber-300">{totalPendientes}</div>
              <div className="text-[11px] text-emerald-200">Pendientes</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center px-2">
              <div className="text-2xl font-extrabold text-indigo-300">{totalEnProceso}</div>
              <div className="text-[11px] text-emerald-200">En Proceso</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center px-2">
              <div className="text-2xl font-extrabold text-emerald-300">{totalDespachados}</div>
              <div className="text-[11px] text-emerald-200">Despachadas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick status tabs */}
          <button
            onClick={() => setFilterEstado('activos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterEstado === 'activos'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Cola Activa ({totalPendientes + totalEnProceso})
          </button>
          <button
            onClick={() => setFilterEstado('pendiente')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterEstado === 'pendiente'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Solo Pendientes ({totalPendientes})
          </button>
          <button
            onClick={() => setFilterEstado('en_proceso')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterEstado === 'en_proceso'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            En Preparación ({totalEnProceso})
          </button>
          <button
            onClick={() => setFilterEstado('despachado')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterEstado === 'despachado'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Despachadas ({totalDespachados})
          </button>
          <button
            onClick={() => setFilterEstado('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterEstado === 'todos'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todas ({reservations.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Urgencia filter */}
          <select
            value={filterUrgencia}
            onChange={(e) => setFilterUrgencia(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="todos">Toda Prioridad</option>
            <option value="urgente">🚨 Solo Urgentes</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>

          {/* Search box */}
          <div className="relative min-w-[200px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por reserva, posición..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Cards Queue Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedAndFiltered.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <h3 className="text-base font-bold text-slate-800">No hay reservas en este criterio</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Todas las solicitudes están atendidas o modifique los filtros de búsqueda.
            </p>
          </div>
        ) : (
          sortedAndFiltered.map((reserva) => {
            const isUrgente = reserva.nivelUrgencia === 'urgente';
            const isAlta = reserva.nivelUrgencia === 'alta';

            return (
              <div
                key={reserva.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between shadow-xs ${
                  isUrgente
                    ? 'border-rose-300 ring-2 ring-rose-200 shadow-rose-100'
                    : isAlta
                    ? 'border-amber-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Top */}
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-slate-900">
                          {reserva.numeroReserva}
                        </span>
                        {isUrgente && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white tracking-wider animate-pulse flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            CRÍTICA
                          </span>
                        )}
                        {isAlta && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            ALTA
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 font-mono">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>Posición: <strong className="text-slate-800">{reserva.numeroPosicion}</strong></span>
                      </div>
                    </div>

                    {/* Status Badge & Admin Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div>
                        {reserva.estado === 'pendiente' && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Pendiente
                          </span>
                        )}
                        {reserva.estado === 'en_proceso' && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                            En Preparación
                          </span>
                        )}
                        {reserva.estado === 'despachado' && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Despachado
                          </span>
                        )}
                        {reserva.estado === 'observado' && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200">
                            Observado
                          </span>
                        )}
                      </div>

                      {/* Botón de eliminación exclusivo para Administradores */}
                      {(currentUser?.role === 'admin' || hasPermission('canDelete')) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteReservation(reserva.id, reserva.numeroReserva)}
                          disabled={isDeletingId === reserva.id}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/80 transition-colors shadow-2xs active:scale-95"
                          title="Eliminar reserva (Rol Administrador)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Middle: Timestamps & Details */}
                <div className="p-4 space-y-2.5 text-xs text-slate-600 flex-1">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      Solicitante: <strong className="text-slate-800">{reserva.solicitanteNombre}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      Ubicación: <strong className="text-slate-800">{reserva.ubicacionAlmacen || 'Sin asignar'}</strong>
                    </span>
                  </div>

                  {reserva.observaciones && (
                    <div className="bg-slate-50 p-2 rounded-xl text-[11px] text-slate-700 border border-slate-200 italic">
                      "{reserva.observaciones}"
                    </div>
                  )}

                  {/* Automatic timestamps box */}
                  <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        Hora Registro:
                      </span>
                      <span className="text-slate-800 font-semibold">{reserva.horaRegistroFormato}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Hora Modificación:
                      </span>
                      <span className={`font-semibold ${
                        reserva.horaModificacion !== reserva.horaRegistro ? 'text-amber-700 bg-amber-50 px-1 rounded' : 'text-slate-600'
                      }`}>
                        {reserva.horaModificacionFormato}
                      </span>
                    </div>
                  </div>

                  {reserva.despachadorNombre && (
                    <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 font-medium">
                      Atendido por: {reserva.despachadorNombre}
                    </div>
                  )}
                </div>

                {/* Card Bottom: Dispatch Actions */}
                <div className="p-3 bg-slate-50 rounded-b-2xl border-t border-slate-100 flex items-center justify-between gap-2">
                  {reserva.estado === 'pendiente' && (
                    <>
                      <button
                        onClick={() => handleOpenDispatchModal(reserva, 'en_proceso')}
                        disabled={!hasPermission('canDispatch')}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Iniciar Preparación
                      </button>
                      <button
                        onClick={() => handleOpenDispatchModal(reserva, 'despachado')}
                        disabled={!hasPermission('canDispatch')}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Despachar
                      </button>
                    </>
                  )}

                  {reserva.estado === 'en_proceso' && (
                    <>
                      <button
                        onClick={() => handleOpenDispatchModal(reserva, 'despachado')}
                        disabled={!hasPermission('canDispatch')}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Completar Despacho
                      </button>
                      <button
                        onClick={() => handleOpenDispatchModal(reserva, 'observado')}
                        disabled={!hasPermission('canDispatch')}
                        className="py-1.5 px-2.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-semibold"
                        title="Agregar observación al lote"
                      >
                        Observar
                      </button>
                    </>
                  )}

                  {reserva.estado === 'despachado' && (
                    <div className="w-full flex items-center justify-between text-xs text-emerald-800 font-semibold px-2 py-1 bg-emerald-100/60 rounded-lg">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Despachado Exitosamente
                      </span>
                      <button
                        onClick={() => handleOpenDispatchModal(reserva, 'en_proceso')}
                        className="text-[11px] text-emerald-900 underline hover:text-emerald-700"
                      >
                        Reabrir
                      </button>
                    </div>
                  )}

                  {reserva.estado === 'observado' && (
                    <button
                      onClick={() => handleOpenDispatchModal(reserva, 'en_proceso')}
                      disabled={!hasPermission('canDispatch')}
                      className="w-full py-1.5 px-3 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
                    >
                      Reanudar Preparación
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Dispatch Action Modal */}
      {activeDispatchItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              Gestión de Despacho
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Actualizando reserva: <strong className="font-mono text-slate-800">{activeDispatchItem.numeroReserva}</strong> (Posición: {activeDispatchItem.numeroPosicion})
            </p>

            <form onSubmit={handleConfirmDispatch} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estado de la Reserva</label>
                <select
                  value={dispatchStatus}
                  onChange={(e) => setDispatchStatus(e.target.value as ReservationStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En Preparación (Mesa de Salida)</option>
                  <option value="despachado">Despachado (Entregado a Solicitante)</option>
                  <option value="observado">Observado / Falta Stock</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ubicación / Bahía de Almacén
                </label>
                <input
                  type="text"
                  value={ubicacionAlmacen}
                  onChange={(e) => setUbicacionAlmacen(e.target.value)}
                  placeholder="Ej. Bahía B, Estante 4, Rampa 1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nota del Despachador / Observación
                </label>
                <textarea
                  rows={2}
                  value={despachoNota}
                  onChange={(e) => setDespachoNota(e.target.value)}
                  placeholder="Ej. Material verificado, entregado a transportista..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl resize-none text-sm"
                />
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-[11px] text-emerald-800">
                Al confirmar, la <strong className="font-semibold">hora de modificación</strong> se registrará en tiempo real y el archivo Excel se sincronizará automáticamente para consulta de todos los usuarios.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveDispatchItem(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-500/20"
                >
                  {isProcessing ? 'Actualizando...' : 'Confirmar Estado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
