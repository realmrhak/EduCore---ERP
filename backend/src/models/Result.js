const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  semester: { type: Number, required: true },
  academicSession: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', required: true },

  examType: { type: String, enum: ['Mid-Term', 'Final-Term', 'Quiz', 'Assignment', 'Lab'], required: true },
  marksObtained: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  grade: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks: { type: String, default: '' },
  pdfUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

resultSchema.index({ student: 1, status: 1 });
resultSchema.index({ department: 1, semester: 1 });
resultSchema.index({ subject: 1 });
resultSchema.index({ status: 1 });
resultSchema.index({ createdAt: -1 });
resultSchema.index({ student: 1, academicSession: 1 });
resultSchema.index({ academicSession: 1 });
resultSchema.index({ department: 1, semester: 1, academicSession: 1 });
resultSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('Result', resultSchema);