import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { challanAPI, feeStructureAPI, extractData } from '@/services/api';
import { motion } from 'framer-motion';
import { DollarSign, Receipt, AlertTriangle, TrendingUp } from 'lucide-react';

export default function AccountantDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ pending: 0, paid: 0, totalAmount: 0, defaulters: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [challans, defaulters] = await Promise.all([
          challanAPI.getAll(),
          feeStructureAPI.getDefaulters().catch(() => ({ data: { data: [] } })),
        ]);
        const all = extractData(challans);
        setStats({
          pending: all.filter((c) => c.status === 'Pending').length,
          paid: all.filter((c) => c.status === 'Paid').length,
          totalAmount: all.filter((c) => c.status === 'Paid').reduce((s, c) => s + c.amount, 0),
          defaulters: extractData(defaulters).length,
        });
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A] mb-1">Finance Dashboard</h1>
          <p className="text-sm text-[#475569] mb-8">Fee collection overview and payment tracking.</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {[
              { label: 'Total Collected', value: `$${stats.totalAmount.toLocaleString()}`, icon: DollarSign, color: 'text-[#16a34a]' },
              { label: 'Paid Challans', value: stats.paid, icon: Receipt, color: 'text-[#16a34a]' },
              { label: 'Pending', value: stats.pending, icon: TrendingUp, color: 'text-[#F59E0B]' },
              { label: 'Defaulters', value: stats.defaulters, icon: AlertTriangle, color: 'text-[#EF4444]' },
            ].map((c) => (
              <div key={c.label} className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5">
                <c.icon className={`w-5 h-5 ${c.color} mb-3`} />
                <p className="text-xs text-[#475569] uppercase">{c.label}</p>
                <p className="text-xl sm:text-2xl font-bold text-[#0F172A] mt-1">{loading ? '-' : c.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('/superadmin/challans')} className="px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium">Manage Challans</button>
            <button onClick={() => navigate('/superadmin/fee-structure')} className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium">Fee Structure</button>
            <button onClick={() => navigate('/superadmin/reports')} className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium">Export Reports</button>
          </div>
        </motion.div>
      </div>
  );
}
