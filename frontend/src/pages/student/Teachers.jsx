import { useState, useEffect } from 'react';
import { userAPI, extractData } from '@/services/api';
import { motion } from 'framer-motion';
import { Mail, Phone, BookOpen, GraduationCap } from 'lucide-react';

export default function StudentTeachers() {
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    userAPI.getTeachers().then(r => setTeachers(extractData(r, 'teachers')));
  }, []);

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">Faculty Directory</h1>
          <p className="text-sm text-[#475569]">Your assigned teachers and faculty members.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {teachers.map(teacher => (
            <div key={teacher._id} className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-[#16a34a] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-semibold text-white">{teacher.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-[#0F172A]">{teacher.name}</h3>
                  <p className="text-xs text-[#94A3B8] mb-2">{teacher.department?.name}</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-[#475569]">
                      <Mail className="w-3.5 h-3.5 text-[#94A3B8]" /> {teacher.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#475569]">
                      <Phone className="w-3.5 h-3.5 text-[#94A3B8]" /> {teacher.phone || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
              {teacher.assignedSubjects?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#F1F5F9]">
                  <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] mb-2">
                    <BookOpen className="w-3.5 h-3.5" /> Assigned Subjects
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.assignedSubjects.map(s => (
                      <span key={s._id} className="px-2 py-0.5 bg-[rgba(22,163,74,0.08)] text-[#16a34a] text-xs rounded-full">{s.code}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
