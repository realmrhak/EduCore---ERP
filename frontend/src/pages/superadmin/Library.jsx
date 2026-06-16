import { useState, useEffect, useMemo, useRef } from 'react';
import { libraryAPI, userAPI, notificationAPI, extractData } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Search, RotateCcw, BookMarked, X, Loader2, AlertTriangle, Edit2, Trash2, Eye, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';

const BOOK_CATEGORIES = ['General', 'Computer Science', 'Mathematics', 'Physics', 'Business', 'Literature', 'History', 'Engineering', 'Reference', 'Chemistry', 'Biology', 'Economics', 'Psychology', 'Law', 'Medicine'];

export default function AdminLibrary() {
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [tab, setTab] = useState('catalog');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [students, setStudents] = useState([]);
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', category: 'General', totalCopies: 1, publisher: '', edition: '', shelfLocation: '', finePerDay: 10 });
  const [issueForm, setIssueForm] = useState({ bookId: '', studentId: '', dueDate: '' });
  const [editingBook, setEditingBook] = useState(null);
  const [editBookForm, setEditBookForm] = useState({ title: '', author: '', isbn: '', category: 'General', totalCopies: 1, publisher: '', edition: '', shelfLocation: '', finePerDay: 10 });
  const [viewingBook, setViewingBook] = useState(null);
  const [issueStatusFilter, setIssueStatusFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [reservingBook, setReservingBook] = useState(null);
  const searchTimeoutRef = useRef(null);

  const fetchBooks = async (s) => {
    try {
      const r = await libraryAPI.getBooks({ search: s || search || undefined });
      setBooks(extractData(r));
    } catch (e) { console.error(e); }
  };

  const fetchIssues = async () => {
    try {
      const r = await libraryAPI.getIssues();
      setIssues(extractData(r));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchBooks(), fetchIssues()]);
        const s = await userAPI.getStudents({ limit: 500 });
        setStudents(extractData(s));
      } catch (e) { toast.error('Failed to load library data'); }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => fetchBooks(search), 400);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [search]);

  const handleCreateBook = async () => {
    if (!bookForm.title || !bookForm.author) { toast.error('Title and author are required'); return; }
    try {
      await libraryAPI.createBook(bookForm);
      toast.success('Book added');
      setShowForm(false);
      setBookForm({ title: '', author: '', isbn: '', category: 'General', totalCopies: 1, publisher: '', edition: '', shelfLocation: '', finePerDay: 10 });
      fetchBooks();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to add book'); }
  };

  const handleIssue = async () => {
    if (!issueForm.bookId || !issueForm.studentId || !issueForm.dueDate) { toast.error('All fields required'); return; }
    try {
      await libraryAPI.issueBook(issueForm);
      toast.success('Book issued');
      setShowIssueForm(false);
      setIssueForm({ bookId: '', studentId: '', dueDate: '' });
      fetchBooks(); fetchIssues();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to issue book'); }
  };

  const handleReturn = async (id) => {
    try {
      const r = await libraryAPI.returnBook(id);
      const fine = r.data?.fine || 0;
      toast.success(fine > 0 ? `Returned. Fine: $${fine}` : 'Book returned');
      fetchBooks(); fetchIssues();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to return'); }
  };

  const handleReserve = async () => {
    if (!reservingBook?.bookId || !reservingBook?.studentId) return;
    try {
      await libraryAPI.reserveBook({ bookId: reservingBook.bookId, studentId: reservingBook.studentId, dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0] });
      toast.success('Book reserved');
      setReservingBook(null);
      fetchBooks(); fetchIssues();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to reserve'); }
  };

  const sendReminder = async (record) => {
    if (!record.student?._id) { toast.error('Student info unavailable'); return; }
    try {
      await notificationAPI.create({ title: 'Overdue Book Reminder', message: `Your book "${record.book?.title}" was due on ${new Date(record.dueDate).toLocaleDateString()}. Please return it.`, category: 'Academic', recipientId: record.student._id });
      toast.success(`Reminder sent to ${record.student.name}`);
    } catch (e) { toast.error('Failed to send reminder'); }
  };

  const handleDeleteBook = async (id) => {
    if (!confirm('Remove this book from catalog?')) return;
    try { await libraryAPI.deleteBook(id); toast.success('Book removed'); fetchBooks(); } catch (e) { toast.error('Failed to delete'); }
  };

  const handleEditBook = (book) => {
    setEditingBook(book._id);
    setEditBookForm({ title: book.title || '', author: book.author || '', isbn: book.isbn || '', category: book.category || 'General', totalCopies: book.totalCopies || 1, publisher: book.publisher || '', edition: book.edition || '', shelfLocation: book.shelfLocation || '', finePerDay: book.finePerDay || 10 });
  };

  const handleSaveEditBook = async () => {
    if (!editBookForm.title || !editBookForm.author) { toast.error('Title and author required'); return; }
    try { await libraryAPI.updateBook(editingBook, editBookForm); toast.success('Book updated'); setEditingBook(null); fetchBooks(); } catch (e) { toast.error('Failed to update'); }
  };

  // Stats
  const totalBooks = books.reduce((sum, b) => sum + (b.totalCopies || 0), 0);
  const availableBooks = books.reduce((sum, b) => sum + (b.availableCopies || 0), 0);
  const issuedCount = issues.filter(i => i.status === 'Issued').length;
  const overdueCount = issues.filter(i => i.status === 'Issued' && new Date(i.dueDate) < new Date()).length;

  const categories = [...new Set(books.map(b => b.category).filter(Boolean))];
  const filteredBooks = selectedCategory ? books.filter(b => b.category === selectedCategory) : books;

  const fines = useMemo(() => issues.filter(i => i.status === 'Issued' && new Date(i.dueDate) < new Date()).map(i => {
    const diffDays = Math.max(0, Math.ceil((new Date() - new Date(i.dueDate)) / (1000 * 60 * 60 * 24)));
    return { ...i, overdueDays: diffDays, fine: diffDays * (i.book?.finePerDay || 10) };
  }), [issues]);
  const totalFines = fines.reduce((sum, f) => sum + f.fine, 0);

  const filteredIssues = useMemo(() => {
    if (!issueStatusFilter) return issues;
    return issues.filter(i => {
      const isOverdue = i.status === 'Issued' && new Date(i.dueDate) < new Date();
      return (isOverdue ? 'Overdue' : i.status) === issueStatusFilter;
    });
  }, [issues, issueStatusFilter]);

  const viewingBookIssues = viewingBook ? issues.filter(i => i.book?._id === viewingBook._id) : [];

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#94A3B8] mb-1"><span>Admin</span> <span>&gt;</span> <span className="text-[#0F172A]">Library</span></div>
            <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">Library Management</h1>
            <p className="text-sm text-[#475569]">Book catalog, issue, return, and fine tracking</p>
          </div>
          <div className="flex gap-2 self-end sm:self-auto">
            <button onClick={() => setShowIssueForm(!showIssueForm)} className="flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm hover:border-[#16a34a] hover:text-[#16a34a] shrink-0">
              <BookMarked className="w-4 h-4" /> Issue Book
            </button>
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] shrink-0">
              <Plus className="w-4 h-4" /> Add Book
            </button>
          </div>
        </div>

        {/* Overdue Alert */}
        {overdueCount > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#EF4444] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#991B1B]">{overdueCount} Overdue Book{overdueCount !== 1 ? 's' : ''}</p>
              <p className="text-xs text-[#B91C1C]">{fines.length} student{fines.length !== 1 ? 's' : ''} with fines totaling ${totalFines}</p>
            </div>
            <button onClick={() => setTab('fines')} className="px-3 py-1.5 bg-[#EF4444] text-white rounded-lg text-xs font-medium">View Fines</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Total Books', value: totalBooks },
            { label: 'Available', value: availableBooks },
            { label: 'Issued', value: issuedCount },
            { label: 'Overdue', value: overdueCount },
            { label: 'Total Fines', value: `$${totalFines}` },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-4">
              <span className="text-xs text-[#475569] uppercase">{s.label}</span>
              <p className="text-xl sm:text-2xl font-bold text-[#0F172A]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[{ key: 'catalog', label: 'Catalog' }, { key: 'issues', label: 'Issues' }, { key: 'fines', label: 'Fines' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-[#16a34a] text-white' : 'bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#16a34a]'}`}>{t.label}</button>
          ))}
        </div>

        {/* Issue Book Form - Available on ALL tabs */}
        <AnimatePresence>
          {showIssueForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Issue Book</h3>
                  <button onClick={() => setShowIssueForm(false)}><X className="w-4 h-4 text-[#64748B]" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CustomSelect value={issueForm.bookId} onValueChange={v => setIssueForm({...issueForm, bookId: v})} options={[{ value: '', label: 'Select Book' }, ...books.filter(b => b.availableCopies > 0).map(b => ({ value: b._id, label: `${b.title} (${b.availableCopies} avail)` }))]} className="px-3 py-2" />
                  <CustomSelect value={issueForm.studentId} onValueChange={v => setIssueForm({...issueForm, studentId: v})} options={[{ value: '', label: 'Select Student' }, ...students.map(s => ({ value: s._id, label: `${s.name} (${s.registrationNumber})` }))]} className="px-3 py-2" />
                  <input type="date" value={issueForm.dueDate} onChange={e => setIssueForm({...issueForm, dueDate: e.target.value})} min={new Date().toISOString().split('T')[0]} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none" />
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={handleIssue} className="px-6 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium">Issue</button>
                  <button onClick={() => setShowIssueForm(false)} className="px-6 py-2 border border-[#E2E8F0] rounded-lg text-sm">Cancel</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== CATALOG TAB ===== */}
        {tab === 'catalog' && (
          <>
            {/* Add Book Form */}
            <AnimatePresence>
              {showForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
                  <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold">Add New Book</h3>
                      <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-[#64748B]" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input placeholder="Title *" value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none" />
                      <input placeholder="Author *" value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none" />
                      <input placeholder="ISBN" value={bookForm.isbn} onChange={e => setBookForm({...bookForm, isbn: e.target.value})} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none" />
                      <CustomSelect value={bookForm.category} onValueChange={v => setBookForm({...bookForm, category: v})} options={BOOK_CATEGORIES.map(c => ({ value: c, label: c }))} className="px-3 py-2" />
                      <input type="number" min="1" placeholder="Copies" value={bookForm.totalCopies} onChange={e => setBookForm({...bookForm, totalCopies: parseInt(e.target.value) || 1})} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none" />
                      <input placeholder="Publisher" value={bookForm.publisher} onChange={e => setBookForm({...bookForm, publisher: e.target.value})} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none" />
                      <input placeholder="Edition (e.g. 3rd)" value={bookForm.edition} onChange={e => setBookForm({...bookForm, edition: e.target.value})} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none" />
                      <input placeholder="Shelf Location (e.g. A3-B2)" value={bookForm.shelfLocation} onChange={e => setBookForm({...bookForm, shelfLocation: e.target.value})} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none" />
                      <input type="number" min="0" placeholder="Fine per day ($)" value={bookForm.finePerDay} onChange={e => setBookForm({...bookForm, finePerDay: parseInt(e.target.value) || 10})} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none" />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button onClick={handleCreateBook} className="px-6 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium">Add Book</button>
                      <button onClick={() => setShowForm(false)} className="px-6 py-2 border border-[#E2E8F0] rounded-lg text-sm">Cancel</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search & Filter */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
              <div className="relative flex-1 max-w-full sm:max-w-xs">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#16a34a]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search books..." className="w-full pl-10 pr-3 h-9 sm:h-10 bg-white border border-[#E2E8F0] rounded-lg text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none" />
              </div>
              <CustomSelect value={selectedCategory} onValueChange={v => setSelectedCategory(v)} options={[{ value: '', label: 'All Categories' }, ...categories.map(c => ({ value: c, label: c }))]} className="w-full sm:w-auto" />
            </div>

            {/* Books Table */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f0fdf4]">
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Author</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Shelf</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Available</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Fine/Day</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="7" className="text-center py-12 text-sm text-[#94A3B8]">Loading...</td></tr>
                  ) : filteredBooks.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-12 text-sm text-[#94A3B8]">No books found</td></tr>
                  ) : filteredBooks.map(book => (
                    <tr key={book._id} className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC]">
                      {editingBook === book._id ? (
                        <>
                          <td className="px-4 py-2"><input value={editBookForm.title} onChange={e => setEditBookForm({...editBookForm, title: e.target.value})} className="w-full px-2 py-1 border border-[#E2E8F0] rounded text-sm outline-none" /></td>
                          <td className="px-4 py-2"><input value={editBookForm.author} onChange={e => setEditBookForm({...editBookForm, author: e.target.value})} className="w-full px-2 py-1 border border-[#E2E8F0] rounded text-sm outline-none" /></td>
                          <td className="px-4 py-2"><CustomSelect value={editBookForm.category} onValueChange={v => setEditBookForm({...editBookForm, category: v})} options={BOOK_CATEGORIES.map(c => ({ value: c, label: c }))} className="px-2 py-1" /></td>
                          <td className="px-4 py-2"><input value={editBookForm.shelfLocation} onChange={e => setEditBookForm({...editBookForm, shelfLocation: e.target.value})} className="w-full px-2 py-1 border border-[#E2E8F0] rounded text-sm outline-none" /></td>
                          <td className="px-4 py-2"><input type="number" min="1" value={editBookForm.totalCopies} onChange={e => setEditBookForm({...editBookForm, totalCopies: parseInt(e.target.value) || 1})} className="w-16 px-2 py-1 border border-[#E2E8F0] rounded text-sm outline-none" /></td>
                          <td className="px-4 py-2"><input type="number" min="0" value={editBookForm.finePerDay} onChange={e => setEditBookForm({...editBookForm, finePerDay: parseInt(e.target.value) || 10})} className="w-16 px-2 py-1 border border-[#E2E8F0] rounded text-sm outline-none" /></td>
                          <td className="px-4 py-2">
                            <div className="flex gap-1">
                              <button onClick={handleSaveEditBook} className="px-3 py-1 bg-[#16a34a] text-white rounded text-xs">Save</button>
                              <button onClick={() => setEditingBook(null)} className="px-3 py-1 border border-[#E2E8F0] rounded text-xs">Cancel</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-[#0F172A]">{book.title}</p>
                            {book.isbn && <p className="text-xs text-[#94A3B8]">ISBN: {book.isbn}</p>}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#475569]">{book.author}</td>
                          <td className="px-4 py-3 text-sm text-[#475569]">{book.category || '-'}</td>
                          <td className="px-4 py-3 text-sm text-[#475569]">{book.shelfLocation || '-'}</td>
                          <td className="px-4 py-3 text-sm text-[#475569]">{book.availableCopies}/{book.totalCopies}</td>
                          <td className="px-4 py-3 text-sm text-[#475569]">${book.finePerDay || 10}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setViewingBook(book)} className="p-1 hover:bg-[#F1F5F9] rounded text-[#475569]" title="View Details"><Eye className="w-4 h-4" /></button>
                              <button onClick={() => handleEditBook(book)} className="p-1 hover:bg-[#F1F5F9] rounded text-[#475569]" title="Edit"><Edit2 className="w-4 h-4" /></button>
                              {book.availableCopies > 0 ? (
                                <button onClick={() => { setShowIssueForm(true); setIssueForm(prev => ({...prev, bookId: book._id})); }} className="p-1 hover:bg-[#f0fdf4] rounded text-[#16a34a]" title="Issue"><BookMarked className="w-4 h-4" /></button>
                              ) : (
                                <button onClick={() => setReservingBook({ bookId: book._id, bookTitle: book.title })} className="p-1 hover:bg-[#F1F5F9] rounded text-[#64748B]" title="Reserve">R</button>
                              )}
                              <button onClick={() => handleDeleteBook(book._id)} className="p-1 hover:bg-red-50 rounded text-[#EF4444]" title="Delete"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ===== ISSUES TAB ===== */}
        {tab === 'issues' && (
          <>
            {/* Issue Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['', 'Issued', 'Returned', 'Overdue', 'Reserved'].map(s => (
                <button key={s} onClick={() => setIssueStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${issueStatusFilter === s ? 'bg-[#16a34a] text-white' : 'bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#16a34a]'}`}>{s || 'All'}</button>
              ))}
            </div>

            {/* Issues Table */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f0fdf4]">
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Book</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Issue Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Due Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Fine</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-12 text-sm text-[#94A3B8]">No issues found</td></tr>
                  ) : filteredIssues.map(issue => {
                    const isOverdue = issue.status === 'Issued' && new Date(issue.dueDate) < new Date();
                    return (
                      <tr key={issue._id} className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3 text-sm text-[#0F172A]">{issue.book?.title || '-'}</td>
                        <td className="px-4 py-3"><p className="text-sm text-[#0F172A]">{issue.student?.name || '-'}</p><p className="text-xs text-[#94A3B8]">{issue.student?.registrationNumber || ''}</p></td>
                        <td className="px-4 py-3 text-sm text-[#475569]">{new Date(issue.issueDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm text-[#475569]">{new Date(issue.dueDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm text-[#475569]">{isOverdue ? 'Overdue' : issue.status}</td>
                        <td className="px-4 py-3 text-sm">{issue.fineAmount > 0 ? <span className="text-[#EF4444]">${issue.fineAmount}</span> : '-'}</td>
                        <td className="px-4 py-3">
                          {(issue.status === 'Issued' || issue.status === 'Reserved') && (
                            <button onClick={() => handleReturn(issue._id)} className="flex items-center gap-1 text-xs text-[#16a34a] hover:underline"><RotateCcw className="w-3.5 h-3.5" /> Return</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ===== FINES TAB ===== */}
        {tab === 'fines' && (
          fines.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center text-sm text-[#94A3B8]">No overdue books or fines</div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 mb-4">
                <span className="text-xs text-[#475569] uppercase">Total Outstanding Fines</span>
                <p className="text-xl sm:text-2xl font-bold text-[#EF4444]">${totalFines}</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-red-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-[#991B1B]">Student</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-[#991B1B]">Book</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-[#991B1B]">Due Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-[#991B1B]">Overdue</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-[#991B1B]">Fine</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-[#991B1B]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fines.map((f, i) => (
                      <tr key={f._id || i} className="border-t border-[#FEE2E2] hover:bg-red-50/30">
                        <td className="px-4 py-3"><p className="text-sm text-[#0F172A]">{f.student?.name || '-'}</p><p className="text-xs text-[#94A3B8]">{f.student?.registrationNumber || ''}</p></td>
                        <td className="px-4 py-3 text-sm text-[#0F172A]">{f.book?.title || '-'}</td>
                        <td className="px-4 py-3 text-sm text-[#475569]">{new Date(f.dueDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm text-[#EF4444]">{f.overdueDays} day{f.overdueDays !== 1 ? 's' : ''}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#EF4444]">${f.fine}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => sendReminder(f)} className="text-xs text-[#475569] hover:text-[#16a34a]"><Bell className="w-3.5 h-3.5 inline" /> Remind</button>
                            <button onClick={() => handleReturn(f._id)} className="text-xs text-[#475569] hover:text-[#16a34a]"><RotateCcw className="w-3.5 h-3.5 inline" /> Return</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}

        {/* Book Detail Modal */}
        <AnimatePresence>
          {viewingBook && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setViewingBook(null)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{viewingBook.title}</h3>
                  <button onClick={() => setViewingBook(null)}><X className="w-5 h-5 text-[#64748B]" /></button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><span className="text-[#94A3B8] text-xs">Author</span><p className="text-[#0F172A]">{viewingBook.author}</p></div>
                    <div><span className="text-[#94A3B8] text-xs">ISBN</span><p className="text-[#0F172A]">{viewingBook.isbn || 'N/A'}</p></div>
                    <div><span className="text-[#94A3B8] text-xs">Category</span><p className="text-[#0F172A]">{viewingBook.category || 'N/A'}</p></div>
                    <div><span className="text-[#94A3B8] text-xs">Publisher</span><p className="text-[#0F172A]">{viewingBook.publisher || 'N/A'}{viewingBook.edition ? ` (${viewingBook.edition})` : ''}</p></div>
                    <div><span className="text-[#94A3B8] text-xs">Copies</span><p className="text-[#0F172A]">{viewingBook.availableCopies} / {viewingBook.totalCopies} available</p></div>
                    <div><span className="text-[#94A3B8] text-xs">Shelf</span><p className="text-[#0F172A]">{viewingBook.shelfLocation || 'N/A'}</p></div>
                    <div><span className="text-[#94A3B8] text-xs">Fine Rate</span><p className="text-[#0F172A]">${viewingBook.finePerDay || 10}/day</p></div>
                  </div>
                  {viewingBookIssues.length > 0 && (
                    <div className="pt-3 border-t border-[#E2E8F0]">
                      <p className="text-xs text-[#94A3B8] mb-2">Issue History</p>
                      {viewingBookIssues.map(issue => (
                        <div key={issue._id} className="flex items-center justify-between py-1 text-xs">
                          <span className="text-[#0F172A]">{issue.student?.name}</span>
                          <span className="text-[#475569]">{issue.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reserve Modal */}
        <AnimatePresence>
          {reservingBook && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setReservingBook(null)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-md p-4 sm:p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Reserve Book</h3>
                  <button onClick={() => setReservingBook(null)}><X className="w-5 h-5 text-[#64748B]" /></button>
                </div>
                <p className="text-sm text-[#475569] mb-4">Reserve "{reservingBook.bookTitle}" for a student (14 day pickup window).</p>
                <CustomSelect value={reservingBook.studentId || ''} onValueChange={v => setReservingBook({...reservingBook, studentId: v})} options={[{ value: '', label: 'Select Student' }, ...students.map(s => ({ value: s._id, label: `${s.name} (${s.registrationNumber})` }))]} className="w-full mb-4" />
                <div className="flex gap-2">
                  <button onClick={handleReserve} disabled={!reservingBook.studentId} className="flex-1 px-4 py-2.5 bg-[#16a34a] text-white rounded-lg text-sm font-medium disabled:opacity-60">Reserve</button>
                  <button onClick={() => setReservingBook(null)} className="px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm">Cancel</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
