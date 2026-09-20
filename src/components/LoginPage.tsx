import React, { useState } from 'react';
import { 
  PackageCheck, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Wifi, 
  BookOpen, 
  FileSpreadsheet,
  Clock,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface LoginPageProps {
  onOpenNetwork?: () => void;
  onOpenDocs?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenNetwork, onOpenDocs }) => {
  const { loginCustom, registerUser } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('solicitante');
  const [regDepartment, setRegDepartment] = useState('');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim()) {
      setErrorMsg('Por favor ingresa tu nombre de usuario');
      return;
    }
    if (!password) {
      setErrorMsg('Por favor ingresa tu contraseña');
      return;
    }

    setIsLoading(true);
    try {
      await loginCustom(username.trim().toLowerCase(), password, rememberMe);
    } catch (err: any) {
      setErrorMsg(err.message || 'Credenciales inválidas. Verifica tu usuario y contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim() || !regUsername.trim() || !regPassword) {
      setErrorMsg('Por favor completa todos los campos requeridos');
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({
        name: regName.trim(),
        username: regUsername.trim().toLowerCase(),
        password: regPassword,
        role: regRole,
        department: regDepartment.trim() || (regRole === 'solicitante' ? 'Línea de Ensamble' : 'Almacén Central'),
      });
      setSuccessMsg('¡Cuenta registrada exitosamente!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear la cuenta. Intenta con otro nombre de usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans text-slate-100">
      
      {/* Top Header / Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-white block leading-none">
              Sistema de Reservas
            </span>
            <span className="text-[11px] text-blue-300 font-mono">
              Control de Pedidos y Despacho en Almacén
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenNetwork && (
            <button
              onClick={onOpenNetwork}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs text-slate-200 transition-colors flex items-center gap-1.5 backdrop-blur-xs"
              title="Ver IPs de red y código QR para celular"
            >
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Compartir Red / QR</span>
            </button>
          )}

          {onOpenDocs && (
            <button
              onClick={onOpenDocs}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs text-slate-200 transition-colors flex items-center gap-1.5 backdrop-blur-xs"
              title="Manual y especificaciones"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Manual</span>
            </button>
          )}

          <a
            href="/api/project/download-zip"
            download="sistema-solicitud-reservas.zip"
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 border border-blue-400/40 text-xs font-semibold text-white transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95"
            title="Descargar la página completa y código fuente en archivo .ZIP"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Descargar Proyecto (.ZIP)</span>
            <span className="sm:hidden">Descargar</span>
          </a>
        </div>
      </div>

      {/* Main Content Card Container */}
      <div className="max-w-4xl w-full mx-auto my-6 sm:my-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left / Top Info Banner (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900/80 via-blue-900/60 to-slate-900/80 rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              Autenticación y Seguridad
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Gestión Integral de Solicitudes y Despacho
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
              Inicia sesión con tu cuenta corporativa para registrar solicitudes de materiales, atender colas de despacho en tiempo real o supervisar la auditoría operativa.
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-white block">Marcas de Tiempo Automáticas</span>
                  <span className="text-slate-300 text-[11px]">Registro y modificación cronometrados al segundo sin margen de error.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-white block">Sincronización en Vivo con Excel</span>
                  <span className="text-slate-300 text-[11px]">Guardado continuo en <code className="text-emerald-300">solicitud_reservas.xlsx</code>.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-white block">Perfiles con Permisos Granulares</span>
                  <span className="text-slate-300 text-[11px]">Acceso segmentado para Solicitante, Despachador y Administrador.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>Sistema Operativo v1.0</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Servidor Activo
            </span>
          </div>
        </div>

        {/* Right Form Card (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col justify-between">
          
          <div>
            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 mb-6">
              <button
                type="button"
                id="tab-login"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                id="tab-register"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === 'register'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Registrar Nueva Cuenta
              </button>
            </div>

            {/* Error & Success Feedback Alerts */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-snug">{errorMsg}</div>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-snug">{successMsg}</div>
              </div>
            )}

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="login-username">
                    Nombre de Usuario
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      id="login-username"
                      type="text"
                      autoFocus
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ej. admin, solicitante, despachador"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700" htmlFor="login-password">
                      Contraseña
                    </label>
                    <span className="text-[11px] text-slate-400">
                      (Por defecto: <span className="font-mono text-slate-600">123</span> o <span className="font-mono text-slate-600">admin</span>)
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Recordar sesión en este equipo</span>
                  </label>
                </div>

                <button
                  type="submit"
                  id="btn-submit-login"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Verificando credenciales...</span>
                  ) : (
                    <>
                      <span>Ingresar al Sistema</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="reg-name">
                    Nombre Completo *
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ej. Roberto Sánchez Gómez"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="reg-username">
                      Nombre de Usuario *
                    </label>
                    <input
                      id="reg-username"
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase())}
                      placeholder="Ej. rsanchez"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="reg-password">
                      Contraseña *
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="reg-role">
                      Perfil o Rol *
                    </label>
                    <select
                      id="reg-role"
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900"
                    >
                      <option value="solicitante">Solicitante (Crea reservas y seguimiento)</option>
                      <option value="despachador">Despachador (Atiende cola de almacén)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="reg-department">
                      Área o Departamento
                    </label>
                    <input
                      id="reg-department"
                      type="text"
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      placeholder="Ej. Mantenimiento / Turno Noche"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-submit-register"
                  disabled={isLoading}
                  className="w-full py-3 px-4 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? 'Registrando cuenta...' : 'Crear Cuenta e Ingresar'}
                </button>
              </form>
            )}

          </div>

          <div className="mt-5 text-center text-[11px] text-slate-400">
            Control de Acceso Seguro &bull; Registro Automático de Marcas de Tiempo &bull; Excel Sincronizado
          </div>

        </div>

      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center text-xs text-slate-400 py-2">
        Sistema de Solicitud de Reservas &copy; {new Date().getFullYear()} — Plataforma Multiplataforma para Almacén y Producción
      </div>

    </div>
  );
};
