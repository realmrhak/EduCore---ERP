import { useState, useEffect } from 'react';
import { timetableAPI, departmentAPI, subjectAPI, userAPI, extractData } from '@/services/api';
import { useAlertDialog } from '@/components/AlertDialog';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Clock, MapPin, Plus, Trash2, Printer, Download } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

export default function AdminTimetable() {
  const { alert: alertAction } = useAlertDialog();
  const [entries, setEntries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('4');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ day: 'Monday', startTime: '09:00', endTime: '11:00', room: '', subject: '', teacher: '' });
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    departmentAPI.getAll().then(r => { const depts = extractData(r); setDepartments(depts); if (depts[0]) setSelectedDept(depts[0]._id); });
    userAPI.getTeachers().then(r => setTeachers(extractData(r, 'teachers')));
  }, []);

  useEffect(() => {
    if (selectedDept) {
      subjectAPI.getAll({ department: selectedDept, semester: selectedSem }).then(r => setSubjects(extractData(r)));
      timetableAPI.getAll({ department: selectedDept, semester: selectedSem }).then(r => setEntries(extractData(r)));
    }
  }, [selectedDept, selectedSem]);

  const handleCreate = async () => {
    try {
      await timetableAPI.create({ ...formData, department: selectedDept, semester: parseInt(selectedSem), academicSession: '2025-2026' });
      const r = await timetableAPI.getAll({ department: selectedDept, semester: selectedSem });
      setEntries(extractData(r));
      setShowForm(false);
    } catch (e) { toast.error('Error creating entry'); }
  };

  const handleDelete = async (id) => {
    await timetableAPI.delete(id);
    setEntries(entries.filter(e => e._id !== id));
  };

  const getEntryForSlot = (day, time) => {
    return entries.filter(e => e.day === day && e.startTime === time);
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-xs text-[#16a34a] font-medium uppercase tracking-wider mb-1">Academic &gt; Timetable Management</p>
              <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">Weekly Academic Schedule</h1>
              <p className="text-sm text-[#475569] mt-0.5">Semester {selectedSem} &bull; Manage class schedules</p>
            </div>
            <div className="flex gap-2 self-end sm:self-auto">
              <button className="flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#475569] hover:border-[#16a34a] shrink-0">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] shrink-0">
                <Plus className="w-4 h-4" /> Add Entry
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
            <CustomSelect value={selectedDept} onValueChange={v => setSelectedDept(v)} options={departments.map(d => ({ value: d._id, label: d.name }))} className="w-full sm:w-auto" />
            <CustomSelect value={selectedSem} onValueChange={v => setSelectedSem(v)} options={[1,2,3,4,5,6,7,8].map(s => ({ value: String(s), label: `Semester ${s}` }))} className="w-full sm:w-auto" />
          </div>

          {showForm && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5 mb-6">
              <h3 className="text-sm font-semibold mb-3">Add Timetable Entry</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <CustomSelect value={formData.day} onValueChange={v => setFormData({...formData, day: v})} options={days.map(d => ({ value: d, label: d }))} className="px-3 py-2" />
                <CustomSelect value={formData.startTime} onValueChange={v => setFormData({...formData, startTime: v})} options={timeSlots.map(t => ({ value: t, label: t }))} className="px-3 py-2" />
                <CustomSelect value={formData.endTime} onValueChange={v => setFormData({...formData, endTime: v})} options={timeSlots.map(t => ({ value: t, label: t }))} className="px-3 py-2" />
                <input type="text" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} placeholder="Room" className="px-3 py-2 border rounded-lg text-sm" />
                <CustomSelect value={formData.subject} onValueChange={v => setFormData({...formData, subject: v})} options={[{ value: '', label: 'Select Subject' }, ...subjects.map(s => ({ value: s._id, label: s.name }))]} className="px-3 py-2" />
                <CustomSelect value={formData.teacher} onValueChange={v => setFormData({...formData, teacher: v})} options={[{ value: '', label: 'Select Teacher' }, ...teachers.map(t => ({ value: t._id, label: t.name }))]} className="px-3 py-2" />
                <button onClick={handleCreate} className="px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium">Create</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-[#f0fdf4]">
                  <th className="text-left px-3 py-3 text-xs font-semibold text-[#0F172A] uppercase w-20">Time</th>
                  {days.map(d => <th key={d} className="text-center px-3 py-3 text-xs font-semibold text-[#0F172A] uppercase">{d.slice(0, 3)}</th>)}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(time => (
                  <tr key={time} className="border-t border-[#F1F5F9]">
                    <td className="px-3 py-2 text-xs font-medium text-[#475569]">{time}</td>
                    {days.map(day => {
                      const slotEntries = getEntryForSlot(day, time);
                      return (
                        <td key={day} className="px-2 py-2 align-top">
                          {slotEntries.map(entry => (
                            <div key={entry._id} className="bg-[rgba(22,163,74,0.08)] rounded-lg p-2 mb-1 relative group">
                              <p className="text-xs font-semibold text-[#16a34a]">{entry.subject?.name}</p>
                              <p className="text-[10px] text-[#475569]">{entry.teacher?.name}</p>
                              <div className="flex items-center gap-1 text-[10px] text-[#94A3B8]">
                                <MapPin className="w-3 h-3" /> {entry.room}
                              </div>
                              <button onClick={() => handleDelete(entry._id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded">
                                <Trash2 className="w-3 h-3 text-[#EF4444]" />
                              </button>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
  );
}
