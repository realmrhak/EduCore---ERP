import { useState, useEffect } from 'react';
import { challanAPI, extractData } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { CreditCard, Download, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function TeacherChallans() {
  const { user } = useAuth();
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallans();
  }, []);

  const fetchChallans = async () => {
    try {
      const res = await challanAPI.getAll({});
      setChallans(extractData(res));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-green-50 text-[#16a34a]';
      case 'Pending': return 'bg-yellow-50 text-[#F59E0B]';
      case 'Overdue': return 'bg-red-50 text-[#EF4444]';
      default: return 'bg-gray-50 text-[#94A3B8]';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid': return <CheckCircle2 className="w-3 h-3" />;
      case 'Pending': return <Clock className="w-3 h-3" />;
      case 'Overdue': return <AlertCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#0F172A]">Fee Challans</h1>
          <p className="text-sm text-[#475569]">View and manage student fee challans.</p>
        </div>

        {challans.length === 0 && !loading ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <CreditCard className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#0F172A] mb-1">No Challans</h3>
            <p className="text-sm text-[#94A3B8]">No fee challans available at the moment.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-[rgba(22,163,74,0.06)]">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Challan #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Due Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {challans.map((challan) => (
                  <tr key={challan._id} className="border-t border-[#F1F5F9]">
                    <td className="px-4 py-3 text-sm font-medium text-[#16a34a]">{challan.challanNo || challan._id.slice(-6)}</td>
                    <td className="px-4 py-3 text-sm text-[#0F172A]">{challan.student?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#0F172A]">${challan.amount?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-[#475569]">{challan.dueDate ? new Date(challan.dueDate).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(challan.status)}`}>
                        {getStatusIcon(challan.status)} {challan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 rounded-lg hover:bg-[#f0fdf4] text-[#16a34a]" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
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
