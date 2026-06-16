const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  semester: { type: Number, required: true },
  creditHours: { type: Number, default: 3 },
  assignedTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

subjectSchema.index({ department: 1, semester: 1 });
subjectSchema.index({ code: 1 });
subjectSchema.index({ assignedTeacher: 1 });
subjectSchema.index({ status: 1 });
subjectSchema.index({ department: 1, semester: 1, status: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
