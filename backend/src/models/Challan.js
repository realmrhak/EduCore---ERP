const mongoose = require('mongoose');

const challanSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  challanType: { type: String, enum: ['Admission', 'Mid-Semester', 'Final-Semester'], required: true },
  amount: { type: Number, required: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['Generated', 'Pending', 'Paid', 'Error'], default: 'Generated' },
  pdfUrl: { type: String, default: '' },
  semester: { type: Number },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  academicSession: { type: String, default: '2025-2026' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

challanSchema.index({ student: 1, status: 1 });
challanSchema.index({ department: 1, semester: 1 });
challanSchema.index({ status: 1 });
challanSchema.index({ dueDate: 1 });
challanSchema.index({ academicSession: 1 });
challanSchema.index({ student: 1, academicSession: 1 });

module.exports = mongoose.model('Challan', challanSchema);
