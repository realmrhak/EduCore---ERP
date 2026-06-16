import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizAPI, departmentAPI, extractData } from '@/services/api';
import { useAlertDialog } from '@/components/AlertDialog';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Plus, Clock, FileQuestion, Eye, Trash2, Zap, Search,
  Upload, Pencil, Users, FileCheck, Loader2, X, ChevronDown
} from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';

export default function AdminQuizzes() {
  const { confirm: confirmAction } = useAlertDialog();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState('all');
  const [submissionsModal, setSubmissionsModal] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  useEffect(() => {
    departmentAPI.getAll().then(r => setDepartments(extractData(r)));
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    const params = {};
    if (selectedDept) params.department = selectedDept;
    const r = await quizAPI.getAll(params);
    setQuizzes(extractData(r));
  };

  useEffect(() => { fetchQuizzes(); }, [selectedDept]);

  const handleDelete = async (id) => {
    const ok = await confirmAction('Delete this quiz?', { title: 'Delete Quiz', type: 'warning' });
    if (!ok) return;
    try {
      await quizAPI.delete(id);
      toast.success('Quiz deleted');
      fetchQuizzes();
    } catch (e) {
      toast.error('Failed to delete quiz');
    }
  };

  const handlePublish = async (id) => {
    const ok = await confirmAction('Publish this quiz? Students will be able to attempt it.', { title: 'Publish Quiz', type: 'info' });
    if (!ok) return;
    try {
      await quizAPI.publish(id);
      toast.success('Quiz published successfully');
      fetchQuizzes();
    } catch (e) {
      toast.error('Failed to publish quiz');
    }
  };

  const handleViewSubmissions = async (quizId) => {
    setSubmissionsModal(quizId);
    setLoadingSubs(true);
    try {
      const r = await quizAPI.getAttempts(quizId);
      setSubmissions(extractData(r));
    } catch (e) {
      setSubmissions([]);
    }
    setLoadingSubs(false);
  };

  // Computed
  const published = quizzes.filter(q => q.status === 'Published');
  const drafts = quizzes.filter(q => q.status === 'Draft');
  const totalQuestions = quizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0);

  // Show all 8 semesters always
  const availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8];

  // Filtered quizzes
  const filtered = quizzes.filter(q => {
    const matchTab = tab === 'all' || (tab === 'published' && q.status === 'Published') || (tab === 'draft' && q.status === 'Draft');
    const matchSearch = !searchTerm || q.title?.toLowerCase().includes(searchTerm.toLowerCase()) || q.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSem = !selectedSem || q.semester === parseInt(selectedSem);
    return matchTab && matchSearch && matchSem;
  });

  return (
    <div className="p-3 sm:p-5 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-[#0F172A]">Quiz Management</h1>
            <p className="text-sm text-[#64748B]">Manage assessments and review submissions</p>
          </div>
          <button onClick={() => navigate('/superadmin/quizzes/create')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] transition-colors shrink-0 self-end sm:self-auto">
            <Plus className="w-4 h-4" /> Create Quiz
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-2.5 sm:p-3.5">
            <p className="text-xs text-[#64748B] mb-1">Total Quizzes</p>
            <p className="text-lg font-bold text-[#0F172A]">{quizzes.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-2.5 sm:p-3.5">
            <p className="text-xs text-[#64748B] mb-1">Published</p>
            <p className="text-lg font-bold text-[#16a34a]">{published.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-2.5 sm:p-3.5">
            <p className="text-xs text-[#64748B] mb-1">Drafts</p>
            <p className="text-lg font-bold text-[#F59E0B]">{drafts.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-2.5 sm:p-3.5">
            <p className="text-xs text-[#64748B] mb-1">Total Questions</p>
            <p className="text-lg font-bold text-[#0F172A]">{totalQuestions}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-[#16a34a]" />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 h-9 sm:h-10 bg-white border border-[#E2E8F0] rounded-lg text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#16a34a]"
            />
          </div>
          <CustomSelect value={selectedDept} onValueChange={v => setSelectedDept(v)} options={[{ value: '', label: 'All Departments' }, ...departments.map(d => ({ value: d._id, label: d.name }))]} className="w-full sm:w-auto" />
          <CustomSelect value={selectedSem} onValueChange={v => setSelectedSem(v)} options={[{ value: '', label: 'All Semesters' }, ...availableSemesters.map(s => ({ value: String(s), label: `Semester ${s}` }))]} className="w-full sm:w-auto" />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { key: 'all', label: 'All' },
            { key: 'published', label: 'Published' },
            { key: 'draft', label: 'Drafts' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-[#16a34a] text-white' : 'bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#16a34a]/30'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Quiz Table */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Subject</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Department</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Sem</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Questions</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Time</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[#94A3B8]">No quizzes found</td></tr>
              ) : filtered.map(quiz => (
                <tr key={quiz._id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 font-medium text-[#0F172A]">{quiz.title}</td>
                  <td className="px-4 py-3 text-[#475569]">{quiz.subject?.name || '-'}</td>
                  <td className="px-4 py-3 text-[#475569]">{quiz.department?.name || '-'}</td>
                  <td className="px-4 py-3 text-[#475569]">{quiz.semester || '-'}</td>
                  <td className="px-4 py-3 text-[#475569]">{quiz.questions?.length || 0}</td>
                  <td className="px-4 py-3 text-[#475569]">{quiz.timeLimit} min</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${quiz.status === 'Published' ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>
                      {quiz.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {quiz.status === 'Published' && (
                        <button onClick={() => handleViewSubmissions(quiz._id)} className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#16a34a] transition-colors" title="View Submissions">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {quiz.status === 'Draft' && (
                        <button onClick={() => handlePublish(quiz._id)} className="p-1.5 rounded-md hover:bg-[#f0fdf4] text-[#64748B] hover:text-[#16a34a] transition-colors" title="Publish Quiz">
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(quiz._id)} className="p-1.5 rounded-md hover:bg-red-50 text-[#64748B] hover:text-[#EF4444] transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Submissions Modal */}
      {submissionsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSubmissionsModal(null)}>
          <div className="bg-white rounded-xl border border-[#E2E8F0] w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A]">Quiz Submissions</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">{submissions.length} student(s) attempted</p>
              </div>
              <button onClick={() => setSubmissionsModal(null)} className="p-1 hover:bg-[#F1F5F9] rounded">
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[50vh] sm:max-h-[60vh] p-5">
              {loadingSubs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#94A3B8]" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12">
                  <FileCheck className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
                  <p className="text-sm text-[#94A3B8]">No submissions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[400px]">
                  <thead>
                    <tr className="bg-[#F8FAFC]">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-[#64748B] uppercase">Student</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-[#64748B] uppercase">Score</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-[#64748B] uppercase">Time Spent</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-[#64748B] uppercase">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub, i) => (
                      <tr key={sub._id || i} className="border-b border-[#F1F5F9]">
                        <td className="px-3 py-2.5 font-medium text-[#0F172A]">{sub.student?.name || 'Student'}</td>
                        <td className="px-3 py-2.5 text-[#475569]">{sub.marksObtained}/{sub.totalMarks}</td>
                        <td className="px-3 py-2.5 text-[#475569]">{sub.timeSpent ? `${Math.floor(sub.timeSpent / 60)}m ${sub.timeSpent % 60}s` : '-'}</td>
                        <td className="px-3 py-2.5 text-[#94A3B8]">{sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
