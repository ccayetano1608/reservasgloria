import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Reservation, AppNotification } from '../types';
import { api } from '../utils/api';
import { soundService } from '../utils/audio';

interface RealtimeContextType {
  reservations: Reservation[];
  notifications: AppNotification[];
  unreadNotifCount: number;
  connected: boolean;
  lastSyncTime: Date;
  soundMuted: boolean;
  activeToast: AppNotification | null;
  dismissToast: () => void;
  toggleSound: () => void;
  markNotificationsAsRead: () => Promise<void>;
  refreshReservations: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [soundMuted, setSoundMuted] = useState<boolean>(soundService.getMuted());
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  const dismissToast = () => setActiveToast(null);

  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    soundService.setMuted(next);
  };

  const refreshReservations = useCallback(async () => {
    try {
      const data = await api.getReservations();
      setReservations(data);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Error refreshing reservations:', err);
    }
  }, []);

  const markNotificationsAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, leido: true })));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  // SSE Real-time connection
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setConnected(true);
      };

      eventSource.onerror = () => {
        setConnected(false);
        eventSource?.close();
        // Reconnect after 3 seconds
        reconnectTimeout = setTimeout(connectSSE, 3000);
      };

      // Initial state payload
      eventSource.addEventListener('init', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.reservations) setReservations(data.reservations);
          if (data.notifications) setNotifications(data.notifications);
          setConnected(true);
          setLastSyncTime(new Date());
        } catch (err) {
          console.error('Error parsing SSE init:', err);
        }
      });

      // New reservation
      eventSource.addEventListener('reservation_created', (e: MessageEvent) => {
        try {
          const newRes: Reservation = JSON.parse(e.data);
          setReservations((prev) => {
            // Check existence for idempotency
            if (prev.some((r) => r.id === newRes.id)) return prev;
            return [newRes, ...prev];
          });
          setLastSyncTime(new Date());

          if (newRes.nivelUrgencia === 'urgente') {
            soundService.playUrgentAlert();
          } else {
            soundService.playChime();
          }
        } catch (err) {
          console.error('Error parsing reservation_created event:', err);
        }
      });

      // Updated reservation
      eventSource.addEventListener('reservation_updated', (e: MessageEvent) => {
        try {
          const updated: Reservation = JSON.parse(e.data);
          setReservations((prev) =>
            prev.map((r) => (r.id === updated.id ? updated : r))
          );
          setLastSyncTime(new Date());
          soundService.playChime();
        } catch (err) {
          console.error('Error parsing reservation_updated event:', err);
        }
      });

      // Deleted reservation
      eventSource.addEventListener('reservation_deleted', (e: MessageEvent) => {
        try {
          const { id } = JSON.parse(e.data);
          setReservations((prev) => prev.filter((r) => r.id !== id));
          setLastSyncTime(new Date());
        } catch (err) {
          console.error('Error parsing reservation_deleted event:', err);
        }
      });

      // Cleared all reservations
      eventSource.addEventListener('reservations_cleared', () => {
        setReservations([]);
        setLastSyncTime(new Date());
      });

      // General Notification
      eventSource.addEventListener('notification', (e: MessageEvent) => {
        try {
          const notif: AppNotification = JSON.parse(e.data);
          setNotifications((prev) => [notif, ...prev.slice(0, 49)]);
          setActiveToast(notif);
          setTimeout(() => {
            setActiveToast((curr) => (curr?.id === notif.id ? null : curr));
          }, 6000);
        } catch (err) {
          console.error('Error parsing notification event:', err);
        }
      });
    };

    connectSSE();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      eventSource?.close();
    };
  }, []);

  const unreadNotifCount = notifications.filter((n) => !n.leido).length;

  return (
    <RealtimeContext.Provider
      value={{
        reservations,
        notifications,
        unreadNotifCount,
        connected,
        lastSyncTime,
        soundMuted,
        activeToast,
        dismissToast,
        toggleSound,
        markNotificationsAsRead,
        refreshReservations,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('useRealtime must be used within a RealtimeProvider');
  return context;
};
