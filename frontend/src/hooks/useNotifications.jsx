import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const WS_URL = import.meta.env.VITE_WS_URL || window.location.origin;

/**
 * Custom hook for real-time WebSocket notifications.
 *
 * Connects to the backend Socket.IO server using the user's JWT token.
 * Automatically reconnects on token change and disconnects on logout.
 *
 * @param {function} onNotification - Callback when a new notification arrives
 * @returns {{ connected: boolean }}
 */
export function useNotifications(onNotification) {
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const onNotificationRef = useRef(onNotification);

  // Keep callback ref updated without re-connecting socket
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!token || !user) {
      // No auth — disconnect if connected
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect to WebSocket server
    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WS] Connected for real-time notifications');
    });

    socket.on('notification', (data) => {
      // Show a toast for new messages
      if (data.type === 'badge-update') {
        // Just a badge refresh hint — don't toast
        if (onNotificationRef.current) onNotificationRef.current(data);
        return;
      }

      toast.custom((t) => (
        <div
          className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black/5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-[#0F172A]">{data.title}</p>
                <p className="mt-1 text-sm text-[#475569]">{data.message}</p>
                {data.sender?.name && (
                  <p className="mt-1 text-xs text-[#94A3B8]">from {data.sender.name}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex border-l border-[#E2E8F0]">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-[#64748B] hover:text-[#0F172A]"
            >
              Close
            </button>
          </div>
        </div>
      ), { duration: 5000, position: 'top-right' });

      // Notify the parent component
      if (onNotificationRef.current) onNotificationRef.current(data);
    });

    socket.on('disconnect', () => {
      console.log('[WS] Disconnected');
    });

    socket.on('connect_error', (err) => {
      console.warn('[WS] Connection error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?._id]);

  return { connected: !!socketRef.current?.connected };
}
