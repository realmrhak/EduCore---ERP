import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI, extractData } from '@/services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, ChevronRight, ChevronLeft, Send, Loader2 } from 'lucide-react';

export default function StudentQuizAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    quizAPI.getById(id).then(r => {
      const quizData = r.data?.data ?? r.data;
      setQuiz(quizData);
      setTimeLeft(quizData.timeLimit * 60);
    }).catch(err => {
      toast.error(err.response?.data?.message || 'Failed to load quiz');
      navigate('/student/quizzes');
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0 || submitted) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !submitted && quiz) {
      handleSubmit();
    }
  }, [timeLeft]);

  const selectAnswer = (optionIdx) => {
    setAnswers({ ...answers, [currentQ]: optionIdx });
  };

  const handleSubmit = async () => {
    if (submitted || submitting) return;
    setSubmitted(true);
    setSubmitting(true);

    const answersArray = Object.entries(answers).map(([qi, selected]) => ({
      questionIndex: parseInt(qi),
      selectedOption: selected
    }));

    // Fill in unanswered questions with -1
    for (let i = 0; i < quiz.questions.length; i++) {
      if (!answersArray.find(a => a.questionIndex === i)) {
        answersArray.push({ questionIndex: i, selectedOption: -1 });
      }
    }

    const timeSpent = quiz.timeLimit * 60 - timeLeft;

    try {
      await quizAPI.attempt(id, answersArray, timeSpent);
      toast.success('Quiz submitted successfully!');
      navigate(`/student/quizzes/${id}/result`);
    } catch (e) {
      const errMsg = e.response?.data?.message || 'Error submitting quiz';
      console.error('[QuizAttempt] Submit error:', e.response?.data || e.message);
      toast.error(errMsg);
      // If it was "already attempted", navigate to result
      if (errMsg.toLowerCase().includes('already attempted')) {
        navigate(`/student/quizzes/${id}/result`);
      } else {
        // Allow retry on other errors
        setSubmitted(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !quiz) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#16a34a] animate-spin" />
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((currentQ + 1) / quiz.questions.length) * 100;
  const isUrgent = timeLeft < 300;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-4xl mx-auto overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <h1 className="text-lg font-semibold text-[#0F172A]">{quiz.title}</h1>
            <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg self-end sm:self-auto ${isUrgent ? 'bg-red-50 text-[#EF4444]' : 'bg-[rgba(22,163,74,0.08)] text-[#16a34a]'}`}>
              <Clock className="w-4 h-4" />
              <span className="text-sm font-semibold font-mono">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
            </div>
          </div>
          <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div className="h-full bg-[#16a34a] rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-[#94A3B8]">
            <span>Question {currentQ + 1} of {quiz.questions.length}</span>
            <span>{answeredCount}/{quiz.questions.length} answered</span>
          </div>
        </div>

        {/* Time warning */}
        {isUrgent && !submitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4"
          >
            <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
            <span className="text-sm text-[#EF4444] font-medium">Less than 5 minutes remaining!</span>
          </motion.div>
        )}

        {/* Question */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-0.5 bg-[rgba(22,163,74,0.08)] text-[#16a34a] text-xs font-semibold rounded">Q{currentQ + 1}</span>
            <span className="text-xs text-[#94A3B8] uppercase tracking-wide">Multiple Choice</span>
            <span className="text-xs text-[#94A3B8] ml-auto">{quiz.questions[currentQ].marks || 1} mark{(quiz.questions[currentQ].marks || 1) > 1 ? 's' : ''}</span>
          </div>
          <h3 className="text-base font-medium text-[#0F172A] mb-6">{quiz.questions[currentQ].question}</h3>
          <div className="space-y-3">
            {quiz.questions[currentQ].options.map((opt, oIdx) => (
              <button key={oIdx} onClick={() => selectAnswer(oIdx)}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all ${
                  answers[currentQ] === oIdx
                    ? 'border-[#16a34a] bg-[rgba(22,163,74,0.05)]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  answers[currentQ] === oIdx ? 'border-[#16a34a] bg-[#16a34a]' : 'border-[#CBD5E1]'
                }`}>
                  {answers[currentQ] === oIdx && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-sm text-[#0F172A]">{opt}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Question Navigator */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQ(idx)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                  idx === currentQ
                    ? 'bg-[#16a34a] text-white'
                    : answers[idx] !== undefined
                    ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]'
                    : 'bg-[#F8FAFC] text-[#94A3B8] border border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm text-[#475569] hover:border-[#16a34a] disabled:opacity-40 shrink-0">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          {currentQ < quiz.questions.length - 1 ? (
            <button onClick={() => setCurrentQ(currentQ + 1)}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#16a34a] text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-[#15803d] shrink-0">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 bg-[#16a34a] text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-[#15803d] disabled:opacity-60 shrink-0">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Quiz
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
