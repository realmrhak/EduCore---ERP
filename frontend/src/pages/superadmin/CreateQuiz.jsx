import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizAPI, subjectAPI, departmentAPI, academicSessionAPI, extractData } from '@/services/api';
import { useAlertDialog } from '@/components/AlertDialog';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Settings, Plus, X, Check, ChevronLeft, Save, Upload, Loader2, AlertCircle } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';

export default function AdminCreateQuiz() {
  const { alert: alertAction } = useAlertDialog();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('');
  const [timeLimit, setTimeLimit] = useState(45);
  const [shuffle, setShuffle] = useState(false);
  const [questions, setQuestions] = useState([
    { question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 }
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Data from API
  const [departments, setDepartments] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [activeAcademicSession, setActiveAcademicSession] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch departments, subjects, and active academic session on mount
  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      departmentAPI.getAll().then(r => extractData(r)).catch(() => []),
      subjectAPI.getAll().then(r => extractData(r)).catch(() => []),
      academicSessionAPI.getActive().then(r => {
        const session = r.data?.data ?? r.data;
        return session;
      }).catch(() => null),
    ]).then(([depts, subs, session]) => {
      setDepartments(depts);
      setAllSubjects(subs);
      if (session) setActiveAcademicSession(session._id || session);
    }).finally(() => setLoadingData(false));
  }, []);

  // Derive available semesters from subjects in the selected department
  const availableSemesters = useMemo(() => {
    if (!department) return [];
    const semSet = new Set();
    allSubjects
      .filter(s => (s.department?._id || s.department) === department)
      .forEach(s => { if (s.semester) semSet.add(s.semester); });
    return Array.from(semSet).sort((a, b) => a - b);
  }, [allSubjects, department]);

  // Filter subjects by department + semester
  const filteredSubjects = useMemo(() => {
    if (!department || !semester) return [];
    return allSubjects.filter(s =>
      (s.department?._id || s.department) === department &&
      s.semester === parseInt(semester)
    );
  }, [allSubjects, department, semester]);

  // Auto-select first subject when semester changes
  useEffect(() => {
    if (filteredSubjects.length > 0) {
      setSubject(filteredSubjects[0]._id);
    } else {
      setSubject('');
    }
  }, [semester, department]);

  // Auto-set semester to first available when department changes
  useEffect(() => {
    if (availableSemesters.length > 0) {
      setSemester(availableSemesters[0].toString());
    } else {
      setSemester('');
    }
    setSubject('');
  }, [department]);

  // Calculate total marks
  const totalMarks = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  }, [questions]);

  const addQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 }]);
  };

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions];
    updated[idx][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIdx, oIdx, value) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = value;
    setQuestions(updated);
  };

  const setCorrect = (qIdx, oIdx) => {
    const updated = [...questions];
    updated[qIdx].correctAnswer = oIdx;
    setQuestions(updated);
  };

  const removeQuestion = (idx) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handlePublish = async () => {
    // Validation
    if (!title.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }
    if (!department) {
      toast.error('Please select a department');
      return;
    }
    if (!semester) {
      toast.error('Please select a semester');
      return;
    }
    if (!subject) {
      toast.error('Please select a subject');
      return;
    }
    if (!activeAcademicSession) {
      toast.error('No active academic session found. Please create one in Academic Sessions first.');
      return;
    }
    if (questions.some(q => !q.question.trim() || q.options.some(o => !o.trim()))) {
      toast.error('Please fill in all questions and options');
      return;
    }

    setSubmitting(true);
    try {
      await quizAPI.create({
        title: title.trim(),
        department,
        semester: parseInt(semester),
        subject,
        academicSession: activeAcademicSession,
        timeLimit,
        shuffleQuestions: shuffle,
        totalMarks,
        questions: questions.map(q => ({
          question: q.question.trim(),
          options: q.options.map(o => o.trim()),
          correctAnswer: q.correctAnswer,
          marks: q.marks || 1,
        })),
        status: 'Published',
      });
      toast.success('Quiz published successfully!');
      navigate('/superadmin/quizzes');
    } catch (e) {
      toast.error('Error creating quiz: ' + (e.response?.data?.message || e.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#16a34a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center gap-2 text-xs text-[#94A3B8] mb-2">
          <button onClick={() => navigate('/superadmin/quizzes')} className="hover:text-[#16a34a]">Quizzes</button>
          <span>&gt;</span>
          <span className="text-[#0F172A] font-medium">Create Quiz</span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-[#0F172A]">Create New Assessment</h1>
            <p className="text-sm text-[#475569]">Design a dynamic multiple-choice quiz for your students.</p>
          </div>
          <div className="flex gap-2 self-end sm:self-auto">
            <button onClick={handlePublish} disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] disabled:opacity-60 shrink-0">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Publish Quiz
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Quiz Settings */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6 h-fit">
            <div className="flex items-center gap-2 mb-5">
              <Settings className="w-5 h-5 text-[#16a34a]" />
              <h3 className="text-sm font-semibold text-[#0F172A]">Quiz Settings</h3>
            </div>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-medium text-[#475569] mb-1 block">Quiz Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Midterm Evaluation"
                  className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]" />
              </div>

              {/* Department Dropdown */}
              <div>
                <label className="text-xs font-medium text-[#475569] mb-1 block">Department *</label>
                <CustomSelect value={department} onValueChange={v => setDepartment(v)}
                  options={[{ value: '', label: 'Select Department' }, ...departments.map(d => ({ value: d._id, label: `${d.name} (${d.code})` }))]}
                  className="w-full" />
              </div>

              {/* Semester + Time Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#475569] mb-1 block">Semester *</label>
                  <CustomSelect value={semester} onValueChange={v => setSemester(v)}
                    disabled={!department}
                    options={[{ value: '', label: 'Select Semester' }, ...availableSemesters.map(s => ({ value: String(s), label: `Semester ${s}` }))]}
                    className="w-full" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#475569] mb-1 block">Time Limit (min)</label>
                  <input type="number" value={timeLimit} onChange={e => setTimeLimit(parseInt(e.target.value) || 45)}
                    min={5} max={180}
                    className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm outline-none" />
                </div>
              </div>

              {/* Subject Dropdown — filtered by department + semester */}
              <div>
                <label className="text-xs font-medium text-[#475569] mb-1 block">Subject *</label>
                <CustomSelect value={subject} onValueChange={v => setSubject(v)}
                    disabled={!semester || filteredSubjects.length === 0}
                    options={!semester ? [{ value: '', label: 'Select semester first' }] : filteredSubjects.length === 0 ? [{ value: '', label: 'No subjects in this semester' }] : filteredSubjects.map(s => ({ value: s._id, label: `${s.name} (${s.code})` }))}
                    className="w-full" />
              </div>

              {/* Total Marks (auto-calculated) */}
              <div>
                <label className="text-xs font-medium text-[#475569] mb-1 block">Total Marks (auto)</label>
                <input type="number" value={totalMarks} readOnly
                  className="w-full px-3 py-2.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-sm text-[#64748B] cursor-not-allowed" />
              </div>

              {/* Shuffle toggle */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">Shuffle Questions</p>
                  <p className="text-xs text-[#94A3B8]">Randomize order for each student</p>
                </div>
                <button onClick={() => setShuffle(!shuffle)}
                  className={`w-12 h-6 rounded-full transition-colors ${shuffle ? 'bg-[#16a34a]' : 'bg-[#E2E8F0]'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mx-0.5 ${shuffle ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              {/* Academic Session info */}
              <div className="flex items-start gap-2 p-3 bg-[#F0FDF4] border border-[rgba(22,163,74,0.2)] rounded-lg">
                <AlertCircle className="w-4 h-4 text-[#16a34a] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#16a34a]">
                  {activeAcademicSession
                    ? 'Academic Session is auto-populated from the active session.'
                    : 'No active academic session found. Create one first!'}
                </p>
              </div>
            </div>
          </div>

          {/* Question Builder */}
          <div className="lg:col-span-2 space-y-4">
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[rgba(22,163,74,0.08)] text-[#16a34a] text-xs font-semibold rounded">Q{qIdx + 1}</span>
                    <span className="text-xs text-[#94A3B8] uppercase tracking-wide">Multiple Choice</span>
                  </div>
                  <button onClick={() => removeQuestion(qIdx)} className="p-1 hover:bg-red-50 rounded text-[#EF4444]">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <textarea value={q.question} onChange={e => updateQuestion(qIdx, 'question', e.target.value)}
                  placeholder="Enter your question here..."
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a] resize-none h-20 mb-4" />
                <div className="space-y-2">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      q.correctAnswer === oIdx ? 'border-[#16a34a] bg-[rgba(22,163,74,0.05)]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}>
                      <button onClick={() => setCorrect(qIdx, oIdx)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          q.correctAnswer === oIdx ? 'border-[#16a34a] bg-[#16a34a]' : 'border-[#CBD5E1]'
                        }`}>
                        {q.correctAnswer === oIdx && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <input type="text" value={opt} onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                        placeholder={`Option ${oIdx + 1}`}
                        className="flex-1 bg-transparent text-sm outline-none text-[#0F172A]" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <label className="text-sm text-[#475569]">Marks:</label>
                  <input type="number" value={q.marks} onChange={e => updateQuestion(qIdx, 'marks', parseInt(e.target.value) || 1)}
                    min={1} max={100}
                    className="w-20 px-2 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-sm outline-none" />
                </div>
              </div>
            ))}

            <button onClick={addQuestion}
              className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-[#E2E8F0] rounded-xl text-[#94A3B8] hover:border-[#16a34a] hover:text-[#16a34a] transition-colors">
              <div className="w-10 h-10 rounded-full bg-[rgba(22,163,74,0.1)] flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Add New Question</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
