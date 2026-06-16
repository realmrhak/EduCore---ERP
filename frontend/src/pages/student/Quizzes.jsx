import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizAPI, extractData } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, FileQuestion, Award, ArrowRight, BookOpen } from 'lucide-react';

export default function StudentQuizzes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    const deptId = user?.department?._id || user?.department;
    if (deptId) {
      quizAPI.getAll({ department: deptId, semester: user.semester, status: 'Published' }).then(r => setQuizzes(extractData(r)));
      quizAPI.getMyAttempts().then(r => setAttempts(extractData(r)));
    }
  }, [user]);

  const attemptedQuizIds = attempts.map(a => a.quiz?._id || a.quiz);

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">My Quizzes</h1>
          <p className="text-sm text-[#475569]">View and attempt your assigned quizzes.</p>
        </div>

        {/* Available Quizzes */}
        <div className="mb-8">
          <h3 className="text-base font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#16a34a]" /> Available Quizzes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {quizzes.filter(q => !attemptedQuizIds.includes(q._id)).map(quiz => (
              <div key={quiz._id} className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-base font-semibold text-[#0F172A]">{quiz.title}</h4>
                  <span className="px-2 py-0.5 bg-[rgba(22,163,74,0.1)] text-[#16a34a] text-xs font-semibold rounded-full">Available</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-[#475569] mb-4">
                  <span className="flex items-center gap-1"><FileQuestion className="w-3.5 h-3.5" /> {quiz.questions?.length || 0} Questions</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {quiz.timeLimit} min</span>
                  <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> {quiz.totalMarks} Marks</span>
                </div>
                <button onClick={() => navigate(`/student/quizzes/${quiz._id}/attempt`)}
                  className="sm:w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] transition-colors shrink-0">
                  Start Quiz <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
            {quizzes.filter(q => !attemptedQuizIds.includes(q._id)).length === 0 && (
              <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-[#E2E8F0] text-[#94A3B8]">
                No quizzes available at the moment
              </div>
            )}
          </div>
        </div>

        {/* Completed Quizzes */}
        <div>
          <h3 className="text-base font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#16a34a]" /> Completed
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {attempts.map(attempt => (
              <div key={attempt._id} className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-base font-semibold text-[#0F172A]">{attempt.quiz?.title || 'Quiz'}</h4>
                  <span className="px-2 py-0.5 bg-green-50 text-[#16a34a] text-xs font-semibold rounded-full">Completed</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-[#475569] mb-4">
                  <span>Score: {attempt.marksObtained}/{attempt.totalMarks}</span>
                  <span>Time: {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s</span>
                </div>
                <button onClick={() => navigate(`/student/quizzes/${attempt.quiz?._id || attempt.quiz}/result`)}
                  className="sm:w-full flex items-center justify-center gap-2 px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#475569] hover:border-[#16a34a] hover:text-[#16a34a] transition-colors shrink-0">
                  View Result <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
            {attempts.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-[#E2E8F0] text-[#94A3B8]">
                No completed quizzes yet
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
