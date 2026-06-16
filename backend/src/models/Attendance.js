const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  semester: { type: Number, required: true },
  academicSession: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Late'], required: true },
  notes: { type: String, default: '' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isLocked: { type: Boolean, default: false },
}, { timestamps: true });

attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });
attendanceSchema.index({ department: 1, semester: 1, date: 1 });
attendanceSchema.index({ academicSession: 1 });
attendanceSchema.index({ student: 1, academicSession: 1 });
attendanceSchema.index({ subject: 1, date: 1 });
attendanceSchema.index({ markedBy: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);