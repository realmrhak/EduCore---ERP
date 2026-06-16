import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizAPI, subjectAPI, extractData } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAlertDialog } from '@/components/AlertDialog';
import { motion } from 'framer-motion';
import { ClipboardList, Plus, Clock, Eye, Edit, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';

export default function TeacherQuizzes() {
  const { user } = useAuth();
  const { confirm: confirmAction } = useAlertDialog();
  const navigate = useNavigate();
  const [allSubjects, setAllSubjects] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [error, setError] = useState('');

  // Fetch all subjects assigned to this teacher
  useEffect(() => {
    if (user?._id) {
      setLoadingSubjects(true);
      subjectAPI.getAll({ assignedTeacher: user._id })
        .then(r => setAllSubjects(extractData(r)))
        .catch(err => {
          console.error('Failed to load subjects:', err);
          toast.error('Failed to load subjects');
        })
        .finally(() => setLoadingSubjects(false));
    }
  }, [user]);

  // Derive unique semesters
  const availableSemesters = useMemo(() => {
    const semSet = new Set();
    allSubjects.forEach(s => {
      if (s.semester) semSet.add(s.semester);
    });
    return Array.from(semSet).sort((a, b) => a - b);
  }, [allSubjects]);

  // Fetch quizzes — filtered by createdBy (this teacher)
  useEffect(() => {
    if (user?._id) {
      fetchQuizzes();
    }
  }, [user]);

  const fetchQuizzes = async () => {
    setLoadingQuizzes(true);
    setError('');
    try {
      const res = await quizAPI.getAll({ createdBy: user?._id });
      setQuizzes(extractData(res));
    } catch (e) {
      console.error('Failed to load quizzes:', e);
      setError('Failed to load quizzes. Please try again.');
    } finally {
      setLoadingQuizzes(false);
    }
  };

  // Filter quizzes by selected semester
  const filteredQuizzes = useMemo(() => {
    if (!selectedSemester) return quizzes;
    return quizzes.filter(q => q.semester === parseInt(selectedSemester));
  }, [quizzes, selectedSemester]);

  const handleDelete = async (id) => {
    const ok = await confirmAction('Are you sure you want to delete this quiz?', { title: 'Delete Quiz', type: 'warning' });
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
    try {
      await quizAPI.publish(id);
      toast.success('Quiz published');
      fetchQuizzes();
    } catch (e) {
      toast.error('Failed to publish quiz');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Published': return 'bg-green-50 text-[#16a34a]';
      case 'Draft': return 'bg-yellow-50 text-[#F59E0B]';
      case 'Closed': return 'bg-red-50 text-[#EF4444]';
      default: return 'bg-gray-50 text-[#94A3B8]';
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">Quiz Management</h1>
            <p className="text-sm text-[#475569]">Create and manage quizzes for your subjects.</p>
          </div>
          <button
            onClick={() => navigate('/teacher/quizzes/create')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#16a34a] text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#15803d] transition-all shrink-0 self-end sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Create Quiz
          </button>
        </div>

        {/* Semester Filter */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 mb-6">
          <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
            <label className="text-sm font-medium text-[#475569]">Filter by Semester:</label>
            <CustomSelect
              value={selectedSemester}
              onValueChange={v => setSelectedSemester(v)}
              options={[{ value: '', label: 'All Semesters' }, ...availableSemesters.map(sem => ({ value: String(sem), label: `Semester ${sem}` }))]}
              placeholder="All Semesters"
              className="w-full sm:w-auto"
            />
            {selectedSemester && (
              <span className="text-xs text-[#475569]">
                {filteredQuizzes.length} quiz{filteredQuizzes.length !== 1 ? 'zes' : ''} in Semester {selectedSemester}
              </span>
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

        {/* Loading */}
        {loadingQuizzes && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <Loader2 className="w-10 h-10 text-[#16a34a] mx-auto mb-4 animate-spin" />
            <p className="text-sm text-[#475569]">Loading quizzes...</p>
          </div>
        )}

        {/* Empty State */}
        {!loadingQuizzes && filteredQuizzes.length === 0 && !error && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <ClipboardList className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#0F172A] mb-1">
              {selectedSemester ? `No Quizzes in Semester ${selectedSemester}` : 'No Quizzes Yet'}
            </h3>
            <p className="text-sm text-[#94A3B8] mb-4">Create your first quiz to get started.</p>
            <button
              onClick={() => navigate('/teacher/quizzes/create')}
              className="px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] transition-all"
            >
              Create Quiz
            </button>
          </div>
        )}

        {/* Quiz Table */}
        {!loadingQuizzes && filteredQuizzes.length > 0 && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[rgba(22,163,74,0.06)]">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Semester</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Duration</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Total Marks</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Questions</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuizzes.map((quiz) => (
                  <tr key={quiz._id} className="border-t border-[#F1F5F9]">
                    <td className="px-4 py-3 text-sm font-medium text-[#0F172A]">{quiz.title}</td>
                    <td className="px-4 py-3 text-sm text-[#475569]">{quiz.subject?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#475569]">{quiz.semester || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#475569] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {quiz.timeLimit} min
                    </td>
                    <td className="px-4 py-3 text-sm text-[#475569]">{quiz.totalMarks || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#475569]">{quiz.questions?.length || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quiz.status)}`}>
                        {quiz.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {quiz.status === 'Draft' && (
                          <button onClick={() => handlePublish(quiz._id)} className="p-1.5 rounded-lg hover:bg-green-50 text-[#16a34a]" title="Publish">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-1.5 rounded-lg hover:bg-[#f0fdf4] text-[#16a34a]" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(quiz._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#EF4444]" title="Delete">
                          <Trash2 className="w-4 h-4" />
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
      </motion.div>
    </div>
  );
}
