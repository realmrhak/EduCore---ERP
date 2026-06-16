import { useState, useEffect } from 'react';
import { subjectAPI, departmentAPI, userAPI, extractData } from '@/services/api';
import { useAlertDialog } from '@/components/AlertDialog';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';

export default function AdminSubjects() {
  const { confirm: confirmAction } = useAlertDialog();
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '', code: '', department: '', semester: 1, creditHours: 3, assignedTeacher: ''
  });

  useEffect(() => {
    departmentAPI.getAll().then(r => setDepartments(extractData(r)));
    userAPI.getTeachers().then(r => setTeachers(extractData(r, 'teachers')));
  }, []);

  useEffect(() => { fetchSubjects(); }, [selectedDept, selectedSem]);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDept) params.department = selectedDept;
      if (selectedSem) params.semester = selectedSem;
      const r = await subjectAPI.getAll(params);
      setSubjects(extractData(r));
    } catch (e) { toast.error('Failed to fetch subjects'); }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', department: '', semester: 1, creditHours: 3, assignedTeacher: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.code || !formData.department) {
      toast.error('Name, code, and department are required');
      return;
    }
    try {
      if (editingId) {
        await subjectAPI.update(editingId, formData);
        toast.success('Subject updated');
      } else {
        await subjectAPI.create(formData);
        toast.success('Subject created');
      }
      resetForm();
      fetchSubjects();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save subject');
    }
  };

  const handleEdit = (subject) => {
    setEditingId(subject._id);
    setFormData({
      name: subject.name || '',
      code: subject.code || '',
      department: subject.department?._id || subject.department || '',
      semester: subject.semester || 1,
      creditHours: subject.creditHours || 3,
      assignedTeacher: subject.assignedTeacher?._id || subject.assignedTeacher || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const ok = await confirmAction('Delete this subject?', { title: 'Delete Subject', type: 'warning' });
    if (!ok) return;
    try {
      await subjectAPI.delete(id);
      toast.success('Subject deleted');
      fetchSubjects();
    } catch (e) { toast.error('Failed to delete subject'); }
  };

  const handleToggleStatus = async (subject) => {
    const newStatus = subject.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await subjectAPI.update(subject._id, { status: newStatus });
      toast.success(`Subject ${newStatus === 'Active' ? 'activated' : 'deactivated'}`);
      fetchSubjects();
    } catch (e) { toast.error('Failed to update status'); }
  };

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#94A3B8] mb-1">
              <span>Admin</span> <span>&gt;</span> <span className="text-[#0F172A]">Subject Management</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">Subjects</h1>
            <p className="text-sm text-[#475569]">Manage university curriculum, assignments, and enrollment status.</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] shrink-0 self-end sm:self-auto">
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
          <CustomSelect value={selectedDept} onValueChange={v => setSelectedDept(v)} options={[{ value: '', label: 'All Departments' }, ...departments.map(d => ({ value: d._id, label: d.name }))]} className="w-full sm:w-auto" />
          <CustomSelect value={selectedSem} onValueChange={v => setSelectedSem(v)} options={[{ value: '', label: 'All Semesters' }, ...semesters.map(s => ({ value: String(s), label: `Semester ${s}` }))]} className="w-full sm:w-auto" />
          {(selectedDept || selectedSem) && (
            <button onClick={() => { setSelectedDept(''); setSelectedSem(''); }} className="px-3 py-2 text-xs text-[#EF4444] hover:underline">Clear</button>
          )}
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">{editingId ? 'Edit Subject' : 'Add New Subject'}</h3>
                  <button onClick={resetForm}><X className="w-4 h-4 text-[#64748B]" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Subject Name" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none" />
                  <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="Subject Code" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none" />
                  <CustomSelect value={formData.department} onValueChange={v => setFormData({...formData, department: v})} options={[{ value: '', label: 'Department' }, ...departments.map(d => ({ value: d._id, label: d.name }))]} className="px-3 py-2" />
                  <CustomSelect value={String(formData.semester)} onValueChange={v => setFormData({...formData, semester: parseInt(v)})} options={semesters.map(s => ({ value: String(s), label: `Semester ${s}` }))} className="px-3 py-2" />
                  <input type="number" value={formData.creditHours} onChange={e => setFormData({...formData, creditHours: parseInt(e.target.value) || 3})} placeholder="Credit Hours" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none" />
                  <CustomSelect value={formData.assignedTeacher} onValueChange={v => setFormData({...formData, assignedTeacher: v})} options={[{ value: '', label: 'Assign Teacher' }, ...teachers.map(t => ({ value: t._id, label: t.name }))]} className="px-3 py-2" />
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={handleSubmit} className="px-6 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium">{editingId ? 'Update' : 'Save'}</button>
                  <button onClick={resetForm} className="px-6 py-2 border border-[#E2E8F0] rounded-lg text-sm">Cancel</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f0fdf4]">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Department</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Sem</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Credits</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Teacher</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center py-12 text-sm text-[#94A3B8]">Loading...</td></tr>
              ) : subjects.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-12 text-sm text-[#94A3B8]">No subjects found</td></tr>
              ) : subjects.map(subject => (
                <tr key={subject._id} className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 text-sm font-medium text-[#16a34a]">{subject.code}</td>
                  <td className="px-4 py-3 text-sm text-[#0F172A]">{subject.name}</td>
                  <td className="px-4 py-3 text-sm text-[#475569]">{subject.department?.name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-[#475569]">{subject.semester}</td>
                  <td className="px-4 py-3 text-sm text-[#475569]">{subject.creditHours}</td>
                  <td className="px-4 py-3 text-sm text-[#475569]">{subject.assignedTeacher?.name || <span className="text-[#94A3B8] italic">Unassigned</span>}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleStatus(subject)} className="text-xs">
                      <span className={subject.status === 'Active' ? 'text-[#16a34a]' : 'text-[#94A3B8]'}>{subject.status}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(subject)} className="p-1.5 hover:bg-[#F1F5F9] rounded text-[#475569]"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(subject._id)} className="p-1.5 hover:bg-red-50 rounded text-[#EF4444]"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
