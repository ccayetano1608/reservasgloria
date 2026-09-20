import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Layers, 
  Clock, 
  FileSpreadsheet, 
  Shield, 
  Wifi, 
  Cpu, 
  X, 
  Code2, 
  ArrowRight,
  Sparkles,
  Download,
  FolderArchive,
  Terminal,
  FileCode
} from 'lucide-react';

interface DocumentationModalProps {
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState<'general' | 'tiempos' | 'excel' | 'roles' | 'red' | 'escalabilidad' | 'descarga'>('general');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Documentación del Sistema y Manual de Operaciones
              </h3>
              <p className="text-xs text-slate-500">
                Guía técnica, operacional y arquitectónica para mantenimiento y extensiones futuras.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content with Sidebar Navigation */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Navigation Menu */}
          <div className="w-full md:w-60 bg-slate-50 p-3 border-b md:border-b-0 md:border-r border-slate-200 space-y-1 text-xs shrink-0 overflow-y-auto">
            <button
              onClick={() => setActiveSection('general')}
              className={`w-full text-left px-3 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors ${
                activeSection === 'general' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              1. Visión General
            </button>
            <button
              onClick={() => setActiveSection('tiempos')}
              className={`w-full text-left px-3 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors ${
                activeSection === 'tiempos' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              2. Marcas de Tiempo
            </button>
            <button
              onClick={() => setActiveSection('excel')}
              className={`w-full text-left px-3 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors ${
                activeSection === 'excel' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              3. Almacenamiento en Excel
            </button>
            <button
              onClick={() => setActiveSection('roles')}
              className={`w-full text-left px-3 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors ${
                activeSection === 'roles' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              4. Roles y Permisos
            </button>
            <button
              onClick={() => setActiveSection('red')}
              className={`w-full text-left px-3 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors ${
                activeSection === 'red' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Wifi className="w-4 h-4" />
              5. Despliegue Red / 8080
            </button>
            <button
              onClick={() => setActiveSection('escalabilidad')}
              className={`w-full text-left px-3 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors ${
                activeSection === 'escalabilidad' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4" />
              6. Escalabilidad y Futuro
            </button>

            <button
              onClick={() => setActiveSection('descarga')}
              className={`w-full text-left px-3 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors border ${
                activeSection === 'descarga'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'text-blue-700 bg-blue-50/80 hover:bg-blue-100 border-blue-200'
              }`}
            >
              <Download className="w-4 h-4 text-blue-500" />
              7. Descargar Código / ZIP
            </button>
          </div>

          {/* Section Body */}
          <div className="flex-1 p-6 overflow-y-auto text-xs text-slate-700 leading-relaxed space-y-4">
            
            {activeSection === 'general' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 border-b pb-2">
                  1. Visión General del Sistema de Reservas
                </h4>
                <p>
                  Esta solución full-stack ha sido diseñada para optimizar y sincronizar el ciclo de vida de los pedidos y reservas de materiales entre las áreas de producción/operación (<strong>Solicitantes</strong>) y el almacén (<strong>Despachadores</strong>), supervisado por un panel de control para <strong>Administradores</strong>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <strong className="block text-blue-900 font-bold mb-1">Módulo Solicitante</strong>
                    Ingreso ágil de Número de Reserva, Número de Posición y Nivel de Urgencia (Baja, Media, Alta, Urgente).
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <strong className="block text-emerald-900 font-bold mb-1">Módulo Despachador</strong>
                    Cola visual de atención en tiempo real priorizada por criticidad, con acciones de inicio de preparación y despacho.
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                    <strong className="block text-purple-900 font-bold mb-1">Panel Administrador</strong>
                    Gestión granular de permisos por cuenta, auditoría global y sincronización con Microsoft Excel.
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'tiempos' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 border-b pb-2">
                  2. Registro Automático de Marcas de Tiempo
                </h4>
                <p>
                  El sistema garantiza rigor temporal y auditoría estricta sin requerir intervención manual de los usuarios:
                </p>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Hora de Registro (Automática):
                    </div>
                    <p className="mt-1 text-slate-600">
                      Se captura en el servidor inmediatamente cuando el Solicitante confirma el formulario. Se almacena tanto en formato estándar ISO-8601 (para ordenamiento y cálculos de tiempo de espera) como en formato legible (<code>DD/MM/AAAA HH:mm:ss</code>).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Hora de Modificación (Automática):
                    </div>
                    <p className="mt-1 text-slate-600">
                      Se actualiza automáticamente en cada evento sobre la reserva: cuando el despachador inicia preparación, cuando se cambia la ubicación en almacén, cuando se agrega una nota o cuando se entrega. Cada cambio genera una entrada de auditoría con autor y detalle.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'excel' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 border-b pb-2">
                  3. Almacenamiento y Sincronización en Excel (SheetJS)
                </h4>
                <p>
                  Todos los datos de solicitudes y modificaciones se almacenan de manera persistente en un libro de Microsoft Excel real ubicado en el servidor (<code>data/solicitud_reservas.xlsx</code>).
                </p>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px]">
                  <div>Columnas de la Hoja 'Reservas_Activas':</div>
                  <div className="text-emerald-400 mt-1">
                    ID | N° Reserva | N° Posición | Nivel de Urgencia | Estado | Solicitante | Hora de Registro | Hora de Modificación | Despachador | Ubicación Almacén | Observaciones
                  </div>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong>Actualización en tiempo real:</strong> En cada POST o PUT de reserva, el servidor reescribe la hoja con anchos de columna adaptados y añade el historial en la hoja complementaria <code>Auditoria_Historial</code>.</li>
                  <li><strong>Descarga en un clic:</strong> Cualquier usuario con permiso de exportación puede descargar el <code>.xlsx</code> oficial en cualquier momento desde el botón "Excel en Vivo".</li>
                </ul>
              </div>
            )}

            {activeSection === 'roles' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 border-b pb-2">
                  4. Control de Acceso y Permisos Granulares
                </h4>
                <p>
                  La seguridad de la aplicación está dividida en tres perfiles con matriz de permisos configurable por el Administrador:
                </p>
                <table className="w-full border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-800">
                      <th className="border p-2">Permiso</th>
                      <th className="border p-2">Solicitante</th>
                      <th className="border p-2">Despachador</th>
                      <th className="border p-2">Administrador</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2 font-medium">Crear Solicitudes (canCreate)</td>
                      <td className="border p-2 text-center text-emerald-600 font-bold">✓</td>
                      <td className="border p-2 text-center text-slate-400">✗</td>
                      <td className="border p-2 text-center text-emerald-600 font-bold">✓</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium">Atender Despacho (canDispatch)</td>
                      <td className="border p-2 text-center text-slate-400">✗</td>
                      <td className="border p-2 text-center text-emerald-600 font-bold">✓</td>
                      <td className="border p-2 text-center text-emerald-600 font-bold">✓</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium">Modificar Cualquier Reserva (canEditAll)</td>
                      <td className="border p-2 text-center text-slate-400">✗</td>
                      <td className="border p-2 text-center text-slate-400">✗</td>
                      <td className="border p-2 text-center text-emerald-600 font-bold">✓</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium">Administrar Cuentas (canManageUsers)</td>
                      <td className="border p-2 text-center text-slate-400">✗</td>
                      <td className="border p-2 text-center text-slate-400">✗</td>
                      <td className="border p-2 text-center text-emerald-600 font-bold">✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeSection === 'red' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 border-b pb-2">
                  5. Guía de Ejecución Remota mediante IP (Python 3 y Red Local)
                </h4>
                <p>
                  Para desplegar de forma remota en cualquier servidor, PC o máquina de la red usando <strong>Python 3</strong> (sin necesidad de configurar Node.js ni paquetes externos):
                </p>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] space-y-2">
                  <div className="text-slate-400"># Ejecución nativa con Python 3 (escucha en 0.0.0.0:8080 para acceso remoto por IP):</div>
                  <div className="text-amber-300 font-bold">python3 server.py --host 0.0.0.0 --port 8080</div>
                  <div className="text-slate-400 mt-2"># O en Windows CMD / PowerShell:</div>
                  <div className="text-amber-300 font-bold">python server.py --host 0.0.0.0 --port 8080</div>
                  <div className="text-slate-400 mt-2"># O con los scripts automáticos de 1 clic incluidos:</div>
                  <div className="text-emerald-400">iniciar_con_python.bat (Windows) / ./iniciar_con_python.sh (Linux/macOS)</div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-xs">
                  <strong>Acceso Remoto por IP:</strong>
                  El servidor se enlaza a <code>0.0.0.0:8080</code> escuchando en todas las interfaces de red del equipo anfitrión. Los demás dispositivos (PCs de despacho, teléfonos, terminales móviles) pueden acceder de inmediato ingresando en su navegador <code>http://[DIRECCION_IP]:8080</code> (ejemplo <code>http://192.168.1.50:8080</code>).
                </div>
              </div>
            )}

            {activeSection === 'escalabilidad' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 border-b pb-2">
                  6. Escalabilidad y Futuras Implementaciones
                </h4>
                <p>
                  La arquitectura modular desacoplada permite incorporar con mínima fricción las siguientes capacidades:
                </p>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <strong className="text-slate-900 font-bold">1. Escáner de Códigos de Barras / QR:</strong>
                    <p className="mt-0.5 text-slate-600">Integración con lectores ópticos USB o cámaras móviles para escanear el número de reserva o posición al instante.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <strong className="text-slate-900 font-bold">2. Conexión con ERP Corporativo (SAP / Oracle / Odoo):</strong>
                    <p className="mt-0.5 text-slate-600">Los endpoints REST ya devuelven respuestas JSON canónicas listas para ser consumidas por un servicio intermediario o webhook de almacén.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <strong className="text-slate-900 font-bold">3. Base de Datos Relacional / Cloud SQL:</strong>
                    <p className="mt-0.5 text-slate-600">El modelo en <code>server.ts</code> está aislado, permitiendo sustituir el almacenamiento JSON por PostgreSQL o SQL Server simplemente modificando las funciones de lectura/escritura.</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'descarga' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      7. Descarga del Proyecto Completo y Ejecución Local
                    </h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Descarga el código fuente completo con scripts de 1 clic para ejecutarlo en tu computadora o red LAN.
                    </p>
                  </div>
                  <a
                    href="/api/project/download-zip"
                    download="sistema-solicitud-reservas.zip"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs"
                  >
                    <Download className="w-4 h-4" />
                    Descargar .ZIP Ahora
                  </a>
                </div>

                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-900">
                    <FolderArchive className="w-4 h-4 text-blue-600" />
                    ¿Qué incluye el archivo descargado?
                  </div>
                  <ul className="list-disc list-inside text-slate-700 space-y-1 pl-1">
                    <li><strong>Servidor Remoto en Python 3:</strong> <code>server.py</code> (cero dependencias externas, corre con Python nativo) para ejecución remota por IP.</li>
                    <li><strong>Código Frontend Compilado:</strong> Carpeta <code>dist/</code> lista para servir inmediatamente sin requerir Node ni npm.</li>
                    <li><strong>Sincronización en Excel y Base de Datos:</strong> Archivo <code>solicitud_reservas.xlsx</code> y persistencia JSON en <code>data/</code>.</li>
                    <li><strong>Scripts de Inicio Automático (1 Clic):</strong> <code>iniciar_con_python.bat</code> (Windows) e <code>iniciar_con_python.sh</code> (Linux/Mac).</li>
                    <li><strong>Servidor Node.js Alternativo:</strong> Código TypeScript y <code>server.ts</code> por si se desea usar con Node.js.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h5 className="font-bold text-slate-900 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-700" />
                    Ejecución Remota mediante IP en Python 3 (Recomendado):
                  </h5>

                  <div className="space-y-2">
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                      <strong className="text-amber-950 font-bold">Método 1 (Directo con Python 3 - 0 Instalaciones previas):</strong>
                      <p className="mt-1 text-slate-700">
                        1. Descomprime el archivo <code>sistema-solicitud-reservas.zip</code> en el servidor o PC remota.<br />
                        2. Haz doble clic en <code>iniciar_con_python.bat</code> (en Windows) o ejecuta <code>./iniciar_con_python.sh</code> (en Linux).<br />
                        3. El servidor Python escuchará en <code>0.0.0.0:8080</code>, permitiendo el ingreso remoto desde cualquier teléfono o PC mediante la dirección IP.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <strong className="text-slate-900 font-bold">Método 2 (Vía Consola / SSH Remoto):</strong>
                      <p className="mt-1 text-slate-600">
                        Si te conectas por SSH o terminal a un servidor remoto, ejecuta:
                      </p>
                      <pre className="mt-2 p-2 bg-slate-900 text-amber-300 rounded-lg font-mono text-[11px] overflow-x-auto">
{`# Escuchar en todas las interfaces de red (0.0.0.0) y puerto 8080:
python3 server.py --host 0.0.0.0 --port 8080     # (Linux / macOS / VPS)
python server.py --host 0.0.0.0 --port 8080      # (Windows CMD)`}
                      </pre>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <strong className="text-slate-900 font-bold">Conexión por IP desde otros dispositivos:</strong>
                      <p className="mt-1 text-slate-600">
                        Desde cualquier computadora, smartphone o tablet en la misma red, abre el navegador e ingresa:
                      </p>
                      <code className="block mt-1 p-1.5 bg-blue-50 text-blue-900 font-mono text-xs rounded border border-blue-200">
                        http://[DIRECCION_IP_DEL_SERVIDOR]:8080   (Ej: http://192.168.1.100:8080)
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Documentación generada para Sistema de Solicitud de Reservas v1.0
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/api/project/download-zip"
              download="sistema-solicitud-reservas.zip"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Proyecto (.ZIP)</span>
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
