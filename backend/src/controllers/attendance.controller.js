const { Attendance } = require('../models');
const Timetable = require('../models/Timetable');
const Subject = require('../models/Subject');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

class AttendanceController {
  getAttendance = catchAsync(async (req, res) => {
    const { department, semester, subject, date, student, page = 1, limit = 50 } = req.query;
    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (subject) query.subject = subject;
    if (date) {
      const d = new Date(date);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: d, $lt: nextDay };
    }

    if (req.user.role === 'student') {
      query.student = req.user._id;
    } else if (student) {
      query.student = student;
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name registrationNumber profileImage')
      .populate('subject', 'name code')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const count = await Attendance.countDocuments(query);
    return sendSuccess(res, attendance, 'Attendance list fetched');
  });

  markAttendance = catchAsync(async (req, res) => {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return sendError(res, 'Records array is required', 400);
    }

    // If teacher, verify they are assigned to the subject
    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      const subjectId = records[0]?.subject;
      if (subjectId) {
        const subject = await Subject.findById(subjectId);
        if (!subject) {
          return sendError(res, 'Subject not found', 404);
        }
        // Check if this teacher is assigned to this subject
        if (subject.assignedTeacher && subject.assignedTeacher.toString() !== req.user._id.toString()) {
          return sendError(res, `You are not assigned to teach ${subject.name}. Only the assigned teacher can mark attendance for this subject.`, 403);
        }
      }
    }

    // Validate timetable for each record
    for (const record of records) {
      const { department, semester, subject, date } = record;
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

      const timetableEntry = await Timetable.findOne({
        department,
        semester,
        subject,
        day: dayOfWeek
      });

      if (!timetableEntry) {
        return sendError(res, `No class scheduled for ${subject} on ${dayOfWeek}`, 400);
      }
    }

    const attendanceRecords = records.map((r) => ({
      ...r,
      markedBy: req.user._id,
    }));

    const created = [];
    for (const record of attendanceRecords) {
      try {
        const doc = await Attendance.create(record);
        created.push(doc);
      } catch (err) {
        if (err.code !== 11000) throw err;
      }
    }

    return sendSuccess(res, created, `Attendance marked for ${created.length} students`);
  });

  updateRecord = catchAsync(async (req, res) => {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) return sendError(res, 'Record not found', 404);

    // Only superadmin can modify locked records
    if (attendance.isLocked && req.user.role !== 'superadmin') {
      return sendError(res, 'Attendance record is locked. Contact Super Admin to unlock.', 403);
    }

    const updated = await Attendance.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    return sendSuccess(res, updated, 'Attendance record updated');
  });

  getStudentRecords = catchAsync(async (req, res) => {
    if (req.user.role === 'student' && req.params.id !== req.user._id.toString()) {
      return sendError(res, 'Access denied', 403);
    }

    const { subject } = req.query;
    const query = { student: req.params.id };
    if (subject) query.subject = subject;
    const records = await Attendance.find(query)
      .populate('subject', 'name code')
      .sort({ date: -1 });
    return sendSuccess(res, records, 'Student attendance records fetched');
  });

  getStudentStats = catchAsync(async (req, res) => {
    if (req.user.role === 'student' && req.params.id !== req.user._id.toString()) {
      return sendError(res, 'Access denied', 403);
    }

    const records = await Attendance.find({ student: req.params.id });
    const total = records.length;
    const present = records.filter((r) => r.status === 'Present').length;
    const absent = records.filter((r) => r.status === 'Absent').length;
    const late = records.filter((r) => r.status === 'Late').length;
    const percentage = total > 0 ? ((present + late * 0.5) / total * 100).toFixed(1) : 0;
    return sendSuccess(res, { total, present, absent, late, percentage }, 'Student stats calculated');
  });

  getMonthlyReport = catchAsync(async (req, res) => {
    const { department, semester, month, year } = req.query;
    const start = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);

    const query = { date: { $gte: start, $lte: end } };
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);

    const records = await Attendance.find(query).populate('student', 'name registrationNumber');
    const summary = {};
    records.forEach((r) => {
      const sid = r.student._id.toString();
      if (!summary[sid]) {
        summary[sid] = { student: r.student, present: 0, absent: 0, late: 0, total: 0 };
      }
      summary[sid].total++;
      if (r.status === 'Present') summary[sid].present++;
      else if (r.status === 'Absent') summary[sid].absent++;
      else if (r.status === 'Late') summary[sid].late++;
    });

    return sendSuccess(res, Object.values(summary), 'Monthly report generated');
  });
}

module.exports = new AttendanceController();