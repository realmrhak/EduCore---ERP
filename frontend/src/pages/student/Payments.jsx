import { useState, useEffect } from 'react';
import { challanAPI, extractData } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { CreditCard, Download, Calendar, DollarSign, AlertTriangle, CheckCircle2, Clock, FileText } from 'lucide-react';

// Generate challan PDF
const generateChallanPDF = (challan, user) => {
  const student = challan.student || user || {};
  const printWindow = window.open('', '_blank');
  if (!printWindow) { alert('Please allow popups to download PDF'); return; }
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

export default function StudentPayments() {
  const { user } = useAuth();
  const [challans, setChallans] = useState([]);

  useEffect(() => {
    if (user?._id) {
      challanAPI.getAll({ student: user._id }).then(r => setChallans(extractData(r)));
    }
  }, [user]);

  const totalPaid = challans.filter(c => c.status === 'Paid').reduce((s, c) => s + (c.amount || 0), 0);
  const totalDue = challans.filter(c => c.status === 'Generated' || c.status === 'Pending').reduce((s, c) => s + (c.amount || 0), 0);

  return (
    <div className="p-3 sm:p-5 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#0F172A]">Payments & Challans</h1>
          <p className="text-sm text-[#64748B]">View and download your fee challans</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-[#16a34a]" />
              <span className="text-xs text-[#64748B]">Total Paid</span>
            </div>
            <p className="text-lg font-bold text-[#0F172A]">${totalPaid.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-xs text-[#64748B]">Total Due</span>
            </div>
            <p className="text-lg font-bold text-[#0F172A]">${totalDue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-[#16a34a]" />
              <span className="text-xs text-[#64748B]">Total Challans</span>
            </div>
            <p className="text-lg font-bold text-[#0F172A]">{challans.length}</p>
          </div>
        </div>

        {/* Challans Table */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Issue Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Due Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Download</th>
              </tr>
            </thead>
            <tbody>
              {challans.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-12 text-[#94A3B8]">No challans found</td></tr>
              ) : challans.map(c => (
                <tr key={c._id} className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#94A3B8]" />
                      <span className="font-medium text-[#0F172A]">{c.challanType}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#0F172A]">${c.amount?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[#475569]">{c.issueDate ? new Date(c.issueDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 text-[#475569]">{c.dueDate ? new Date(c.dueDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      c.status === 'Paid' ? 'bg-[#f0fdf4] text-[#16a34a]' :
                      c.status === 'Pending' ? 'bg-yellow-50 text-[#F59E0B]' :
                      c.status === 'Generated' ? 'bg-[#f0fdf4] text-[#16a34a]' :
                      'bg-[#F8FAFC] text-[#475569]'
                    }`}>
                      {c.status === 'Paid' ? <CheckCircle2 className="w-3 h-3" /> : c.status === 'Pending' ? <Clock className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => generateChallanPDF(c, user)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs text-[#475569] hover:border-[#16a34a] hover:text-[#16a34a] transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
