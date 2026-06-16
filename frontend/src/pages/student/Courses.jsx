import { useState, useEffect } from 'react';
import { subjectAPI, extractData } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { BookOpen, Clock, User, Award } from 'lucide-react';

export default function StudentCourses() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [activeTab, setActiveTab] = useState('Current');

  useEffect(() => {
    if (user?.department) {
      subjectAPI.getAll({ department: user.department._id, semester: user.semester }).then(r => setSubjects(extractData(r)));
    }
  }, [user]);

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">My Courses</h1>
          <p className="text-sm text-[#475569]">Subjects enrolled this semester.</p>
        </div>

        <div className="flex gap-1 mb-6 bg-[#F1F5F9] rounded-lg p-1 w-fit overflow-x-auto">
          {['Current', 'Past', 'Upcoming'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                activeTab === tab ? 'bg-white text-[#16a34a] shadow-sm' : 'text-[#475569]'
              }`}>{tab}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {subjects.map(subject => (
            <div key={subject._id} className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-[rgba(22,163,74,0.08)] flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-[#16a34a]" />
                </div>
                <span className="px-2 py-0.5 bg-green-50 text-[#16a34a] text-xs font-semibold rounded-full">Active</span>
              </div>
              <h3 className="text-base font-semibold text-[#0F172A]">{subject.name}</h3>
              <p className="text-sm text-[#16a34a] font-medium">{subject.code}</p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 text-xs text-[#475569]">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {subject.creditHours} Credits</span>
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {subject.assignedTeacher?.name || 'TBA'}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-[#F1F5F9]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#94A3B8]">Semester {subject.semester}</span>
                  <span className="text-xs text-[#94A3B8]">{subject.department?.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
