import { useState, useEffect, useMemo } from 'react';
import { userAPI, departmentAPI, subjectAPI, attendanceAPI, resultAPI, quizAPI, extractData } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, GraduationCap, BookOpen, CalendarCheck, Award,
  X, ChevronRight, Loader2, BarChart3, TrendingUp, Mail, Phone, MapPin,
  ClipboardList, FileText, Filter, Printer, ChevronLeft, ChevronRight as ChevronRightIcon, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';

export default function AdminStudentProfiles() {
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Profile modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileTab, setProfileTab] = useState('overview');

  // Pagination
  const PAGE_SIZE = 30;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    departmentAPI.getAll().then(r => setDepartments(extractData(r)));
  }, []);

  useEffect(() => {
    if (selectedDept && selectedSem) {
      // Load subjects for this department + semester
      subjectAPI.getAll({ department: selectedDept, semester: parseInt(selectedSem) })
        .then(r => setSubjects(extractData(r)))
        .catch(() => setSubjects([]));

      // Load students
      setLoading(true);
      userAPI.getStudents({ department: selectedDept, semester: parseInt(selectedSem), limit: 200 })
        .then(r => setStudents(extractData(r)))
        .catch(() => { setStudents([]); toast.error('Failed to load students'); })
        .finally(() => setLoading(false));
    } else {
      setStudents([]);
      setSubjects([]);
    }
    setSelectedSubject('');
  }, [selectedDept, selectedSem]);

  const openProfile = async (student) => {
    setSelectedStudent(student);
    setLoadingProfile(true);
    setProfileTab('overview');
    try {
      const params = {};
      if (selectedSubject) params.subject = selectedSubject;

      const [attRes, resultRes, quizRes] = await Promise.all([
        attendanceAPI.getStudent(student._id, params).catch(() => ({ data: { data: [] } })),
        resultAPI.getStudent(student._id).catch(() => ({ data: { data: [] } })),
        quizAPI.getAll({ student: student._id }).catch(() => ({ data: { data: [] } })),
      ]);
      const attendance = extractData(attRes);
      const results = extractData(resultRes);
      const quizzes = extractData(quizRes);

      // Fetch quiz attempts for each quiz to show detailed results
      let quizAttempts = [];
      if (quizzes.length > 0) {
        const attemptPromises = quizzes.slice(0, 20).map(q =>
          quizAPI.getAttempts(q._id).catch(() => ({ data: { data: [] } }))
        );
        const attemptResponses = await Promise.all(attemptPromises);
        attemptResponses.forEach((res, idx) => {
          const attempts = extractData(res);
          // Filter attempts for this student
          const studentAttempts = attempts.filter(a =>
            a.student?._id === student._id || a.student === student._id || a.user?._id === student._id || a.user === student._id
          );
          if (studentAttempts.length > 0) {
            quizAttempts.push({ quizId: quizzes[idx]._id, quizTitle: quizzes[idx].title, quizSubject: quizzes[idx].subject, attempts: studentAttempts });
          }
        });
      }

      // Calculate attendance stats
      const total = attendance.length;
      const present = attendance.filter(a => a.status === 'Present').length;
      const absent = attendance.filter(a => a.status === 'Absent').length;
      const late = attendance.filter(a => a.status === 'Late').length;
      const attendancePct = total > 0 ? ((present + late * 0.5) / total * 100).toFixed(1) : 0;

      // Calculate CGPA
      const approvedResults = results.filter(r => r.status === 'Approved');
      const totalMarksSum = approvedResults.reduce((s, r) => s + (r.totalMarks || 0), 0);
      const obtainedSum = approvedResults.reduce((s, r) => s + (r.marksObtained || 0), 0);
      const cgpa = totalMarksSum > 0 ? ((obtainedSum / totalMarksSum) * 4.0).toFixed(2) : 'N/A';

      // Group results by semester
      const resultsBySem = {};
      approvedResults.forEach(r => {
        const sem = r.semester || 'Unknown';
        if (!resultsBySem[sem]) resultsBySem[sem] = [];
        resultsBySem[sem].push(r);
      });

      // Group attendance by subject
      const attendanceBySubject = {};
      attendance.forEach(a => {
        const subj = a.subject?.name || 'Unknown';
        if (!attendanceBySubject[subj]) attendanceBySubject[subj] = { total: 0, present: 0, absent: 0, late: 0 };
        attendanceBySubject[subj].total++;
        if (a.status === 'Present') attendanceBySubject[subj].present++;
        else if (a.status === 'Absent') attendanceBySubject[subj].absent++;
        else if (a.status === 'Late') attendanceBySubject[subj].late++;
      });

      setProfileData({
        attendance, results, quizzes, quizAttempts,
        attendanceStats: { total, present, absent, late, attendancePct },
        cgpa, resultsBySem, attendanceBySubject
      });
    } catch (e) {
      toast.error('Failed to load profile data');
    }
    setLoadingProfile(false);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [selectedDept, selectedSem, searchTerm]);

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A] flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-[#16a34a]" /> Student Academic Profiles
          </h1>
          <p className="text-sm text-[#475569] mt-1">Select semester & subject to browse enrolled students, then click any student to view their full academic profile.</p>
        </div>

        {/* Prominent Selection Bar */}
        <div className="bg-gradient-to-r from-[#f0fdf4] to-white rounded-xl border-2 border-[#bbf7d0] p-3 sm:p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-[#16a34a]" />
            <span className="text-sm font-semibold text-[#15803d]">Select Semester & Subject to View Students</span>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#15803d]">Department *</label>
              <CustomSelect value={selectedDept} onValueChange={v => setSelectedDept(v)}
                options={[{ value: '', label: 'Select Department' }, ...departments.map(d => ({ value: d._id, label: d.name }))]}
                placeholder="Select Department"
                className="min-w-0 sm:min-w-[200px]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#15803d]">Semester *</label>
              <CustomSelect value={selectedSem} onValueChange={v => setSelectedSem(v)}
                options={[{ value: '', label: 'Select Semester' }, ...[1,2,3,4,5,6,7,8].map(s => ({ value: String(s), label: `Semester ${s}` }))]}
                placeholder="Select Semester"
                className="min-w-0 sm:min-w-[160px]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#15803d]">Subject</label>
              <CustomSelect value={selectedSubject} onValueChange={v => setSelectedSubject(v)}
                options={[{ value: '', label: 'All Subjects' }, ...subjects.map(s => ({ value: s._id, label: `${s.code} - ${s.name}` }))]}
                placeholder="All Subjects"
                className="min-w-0 sm:min-w-[200px]"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0 sm:min-w-[220px]">
              <label className="text-xs font-semibold text-[#15803d]">Search Student</label>
              <div className="relative">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#16a34a]" />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by name or reg #..."
                  className="w-full pl-10 pr-4 h-9 sm:h-10 bg-white border border-[#E2E8F0] rounded-lg text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Students Grid */}
        {!selectedDept || !selectedSem ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-16 text-center">
            <GraduationCap className="w-16 h-16 text-[#CBD5E1] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">No Students Loaded Yet</h3>
            <p className="text-sm text-[#94A3B8] max-w-md mx-auto">To browse student profiles, please select a <strong>Department</strong> and <strong>Semester</strong> from the filters above. This will load all enrolled students for your selection.</p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <Loader2 className="w-8 h-8 text-[#16a34a] mx-auto mb-3 animate-spin" />
            <p className="text-sm text-[#94A3B8]">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <Users className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-sm text-[#94A3B8]">No students found for this selection.</p>
          </div>
        ) : (
          <>
            <div className="bg-[#f0fdf4] rounded-xl border border-[#bbf7d0] p-3 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#16a34a]" />
              <span className="text-sm text-[#15803d] font-medium">{filteredStudents.length} students found</span>
              {selectedSubject && <span className="text-xs text-[#475569] ml-2">— filtered by {subjects.find(s => s._id === selectedSubject)?.name || 'subject'}</span>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {paginatedStudents.map(student => (
                <button key={student._id} onClick={() => openProfile(student)}
                  className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5 text-left hover:shadow-md hover:border-[#16a34a] transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#16a34a]/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-[#16a34a]">{student.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A] truncate">{student.name}</p>
                      <p className="text-xs text-[#94A3B8]">{student.registrationNumber}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#16a34a] transition-colors" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#64748B]">
                    <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />Sem {student.semester}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${student.status === 'Active' ? 'bg-green-50 text-[#16a34a]' : 'bg-gray-100 text-gray-600'}`}>{student.status}</span>
                  </div>
                </button>
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => (
                      <span key={p}>
                        {idx > 0 && arr[idx - 1] < p - 1 && <span className="px-1 text-[#94A3B8]">...</span>}
                        <button onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                            currentPage === p ? 'bg-[#16a34a] text-white' : 'hover:bg-[#F8FAFC] text-[#475569]'
                          }`}>{p}</button>
                      </span>
                    ))}
                </div>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed">
                  Next <ChevronRightIcon className="w-4 h-4" />
                </button>
                <span className="text-xs text-[#94A3B8] ml-2">{filteredStudents.length} students</span>
              </div>
            )}
          </>
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
                <div className="flex items-center gap-2">
                  <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#475569] hover:border-[#16a34a] hover:text-[#16a34a] transition-all">
                    <Printer className="w-3.5 h-3.5" /> Print Profile
                  </button>
                  <button onClick={() => { setSelectedStudent(null); setProfileData(null); }} className="p-2 hover:bg-[#F1F5F9] rounded-lg">
                    <X className="w-5 h-5 text-[#64748B]" />
                  </button>
                </div>
              </div>

              {/* Profile Tabs */}
              {profileData && (
                <div className="sticky top-[73px] bg-white border-b border-[#E2E8F0] px-5 py-2 flex gap-1 z-10">
                  {[
                    { key: 'overview', label: 'Overview', icon: BarChart3 },
                    { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
                    { key: 'results', label: 'Results', icon: Award },
                    { key: 'quizzes', label: 'Quizzes', icon: HelpCircle },
                  ].map(t => (
                    <button key={t.key} onClick={() => setProfileTab(t.key)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        profileTab === t.key ? 'bg-[#16a34a] text-white' : 'text-[#475569] hover:bg-[#F1F5F9]'
                      }`}>
                      <t.icon className="w-3.5 h-3.5" /> {t.label}
                    </button>
                  ))}
                </div>
              )}

              {loadingProfile ? (
                <div className="p-12 text-center"><Loader2 className="w-8 h-8 text-[#16a34a] animate-spin mx-auto" /></div>
              ) : profileData ? (
                <div className="p-5 space-y-6">
                  {/* Overview Tab */}
                  {profileTab === 'overview' && (<>
                    {/* Student Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                      <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#94A3B8]" /><span className="text-sm text-[#475569] truncate">{selectedStudent.email}</span></div>
                      <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#94A3B8]" /><span className="text-sm text-[#475569]">{selectedStudent.phone || '-'}</span></div>
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#94A3B8]" /><span className="text-sm text-[#475569]">{selectedStudent.department?.name || selectedStudent.department || '-'}</span></div>
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
                        <HelpCircle className="w-5 h-5 text-[#8B5CF6] mx-auto mb-1" />
                        <p className="text-xl sm:text-2xl font-bold text-[#0F172A]">{profileData.quizAttempts?.length || profileData.quizzes?.length || 0}</p>
                        <p className="text-xs text-[#64748B]">Quiz Attempts</p>
                      </div>
                    </div>

                    {/* Quick Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5">
                        <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Attendance Summary</h3>
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
                      <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5">
                        <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Academic Summary</h3>
                        <div className="flex gap-6">
                          <div><span className="text-xs text-[#94A3B8]">CGPA</span><p className="text-lg font-semibold text-[#3B82F6]">{profileData.cgpa}</p></div>
                          <div><span className="text-xs text-[#94A3B8]">Results</span><p className="text-lg font-semibold text-[#F59E0B]">{profileData.results.filter(r => r.status === 'Approved').length}</p></div>
                          <div><span className="text-xs text-[#94A3B8]">Assignments</span><p className="text-lg font-semibold text-[#8B5CF6]">{profileData.results.filter(r => r.examType === 'Assignment' || r.examType === 'assignment').length}</p></div>
                          <div><span className="text-xs text-[#94A3B8]">Quiz Attempts</span><p className="text-lg font-semibold text-[#16a34a]">{profileData.quizAttempts?.length || 0}</p></div>
                          <div><span className="text-xs text-[#94A3B8]">Classes</span><p className="text-lg font-semibold text-[#64748B]">{profileData.attendanceStats.total}</p></div>
                        </div>
                      </div>
                    </div>
                  </>)}

                  {/* Attendance Tab */}
                  {profileTab === 'attendance' && (<>
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

                    {/* Attendance by Subject */}
                    {Object.keys(profileData.attendanceBySubject || {}).length > 0 && (
                      <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5">
                        <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Attendance by Subject</h3>
                        <div className="space-y-3">
                          {Object.entries(profileData.attendanceBySubject).map(([subject, data]) => {
                            const pct = data.total > 0 ? ((data.present + data.late * 0.5) / data.total * 100).toFixed(0) : 0;
                            return (
                              <div key={subject} className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <BookOpen className="w-4 h-4 text-[#16a34a] flex-shrink-0" />
                                <span className="text-sm text-[#0F172A] flex-1">{subject}</span>
                                <span className="text-xs text-[#475569]">{data.present + data.late}/{data.total}</span>
                                <div className="w-20 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${pct >= 75 ? 'bg-[#16a34a]' : pct >= 50 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs font-medium w-10 text-right">{pct}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

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
                  </>)}

                  {/* Results Tab */}
                  {profileTab === 'results' && (<>
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
                  </>)}

                  {/* Quizzes Tab */}
                  {profileTab === 'quizzes' && (<>
                    {/* Quiz Attempt Results */}
                    {profileData.quizAttempts && profileData.quizAttempts.length > 0 && (
                      <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5 mb-4">
                        <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Quiz Attempt Results</h3>
                        <div className="space-y-3">
                          {profileData.quizAttempts.map((qa, i) => (
                            <div key={qa.quizId || i} className="p-4 rounded-lg bg-[#F8FAFC] border border-[#F1F5F9]">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                                  <HelpCircle className="w-4 h-4 text-[#8B5CF6]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-[#0F172A] truncate">{qa.quizTitle || 'Untitled Quiz'}</p>
                                  <p className="text-xs text-[#94A3B8]">{qa.quizSubject?.name || 'Subject'}</p>
                                </div>
                              </div>
                              <div className="space-y-2 ml-11">
                                {qa.attempts.map((att, j) => (
                                  <div key={att._id || j} className="flex items-center gap-4 text-sm">
                                    <span className="text-xs text-[#94A3B8]">Attempt {j + 1}</span>
                                    <span className="font-medium text-[#0F172A]">
                                      {att.score !== undefined ? `${att.score}/${att.totalMarks || att.totalQuestions || '-'}` : 'In Progress'}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      att.status === 'Completed' ? 'bg-green-50 text-[#16a34a]' :
                                      att.status === 'In Progress' ? 'bg-yellow-50 text-[#F59E0B]' :
                                      'bg-[#F1F5F9] text-[#64748B]'
                                    }`}>{att.status || 'Submitted'}</span>
                                    {att.timeSpent && <span className="text-xs text-[#94A3B8]">{att.timeSpent}s</span>}
                                    {att.submittedAt && <span className="text-xs text-[#94A3B8] ml-auto">{new Date(att.submittedAt).toLocaleDateString()}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Available Quizzes */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5">
                      <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Available Quizzes</h3>
                      {!profileData.quizzes || profileData.quizzes.length === 0 ? (
                        <div className="text-center py-6">
                          <HelpCircle className="w-10 h-10 text-[#CBD5E1] mx-auto mb-2" />
                          <p className="text-sm text-[#94A3B8]">No quizzes found for this student.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {profileData.quizzes.map((q, i) => {
                            const hasAttempt = profileData.quizAttempts?.some(qa => qa.quizId === q._id);
                            return (
                              <div key={q._id || i} className="flex items-center gap-4 p-4 rounded-lg bg-[#F8FAFC] border border-[#F1F5F9]">
                                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                                  <HelpCircle className="w-5 h-5 text-[#8B5CF6]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-[#0F172A] truncate">{q.title || 'Untitled Quiz'}</p>
                                  <p className="text-xs text-[#94A3B8]">{q.subject?.name || 'Subject'} • {q.totalQuestions || 0} questions • {q.duration || 0} min</p>
                                </div>
                                <div className="text-right">
                                  {q.score !== undefined && (
                                    <p className="text-sm font-semibold text-[#0F172A]">{q.score}/{q.totalMarks || q.totalQuestions}</p>
                                  )}
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    hasAttempt ? 'bg-green-50 text-[#16a34a]' :
                                    q.status === 'Completed' ? 'bg-green-50 text-[#16a34a]' :
                                    q.status === 'In Progress' ? 'bg-yellow-50 text-[#F59E0B]' :
                                    'bg-[#F1F5F9] text-[#64748B]'
                                  }`}>{hasAttempt ? 'Attempted' : (q.status || 'Available')}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>)}
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
