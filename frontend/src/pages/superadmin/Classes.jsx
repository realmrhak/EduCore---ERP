import { useState, useEffect } from 'react';
import { classAPI, departmentAPI, extractData } from '@/services/api';
import { motion } from 'framer-motion';
import { Plus, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';

export default function AdminClasses() {
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', department: '', semester: 1, academicSession: '2025-2026', capacity: 40 });
  const [expanded, setExpanded] = useState(null);
  const [sections, setSections] = useState({});
  const [sectionName, setSectionName] = useState('');

  const fetchClasses = async () => {
    const r = await classAPI.getAll();
    setClasses(extractData(r));
  };

  useEffect(() => {
    departmentAPI.getAll().then((r) => setDepartments(extractData(r)));
    fetchClasses();
  }, []);

  const handleCreate = async () => {
    try {
      await classAPI.create(form);
      toast.success('Class created');
      setShowForm(false);
      fetchClasses();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  const loadSections = async (classId) => {
    if (expanded === classId) { setExpanded(null); return; }
    const r = await classAPI.getSections(classId);
    setSections((prev) => ({ ...prev, [classId]: extractData(r) }));
    setExpanded(classId);
  };

  const addSection = async (classId) => {
    if (!sectionName.trim()) return;
    try {
      await classAPI.createSection(classId, { name: sectionName });
      toast.success('Section added');
      setSectionName('');
      const r = await classAPI.getSections(classId);
      setSections((prev) => ({ ...prev, [classId]: extractData(r) }));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">Class & Section Management</h1>
              <p className="text-sm text-[#475569]">Manage academic classes and sections</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium shrink-0 self-end sm:self-auto">
              <Plus className="w-4 h-4" /> Add Class
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-xl border p-4 sm:p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="Class Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <CustomSelect value={form.department} onValueChange={v => setForm({ ...form, department: v })} options={[{ value: '', label: 'Department *' }, ...departments.map((d) => ({ value: d._id, label: d.name }))]} className="px-3 py-2" />
              <input type="number" placeholder="Semester" value={form.semester} onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value) })} className="px-3 py-2 border rounded-lg text-sm" />
              <button onClick={handleCreate} className="md:col-span-3 px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm">Save Class</button>
            </div>
          )}

          <div className="space-y-4">
            {classes.map((cls) => (
              <div key={cls._id} className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                <button onClick={() => loadSections(cls._id)} className="w-full flex items-center justify-between p-3 sm:p-5 hover:bg-[#F8FAFC] text-left">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Layers className="w-5 h-5 text-[#16a34a]" />
                    <div>
                      <p className="font-semibold text-[#0F172A]">{cls.name}</p>
                      <p className="text-xs text-[#94A3B8]">{cls.department?.name} · Semester {cls.semester} · Cap: {cls.capacity}</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#16a34a]">{expanded === cls._id ? 'Hide' : 'View'} Sections</span>
                </button>
                {expanded === cls._id && (
                  <div className="px-5 pb-5 border-t border-[#F1F5F9] pt-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <input value={sectionName} onChange={(e) => setSectionName(e.target.value)} placeholder="Section name (A, B, C...)" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                      <button onClick={() => addSection(cls._id)} className="px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(sections[cls._id] || []).map((sec) => (
                        <span key={sec._id} className="px-3 py-1.5 bg-[#F1F5F9] rounded-lg text-sm font-medium text-[#0F172A]">
                          Section {sec.name}
                        </span>
                      ))}
                      {(sections[cls._id] || []).length === 0 && (
                        <p className="text-sm text-[#94A3B8]">No sections yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {classes.length === 0 && <p className="text-center text-[#94A3B8] py-12">No classes created yet.</p>}
          </div>
        </motion.div>
      </div>
  );
}
