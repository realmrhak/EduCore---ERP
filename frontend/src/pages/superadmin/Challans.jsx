import { useState, useEffect, useRef } from 'react';
import { challanAPI, userAPI, extractData } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, FileText, Search, X, Loader2, DollarSign, Clock, Filter, Edit2, ChevronDown, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';

export default function AdminChallans() {
  const [challans, setChallans] = useState([]);
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [editingChallan, setEditingChallan] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [generatedChallan, setGeneratedChallan] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const emptyForm = { student: '', challanType: 'Mid-Semester', amount: '', dueDate: '', academicSession: '2025-2026', semester: '' };
  const [formData, setFormData] = useState(emptyForm);

  const selectedStudent = students.find(s => s._id === formData.student);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [challanRes, studentRes] = await Promise.all([
        challanAPI.getAll(),
        userAPI.getStudents({ limit: 500 }),
      ]);
      setChallans(extractData(challanRes));
      setStudents(extractData(studentRes));
    } catch (e) { toast.error('Failed to load data'); }
    setLoading(false);
  };

  const fetchChallans = async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const r = await challanAPI.getAll(params);
      setChallans(extractData(r));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchChallans(); }, [statusFilter]);

  const handleStudentSelect = (student) => {
    setFormData(prev => ({
      ...prev,
      student: student._id,
      semester: student.semester ?? prev.semester,
    }));
    setStudentSearch(student.name);
    setDropdownOpen(false);
    setHighlightedIndex(-1);
    if (inputRef.current) inputRef.current.blur();
  };

  // Generate challan PDF in browser
  const generateChallanPDF = (challan) => {
    const student = challan.student || {};
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Please allow popups to download PDF'); return; }
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Fee Challan</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #16a34a; padding-bottom: 20px; }
      .header h1 { font-size: 24px; color: #16a34a; margin-bottom: 4px; }
      .header p { font-size: 13px; color: #64748b; }
      .challan-info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; color: #475569; }
      .section { margin-bottom: 24px; }
      .section-title { font-size: 14px; font-weight: 600; color: #16a34a; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 13px; }
      .info-grid .label { color: #64748b; }
      .info-grid .value { font-weight: 500; }
      .amount-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0; }
      .amount-box .amount { font-size: 32px; font-weight: 700; color: #16a34a; }
      .amount-box .label { font-size: 12px; color: #64748b; margin-top: 4px; }
      .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; }
      .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
      .sig-line { width: 200px; text-align: center; font-size: 12px; color: #475569; }
      .sig-line .line { border-top: 1px solid #cbd5e1; margin-top: 40px; padding-top: 4px; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <div class="header">
      <h1>EduCore ERP</h1>
      <p>Fee Challan — ${challan.challanType || 'N/A'}</p>
    </div>
    <div class="challan-info">
      <span>Challan ID: ${challan._id?.slice(-8).toUpperCase() || 'N/A'}</span>
      <span>Issue Date: ${challan.issueDate ? new Date(challan.issueDate).toLocaleDateString() : new Date().toLocaleDateString()}</span>
    </div>
    <div class="section">
      <div class="section-title">Student Information</div>
      <div class="info-grid">
        <div><span class="label">Name:</span> <span class="value">${student.name || 'N/A'}</span></div>
        <div><span class="label">Registration #:</span> <span class="value">${student.registrationNumber || 'N/A'}</span></div>
        <div><span class="label">Department:</span> <span class="value">${student.department?.name || 'N/A'}</span></div>
        <div><span class="label">Semester:</span> <span class="value">${challan.semester || student.semester || 'N/A'}</span></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Fee Details</div>
      <div class="info-grid">
        <div><span class="label">Challan Type:</span> <span class="value">${challan.challanType || 'N/A'}</span></div>
        <div><span class="label">Academic Session:</span> <span class="value">${challan.academicSession || '2025-2026'}</span></div>
        <div><span class="label">Due Date:</span> <span class="value">${challan.dueDate ? new Date(challan.dueDate).toLocaleDateString() : 'N/A'}</span></div>
        <div><span class="label">Status:</span> <span class="value">${challan.status || 'Generated'}</span></div>
      </div>
    </div>
    <div class="amount-box">
      <div class="label">Total Amount</div>
      <div class="amount">$${(challan.amount || 0).toLocaleString()}</div>
    </div>
    <div class="footer">
      <span>This is a system-generated challan from EduCore ERP.</span>
      <span>Print and pay at designated bank before due date.</span>
    </div>
    <div class="signatures">
      <div class="sig-line"><div class="line">Student Signature</div></div>
      <div class="sig-line"><div class="line">Accounts Officer</div></div>
      <div class="sig-line"><div class="line">Authorized Signatory</div></div>
    </div>
    </body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const handleCreate = async () => {
    if (!formData.student || !selectedStudent) { toast.error('Please select a valid student'); return; }
    if (!formData.amount || formData.amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (!formData.dueDate) { toast.error('Select a due date'); return; }

    setSaving(true);
    try {
      const submitData = {
        student: formData.student,
        challanType: formData.challanType,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate,
        academicSession: formData.academicSession || '2025-2026',
        semester: selectedStudent.semester || formData.semester,
      };
      const res = await challanAPI.create(submitData, pdfFile);
      const newChallan = extractData(res);
      setGeneratedChallan(newChallan);
      toast.success('Challan generated successfully!');
      setShowForm(false);
      setFormData(emptyForm);
      setStudentSearch('');
      setPdfFile(null);
      fetchChallans();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to generate challan');
    }
    setSaving(false);
  };

  const handleEditStatus = async () => {
    if (!editingChallan || !editStatus) return;
    try {
      await challanAPI.update(editingChallan._id, { status: editStatus });
      toast.success('Status updated');
      setEditingChallan(null);
      setEditStatus('');
      fetchChallans();
    } catch (e) { toast.error('Failed to update status'); }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/reports/fees/export', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'challans_report.csv';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success('Exported successfully');
    } catch (e) { toast.error('Export failed'); }
  };

  const filteredStudents = studentSearch
    ? students.filter(s =>
        s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.registrationNumber?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.department?.name?.toLowerCase().includes(studentSearch.toLowerCase())
      )
    : students.slice(0, 20);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const stats = {
    total: challans.length,
    generated: challans.filter(c => c.status === 'Generated').length,
    pending: challans.filter(c => c.status === 'Pending').length,
    paid: challans.filter(c => c.status === 'Paid').length,
  };
  const totalAmount = challans.reduce((sum, c) => sum + (c.amount || 0), 0);

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-[#0F172A]">Fee Challan Generation</h1>
            <p className="text-sm text-[#64748B]">Generate and manage fee challans</p>
          </div>
          <div className="flex gap-2 self-end sm:self-auto">
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-sm text-[#475569] hover:border-[#16a34a] transition-colors shrink-0">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={() => { setShowForm(true); setFormData(emptyForm); setStudentSearch(''); setPdfFile(null); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] transition-colors shrink-0">
              <Upload className="w-4 h-4" /> Generate Challan
            </button>
          </div>
        </div>

        {/* Stats - No Overdue */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: FileText },
            { label: 'Generated', value: stats.generated, icon: DollarSign },
            { label: 'Pending', value: stats.pending, icon: Clock },
            { label: 'Paid', value: stats.paid, icon: DollarSign },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-lg border border-[#E2E8F0] p-2.5 sm:p-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#64748B]">{s.label}</span>
                <s.icon className="w-4 h-4 text-[#94A3B8]" />
              </div>
              <p className="text-lg font-bold text-[#0F172A]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Generate Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
              onClick={() => { setShowForm(false); setStudentSearch(''); }}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-[95vw] sm:max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                  <h3 className="text-sm font-semibold text-[#0F172A]">Generate New Challan</h3>
                  <button onClick={() => { setShowForm(false); setStudentSearch(''); }}><X className="w-5 h-5 text-[#64748B]" /></button>
                </div>

                <div className="space-y-4">
                  {/* Student Search */}
                  <div ref={dropdownRef}>
                    <label className="text-xs font-medium text-[#64748B] mb-1 block">Student *</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#16a34a] z-10" />
                      <input
                        ref={inputRef}
                        value={studentSearch}
                        onChange={e => {
                          setStudentSearch(e.target.value);
                          setDropdownOpen(true);
                          if (selectedStudent && e.target.value !== selectedStudent.name) {
                            setFormData(prev => ({ ...prev, student: '', semester: '' }));
                          }
                          if (!e.target.value) setFormData(prev => ({ ...prev, student: '', semester: '' }));
                        }}
                        onFocus={() => { setDropdownOpen(true); setTimeout(() => inputRef.current?.select(), 0); }}
                        onKeyDown={e => {
                          if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex(prev => Math.min(prev + 1, filteredStudents.length - 1)); }
                          else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(prev => Math.max(prev - 1, 0)); }
                          else if (e.key === 'Enter' && highlightedIndex >= 0) { e.preventDefault(); handleStudentSelect(filteredStudents[highlightedIndex]); }
                          else if (e.key === 'Escape') setDropdownOpen(false);
                        }}
                        placeholder="Search by name, reg #, or department..."
                        className="w-full pl-10 pr-10 h-9 sm:h-10 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#16a34a]"
                      />
                      <button type="button" onMouseDown={e => { e.preventDefault(); setDropdownOpen(!dropdownOpen); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {dropdownOpen && filteredStudents.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                          {filteredStudents.map((s, i) => (
                            <button key={s._id} type="button" onMouseDown={e => { e.preventDefault(); handleStudentSelect(s); }}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#F8FAFC] border-b border-[#F1F5F9] last:border-0 ${highlightedIndex === i ? 'bg-[#F8FAFC]' : ''} ${formData.student === s._id ? 'bg-[#f0fdf4]' : ''}`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-[#0F172A]">{s.name}</p>
                                  <p className="text-xs text-[#64748B]">{s.registrationNumber} • {s.department?.name || 'No dept'} • Sem {s.semester}</p>
                                </div>
                                {formData.student === s._id && <UserCheck className="w-4 h-4 text-[#16a34a]" />}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {dropdownOpen && filteredStudents.length === 0 && studentSearch && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg z-50 p-4 text-center text-sm text-[#94A3B8]">No students found</div>
                      )}
                    </div>
                    {selectedStudent && (
                      <div className="mt-2 p-3 bg-[#f0fdf4] rounded-lg border border-[#bbf7d0] text-sm">
                        <span className="font-medium">{selectedStudent.name}</span> — {selectedStudent.registrationNumber} • {selectedStudent.department?.name || 'No dept'} • Sem {selectedStudent.semester}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs font-medium text-[#64748B] mb-1 block">Challan Type *</label>
                      <CustomSelect value={formData.challanType} onValueChange={v => setFormData({...formData, challanType: v})} options={[{ value: 'Admission', label: 'Admission' }, { value: 'Mid-Semester', label: 'Mid-Semester' }, { value: 'Final-Semester', label: 'Final-Semester' }]} className="w-full" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#64748B] mb-1 block">Amount ($) *</label>
                      <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" min="0" step="0.01" className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#64748B] mb-1 block">Due Date *</label>
                    <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm outline-none" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#64748B] mb-1 block">Upload Challan PDF (optional — if not uploaded, system auto-generates)</label>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files[0] || null)} className="text-sm text-[#475569] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-[#f0fdf4] file:text-[#16a34a] cursor-pointer" />
                      {pdfFile && <button onClick={() => setPdfFile(null)}><X className="w-4 h-4 text-[#EF4444]" /></button>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3 mt-6">
                  <button onClick={handleCreate} disabled={saving || !formData.student} className="flex-1 px-6 py-2.5 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] disabled:opacity-60 flex items-center justify-center gap-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : 'Generate Challan'}
                  </button>
                  <button onClick={() => { setShowForm(false); setStudentSearch(''); }} className="px-6 py-2.5 border border-[#E2E8F0] rounded-lg text-sm">Cancel</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters - No Overdue */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]"><Filter className="w-3.5 h-3.5" /><span>Filter:</span></div>
          {['', 'Generated', 'Pending', 'Paid'].map(status => (
            <button key={status} onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === status ? 'bg-[#16a34a] text-white' : 'bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#16a34a]'}`}>
              {status || 'All'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Student</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Sem</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Due Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center"><Loader2 className="w-6 h-6 text-[#16a34a] animate-spin mx-auto" /></td></tr>
              ) : challans.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[#94A3B8]">No challans found</td></tr>
              ) : challans.map(c => (
                <tr key={c._id} className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[#0F172A]">{c.student?.name || '-'}</p>
                    <p className="text-xs text-[#94A3B8]">{c.student?.registrationNumber || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-[#475569]">{c.challanType}</td>
                  <td className="px-4 py-3 font-medium text-[#0F172A]">${c.amount?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[#475569]">{c.semester || c.student?.semester || '-'}</td>
                  <td className="px-4 py-3 text-[#475569]">{c.dueDate ? new Date(c.dueDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${
                      c.status === 'Paid' ? 'text-[#16a34a]' :
                      c.status === 'Pending' ? 'text-[#F59E0B]' : 'text-[#475569]'
                    }`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {c.status !== 'Paid' && (
                        <button onClick={() => { setEditingChallan(c); setEditStatus(c.status); }} className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#16a34a] transition-colors" title="Edit Status">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => generateChallanPDF(c)} className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#16a34a] transition-colors" title="Download Challan">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit Status Modal - No Overdue option */}
        <AnimatePresence>
          {editingChallan && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditingChallan(null)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-[95vw] sm:max-w-md p-4 sm:p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[#0F172A]">Update Status</h3>
                  <button onClick={() => setEditingChallan(null)}><X className="w-5 h-5 text-[#64748B]" /></button>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="p-3 bg-[#F8FAFC] rounded-lg">
                    <p className="text-sm font-medium">{editingChallan.student?.name}</p>
                    <p className="text-xs text-[#64748B]">{editingChallan.challanType} — ${editingChallan.amount?.toLocaleString()}</p>
                  </div>
                  <CustomSelect value={editStatus} onValueChange={v => setEditStatus(v)} options={[{ value: 'Generated', label: 'Generated' }, { value: 'Pending', label: 'Pending' }, { value: 'Paid', label: 'Paid' }]} className="w-full" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleEditStatus} className="flex-1 px-4 py-2.5 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d]">Update</button>
                  <button onClick={() => setEditingChallan(null)} className="px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm">Cancel</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
