import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsAPI, extractData } from '@/services/api';
import { motion } from 'framer-motion';
import { BookOpen, Clock, CalendarDays, Bell } from 'lucide-react';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({ subjects: [], todaySchedule: [], pendingAttendance: 0, recentNotices: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsAPI.getTeacher()
      .then((r) => { if (r.data.success) setData(r.data?.data ?? r.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A] mb-1">Teacher Dashboard</h1>
          <p className="text-sm text-[#475569] mb-8">Welcome back — here is your schedule for {today}.</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {[
              { label: 'My Subjects', value: data.subjects.length, icon: BookOpen, color: 'text-[#16a34a]' },
              { label: "Today's Classes", value: data.todaySchedule.length, icon: Clock, color: 'text-[#16a34a]' },
              { label: 'Attendance Marked', value: data.pendingAttendance, icon: CalendarDays, color: 'text-[#F59E0B]' },
              { label: 'Notices', value: data.recentNotices.length, icon: Bell, color: 'text-[#16a34a]' },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5">
                <card.icon className={`w-5 h-5 ${card.color} mb-3`} />
                <p className="text-xs text-[#475569] uppercase tracking-wide">{card.label}</p>
                <p className="text-xl sm:text-2xl font-bold text-[#0F172A] mt-1">{loading ? '-' : card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6">
              <h2 className="text-base font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#16a34a]" /> Today&apos;s Schedule
              </h2>
              {loading ? (
                <p className="text-sm text-[#94A3B8]">Loading...</p>
              ) : data.todaySchedule.length === 0 ? (
                <p className="text-sm text-[#94A3B8]">No classes scheduled for today.</p>
              ) : (
                <div className="space-y-3">
                  {data.todaySchedule.map((slot, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-[#F8FAFC] rounded-lg">
                      <div className="text-center min-w-[60px]">
                        <p className="text-xs font-semibold text-[#16a34a]">{slot.startTime}</p>
                        <p className="text-[10px] text-[#94A3B8]">{slot.endTime}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0F172A]">{slot.subject?.name}</p>
                        <p className="text-xs text-[#94A3B8]">{slot.room} · {slot.subject?.code}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6">
              <h2 className="text-base font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#16a34a]" /> Assigned Subjects
              </h2>
              {data.subjects.length === 0 ? (
                <p className="text-sm text-[#94A3B8]">No subjects assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.subjects.map((s) => (
                    <div key={s._id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-[#94A3B8]">{s.code} · Sem {s.semester}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => navigate('/superadmin/attendance')} className="px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium">
              Mark Attendance
            </button>
            <button onClick={() => navigate('/superadmin/results')} className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium hover:border-[#16a34a]">
              Enter Marks
            </button>
            <button onClick={() => navigate('/superadmin/exams')} className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium hover:border-[#16a34a]">
              Exam Schedule
            </button>
          </div>
        </motion.div>
      </div>
  );
}
