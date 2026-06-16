import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HelpCircle, BookOpen, CreditCard, CalendarDays, ClipboardList,
  FileText, Users, Clock, ChevronDown, ChevronRight, MessageSquare,
  Phone, Mail, ExternalLink, Search
} from 'lucide-react';

const faqs = [
  {
    category: 'Academics',
    icon: BookOpen,
    questions: [
      {
        q: 'How can I view my attendance record?',
        a: 'Navigate to the Attendance section from the sidebar. You can view your attendance percentage, monthly breakdown, and subject-wise attendance records. If you notice any discrepancies, contact your department office.'
      },
      {
        q: 'How do I check my exam results?',
        a: 'Go to the Results section to view all your published results. Results include subject-wise marks, grade points, and overall GPA. Results are only visible after teachers publish them.'
      },
      {
        q: 'How do I attempt a quiz?',
        a: 'Visit the Quizzes section to see available quizzes. Click "Start Quiz" on any active quiz to begin. Make sure you have a stable internet connection. Once started, the timer runs continuously and cannot be paused.'
      },
      {
        q: 'Where can I find my timetable?',
        a: 'Your class timetable is available in the Timetable section. It shows your daily schedule with subject, teacher, time, and room information. The schedule is set by your department.'
      },
    ]
  },
  {
    category: 'Fee & Payments',
    icon: CreditCard,
    questions: [
      {
        q: 'How do I pay my fee challan?',
        a: 'Go to the Payments section to view your fee challans. Each challan shows the amount, due date, and status. Download the challan PDF and pay at the designated bank. After payment, upload the receipt or the admin will update your status.'
      },
      {
        q: 'What happens if I miss the fee due date?',
        a: 'Late fee submissions may incur additional fines as per the fee structure. Contact the accounts office for clarification on late payment policies specific to your program.'
      },
      {
        q: 'Where can I see my fee structure?',
        a: 'Your fee details are shown in the Payments section. This includes tuition, lab, library, exam, and other fees applicable to your department and semester.'
      },
    ]
  },
  {
    category: 'Account & Profile',
    icon: Users,
    questions: [
      {
        q: 'How do I update my profile information?',
        a: 'Go to the Profile section from the sidebar. You can update your contact number, address, and upload a profile picture. For changes to name, roll number, or department, contact the admin office.'
      },
      {
        q: 'How do I change my password?',
        a: 'In your Profile section, click on "Change Password". Enter your current password and set a new one. If you forgot your password, use the "Forgot Password" option on the login page.'
      },
      {
        q: 'I cannot log in to my account. What should I do?',
        a: 'First, check that you are using the correct email address. Try the "Forgot Password" option to reset your password. If the problem persists, contact the admin office for account verification.'
      },
    ]
  },
  {
    category: 'Notifications',
    icon: MessageSquare,
    questions: [
      {
        q: 'How do notifications work?',
        a: 'Notifications are sent by admin and teachers for important updates like exam schedules, result publications, fee reminders, and announcements. You receive real-time notifications visible in the header bell icon and the Notifications page.'
      },
      {
        q: 'Can I turn off notifications?',
        a: 'Currently, all notifications are enabled by default to ensure you do not miss important updates. You can mark notifications as read to clear them from the unread count.'
      },
    ]
  },
];

const quickLinks = [
  { label: 'View Timetable', icon: Clock, path: '/student/timetable', desc: 'Check your class schedule' },
  { label: 'My Results', icon: FileText, path: '/student/results', desc: 'View published results' },
  { label: 'Fee Payments', icon: CreditCard, path: '/student/payments', desc: 'Manage fee challans' },
  { label: 'My Quizzes', icon: ClipboardList, path: '/student/quizzes', desc: 'Active and past quizzes' },
];

export default function StudentHelpCenter() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(faqs.map((_, i) => i));

  const toggleCategory = (idx) => {
    setExpandedCategories(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  // Filter FAQs by search
  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    questions: cat.questions.filter(
      q => !searchTerm || q.q.toLowerCase().includes(searchTerm.toLowerCase()) || q.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="p-3 sm:p-5 lg:p-8 max-w-[95vw] sm:max-w-[900px] mx-auto overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#0F172A]">Help Center</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Find answers to common questions and get support</p>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
          {quickLinks.map((link, i) => (
            <button key={i} onClick={() => navigate(link.path)} className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-white rounded-lg border border-[#E2E8F0] hover:border-[#16a34a]/30 hover:shadow-sm transition-all text-center">
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
        <div className="mt-6 sm:mt-8 bg-white rounded-lg border border-[#E2E8F0] p-3 sm:p-5">
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
