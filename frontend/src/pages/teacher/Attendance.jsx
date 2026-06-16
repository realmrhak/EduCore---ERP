import { useState, useEffect, useMemo } from 'react';
import { subjectAPI, userAPI, attendanceAPI, academicSessionAPI, extractData } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { CalendarDays, CheckCircle2, XCircle, Save, Users, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';

export default function TeacherAttendance() {
  const { user } = useAuth();
  const [allSubjects, setAllSubjects] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeAcademicSession, setActiveAcademicSession] = useState(null);

  // Fetch all subjects assigned to this teacher
  useEffect(() => {
    if (user?._id) {
      setLoadingSubjects(true);
      subjectAPI.getAll({ assignedTeacher: user._id })
        .then(r => {
          const subs = extractData(r);
          setAllSubjects(subs);
        })
        .catch(err => {
          console.error('Failed to load subjects:', err);
          setError('Failed to load subjects. Please refresh the page.');
        })
        .finally(() => setLoadingSubjects(false));
    }
  }, [user]);

  // Fetch active academic session
  useEffect(() => {
    if (user?.academicSession) {
      setActiveAcademicSession(user.academicSession);
    } else {
      academicSessionAPI.getActive()
        .then(r => {
          const session = r.data?.data ?? r.data;
          if (session) setActiveAcademicSession(session._id || session);
        })
        .catch(err => console.error('Failed to fetch active session:', err));
    }
  }, [user]);

  // Derive unique semesters from teacher's assigned subjects, fallback to all 8
  const availableSemesters = useMemo(() => {
    const semSet = new Set();
    allSubjects.forEach(s => {
      if (s.semester) semSet.add(s.semester);
    });
    const sems = Array.from(semSet).sort((a, b) => a - b);
    return sems.length > 0 ? sems : [1, 2, 3, 4, 5, 6, 7, 8];
  }, [allSubjects]);

  // Filter subjects by selected semester
  const filteredSubjects = useMemo(() => {
    if (!selectedSemester) return [];
    return allSubjects.filter(s => s.semester === parseInt(selectedSemester));
  }, [allSubjects, selectedSemester]);

  // Reset subject when semester changes
  useEffect(() => {
    if (filteredSubjects.length > 0) {
      setSelectedSubject(filteredSubjects[0]._id);
    } else {
      setSelectedSubject('');
    }
  }, [selectedSemester, filteredSubjects]);

  // Get the currently selected subject object
  const selectedSubjectObj = useMemo(() => {
    return filteredSubjects.find(s => s._id === selectedSubject) || null;
  }, [filteredSubjects, selectedSubject]);

  // Fetch students when both semester and subject are selected
  useEffect(() => {
    if (!selectedSemester || !selectedSubject || !selectedSubjectObj) {
      setStudents([]);
      return;
    }

    const departmentId = selectedSubjectObj.department?._id || selectedSubjectObj.department;
    if (!departmentId) {
      setStudents([]);
      return;
    }

    setLoadingStudents(true);
    setError('');

    userAPI.getStudents({
      department: departmentId,
      semester: selectedSemester,
      limit: 200,
    })
      .then(r => {
        const data = extractData(r);
        const studentList = Array.isArray(data) ? data : (data.students || []);
        setStudents(studentList);
      })
      .catch(err => {
        console.error('Failed to load students:', err);
        setError('Failed to load students. Please try again.');
        setStudents([]);
      })
      .finally(() => setLoadingStudents(false));

    // Reset attendance when selection changes
    setAttendance({});
  }, [selectedSemester, selectedSubject, selectedSubjectObj]);

  const toggleAttendance = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const allMarked = {};
    students.forEach(s => {
      allMarked[s._id] = status;
    });
    setAttendance(allMarked);
  };

  const handleSubmit = async () => {
    if (!selectedSubjectObj) {
      toast.error('Please select a subject');
      return;
    }

    const departmentId = selectedSubjectObj.department?._id || selectedSubjectObj.department;
    if (!departmentId) {
      toast.error('Could not determine department. Please ensure the subject has a department.');
      return;
    }

    if (!activeAcademicSession) {
      toast.error('Academic session not found. Please contact admin.');
      return;
    }

    const records = Object.entries(attendance).map(([studentId, status]) => ({
      student: studentId,
      subject: selectedSubject,
      department: departmentId,
      semester: parseInt(selectedSemester),
      academicSession: activeAcademicSession,
      date,
      status,
    }));

    if (records.length === 0) {
      toast.error('Please mark attendance for at least one student');
      return;
    }

    setSubmitting(true);
    try {
      await attendanceAPI.mark(records);
      toast.success(`Attendance marked for ${records.length} student(s)`);
      setAttendance({});
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to mark attendance';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = Object.values(attendance).filter(v => v === 'Present').length;
  const absentCount = Object.values(attendance).filter(v => v === 'Absent').length;

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">Mark Attendance</h1>
          <p className="text-sm text-[#475569]">Record student attendance for your assigned subjects.</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 mb-6">
          <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
            {/* Date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#475569]">Date</label>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#94A3B8]" />
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="px-3 py-1.5 sm:py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs sm:text-sm outline-none"
                />
              </div>
            </div>

            {/* Semester Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#475569]">Semester</label>
              <CustomSelect
                value={selectedSemester}
                onValueChange={v => setSelectedSemester(v)}
                options={[{ value: '', label: 'Select Semester' }, ...availableSemesters.map(sem => ({ value: String(sem), label: `Semester ${sem}` }))]}
                placeholder="Select Semester"
                className="w-full sm:w-auto"
              />
            </div>

            {/* Subject Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#475569]">Subject</label>
              <CustomSelect
                value={selectedSubject}
                onValueChange={v => setSelectedSubject(v)}
                options={
                  loadingSubjects
                    ? [{ value: '', label: 'Loading...' }]
                    : !selectedSemester
                    ? [{ value: '', label: 'Select semester first' }]
                    : filteredSubjects.length === 0
                    ? [{ value: '', label: 'No subjects in this semester' }]
                    : filteredSubjects.map(s => ({ value: s._id, label: `${s.name} (${s.code})` }))
                }
                placeholder="Select Subject"
                className="w-full sm:w-auto"
                disabled={!selectedSemester}
              />
            </div>

            {/* Stats */}
            {selectedSemester && selectedSubject && students.length > 0 && (
              <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                <span className="flex items-center gap-1 text-[#16a34a]"><CheckCircle2 className="w-4 h-4" /> {presentCount} Present</span>
                <span className="flex items-center gap-1 text-[#EF4444]"><XCircle className="w-4 h-4" /> {absentCount} Absent</span>
                <span className="flex items-center gap-1 text-[#475569]"><Users className="w-4 h-4" /> {students.length - presentCount - absentCount} Unmarked</span>
              </div>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0" />
            <p className="text-sm text-[#EF4444]">{error}</p>
          </div>
        )}

        {/* No Selection State */}
        {!selectedSemester && !loadingSubjects && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <CalendarDays className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#0F172A] mb-1">Select Semester & Subject</h3>
            <p className="text-sm text-[#94A3B8]">Choose a semester and subject to start marking attendance.</p>
          </div>
        )}

        {selectedSemester && !selectedSubject && !loadingSubjects && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <CalendarDays className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#0F172A] mb-1">No Subjects Available</h3>
            <p className="text-sm text-[#94A3B8]">You are not assigned any subjects for Semester {selectedSemester}.</p>
          </div>
        )}

        {/* Loading Students */}
        {loadingStudents && selectedSemester && selectedSubject && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <Loader2 className="w-10 h-10 text-[#16a34a] mx-auto mb-4 animate-spin" />
            <p className="text-sm text-[#475569]">Loading students...</p>
          </div>
        )}

        {/* Attendance Table */}
        {!loadingStudents && selectedSemester && selectedSubject && students.length > 0 && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden mb-6">
            {/* Quick Actions */}
            <div className="p-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center gap-3">
              <span className="text-xs text-[#475569]">Quick Mark:</span>
              <button
                onClick={() => handleMarkAll('Present')}
                className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-[#16a34a] hover:bg-green-100 transition-all"
              >
                All Present
              </button>
              <button
                onClick={() => handleMarkAll('Absent')}
                className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-[#EF4444] hover:bg-red-100 transition-all"
              >
                All Absent
              </button>
            </div>

            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[rgba(22,163,74,0.06)]">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Reg. No</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Student Name</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id} className="border-t border-[#F1F5F9]">
                    <td className="px-4 py-3 text-sm font-medium text-[#16a34a]">{s.registrationNumber || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#0F172A]">{s.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => toggleAttendance(s._id, 'Present')}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            attendance[s._id] === 'Present'
                              ? 'bg-green-100 text-[#16a34a] ring-2 ring-[#16a34a]'
                              : 'bg-gray-100 text-[#94A3B8] hover:bg-green-50'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => toggleAttendance(s._id, 'Absent')}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            attendance[s._id] === 'Absent'
                              ? 'bg-red-100 text-[#EF4444] ring-2 ring-[#EF4444]'
                              : 'bg-gray-100 text-[#94A3B8] hover:bg-red-50'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* No students found */}
        {!loadingStudents && selectedSemester && selectedSubject && students.length === 0 && !error && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <Users className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#0F172A] mb-1">No Students Found</h3>
            <p className="text-sm text-[#94A3B8]">No students are enrolled in this subject for the selected semester.</p>
          </div>
        )}

        {/* Submit Button */}
        {selectedSemester && selectedSubject && students.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(attendance).length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#16a34a] text-white rounded-lg text-sm font-semibold hover:bg-[#15803d] transition-all disabled:opacity-60 shrink-0"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Attendance
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
