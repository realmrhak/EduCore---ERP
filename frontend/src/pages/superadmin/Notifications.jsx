import { useState, useEffect, useRef, useCallback } from 'react';
import { notificationAPI, departmentAPI, userAPI, extractData } from '@/services/api';
import { useNotifications } from '@/hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BookOpen, Monitor, DollarSign, MessageSquare, Check,
  Send, X, Users, User, Loader2, Search, Filter, Zap, GraduationCap, Megaphone
} from 'lucide-react';
import toast from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';

const tabs = [
  { label: 'Academic', icon: BookOpen, category: 'Academic' },
  { label: 'System', icon: Monitor, category: 'System' },
  { label: 'Finance', icon: DollarSign, category: 'Finance' },
  { label: 'Messages', icon: MessageSquare, category: 'Message' },
];

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('Academic');
  const [showCompose, setShowCompose] = useState(false);
  const [departments, setDepartments] = useState([]);

  // Compose form state
  const [compose, setCompose] = useState({
    title: '',
    message: '',
    category: 'Message',
    sendType: 'role',
    recipientRole: 'student',
    department: '',
    semester: '',
    recipientId: '',
    recipientIds: [],
  });
  const [sending, setSending] = useState(false);
  const [searchUsers, setSearchUsers] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const handleRealtimeNotification = useCallback(() => { fetchNotifications(); }, []);
  useNotifications(handleRealtimeNotification);

  const intervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const r = await notificationAPI.getAll();
      setNotifications(extractData(r));
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchNotifications]);

  useEffect(() => {
    departmentAPI.getAll().then(r => setDepartments(extractData(r))).catch(() => {});
  }, []);

  const filtered = notifications.filter(n => n.category === activeTab);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markRead = async (id) => {
    await notificationAPI.markRead(id);
    fetchNotifications();
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    fetchNotifications();
  };

  const handleUserSearch = async (query) => {
    setSearchUsers(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearchingUsers(true);
    try {
      const r = await userAPI.getAll({ search: query, limit: 15 });
      setSearchResults(extractData(r));
    } catch { setSearchResults([]); }
    finally { setSearchingUsers(false); }
  };

  const toggleRecipient = (userId) => {
    setCompose(prev => {
      const ids = prev.recipientIds.includes(userId)
        ? prev.recipientIds.filter(id => id !== userId)
        : [...prev.recipientIds, userId];
      return { ...prev, recipientIds: ids };
    });
  };

  const removeRecipient = (userId) => {
    setCompose(prev => ({ ...prev, recipientIds: prev.recipientIds.filter(id => id !== userId) }));
  };

  const handleSend = async () => {
    if (!compose.title.trim() || !compose.message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    const payload = {
      title: compose.title,
      message: compose.message,
      category: compose.category,
    };

    if (compose.sendType === 'broadcast') {
      payload.recipientRole = 'all';
    } else if (compose.sendType === 'role') {
      payload.recipientRole = compose.recipientRole;
      if (compose.department) payload.department = compose.department;
      if (compose.semester) payload.semester = compose.semester;
    } else if (compose.sendType === 'individual') {
      if (compose.recipientIds.length === 0) {
        toast.error('Select at least one recipient');
        return;
      }
      payload.recipientIds = compose.recipientIds;
    } else if (compose.sendType === 'department') {
      if (!compose.department) { toast.error('Please select a department'); return; }
      payload.recipientRole = compose.recipientRole;
      payload.department = compose.department;
      if (compose.semester) payload.semester = compose.semester;
    }

    setSending(true);
    try {
      const res = await notificationAPI.create(payload);
      const count = res.data?.data?.length ?? 0;
      toast.success(`Message sent to ${count} recipient${count !== 1 ? 's' : ''}`);
      setShowCompose(false);
      setCompose({
        title: '', message: '', category: 'Message', sendType: 'broadcast',
        recipientRole: 'student', department: '', semester: '',
        recipientId: '', recipientIds: [],
      });
      setSearchUsers('');
      setSearchResults([]);
      fetchNotifications();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send message');
    } finally { setSending(false); }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Academic': return <BookOpen className="w-5 h-5 text-[#16a34a]" />;
      case 'Finance': return <DollarSign className="w-5 h-5 text-[#F59E0B]" />;
      case 'System': return <Monitor className="w-5 h-5 text-[#3B82F6]" />;
      default: return <MessageSquare className="w-5 h-5 text-[#8B5CF6]" />;
    }
  };

  const getCategoryBg = (category) => {
    switch (category) {
      case 'Academic': return 'bg-[#f0fdf4]';
      case 'Finance': return 'bg-yellow-50';
      case 'System': return 'bg-blue-50';
      default: return 'bg-purple-50';
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">Notifications Center</h1>
            <p className="text-xs sm:text-sm text-[#475569] truncate">Send messages to students & teachers — delivered via WebSocket</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 px-2 py-1.5 text-[11px] text-[#16a34a] font-medium hover:underline whitespace-nowrap">
                <Check className="w-3 h-3" /> Mark read ({unreadCount})
              </button>
            )}
            <button onClick={() => setShowCompose(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#16a34a] text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#15803d] transition-all whitespace-nowrap">
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Compose
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-6">
          {[
            { label: 'Total', value: notifications.length, icon: Bell, color: 'bg-[#f0fdf4]', iconColor: 'text-[#16a34a]' },
            { label: 'Unread', value: unreadCount, icon: MessageSquare, color: 'bg-red-50', iconColor: 'text-[#EF4444]' },
            { label: 'Academic', value: notifications.filter(n => n.category === 'Academic').length, icon: BookOpen, color: 'bg-blue-50', iconColor: 'text-[#3B82F6]' },
            { label: 'Finance', value: notifications.filter(n => n.category === 'Finance').length, icon: DollarSign, color: 'bg-yellow-50', iconColor: 'text-[#F59E0B]' },
            { label: 'System', value: notifications.filter(n => n.category === 'System').length, icon: Monitor, color: 'bg-indigo-50', iconColor: 'text-[#6366F1]' },
          ].map((s, i) => (
            <div key={i} className={`${s.color} rounded-xl p-2.5 sm:p-3 flex items-center gap-3`}>
              <s.icon className={`w-4 h-4 ${s.iconColor}`} />
              <div>
                <p className="text-lg sm:text-xl font-bold text-[#0F172A]">{s.value}</p>
                <p className="text-[11px] text-[#475569]">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-[#F1F5F9] rounded-lg p-1 overflow-x-auto">
              {tabs.map(tab => (
                <button key={tab.category} onClick={() => setActiveTab(tab.category)}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium transition-all flex-1 justify-center whitespace-nowrap ${
                    activeTab === tab.category ? 'bg-white text-[#16a34a] shadow-sm' : 'text-[#475569] hover:text-[#0F172A]'
                  }`}>
                  <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {tab.label}
                  {tab.category === 'Message' && unreadCount > 0 && (
                    <span className="w-4 h-4 sm:w-5 sm:h-5 bg-[#EF4444] text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center">{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="space-y-2 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <Bell className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" />
                  <p className="text-sm text-[#94A3B8]">No notifications in this category</p>
                </div>
              ) : filtered.map(n => (
                <div key={n._id} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  n.isRead ? 'bg-white border-[#E2E8F0]' : 'bg-[#F8FAFC] border-[#E2E8F0] border-l-[3px] border-l-[#16a34a]'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getCategoryBg(n.category)}`}>
                    {getCategoryIcon(n.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm truncate ${n.isRead ? 'font-medium text-[#475569]' : 'font-semibold text-[#0F172A]'}`}>{n.title}</h4>
                      {!n.isRead && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#16a34a] text-white rounded-full font-medium flex-shrink-0">NEW</span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[#94A3B8]">{new Date(n.createdAt).toLocaleString()}</span>
                      {n.sender?.name && (
                        <span className="text-[10px] text-[#16a34a] font-medium">from {n.sender.name}</span>
                      )}
                      {n.recipientCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#F1F5F9] text-[#64748B] rounded-full font-medium">{n.recipientCount} recipient{n.recipientCount !== 1 ? 's' : ''}</span>
                      )}
                      {n.recipientRole && !n.recipientCount && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#F1F5F9] text-[#64748B] rounded-full font-medium capitalize">{n.recipientRole === 'all' ? 'Broadcast' : n.recipientRole}</span>
                      )}
                    </div>
                  </div>
                  {!n.isRead && (
                    <button onClick={() => markRead(n._id)} className="p-1 hover:bg-[#F1F5F9] rounded-lg text-[#16a34a] flex-shrink-0" title="Mark as read">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-4">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Quick Stats</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
                    <span className="text-xs text-[#64748B]">Total</span>
                  </div>
                  <span className="text-sm font-semibold text-[#0F172A]">{notifications.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                    <span className="text-xs text-[#64748B]">Unread</span>
                  </div>
                  <span className="text-sm font-semibold text-[#EF4444]">{unreadCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                    <span className="text-xs text-[#64748B]">Academic</span>
                  </div>
                  <span className="text-sm font-semibold text-[#3B82F6]">{notifications.filter(n => n.category === 'Academic').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                    <span className="text-xs text-[#64748B]">Finance</span>
                  </div>
                  <span className="text-sm font-semibold text-[#F59E0B]">{notifications.filter(n => n.category === 'Finance').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
                    <span className="text-xs text-[#64748B]">System</span>
                  </div>
                  <span className="text-sm font-semibold text-[#6366F1]">{notifications.filter(n => n.category === 'System').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                    <span className="text-xs text-[#64748B]">Messages</span>
                  </div>
                  <span className="text-sm font-semibold text-[#8B5CF6]">{notifications.filter(n => n.category === 'Message').length}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#16a34a] to-[#15803d] rounded-xl p-4 text-white">
              <h3 className="text-sm font-semibold mb-1">Unread {activeTab === 'Message' ? 'Message' : activeTab} Notifications</h3>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-2xl sm:text-3xl font-bold">{filtered.filter(n => !n.isRead).length}</span>
                <span className="text-sm text-white/70 mb-1">Action required</span>
              </div>
              <button onClick={markAllRead} className="w-full py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
                Mark All Read
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* COMPOSE MODAL */}
      <AnimatePresence>
        {showCompose && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCompose(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center">
                    <Send className="w-5 h-5 text-[#16a34a]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#0F172A]">Compose Message</h2>
                    <p className="text-xs text-[#64748B]">Send to students & teachers via WebSocket</p>
                  </div>
                </div>
                <button onClick={() => setShowCompose(false)} className="p-2 hover:bg-[#F1F5F9] rounded-lg">
                  <X className="w-5 h-5 text-[#64748B]" />
                </button>
              </div>

              <div className="p-5 space-y-3">
                {/* Message Content Section */}
                <div className="space-y-3 pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-[#16a34a]" />
                    <span className="text-xs font-semibold text-[#0F172A] uppercase tracking-wide">Message Content</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-medium text-[#64748B] mb-1">Title <span className="text-[#EF4444]">*</span></label>
                      <input type="text" value={compose.title} onChange={e => setCompose(p => ({ ...p, title: e.target.value }))}
                        placeholder="Notification title" className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#64748B] mb-1">Category</label>
                      <CustomSelect value={compose.category} onValueChange={v => setCompose(p => ({ ...p, category: v }))}
                        options={[{ value: 'Message', label: 'Message' }, { value: 'Academic', label: 'Academic' }, { value: 'System', label: 'System' }, { value: 'Finance', label: 'Finance' }]}
                        placeholder="Category" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#64748B] mb-1">Message <span className="text-[#EF4444]">*</span></label>
                    <textarea value={compose.message} onChange={e => setCompose(p => ({ ...p, message: e.target.value }))}
                      placeholder="Type your message..." rows={3}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a] resize-none" />
                  </div>
                </div>

                {/* Recipients Section */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-3.5 h-3.5 text-[#16a34a]" />
                    <span className="text-xs font-semibold text-[#0F172A] uppercase tracking-wide">Recipients</span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#64748B] mb-2">Send To</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: 'broadcast', label: 'Broadcast', icon: Megaphone },
                        { key: 'role', label: 'By Role', icon: Users },
                        { key: 'department', label: 'Department', icon: Filter },
                        { key: 'individual', label: 'Individual', icon: User },
                      ].map(opt => (
                        <button key={opt.key} onClick={() => setCompose(p => ({ ...p, sendType: opt.key, recipientIds: [] }))}
                          className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-xs font-medium transition-all ${
                            compose.sendType === opt.key ? 'border-[#16a34a] bg-[#f0fdf4] text-[#16a34a]' : 'border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                          }`}>
                          <opt.icon className="w-3.5 h-3.5" /> {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Broadcast to All */}
                {compose.sendType === 'broadcast' && (
                  <div className="p-3 bg-[#f0fdf4] rounded-lg border border-[#bbf7d0]">
                    <div className="flex items-center gap-2 text-xs text-[#16a34a]">
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>Broadcast: Message will be sent to <strong>all students, teachers, and admins</strong> across all departments</span>
                    </div>
                  </div>
                )}

                {/* By Role */}
                {compose.sendType === 'role' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-[#64748B] mb-1">Target Role</label>
                      <CustomSelect value={compose.recipientRole} onValueChange={v => setCompose(p => ({ ...p, recipientRole: v }))}
                        options={[{ value: 'student', label: 'Students' }, { value: 'teacher', label: 'Teachers' }, { value: 'admin', label: 'Admins' }]}
                        placeholder="Select Role" />
                    </div>
                    {(compose.recipientRole === 'student' || compose.recipientRole === 'teacher') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#64748B] mb-1">Department</label>
                          <CustomSelect value={compose.department} onValueChange={v => setCompose(p => ({ ...p, department: v }))}
                            options={[{ value: '', label: 'All Departments' }, ...departments.map(d => ({ value: d._id, label: d.name }))]}
                            placeholder="All Departments" />
                        </div>
                        {compose.recipientRole === 'student' && (
                          <div>
                            <label className="block text-xs font-medium text-[#64748B] mb-1">Semester</label>
                            <CustomSelect value={compose.semester} onValueChange={v => setCompose(p => ({ ...p, semester: v }))}
                              options={[{ value: '', label: 'All Semesters' }, ...[1,2,3,4,5,6,7,8].map(s => ({ value: String(s), label: `Semester ${s}` }))]}
                              placeholder="All Semesters" />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                      <div className="flex items-center gap-2 text-xs text-[#64748B]">
                        {compose.recipientRole === 'student' ? <Users className="w-3.5 h-3.5" /> : compose.recipientRole === 'teacher' ? <GraduationCap className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                        <span>Will send to all <strong>{compose.recipientRole === 'admin' ? 'admins' : compose.recipientRole + 's'}</strong>
                          {compose.department ? ` in ${departments.find(d => d._id === compose.department)?.name || 'selected dept'}` : ' across all depts'}
                          {compose.semester && compose.recipientRole === 'student' ? `, Sem ${compose.semester}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* By Department */}
                {compose.sendType === 'department' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-[#64748B] mb-1">Target Role</label>
                      <CustomSelect value={compose.recipientRole} onValueChange={v => setCompose(p => ({ ...p, recipientRole: v }))}
                        options={[{ value: 'student', label: 'Students' }, { value: 'teacher', label: 'Teachers' }, { value: 'admin', label: 'Admins' }]}
                        placeholder="Select Role" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#64748B] mb-1">Department *</label>
                        <CustomSelect value={compose.department} onValueChange={v => setCompose(p => ({ ...p, department: v }))}
                          options={[{ value: '', label: 'Select Department' }, ...departments.map(d => ({ value: d._id, label: d.name }))]}
                          placeholder="Select Department" />
                      </div>
                      {compose.recipientRole === 'student' && (
                        <div>
                          <label className="block text-xs font-medium text-[#64748B] mb-1">Semester</label>
                          <CustomSelect value={compose.semester} onValueChange={v => setCompose(p => ({ ...p, semester: v }))}
                            options={[{ value: '', label: 'All Semesters' }, ...[1,2,3,4,5,6,7,8].map(s => ({ value: String(s), label: `Semester ${s}` }))]}
                            placeholder="All Semesters" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Individual */}
                {compose.sendType === 'individual' && (
                  <div>
                    <label className="block text-xs font-medium text-[#64748B] mb-1">Search Users (students & teachers)</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#16a34a]" />
                      <input type="text" value={searchUsers} onChange={e => handleUserSearch(e.target.value)}
                        placeholder="Search by name, email, or reg #..." className="w-full pl-10 pr-3 h-9 sm:h-10 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#16a34a]" />
                      {searchingUsers && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] animate-spin" />}
                    </div>

                    {compose.recipientIds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {searchResults.filter(u => compose.recipientIds.includes(u._id)).map(u => (
                          <span key={u._id} className="inline-flex items-center gap-1 px-2 py-1 bg-[#f0fdf4] border border-[#bbf7d0] rounded-full text-xs text-[#16a34a] font-medium">
                            {u.name}
                            <button onClick={() => removeRecipient(u._id)} className="hover:text-[#EF4444]"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                        <span className="text-xs text-[#64748B] self-center">({compose.recipientIds.length} selected)</span>
                      </div>
                    )}

                    {searchResults.length > 0 && (
                      <div className="mt-2 border border-[#E2E8F0] rounded-lg max-h-40 overflow-y-auto">
                        {searchResults.map(u => (
                          <button key={u._id} onClick={() => toggleRecipient(u._id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#F8FAFC] transition-all ${
                              compose.recipientIds.includes(u._id) ? 'bg-[#f0fdf4]' : ''
                            }`}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                              compose.recipientIds.includes(u._id) ? 'bg-[#16a34a] border-[#16a34a]' : 'border-[#CBD5E1]'
                            }`}>
                              {compose.recipientIds.includes(u._id) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1">
                              <span className="text-sm text-[#0F172A]">{u.name}</span>
                              <span className="text-xs text-[#94A3B8] ml-2">{u.email}</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                              u.role === 'teacher' ? 'bg-blue-50 text-[#3B82F6]' :
                              u.role === 'student' ? 'bg-[#f0fdf4] text-[#16a34a]' :
                              'bg-[#F1F5F9] text-[#64748B]'
                            }`}>{u.role}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-5 border-t border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 text-xs text-[#16a34a]">
                  <Zap className="w-3.5 h-3.5" /> Real-time delivery via WebSocket
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <button onClick={() => setShowCompose(false)} className="px-4 py-2 text-sm text-[#64748B] hover:text-[#0F172A] font-medium">Cancel</button>
                  <button onClick={handleSend} disabled={sending}
                    className="flex items-center gap-2 px-5 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-semibold hover:bg-[#15803d] transition-all disabled:opacity-60">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Message
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
