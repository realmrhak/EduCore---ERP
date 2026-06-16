import { useState, useEffect } from 'react';
import { feeStructureAPI, departmentAPI, challanAPI, extractData } from '@/services/api';
import { motion } from 'framer-motion';
import { Plus, DollarSign, Search, Pencil, Trash2, X, ChevronDown, AlertTriangle, CheckCircle2, FileText, CreditCard } from 'lucide-react';
import { useAlertDialog } from '@/components/AlertDialog';
import toast from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';

export default function AdminFeeStructure() {
  const { confirm: confirmAction } = useAlertDialog();
  const [structures, setStructures] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [tab, setTab] = useState('structure');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [form, setForm] = useState({
    name: '', department: '', semester: '', academicSession: '',
    tuitionFee: '', labFee: '', libraryFee: '', examFee: '', otherFee: '',
  });

  const fetchData = async () => {
    const [s, d, def] = await Promise.all([
      feeStructureAPI.getAll(),
      departmentAPI.getAll(),
      feeStructureAPI.getDefaulters().catch(() => ({ data: { data: [] } })),
    ]);
    setStructures(extractData(s));
    setDepartments(extractData(d));
    setDefaulters(extractData(def));
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.department) return toast.error('Department is required');
    if (!form.semester) return toast.error('Semester is required');
    if (!form.academicSession.trim()) return toast.error('Academic Session is required');
    try {
      const tuitionFee = parseFloat(form.tuitionFee) || 0;
      const labFee = parseFloat(form.labFee) || 0;
      const libraryFee = parseFloat(form.libraryFee) || 0;
      const examFee = parseFloat(form.examFee) || 0;
      const otherFee = parseFloat(form.otherFee) || 0;
      const total = tuitionFee + labFee + libraryFee + examFee + otherFee;
      if (editingId) {
        await feeStructureAPI.update(editingId, { ...form, tuitionFee, labFee, libraryFee, examFee, otherFee, totalAmount: total });
        toast.success('Fee structure updated');
      } else {
        await feeStructureAPI.create({ ...form, tuitionFee, labFee, libraryFee, examFee, otherFee, totalAmount: total });
        toast.success('Fee structure created');
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirmAction('Delete this fee structure?', { title: 'Delete Fee Structure', type: 'warning' });
    if (!ok) return;
    try {
      await feeStructureAPI.delete(id);
      toast.success('Fee structure deleted');
      fetchData();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (s) => {
    setEditingId(s._id);
    setForm({
      name: s.name || '',
      department: s.department?._id || s.department || '',
      semester: s.semester ?? '',
      academicSession: s.academicSession ?? '',
      tuitionFee: s.tuitionFee ?? '',
      labFee: s.labFee ?? '',
      libraryFee: s.libraryFee ?? '',
      examFee: s.examFee ?? '',
      otherFee: s.otherFee ?? '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({
      name: '', department: '', semester: '', academicSession: '',
      tuitionFee: '', labFee: '', libraryFee: '', examFee: '', otherFee: '',
    });
    setEditingId(null);
  };

  const totalFormAmount = (parseFloat(form.tuitionFee) || 0) + (parseFloat(form.labFee) || 0) + (parseFloat(form.libraryFee) || 0) + (parseFloat(form.examFee) || 0) + (parseFloat(form.otherFee) || 0);

  // Computed stats
  const totalStructures = structures.length;
  const totalAmount = structures.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const pendingCount = defaulters.length;
  const pendingAmount = defaulters.reduce((sum, c) => sum + (c.amount || 0), 0);

  // Filtered structures
  const filtered = structures.filter(s => {
    const matchSearch = !searchTerm || s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.department?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = !filterDept || (s.department?._id || s.department) === filterDept;
    const matchSem = !filterSemester || s.semester === parseInt(filterSemester);
    return matchSearch && matchDept && matchSem;
  });

  // Show all 8 semesters always
  const availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="p-3 sm:p-5 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-[#0F172A]">Fee Management</h1>
            <p className="text-sm text-[#64748B]">Manage fee structures and track dues</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] transition-colors shrink-0 self-end sm:self-auto">
            <Plus className="w-4 h-4" /> Add Structure
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-2.5 sm:p-3.5">
            <p className="text-xs text-[#64748B] mb-1">Total Structures</p>
            <p className="text-lg font-bold text-[#0F172A]">{totalStructures}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-2.5 sm:p-3.5">
            <p className="text-xs text-[#64748B] mb-1">Total Fee Amount</p>
            <p className="text-lg font-bold text-[#0F172A]">${totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-2.5 sm:p-3.5">
            <p className="text-xs text-[#64748B] mb-1">Pending Dues</p>
            <p className="text-lg font-bold text-[#EF4444]">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-2.5 sm:p-3.5">
            <p className="text-xs text-[#64748B] mb-1">Pending Amount</p>
            <p className="text-lg font-bold text-[#EF4444]">${pendingAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {['structure', 'defaulters'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-[#16a34a] text-white' : 'bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#16a34a]/30'}`}>
              {t === 'defaulters' ? 'Dues / Defaulters' : 'Fee Structure'}
            </button>
          ))}
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-3 sm:p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#0F172A]">{editingId ? 'Edit Fee Structure' : 'New Fee Structure'}</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 hover:bg-[#F1F5F9] rounded">
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <input placeholder="e.g. BS Computer Science Fee" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]" />
              <CustomSelect value={form.department} onValueChange={v => setForm({ ...form, department: v })} options={[{ value: '', label: 'Select Department *' }, ...departments.map((d) => ({ value: d._id, label: d.name }))]} className="px-3 py-2" />
              <input type="number" min="1" max="8" placeholder="Semester (1-8)" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]" />
              <input placeholder="e.g. 2025-2026" value={form.academicSession} onChange={(e) => setForm({ ...form, academicSession: e.target.value })} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]" />
              {[
                { key: 'tuitionFee', label: 'Tuition Fee', placeholder: 'e.g. 50000' },
                { key: 'labFee', label: 'Lab Fee', placeholder: 'e.g. 5000' },
                { key: 'libraryFee', label: 'Library Fee', placeholder: 'e.g. 2000' },
                { key: 'examFee', label: 'Exam Fee', placeholder: 'e.g. 3000' },
                { key: 'otherFee', label: 'Other Fee', placeholder: 'e.g. 1000' },
              ].map(({ key, label, placeholder }) => (
                <input key={key} type="number" min="0" placeholder={placeholder} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]" />
              ))}
              <div className="flex items-center gap-3 px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-xs text-[#64748B]">Total:</span>
                <span className="text-sm font-bold text-[#0F172A]">${totalFormAmount.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={handleCreate} className="px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] transition-colors">
                {editingId ? 'Update' : 'Save'}
              </button>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#475569] hover:border-[#16a34a]/30 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {tab === 'structure' ? (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-[#16a34a]" />
                <input
                  type="text"
                  placeholder="Search fee structures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 h-9 sm:h-10 bg-white border border-[#E2E8F0] rounded-lg text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#16a34a]"
                />
              </div>
              <CustomSelect value={filterDept} onValueChange={v => setFilterDept(v)} options={[{ value: '', label: 'All Departments' }, ...departments.map((d) => ({ value: d._id, label: d.name }))]} className="w-full sm:w-auto" />
              <CustomSelect value={filterSemester} onValueChange={v => setFilterSemester(v)} options={[{ value: '', label: 'All Semesters' }, ...availableSemesters.map(s => ({ value: String(s), label: `Semester ${s}` }))]} className="w-full sm:w-auto" />
            </div>

            {/* Fee Structure Table */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Department</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Semester</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Tuition</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Lab</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Library</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Exam</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Other</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Total</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={10} className="px-4 py-8 text-center text-[#94A3B8]">No fee structures found</td></tr>
                  ) : filtered.map((s) => (
                    <tr key={s._id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 font-medium text-[#0F172A]">{s.name}</td>
                      <td className="px-4 py-3 text-[#475569]">{s.department?.name || '-'}</td>
                      <td className="px-4 py-3 text-[#475569]">Sem {s.semester}</td>
                      <td className="px-4 py-3 text-[#475569]">${s.tuitionFee}</td>
                      <td className="px-4 py-3 text-[#475569]">${s.labFee}</td>
                      <td className="px-4 py-3 text-[#475569]">${s.libraryFee}</td>
                      <td className="px-4 py-3 text-[#475569]">${s.examFee}</td>
                      <td className="px-4 py-3 text-[#475569]">${s.otherFee}</td>
                      <td className="px-4 py-3 font-semibold text-[#0F172A]">${s.totalAmount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(s)} className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#16a34a] transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(s._id)} className="p-1.5 rounded-md hover:bg-red-50 text-[#64748B] hover:text-[#EF4444] transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* Defaulters Table */
          <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-x-auto">
            {defaulters.length > 0 && (
              <div className="p-4 bg-[#FEF2F2] border-b border-[#FECACA] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                <span className="text-sm text-[#EF4444] font-medium">{defaulters.length} student(s) with pending dues totaling ${pendingAmount.toLocaleString()}</span>
              </div>
            )}
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Roll No</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Due Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {defaulters.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-[#16a34a]" />
                        <p className="text-sm text-[#64748B]">No defaulters found</p>
                        <p className="text-xs text-[#94A3B8]">All students have cleared their dues</p>
                      </div>
                    </td>
                  </tr>
                ) : defaulters.map((c) => (
                  <tr key={c._id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3 font-medium text-[#0F172A]">{c.student?.name || '-'}</td>
                    <td className="px-4 py-3 text-[#475569]">{c.student?.rollNumber || c.student?.studentId || '-'}</td>
                    <td className="px-4 py-3 text-[#475569]">{c.challanType}</td>
                    <td className="px-4 py-3 font-medium text-[#0F172A]">${c.amount}</td>
                    <td className="px-4 py-3 text-[#475569]">{new Date(c.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-[#EF4444] bg-red-50 px-2 py-0.5 rounded">{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
