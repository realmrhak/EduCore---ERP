import { useState, useEffect } from 'react';
import { departmentAPI, extractData } from '@/services/api';
import { useAlertDialog } from '@/components/AlertDialog';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Plus, Building2, Trash2, Edit3 } from 'lucide-react';

export default function AdminDepartments() {
  const { confirm: confirmAction } = useAlertDialog();
  const [departments, setDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', totalSemesters: 8 });
  const [editing, setEditing] = useState(null);

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    const r = await departmentAPI.getAll();
    setDepartments(extractData(r));
  };

  const handleSubmit = async () => {
    if (editing) {
      await departmentAPI.update(editing, formData);
    } else {
      await departmentAPI.create(formData);
    }
    setShowForm(false);
    setEditing(null);
    setFormData({ name: '', code: '', description: '', totalSemesters: 8 });
    fetchDepartments();
  };

  const handleDelete = async (id) => {
    const ok = await confirmAction('Delete this department? This action cannot be undone.', { title: 'Delete Department', type: 'warning' });
    if (!ok) return;
    try {
      await departmentAPI.delete(id);
      toast.success('Department deleted successfully');
      fetchDepartments();
    } catch (e) {
      toast.error('Failed to delete department');
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">Departments</h1>
              <p className="text-sm text-[#475569]">Manage university departments and academic units.</p>
            </div>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] shrink-0 self-end sm:self-auto">
              <Plus className="w-4 h-4" /> Create Department
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6 mb-6">
              <h3 className="text-sm font-semibold mb-4">{editing ? 'Edit' : 'Create'} Department</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Department Name" className="px-3 py-2 border rounded-lg text-sm outline-none focus:border-[#16a34a]" />
                <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="Code (e.g. CS)" className="px-3 py-2 border rounded-lg text-sm outline-none focus:border-[#16a34a]" />
                <input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Description" className="px-3 py-2 border rounded-lg text-sm outline-none focus:border-[#16a34a]" />
                <input type="number" value={formData.totalSemesters} onChange={e => setFormData({...formData, totalSemesters: parseInt(e.target.value)})} placeholder="Total Semesters" className="px-3 py-2 border rounded-lg text-sm outline-none" />
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <button onClick={handleSubmit} className="px-6 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium">{editing ? 'Update' : 'Create'}</button>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-6 py-2 border border-[#E2E8F0] rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {departments.map(dept => (
              <div key={dept._id} className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(22,163,74,0.08)] flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#16a34a]" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setFormData(dept); setEditing(dept._id); setShowForm(true); }} className="p-1.5 hover:bg-[#F1F5F9] rounded-lg text-[#475569]">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(dept._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-[#EF4444]">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-[#0F172A]">{dept.name}</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">{dept.code} &bull; {dept.totalSemesters} Semesters</p>
                <p className="text-sm text-[#475569] mt-2">{dept.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
  );
}
