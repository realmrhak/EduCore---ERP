import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI, extractData } from '@/services/api';
import { motion } from 'framer-motion';
import { Trophy, Clock, CheckCircle2, XCircle, ArrowLeft, Award } from 'lucide-react';

export default function StudentQuizResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const q = await quizAPI.getById(id);
      setQuiz(q.data?.data ?? q.data);
      const attemptsRes = await quizAPI.getMyAttempts();
      const attemptsData = extractData(attemptsRes);
      const myAttempt = attemptsData.find(a => (a.quiz?._id || a.quiz) === id);
      setAttempt(myAttempt);
    };
    fetchData();
  }, [id]);

  if (!attempt || !quiz) return null;

  const percentage = Math.round((attempt.marksObtained / attempt.totalMarks) * 100);
  const isPassed = percentage >= 60;

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-[95vw] sm:max-w-3xl mx-auto overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <button onClick={() => navigate('/student/quizzes')} className="flex items-center gap-2 text-sm text-[#475569] hover:text-[#16a34a] mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Quizzes
        </button>

        {/* Result Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-8 text-center mb-4 sm:mb-6">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${isPassed ? 'bg-green-50' : 'bg-red-50'}`}>
            <Trophy className={`w-10 h-10 ${isPassed ? 'text-[#16a34a]' : 'text-[#EF4444]'}`} />
          </div>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-1">Quiz Completed!</h2>
          <p className="text-sm text-[#475569] mb-4">{quiz.title}</p>
          <div className="text-5xl font-bold text-[#0F172A] mb-2">{percentage}%</div>
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${isPassed ? 'bg-green-50 text-[#16a34a]' : 'bg-red-50 text-[#EF4444]'}`}>
            {isPassed ? 'Passed' : 'Needs Improvement'}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 text-center">
            <Award className="w-5 h-5 text-[#16a34a] mx-auto mb-2" />
            <p className="text-xl font-bold text-[#0F172A]">{attempt.marksObtained}</p>
            <p className="text-xs text-[#94A3B8]">Marks Obtained</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 text-center">
            <Trophy className="w-5 h-5 text-[#F59E0B] mx-auto mb-2" />
            <p className="text-xl font-bold text-[#0F172A]">{attempt.totalMarks}</p>
            <p className="text-xs text-[#94A3B8]">Total Marks</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 text-center">
            <Clock className="w-5 h-5 text-[#16a34a] mx-auto mb-2" />
            <p className="text-xl font-bold text-[#0F172A]">{Math.floor(attempt.timeSpent / 60)}m</p>
            <p className="text-xs text-[#94A3B8]">Time Spent</p>
          </div>
        </div>

        {/* Question Review */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6">
          <h3 className="text-base font-semibold text-[#0F172A] mb-4">Question Review</h3>
          <div className="space-y-3">
            {quiz.questions.map((q, i) => {
              const myAnswer = attempt.answers.find(a => a.questionIndex === i);
              const isCorrect = myAnswer?.selectedOption === q.correctAnswer;
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${isCorrect ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isCorrect ? 'bg-[#16a34a]' : 'bg-[#EF4444]'}`}>
                    {isCorrect ? <CheckCircle2 className="w-4 h-4 text-white" /> : <XCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#0F172A]">{q.question}</p>
                    <p className="text-xs text-[#475569] mt-1">
                      Your answer: {myAnswer ? q.options[myAnswer.selectedOption] : 'Not answered'}
                      {!isCorrect && <span className="text-[#16a34a] ml-2">(Correct: {q.options[q.correctAnswer]})</span>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
