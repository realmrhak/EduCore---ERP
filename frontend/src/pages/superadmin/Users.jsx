import { useState, useEffect, useCallback, useRef } from 'react';
import { userAPI, departmentAPI, extractData } from '@/services/api';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, Award, AlertCircle, Loader2, Users as UsersIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAlertDialog } from '@/components/AlertDialog';
import CustomSelect from '@/components/CustomSelect';

export default function AdminUsers() {
  const { confirm: confirmAction } = useAlertDialog();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [role, setRole] = useState('student');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', fatherName: '', gender: 'Male', cnic: '', phone: '',
    email: '', password: '', role: 'student', department: '', semester: 1,
  });

  // Loading & Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const fetchCountRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page when role or search changes
  useEffect(() => {
    setPage(1);
  }, [role, debouncedSearch]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const fetchId = ++fetchCountRef.current;
    try {
      const params = { role, search: debouncedSearch || undefined, page, limit: 20 };
      const r = await userAPI.getAll(params);
      const body = r.data;

      // Ignore stale responses
      if (fetchId !== fetchCountRef.current) return;

      // Use extractData utility for robust response parsing
      let usersArray = extractData(r, 'users');

      // Extra safety: ensure usersArray is always an array
      if (!Array.isArray(usersArray)) {
        console.warn('Users API returned non-array data, falling back to empty array');
        usersArray = [];
      }

      // Extract pagination info from various response shapes
      let resTotal = 0;
      let resPages = 1;
      if (body?.data?.users) {
        resTotal = body.data.total || 0;
        resPages = body.data.pages || 1;
      } else if (body?.users) {
        resTotal = body.total || 0;
        resPages = body.pages || 1;
      } else {
        resTotal = usersArray.length;
        resPages = 1;
      }

      // Ensure each user has a unique key
      const safeUsers = usersArray.map(u => ({
        ...u,
        _id: u._id || u.id || `temp-${Math.random()}`,
        name: u.name || 'Unknown',
        email: u.email || '-',
        status: u.status || 'Unknown',
      }));

      setUsers(safeUsers);
      setTotal(resTotal);
      setPages(resPages);
    } catch (err) {
      if (fetchId !== fetchCountRef.current) return;
      console.error('Failed to fetch users:', err);
      const message = err.response?.data?.message || err.message || 'Failed to load users. Make sure the backend server is running.';
      setError(message);
      setUsers([]);
      try { toast.error(message); } catch {}
    } finally {
      if (fetchId === fetchCountRef.current) {
        setLoading(false);
      }
    }
  }, [role, debouncedSearch, page]);

  const fetchDepartments = useCallback(async () => {
    try {
      const r = await departmentAPI.getAll();
      const depts = extractData(r, 'departments');
      setDepartments(Array.isArray(depts) ? depts : []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      setDepartments([]);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields (Name, Email, Password)');
      return;
    }
    setActionLoading(true);
    try {
      await userAPI.create(formData);
      toast.success(`${formData.role === 'student' ? 'Student' : 'Teacher'} created successfully`);
      setShowForm(false);
      setFormData({
        name: '', fatherName: '', gender: 'Male', cnic: '', phone: '',
        email: '', password: '', role: 'student', department: '', semester: 1,
      });
      fetchUsers();
    } catch (e) {
      const message = e.response?.data?.message || e.message || 'Failed to create user';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirmAction('Delete this user? This action cannot be undone.', { title: 'Delete User', type: 'danger' });
    if (!ok) return;
    setActionLoading(true);
    try {
      await userAPI.delete(id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (e) {
      const message = e.response?.data?.message || e.message || 'Failed to delete user';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromote = async (id) => {
    const ok = await confirmAction('Promote this user to Teacher?', { title: 'Promote User', type: 'confirm' });
    if (!ok) return;
    setActionLoading(true);
    try {
      await userAPI.promote(id);
      toast.success('User promoted to Teacher successfully');
      fetchUsers();
    } catch (e) {
      const message = e.response?.data?.message || e.message || 'Failed to promote user';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  // Error state UI
  if (error && users.length === 0) {
    return (
      <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#94A3B8] mb-1">
                <span>Users</span> <span>&gt;</span> <span className="text-[#0F172A]">{role === 'student' ? 'Students' : 'Teachers'}</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">{role === 'student' ? 'Student Registry' : 'Teacher Registry'}</h1>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-12 h-12 text-[#EF4444] mb-4" />
            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Failed to Load Users</h3>
            <p className="text-sm text-[#64748B] mb-4 max-w-md">{error}</p>
            <p className="text-xs text-[#94A3B8] mb-4">Make sure your backend server is running and the database is connected.</p>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] transition-colors"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#94A3B8] mb-1">
              <span>Users</span> <span>&gt;</span> <span className="text-[#0F172A]">{role === 'student' ? 'Students' : 'Teachers'}</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">{role === 'student' ? 'Student Registry' : 'Teacher Registry'}</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={loading}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] disabled:opacity-50 transition-colors shrink-0 self-end sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add New {role === 'student' ? 'Student' : 'Teacher'}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
          <div className="relative flex-1 max-w-full sm:max-w-sm">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#16a34a]" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full pl-10 pr-4 h-9 sm:h-10 bg-white border border-[#E2E8F0] rounded-lg text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#16a34a] transition-colors"
            />
          </div>
          <div className="flex bg-[#F1F5F9] rounded-lg p-0.5">
            <button
              onClick={() => { setRole('student'); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${role === 'student' ? 'bg-white text-[#16a34a] shadow-sm' : 'text-[#475569]'}`}
            >
              Students
            </button>
            <button
              onClick={() => { setRole('teacher'); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${role === 'teacher' ? 'bg-white text-[#16a34a] shadow-sm' : 'text-[#475569]'}`}
            >
              Teachers
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6 mb-6">
            <h3 className="text-sm font-semibold mb-4">Add New {formData.role === 'student' ? 'Student' : 'Teacher'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name *" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a] transition-colors" />
              <input type="text" value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} placeholder="Father's Name" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a] transition-colors" />
              <CustomSelect value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})} options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]} className="px-3 py-2" />
              <input type="text" value={formData.cnic} onChange={e => setFormData({...formData, cnic: e.target.value})} placeholder="CNIC" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a] transition-colors" />
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Phone" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a] transition-colors" />
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email *" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a] transition-colors" />
              <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Password *" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a] transition-colors" />
              <CustomSelect value={formData.department} onValueChange={v => setFormData({...formData, department: v})} options={[{ value: '', label: 'Select Department' }, ...departments.map(d => ({ value: d._id || d.id, label: d.name || 'Unnamed' }))]} className="px-3 py-2" />
              <CustomSelect value={String(formData.semester)} onValueChange={v => setFormData({...formData, semester: parseInt(v)})} options={[1,2,3,4,5,6,7,8].map(s => ({ value: String(s), label: `Semester ${s}` }))} className="px-3 py-2" />
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={handleCreate} disabled={actionLoading} className="px-6 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] disabled:opacity-50 transition-colors">
                {actionLoading ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setShowForm(false)} className="px-6 py-2 border border-[#E2E8F0] rounded-lg text-sm hover:bg-[#F8FAFC] transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[#16a34a] animate-spin" />
                <p className="text-sm text-[#64748B]">Loading users...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <UsersIcon className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-[#0F172A] mb-1">No Users Found</h3>
                <p className="text-xs text-[#64748B]">
                  {debouncedSearch ? 'Try a different search term' : `No ${role === 'student' ? 'students' : 'teachers'} have been added yet`}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f0fdf4]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#14532d] uppercase">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#14532d] uppercase">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#14532d] uppercase">Department</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#14532d] uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#14532d] uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id} className="border-t border-[#F1F5F9] hover:bg-[#f0fdf4] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#f0fdf4] flex items-center justify-center">
                              <span className="text-xs font-semibold text-[#16a34a]">{user.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#0F172A]">{user.name}</p>
                              <p className="text-xs text-[#94A3B8]">{user.registrationNumber || user.employeeId || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#475569]">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-[#475569]">{user.department?.name || (typeof user.department === 'string' ? user.department : '-')}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'Active' ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[#F1F5F9] text-[#94A3B8]'
                          }`}>{user.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {role === 'student' && (
                              <button onClick={() => handlePromote(user._id)} title="Promote to Teacher" className="p-1.5 hover:bg-[#f0fdf4] rounded-lg text-[#16a34a]" disabled={actionLoading}>
                                <Award className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => handleDelete(user._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-[#EF4444]" disabled={actionLoading}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
                  <p className="text-xs text-[#64748B]">Showing {users.length} of {total} users</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 text-xs border border-[#E2E8F0] rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-[#475569]">Page {page} of {pages}</span>
                    <button
                      onClick={() => setPage(p => Math.min(pages, p + 1))}
                      disabled={page === pages}
                      className="px-3 py-1 text-xs border border-[#E2E8F0] rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
