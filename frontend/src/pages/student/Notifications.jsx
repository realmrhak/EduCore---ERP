import { useState, useEffect, useRef, useCallback } from 'react';
import { notificationAPI, extractData } from '@/services/api';
import { useNotifications } from '@/hooks/useNotifications';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, Loader2, MessageSquare, BookOpen, Monitor, DollarSign, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const categoryIcons = {
  Academic: BookOpen,
  System: Monitor,
  Finance: DollarSign,
  Message: MessageSquare,
};

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  // Real-time WebSocket notifications
  const handleRealtimeNotification = useCallback(() => {
    fetchNotifications();
  }, []);
  useNotifications(handleRealtimeNotification);

  const fetchNotifications = useCallback(async () => {
    try {
      const r = await notificationAPI.getAll();
      const data = extractData(r, 'notifications');
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
    } catch (err) {
      if (loading) setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    fetchNotifications();
    // Auto-refresh every 10 seconds for real-time messages
    intervalRef.current = setInterval(fetchNotifications, 10000);
    return () => clearInterval(intervalRef.current);
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#94A3B8] mb-1">
              <span>Dashboard</span> <span>&gt;</span> <span className="text-[#0F172A]">Notifications</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">Notifications</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-end sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-full">
              <Zap className="w-3.5 h-3.5 text-[#16a34a]" />
              <span className="text-xs font-medium text-[#16a34a]">Real-time</span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[rgba(22,163,74,0.1)] text-[#16a34a] rounded-lg text-xs sm:text-sm font-medium hover:bg-[rgba(22,163,74,0.2)] transition-colors shrink-0"
              >
                <CheckCheck className="w-4 h-4" /> Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <div className="bg-[#f0fdf4] rounded-xl border border-[#bbf7d0] p-3 mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#16a34a]" />
            <span className="text-sm text-[#15803d] font-medium">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[#16a34a] animate-spin" />
                <p className="text-sm text-[#64748B]">Loading notifications...</p>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Bell className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-[#0F172A] mb-1">No Notifications</h3>
                <p className="text-xs text-[#64748B]">You're all caught up!</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {notifications.map(notification => {
                const IconComp = categoryIcons[notification.category] || Bell;
                return (
                  <div
                    key={notification._id}
                    className={`p-4 flex items-start gap-3 hover:bg-[#F8FAFC] transition-colors ${
                      !notification.isRead ? 'bg-[#f0fdf4]' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      !notification.isRead ? 'bg-[rgba(22,163,74,0.1)]' : 'bg-[#F1F5F9]'
                    }`}>
                      <IconComp className={`w-4 h-4 ${!notification.isRead ? 'text-[#16a34a]' : 'text-[#94A3B8]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-[#0F172A]' : 'text-[#475569]'}`}>
                            {notification.title || 'Notification'}
                          </h4>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B]">
                            {notification.category || 'System'}
                          </span>
                        </div>
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="p-1 hover:bg-[#f0fdf4] rounded text-[#16a34a] flex-shrink-0"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[#94A3B8]">
                          {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}
                        </span>
                        {notification.sender?.name && (
                          <span className="text-[10px] text-[#16a34a] font-medium">from {notification.sender.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
