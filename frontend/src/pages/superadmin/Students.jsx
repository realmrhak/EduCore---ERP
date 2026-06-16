import { useState, useEffect, useCallback } from 'react';
import { userAPI, departmentAPI, attendanceAPI, resultAPI, extractData } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, Mail, Phone, MapPin, GraduationCap, CalendarCheck, Award, BookOpen, BarChart3, X, ChevronRight, Loader2, UserPlus, Edit2, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import toast from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const debouncedSearch = useDebounce(search, 400);

  // Profile modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20, search: debouncedSearch || undefined };
      if (department) params.department = department;
      if (semester) params.semester = semester;
      const r = await userAPI.getStudents(params);
      const studentsArray = extractData(r);
      setStudents(studentsArray);
      // Extract total count from various response shapes
      const body = r?.data;
      const totalVal = body?.pagination?.total ?? body?.data?.pagination?.total ?? body?.data?.total ?? body?.total ?? studentsArray.length;
      setTotal(typeof totalVal === 'number' ? totalVal : studentsArray.length);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Failed to load students');
    }
    setLoading(false);
  }, [page, debouncedSearch, department, semester]);

  useEffect(() => {
    departmentAPI.getAll().then((r) => {
      setDepartments(extractData(r));
    });
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const openProfile = async (student) => {
    setSelectedStudent(student);
    setLoadingProfile(true);
    try {
      const [attRes, resultRes] = await Promise.all([
        attendanceAPI.getStudent(student._id).catch(() => ({ data: { data: [] } })),
        resultAPI.getStudent(student._id).catch(() => ({ data: { data: [] } })),
      ]);
      const attendance = extractData(attRes);
      const results = extractData(resultRes);

      const totalAtt = attendance.length;
      const present = attendance.filter(a => a.status === 'Present').length;
      const absent = attendance.filter(a => a.status === 'Absent').length;
      const late = attendance.filter(a => a.status === 'Late').length;
      const attendancePct = totalAtt > 0 ? ((present + late * 0.5) / totalAtt * 100).toFixed(1) : 0;

      const approvedResults = results.filter(r => r.status === 'Approved');
      const totalMarksSum = approvedResults.reduce((s, r) => s + (r.totalMarks || 0), 0);
      const obtainedSum = approvedResults.reduce((s, r) => s + (r.marksObtained || 0), 0);
      const cgpa = totalMarksSum > 0 ? ((obtainedSum / totalMarksSum) * 4.0).toFixed(2) : 'N/A';

      const resultsBySem = {};
      approvedResults.forEach(r => {
        const sem = r.semester || 'Unknown';
        if (!resultsBySem[sem]) resultsBySem[sem] = [];
        resultsBySem[sem].push(r);
      });

      setProfileData({ attendance, results, attendanceStats: { total: totalAtt, present, absent, late, attendancePct }, cgpa, resultsBySem });
    } catch (e) {
      toast.error('Failed to load profile data');
    }
    setLoadingProfile(false);
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6">
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A] flex items-center gap-2">
            <Users className="w-6 h-6" /> Student Management
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <p className="text-sm text-[#475569]">{total} students registered</p>
            <button onClick={fetchStudents} disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#16a34a] border border-[#16a34a]/30 rounded-lg hover:bg-[#f0fdf4] disabled:opacity-50 transition-all">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 max-w-full sm:max-w-sm">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#16a34a]" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or reg #..." className="w-full pl-10 pr-4 h-9 sm:h-10 bg-white border border-[#E2E8F0] rounded-lg text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
          </div>
          <CustomSelect value={department} onValueChange={(v) => { setDepartment(v); setPage(1); }}
            options={[{ value: '', label: 'All Departments' }, ...departments.map(d => ({ value: d._id, label: d.name }))]}
            placeholder="All Departments" className="w-full sm:w-auto" />
          <CustomSelect value={semester} onValueChange={(v) => { setSemester(v); setPage(1); }}
            options={[{ value: '', label: 'All Semesters' }, ...[1,2,3,4,5,6,7,8].map(s => ({ value: String(s), label: `Semester ${s}` }))]}
            placeholder="All Semesters" className="w-full sm:w-auto" />
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[#475569]">Student</th>
                <th className="text-left px-4 py-3 font-medium text-[#475569]">Reg. No.</th>
                <th className="text-left px-4 py-3 font-medium text-[#475569]">Department</th>
                <th className="text-left px-4 py-3 font-medium text-[#475569]">Semester</th>
                <th className="text-left px-4 py-3 font-medium text-[#475569]">Status</th>
                <th className="text-left px-4 py-3 font-medium text-[#475569]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F1F5F9]">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-[#F1F5F9] animate-pulse" /><div className="space-y-2"><div className="w-24 h-3 bg-[#F1F5F9] rounded animate-pulse" /><div className="w-32 h-2.5 bg-[#F1F5F9] rounded animate-pulse" /></div></div></td>
                    <td className="px-4 py-3"><div className="w-20 h-3 bg-[#F1F5F9] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="w-24 h-3 bg-[#F1F5F9] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="w-14 h-3 bg-[#F1F5F9] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="w-14 h-5 bg-[#F1F5F9] rounded-full animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="w-20 h-3 bg-[#F1F5F9] rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center">
                  <AlertCircle className="w-10 h-10 text-[#EF4444] mx-auto mb-2" />
                  <p className="text-sm text-[#64748B] mb-3">{error}</p>
                  <button onClick={fetchStudents} className="px-4 py-2 text-sm font-medium text-white bg-[#16a34a] rounded-lg hover:bg-[#15803d] transition-colors">
                    <RefreshCw className="w-4 h-4 inline mr-1" /> Retry
                  </button>
                </td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center"><Users className="w-10 h-10 text-[#CBD5E1] mx-auto mb-2" /><p className="text-sm text-[#94A3B8]">No students found</p></td></tr>
              ) : students.map((s) => (
                <tr key={s._id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] cursor-pointer transition-colors" onClick={() => openProfile(s)}>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#16a34a]/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-[#16a34a]">{s.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-[#0F172A]">{s.name}</p>
                        <p className="text-xs text-[#94A3B8]">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#475569]">{s.registrationNumber}</td>
                  <td className="px-4 py-3">{s.department?.name || '-'}</td>
                  <td className="px-4 py-3">Sem {s.semester}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'Active' ? 'bg-green-50 text-[#16a34a]' : 'bg-gray-100 text-gray-600'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="flex items-center gap-1 text-xs font-medium text-[#16a34a] hover:text-[#15803d] transition-colors">
                      View Profile <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 20 && (
          <div className="flex justify-center items-center gap-3 mt-4">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}
              className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm disabled:opacity-40 hover:border-[#16a34a] hover:text-[#16a34a] transition-colors">Previous</button>
            <span className="text-sm text-[#475569]">Page {page} of {Math.ceil(total / 20)}</span>
            <button disabled={page * 20 >= total} onClick={() => setPage(page + 1)}
              className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm disabled:opacity-40 hover:border-[#16a34a] hover:text-[#16a34a] transition-colors">Next</button>
          </div>
        )}
      </motion.div>

      {/* Student Profile Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => { setSelectedStudent(null); setProfileData(null); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-[#E2E8F0] p-5 flex items-center justify-between z-10">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#16a34a]/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-[#16a34a]">{selectedStudent.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#0F172A]">{selectedStudent.name}</h2>
                    <p className="text-sm text-[#64748B]">{selectedStudent.registrationNumber} — Semester {selectedStudent.semester}</p>
                  </div>
                </div>
                <button onClick={() => { setSelectedStudent(null); setProfileData(null); }} className="p-2 hover:bg-[#F1F5F9] rounded-lg">
                  <X className="w-5 h-5 text-[#64748B]" />
                </button>
              </div>

              {loadingProfile ? (
                <div className="p-12 text-center"><Loader2 className="w-8 h-8 text-[#16a34a] animate-spin mx-auto" /></div>
              ) : profileData ? (
                <div className="p-5 space-y-6">
                  {/* Student Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#94A3B8]" /><span className="text-sm text-[#475569] truncate">{selectedStudent.email}</span></div>
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#94A3B8]" /><span className="text-sm text-[#475569]">{selectedStudent.phone || '-'}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#94A3B8]" /><span className="text-sm text-[#475569]">{selectedStudent.department?.name || '-'}</span></div>
                    <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-[#94A3B8]" /><span className="text-sm text-[#475569]">Semester {selectedStudent.semester}</span></div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-[#f0fdf4] rounded-xl p-4 text-center">
                      <CalendarCheck className="w-5 h-5 text-[#16a34a] mx-auto mb-1" />
                      <p className="text-xl sm:text-2xl font-bold text-[#0F172A]">{profileData.attendanceStats.attendancePct}%</p>
                      <p className="text-xs text-[#64748B]">Attendance</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <Award className="w-5 h-5 text-[#3B82F6] mx-auto mb-1" />
                      <p className="text-xl sm:text-2xl font-bold text-[#0F172A]">{profileData.cgpa}</p>
                      <p className="text-xs text-[#64748B]">CGPA (4.0 scale)</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4 text-center">
                      <BookOpen className="w-5 h-5 text-[#F59E0B] mx-auto mb-1" />
                      <p className="text-xl sm:text-2xl font-bold text-[#0F172A]">{profileData.results.filter(r => r.status === 'Approved').length}</p>
                      <p className="text-xs text-[#64748B]">Approved Results</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                      <BarChart3 className="w-5 h-5 text-[#8B5CF6] mx-auto mb-1" />
                      <p className="text-xl sm:text-2xl font-bold text-[#0F172A]">{profileData.attendanceStats.total}</p>
                      <p className="text-xs text-[#64748B]">Total Classes</p>
                    </div>
                  </div>

                  {/* Attendance Breakdown */}
                  <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5">
                    <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Attendance Breakdown</h3>
                    <div className="flex gap-6">
                      <div><span className="text-xs text-[#94A3B8]">Present</span><p className="text-lg font-semibold text-[#16a34a]">{profileData.attendanceStats.present}</p></div>
                      <div><span className="text-xs text-[#94A3B8]">Absent</span><p className="text-lg font-semibold text-[#EF4444]">{profileData.attendanceStats.absent}</p></div>
                      <div><span className="text-xs text-[#94A3B8]">Late</span><p className="text-lg font-semibold text-[#F59E0B]">{profileData.attendanceStats.late}</p></div>
                      <div className="ml-auto">
                        <div className="w-32 h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                          <div className="h-full bg-[#16a34a] rounded-full" style={{ width: `${profileData.attendanceStats.attendancePct}%` }} />
                        </div>
                        <p className="text-xs text-[#94A3B8] text-right mt-1">{profileData.attendanceStats.attendancePct}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Results by Semester */}
                  <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5">
                    <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Results by Semester</h3>
                    {Object.keys(profileData.resultsBySem).length === 0 ? (
                      <p className="text-sm text-[#94A3B8]">No approved results yet.</p>
                    ) : (
                      Object.entries(profileData.resultsBySem).map(([sem, results]) => (
                        <div key={sem} className="mb-4">
                          <p className="text-xs font-semibold text-[#64748B] uppercase mb-2">Semester {sem}</p>
                          <div className="space-y-2">
                            {results.map((r, i) => (
                              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-[#F8FAFC]">
                                <BookOpen className="w-4 h-4 text-[#16a34a]" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-[#0F172A] truncate">{r.subject?.name || 'Subject'}</p>
                                  <p className="text-xs text-[#94A3B8]">{r.examType}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-[#0F172A]">{r.marksObtained}/{r.totalMarks}</p>
                                  <p className="text-xs text-[#94A3B8]">{((r.marksObtained / r.totalMarks) * 100).toFixed(0)}%</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Recent Attendance Records */}
                  <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5">
                    <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Recent Attendance</h3>
                    {profileData.attendance.length === 0 ? (
                      <p className="text-sm text-[#94A3B8]">No attendance records yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {profileData.attendance.slice(0, 15).map((a, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="text-[#94A3B8] w-24">{new Date(a.date).toLocaleDateString()}</span>
                            <span className="text-[#475569] flex-1">{a.subject?.name || 'Subject'}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              a.status === 'Present' ? 'bg-green-50 text-[#16a34a]' :
                              a.status === 'Late' ? 'bg-yellow-50 text-[#F59E0B]' :
                              'bg-red-50 text-[#EF4444]'
                            }`}>{a.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
