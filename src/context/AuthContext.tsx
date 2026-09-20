import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, UserPermissions } from '../types';
import { api } from '../utils/api';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  users: User[];
  hasPermission: (permission: keyof UserPermissions) => boolean;
  loginWithRole: (role: UserRole) => Promise<void>;
  loginCustom: (username: string, password?: string, remember?: boolean) => Promise<void>;
  registerUser: (data: { username: string; name: string; password: string; role?: UserRole; department?: string }) => Promise<void>;
  logout: () => void;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  // Load saved session
  useEffect(() => {
    async function initAuth() {
      try {
        const userList = await api.getUsers();
        setUsers(userList);

        const savedUserId = localStorage.getItem('reservas_user_id');
        if (savedUserId) {
          const matched = userList.find((u) => u.id === savedUserId);
          if (matched) {
            setCurrentUser(matched);
            setLoading(false);
            return;
          }
        }
        // No auto-fallback to default user: display the Login screen for users
        setCurrentUser(null);
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const refreshUsers = async () => {
    try {
      const userList = await api.getUsers();
      setUsers(userList);
      if (currentUser) {
        const updatedSelf = userList.find((u) => u.id === currentUser.id);
        if (updatedSelf) setCurrentUser(updatedSelf);
      }
    } catch (err) {
      console.error('Error refreshing users:', err);
    }
  };

  const loginWithRole = async (role: UserRole) => {
    try {
      setLoading(true);
      const res = await api.login({ quickLoginRole: role });
      setCurrentUser(res.user);
      localStorage.setItem('reservas_user_id', res.user.id);
      await refreshUsers();
    } catch (err) {
      console.error('Failed to quick login:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginCustom = async (username: string, password?: string, remember: boolean = true) => {
    setLoading(true);
    try {
      const res = await api.login({ username, password });
      setCurrentUser(res.user);
      if (remember) {
        localStorage.setItem('reservas_user_id', res.user.id);
      } else {
        sessionStorage.setItem('reservas_user_id', res.user.id);
      }
      await refreshUsers();
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (data: {
    username: string;
    name: string;
    password: string;
    role?: UserRole;
    department?: string;
  }) => {
    setLoading(true);
    try {
      const res = await api.register(data);
      setCurrentUser(res.user);
      localStorage.setItem('reservas_user_id', res.user.id);
      await refreshUsers();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('reservas_user_id');
    sessionStorage.removeItem('reservas_user_id');
    setCurrentUser(null);
  };

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!currentUser) return false;
    // Solo el usuario administrador puede eliminar reservas registradas
    if (permission === 'canDelete') {
      return currentUser.role === 'admin';
    }
    if (currentUser.role === 'admin') return true; // Admin has supreme override
    return Boolean(currentUser.permissions?.[permission]);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        users,
        hasPermission,
        loginWithRole,
        loginCustom,
        registerUser,
        logout,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
