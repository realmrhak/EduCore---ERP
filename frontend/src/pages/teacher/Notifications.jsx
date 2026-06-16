import { useState, useEffect, useCallback } from 'react';
import { notificationAPI, extractData } from '@/services/api';
import { useNotifications } from '@/hooks/useNotifications';
import { motion } from 'framer-motion';
import { Bell, CheckCircle2, Clock, AlertCircle, Info, BookOpen, CreditCard, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time WebSocket notifications
  const handleRealtimeNotification = useCallback(() => {
    fetchNotifications();
  }, []);
  useNotifications(handleRealtimeNotification);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll({});
      setNotifications(extractData(res));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (e) {
      toast.error('Failed to mark all as read');
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Academic': return <BookOpen className="w-4 h-4 text-[#16a34a]" />;
      case 'Finance': return <CreditCard className="w-4 h-4 text-[#16a34a]" />;
      case 'Exam': return <AlertCircle className="w-4 h-4 text-[#F59E0B]" />;
      default: return <Info className="w-4 h-4 text-[#94A3B8]" />;
    }
  };

  const getCategoryBg = (category) => {
    switch (category) {
      case 'Academic': return 'bg-[#f0fdf4]';
      case 'Finance': return 'bg-green-50';
      case 'Exam': return 'bg-yellow-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">Notifications</h1>
            <p className="text-sm text-[#475569]">Stay updated — messages arrive in real-time.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-end sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-full">
              <Zap className="w-3.5 h-3.5 text-[#16a34a]" />
              <span className="text-xs font-medium text-[#16a34a]">Real-time</span>
            </div>
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm font-medium text-[#475569] hover:border-[#16a34a] hover:text-[#16a34a] transition-all shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark All Read
            </button>
          </div>
        </div>

        {notifications.length === 0 && !loading ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <Bell className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#0F172A] mb-1">No Notifications</h3>
            <p className="text-sm text-[#94A3B8]">You are all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, i) => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white rounded-xl border p-3 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all hover:shadow-md ${
                  notification.isRead ? 'border-[#E2E8F0] opacity-70' : 'border-[#16a34a] ring-1 ring-[#16a34a]/10'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg ${getCategoryBg(notification.category)} flex items-center justify-center flex-shrink-0`}>
                  {getCategoryIcon(notification.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-[#0F172A]">{notification.title}</h3>
                    {!notification.isRead && <span className="w-2 h-2 rounded-full bg-[#16a34a]" />}
                  </div>
                  <p className="text-sm text-[#475569] mb-2">{notification.message}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="text-xs text-[#16a34a] font-medium hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
