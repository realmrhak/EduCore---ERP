const express = require('express');
const { User, Department, Attendance, Challan, Result, Subject } = require('../models');
const { auth, requireAdmin } = require('../middleware/auth');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');

const router = express.Router();

router.use(auth);

// GET /api/reports/summary
router.get('/summary', requireAdmin, catchAsync(async (req, res) => {
  const [
    totalStudents, totalTeachers, totalDepartments, totalSubjects,
    pendingResults, pendingChallans, paidChallans,
  ] = await Promise.all([
    User.countDocuments({ role: 'student', isDeleted: false }),
    User.countDocuments({ role: { $in: ['admin', 'teacher'] }, isDeleted: false }),
    Department.countDocuments(),
    Subject.countDocuments(),
    Result.countDocuments({ status: 'Pending' }),
    Challan.countDocuments({ status: 'Pending' }),
    Challan.find({ status: 'Paid' }),
  ]);

  const totalRevenue = paidChallans.reduce((sum, c) => sum + (c.amount || 0), 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const todayAttendance = await Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow } });

  const monthlyAttendance = [];
  const recentAdmissions = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const label = d.toLocaleString('default', { month: 'short' });
    const [attCount, admCount] = await Promise.all([
      Attendance.countDocuments({ date: { $gte: monthStart, $lte: monthEnd }, status: 'Present' }),
      User.countDocuments({ role: 'student', createdAt: { $gte: monthStart, $lte: monthEnd } }),
    ]);
    monthlyAttendance.push({ month: label, count: attCount });
    recentAdmissions.push({ month: label, count: admCount });
  }

  const [feeByStatus, totalResults] = await Promise.all([
    Challan.aggregate([{ $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    Result.countDocuments(),
  ]);

  return sendSuccess(res, {
    totalStudents, totalTeachers, totalDepartments, totalSubjects,
    totalRevenue, todayAttendance, pendingResults, pendingChallans,
    totalResults, monthlyAttendance, recentAdmissions, feeByStatus,
  }, 'Summary report fetched');
}));

// Helper: escape CSV fields
const csvEscape = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// GET /api/reports/students/export
router.get('/students/export', requireAdmin, catchAsync(async (req, res) => {
  const students = await User.find({ role: 'student', isDeleted: false })
    .populate('department', 'name code')
    .sort({ name: 1 });

  const rows = ['Name,Email,Registration No,Department,Semester,Status,Phone,Gender'];
  students.forEach(s => {
    rows.push([
      csvEscape(s.name), csvEscape(s.email), csvEscape(s.registrationNumber),
      csvEscape(s.department?.name || ''), csvEscape(s.semester),
      csvEscape(s.status), csvEscape(s.phone || ''), csvEscape(s.gender || ''),
    ].join(','));
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=students_report.csv');
  res.send(rows.join('\n'));
}));

// GET /api/reports/attendance/export
router.get('/attendance/export', requireAdmin, catchAsync(async (req, res) => {
  const records = await Attendance.find()
    .populate('student', 'name registrationNumber')
    .populate('subject', 'name code')
    .populate('department', 'name code')
    .sort({ date: -1 })
    .limit(5000);

  const rows = ['Date,Student,Registration No,Department,Semester,Subject,Status'];
  records.forEach(r => {
    rows.push([
      csvEscape(r.date ? new Date(r.date).toLocaleDateString() : ''),
      csvEscape(r.student?.name || ''), csvEscape(r.student?.registrationNumber || ''),
      csvEscape(r.department?.name || ''), csvEscape(r.semester || ''),
      csvEscape(r.subject?.name || ''), csvEscape(r.status || ''),
    ].join(','));
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.csv');
  res.send(rows.join('\n'));
}));

// GET /api/reports/fees/export
router.get('/fees/export', requireAdmin, catchAsync(async (req, res) => {
  const challans = await Challan.find()
    .populate('student', 'name registrationNumber')
    .sort({ createdAt: -1 });

  const rows = ['Student,Registration No,Type,Amount,Due Date,Status,Issue Date'];
  challans.forEach(c => {
    rows.push([
      csvEscape(c.student?.name || ''), csvEscape(c.student?.registrationNumber || ''),
      csvEscape(c.challanType || ''), csvEscape(c.amount || 0),
      csvEscape(c.dueDate ? new Date(c.dueDate).toLocaleDateString() : ''),
      csvEscape(c.status || ''),
      csvEscape(c.issueDate ? new Date(c.issueDate).toLocaleDateString() : ''),
    ].join(','));
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=fees_report.csv');
  res.send(rows.join('\n'));
}));

module.exports = router;
