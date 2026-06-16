import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizAPI, subjectAPI, academicSessionAPI, extractData } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';

export default function TeacherCreateQuiz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allSubjects, setAllSubjects] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [activeAcademicSession, setActiveAcademicSession] = useState(null);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState({
    title: '',
    subject: '',
    timeLimit: 30,
    questions: [
      { question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 }
    ]
  });

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
          toast.error('Failed to load subjects. Please refresh.');
        })
        .finally(() => setLoadingSubjects(false));
    }
  }, [user]);

  // Fetch active academic session as fallback
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

  // Auto-select first subject when semester changes
  useEffect(() => {
    if (filteredSubjects.length > 0) {
      setQuiz(prev => ({ ...prev, subject: filteredSubjects[0]._id }));
    } else {
      setQuiz(prev => ({ ...prev, subject: '' }));
    }
  }, [selectedSemester, filteredSubjects]);

  // Calculate total marks from questions
  const totalMarks = useMemo(() => {
    return quiz.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  }, [quiz.questions]);

  const addQuestion = () => {
    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 }]
    }));
  };

  const removeQuestion = (index) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const updateQuestion = (index, field, value) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === index ? { ...q, [field]: value } : q)
    }));
  };

  const updateOption = (qIndex, oIndex, value) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== qIndex) return q;
        const newOptions = [...q.options];
        newOptions[oIndex] = value;
        return { ...q, options: newOptions };
      })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!quiz.title.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }
    if (!selectedSemester) {
      toast.error('Please select a semester');
      return;
    }
    if (!quiz.subject) {
      toast.error('Please select a subject');
      return;
    }
    if (quiz.questions.some(q => !q.question.trim() || q.options.some(o => !o.trim()))) {
      toast.error('Please fill in all questions and options');
      return;
    }
    if (totalMarks === 0) {
      toast.error('Total marks cannot be zero. Assign marks to questions.');
      return;
    }

    // Find the selected subject to get its department
    const selectedSubject = filteredSubjects.find(s => s._id === quiz.subject);
    if (!selectedSubject) {
      toast.error('Selected subject not found. Please re-select.');
      return;
    }

    // Determine department: from subject's department, or teacher's department
    const department = selectedSubject.department?._id || selectedSubject.department || user?.department;
    if (!department) {
      toast.error('Department could not be determined. Please ensure your profile has a department assigned.');
      return;
    }

    // Determine academicSession
    const academicSession = activeAcademicSession || user?.academicSession;
    if (!academicSession) {
      toast.error('Academic session could not be determined. Please ensure an active session exists.');
      return;
    }

    // Build the payload with ALL required fields
    const payload = {
      title: quiz.title.trim(),
      subject: quiz.subject,
      semester: parseInt(selectedSemester),
      department: department,
      academicSession: academicSession,
      timeLimit: quiz.timeLimit,
      totalMarks: totalMarks,
      questions: quiz.questions.map(q => ({
        question: q.question.trim(),
        options: q.options.map(o => o.trim()),
        correctAnswer: q.correctAnswer,
        marks: q.marks
      })),
    };

    setSubmitting(true);
    try {
      await quizAPI.create(payload);
      toast.success('Quiz created successfully!');
      navigate('/teacher/quizzes');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create quiz';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/teacher/quizzes')} className="p-2 rounded-lg hover:bg-[#F1F5F9]">
            <ArrowLeft className="w-5 h-5 text-[#475569]" />
          </button>
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">Create Quiz</h1>
            <p className="text-sm text-[#475569]">Create a new quiz with multiple choice questions.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-full sm:max-w-4xl">
          {/* Quiz Details */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6 mb-6">
            <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Quiz Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Quiz Title *</label>
                <input
                  type="text"
                  value={quiz.title}
                  onChange={e => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Mid-Term Assessment"
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]"
                  required
                />
              </div>

              {/* Semester Dropdown */}
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Semester *</label>
                <CustomSelect
                  value={selectedSemester}
                  onValueChange={v => setSelectedSemester(v)}
                  options={[{ value: '', label: 'Select Semester' }, ...availableSemesters.map(sem => ({ value: String(sem), label: `Semester ${sem}` }))]}
                  placeholder="Select Semester"
                  className="w-full"
                />
              </div>

              {/* Subject Dropdown — filtered by semester */}
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Subject *</label>
                <CustomSelect
                  value={quiz.subject}
                  onValueChange={v => setQuiz(prev => ({ ...prev, subject: v }))}
                  options={
                    loadingSubjects
                      ? [{ value: '', label: 'Loading subjects...' }]
                      : !selectedSemester
                      ? [{ value: '', label: 'Select a semester first' }]
                      : filteredSubjects.length === 0
                      ? [{ value: '', label: 'No subjects in this semester' }]
                      : filteredSubjects.map(s => ({ value: s._id, label: `${s.name} (${s.code})` }))
                  }
                  placeholder="Select Subject"
                  className="w-full"
                  disabled={!selectedSemester}
                />
              </div>

              {/* Duration / Time Limit */}
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Time Limit (minutes) *</label>
                <input
                  type="number"
                  value={quiz.timeLimit}
                  onChange={e => setQuiz(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 30 }))}
                  min={5}
                  max={180}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]"
                />
              </div>

              {/* Total Marks (auto-calculated, read-only) */}
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Total Marks (auto-calculated)</label>
                <input
                  type="number"
                  value={totalMarks}
                  readOnly
                  className="w-full px-3 py-2 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-sm text-[#64748B] cursor-not-allowed"
                />
              </div>
            </div>

            {/* Info banner about auto-populated fields */}
            <div className="mt-4 flex items-start gap-2 p-3 bg-[#F0FDF4] border border-[rgba(22,163,74,0.2)] rounded-lg">
              <AlertCircle className="w-4 h-4 text-[#16a34a] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#16a34a]">
                Department, Academic Session, and Semester are auto-populated from your profile and subject selection.
                Total marks are calculated from the sum of question marks.
              </p>
            </div>
          </div>

          {/* Questions */}
          {quiz.questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#0F172A]">Question {qIndex + 1}</h3>
                {quiz.questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(qIndex)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#EF4444]">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Question Text</label>
                <textarea
                  value={q.question}
                  onChange={e => updateQuestion(qIndex, 'question', e.target.value)}
                  placeholder="Enter your question here..."
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a] resize-none"
                  rows={2}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={q.correctAnswer === oIndex}
                      onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                      className="w-4 h-4 text-[#16a34a]"
                      title="Mark as correct answer"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                      className="flex-1 px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]"
                      required
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-[#475569]">Marks:</label>
                <input
                  type="number"
                  value={q.marks}
                  onChange={e => updateQuestion(qIndex, 'marks', parseInt(e.target.value) || 1)}
                  min={1}
                  max={100}
                  className="w-20 px-2 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-sm outline-none"
                />
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm font-medium text-[#475569] hover:border-[#16a34a] hover:text-[#16a34a] transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
            <span className="text-sm text-[#94A3B8]">{quiz.questions.length} question(s) | Total: {totalMarks} marks</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#16a34a] text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#15803d] transition-all disabled:opacity-60 shrink-0"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Quiz
            </button>
            <button
              type="button"
              onClick={() => navigate('/teacher/quizzes')}
              className="px-6 py-2.5 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm font-medium text-[#475569] hover:bg-[#F8FAFC] transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
