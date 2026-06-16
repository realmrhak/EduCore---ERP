import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { libraryAPI, extractData } from '@/services/api';
import { motion } from 'framer-motion';
import { BookOpen, BookMarked, AlertTriangle, RotateCcw } from 'lucide-react';

export default function LibrarianDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalBooks: 0, issued: 0, available: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [books, issues, overdue] = await Promise.all([
          libraryAPI.getBooks({ limit: 500 }),
          libraryAPI.getIssues({ status: 'Issued' }),
          libraryAPI.getOverdue().catch(() => ({ data: { data: [] } })),
        ]);
        const bookList = extractData(books);
        setStats({
          totalBooks: books.data.total || bookList.length,
          issued: extractData(issues).length,
          available: bookList.reduce((s, b) => s + b.availableCopies, 0),
          overdue: extractData(overdue).length,
        });
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A] mb-1">Library Dashboard</h1>
          <p className="text-sm text-[#475569] mb-8">Book catalog and circulation overview.</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {[
              { label: 'Total Books', value: stats.totalBooks, icon: BookOpen, color: 'text-[#16a34a]' },
              { label: 'Available Copies', value: stats.available, icon: BookMarked, color: 'text-[#16a34a]' },
              { label: 'Currently Issued', value: stats.issued, icon: RotateCcw, color: 'text-[#F59E0B]' },
              { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-[#EF4444]' },
            ].map((c) => (
              <div key={c.label} className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5">
                <c.icon className={`w-5 h-5 ${c.color} mb-3`} />
                <p className="text-xs text-[#475569] uppercase">{c.label}</p>
                <p className="text-xl sm:text-2xl font-bold text-[#0F172A] mt-1">{loading ? '-' : c.value}</p>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/superadmin/library')} className="px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium">
            Open Library Management
          </button>
        </motion.div>
      </div>
  );
}
