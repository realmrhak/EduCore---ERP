import { useState, useEffect } from 'react';
import { reportsAPI, extractData } from '@/services/api';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, Users, CalendarDays, DollarSign, BarChart3, FileText, TrendingUp, Loader2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [lastExported, setLastExported] = useState({});

  useEffect(() => {
    reportsAPI.getSummary()
      .then((r) => {
        const body = r.data;
        if (body.success) {
          setSummary(body?.data ?? body);
        }
      })
      .catch((e) => {
        console.error(e);
        toast.error('Failed to load report summary');
      })
      .finally(() => setLoading(false));
  }, []);

  const download = async (type, filename) => {
    if (type === 'students' && summary?.totalStudents === 0) {
      toast.error('No student data available for export');
      return;
    }

    setDownloading(type);
    try {
      let response;
      if (type === 'students') {
        response = await reportsAPI.exportStudents();
      } else if (type === 'attendance') {
        response = await reportsAPI.exportAttendance();
      } else if (type === 'fees') {
        response = await reportsAPI.exportFees();
      }

      if (response && response.data) {
        const csvText = typeof response.data === 'string' ? response.data : String(response.data);

        // Check if it's a JSON error response
        try {
          const parsed = JSON.parse(csvText);
          if (parsed.success === false) {
            toast.error(parsed.message || 'Export failed — server returned an error');
            setDownloading(null);
            return;
          }
        } catch {
          // Not JSON — it's valid CSV text, proceed
        }

        // Check for empty CSV (only headers, no data rows)
        if (csvText.trim().split('\n').length <= 1) {
          toast.error('No data available for export — the database may be empty');
          setDownloading(null);
          return;
        }

        const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `${type}_report.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setLastExported(prev => ({ ...prev, [type]: new Date() }));
        toast.success(`${type} report downloaded successfully`);
      }
    } catch (e) {
      console.error('Export failed:', e);
      toast.error('Export failed — please ensure the backend is running');
    }
    setDownloading(null);
  };

  const reportCards = [
    { title: 'Student Directory', desc: 'Export all student records with department, semester, contact info', icon: Users, type: 'students', filename: 'students_report.csv' },
    { title: 'Attendance Report', desc: 'Export attendance records with dates, subjects, and status', icon: CalendarDays, type: 'attendance', filename: 'attendance_report.csv' },
    { title: 'Fee Collection', desc: 'Export payment history with challan status and amounts', icon: DollarSign, type: 'fees', filename: 'fees_report.csv' },
  ];

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A] flex items-center gap-2">
            <BarChart3 className="w-6 h-6" /> Reports & Analytics
          </h1>
          <p className="text-sm text-[#475569] mt-1">Generate and export institutional reports for analysis and record-keeping</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#16a34a] animate-spin" />
          </div>
        ) : (
          <>
            {summary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                {[
                  { label: 'Total Students', value: summary.totalStudents ?? 0, icon: Users, color: 'bg-[#f0fdf4]', iconColor: 'text-[#16a34a]' },
                  { label: 'Teachers', value: summary.totalTeachers ?? 0, icon: FileText, color: 'bg-blue-50', iconColor: 'text-[#3B82F6]' },
                  { label: 'Pending Results', value: summary.pendingResults ?? 0, icon: TrendingUp, color: 'bg-yellow-50', iconColor: 'text-[#F59E0B]' },
                  { label: 'Fees Collected', value: `$${(summary.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-purple-50', iconColor: 'text-[#8B5CF6]' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}>
                        <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                      </div>
                      <TrendingUp className="w-3 h-3 text-[#16a34a]" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-[#0F172A]">{s.value}</p>
                    <p className="text-xs text-[#475569] uppercase mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {reportCards.map((r) => (
                <div key={r.type} className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-lg bg-[#f0fdf4] flex items-center justify-center mb-4">
                    <r.icon className="w-6 h-6 text-[#16a34a]" />
                  </div>
                  <h3 className="font-semibold text-[#0F172A] mb-1">{r.title}</h3>
                  <p className="text-xs text-[#94A3B8] mb-5">{r.desc}</p>
                  <button
                    onClick={() => download(r.type, r.filename)}
                    disabled={downloading === r.type}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] disabled:opacity-60 transition-all w-auto justify-center"
                  >
                    {downloading === r.type ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Downloading...</>
                    ) : (
                      <><Download className="w-4 h-4" /> Export CSV</>
                    )}
                  </button>
                  {lastExported[r.type] && (
                    <div className="flex items-center gap-1 text-[11px] text-[#94A3B8] mt-2 justify-center">
                      <Clock className="w-3 h-3" />
                      Last exported: {lastExported[r.type].toLocaleTimeString()}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6">
              <h3 className="text-base font-semibold text-[#0F172A] mb-2">Quick Stats Overview</h3>
              {summary ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center p-4 bg-[#F8FAFC] rounded-xl">
                    <p className="text-xl sm:text-2xl font-bold text-[#0F172A]">{summary.totalDepartments ?? 0}</p>
                    <p className="text-xs text-[#475569]">Departments</p>
                  </div>
                  <div className="text-center p-4 bg-[#F8FAFC] rounded-xl">
                    <p className="text-xl sm:text-2xl font-bold text-[#0F172A]">{summary.totalSubjects ?? 0}</p>
                    <p className="text-xs text-[#475569]">Subjects</p>
                  </div>
                  <div className="text-center p-4 bg-[#F8FAFC] rounded-xl">
                    <p className="text-xl sm:text-2xl font-bold text-[#0F172A]">{summary.totalResults ?? 0}</p>
                    <p className="text-xs text-[#475569]">Total Results</p>
                  </div>
                  <div className="text-center p-4 bg-[#F8FAFC] rounded-xl">
                    <p className="text-xl sm:text-2xl font-bold text-[#0F172A]">{summary.pendingChallans ?? 0}</p>
                    <p className="text-xs text-[#475569]">Pending Challans</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#94A3B8]">No summary data available.</p>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
