import { useState, useEffect, useRef } from 'react';
import { resultAPI, userAPI, subjectAPI, departmentAPI, academicSessionAPI, extractData } from '@/services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Save, Send, CheckCircle, XCircle, Filter, Upload, FileText, Download, Eye, X, Loader2, Search, Trash2, AlertTriangle } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';

export default function AdminResults() {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examType, setExamType] = useState('Mid-Term');
  const [marks, setMarks] = useState({});
  const [totalMarks, setTotalMarks] = useState(50);
  const [tab, setTab] = useState('entry');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSession, setActiveSession] = useState(null);

  // PDF upload state
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfStudentId, setPdfStudentId] = useState('');
  const [pdfMarksObtained, setPdfMarksObtained] = useState('');
  const [pdfTotalMarks, setPdfTotalMarks] = useState('');
  const fileInputRef = useRef(null);

  // View existing results
  const [viewFilter, setViewFilter] = useState('all');

  useEffect(() => {
    departmentAPI.getAll().then(r => setDepartments(extractData(r)));
    academicSessionAPI.getActive().then(r => {
      const session = r.data?.data ?? r.data;
      if (session) setActiveSession(session);
    }).catch(() => {});
    fetchResults();
  }, []);

  useEffect(() => {
    // Reset selected subject when dept or semester changes
    setSelectedSubject('');
    if (selectedDept) {
      const semesterNum = selectedSemester ? parseInt(selectedSemester) : undefined;
      const studentParams = { department: selectedDept };
      if (semesterNum) studentParams.semester = semesterNum;
      userAPI.getStudents(studentParams).then(r => setStudents(extractData(r)));
      subjectAPI.getAll({ department: selectedDept, semester: semesterNum }).then(r => setSubjects(extractData(r)));
    } else {
      setStudents([]);
      setSubjects([]);
    }
  }, [selectedDept, selectedSemester]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDept) params.department = selectedDept;
      if (selectedSemester) params.semester = selectedSemester;
      if (selectedSubject) params.subject = selectedSubject;
      if (examType) params.examType = examType;
      const r = await resultAPI.getAll(params);
      setResults(extractData(r));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchResults(); }, [selectedDept, selectedSubject, selectedSemester, examType]);

  const handleMarksChange = (studentId, value) => {
    setMarks(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSubmit = async (status) => {
    if (!selectedDept) { toast.error('Please select a department'); return; }
    if (!selectedSemester) { toast.error('Please select a semester'); return; }
    if (!selectedSubject) { toast.error('Please select a subject'); return; }

    const resultsData = Object.entries(marks)
      .filter(([_, val]) => val !== '')
      .map(([studentId, marksObtained]) => ({
        student: studentId,
        subject: selectedSubject,
        department: selectedDept,
        semester: parseInt(selectedSemester),
        academicSession: activeSession?._id || activeSession?.id || null,
        examType,
        marksObtained: parseInt(marksObtained),
        totalMarks: parseInt(totalMarks),
      }));

    if (resultsData.length === 0) { toast.error('Please enter marks for at least one student'); return; }

    setSaving(true);
    try {
      await resultAPI.create(resultsData);
      toast.success('Results submitted & auto-approved successfully!');
      setMarks({});
      fetchResults();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error saving results');
    }
    setSaving(false);
  };

  const handlePdfUpload = async () => {
    if (!selectedDept) { toast.error('Please select a department'); return; }
    if (!selectedSemester) { toast.error('Please select a semester'); return; }
    if (!selectedSubject) { toast.error('Please select a subject'); return; }
    if (!pdfFile) { toast.error('Please select a PDF file'); return; }
    if (!pdfStudentId) { toast.error('Please select a student'); return; }

    if (!pdfMarksObtained || !pdfTotalMarks) {
      toast.error('Please enter marks obtained and total marks');
      return;
    }
    const marksVal = parseInt(pdfMarksObtained);
    const totalVal = parseInt(pdfTotalMarks);
    if (isNaN(marksVal) || isNaN(totalVal) || totalVal <= 0) {
      toast.error('Please enter valid marks');
      return;
    }
    if (marksVal > totalVal) {
      toast.error('Marks obtained cannot exceed total marks');
      return;
    }

    setSaving(true);
    try {
      const resultsData = [{
        student: pdfStudentId,
        subject: selectedSubject,
        department: selectedDept,
        semester: parseInt(selectedSemester),
        academicSession: activeSession?._id || activeSession?.id || null,
        examType,
        marksObtained: marksVal,
        totalMarks: totalVal,
      }];
      await resultAPI.create(resultsData, pdfFile);
      toast.success('Result with PDF uploaded & auto-approved successfully!');
      setPdfFile(null);
      setPdfStudentId('');
      setPdfMarksObtained('');
      setPdfTotalMarks('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchResults();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to upload PDF result');
    }
    setSaving(false);
  };

  const handleApprove = async (id) => {
    try {
      await resultAPI.approve(id);
      toast.success('Result approved');
      fetchResults();
    } catch (e) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await resultAPI.reject(id);
      toast.success('Result rejected');
      fetchResults();
    } catch (e) {
      toast.error('Failed to reject');
    }
  };

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ open: false, id: '', studentName: '' });
  const [deleting, setDeleting] = useState(false);

  const openDeleteModal = (id, studentName) => {
    setDeleteModal({ open: true, id, studentName });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ open: false, id: '', studentName: '' });
    setDeleting(false);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await resultAPI.delete(deleteModal.id);
      toast.success('Result deleted successfully');
      closeDeleteModal();
      fetchResults();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete result');
      setDeleting(false);
    }
  };

  const filteredResults = viewFilter === 'all' ? results :
    viewFilter === 'pending' ? results.filter(r => r.status === 'Pending') :
    viewFilter === 'approved' ? results.filter(r => r.status === 'Approved') :
    results.filter(r => r.status === 'Rejected');

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#94A3B8] mb-1">
              <span>Dashboard</span> <span>&gt;</span> <span>Results</span> <span>&gt;</span> <span className="text-[#0F172A]">Management</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">Result Entry & Approval</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
            <CustomSelect value={selectedDept} onValueChange={v => { setSelectedDept(v); setSelectedSubject(''); }}
              options={[{ value: '', label: 'Select Department' }, ...departments.map(d => ({ value: d._id, label: d.name }))]}
              className="px-2 py-1.5 sm:px-3 sm:py-2.5" />
            <CustomSelect value={selectedSemester} onValueChange={v => { setSelectedSemester(v); setSelectedSubject(''); }}
              options={[{ value: '', label: 'Select Semester' }, ...[1,2,3,4,5,6,7,8].map(s => ({ value: String(s), label: `Sem ${s}` }))]}
              className="px-2 py-1.5 sm:px-3 sm:py-2.5" />
            <CustomSelect value={selectedSubject} onValueChange={v => setSelectedSubject(v)}
              options={[{ value: '', label: 'Select Subject' }, ...subjects.map(s => ({ value: s._id, label: `${s.code} - ${s.name}` }))]}
              className="px-2 py-1.5 sm:px-3 sm:py-2.5" />
            <CustomSelect value={examType} onValueChange={v => setExamType(v)}
              options={[{ value: 'Mid-Term', label: 'Mid-Term' }, { value: 'Final-Term', label: 'Final-Term' }, { value: 'Quiz', label: 'Quiz' }, { value: 'Assignment', label: 'Assignment' }]}
              className="px-2 py-1.5 sm:px-3 sm:py-2.5" />
            <div className="col-span-2 sm:col-span-1 flex items-center gap-2 sm:gap-3">
              <label className="text-xs sm:text-sm font-medium text-[#475569] whitespace-nowrap">Max Marks</label>
              <input type="number" value={totalMarks} onChange={e => setTotalMarks(e.target.value)}
                className="w-full sm:w-24 px-3 py-2 sm:py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#0F172A] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 text-center" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 mt-4 pt-4 border-t border-[#F1F5F9]">
            <div>
              <span className="text-[11px] sm:text-xs text-[#94A3B8] uppercase">Total Enrolled</span>
              <p className="text-lg sm:text-xl font-bold text-[#0F172A]">{students.length} Students</p>
            </div>
            <div className="sm:ml-auto flex items-center gap-1.5 text-[11px] sm:text-xs text-[#94A3B8]">
              <Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Records will be locked after final approval.
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 border-b border-[#E2E8F0]">
          {[
            { key: 'entry', label: 'Manual Entry' },
            { key: 'upload', label: 'PDF Upload' },
            { key: 'view', label: 'View Results' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'text-[#16a34a] border-[#16a34a]' : 'text-[#94A3B8] border-transparent hover:text-[#475569]'
              }`}>{t.label}</button>
          ))}
        </div>

        {/* Manual Entry Tab */}
        {tab === 'entry' && (
          <>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-2 mb-4">
              <button onClick={() => handleSubmit('Approved')} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit & Approve Results
              </button>
              <span className="flex items-center gap-1 text-xs text-[#94A3B8]">
                <CheckCircle className="w-3.5 h-3.5" /> Results will be auto-approved and visible to students immediately
              </span>
            </div>

            {/* Mobile: Card-based layout / Desktop: Table layout */}
            {/* Mobile card layout (visible < sm) */}
            <div className="sm:hidden space-y-2">
              {students.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E2E8F0] py-12 text-center text-[#94A3B8]">
                  Select department and semester to view students
                </div>
              ) : students.map((student, i) => (
                <div key={student._id} className="bg-white rounded-xl border border-[#E2E8F0] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs text-[#94A3B8] font-medium w-5 shrink-0">{i + 1}</span>
                      <div className="w-7 h-7 rounded-full bg-[#16a34a]/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-semibold text-[#16a34a]">{student.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] truncate">{student.name}</p>
                        <p className="text-[11px] text-[#94A3B8] truncate">{student.registrationNumber} — Sem {student.semester}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input type="number" value={marks[student._id] || ''} onChange={e => handleMarksChange(student._id, e.target.value)}
                        placeholder="0" min="0" max={totalMarks}
                        className="w-16 px-2 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#0F172A] text-center outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
                      <span className="text-xs text-[#64748B] font-medium">/ {totalMarks}</span>
                    </div>
                  </div>
                  {marks[student._id] && (
                    <div className="mt-1.5 pl-7">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[rgba(22,163,74,0.1)] text-[#16a34a]">
                        <CheckCircle className="w-3 h-3" /> Entered
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop table layout (visible >= sm) */}
            <div className="hidden sm:block bg-white rounded-xl border border-[#E2E8F0] overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f0fdf4]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#0F172A] uppercase w-12">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#0F172A] uppercase">Student Details</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#0F172A] uppercase">Marks Obtained</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#0F172A] uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-12 text-[#94A3B8]">Select department and semester to view students</td></tr>
                  ) : students.map((student, i) => (
                    <tr key={student._id} className="border-t border-[#F1F5F9]">
                      <td className="px-4 py-3 text-sm text-[#475569]">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#16a34a]/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-[#16a34a]">{student.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#0F172A]">{student.name}</p>
                            <p className="text-xs text-[#94A3B8]">{student.registrationNumber} — Sem {student.semester}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input type="number" value={marks[student._id] || ''} onChange={e => handleMarksChange(student._id, e.target.value)}
                            placeholder="-" min="0" max={totalMarks}
                            className="w-20 px-2 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#0F172A] text-center outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
                          <span className="text-xs text-[#64748B] font-medium">/ {totalMarks}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          marks[student._id] ? 'bg-[rgba(22,163,74,0.1)] text-[#16a34a]' : 'bg-[#F1F5F9] text-[#94A3B8]'
                        }`}>
                          {marks[student._id] ? <CheckCircle className="w-3 h-3" /> : 'Not Entered'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* PDF Upload Tab */}
        {tab === 'upload' && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Upload PDF Result for Individual Student</h3>
            <p className="text-xs text-[#94A3B8] mb-6">Upload a scanned or digital result sheet as PDF for a specific student. You can also enter marks alongside the PDF. Select the department, semester, and subject above, then choose the student, enter marks, and upload the file.</p>

            {/* Selected Student Details */}
            {pdfStudentId && (() => {
              const selStudent = students.find(s => s._id === pdfStudentId);
              if (!selStudent) return null;
              return (
                <div className="mb-6 p-4 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl">
                  <p className="text-xs font-medium text-[#16a34a] uppercase tracking-wide mb-2">Selected Student</p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#16a34a]/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-[#16a34a]">{selStudent.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{selStudent.name}</p>
                      <p className="text-xs text-[#475569]">{selStudent.registrationNumber} — Semester {selStudent.semester} — {selStudent.department?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1 block">Select Student *</label>
                <CustomSelect value={pdfStudentId} onValueChange={v => setPdfStudentId(v)}
                  options={[{ value: '', label: 'Select Student' }, ...students.map(s => ({ value: s._id, label: `${s.name} (${s.registrationNumber})` }))]}
                  className="w-full" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1 block">Upload PDF Result *</label>
                <div className="relative">
                  <input type="file" ref={fileInputRef} accept=".pdf"
                    onChange={e => setPdfFile(e.target.files[0])}
                    className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a] file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-[#16a34a] file:text-white hover:file:bg-[#15803d]" />
                </div>
                {pdfFile && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-[#f0fdf4] rounded-lg border border-[#bbf7d0]">
                    <FileText className="w-4 h-4 text-[#16a34a]" />
                    <span className="text-xs text-[#15803d]">{pdfFile.name}</span>
                    <button onClick={() => { setPdfFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="ml-auto p-0.5 hover:bg-red-50 rounded"><X className="w-3 h-3 text-[#EF4444]" /></button>
                  </div>
                )}
              </div>
            </div>

            {/* Marks Entry alongside PDF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-6 p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1 block">Marks Obtained *</label>
                <input type="number" value={pdfMarksObtained} onChange={e => setPdfMarksObtained(e.target.value)}
                  placeholder="e.g. 75" min="0" max={pdfTotalMarks || 100}
                  className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1 block">Total Marks *</label>
                <input type="number" value={pdfTotalMarks} onChange={e => setPdfTotalMarks(e.target.value)}
                  placeholder="e.g. 100" min="1"
                  className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]" />
              </div>
              {pdfMarksObtained && pdfTotalMarks && parseInt(pdfTotalMarks) > 0 && (
                <div className="md:col-span-2 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#64748B]">Percentage:</span>
                    <span className="text-sm font-semibold text-[#0F172A]">
                      {((parseInt(pdfMarksObtained) / parseInt(pdfTotalMarks)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#64748B]">Grade:</span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                      (parseInt(pdfMarksObtained) / parseInt(pdfTotalMarks)) * 100 >= 50
                        ? 'bg-[rgba(22,163,74,0.1)] text-[#16a34a]'
                        : 'bg-red-50 text-[#EF4444]'
                    }`}>
                      {(() => {
                        const p = (parseInt(pdfMarksObtained) / parseInt(pdfTotalMarks)) * 100;
                        if (p >= 90) return 'A+';
                        if (p >= 80) return 'A';
                        if (p >= 70) return 'B';
                        if (p >= 60) return 'C';
                        if (p >= 50) return 'D';
                        return 'F';
                      })()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button onClick={handlePdfUpload} disabled={saving || !pdfFile || !pdfStudentId}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload PDF Result
            </button>
          </div>
        )}

        {/* View Results Tab */}
        {tab === 'view' && (
          <>
            {/* Results Summary */}
            {filteredResults.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3">
                  <p className="text-xs text-[#475569] uppercase">Total</p>
                  <p className="text-xl font-bold text-[#0F172A]">{filteredResults.length}</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <p className="text-xs text-[#475569] uppercase">Passed</p>
                  <p className="text-xl font-bold text-[#16a34a]">{filteredResults.filter(r => {
                    const pct = r.totalMarks > 0 ? (r.marksObtained / r.totalMarks) * 100 : 0;
                    return pct >= 50;
                  }).length}</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-xs text-[#475569] uppercase">Failed</p>
                  <p className="text-xl font-bold text-[#EF4444]">{filteredResults.filter(r => {
                    const pct = r.totalMarks > 0 ? (r.marksObtained / r.totalMarks) * 100 : 0;
                    return pct < 50;
                  }).length}</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                  <p className="text-xs text-[#475569] uppercase">Pending</p>
                  <p className="text-xl font-bold text-[#F59E0B]">{filteredResults.filter(r => r.status === 'Pending').length}</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
              {['all', 'pending', 'approved', 'rejected'].map(f => (
                <button key={f} onClick={() => setViewFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    viewFilter === f ? 'bg-[#16a34a] text-white' : 'bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#16a34a]'
                  }`}>{f}</button>
              ))}
              <span className="text-xs text-[#94A3B8] ml-2">{filteredResults.length} results</span>
            </div>

            {/* Mobile: Card-based layout for results */}
            <div className="sm:hidden space-y-2">
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="w-6 h-6 text-[#16a34a] animate-spin mx-auto" /></div>
              ) : filteredResults.length === 0 ? (
                <div className="py-12 text-center text-[#94A3B8]">No results found</div>
              ) : filteredResults.map(r => (
                <div key={r._id} className="bg-white rounded-xl border border-[#E2E8F0] p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{r.student?.name || '-'}</p>
                      <p className="text-[11px] text-[#94A3B8] truncate">{r.student?.registrationNumber}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${
                      r.status === 'Approved' ? 'bg-green-50 text-[#16a34a]' :
                      r.status === 'Pending' ? 'bg-yellow-50 text-[#F59E0B]' :
                      'bg-red-50 text-[#EF4444]'
                    }`}>{r.status}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#475569]">{r.subject?.name || '-'} · {r.examType}</span>
                    <span className="font-semibold text-[#0F172A]">{r.marksObtained}/{r.totalMarks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {r.pdfUrl ? (
                        <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#16a34a] text-xs font-medium">
                          <FileText className="w-3 h-3" /> PDF
                        </a>
                      ) : <span className="text-[11px] text-[#CBD5E1]">No PDF</span>}
                    </div>
                    <div className="flex gap-1">
                      {r.status === 'Pending' && (
                        <>
                          <button onClick={() => handleApprove(r._id)} className="p-1.5 hover:bg-green-50 rounded-lg" title="Approve">
                            <CheckCircle className="w-4 h-4 text-[#16a34a]" />
                          </button>
                          <button onClick={() => handleReject(r._id)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Reject">
                            <XCircle className="w-4 h-4 text-[#EF4444]" />
                          </button>
                        </>
                      )}
                      <button onClick={() => openDeleteModal(r._id, r.student?.name)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Delete Result">
                        <Trash2 className="w-4 h-4 text-[#94A3B8] hover:text-[#EF4444]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table layout for results */}
            <div className="hidden sm:block bg-white rounded-xl border border-[#E2E8F0] overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-[#475569]">Student</th>
                    <th className="text-left px-4 py-3 font-medium text-[#475569]">Subject</th>
                    <th className="text-left px-4 py-3 font-medium text-[#475569]">Exam Type</th>
                    <th className="text-left px-4 py-3 font-medium text-[#475569]">Marks</th>
                    <th className="text-left px-4 py-3 font-medium text-[#475569]">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-[#475569]">PDF</th>
                    <th className="text-left px-4 py-3 font-medium text-[#475569]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center"><Loader2 className="w-6 h-6 text-[#16a34a] animate-spin mx-auto" /></td></tr>
                  ) : filteredResults.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-[#94A3B8]">No results found</td></tr>
                  ) : filteredResults.map(r => (
                    <tr key={r._id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#0F172A]">{r.student?.name || '-'}</p>
                        <p className="text-xs text-[#94A3B8]">{r.student?.registrationNumber}</p>
                      </td>
                      <td className="px-4 py-3">{r.subject?.name || '-'}</td>
                      <td className="px-4 py-3 text-[#475569]">{r.examType}</td>
                      <td className="px-4 py-3 font-medium">{r.marksObtained}/{r.totalMarks}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.status === 'Approved' ? 'bg-green-50 text-[#16a34a]' :
                          r.status === 'Pending' ? 'bg-yellow-50 text-[#F59E0B]' :
                          'bg-red-50 text-[#EF4444]'
                        }`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {r.pdfUrl ? (
                          <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#16a34a] hover:text-[#15803d] text-xs font-medium">
                            <FileText className="w-3.5 h-3.5" /> View
                          </a>
                        ) : <span className="text-xs text-[#CBD5E1]">None</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {r.status === 'Pending' && (
                            <>
                              <button onClick={() => handleApprove(r._id)} className="p-1.5 hover:bg-green-50 rounded-lg" title="Approve">
                                <CheckCircle className="w-4 h-4 text-[#16a34a]" />
                              </button>
                              <button onClick={() => handleReject(r._id)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Reject">
                                <XCircle className="w-4 h-4 text-[#EF4444]" />
                              </button>
                            </>
                          )}
                          <button onClick={() => openDeleteModal(r._id, r.student?.name)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Delete Result">
                            <Trash2 className="w-4 h-4 text-[#94A3B8] hover:text-[#EF4444]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeDeleteModal}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="relative bg-[#1E293B] rounded-xl shadow-2xl w-full max-w-[95vw] sm:max-w-md mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button onClick={closeDeleteModal}
              className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-4 h-4 text-[#94A3B8]" />
            </button>

            <div className="p-6">
              {/* Warning Icon */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/15 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-[#F59E0B]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Delete Result</h3>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">
                    Are you sure you want to delete the result for <span className="text-white font-medium">{deleteModal.studentName || 'this student'}</span>?
                    This will remove the result and any attached PDF permanently. The student will no longer see it.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3">
                <button onClick={closeDeleteModal}
                  className="px-4 py-2 text-sm font-medium text-[#94A3B8] border border-[#475569] rounded-lg hover:bg-[#334155] hover:text-white transition-colors">
                  Cancel
                </button>
                <button onClick={confirmDelete} disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#EF4444] rounded-lg hover:bg-[#DC2626] disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
