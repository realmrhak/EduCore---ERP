import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { notificationAPI, extractData } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, CalendarDays, Clock, Users, BookOpen, ClipboardList,
  FileText, CreditCard, UserCircle, LogOut, HelpCircle,
  GraduationCap, Menu, X, Bell, Settings, Search
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: Home, path: '/student/dashboard' },
  { label: 'Attendance', icon: CalendarDays, path: '/student/attendance' },
  { label: 'Timetable', icon: Clock, path: '/student/timetable' },
  { label: 'Teachers', icon: Users, path: '/student/teachers' },
  { label: 'Courses', icon: BookOpen, path: '/student/courses' },
  { label: 'Quizzes', icon: ClipboardList, path: '/student/quizzes' },
  { label: 'Results', icon: FileText, path: '/student/results' },
  { label: 'Payments', icon: CreditCard, path: '/student/payments' },
  { label: 'Profile', icon: UserCircle, path: '/student/profile' },
];

export default function StudentLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationAPI.getUnreadCount()
      .then((r) => setUnreadCount(r.data?.data?.count ?? r.data?.count ?? 0))
      .catch(() => { });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
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

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        bg-white border-r border-[#E2E8F0] w-64
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition-transform duration-300 ease-in-out
        flex flex-col
      `}>
        <div className="h-16 flex items-center gap-3 px-4 border-b border-[#E2E8F0]">
          <div className="w-9 h-9 rounded-lg bg-[#16a34a] flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#0F172A]">EduCore ERP</h1>
            <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Student Portal</p>
          </div>
          <button onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden text-[#94A3B8]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
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
                `}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#16a34a]' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#E2E8F0] space-y-1">
          <button onClick={() => navigate('/student/help')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#475569] hover:bg-[rgba(22,163,74,0.04)]">
            <HelpCircle className="w-5 h-5" />
            <span>Support Center</span>
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#EF4444] hover:bg-red-50">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 sm:h-[68px] bg-white border-b border-[#E2E8F0] flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-[#F1F5F9]">
              <Menu className="w-5 h-5 text-[#475569]" />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <span className="text-sm font-medium text-[#16a34a]">Academic Excellence System</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => navigate('/student/notifications')}
              className="relative p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors"
            >
              <Bell className="w-5 h-5 text-[#475569]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#EF4444] rounded-full border-2 border-white" />
              )}
            </button>
            <button className="p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors hidden sm:flex">
              <Settings className="w-5 h-5 text-[#475569]" />
            </button>
            <div className="flex items-center gap-2 ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-[#E2E8F0]">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#16a34a] flex items-center justify-center overflow-hidden">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] sm:text-xs font-semibold text-white">
                    {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[#0F172A]">{user?.name}</p>
                <p className="text-xs text-[#94A3B8]">Student</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children || <Outlet />}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
