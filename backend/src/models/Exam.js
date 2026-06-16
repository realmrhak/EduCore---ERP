const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  examType: { type: String, enum: ['Mid-term', 'Final', 'Quiz', 'Assignment'], required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  semester: { type: Number, required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  examDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  room: { type: String, default: '' },
  totalMarks: { type: Number, default: 100 },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
  academicSession: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

examSchema.index({ department: 1, semester: 1, examDate: 1 });
examSchema.index({ subject: 1 });
examSchema.index({ status: 1 });
examSchema.index({ academicSession: 1 });
examSchema.index({ department: 1, semester: 1, status: 1 });

module.exports = mongoose.model('Exam', examSchema);
