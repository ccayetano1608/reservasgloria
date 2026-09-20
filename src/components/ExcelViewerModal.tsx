import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Download, RefreshCw, X, Table, CheckCircle2, UserCheck } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ExcelSheetRow } from '../types';

interface ExcelViewerModalProps {
  onClose: () => void;
}

export const ExcelViewerModal: React.FC<ExcelViewerModalProps> = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [rows, setRows] = useState<ExcelSheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastModified, setLastModified] = useState<string | null>(null);

  const isSolicitante = currentUser?.role === 'solicitante';

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getExcelData(currentUser?.id);
      let loadedRows = data.rows || [];
      if (isSolicitante && currentUser?.name) {
        loadedRows = loadedRows.filter(
          (r) => r['Solicitante']?.trim().toLowerCase() === currentUser.name.trim().toLowerCase()
        );
      }
      setRows(loadedRows);
      if (data.lastModified) {
        setLastModified(new Date(data.lastModified).toLocaleTimeString());
      }
    } catch (err) {
      console.error('Error loading Excel data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                Visor del Archivo Excel en Tiempo Real
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  data/solicitud_reservas.xlsx
                </span>
                {isSolicitante && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-blue-600" />
                    Mis Reservas ({currentUser?.name})
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                {isSolicitante
                  ? `Mostrando exclusivamente las reservas generadas por su usuario (${rows.length} registros cargados).`
                  : `Sincronización instantánea con cada registro o modificación (${rows.length} registros cargados).`}
                {lastModified && ` Última sincronización: ${lastModified}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Recargar datos del archivo Excel"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <a
              href={api.getExcelDownloadUrl()}
              download
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
            >
              <Download className="w-4 h-4" />
              Descargar Archivo .xlsx
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Excel Spreadsheet Table Preview */}
        <div className="flex-1 overflow-auto p-5">
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
              Leyendo hoja de cálculo del servidor...
            </div>
          ) : rows.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400">
              {isSolicitante
                ? 'No se encontraron registros de reservas para su usuario en el archivo Excel.'
                : 'El archivo Excel aún no contiene registros.'}
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-emerald-800 text-white font-bold">
                    <th className="py-2.5 px-3 border border-emerald-700">#</th>
                    <th className="py-2.5 px-3 border border-emerald-700">N° Reserva</th>
                    <th className="py-2.5 px-3 border border-emerald-700">N° Posición</th>
                    <th className="py-2.5 px-3 border border-emerald-700">Nivel de Urgencia</th>
                    <th className="py-2.5 px-3 border border-emerald-700">Estado</th>
                    <th className="py-2.5 px-3 border border-emerald-700">Solicitante</th>
                    <th className="py-2.5 px-3 border border-emerald-700">Hora de Registro</th>
                    <th className="py-2.5 px-3 border border-emerald-700">Hora de Modificación</th>
                    <th className="py-2.5 px-3 border border-emerald-700">Despachador</th>
                    <th className="py-2.5 px-3 border border-emerald-700">Ubicación</th>
                    <th className="py-2.5 px-3 border border-emerald-700">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="py-2 px-3 border border-slate-200 font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 font-mono font-bold text-slate-900">
                        {row['N° Reserva']}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 font-mono font-semibold text-slate-800">
                        {row['N° Posición']}
                      </td>
                      <td className="py-2 px-3 border border-slate-200">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row['Nivel de Urgencia'] === 'URGENTE'
                            ? 'bg-rose-100 text-rose-800'
                            : row['Nivel de Urgencia'] === 'ALTA'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {row['Nivel de Urgencia']}
                        </span>
                      </td>
                      <td className="py-2 px-3 border border-slate-200 font-semibold text-slate-700">
                        {row['Estado']}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-slate-700">
                        {row['Solicitante']}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 font-mono text-[11px] text-slate-600">
                        {row['Hora de Registro']}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 font-mono text-[11px] text-slate-600">
                        {row['Hora de Modificación']}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-slate-700">
                        {row['Despachador']}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-slate-700">
                        {row['Ubicación Almacén']}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-slate-600 max-w-xs truncate">
                        {row['Observaciones']}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Formato nativo Microsoft Excel (.xlsx) estándar compatible con Office 365, LibreOffice y Google Sheets.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-700"
          >
            Cerrar Visor
          </button>
        </div>

      </div>
    </div>
  );
};
