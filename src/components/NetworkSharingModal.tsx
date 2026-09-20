import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { 
  Wifi, 
  Copy, 
  Check, 
  Terminal, 
  ShieldCheck, 
  Globe, 
  Smartphone, 
  Laptop, 
  X,
  ExternalLink,
  Info,
  Download
} from 'lucide-react';
import { api } from '../utils/api';
import { NetworkInfo } from '../types';

interface NetworkSharingModalProps {
  onClose: () => void;
}

export const NetworkSharingModal: React.FC<NetworkSharingModalProps> = ({ onClose }) => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [executionRuntime, setExecutionRuntime] = useState<'python' | 'node'>('python');

  useEffect(() => {
    async function fetchNetwork() {
      try {
        const info = await api.getNetworkInfo();
        setNetworkInfo(info);
        const primaryIp = info.ipAddresses[0] || '127.0.0.1';
        setSelectedIp(primaryIp);

        // Target URL for QR: use window.location.origin if in browser/cloud, or the LAN IP
        const targetUrl = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
          ? `http://${primaryIp}:${info.port}`
          : window.location.origin;

        const qr = await QRCode.toDataURL(targetUrl, {
          margin: 2,
          width: 220,
          color: {
            dark: '#1e293b',
            light: '#ffffff',
          },
        });
        setQrDataUrl(qr);
      } catch (err) {
        console.error('Error fetching network info or QR:', err);
      }
    }
    fetchNetwork();
  }, []);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 3000);
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Conexión en Red Local y Compartir por IP / Puerto 8080
              </h3>
              <p className="text-xs text-slate-500">
                Acceso multiplataforma desde PCs, tablets y smartphones conectados a la red.
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* QR Code & Direct Links Box */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            {qrDataUrl ? (
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs shrink-0 text-center">
                <img src={qrDataUrl} alt="QR de acceso" className="w-36 h-36 mx-auto" />
                <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                  Escanea para conectar
                </span>
              </div>
            ) : (
              <div className="w-36 h-36 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                Cargando QR...
              </div>
            )}

            <div className="space-y-2 flex-1 w-full">
              <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-600" />
                Enlace Directo para Dispositivos en Red:
              </div>

              {/* URL actual */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentOrigin}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-800"
                />
                <button
                  onClick={() => handleCopy(currentOrigin)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center gap-1"
                >
                  {copiedUrl === currentOrigin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedUrl === currentOrigin ? 'Copiado' : 'Copiar'}
                </button>
              </div>

              {/* Local LAN IP link (if detected) */}
              {networkInfo?.ipAddresses && networkInfo.ipAddresses.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500 font-semibold block mb-1">
                    IPs locales del host detectadas en la máquina:
                  </span>
                  <div className="space-y-1">
                    {networkInfo.ipAddresses.map((ip) => {
                      const lanUrl = `http://${ip}:${networkInfo.port || 8080}`;
                      return (
                        <div key={ip} className="flex items-center justify-between bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          <span className="font-mono text-slate-700">{lanUrl}</span>
                          <button
                            onClick={() => handleCopy(lanUrl)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-[11px] flex items-center gap-1"
                          >
                            {copiedUrl === lanUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            Copiar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Guide for running remotely via IP in Python or Node */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-700" />
                Ejecución Remota mediante IP y Compartir en Red
              </h4>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                <button
                  type="button"
                  onClick={() => setExecutionRuntime('python')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                    executionRuntime === 'python'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Python 3 (Nativo)
                </button>
                <button
                  type="button"
                  onClick={() => setExecutionRuntime('node')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                    executionRuntime === 'node'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Node.js
                </button>
              </div>
            </div>

            {executionRuntime === 'python' ? (
              <div className="space-y-2">
                <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400">
                    <span># Servidor Python 3 (0 dependencias externas / No requiere npm ni pip):</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-sans font-bold">Standard Library</span>
                  </div>
                  <div className="text-slate-400"># 1. Ejecutar en Linux / macOS / Raspberry Pi:</div>
                  <div className="text-amber-300 font-bold">python3 server.py --host 0.0.0.0 --port 8080</div>

                  <div className="text-slate-400 mt-2"># 2. Ejecutar en Windows (CMD / PowerShell):</div>
                  <div className="text-amber-300 font-bold">python server.py --host 0.0.0.0 --port 8080</div>

                  <div className="text-slate-400 mt-2"># 3. O doble clic al script automático incluido:</div>
                  <div className="text-emerald-400">iniciar_con_python.bat (Windows) / ./iniciar_con_python.sh (Linux)</div>
                </div>

                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                  <strong className="block font-semibold">Ventajas de la Ejecución Remota con Python 3:</strong>
                  El archivo <code>server.py</code> corre nativamente con la biblioteca estándar de Python 3. Escucha en <code>0.0.0.0:8080</code> para admitir conexiones entrantes de cualquier equipo o dispositivo móvil en tu red mediante la dirección IP del servidor.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] space-y-2">
                  <div className="text-slate-400"># 1. Ejecutar en puerto 8080 en Linux / macOS:</div>
                  <div className="text-emerald-400">PORT=8080 npm run start</div>
                  
                  <div className="text-slate-400 mt-2"># 2. En Windows (PowerShell):</div>
                  <div className="text-emerald-400">$env:PORT=8080; npm run start</div>

                  <div className="text-slate-400 mt-2"># 3. En Windows (CMD):</div>
                  <div className="text-emerald-400">set PORT=8080 && npm run start</div>
                </div>
              </div>
            )}

            <div className="space-y-2 text-slate-600 leading-relaxed">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                <strong className="block font-semibold mb-1">Acceso Remoto dentro de tu Red Local (LAN / Wi-Fi):</strong>
                1. Asegúrate de que tanto tu PC o servidor como los teléfonos o terminales de despacho estén conectados a la misma red Wi-Fi o router.
                <br />
                2. En el firewall de Windows o Linux, permite el puerto entrante 8080.
                <br />
                3. Abre el navegador en cualquier celular o PC e ingresa la dirección IP de tu máquina (ej. <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">http://192.168.1.50:8080</code>).
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <strong className="block font-semibold text-slate-800 mb-1">Acceso Remoto Fuera de tu Red Local (Internet):</strong>
                Si deseas que usuarios fuera de tu oficina/hogar accedan de forma remota:
                <ul className="list-disc list-inside mt-1 space-y-1 text-slate-600">
                  <li><strong>Túnel Seguro (Recomendado):</strong> Ejecuta herramientas gratuitas como <code>cloudflared</code> (Cloudflare Tunnel) o <code>ngrok http 8080</code> para obtener un dominio HTTPS público instantáneo sin abrir puertos en tu router.</li>
                  <li><strong>Red Privada Virtual (VPN/Mesh):</strong> Instala Tailscale o ZeroTier en los dispositivos para una red segura punto a punto cifrada.</li>
                  <li><strong>Port Forwarding:</strong> Configura reenvío de puertos en tu router hacia el puerto 8080 de tu IP local con IP pública o servicio DDNS.</li>
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex items-center justify-between">
          <a
            href="/api/project/download-zip"
            download="sistema-solicitud-reservas.zip"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
            title="Descargar paquete completo para ejecutar en tu PC"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Proyecto (.ZIP) para tu PC</span>
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs"
          >
            Entendido / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
