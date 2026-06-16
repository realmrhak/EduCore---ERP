import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HelpCircle, BookOpen, ClipboardList, Users, FileText,
  CalendarDays, ChevronDown, ChevronRight, MessageSquare,
  Phone, Mail, Search, Clock, GraduationCap, BarChart3
} from 'lucide-react';

const faqs = [
  {
    category: 'Quiz Management',
    icon: ClipboardList,
    questions: [
      {
        q: 'How do I create a quiz?',
        a: 'Navigate to Quizzes section and click "Create Quiz". Fill in the quiz title, select department, semester, and subject. Add your MCQ questions with options and mark the correct answer. Set the time limit and click "Publish Quiz" when ready. You can also save as draft and publish later.'
      },
      {
        q: 'Can I edit a quiz after publishing?',
        a: 'Once a quiz is published, it cannot be edited to maintain fairness for students who may have already started. If you need changes, delete the quiz and create a new one. Draft quizzes can be edited freely before publishing.'
      },
      {
        q: 'How do I view quiz submissions?',
        a: 'Go to the Quizzes section and click the eye icon next to any published quiz. This opens the submissions panel showing each student\'s score, time spent, and submission date. You can review individual attempts for detailed answers.'
      },
      {
        q: 'What does "Shuffle Questions" do?',
        a: 'When enabled, each student sees the quiz questions in a random order. This helps prevent cheating during online assessments. The option is available during quiz creation and applies to all attempts.'
      },
    ]
  },
  {
    category: 'Results & Grading',
    icon: FileText,
    questions: [
      {
        q: 'How do I upload student results?',
        a: 'Go to the Upload Results section. Select the subject, exam type (Midterm, Final, Quiz, Assignment), and enter marks for each student. You can also attach a PDF results sheet. Results need admin approval before students can see them.'
      },
      {
        q: 'Why are my results pending?',
        a: 'Results uploaded by teachers require admin approval before being published to students. This is a quality assurance step. If your results are pending for too long, contact the admin or super admin.'
      },
      {
        q: 'Can I update results after uploading?',
        a: 'If results are still in "Pending" status, you can request the admin to reject them, which allows you to re-upload. Approved results cannot be modified directly — contact the admin office for corrections.'
      },
    ]
  },
  {
    category: 'Attendance',
    icon: CalendarDays,
    questions: [
      {
        q: 'How do I mark attendance?',
        a: 'Go to the Mark Attendance section. Select your subject and the date. The system shows all enrolled students. Mark each student as Present or Absent, then save. Attendance can be updated for past dates if needed.'
      },
      {
        q: 'Can I edit past attendance records?',
        a: 'Yes, you can update attendance for previous dates. Navigate to the attendance section, select the date and subject, and modify the records. Changes are saved immediately and reflected in student attendance percentages.'
      },
    ]
  },
  {
    category: 'Students & Subjects',
    icon: Users,
    questions: [
      {
        q: 'How do I see my assigned students?',
        a: 'The "My Students" section shows all students enrolled in your subjects. You can filter by department and semester. Student details include roll number, semester, department, and contact information.'
      },
      {
        q: 'How are subjects assigned to me?',
        a: 'Subject assignments are managed by the super admin. If you believe a subject should be assigned to you or need a change, contact the admin office. Your assigned subjects appear in the "My Subjects" section and on the dashboard.'
      },
    ]
  },
  {
    category: 'Notifications',
    icon: MessageSquare,
    questions: [
      {
        q: 'How do notifications work?',
        a: 'Notifications are sent by the admin for important announcements like exam schedules, result approval status, and institutional updates. You receive real-time notifications visible in the header bell icon. Check the Notifications page for full history.'
      },
      {
        q: 'Can I send notifications to students?',
        a: 'Currently, only the super admin can send notifications. If you need to communicate important information to students in your class, contact the admin with the details and they can broadcast the notification on your behalf.'
      },
    ]
  },
];

