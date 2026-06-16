import { useState, useEffect, useMemo } from 'react';
import { subjectAPI, userAPI, extractData } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Users, Mail, Phone, BookOpen, GraduationCap, Search, Loader2, AlertCircle } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';

export default function TeacherStudents() {
  const { user } = useAuth();
  const [allSubjects, setAllSubjects] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState('');

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

  // Derive unique semesters from teacher's assigned subjects
  const availableSemesters = useMemo(() => {
    const semSet = new Set();
    allSubjects.forEach(s => {
      if (s.semester) semSet.add(s.semester);
    });
    return Array.from(semSet).sort((a, b) => a - b);
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

  // Get the currently selected subject object (for department info)
  const selectedSubjectObj = useMemo(() => {
    return filteredSubjects.find(s => s._id === selectedSubject) || null;
  }, [filteredSubjects, selectedSubject]);

  // Fetch students when semester and subject are selected
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
        // extractData may return the students array directly or from nested structure
        const studentList = Array.isArray(data) ? data : (data.students || []);
        setStudents(studentList);
      })
      .catch(err => {
        console.error('Failed to load students:', err);
        setError('Failed to load students. Please try again.');
        setStudents([]);
      })
      .finally(() => setLoadingStudents(false));
  }, [selectedSemester, selectedSubject, selectedSubjectObj]);

  // Filter students by search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.registrationNumber?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">My Students</h1>
          <p className="text-sm text-[#475569]">View students enrolled in your subjects by semester.</p>
        </div>

        {/* Filters Row */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 mb-6">
          <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
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

            {/* Search */}
            <div className="flex flex-col gap-1 flex-1 min-w-0 sm:min-w-[200px]">
              <label className="text-xs font-medium text-[#475569]">Search</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-[#16a34a]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or roll number..."
                  className="w-full pl-10 pr-4 h-9 sm:h-10 bg-white border border-[#E2E8F0] rounded-lg text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#16a34a]"
                  disabled={!selectedSemester || !selectedSubject}
                />
              </div>
            </div>
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
            <Users className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#0F172A] mb-1">Select a Semester</h3>
            <p className="text-sm text-[#94A3B8]">Choose a semester to see your assigned subjects and students.</p>
          </div>
        )}

        {/* Semester selected but no subject */}
        {selectedSemester && !selectedSubject && !loadingSubjects && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <BookOpen className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#0F172A] mb-1">No Subjects in Semester {selectedSemester}</h3>
            <p className="text-sm text-[#94A3B8]">You are not assigned any subjects for this semester.</p>
          </div>
        )}

        {/* Loading State */}
        {loadingStudents && selectedSemester && selectedSubject && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <Loader2 className="w-10 h-10 text-[#16a34a] mx-auto mb-4 animate-spin" />
            <p className="text-sm text-[#475569]">Loading students...</p>
          </div>
        )}

        {/* Students Grid */}
        {!loadingStudents && selectedSemester && selectedSubject && filteredStudents.length === 0 && !error && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <Users className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#0F172A] mb-1">No Students Found</h3>
            <p className="text-sm text-[#94A3B8]">No students are enrolled in this subject for the selected semester.</p>
          </div>
        )}

        {!loadingStudents && selectedSemester && selectedSubject && filteredStudents.length > 0 && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-[#475569]">
                Showing <span className="font-semibold text-[#0F172A]">{filteredStudents.length}</span> student{filteredStudents.length !== 1 ? 's' : ''}
                {searchQuery && <span> matching "{searchQuery}"</span>}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredStudents.map((student, i) => (
                <motion.div
                  key={student._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[rgba(22,163,74,0.08)] flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-[#16a34a]">
                        {student.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-[#0F172A] truncate">{student.name}</h3>
                      <p className="text-xs text-[#16a34a] font-medium">{student.registrationNumber || '-'}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#475569]">
                      <Mail className="w-3 h-3 text-[#94A3B8]" />
                      {student.email || '-'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#475569]">
                      <Phone className="w-3 h-3 text-[#94A3B8]" />
                      {student.phone || '-'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#475569]">
                      <GraduationCap className="w-3 h-3 text-[#94A3B8]" />
                      Semester {student.semester || '-'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#475569]">
                      <BookOpen className="w-3 h-3 text-[#94A3B8]" />
                      {student.department?.name || '-'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
