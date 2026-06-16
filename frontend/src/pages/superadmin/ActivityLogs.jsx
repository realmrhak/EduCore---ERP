import { useState, useEffect, useCallback } from 'react';
import { activityLogAPI, extractData } from '@/services/api';
import { motion } from 'framer-motion';
import { Activity, Shield, BookOpen, DollarSign, Users, Settings, Loader2, ChevronDown, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const categories = ['All', 'Academic', 'Security', 'Finance', 'User Mgt', 'System'];
const categoryIcons = { Academic: BookOpen, Security: Shield, Finance: DollarSign, 'User Mgt': Users, System: Settings };
const PAGE_SIZE = 25;

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async (pageNum = 1, category = activeCategory, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = { page: pageNum, limit: PAGE_SIZE };
      if (category !== 'All') params.category = category;
      const r = await activityLogAPI.getAll(params);
      const body = r.data;
      const newLogs = extractData(r);

      if (append) setLogs(prev => [...prev, ...newLogs]);
      else setLogs(newLogs);

      setTotal(body.total || 0);
      setHasMore(body.hasMore || false);
    } catch (e) {
      toast.error('Failed to fetch logs');
    }

    if (pageNum === 1) setLoading(false);
    else setLoadingMore(false);
  }, [activeCategory]);

  useEffect(() => { setPage(1); fetchLogs(1, activeCategory, false); }, [activeCategory]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchLogs(next, activeCategory, true);
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#94A3B8] mb-1">
              <span>Admin Area</span> <span>&gt;</span> <span className="text-[#0F172A]">System Activity Logs</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">Activity Logs</h1>
            <p className="text-sm text-[#475569]">Audit trail for system-wide operations.</p>
          </div>
          <button onClick={() => { setPage(1); fetchLogs(1, activeCategory, false); toast.success('Refreshed'); }} className="flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#475569] hover:border-[#16a34a] shrink-0 self-end sm:self-auto">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5">
            <span className="text-xs text-[#475569] uppercase">Total Log Entries</span>
            <p className="text-2xl sm:text-3xl font-bold text-[#0F172A]">{total}</p>
            <p className="text-xs text-[#94A3B8] mt-1">Showing {logs.length} of {total}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5">
            <span className="text-xs text-[#475569] uppercase">Active Filter</span>
            <p className="text-xl font-bold text-[#0F172A]">{activeCategory === 'All' ? 'All Categories' : activeCategory}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5">
            <span className="text-xs text-[#475569] uppercase">Loaded</span>
            <p className="text-xl font-bold text-[#0F172A]">{logs.length}</p>
            <p className="text-xs text-[#94A3B8] mt-1">{hasMore ? `${total - logs.length} more available` : 'All loaded'}</p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeCategory === cat ? 'bg-[#16a34a] text-white' : 'bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#16a34a]'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f0fdf4]">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase w-12">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Timestamp</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="px-4 py-12 text-center"><Loader2 className="w-6 h-6 text-[#16a34a] animate-spin mx-auto" /><p className="text-sm text-[#94A3B8] mt-2">Loading...</p></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-12 text-sm text-[#94A3B8]">No activity logs found</td></tr>
              ) : logs.map((log, i) => {
                const Icon = categoryIcons[log.category] || Settings;
                return (
                  <tr key={log._id} className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3 text-sm text-[#475569]">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#0F172A]">{log.action}</td>
                    <td className="px-4 py-3 text-sm text-[#475569]">{log.userName || log.user?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#475569]">{log.category}</td>
                    <td className="px-4 py-3 text-sm text-[#475569]">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-[#475569] max-w-xs truncate">{log.details}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Show More */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <button onClick={handleLoadMore} disabled={loadingMore}
              className="flex items-center gap-2 px-6 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#475569] hover:border-[#16a34a] hover:text-[#16a34a] disabled:opacity-60">
              {loadingMore ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading more...</> : <><ChevronDown className="w-4 h-4" /> Show More Logs</>}
            </button>
          </div>
        )}

        {!loading && logs.length > 0 && (
          <p className="text-xs text-[#94A3B8] mt-3 text-right">Showing {logs.length} of {total}</p>
        )}
      </motion.div>
    </div>
  );
}