const quickLinks = [
  { label: 'Mark Attendance', icon: CalendarDays, path: '/teacher/attendance', desc: 'Record daily attendance' },
  { label: 'Create Quiz', icon: ClipboardList, path: '/teacher/quizzes/create', desc: 'Build a new assessment' },
  { label: 'Upload Results', icon: FileText, path: '/teacher/results', desc: 'Submit student marks' },
  { label: 'View Students', icon: Users, path: '/teacher/students', desc: 'Your assigned students' },
];

export default function TeacherHelpCenter() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(faqs.map((_, i) => i));

  const toggleCategory = (idx) => {
    setExpandedCategories(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    questions: cat.questions.filter(
      q => !searchTerm || q.q.toLowerCase().includes(searchTerm.toLowerCase()) || q.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="p-3 sm:p-5 lg:p-8 max-w-[900px] mx-auto overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#0F172A]">Help Center</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Find answers and get teaching support</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-[#16a34a]" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 h-9 sm:h-10 bg-white border border-[#E2E8F0] rounded-lg text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#16a34a]"
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {quickLinks.map((link, i) => (
            <button key={i} onClick={() => navigate(link.path)} className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-[#E2E8F0] hover:border-[#16a34a]/30 hover:shadow-sm transition-all text-center">
              <div className="w-9 h-9 rounded-md bg-[#F8FAFC] flex items-center justify-center">
                <link.icon className="w-4.5 h-4.5 text-[#16a34a]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#0F172A]">{link.label}</p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">{link.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* FAQ Sections */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Frequently Asked Questions</h2>

          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm text-[#94A3B8]">No results found for "{searchTerm}"</p>
            </div>
          ) : (
            filteredFaqs.map((cat, catIdx) => (
              <div key={catIdx} className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(catIdx)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <cat.icon className="w-4 h-4 text-[#16a34a]" />
                    <span className="text-sm font-medium text-[#0F172A]">{cat.category}</span>
                    <span className="text-xs text-[#94A3B8]">({cat.questions.length})</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${expandedCategories.includes(catIdx) ? 'rotate-180' : ''}`} />
                </button>

                {/* Questions */}
                {expandedCategories.includes(catIdx) && (
                  <div className="border-t border-[#F1F5F9]">
                    {cat.questions.map((faq, qIdx) => {
                      const idx = `${catIdx}-${qIdx}`;
                      const isOpen = openIndex === idx;
                      return (
                        <div key={qIdx} className={qIdx > 0 ? 'border-t border-[#F1F5F9]' : ''}>
                          <button
                            onClick={() => setOpenIndex(isOpen ? null : idx)}
                            className="w-full flex items-start justify-between p-4 text-left hover:bg-[#F8FAFC] transition-colors"
                          >
                            <span className="text-sm text-[#0F172A] pr-4">{faq.q}</span>
                            <ChevronRight className={`w-4 h-4 text-[#94A3B8] flex-shrink-0 mt-0.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 -mt-1">
                              <p className="text-sm text-[#475569] leading-relaxed">{faq.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Contact Support */}
        <div className="mt-8 bg-white rounded-lg border border-[#E2E8F0] p-3 sm:p-5">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Still need help?</h2>
          <p className="text-sm text-[#64748B] mb-4">If you could not find what you were looking for, reach out to us through these channels.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-[#F1F5F9]">
              <Mail className="w-4 h-4 text-[#16a34a]" />
              <div>
                <p className="text-xs text-[#94A3B8]">Email</p>
                <p className="text-sm font-medium text-[#0F172A]">support@educore.edu</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-[#F1F5F9]">
              <Phone className="w-4 h-4 text-[#16a34a]" />
              <div>
                <p className="text-xs text-[#94A3B8]">Phone</p>
                <p className="text-sm font-medium text-[#0F172A]">+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-[#F1F5F9]">
              <MessageSquare className="w-4 h-4 text-[#16a34a]" />
              <div>
                <p className="text-xs text-[#94A3B8]">Office</p>
                <p className="text-sm font-medium text-[#0F172A]">Room 101, Admin Block</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
