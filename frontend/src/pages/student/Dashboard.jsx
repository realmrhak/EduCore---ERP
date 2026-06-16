import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsAPI, notificationAPI, timetableAPI, extractData } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  TrendingUp, GraduationCap, BookOpen, ClipboardList,
  Bell, BookMarked, Library, Calendar, UserCircle, Clock, MapPin, ChevronRight
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ attendancePercentage: 0, currentSemester: 1, subjectsCount: 0, pendingQuizzes: 0, latestResults: [] });
  const [notifications, setNotifications] = useState([]);
  const [nextLecture, setNextLecture] = useState(null);
  const [nextLectureDay, setNextLectureDay] = useState('');

  // Helper: get day label like "Today", "Tomorrow", or "Mon, Jun 15"
  const getDayLabel = (dayName) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const todayIdx = today.getDay();
    const targetIdx = days.indexOf(dayName);
    if (targetIdx === -1) return dayName;
    const diff = (targetIdx - todayIdx + 7) % 7;
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    return targetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const s = await statsAPI.getStudent();
        setStats(s.data?.data ?? s.data);
        const n = await notificationAPI.getAll({});
        setNotifications(extractData(n).slice(0, 5));
        const t = await timetableAPI.getAll({ department: user?.department?._id, semester: user?.semester });
        const timetable = extractData(t);
        if (timetable.length > 0) {
          setNextLecture(timetable[0]);
          setNextLectureDay(getDayLabel(timetable[0].day));
        }
      } catch (e) {}
    };
    fetchData();
  }, [user]);

  const statCards = [
    { label: 'Attendance %', value: `${stats.attendancePercentage}%`, border: 'border-l-[#16a34a]', icon: TrendingUp },
    { label: 'Current Semester', value: `Sem ${stats.currentSemester}`, border: 'border-l-[#16a34a]', icon: GraduationCap },
    { label: 'Subject Count', value: stats.subjectsCount, border: 'border-l-[#F59E0B]', icon: BookOpen },
    { label: 'Pending Quizzes', value: stats.pendingQuizzes, border: 'border-l-[#EF4444]', icon: ClipboardList },
  ];

  const quickLinks = [
    { label: 'View Timetable', icon: Calendar, path: '/student/timetable' },
    { label: 'My Courses', icon: BookMarked, path: '/student/courses' },
    { label: 'Library', icon: Library, path: '#' },
    { label: 'My Profile', icon: UserCircle, path: '/student/profile' },
  ];

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="mb-5 sm:mb-8">
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-xs sm:text-sm text-[#475569] mt-0.5">Here is your academic overview for today.</p>
        </motion.div>

        {/* Stat Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          {statCards.map((card, i) => (
            <div key={i} className={`bg-white rounded-xl border border-[#E2E8F0] ${card.border} border-l-[3px] p-2.5 sm:p-5 hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-medium text-[#475569] uppercase tracking-wide">{card.label}</span>
                <card.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#94A3B8]" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-[#0F172A]">{card.value}</p>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-6 mb-4 sm:mb-8">
          {/* Next Lecture */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <div className="bg-[#16a34a] rounded-xl p-3 sm:p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2 sm:mb-4">
                  <div className="px-2 py-0.5 sm:px-3 sm:py-1 bg-white/20 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 sm:gap-1.5">
                    <Bell className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Next Lecture — {nextLectureDay || 'Today'}
                  </div>
                </div>
                <h3 className="text-base sm:text-xl font-semibold mb-1">{nextLecture?.subject?.name || 'Advanced Data Structures'}</h3>
                <p className="text-[11px] sm:text-sm text-white/70 mb-2 sm:mb-4">{nextLecture?.subject?.code || 'CS-302'} &bull; {nextLecture?.teacher?.name || 'Prof. Sarah Jenkins'}</p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-sm text-white/80">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {nextLecture?.startTime || '10:30 AM'} - {nextLecture?.endTime || '12:00 PM'}
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-sm text-white/80">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {nextLecture?.room || 'Lecture Hall A'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-[#E2E8F0] p-2.5 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-semibold text-[#0F172A]">Latest Notifications</h3>
              <button onClick={() => navigate('/student/notifications')} className="text-xs text-[#16a34a] font-medium">...</button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {notifications.slice(0, 3).map((n, i) => (
                <div key={i} className="flex items-start gap-2 sm:gap-3">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    n.category === 'Academic' ? 'bg-[#f0fdf4]' : n.category === 'Finance' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <Bell className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${n.category === 'Academic' ? 'text-[#16a34a]' : n.category === 'Finance' ? 'text-[#16a34a]' : 'text-[#EF4444]'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-sm font-medium text-[#0F172A] truncate">{n.title}</p>
                    <p className="text-[10px] sm:text-xs text-[#94A3B8]">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Latest Results */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl border border-[#E2E8F0] p-2.5 sm:p-6 mb-4 sm:mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-base font-semibold text-[#0F172A]">Latest Results</h3>
            <button onClick={() => navigate('/student/results')} className="text-xs text-[#16a34a] font-medium">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f0fdf4]">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Subject Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Subject Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Assessment Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.latestResults.length > 0 ? stats.latestResults.map((r, i) => (
                  <tr key={i} className="border-t border-[#F1F5F9]">
                    <td className="px-4 py-3 text-sm font-medium text-[#16a34a]">{r.subject?.code}</td>
                    <td className="px-4 py-3 text-sm text-[#0F172A]">{r.subject?.name}</td>
                    <td className="px-4 py-3 text-sm text-[#475569]">{r.examType}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#0F172A]">{r.marksObtained}/{r.totalMarks}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-green-50 text-[#16a34a] text-xs rounded-full">Passed</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="text-center py-8 text-[#94A3B8]">No results available yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {quickLinks.map((link, i) => (
            <button key={i} onClick={() => navigate(link.path)} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4 bg-white rounded-xl border border-[#E2E8F0] hover:shadow-md hover:border-[#16a34a] transition-all text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[rgba(22,163,74,0.08)] flex items-center justify-center">
                <link.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#16a34a]" />
              </div>
              <span className="text-[11px] sm:text-sm font-medium text-[#0F172A]">{link.label}</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#94A3B8] ml-auto" />
            </button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
