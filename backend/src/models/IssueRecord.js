const mongoose = require('mongoose');

const issueRecordSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date },
  status: { type: String, enum: ['Issued', 'Returned', 'Overdue', 'Reserved'], default: 'Issued' },
  fineAmount: { type: Number, default: 0 },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  returnedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

issueRecordSchema.index({ book: 1, student: 1, status: 1 });
issueRecordSchema.index({ student: 1, status: 1 });
issueRecordSchema.index({ status: 1, dueDate: 1 });
issueRecordSchema.index({ issueDate: -1 });
issueRecordSchema.index({ book: 1, status: 1 });

module.exports = mongoose.model('IssueRecord', issueRecordSchema);
