const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  semester: { type: Number, required: true },
  academicSession: { type: String, required: true },
  tuitionFee: { type: Number, default: 0 },
  labFee: { type: Number, default: 0 },
  libraryFee: { type: Number, default: 0 },
  examFee: { type: Number, default: 0 },
  otherFee: { type: Number, default: 0 },
  totalFee: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

feeStructureSchema.index({ department: 1, semester: 1 });
feeStructureSchema.index({ academicSession: 1 });
feeStructureSchema.index({ isDeleted: 1 });
feeStructureSchema.index({ isDeleted: 1, isActive: 1 });
feeStructureSchema.index({ department: 1, semester: 1, academicSession: 1 });

// Auto-calculate totalFee before saving
feeStructureSchema.pre('save', function (next) {
  this.totalFee = (this.tuitionFee || 0) + (this.labFee || 0) +
    (this.libraryFee || 0) + (this.examFee || 0) + (this.otherFee || 0);
  next();
});

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
