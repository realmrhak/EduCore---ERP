import { useState, useEffect } from 'react';
import { resultAPI, subjectAPI, userAPI, academicSessionAPI, extractData } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { FileText, Upload, CheckCircle2, XCircle, Save, TrendingUp, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';

export default function TeacherResults() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [examType, setExamType] = useState('Mid-Term');
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [totalMarks, setTotalMarks] = useState(100);
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [activeSession, setActiveSession] = useState(null);

  // Show all 8 semesters always (filtered by subjects assigned)
  const semesters = [...new Set(subjects.map(s => s.semester))].sort((a, b) => a - b);
  // If no subjects loaded yet, show all 8
  const displaySemesters = semesters.length > 0 ? semesters : [1, 2, 3, 4, 5, 6, 7, 8];

  // Derived: subjects filtered by selected semester
  const filteredSubjects = selectedSemester
    ? subjects.filter(s => s.semester === parseInt(selectedSemester))
    : subjects;

  // Get the currently selected subject object
  const selectedSubjectObj = subjects.find(s => s._id === selectedSubject);

  // Fetch teacher's assigned subjects
  useEffect(() => {
    if (user?._id || user?.id) {
      const teacherId = user._id || user.id;
      subjectAPI.getAll({ assignedTeacher: teacherId }).then(r => {
        const subs = extractData(r);
        setSubjects(subs);
      }).catch(() => toast.error('Failed to load subjects'));
    }
  }, [user]);

  // Fetch active academic session
  useEffect(() => {
    academicSessionAPI.getActive().then(r => {
      const session = r.data?.data ?? r.data;
      if (session) setActiveSession(session);
    }).catch(() => {/* non-critical */});
  }, []);

  // Fetch real students when both semester & subject are selected
  useEffect(() => {
    if (selectedSemester && selectedSubject && selectedSubjectObj) {
      setFetchingStudents(true);
      setMarks({});
      userAPI.getStudents({
        department: selectedSubjectObj.department?._id || selectedSubjectObj.department,
        semester: parseInt(selectedSemester),
        limit: 200,
      }).then(r => {
        const list = extractData(r);
        setStudents(list);
      }).catch(() => {
        toast.error('Failed to load students');
        setStudents([]);
      }).finally(() => setFetchingStudents(false));
    } else {
      setStudents([]);
      setMarks({});
    }
  }, [selectedSemester, selectedSubject]);

  const updateMark = (studentId, value) => {
    setMarks(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedSubject || !selectedSemester) {
      toast.error('Please select semester and subject first');
      return;
    }

    const departmentId = selectedSubjectObj?.department?._id || selectedSubjectObj?.department;
    const academicSessionId = activeSession?._id || activeSession?.id;

    const results = Object.entries(marks)
      .filter(([, mark]) => mark !== '' && mark !== undefined)
      .map(([studentId, marksObtained]) => ({
        student: studentId,
        subject: selectedSubject,
        department: departmentId,
        semester: parseInt(selectedSemester),
        academicSession: academicSessionId,
        examType,
        marksObtained: parseInt(marksObtained),
        totalMarks: parseInt(totalMarks),
      }));

    if (results.length === 0) {
      toast.error('Please enter marks for at least one student');
      return;
    }

    // Validate all required fields
    const missing = results.find(r => !r.department || !r.semester || !r.academicSession);
    if (missing) {
      toast.error('Missing department, semester, or academic session. Check your subject selection.');
      return;
    }

    setLoading(true);
    try {
      await resultAPI.create(results);
      toast.success('Results uploaded successfully');
      setMarks({});
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to upload results');
    } finally {
      setLoading(false);
    }
  };

  const getGrade = (marksObtained) => {
    const pct = (marksObtained / totalMarks) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">Upload Results</h1>
          <p className="text-sm text-[#475569]">Publish exam results for your assigned subjects.</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 mb-6 flex flex-wrap gap-2 sm:gap-4 items-center">
          {/* Semester Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#64748B]">Semester</label>
            <CustomSelect
              value={selectedSemester}
              onValueChange={v => {
                setSelectedSemester(v);
                setSelectedSubject('');
              }}
              options={[{ value: '', label: 'Select Semester' }, ...displaySemesters.map(s => ({ value: String(s), label: `Semester ${s}` }))]}
              placeholder="Select Semester"
              className="w-full sm:w-auto"
            />
          </div>

          {/* Subject Dropdown - filtered by semester */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#64748B]">Subject</label>
            <CustomSelect
              value={selectedSubject}
              onValueChange={v => setSelectedSubject(v)}
              options={[{ value: '', label: 'Select Subject' }, ...filteredSubjects.map(s => ({ value: s._id, label: `${s.name} (${s.code})` }))]}
              placeholder="Select Subject"
              className="w-full sm:w-auto"
              disabled={!selectedSemester}
            />
          </div>

          {/* Exam Type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#64748B]">Exam Type</label>
            <CustomSelect
              value={examType}
              onValueChange={v => setExamType(v)}
              options={[
                { value: 'Mid-Term', label: 'Mid-Term' },
                { value: 'Final-Term', label: 'Final-Term' },
                { value: 'Quiz', label: 'Quiz' },
                { value: 'Assignment', label: 'Assignment' },
                { value: 'Lab', label: 'Lab' },
              ]}
              placeholder="Select Exam Type"
              className="w-full sm:w-auto"
            />
          </div>

          {/* Total Marks */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-[#475569]">Total Marks</label>
            <input
              type="number"
              value={totalMarks}
              onChange={e => setTotalMarks(parseInt(e.target.value) || 100)}
              className="w-full sm:w-24 px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#0F172A] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 text-center"
              min={1}
            />
          </div>
        </div>

        {/* No semester/subject selected prompt */}
        {!selectedSemester || !selectedSubject ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <FileText className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-sm text-[#94A3B8]">Select a semester and subject to load enrolled students.</p>
          </div>
        ) : fetchingStudents ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <Loader2 className="w-8 h-8 text-[#16a34a] mx-auto mb-3 animate-spin" />
            <p className="text-sm text-[#94A3B8]">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <FileText className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-sm text-[#94A3B8]">No students found for this semester and subject.</p>
          </div>
        ) : (
          <>
            {/* Student Info Banner */}
            <div className="bg-[#f0fdf4] rounded-xl border border-[#bbf7d0] p-3 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#16a34a]" />
              <span className="text-sm text-[#15803d] font-medium">
                {students.length} student{students.length !== 1 ? 's' : ''} enrolled in Semester {selectedSemester} — {selectedSubjectObj?.name}
              </span>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden mb-6">
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[rgba(22,163,74,0.06)]">
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Reg. No</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Student Name</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase">Marks Obtained</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase">Grade</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => {
                    const mark = marks[s._id];
                    const grade = mark ? getGrade(parseInt(mark)) : '-';
                    const passed = mark ? (parseInt(mark) / totalMarks) * 100 >= 50 : false;
                    return (
                      <tr key={s._id} className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3 text-sm text-[#94A3B8]">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#16a34a]">{s.registrationNumber || '-'}</td>
                        <td className="px-4 py-3 text-sm text-[#0F172A]">{s.name}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={mark || ''}
                            onChange={e => updateMark(s._id, e.target.value)}
                            min={0}
                            max={totalMarks}
                            placeholder="0"
                            className="w-20 px-2 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#0F172A] text-center outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
                          />
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold">{grade}</td>
                        <td className="px-4 py-3 text-center">
                          {mark !== undefined && mark !== '' ? (
                            passed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-[#16a34a]">
                                <CheckCircle2 className="w-3 h-3" /> Pass
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-[#EF4444]">
                                <XCircle className="w-3 h-3" /> Fail
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-[#94A3B8]">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#16a34a] text-white rounded-lg text-sm font-semibold hover:bg-[#15803d] transition-all disabled:opacity-60 shrink-0"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                Publish Results
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
