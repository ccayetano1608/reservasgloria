export type UserRole = 'admin' | 'solicitante' | 'despachador';

export type UrgencyLevel = 'baja' | 'media' | 'alta' | 'urgente';

export type ReservationStatus = 
  | 'pendiente' 
  | 'en_proceso' 
  | 'despachado' 
  | 'observado' 
  | 'cancelado';

export interface UserPermissions {
  canCreate: boolean;
  canEditOwn: boolean;
  canEditAll: boolean;
  canDelete: boolean;
  canDispatch: boolean;
  canExportExcel: boolean;
  canImportExcel: boolean;
  canManageUsers: boolean;
  canViewAudit: boolean;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  department?: string;
  permissions: UserPermissions;
  createdAt: string;
  lastLogin?: string;
}

export interface ReservationHistoryEntry {
  id: string;
  fecha: string;
  fechaFormato: string;
  usuario: string;
  accion: string;
  detalle: string;
}

export interface Reservation {
  id: string;
  numeroReserva: string;
  numeroPosicion: string;
  nivelUrgencia: UrgencyLevel;
  estado: ReservationStatus;
  horaRegistro: string;
  horaRegistroFormato: string;
  horaModificacion: string;
  horaModificacionFormato: string;
  solicitanteId: string;
  solicitanteNombre: string;
  despachadorId?: string;
  despachadorNombre?: string;
  observaciones?: string;
  ubicacionAlmacen?: string;
  historial: ReservationHistoryEntry[];
}

export interface AppNotification {
  id: string;
  tipo: 'nueva_reserva' | 'estado_actualizado' | 'urgente' | 'sistema';
  titulo: string;
  mensaje: string;
  fecha: string;
  fechaFormato: string;
  reservaId?: string;
  leido: boolean;
  urgencia?: UrgencyLevel;
}

export interface NetworkInfo {
  port: number;
  ipAddresses: string[];
  localUrls: string[];
  hostname: string;
  env: string;
  isCloud: boolean;
}

export interface ExcelSheetRow {
  ID: string;
  'N° Reserva': string;
  'N° Posición': string;
  'Nivel de Urgencia': string;
  'Estado': string;
  'Solicitante': string;
  'Hora de Registro': string;
  'Hora de Modificación': string;
  'Despachador': string;
  'Ubicación Almacén': string;
  'Observaciones': string;
}
