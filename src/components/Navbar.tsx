import React, { useState, useRef, useEffect } from 'react';
import { 
  PackageCheck, 
  Wifi, 
  WifiOff, 
  Bell, 
  Volume2, 
  VolumeX, 
  FileSpreadsheet, 
  QrCode, 
  HelpCircle, 
  Shield, 
  UserCheck, 
  Truck, 
  ChevronDown, 
  Clock, 
  CheckCheck,
  AlertCircle,
  LogOut,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { UserRole } from '../types';

interface NavbarProps {
  onOpenExcel: () => void;
  onOpenNetwork: () => void;
  onOpenDocs: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenExcel,
  onOpenNetwork,
  onOpenDocs,
  activeTab,
  setActiveTab,
}) => {
  const { currentUser, logout } = useAuth();
  const { 
    connected, 
    notifications, 
    unreadNotifCount, 
    markNotificationsAsRead, 
    soundMuted, 
    toggleSound 
  } = useRealtime();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleNotif = () => {
    if (!showNotifMenu && unreadNotifCount > 0) {
      markNotificationsAsRead();
    }
    setShowNotifMenu(!showNotifMenu);
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrador',
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: Shield,
        };
      case 'despachador':
        return {
          label: 'Despachador',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: Truck,
        };
      case 'solicitante':
      default:
        return {
          label: 'Solicitante',
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: UserCheck,
        };
    }
  };

  const currentBadge = getRoleBadge(currentUser?.role);
  const RoleIcon = currentBadge.icon;
  const isAdmin = currentUser?.role === 'admin';


  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand & Connection status */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight truncate">
                  Gestión de Reservas
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  v1.0 Local/LAN
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                {connected ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-emerald-700 font-medium">Sincronización en Tiempo Real</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="text-amber-700 font-medium">Reconectando SSE...</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Accessible ONLY by Administrator */}
          {isAdmin ? (
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                id="nav-tab-solicitudes"
                onClick={() => setActiveTab('solicitudes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'solicitudes'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista de Solicitante"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Solicitante
              </button>
              <button
                id="nav-tab-despacho"
                onClick={() => setActiveTab('despacho')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'despacho'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista de Despachador"
              >
                <Truck className="w-3.5 h-3.5" />
                Despachador
              </button>
              <button
                id="nav-tab-admin"
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Panel de Administración"
              >
                <Shield className="w-3.5 h-3.5" />
                Administración
              </button>
            </nav>
          ) : (
            /* Non-admin role module display */
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
              <span className="text-slate-400 font-normal">Módulo:</span>
              <span className="font-bold flex items-center gap-1.5 text-slate-800">
                {currentUser?.role === 'despachador' ? (
                  <>
                    <Truck className="w-4 h-4 text-emerald-600" />
                    Panel de Despacho
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    Portal de Solicitudes
                  </>
                )}
              </span>
            </div>
          )}

          {/* Right utility actions */}
          <div className="flex items-center gap-2">
            {/* Live Excel Action Button */}
            <button
              id="btn-open-excel"
              onClick={onOpenExcel}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              title="Abrir hoja Excel sincronizada"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Excel en Vivo</span>
            </button>

            {/* Network / LAN Sharing Info */}
            <button
              id="btn-open-network"
              onClick={onOpenNetwork}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="Compartir en red local (Puerto 8080 / IP)"
            >
              <QrCode className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Red / IP</span>
            </button>

            {/* Sound Toggle */}
            <button
              id="btn-toggle-sound"
              onClick={toggleSound}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title={soundMuted ? 'Activar sonido de notificaciones' : 'Silenciar notificaciones'}
            >
              {soundMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
            </button>

            {/* Notifications Menu */}
            <div className="relative" ref={notifRef}>
              <button
                id="btn-notifications-menu"
                onClick={handleToggleNotif}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Notificaciones en tiempo real"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xs">
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Notificaciones en Vivo
                    </span>
                    <button
                      onClick={markNotificationsAsRead}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Marcar leídas
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No hay notificaciones recientes
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition-colors hover:bg-slate-50 ${
                            !n.leido ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {n.tipo === 'urgente' ? (
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            ) : (
                              <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 leading-snug truncate">
                                {n.titulo}
                              </p>
                              <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">
                                {n.mensaje}
                              </p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {n.fechaFormato}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Docs button */}
            <button
              id="btn-open-docs"
              onClick={onOpenDocs}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Documentación técnica y operativa"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Download Project ZIP */}
            <a
              id="btn-download-project-nav"
              href="/api/project/download-zip"
              download="sistema-solicitud-reservas.zip"
              className="px-3 py-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-xs"
              title="Descargar el proyecto completo en archivo .ZIP para ejecutar en PC local o servidor remoto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar ZIP</span>
            </a>

            <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />

            {/* Quick Role & Profile Dropdown */}
            <div className="relative" ref={roleRef}>
              <button
                id="btn-role-selector"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <div className={`p-1 rounded-md border ${currentBadge.bg}`}>
                  <RoleIcon className="w-3.5 h-3.5" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-none">
                    {currentUser?.name || 'Usuario'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {currentBadge.label}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 animate-in fade-in slide-in-from-top-2">
                  {/* Active User Card */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${currentBadge.bg}`}>
                        {currentBadge.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        @{currentUser?.username}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-xs mt-1.5 truncate">
                      {currentUser?.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {currentUser?.department || 'Área General'}
                    </p>
                  </div>

                  {/* For Admin only: view switching shortcuts */}
                  {isAdmin && (
                    <>
                      <div className="px-2 py-1 border-t border-slate-100 mb-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Navegar Vistas (Admin)
                        </p>
                      </div>

                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setActiveTab('solicitudes');
                            setShowRoleMenu(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                            activeTab === 'solicitudes'
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                          <div className="min-w-0">
                            <div>Vista Solicitante</div>
                            <div className="text-[10px] text-slate-400 font-normal truncate">Portal de creación de reservas</div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab('despacho');
                            setShowRoleMenu(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                            activeTab === 'despacho'
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="min-w-0">
                            <div>Vista Despachador</div>
                            <div className="text-[10px] text-slate-400 font-normal truncate">Cola de atención y despacho</div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab('admin');
                            setShowRoleMenu(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                            activeTab === 'admin'
                              ? 'bg-purple-50 text-purple-700 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <Shield className="w-4 h-4 text-purple-600 shrink-0" />
                          <div className="min-w-0">
                            <div>Vista Administrador</div>
                            <div className="text-[10px] text-slate-400 font-normal truncate">Gestión de usuarios y auditoría</div>
                          </div>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Download ZIP link in menu */}
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <a
                      href="/api/project/download-zip"
                      download="sistema-solicitud-reservas.zip"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors text-left"
                      onClick={() => setShowRoleMenu(false)}
                    >
                      <Download className="w-4 h-4 text-blue-600" />
                      <span>Descargar Proyecto (.ZIP)</span>
                    </a>
                  </div>

                  {/* Logout Button */}
                  <div className="mt-1 pt-1 border-t border-slate-100">
                    <button
                      id="btn-logout"
                      onClick={() => {
                        setShowRoleMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Quick Logout Header Icon for fast desktop sign-out */}
            <button
              id="btn-quick-header-logout"
              onClick={logout}
              title="Cerrar sesión"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors hidden sm:flex items-center"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>
        </div>

        {/* Mobile Sub-Navigation Tabs - Only Admin can switch views */}
        {isAdmin ? (
          <div className="flex lg:hidden items-center justify-around py-2 border-t border-slate-200">
            <button
              onClick={() => setActiveTab('solicitudes')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                activeTab === 'solicitudes' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Solicitante
            </button>
            <button
              onClick={() => setActiveTab('despacho')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                activeTab === 'despacho' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Despachador
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                activeTab === 'admin' ? 'bg-purple-50 text-purple-700' : 'text-slate-600'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
            <button
              onClick={logout}
              title="Cerrar Sesión"
              className="px-2 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-[11px]">Salir</span>
            </button>
          </div>
        ) : (
          <div className="flex lg:hidden items-center justify-between px-4 py-2 border-t border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              {currentUser?.role === 'despachador' ? (
                <>
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Panel de Despacho</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Portal de Solicitante</span>
                </>
              )}
            </div>
            <button
              onClick={logout}
              className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}

      </div>
    </header>
  );
};
