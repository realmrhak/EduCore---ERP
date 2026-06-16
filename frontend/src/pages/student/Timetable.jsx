import { useState, useEffect } from 'react';
import { timetableAPI, extractData } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Clock, MapPin, User, Download, Printer } from 'lucide-react';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudentTimetable() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [activeDay, setActiveDay] = useState('Monday');

  useEffect(() => {
    if (user?.department) {
      timetableAPI.getAll({ department: user.department._id, semester: user.semester }).then(r => setEntries(extractData(r)));
    }
  }, [user]);

  const dayEntries = entries.filter(e => e.day === activeDay).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">Weekly Timetable</h1>
            <p className="text-sm text-[#475569]">Your personalized class schedule for the semester.</p>
          </div>
          <div className="flex gap-2 flex-shrink-0 self-end sm:self-auto">
            <button className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm text-[#475569] hover:border-[#16a34a]">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#16a34a] text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-[#15803d]">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>

        {/* Day Tabs */}
        <div className="flex gap-1 mb-6 bg-[#F1F5F9] rounded-lg p-1 overflow-x-auto scrollbar-thin">
          {days.map(day => (
            <button key={day} onClick={() => setActiveDay(day)}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                activeDay === day ? 'bg-white text-[#16a34a] shadow-sm' : 'text-[#475569] hover:text-[#0F172A]'
              }`}>
              {day}
            </button>
          ))}
        </div>

        {/* Timetable Entries */}
        <div className="space-y-3">
          {dayEntries.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-[#E2E8F0] text-[#94A3B8]">
              No classes scheduled for {activeDay}
            </div>
          ) : dayEntries.map(entry => (
            <div key={entry._id} className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5 flex items-center gap-3 sm:gap-5 hover:shadow-md transition-shadow">
              <div className="w-16 sm:w-20 flex-shrink-0 text-center">
                <p className="text-sm font-semibold text-[#16a34a]">{entry.startTime}</p>
                <p className="text-xs text-[#94A3B8]">{entry.endTime}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[rgba(22,163,74,0.08)] flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-[#16a34a]" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-[#0F172A]">{entry.subject?.name}</h4>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-sm text-[#475569]">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {entry.teacher?.name}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {entry.room}</span>
                </div>
              </div>
              <span className="px-3 py-1 bg-[rgba(22,163,74,0.1)] text-[#16a34a] text-xs font-semibold rounded-full">
                {entry.subject?.code}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
