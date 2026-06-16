const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  semester: { type: Number, required: true },
  academicSession: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timeLimit: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  shuffleQuestions: { type: Boolean, default: false },
  status: { type: String, enum: ['Draft', 'Published', 'Closed'], default: 'Draft' },
  questions: [{
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
    marks: { type: Number, default: 1 }
  }],
  createdAt: { type: Date, default: Date.now }
});

quizSchema.index({ department: 1, semester: 1 });
quizSchema.index({ subject: 1 });
quizSchema.index({ status: 1 });
quizSchema.index({ academicSession: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ department: 1, semester: 1, status: 1 });

module.exports = mongoose.model('Quiz', quizSchema);