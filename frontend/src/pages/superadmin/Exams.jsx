import { useState, useEffect, useRef } from 'react';
import { examAPI, departmentAPI, subjectAPI, extractData } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Clock, Search, Filter, X, Loader2, Edit2, Trash2, MapPin, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterDept, setFilterDept] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTitle, setSearchTitle] = useState('');
  const [editingExam, setEditingExam] = useState(null);
  const tableRef = useRef(null);

  const emptyForm = {
    title: '', examType: 'Mid-term', department: '', semester: 4,
    subject: '', examDate: '', startTime: '09:00', endTime: '11:00', room: '', totalMarks: 100,
  };
  const [form, setForm] = useState(emptyForm);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterDept) params.department = filterDept;
      if (filterSemester) params.semester = filterSemester;
      if (filterStatus) params.status = filterStatus;
      const r = await examAPI.getAll(params);
      const data = extractData(r);
      // Fallback: try alternative response shapes if extractData returns empty
      const examsList = data.length > 0 ? data : (r.data?.data || r.data?.exams || []);
      setExams(Array.isArray(examsList) ? examsList : []);
    } catch (e) {
      toast.error('Failed to load exams');
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    departmentAPI.getAll().then((r) => setDepartments(extractData(r)));
  }, []);

  useEffect(() => {
    fetchExams();
  }, [filterDept, filterSemester, filterStatus]);

  useEffect(() => {
    if (form.department) {
      subjectAPI.getAll({ department: form.department, semester: form.semester })
        .then((r) => setSubjects(extractData(r)));
    } else {
      setSubjects([]);
    }
  }, [form.department, form.semester]);

  const handleCreate = async () => {
    if (!form.title) { toast.error('Please enter exam title'); return; }
    if (!form.department) { toast.error('Please select department'); return; }
    if (!form.subject) { toast.error('Please select subject'); return; }
    if (!form.examDate) { toast.error('Please select exam date'); return; }

    setSaving(true);
    try {
      await examAPI.create(form);
      toast.success('Exam scheduled successfully');
      setShowForm(false);
      setForm(emptyForm);
      // Clear all filters so the newly created exam is visible
      setFilterDept('');
      setFilterSemester('');
      setFilterStatus('');
      setSearchTitle('');
      await fetchExams();
      // Scroll to table after creation
      setTimeout(() => {
        tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to schedule exam');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    try {
      await examAPI.delete(id);
      toast.success('Exam deleted');
      fetchExams();
    } catch (e) {
      toast.error('Failed to delete exam');
    }
  };

  const handleEdit = (exam) => {
    setEditingExam(exam);
    setForm({
      title: exam.title,
      examType: exam.examType,
      department: exam.department?._id || exam.department || '',
      semester: exam.semester,
      subject: exam.subject?._id || exam.subject || '',
      examDate: exam.examDate ? new Date(exam.examDate).toISOString().split('T')[0] : '',
      startTime: exam.startTime || '09:00',
      endTime: exam.endTime || '11:00',
      room: exam.room || '',
      totalMarks: exam.totalMarks || 100,
    });
    setShowForm(true);
  };

  const handleUpdate = async () => {
    if (!editingExam) return;
    setSaving(true);
    try {
      await examAPI.update(editingExam._id, form);
      toast.success('Exam updated successfully');
      setShowForm(false);
      setEditingExam(null);
      setForm(emptyForm);
      fetchExams();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update exam');
    }
    setSaving(false);
  };

  const getExamStatus = (exam) => {
    if (exam.status) return exam.status;
    const examDate = new Date(exam.examDate);
    const now = new Date();
    if (examDate < now) return 'Completed';
    return 'Scheduled';
  };

  const filteredByTitle = exams.filter(e =>
    !searchTitle || e.title?.toLowerCase().includes(searchTitle.toLowerCase())
  );
  const upcomingExams = filteredByTitle.filter(e => getExamStatus(e) === 'Scheduled');
  const completedExams = filteredByTitle.filter(e => getExamStatus(e) === 'Completed');

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A] flex items-center gap-2">
              <Calendar className="w-6 h-6" /> Exam Schedule
            </h1>
            <p className="text-sm text-[#475569]">Create and manage examination schedules</p>
          </div>
          <button onClick={() => { setShowForm(true); setForm(emptyForm); }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] transition-colors shrink-0 self-end sm:self-auto">
            <Plus className="w-4 h-4" /> Schedule Exam
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-[#f0fdf4] rounded-xl border border-[#bbf7d0] p-3 sm:p-4">
            <p className="text-xs text-[#475569] uppercase">Total Exams</p>
            <p className="text-xl sm:text-2xl font-bold text-[#0F172A]">{exams.length}</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-3 sm:p-4">
            <p className="text-xs text-[#475569] uppercase">Upcoming</p>
            <p className="text-xl sm:text-2xl font-bold text-[#3B82F6]">{upcomingExams.length}</p>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 sm:p-4">
            <p className="text-xs text-[#475569] uppercase">Completed</p>
            <p className="text-xl sm:text-2xl font-bold text-[#0F172A]">{completedExams.length}</p>
          </div>
        </div>

        {/* Create Exam Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6">
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[#0F172A]">{editingExam ? 'Edit Exam' : 'Schedule New Exam'}</h3>
                  <button onClick={() => setShowForm(false)} className="p-1 hover:bg-[#F1F5F9] rounded-lg">
                    <X className="w-4 h-4 text-[#64748B]" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[#64748B] mb-1 block">Exam Title *</label>
                    <input placeholder="e.g. Mid-Term CS101" value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#64748B] mb-1 block">Exam Type</label>
                    <CustomSelect value={form.examType} onValueChange={(v) => setForm({ ...form, examType: v })}
                      options={['Mid-term', 'Final', 'Quiz', 'Assignment'].map((t) => ({ value: t, label: t }))}
                      className="w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#64748B] mb-1 block">Department *</label>
                    <CustomSelect value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}
                      options={[{ value: '', label: 'Select Department' }, ...departments.map((d) => ({ value: d._id, label: d.name }))]}
                      className="w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#64748B] mb-1 block">Semester</label>
                    <CustomSelect value={String(form.semester)} onValueChange={(v) => setForm({ ...form, semester: parseInt(v) })}
                      options={[1,2,3,4,5,6,7,8].map(s => ({ value: String(s), label: `Semester ${s}` }))}
                      className="w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#64748B] mb-1 block">Subject *</label>
                    <CustomSelect value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}
                      options={[{ value: '', label: 'Select Subject' }, ...subjects.map((s) => ({ value: s._id, label: `${s.code} - ${s.name}` }))]}
                      className="w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#64748B] mb-1 block">Exam Date *</label>
                    <input type="date" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })}
                      className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#64748B] mb-1 block">Start Time</label>
                    <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#64748B] mb-1 block">End Time</label>
                    <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#64748B] mb-1 block">Room</label>
                    <input placeholder="e.g. Room 301" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}
                      className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#64748B] mb-1 block">Total Marks</label>
                    <input type="number" min="1" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: parseInt(e.target.value) || 100 })}
                      className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 mt-5">
                  <button onClick={editingExam ? handleUpdate : handleCreate} disabled={saving}
                    className="px-6 py-2.5 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] disabled:opacity-60 flex items-center gap-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {editingExam ? 'Updating...' : 'Scheduling...'}</> : (editingExam ? 'Update Exam' : 'Schedule Exam')}
                  </button>
                  <button onClick={() => { setShowForm(false); setEditingExam(null); setForm(emptyForm); }} className="px-6 py-2.5 border border-[#E2E8F0] rounded-lg text-sm hover:bg-[#F8FAFC]">Cancel</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
            <Filter className="w-3.5 h-3.5" /> <span>Filter:</span>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#16a34a] absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2" />
            <input placeholder="Search exam title..." value={searchTitle} onChange={e => setSearchTitle(e.target.value)}
              className="pl-10 pr-3 h-9 sm:h-10 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#16a34a] w-full sm:w-44" />
          </div>
          <CustomSelect value={filterDept} onValueChange={v => setFilterDept(v)}
            options={[{ value: '', label: 'All Departments' }, ...departments.map(d => ({ value: d._id, label: d.name }))]}
            className="w-full sm:w-auto" />
          <CustomSelect value={filterSemester} onValueChange={v => setFilterSemester(v)}
            options={[{ value: '', label: 'All Semesters' }, ...[1,2,3,4,5,6,7,8].map(s => ({ value: String(s), label: `Sem ${s}` }))]}
            className="w-full sm:w-auto" />
          <CustomSelect value={filterStatus} onValueChange={v => setFilterStatus(v)}
            options={[{ value: '', label: 'All Status' }, { value: 'Scheduled', label: 'Scheduled' }, { value: 'Completed', label: 'Completed' }]}
            className="w-full sm:w-auto" />
          {(filterDept || filterSemester || filterStatus || searchTitle) && (
            <button onClick={() => { setFilterDept(''); setFilterSemester(''); setFilterStatus(''); setSearchTitle(''); }}
              className="text-xs text-[#EF4444] hover:underline">Clear filters</button>
          )}
        </div>

        {/* Exams Table */}
        <div ref={tableRef} className="bg-white rounded-xl border border-[#E2E8F0] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[#475569]">Exam</th>
                <th className="text-left px-4 py-3 font-medium text-[#475569]">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-[#475569]">Department</th>
                <th className="text-left px-4 py-3 font-medium text-[#475569]">Date</th>
                <th className="text-left px-4 py-3 font-medium text-[#475569]">Time</th>
                <th className="text-left px-4 py-3 font-medium text-[#475569]">Room</th>
                <th className="text-left px-4 py-3 font-medium text-[#475569]">Status</th>
                <th className="text-left px-4 py-3 font-medium text-[#475569]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center"><Loader2 className="w-6 h-6 text-[#16a34a] animate-spin mx-auto" /><p className="text-sm text-[#94A3B8] mt-2">Loading exams...</p></td></tr>
              ) : filteredByTitle.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center"><Calendar className="w-10 h-10 text-[#CBD5E1] mx-auto mb-2" /><p className="text-sm text-[#94A3B8]">{(filterDept || filterSemester || filterStatus || searchTitle) ? 'No exams match the current filters. Try adjusting your search or filters.' : 'No exams found. Schedule one to get started.'}</p></td></tr>
              ) : filteredByTitle.map((exam) => {
                const status = getExamStatus(exam);
                return (
                  <tr key={exam._id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#16a34a] flex-shrink-0" />
                        <div>
                          <p className="font-medium text-[#0F172A]">{exam.title}</p>
                          <p className="text-xs text-[#94A3B8]">{exam.examType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#94A3B8]" />
                        <span>{exam.subject?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#475569]">{exam.department?.name || '-'}</td>
                    <td className="px-4 py-3 text-[#475569]">{new Date(exam.examDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-[#475569]">
                        <Clock className="w-3 h-3" />{exam.startTime} - {exam.endTime}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-[#475569]">
                        <MapPin className="w-3 h-3" />{exam.room || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        status === 'Scheduled' ? 'bg-[#f0fdf4] text-[#16a34a]' :
                        status === 'Completed' ? 'bg-gray-100 text-gray-600' :
                        'bg-yellow-50 text-[#F59E0B]'
                      }`}>{status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(exam)} className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="Edit exam">
                          <Edit2 className="w-4 h-4 text-[#94A3B8] hover:text-[#3B82F6]" />
                        </button>
                        <button onClick={() => handleDelete(exam._id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete exam">
                          <Trash2 className="w-4 h-4 text-[#94A3B8] hover:text-[#EF4444]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
