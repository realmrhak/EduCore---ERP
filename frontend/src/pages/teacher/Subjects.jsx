import { useState, useEffect } from 'react';
import { subjectAPI, extractData } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { BookOpen, Users, Clock, GraduationCap } from 'lucide-react';

export default function TeacherSubjects() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?._id) {
      subjectAPI.getAll({ assignedTeacher: user._id }).then(r => {
        setSubjects(extractData(r));
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [user]);

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">My Subjects</h1>
          <p className="text-sm text-[#475569]">Subjects assigned to you for teaching.</p>
        </div>

        {subjects.length === 0 && !loading ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <BookOpen className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#0F172A] mb-1">No Subjects Assigned</h3>
            <p className="text-sm text-[#94A3B8]">Contact admin to get subjects assigned.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {subjects.map((subject, i) => (
              <motion.div
                key={subject._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[rgba(22,163,74,0.08)] flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-[#16a34a]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#0F172A]">{subject.name}</h3>
                    <p className="text-xs text-[#16a34a] font-medium">{subject.code}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-[#475569]">
                      <GraduationCap className="w-4 h-4 text-[#94A3B8]" /> Department
                    </span>
                    <span className="font-medium text-[#0F172A]">{subject.department?.name || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-[#475569]">
                      <Users className="w-4 h-4 text-[#94A3B8]" /> Semester
                    </span>
                    <span className="font-medium text-[#0F172A]">{subject.semester || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-[#475569]">
                      <Clock className="w-4 h-4 text-[#94A3B8]" /> Credits
                    </span>
                    <span className="font-medium text-[#0F172A]">{subject.credits || '-'}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
