import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider, useRealtime } from './context/RealtimeContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { SolicitanteView } from './components/SolicitanteView';
import { DespachadorView } from './components/DespachadorView';
import { AdminPanel } from './components/AdminPanel';
import { ExcelViewerModal } from './components/ExcelViewerModal';
import { NetworkSharingModal } from './components/NetworkSharingModal';
import { DocumentationModal } from './components/DocumentationModal';
import { AlertCircle, Clock, X, Bell, Loader2 } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const { activeToast, dismissToast } = useRealtime();

  // Active view tab: 'solicitudes' | 'despacho' | 'admin'
  const [activeTab, setActiveTab] = useState<string>('solicitudes');

  // Modals
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);

  // Security role check: Only Admin can access all 3 views
  const isAdmin = currentUser?.role === 'admin';
  const effectiveTab = isAdmin
    ? activeTab
    : (currentUser?.role === 'despachador' ? 'despacho' : 'solicitudes');

  // Sync default tab when user changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'despachador') {
        setActiveTab('despacho');
      } else if (currentUser.role === 'solicitante') {
        setActiveTab('solicitudes');
      } else if (currentUser.role === 'admin') {
        setActiveTab((prev) => (prev === 'solicitudes' || prev === 'despacho' || prev === 'admin' ? prev : 'admin'));
      }
    }
  }, [currentUser?.id, currentUser?.role]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-100 font-sans p-4">
        <div className="flex flex-col items-center gap-3 animate-in fade-in">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm font-semibold tracking-wide text-slate-300">
            Cargando Sistema de Reservas...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Login Page
  if (!currentUser) {
    return (
      <>
        <LoginPage
          onOpenNetwork={() => setShowNetworkModal(true)}
          onOpenDocs={() => setShowDocsModal(true)}
        />

        {showNetworkModal && (
          <NetworkSharingModal onClose={() => setShowNetworkModal(false)} />
        )}

        {showDocsModal && (
          <DocumentationModal onClose={() => setShowDocsModal(false)} />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        onOpenExcel={() => setShowExcelModal(true)}
        onOpenNetwork={() => setShowNetworkModal(true)}
        onOpenDocs={() => setShowDocsModal(true)}
        activeTab={effectiveTab}
        setActiveTab={(tab) => {
          if (isAdmin) {
            setActiveTab(tab);
          }
        }}
      />

      {/* Main Container - strictly controlled by role */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {effectiveTab === 'solicitudes' && <SolicitanteView />}
        {effectiveTab === 'despacho' && <DespachadorView />}
        {effectiveTab === 'admin' && (isAdmin ? <AdminPanel /> : <SolicitanteView />)}
      </main>

      {/* Real-time Toast Alert */}
      {activeToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5 fade-in duration-300 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-600/30 text-blue-400 shrink-0">
            {activeToast.tipo === 'urgente' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 animate-pulse" />
            ) : (
              <Bell className="w-5 h-5 text-blue-400" />
            )}
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <div className="font-bold text-slate-100 text-sm">{activeToast.titulo}</div>
            <div className="text-slate-300 mt-0.5 leading-snug">{activeToast.mensaje}</div>
            <div className="text-[10px] text-slate-500 font-mono mt-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {activeToast.fechaFormato}
            </div>
          </div>
          <button
            onClick={dismissToast}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modals */}
      {showExcelModal && (
        <ExcelViewerModal onClose={() => setShowExcelModal(false)} />
      )}

      {showNetworkModal && (
        <NetworkSharingModal onClose={() => setShowNetworkModal(false)} />
      )}

      {showDocsModal && (
        <DocumentationModal onClose={() => setShowDocsModal(false)} />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Sistema de Solicitud de Reservas &copy; {new Date().getFullYear()} — Registro Automático de Tiempos y Excel en Vivo.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDocsModal(true)}
              className="hover:text-blue-600 underline font-medium"
            >
              Manual y Documentación
            </button>
            <span>•</span>
            <button
              onClick={() => setShowNetworkModal(true)}
              className="hover:text-blue-600 underline font-medium"
            >
              Compartir en Puerto 8080 / IP
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <MainContent />
      </RealtimeProvider>
    </AuthProvider>
  );
}
