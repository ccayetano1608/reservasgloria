import React, { useState, useMemo } from 'react';
import { 
  PlusCircle, 
  Search, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Edit3, 
  Trash2, 
  Info, 
  Sparkles,
  ArrowUpDown,
  History,
  Tag,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { Reservation, UrgencyLevel } from '../types';
import { api } from '../utils/api';

export const SolicitanteView: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const { reservations, refreshReservations } = useRealtime();

  // Form State
  const [numeroReserva, setNumeroReserva] = useState('');
  const [numeroPosicion, setNumeroPosicion] = useState('');
  const [nivelUrgencia, setNivelUrgencia] = useState<UrgencyLevel>('media');
  const [observaciones, setObservaciones] = useState('');
  const [ubicacionAlmacen, setUbicacionAlmacen] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgencia, setFilterUrgencia] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [adminViewOnlyMine, setAdminViewOnlyMine] = useState(false);

  // Edit Modal State
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [auditReservation, setAuditReservation] = useState<Reservation | null>(null);

  // Helper to generate a sequential or clean reservation code
  const handleGenerateCode = () => {
    const randomSeq = Math.floor(10000 + Math.random() * 90000);
    setNumeroReserva(`RSV-${randomSeq}`);
    if (!numeroPosicion) {
      const posNum = Math.floor(1 + Math.random() * 20);
      setNumeroPosicion(`POS-${posNum < 10 ? '0' + posNum : posNum}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroReserva.trim() || !numeroPosicion.trim()) {
      setFormFeedback({ type: 'error', text: 'Complete el número de reserva y posición.' });
      return;
    }

    setIsSubmitting(true);
    setFormFeedback(null);

    try {
      await api.createReservation({
        numeroReserva: numeroReserva.trim(),
        numeroPosicion: numeroPosicion.trim(),
        nivelUrgencia,
        solicitanteId: currentUser?.id || 'anon',
        solicitanteNombre: currentUser?.name || 'Solicitante',
        observaciones: observaciones.trim(),
        ubicacionAlmacen: ubicacionAlmacen.trim(),
      });

      setFormFeedback({
        type: 'success',
        text: `¡Reserva ${numeroReserva.toUpperCase()} registrada con éxito! Hora de registro y Excel actualizados automáticamente.`,
      });

      // Clear Form
      setNumeroReserva('');
      setNumeroPosicion('');
      setObservaciones('');
      setUbicacionAlmacen('');
      setNivelUrgencia('media');

      // Auto dismiss success feedback
      setTimeout(() => setFormFeedback(null), 5000);
    } catch (err: any) {
      setFormFeedback({ type: 'error', text: err.message || 'Error al registrar reserva.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReservation) return;

    try {
      await api.updateReservation(editingReservation.id, {
        numeroReserva: editingReservation.numeroReserva,
        numeroPosicion: editingReservation.numeroPosicion,
        nivelUrgencia: editingReservation.nivelUrgencia,
        observaciones: editingReservation.observaciones,
        ubicacionAlmacen: editingReservation.ubicacionAlmacen,
        modificadoPor: currentUser?.name || 'Solicitante',
        detalleCambio: `Modificado por ${currentUser?.name || 'Solicitante'}`,
      });
      setEditingReservation(null);
      await refreshReservations();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar reserva');
    }
  };

  const handleDelete = async (id: string, num: string) => {
    const isAdmin = currentUser?.role === 'admin' || hasPermission('canDelete');
    if (!isAdmin) {
      alert('Acceso restringido: Solo el usuario administrador puede eliminar las reservas registradas.');
      return;
    }
    if (!confirm(`¿Está seguro de eliminar la reserva ${num}? Esta acción solo puede realizarla el Administrador y no se puede deshacer.`)) return;
    try {
      await api.deleteReservation(id);
      await refreshReservations();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar reserva');
    }
  };

  const handleClearAll = async () => {
    const isAdmin = currentUser?.role === 'admin' || hasPermission('canDelete');
    if (!isAdmin) {
      alert('Acceso restringido: Solo el usuario administrador puede eliminar las reservas registradas.');
      return;
    }
    if (!confirm(`¿Está seguro de eliminar TODAS las reservas registradas (${reservations.length})? Esta acción borrará todas las reservas de la base de datos y del Excel. Solo puede ser ejecutada por el Administrador.`)) {
      return;
    }
    setIsClearingAll(true);
    try {
      const res = await api.clearAllReservations();
      alert(res.message || 'Todas las reservas registradas han sido eliminadas exitosamente.');
      await refreshReservations();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar las reservas');
    } finally {
      setIsClearingAll(false);
    }
  };

  // REGLA: Cada solicitante solo puede ver las reservas generadas por su usuario.
  // Los administradores tienen visión global y pueden alternar si desean ver solo las suyas.
  const isSolicitante = currentUser?.role === 'solicitante';

  const visibleReservations = useMemo(() => {
    if (!currentUser) return [];

    if (isSolicitante) {
      return reservations.filter((r) => {
        const matchesId = r.solicitanteId === currentUser.id;
        const matchesName =
          Boolean(r.solicitanteNombre && currentUser.name) &&
          r.solicitanteNombre.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
        return matchesId || matchesName;
      });
    }

    if (adminViewOnlyMine) {
      return reservations.filter((r) => {
        const matchesId = r.solicitanteId === currentUser.id;
        const matchesName =
          Boolean(r.solicitanteNombre && currentUser.name) &&
          r.solicitanteNombre.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
        return matchesId || matchesName;
      });
    }

    return reservations;
  }, [reservations, isSolicitante, adminViewOnlyMine, currentUser]);

  // Filtered reservations
  const filtered = visibleReservations.filter((r) => {
    const matchSearch =
      r.numeroReserva.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.numeroPosicion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.solicitanteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.observaciones && r.observaciones.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchUrgencia = filterUrgencia === 'todos' || r.nivelUrgencia === filterUrgencia;
    const matchEstado = filterEstado === 'todos' || r.estado === filterEstado;

    return matchSearch && matchUrgencia && matchEstado;
  });

  const getUrgencyBadge = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'urgente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            URGENTE
          </span>
        );
      case 'alta':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Alta
          </span>
        );
      case 'media':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            Media
          </span>
        );
      case 'baja':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Baja
          </span>
        );
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Pendiente
          </span>
        );
      case 'en_proceso':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Layers className="w-3 h-3" />
            En Preparación
          </span>
        );
      case 'despachado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Despachado
          </span>
        );
      case 'observado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <Info className="w-3 h-3" />
            Observado
          </span>
        );
      case 'cancelado':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Cancelado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Welcome / Role Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-500/30 border border-blue-400/30 text-blue-100 uppercase tracking-wide">
                Módulo Solicitante
              </span>
              <span className="text-xs text-blue-200">Usuario activo: {currentUser?.name}</span>
              {isSolicitante && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/25 border border-emerald-400/30 text-emerald-200 inline-flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                  Filtrado exclusivo: Mis Reservas
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
              Ingreso y Monitoreo de Solicitudes de Reservas
            </h1>
            <p className="text-sm text-blue-100 mt-0.5 max-w-2xl">
              Ingrese el número de reserva, posición y urgencia. El sistema estampa automáticamente la 
              <span className="font-semibold text-white"> hora de registro</span> y la 
              <span className="font-semibold text-white"> hora de modificación</span>, sincronizándose al instante en el archivo Excel y en la cola del Despachador.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
            <div className="text-center px-2">
              <div className="text-2xl font-extrabold">{visibleReservations.length}</div>
              <div className="text-[11px] text-blue-200">
                {isSolicitante ? 'Mis Solicitudes' : 'Total Registradas'}
              </div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center px-2">
              <div className="text-2xl font-extrabold text-amber-300">
                {visibleReservations.filter((r) => r.estado === 'pendiente').length}
              </div>
              <div className="text-[11px] text-blue-200">En Espera</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center px-2">
              <div className="text-2xl font-extrabold text-emerald-300">
                {visibleReservations.filter((r) => r.estado === 'despachado').length}
              </div>
              <div className="text-[11px] text-blue-200">Despachadas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left, List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Reservation Entry Form */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Nueva Solicitud de Reserva</h2>
                  <p className="text-xs text-slate-500">Campos obligatorios marcados (*)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerateCode}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md transition-colors"
                title="Autogenerar código de prueba correlativo"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Autogenerar
              </button>
            </div>

            {formFeedback && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs flex items-start gap-2 ${
                  formFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {formFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{formFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Número de Reserva */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de Reserva *
                </label>
                <div className="relative">
                  <input
                    id="input-numero-reserva"
                    type="text"
                    required
                    value={numeroReserva}
                    onChange={(e) => setNumeroReserva(e.target.value.toUpperCase())}
                    placeholder="Ej. RSV-84924 o 100482"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Número de Posición */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de Posición *
                </label>
                <div className="relative">
                  <input
                    id="input-numero-posicion"
                    type="text"
                    required
                    value={numeroPosicion}
                    onChange={(e) => setNumeroPosicion(e.target.value.toUpperCase())}
                    placeholder="Ej. POS-05 o Posición 12"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Nivel de Urgencia */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nivel de Urgencia *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNivelUrgencia('baja')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                      nivelUrgencia === 'baja'
                        ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Baja
                  </button>
                  <button
                    type="button"
                    onClick={() => setNivelUrgencia('media')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                      nivelUrgencia === 'media'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    Media
                  </button>
                  <button
                    type="button"
                    onClick={() => setNivelUrgencia('alta')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                      nivelUrgencia === 'alta'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    Alta
                  </button>
                  <button
                    type="button"
                    onClick={() => setNivelUrgencia('urgente')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                      nivelUrgencia === 'urgente'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-300'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    🚨 Urgente
                  </button>
                </div>
              </div>

              {/* Ubicación / Referencia Almacén (Opcional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ubicación de Entrega o Referencia <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={ubicacionAlmacen}
                  onChange={(e) => setUbicacionAlmacen(e.target.value)}
                  placeholder="Ej. Bahía 3 / Módulo Ensamble 2"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observaciones o Detalle del Pedido <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Especificaciones de material, lote o motivo de urgencia..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Automatic Timestamping Note */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Registro Automático de Tiempos
                </div>
                <p>
                  • <span className="font-medium text-slate-700">Hora de Registro:</span> se genera automáticamente en el instante del envío.
                </p>
                <p>
                  • <span className="font-medium text-slate-700">Hora de Modificación:</span> se actualiza automáticamente con cada edición o cambio de estado del despacho.
                </p>
              </div>

              {/* Submit Button */}
              <button
                id="btn-submit-reserva"
                type="submit"
                disabled={isSubmitting || !hasPermission('canCreate')}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                  hasPermission('canCreate')
                    ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] shadow-blue-500/20'
                    : 'bg-slate-400 cursor-not-allowed'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                {isSubmitting ? 'Guardando...' : 'Registrar Solicitud de Reserva'}
              </button>
              {!hasPermission('canCreate') && (
                <p className="text-[11px] text-rose-500 text-center font-medium">
                  Tu usuario no tiene permisos para registrar nuevas reservas. Contacta al Administrador.
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Reservations Real-Time List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Registro de Reservas en Tiempo Real
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </h2>
                  {currentUser?.role === 'admin' && reservations.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      disabled={isClearingAll}
                      className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-xs active:scale-95"
                      title="Eliminar todas las reservas registradas (Exclusivo Administrador)"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      {isClearingAll ? 'Eliminando...' : 'Eliminar todas las reservas'}
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isSolicitante
                    ? `Mostrando ${filtered.length} de ${visibleReservations.length} reservas generadas por su usuario`
                    : `Mostrando ${filtered.length} de ${visibleReservations.length} reservas registradas`}
                </p>
              </div>

              {/* Search Box */}
              <div className="relative min-w-[220px]">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar reserva, posición..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2 py-3">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" />
                Filtros:
              </span>

              {/* Admin toggle for only mine or all */}
              {currentUser?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => setAdminViewOnlyMine(!adminViewOnlyMine)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                    adminViewOnlyMine
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {adminViewOnlyMine ? 'Viendo: Solo mis solicitudes' : 'Viendo: Todas las solicitudes'}
                </button>
              )}

              {/* Urgencia Filter */}
              <select
                value={filterUrgencia}
                onChange={(e) => setFilterUrgencia(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Toda Urgencia</option>
                <option value="urgente">🚨 Urgente</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>

              {/* Estado Filter */}
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos los Estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En Preparación</option>
                <option value="despachado">Despachado</option>
                <option value="observado">Observado</option>
              </select>

              {(searchTerm || filterUrgencia !== 'todos' || filterEstado !== 'todos' || adminViewOnlyMine) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterUrgencia('todos');
                    setFilterEstado('todos');
                    setAdminViewOnlyMine(false);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-auto"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">N° Reserva</th>
                    <th className="py-2.5 px-3">Posición</th>
                    <th className="py-2.5 px-3">Urgencia</th>
                    <th className="py-2.5 px-3">Estado</th>
                    {!isSolicitante && <th className="py-2.5 px-3">Solicitante</th>}
                    <th className="py-2.5 px-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        Hora Registro (Auto)
                      </div>
                    </th>
                    <th className="py-2.5 px-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Hora Modificación (Auto)
                      </div>
                    </th>
                    <th className="py-2.5 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={!isSolicitante ? 8 : 7} className="py-12 text-center text-slate-400">
                        <div className="max-w-xs mx-auto space-y-1">
                          <div className="font-semibold text-slate-600 text-sm">
                            {visibleReservations.length === 0
                              ? isSolicitante
                                ? 'No tiene reservas registradas con su usuario'
                                : 'No hay reservas registradas'
                              : 'No se encontraron reservas con los criterios'}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {visibleReservations.length === 0
                              ? isSolicitante
                                ? 'Utilice el formulario de la izquierda para registrar una nueva solicitud.'
                                : 'Todas las reservas han sido eliminadas. Utilice el formulario de la izquierda para registrar una nueva solicitud.'
                              : 'Intente limpiar los filtros o el término de búsqueda.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          item.nivelUrgencia === 'urgente' && item.estado === 'pendiente' ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {item.numeroReserva}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                          {item.numeroPosicion}
                        </td>
                        <td className="py-3 px-3">
                          {getUrgencyBadge(item.nivelUrgencia)}
                        </td>
                        <td className="py-3 px-3">
                          {getStatusBadge(item.estado)}
                        </td>
                        {!isSolicitante && (
                          <td className="py-3 px-3 text-slate-700 font-medium">
                            <span className="inline-flex items-center gap-1">
                              {item.solicitanteNombre}
                              {item.solicitanteId === currentUser?.id && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                                  Tú
                                </span>
                              )}
                            </span>
                          </td>
                        )}
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                          {item.horaRegistroFormato}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px]">
                          <span className={`${
                            item.horaModificacion !== item.horaRegistro ? 'text-amber-700 font-bold bg-amber-50 px-1 py-0.5 rounded' : 'text-slate-500'
                          }`}>
                            {item.horaModificacionFormato}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* History button */}
                            <button
                              onClick={() => setAuditReservation(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                              title="Ver historial de cambios"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit button */}
                            {(hasPermission('canEditAll') || (hasPermission('canEditOwn') && item.solicitanteId === currentUser?.id)) && (
                              <button
                                onClick={() => setEditingReservation(item)}
                                className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                title="Modificar reserva"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete button - Exclusivo para Administrador */}
                            {(currentUser?.role === 'admin' || hasPermission('canDelete')) && (
                              <button
                                onClick={() => handleDelete(item.id, item.numeroReserva)}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors shadow-2xs active:scale-95"
                                title="Eliminar reserva (Rol Administrador)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>

      {/* Edit Reservation Modal */}
      {editingReservation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              Modificar Solicitud de Reserva
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Al guardar, la <span className="font-semibold text-blue-600">hora de modificación</span> se actualizará en automático y quedará registrada en el historial y en el Excel.
            </p>

            <form onSubmit={handleUpdate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">N° de Reserva</label>
                <input
                  type="text"
                  required
                  value={editingReservation.numeroReserva}
                  onChange={(e) => setEditingReservation({ ...editingReservation, numeroReserva: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">N° de Posición</label>
                <input
                  type="text"
                  required
                  value={editingReservation.numeroPosicion}
                  onChange={(e) => setEditingReservation({ ...editingReservation, numeroPosicion: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nivel de Urgencia</label>
                <select
                  value={editingReservation.nivelUrgencia}
                  onChange={(e) => setEditingReservation({ ...editingReservation, nivelUrgencia: e.target.value as UrgencyLevel })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">🚨 Urgente / Crítica</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ubicación / Casillero</label>
                <input
                  type="text"
                  value={editingReservation.ubicacionAlmacen || ''}
                  onChange={(e) => setEditingReservation({ ...editingReservation, ubicacionAlmacen: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={editingReservation.observaciones || ''}
                  onChange={(e) => setEditingReservation({ ...editingReservation, observaciones: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {(currentUser?.role === 'admin' || hasPermission('canDelete')) ? (
                  <button
                    type="button"
                    onClick={() => {
                      const toDelete = editingReservation;
                      setEditingReservation(null);
                      handleDelete(toDelete.id, toDelete.numeroReserva);
                    }}
                    className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold flex items-center gap-1.5 text-xs transition-colors border border-rose-200"
                    title="Eliminar esta reserva (Rol Administrador)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar Reserva
                  </button>
                ) : <div />}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingReservation(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                  >
                    Guardar Modificación
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit History Modal */}
      {auditReservation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  Historial de Modificaciones
                </h3>
                <p className="text-xs text-slate-500">
                  Reserva: <span className="font-mono font-bold text-slate-800">{auditReservation.numeroReserva}</span> (Posición: {auditReservation.numeroPosicion})
                </p>
              </div>
              <button
                onClick={() => setAuditReservation(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-xs">
                <span className="font-bold text-blue-900">Hora de Registro:</span>{' '}
                <span className="font-mono text-blue-800">{auditReservation.horaRegistroFormato}</span>
                <br />
                <span className="font-bold text-amber-900">Última Modificación:</span>{' '}
                <span className="font-mono text-amber-800">{auditReservation.horaModificacionFormato}</span>
              </div>

              <div className="space-y-2 mt-2">
                {auditReservation.historial.map((entry) => (
                  <div key={entry.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{entry.accion}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{entry.fechaFormato}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{entry.detalle}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">Por: {entry.usuario}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setAuditReservation(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
