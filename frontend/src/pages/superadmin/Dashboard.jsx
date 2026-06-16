import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsAPI, userAPI, resultAPI, challanAPI, departmentAPI, extractData } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  Users, GraduationCap, Building2, BookOpen, CalendarCheck,
  AlertTriangle, DollarSign, UserPlus, Landmark, Calendar,
  ChevronRight, Bell, Clock, FileText, CreditCard,
  CheckCircle2, Loader2, ArrowUpRight, TrendingUp, Activity
} from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const PIE_COLORS = ['#16a34a', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0, totalTeachers: 0, totalDepartments: 0, totalSubjects: 0,
    totalRevenue: 0, todayAttendance: 0, pendingResults: 0, pendingChallans: 0,
    monthlyAttendance: [], recentAdmissions: [], feeByStatus: [], recentActivities: [],
  });
  const [semesterData, setSemesterData] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState({ results: [], challans: [] });
  const [loading, setLoading] = useState(true);

  const userName = user?.name || 'Admin';

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await statsAPI.getAdmin();
        if (res.data.success) setStats(prev => ({ ...prev, ...(res.data?.data ?? res.data) }));
      } catch (e) {
        console.error('Stats API failed:', e);
      }

      try {
        const r = await userAPI.getStudents({ limit: 500 });
        const students = extractData(r);
        const semMap = {};
        students.forEach(s => { semMap[s.semester] = (semMap[s.semester] || 0) + 1; });
        const semData = Object.entries(semMap)
          .map(([sem, count]) => ({ semester: `Sem ${sem}`, count }))
          .sort((a, b) => parseInt(a.semester.replace('Sem ', '')) - parseInt(b.semester.replace('Sem ', '')));
        setSemesterData(semData);
      } catch (e) {
        console.error('Students API failed:', e);
        setSemesterData([]);
      }

      try {
        const [resRes, chRes] = await Promise.all([
          resultAPI.getPending().catch(() => ({ data: { data: [] } })),
          challanAPI.getAll({ status: 'Pending' }).catch(() => ({ data: { data: [] } })),
        ]);
        setPendingApprovals({
          results: extractData(resRes).slice(0, 5),
          challans: extractData(chRes).slice(0, 5),
        });
      } catch (e) {
        console.error('Pending approvals API failed:', e);
        setPendingApprovals({ results: [], challans: [] });
      }

      setLoading(false);
    };
    fetchAll();
  }, []);

  const statCards = [
    { label: 'Students', value: stats.totalStudents, icon: Users, path: '/superadmin/students' },
    { label: 'Teachers', value: stats.totalTeachers, icon: GraduationCap, path: '/superadmin/users' },
    { label: 'Departments', value: stats.totalDepartments, icon: Building2, path: '/superadmin/departments' },
    { label: 'Subjects', value: stats.totalSubjects, icon: BookOpen, path: '/superadmin/subjects' },
    { label: 'Revenue', value: `$${(stats.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, path: '/superadmin/fee-structure' },
    { label: 'Attendance', value: `${stats.todayAttendance || 0}%`, icon: CalendarCheck, path: '/superadmin/attendance' },
    { label: 'Pending Results', value: stats.pendingResults, icon: AlertTriangle, alert: stats.pendingResults > 0, path: '/superadmin/results' },
    { label: 'Pending Challans', value: stats.pendingChallans, icon: CreditCard, alert: stats.pendingChallans > 0, path: '/superadmin/challans' },
  ];

  const quickActions = [
    { label: 'Add Student', icon: UserPlus, path: '/superadmin/users' },
    { label: 'Department', icon: Landmark, path: '/superadmin/departments' },
    { label: 'Schedule Exam', icon: Calendar, path: '/superadmin/exams' },
    { label: 'Send Notice', icon: Bell, path: '/superadmin/notifications' },
    { label: 'Attendance', icon: Users, path: '/superadmin/attendance' },
    { label: 'Generate Challan', icon: CreditCard, path: '/superadmin/challans' },
  ];

  const feePieData = (stats.feeByStatus || []).map((f) => ({ name: f._id || 'Unknown', value: f.total || 0 }));

  return (
    <div className="p-3 sm:p-5 lg:p-8 max-w-[1400px] mx-auto overflow-x-hidden">
      {/* Header */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-[#0F172A]">Welcome back, {userName}</h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">Here's your institutional overview</p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto shrink-0">
            <button onClick={() => navigate('/superadmin/reports')} className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm text-[#475569] hover:border-[#16a34a] hover:text-[#16a34a] transition-colors">
              <FileText className="w-3.5 h-3.5" /> Reports
            </button>
            <button onClick={() => navigate('/superadmin/notifications')} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#16a34a] text-white rounded-lg text-xs sm:text-sm hover:bg-[#15803d] transition-colors">
              <Bell className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Notifications</span><span className="sm:hidden">Alerts</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards - 4 columns, 2 rows, clean spacing */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-5">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-[#E2E8F0] p-3 sm:p-4 animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="w-14 h-3 bg-[#F1F5F9] rounded" />
                <div className="w-4 h-4 bg-[#F1F5F9] rounded" />
              </div>
              <div className="w-10 h-5 bg-[#F1F5F9] rounded" />
            </div>
          ))
        ) : (
          statCards.map((card, i) => (
            <button
              key={i}
              onClick={() => navigate(card.path)}
              className="bg-white rounded-lg border border-[#E2E8F0] p-2.5 sm:p-4 hover:border-[#16a34a]/40 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] sm:text-xs font-medium text-[#64748B]">{card.label}</span>
                <card.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${card.alert ? 'text-[#EF4444]' : 'text-[#94A3B8]'} group-hover:text-[#16a34a] transition-colors`} />
              </div>
              <div className="flex items-end justify-between">
                <p className="text-lg sm:text-2xl font-bold text-[#0F172A]">{card.value}</p>
                {card.alert && card.value > 0 && (
                  <span className="text-[9px] sm:text-[10px] font-medium text-[#EF4444] bg-red-50 px-1 py-0.5 rounded">Action</span>
                )}
                {card.alert && card.value === 0 && (
                  <span className="text-[9px] sm:text-[10px] font-medium text-[#16a34a]">Clear</span>
                )}
              </div>
            </button>
          ))
        )}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-5 mb-5">
        {/* Attendance Chart */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="lg:col-span-2 bg-white rounded-lg border border-[#E2E8F0] p-2.5 sm:p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">Attendance Trend</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">Monthly student attendance overview</p>
            </div>
            <div className="text-xs text-[#64748B] bg-[#F8FAFC] px-2.5 py-1 rounded-md border border-[#E2E8F0]">
              Today: {stats.todayAttendance || 0}%
            </div>
          </div>
          {loading ? (
            <div className="h-[150px] sm:h-[200px] flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#94A3B8]" />
            </div>
          ) : (
            <div className="h-[150px] sm:h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyAttendance.length > 0 ? stats.monthlyAttendance : [
                  { month: 'JAN', count: 0 }, { month: 'FEB', count: 0 }, { month: 'MAR', count: 0 },
                  { month: 'APR', count: 0 }, { month: 'MAY', count: 0 }, { month: 'JUN', count: 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12 }} />
                  <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} dot={{ r: 3, fill: '#fff', stroke: '#16a34a', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Semester Distribution */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="bg-white rounded-lg border border-[#E2E8F0] p-3 sm:p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[#0F172A]">Semester Distribution</h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">{semesterData.reduce((s, d) => s + d.count, 0)} students total</p>
          </div>
          {loading ? (
            <div className="h-[150px] sm:h-[200px] flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#94A3B8]" />
            </div>
          ) : (
            <div className="h-[150px] sm:h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={semesterData.length > 0 ? semesterData : [{ semester: 'N/A', count: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="semester" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#16a34a" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions + Fee Collection + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-5 mb-5">
        {/* Quick Actions */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="bg-white rounded-lg border border-[#E2E8F0] p-2.5 sm:p-5">
          <h3 className="text-xs sm:text-sm font-semibold text-[#0F172A] mb-3 sm:mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {quickActions.map((action, i) => (
              <button key={i} onClick={() => navigate(action.path)} className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-lg border border-[#F1F5F9] hover:border-[#16a34a]/30 hover:bg-[#f0fdf4] transition-all text-left group">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-[#F8FAFC] flex items-center justify-center group-hover:bg-[#16a34a] transition-colors">
                  <action.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#64748B] group-hover:text-white transition-colors" />
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-[#0F172A]">{action.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Fee Collection Pie */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="bg-white rounded-lg border border-[#E2E8F0] p-3 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#0F172A]">Fee Collection</h3>
            <button onClick={() => navigate('/superadmin/fee-structure')} className="text-xs text-[#16a34a] font-medium hover:underline">View All</button>
          </div>
          <div className="h-[140px] sm:h-[180px]">
            {feePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={feePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {feePieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-[#94A3B8]">No fee data yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="bg-white rounded-lg border border-[#E2E8F0] p-3 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#0F172A]">Recent Activity</h3>
            <button onClick={() => navigate('/superadmin/activity-logs')} className="text-xs text-[#16a34a] font-medium hover:underline flex items-center gap-0.5">
              View All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {(stats.recentActivities || []).length === 0 ? (
              <p className="text-sm text-[#94A3B8] py-6 text-center">No recent activity</p>
            ) : (stats.recentActivities || []).slice(0, 6).map((activity, i) => (
              <div key={activity._id || i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a] mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#0F172A] truncate">{activity.action}</p>
                  <p className="text-xs text-[#94A3B8]">{timeAgo(activity.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Pending Approvals + Recent Admissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-5">
        {/* Pending Approvals */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="bg-white rounded-lg border border-[#E2E8F0] p-3 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#0F172A]">Pending Approvals</h3>
            <button onClick={() => navigate('/superadmin/results')} className="text-xs text-[#16a34a] font-medium hover:underline flex items-center gap-0.5">
              View All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {pendingApprovals.results.length > 0 ? (
              pendingApprovals.results.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F8FAFC]">
                  <FileText className="w-4 h-4 text-[#94A3B8]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#0F172A] truncate">{r.student?.name || 'Student'}</p>
                    <p className="text-xs text-[#94A3B8]">{r.subject?.name || 'Subject'} — Result pending</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 p-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                <span className="text-sm text-[#64748B]">All results approved</span>
              </div>
            )}
            {pendingApprovals.challans.length > 0 && (
              <>
                <div className="border-t border-[#F1F5F9] pt-2 mt-2">
                  <p className="text-xs font-medium text-[#64748B] mb-2">Fee Challans</p>
                </div>
                {pendingApprovals.challans.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F8FAFC]">
                    <CreditCard className="w-4 h-4 text-[#94A3B8]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#0F172A] truncate">{c.student?.name || 'Student'}</p>
                      <p className="text-xs text-[#94A3B8]">${c.amount} — {c.challanType}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </motion.div>

        {/* Recent Admissions */}
        {(stats.recentAdmissions || []).length > 0 && (
          <motion.div variants={itemVariants} initial="hidden" animate="visible" className="bg-white rounded-lg border border-[#E2E8F0] p-3 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A]">Recent Admissions</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">Monthly admission trends</p>
              </div>
              <button onClick={() => navigate('/superadmin/users')} className="text-xs text-[#16a34a] font-medium hover:underline flex items-center gap-0.5">
                View Students <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="h-[140px] sm:h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.recentAdmissions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
