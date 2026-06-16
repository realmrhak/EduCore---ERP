import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { statsAPI, extractData } from '@/services/api';
import { motion } from 'framer-motion';
import {
  BookOpen, CalendarDays, Users, ClipboardList,
  ChevronRight, Clock, MapPin, Bell, AlertCircle, Loader2
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    subjects: [],
    todaySchedule: [],
    pendingAttendance: 0,
    recentNotices: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await statsAPI.getTeacher();
        if (res.data.success) setStats(res.data?.data ?? res.data);
      } catch (e) {
        console.error('Dashboard fetch error:', e);
        setError('Failed to load dashboard data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const statCards = [
    { label: 'Assigned Subjects', value: stats.subjects?.length || 0, icon: BookOpen, color: 'text-[#16a34a]', bg: 'bg-[rgba(22,163,74,0.08)]' },
    { label: 'Today Classes', value: stats.todaySchedule?.length || 0, icon: CalendarDays, color: 'text-[#16a34a]', bg: 'bg-[rgba(22,163,74,0.08)]' },
    { label: 'Pending Attendance', value: stats.pendingAttendance || 0, icon: ClipboardList, color: 'text-[#F59E0B]', bg: 'bg-[rgba(245,158,11,0.08)]' },
    { label: 'Total Students', value: [...new Set((stats.subjects || []).flatMap(s => s.semester ? [s.semester] : []))].length > 0 ? (stats.subjects || []).reduce((sum, s) => sum + (s.studentCount || 0), 0) || '—' : '—', icon: Users, color: 'text-[#16a34a]', bg: 'bg-[rgba(22,163,74,0.08)]' },
  ];

  const quickActions = [
    { label: 'Mark Attendance', desc: 'Record attendance for today', path: '/teacher/attendance', icon: CalendarDays },
    { label: 'Create Quiz', desc: 'Create a new quiz', path: '/teacher/quizzes/create', icon: ClipboardList },
    { label: 'Upload Results', desc: 'Publish exam results', path: '/teacher/results', icon: ClipboardList },
    { label: 'View Students', desc: 'See your assigned students', path: '/teacher/students', icon: Users },
  ];

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-5 sm:mb-8">
          <h1 className="text-lg sm:text-xl font-semibold text-[#0F172A]">Welcome, {user?.name?.split(' ')[0]}</h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">{todayLabel}</p>
          {user?.department && (
            <p className="text-[11px] sm:text-xs text-[#94A3B8] mt-1 truncate">
              Dept: {typeof user.department === 'object' ? user.department?.name : 'Assigned'} 
              {user?.semester ? ` | Sem: ${user.semester}` : ''}
            </p>
          )}
        </motion.div>

        {/* Error State */}
        {error && !loading && (
          <motion.div variants={itemVariants} className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0" />
            <p className="text-sm text-[#EF4444]">{error}</p>
          </motion.div>
        )}

        {/* Stat Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-5 sm:mb-8">
          {statCards.map((card, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-2.5 sm:p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-medium text-[#475569] uppercase tracking-wide">{card.label}</span>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${card.color}`} />
                </div>
              </div>
              {loading ? (
                <div className="h-6 flex items-center">
                  <Loader2 className="w-4 h-4 text-[#94A3B8] animate-spin" />
                </div>
              ) : (
                <p className="text-lg sm:text-2xl font-bold text-[#0F172A]">{card.value}</p>
              )}
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-6 mb-5 sm:mb-8">
          {/* Today's Schedule */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-2.5 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-semibold text-[#0F172A]">Today's Schedule</h3>
                <span className="text-[10px] sm:text-xs text-[#64748B]">{todayLabel}</span>
              </div>
              {loading ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-8 h-8 text-[#94A3B8] mx-auto mb-2 animate-spin" />
                  <p className="text-sm text-[#94A3B8]">Loading schedule...</p>
                </div>
              ) : stats.todaySchedule?.length === 0 ? (
                <p className="text-sm text-[#94A3B8] py-8 text-center">No classes scheduled for today</p>
              ) : (
                <div className="space-y-3">
                  {stats.todaySchedule?.map((slot, i) => (
                    <div key={i} className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-[#F8FAFC] rounded-lg">
                      <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg bg-[rgba(22,163,74,0.08)] flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#16a34a]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] sm:text-sm font-medium text-[#0F172A]">{slot.subject?.name || 'Class'}</p>
                        <p className="text-[10px] sm:text-xs text-[#475569]">{slot.subject?.code || ''}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[11px] sm:text-sm font-medium text-[#0F172A]">{slot.startTime} - {slot.endTime}</p>
                        <p className="text-[10px] sm:text-xs text-[#475569] flex items-center gap-1 justify-end">
                          <MapPin className="w-3 h-3" /> {slot.room || 'TBD'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-[#E2E8F0] p-2.5 sm:p-6">
            <h3 className="text-xs sm:text-base font-semibold text-[#0F172A] mb-3 sm:mb-4">Quick Actions</h3>
            <div className="space-y-2 sm:space-y-3">
              {quickActions.map((action, i) => (
                <button key={i} onClick={() => navigate(action.path)} className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-[#F8FAFC] group transition-all text-left">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[rgba(22,163,74,0.08)] flex items-center justify-center group-hover:bg-[#16a34a] transition-colors">
                    <action.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#16a34a] group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-sm font-medium text-[#0F172A]">{action.label}</p>
                    <p className="text-[10px] sm:text-xs text-[#94A3B8]">{action.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#16a34a] transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Assigned Subjects */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl border border-[#E2E8F0] p-2.5 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-base font-semibold text-[#0F172A]">My Subjects</h3>
            <button onClick={() => navigate('/teacher/subjects')} className="text-xs text-[#16a34a] font-medium hover:underline">View All</button>
          </div>
          {loading ? (
            <div className="py-8 text-center">
              <Loader2 className="w-8 h-8 text-[#94A3B8] mx-auto mb-2 animate-spin" />
              <p className="text-sm text-[#94A3B8]">Loading subjects...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[rgba(22,163,74,0.06)]">
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Subject Code</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Subject Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Department</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.subjects?.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-8 text-[#94A3B8]">No subjects assigned yet</td></tr>
                  ) : stats.subjects?.map((s, i) => (
                    <tr key={i} className="border-t border-[#F1F5F9]">
                      <td className="px-4 py-3 text-sm font-medium text-[#16a34a]">{s.code}</td>
                      <td className="px-4 py-3 text-sm text-[#0F172A]">{s.name}</td>
                      <td className="px-4 py-3 text-sm text-[#475569]">{s.department?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-[#475569]">{s.semester || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
