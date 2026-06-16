const mongoose = require('mongoose');

const academicSessionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  startDate: { type: Date },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
  isFrozen: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

academicSessionSchema.index({ isActive: 1 });
academicSessionSchema.index({ isFrozen: 1 });
academicSessionSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('AcademicSession', academicSessionSchema);
