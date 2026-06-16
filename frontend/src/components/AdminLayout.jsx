import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { notificationAPI, extractData } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CalendarDays, Clock, FileText, Users,
  Building2, BookOpen, CreditCard, Bell, Settings, LogOut,
  HelpCircle, ClipboardList, BarChart3, ChevronRight, Menu, X,
  GraduationCap, Search, Layers
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard', roles: ['superadmin', 'admin', 'teacher', 'accountant', 'librarian'] },
  { label: 'Students', icon: Users, path: '/admin/students', roles: ['superadmin', 'admin'] },
  { label: 'Classes', icon: Layers, path: '/admin/classes', roles: ['superadmin', 'admin'] },
  { label: 'Attendance', icon: CalendarDays, path: '/admin/attendance', roles: ['superadmin', 'admin', 'teacher'] },
  { label: 'Timetable', icon: Clock, path: '/admin/timetable', roles: ['superadmin', 'admin', 'teacher'] },
  { label: 'Exams', icon: FileText, path: '/admin/exams', roles: ['superadmin', 'admin', 'teacher'] },
  { label: 'Quizzes', icon: ClipboardList, path: '/admin/quizzes', roles: ['superadmin', 'admin', 'teacher'] },
  { label: 'Results', icon: FileText, path: '/admin/results', roles: ['superadmin', 'admin', 'teacher'] },
  { label: 'Reports', icon: BarChart3, path: '/admin/reports', roles: ['superadmin', 'admin', 'accountant'] },
  { label: 'Users', icon: Users, path: '/admin/users', roles: ['superadmin'] },
  { label: 'Departments', icon: Building2, path: '/admin/departments', roles: ['superadmin'] },
  { label: 'Subjects', icon: BookOpen, path: '/admin/subjects', roles: ['superadmin', 'admin'] },
  { label: 'Fee Challans', icon: CreditCard, path: '/admin/challans', roles: ['superadmin', 'accountant'] },
  { label: 'Fee Structure', icon: CreditCard, path: '/admin/fees', roles: ['superadmin', 'admin', 'accountant'] },
  { label: 'Library', icon: BookOpen, path: '/admin/library', roles: ['superadmin', 'admin', 'librarian'] },
  { label: 'Notifications', icon: Bell, path: '/admin/notifications', roles: ['superadmin', 'admin'] },
  { label: 'Activity Logs', icon: BarChart3, path: '/admin/activity-logs', roles: ['superadmin'] },
  { label: 'Settings', icon: Settings, path: '/admin/settings', roles: ['superadmin'] },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationAPI.getUnreadCount()
      .then((r) => setUnreadCount(r.data?.data?.count ?? r.data?.count ?? 0))
      .catch(() => {});
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        bg-white border-r border-[#E2E8F0]
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-64' : 'w-0 lg:w-16'}
        ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
        flex flex-col overflow-hidden
      `}>
        {/* Logo */}
        <div className={`h-16 flex items-center gap-3 px-4 border-b border-[#E2E8F0] ${!sidebarOpen && 'lg:justify-center'}`}>
          <div className="w-9 h-9 rounded-lg bg-[#16a34a] flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {(sidebarOpen || mobileOpen) && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-[#0F172A] whitespace-nowrap">EduCore ERP</h1>
              <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Academic Management</p>
            </div>
          )}
          <button onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden text-[#94A3B8]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.filter((item) => !item.roles || item.roles.includes(user?.role)).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'bg-[rgba(22,163,74,0.08)] text-[#16a34a] border-l-[3px] border-[#16a34a]'
                    : 'text-[#475569] hover:bg-[rgba(22,163,74,0.04)] hover:text-[#16a34a] border-l-[3px] border-transparent'
                  }
                  ${!sidebarOpen && 'lg:justify-center lg:px-2'}
                `}
                title={(!sidebarOpen && !mobileOpen) ? item.label : ''}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#16a34a]' : ''}`} />
                {(sidebarOpen || mobileOpen) && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-[#E2E8F0] space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#475569] hover:bg-[rgba(22,163,74,0.04)] hover:text-[#16a34a] transition-all">
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            {(sidebarOpen || mobileOpen) && <span>Help Center</span>}
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#EF4444] hover:bg-red-50 transition-all">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(sidebarOpen || mobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-[68px] bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => { if (window.innerWidth < 1024) { setMobileOpen(true); } else { setSidebarOpen(!sidebarOpen); } }}
              className="p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors">
              <Menu className="w-5 h-5 text-[#475569]" />
            </button>
          </div>

          <div className="flex-1 max-w-md mx-6 hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#16a34a]" />
              <input
                type="text"
                placeholder="Search students, courses, reports..."
                className="w-full pl-10 pr-4 py-2 bg-[#F1F5F9] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:ring-2 focus:ring-[#16a34a]/30 border border-transparent focus:border-[#16a34a]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors"
            >
              <Bell className="w-5 h-5 text-[#475569]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#EF4444] rounded-full border-2 border-white" />
              )}
            </button>
            <button onClick={() => navigate('/admin/profile')} className="p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors" title="Profile">
              <Settings className="w-5 h-5 text-[#475569]" />
            </button>
            <button onClick={() => navigate('/admin/profile')} className="flex items-center gap-2 ml-2 pl-3 border-l border-[#E2E8F0] hover:opacity-80">
              <div className="w-8 h-8 rounded-full bg-[#16a34a] flex items-center justify-center">
                <span className="text-xs font-semibold text-white">
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[#0F172A]">{user?.name}</p>
                <p className="text-xs text-[#94A3B8] capitalize">{user?.role?.replace('superadmin', 'Super Admin')}</p>
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
