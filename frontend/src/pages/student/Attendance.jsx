import { useState, useEffect } from 'react';
import { attendanceAPI, subjectAPI, extractData } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { CalendarDays, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';

export default function StudentAttendance() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, percentage: 0 });

  useEffect(() => {
    if (user?.department) {
      subjectAPI.getAll({ department: user.department._id, semester: user.semester }).then(r => {
        const subs = extractData(r);
        setSubjects(subs);
        if (subs[0]) setSelectedSubject(subs[0]._id);
      });
    }
  }, [user]);

  useEffect(() => {
    if (selectedSubject && user?._id) {
      attendanceAPI.getStudent(user._id, { subject: selectedSubject }).then(r => setRecords(extractData(r)));
    }
  }, [selectedSubject, user]);

  useEffect(() => {
    if (user?._id) {
      attendanceAPI.getStats(user._id).then(r => setStats(r.data?.data ?? r.data));
    }
  }, [user]);

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">Attendance & Schedule</h1>
          <p className="text-sm text-[#475569]">View your attendance records and class schedule.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <div className="lg:col-span-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
              <CustomSelect value={selectedSubject} onValueChange={v => setSelectedSubject(v)}
                options={[...subjects.map(s => ({ value: s._id, label: s.name }))]}
                placeholder="Select Subject"
                className="w-full sm:w-auto"
              />
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f0fdf4]">
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Subject</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-12 text-[#94A3B8]">No attendance records found</td></tr>
                  ) : records.map(r => (
                    <tr key={r._id} className="border-t border-[#F1F5F9]">
                      <td className="px-4 py-3 text-sm text-[#475569]">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-[#0F172A]">{r.subject?.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.status === 'Present' ? 'bg-green-50 text-[#16a34a]' :
                          r.status === 'Absent' ? 'bg-red-50 text-[#EF4444]' : 'bg-yellow-50 text-[#F59E0B]'
                        }`}>
                          {r.status === 'Present' ? <CheckCircle2 className="w-3 h-3" /> : r.status === 'Absent' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#475569]">{r.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Attendance Summary</h3>
              <div className="text-center mb-4">
                <div className="relative w-24 h-24 mx-auto">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#16a34a" strokeWidth="3"
                      strokeDasharray={`${stats.percentage} ${100 - stats.percentage}`} strokeDashoffset="0" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-[#0F172A]">{stats.percentage}%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-[#475569]"><CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> Present</span>
                  <span className="font-semibold text-[#0F172A]">{stats.present}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-[#475569]"><XCircle className="w-4 h-4 text-[#EF4444]" /> Absent</span>
                  <span className="font-semibold text-[#0F172A]">{stats.absent}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-[#475569]"><Clock className="w-4 h-4 text-[#F59E0B]" /> Late</span>
                  <span className="font-semibold text-[#0F172A]">{stats.late}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
