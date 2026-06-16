import { useState, useEffect } from 'react';
import { timetableAPI, subjectAPI, extractData } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Clock, MapPin, BookOpen, CalendarDays } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TeacherTimetable() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() - 1] || 'Monday');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?._id) {
      timetableAPI.getAll({ teacher: user._id }).then(r => {
        setSchedule(extractData(r));
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [user]);

  const daySchedule = schedule.filter(s => s.day === selectedDay).sort((a, b) => a.startTime?.localeCompare(b.startTime));

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">My Timetable</h1>
          <p className="text-sm text-[#475569]">View your weekly class schedule.</p>
        </div>

        {/* Day Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedDay === day
                  ? 'bg-[#16a34a] text-white'
                  : 'bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#16a34a] hover:text-[#16a34a]'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Schedule */}
        <div className="space-y-3">
          {daySchedule.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
              <CalendarDays className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#0F172A] mb-1">No Classes</h3>
              <p className="text-sm text-[#94A3B8]">No classes scheduled for {selectedDay}.</p>
            </div>
          ) : (
            daySchedule.map((slot, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5 flex items-center gap-2 sm:gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl bg-[rgba(22,163,74,0.08)] flex flex-col items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-[#16a34a]" />
                  <span className="text-[10px] text-[#16a34a] font-medium mt-0.5">{slot.startTime}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[#0F172A]">{slot.subject?.name || 'Class'}</h3>
                  <p className="text-xs text-[#475569]">{slot.subject?.code || ''} &bull; Semester {slot.semester}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#0F172A]">{slot.startTime} - {slot.endTime}</p>
                    <p className="text-xs text-[#475569] flex items-center gap-1 justify-end">
                      <MapPin className="w-3 h-3" /> {slot.room || 'TBD'}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-[#94A3B8]" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
