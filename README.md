# Sistema de Solicitud de Reservas y Despacho en Tiempo Real

Aplicación web full-stack para la gestión, registro y despacho de solicitudes de reservas de materiales con marcas de tiempo automáticas, almacenamiento y sincronización en Excel, notificaciones en tiempo real (SSE) y control de permisos granulares por usuario.

---

## 🚀 Características Principales

1. **Tres Roles con Acceso Seguro:**
   - **Solicitante:** Ingreso rápido de número de reserva, número de posición y nivel de urgencia (*Baja, Media, Alta, Urgente*). Consulta en tiempo real del estado de sus pedidos.
   - **Despachador:** Cola de trabajo en vivo priorizada por urgencia y tiempo de espera (*FIFO*), asignación de operario, ubicación en almacén y cambio de estado (*En Preparación, Despachado, Observado*).
   - **Administrador:** Panel de gestión de usuarios y matriz de permisos detallados por cuenta (*creación, despacho, modificación global, exportación Excel, auditoría*).

2. **Registro Automático de Tiempos:**
   - **Hora de Registro:** Estampada por el servidor en el momento exacto de la creación en formato legible e ISO-8601.
   - **Hora de Modificación:** Actualizada automáticamente en cada cambio de estado, nota o edición de datos con auditoría del usuario que realizó la acción.

3. **Almacenamiento y Sincronización en Excel (SheetJS):**
   - Todos los datos se guardan y mantienen en `data/solicitud_reservas.xlsx`.
   - Hojas generadas: `Reservas_Activas` y `Auditoria_Historial`.
   - Visor web interactivo de la hoja de cálculo y descarga directa del archivo `.xlsx` en un clic.

4. **Tiempo Real y Notificaciones:**
   - Comunicación mediante **Server-Sent Events (SSE)** en `/api/events` para actualización simultánea en múltiples pestañas y dispositivos.
   - Alertas audibles sutiles y avisos de urgencia crítica mediante la Web Audio API nativa.
   - Centro de notificaciones con conteo de no leídos.

5. **Compartir en Red Local (LAN / Wi-Fi) y Puerto 8080:**
   - Generación de código QR para conexión rápida desde teléfonos y tabletas.
   - Detección automática de direcciones IP locales del host.

---

## 🛠️ Ejecución Remota mediante IP en Python 3 (Recomendado)

El sistema incluye un servidor nativo en **Python 3** (`server.py`) que no requiere dependencias externas adicionales (utiliza únicamente la librería estándar de Python) y está optimizado para acceso remoto por dirección IP en red local (LAN/Wi-Fi) o servidores remotos (VPS/Cloud).

### 1. Iniciar con 1 Clic (Scripts Automáticos)

- **En Windows:** Haz doble clic en `iniciar_con_python.bat` (o en `iniciar_en_mi_pc.bat`).
- **En Linux / macOS:** Ejecuta `./iniciar_con_python.sh` (o `./iniciar_en_mi_pc.sh`).

### 2. Iniciar Vía Terminal / SSH

- **Linux / macOS / Servidor Remoto:**
  ```bash
  python3 server.py --host 0.0.0.0 --port 8080
  ```

- **Windows (CMD o PowerShell):**
  ```powershell
  python server.py --host 0.0.0.0 --port 8080
  ```

### 3. Conexión Remota por Dirección IP desde Cualquier Dispositivo
Abre el navegador en cualquier PC, teléfono celular o tablet conectado a la misma red e ingresa:
```
http://[DIRECCION_IP_DEL_SERVIDOR]:8080
# Ejemplo: http://192.168.1.50:8080
```

*(Opcional: Si prefieres ejecutarlo con Node.js, también puedes usar `npm install` y `npm run start`).*

---

## 👥 Cuentas de Acceso Preconfiguradas (Demo Rápido)

| Rol | Usuario | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin` | `admin` | Acceso total, gestión de usuarios, auditoría y Excel |
| **Solicitante** | `solicitante` | `123` | Crear solicitudes y seguimiento en vivo |
| **Despachador** | `despachador` | `123` | Atender cola de despacho, cambiar estados a En Proceso/Despachado |

*(Nota: En la barra superior puedes hacer clic en el selector de usuario para alternar instantáneamente entre los 3 perfiles para pruebas operativas).*

---

## 📁 Estructura del Código

```
├── server.ts                  # Servidor Express, SSE, Auth y sincronizador XLSX
├── data/
│   ├── reservas.json          # Persistencia JSON
│   └── solicitud_reservas.xlsx # Libro Excel generado y sincronizado en vivo
├── src/
│   ├── types.ts               # Definiciones de tipos TypeScript
│   ├── context/
│   │   ├── AuthContext.tsx    # Gestión de sesión, usuarios y permisos
│   │   └── RealtimeContext.tsx # Conexión SSE, notificaciones y audio
│   ├── components/
│   │   ├── Navbar.tsx         # Barra superior, selector de rol y notificaciones
│   │   ├── SolicitanteView.tsx # Formulario de ingreso y tabla de reservas
│   │   ├── DespachadorView.tsx # Cola visual de atención priorizada por urgencia
│   │   ├── AdminPanel.tsx     # Matriz de permisos por usuario y auditoría
│   │   ├── ExcelViewerModal.tsx # Visor y descarga de la hoja de cálculo
│   │   ├── NetworkSharingModal.tsx # IPs de red, QR y guía puerto 8080
│   │   └── DocumentationModal.tsx  # Documentación técnica interactiva
│   ├── utils/
│   │   ├── api.ts             # Cliente HTTP para endpoints REST
│   │   └── audio.ts           # Chimes y alertas con Web Audio API
│   ├── App.tsx                # Punto de entrada de componentes React
│   ├── main.tsx
│   └── index.css
```
