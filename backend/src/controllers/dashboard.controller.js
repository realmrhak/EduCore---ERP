const {
  User, Department, Subject, Attendance, Result,
  Challan, Quiz, ActivityLog, Timetable, Notification,
} = require('../models');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

class DashboardController {
  adminStats = catchAsync(async (req, res) => {
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayAttendance = await Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow } });

    const monthlyAttendance = [];
    const recentAdmissions = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
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

    const [feeByStatus, recentActivities] = await Promise.all([
      Challan.aggregate([{ $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name role'),
    ]);

    return sendSuccess(res, {
      totalStudents, totalTeachers, totalDepartments, totalSubjects,
      totalRevenue, todayAttendance, pendingResults, pendingChallans,
      monthlyAttendance, recentAdmissions, feeByStatus, recentActivities,
    }, 'Admin dashboard stats fetched');
  });

  teacherStats = catchAsync(async (req, res) => {
    if (!['teacher', 'admin', 'superadmin'].includes(req.user.role)) {
      return sendError(res, 'Access denied', 403);
    }
    const subjects = await Subject.find({ assignedTeacher: req.user._id }).populate('department', 'name code');
    const today = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    const [todaySchedule, pendingAttendance, recentNotices] = await Promise.all([
      Timetable.find({ teacher: req.user._id, day: today }).populate('subject', 'name code').sort({ startTime: 1 }),
      Attendance.countDocuments({ markedBy: req.user._id, date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(5),
    ]);
    return sendSuccess(res, { subjects, todaySchedule, pendingAttendance, recentNotices }, 'Teacher dashboard stats fetched');
  });

  studentStats = catchAsync(async (req, res) => {
    if (req.user.role !== 'student') return sendError(res, 'Access denied', 403);
    const studentId = req.user._id;
    const attendanceRecords = await Attendance.find({ student: studentId });
    const totalClasses = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((r) => r.status === 'Present').length;
    const lateCount = attendanceRecords.filter((r) => r.status === 'Late').length;
    const attendancePercentage = totalClasses > 0
      ? (((presentCount + lateCount * 0.5) / totalClasses) * 100).toFixed(1) : 0;

    const [subjectsCount, pendingQuizzes, latestResults, feeDues] = await Promise.all([
      Subject.countDocuments({ department: req.user.department, semester: req.user.semester }),
      Quiz.countDocuments({ department: req.user.department, semester: req.user.semester, status: 'Published' }),
      Result.find({ student: studentId, status: 'Approved' }).populate('subject', 'name code').sort({ createdAt: -1 }).limit(5),
      Challan.find({ student: studentId, status: { $in: ['Pending', 'Generated'] } }),
    ]);

    return sendSuccess(res, {
      attendancePercentage, currentSemester: req.user.semester,
      subjectsCount, pendingQuizzes, latestResults, feeDues,
    }, 'Student dashboard stats fetched');
  });
}

module.exports = new DashboardController();
