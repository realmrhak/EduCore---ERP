import { useState, useEffect } from 'react';
import { resultAPI, extractData } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { FileText, Download, TrendingUp, Award, BookOpen, Clock, AlertCircle, Eye, X } from 'lucide-react';

export default function StudentResults() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [pendingResults, setPendingResults] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [pdfPreview, setPdfPreview] = useState(null); // { url, name }

  useEffect(() => {
    if (user?._id) {
      // Fetch approved results via the dedicated student endpoint
      resultAPI.getStudent(user._id).then(r => setResults(extractData(r))).catch(() => {});
      // Also fetch all results (including pending) via getAll — backend auto-filters by logged-in student
      resultAPI.getAll().then(r => {
        const all = extractData(r);
        setPendingResults(all.filter(res => res.status === 'Pending'));
      }).catch(() => {});
    }
  }, [user]);

  const filtered = activeTab === 'all' ? results : results.filter(r => r.examType.toLowerCase().includes(activeTab));

  const getGrade = (obtained, total) => {
    if (!total || total === 0) return 'N/A';
    const p = (obtained / total) * 100;
    if (p >= 90) return 'A+';
    if (p >= 80) return 'A';
    if (p >= 70) return 'B';
    if (p >= 60) return 'C';
    if (p >= 50) return 'D';
    return 'F';
  };

  // Safe percentage calculation
  const safePercent = (obtained, total) => (!total || total === 0) ? 0 : (obtained / total * 100);

  // Download a single result PDF
  const handleDownloadPdf = (result) => {
    if (!result.pdfUrl) return;
    const link = document.createElement('a');
    link.href = result.pdfUrl;
    link.download = `${result.subject?.name || 'Result'}_${result.examType}_Sem${result.semester || ''}.pdf`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // View PDF in modal/preview
  const handleViewPdf = (result) => {
    if (!result.pdfUrl) return;
    setPdfPreview({
      url: result.pdfUrl,
      name: `${result.subject?.name || 'Result'} — ${result.examType}`,
    });
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">Academic Results</h1>
            <p className="text-sm text-[#475569]">View your examination results and academic performance.</p>
          </div>
        </div>

        {/* Pending Results Notice */}
        {pendingResults.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-[#F59E0B] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#92400E]">
                {pendingResults.length} result(s) pending approval
              </p>
              <p className="text-xs text-[#A16207] mt-0.5">
                Your results for {pendingResults.map(r => r.subject?.name || r.examType).filter(Boolean).join(', ')} are awaiting approval from the administration. They will appear here once approved.
              </p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <Award className="w-5 h-5 text-[#16a34a] mb-2" />
            <p className="text-xl font-bold text-[#0F172A]">{results.length}</p>
            <p className="text-xs text-[#94A3B8]">Total Results</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <TrendingUp className="w-5 h-5 text-[#16a34a] mb-2" />
            <p className="text-xl font-bold text-[#0F172A]">
              {results.length > 0 ? (results.reduce((s, r) => s + safePercent(r.marksObtained, r.totalMarks), 0) / results.length).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-[#94A3B8]">Average</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <BookOpen className="w-5 h-5 text-[#F59E0B] mb-2" />
            <p className="text-xl font-bold text-[#0F172A]">
              {results.length > 0 ? getGrade(
                results.reduce((s, r) => s + r.marksObtained, 0),
                results.reduce((s, r) => s + r.totalMarks, 0)
              ) : '-'}
            </p>
            <p className="text-xs text-[#94A3B8]">Overall Grade</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <FileText className="w-5 h-5 text-[#EF4444] mb-2" />
            <p className="text-xl font-bold text-[#0F172A]">{results.filter(r => r.totalMarks > 0 && r.marksObtained / r.totalMarks >= 0.6).length}</p>
            <p className="text-xs text-[#94A3B8]">Passed</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#F1F5F9] rounded-lg p-1 w-fit overflow-x-auto">
          {['all', 'mid-term', 'final-term', 'quiz', 'assignment'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium capitalize transition-all ${
                activeTab === tab ? 'bg-white text-[#16a34a] shadow-sm' : 'text-[#475569]'
              }`}>{tab === 'all' ? 'All' : tab}</button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f0fdf4]">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Subject</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Grade</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase">PDF</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 text-[#94A3B8]" />
                      <p className="text-[#94A3B8] text-sm">No results found</p>
                      <p className="text-xs text-[#CBD5E1]">Results will appear here once they are approved by the administration</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(r => (
                <tr key={r._id} className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[#0F172A]">{r.subject?.name || '-'}</p>
                    <p className="text-xs text-[#94A3B8]">{r.subject?.code}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#475569]">{r.examType}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-[#0F172A]">{r.marksObtained}/{r.totalMarks}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                      getGrade(r.marksObtained, r.totalMarks) === 'F' 
                        ? 'bg-red-50 text-[#EF4444]' 
                        : 'bg-[rgba(22,163,74,0.1)] text-[#16a34a]'
                    }`}>{getGrade(r.marksObtained, r.totalMarks)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.totalMarks > 0 && r.marksObtained / r.totalMarks >= 0.6 ? 'bg-green-50 text-[#16a34a]' : 'bg-red-50 text-[#EF4444]'
                    }`}>{r.totalMarks > 0 && r.marksObtained / r.totalMarks >= 0.6 ? 'Passed' : 'Failed'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {r.pdfUrl ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleViewPdf(r)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#16a34a] hover:bg-[#f0fdf4] rounded-md transition-colors"
                          title="View PDF">
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        <button onClick={() => handleDownloadPdf(r)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#475569] hover:bg-[#F1F5F9] rounded-md transition-colors"
                          title="Download PDF">
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-[#CBD5E1]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* PDF Preview Modal */}
      {pdfPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPdfPreview(null)}>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#16a34a]" />
                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A]">{pdfPreview.name}</h3>
                  <p className="text-xs text-[#94A3B8]">Result Document</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => {
                  const link = document.createElement('a');
                  link.href = pdfPreview.url;
                  link.download = `${pdfPreview.name}.pdf`;
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16a34a] text-white rounded-lg text-xs font-medium hover:bg-[#15803d] transition-colors">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button onClick={() => setPdfPreview(null)}
                  className="p-1.5 hover:bg-[#F1F5F9] rounded-lg transition-colors">
                  <X className="w-5 h-5 text-[#475569]" />
                </button>
              </div>
            </div>
            {/* PDF iframe */}
            <div className="flex-1 overflow-hidden rounded-b-2xl">
              <iframe
                src={pdfPreview.url}
                className="w-full h-full border-0"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
