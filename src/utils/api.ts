import { Reservation, User, UserPermissions, NetworkInfo, ExcelSheetRow } from '../types';

export const api = {
  // Reservations
  async getReservations(userId?: string): Promise<Reservation[]> {
    const headers: Record<string, string> = {};
    if (userId) {
      headers['x-user-id'] = userId;
    }
    const url = userId ? `/api/reservations?userId=${encodeURIComponent(userId)}` : '/api/reservations';
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Error al cargar reservas');
    const data = await res.json();
    return data.reservations || (Array.isArray(data) ? data : []);
  },

  async createReservation(payload: {
    numeroReserva: string;
    numeroPosicion: string;
    nivelUrgencia: string;
    solicitanteId: string;
    solicitanteNombre: string;
    observaciones?: string;
    ubicacionAlmacen?: string;
  }): Promise<Reservation> {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al crear reserva');
    }
    const data = await res.json();
    return data.reservation;
  },

  async updateReservation(id: string, payload: Partial<Reservation> & { modificadoPor?: string; detalleCambio?: string }): Promise<Reservation> {
    const res = await fetch(`/api/reservations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar reserva');
    }
    const data = await res.json();
    return data.reservation;
  },

  async updateStatus(id: string, payload: {
    estado: string;
    despachadorId?: string;
    despachadorNombre?: string;
    nota?: string;
    ubicacionAlmacen?: string;
  }): Promise<Reservation> {
    const res = await fetch(`/api/reservations/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar estado de despacho');
    }
    const data = await res.json();
    return data.reservation;
  },

  async deleteReservation(id: string): Promise<void> {
    const userId = localStorage.getItem('reservas_user_id') || sessionStorage.getItem('reservas_user_id') || '';
    const res = await fetch(`/api/reservations/${id}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Solo el usuario administrador puede eliminar las reservas registradas');
    }
  },

  async clearAllReservations(): Promise<{ success: boolean; message: string; count: number }> {
    const userId = localStorage.getItem('reservas_user_id') || sessionStorage.getItem('reservas_user_id') || '';
    const res = await fetch(`/api/reservations?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Solo el usuario administrador puede eliminar las reservas registradas');
    }
    return await res.json();
  },

  // Excel
  getExcelDownloadUrl(): string {
    return '/api/excel/download';
  },

  async getExcelData(userId?: string): Promise<{ rows: ExcelSheetRow[]; total: number; lastModified?: string }> {
    const headers: Record<string, string> = {};
    if (userId) {
      headers['x-user-id'] = userId;
    }
    const url = userId ? `/api/excel/data?userId=${encodeURIComponent(userId)}` : '/api/excel/data';
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Error al leer datos de Excel');
    return await res.json();
  },

  // Network & LAN info
  async getNetworkInfo(): Promise<NetworkInfo> {
    const res = await fetch('/api/network-info');
    if (!res.ok) throw new Error('Error al obtener información de red');
    return await res.json();
  },

  // Auth & Users
  async login(payload: { username?: string; password?: string; quickLoginRole?: string }): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Credenciales inválidas');
    }
    return await res.json();
  },

  async register(payload: {
    username: string;
    name: string;
    password: string;
    role?: string;
    department?: string;
  }): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al registrar usuario');
    }
    return await res.json();
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Error al obtener lista de usuarios');
    const data = await res.json();
    return data.users || [];
  },

  async createUser(payload: {
    username: string;
    name: string;
    role: string;
    department?: string;
    permissions?: UserPermissions;
  }): Promise<User> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al crear usuario');
    }
    const data = await res.json();
    return data.user;
  },

  async updateUserPermissions(id: string, payload: {
    permissions?: Partial<UserPermissions>;
    role?: string;
    name?: string;
    department?: string;
  }): Promise<User> {
    const res = await fetch(`/api/users/${id}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar permisos');
    }
    const data = await res.json();
    return data.user;
  },

  async resetUserPassword(id: string): Promise<string> {
    const res = await fetch(`/api/users/${id}/reset`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Error al restablecer contraseña');
    const data = await res.json();
    return data.message;
  },

  async deleteUser(id: string): Promise<void> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al eliminar usuario');
    }
  },

  async markAllNotificationsRead(): Promise<void> {
    await fetch('/api/notifications/read-all', { method: 'POST' });
  },
};
