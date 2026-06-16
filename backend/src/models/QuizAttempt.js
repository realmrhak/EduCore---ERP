const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  academicSession: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', required: false },
  answers: [{ questionIndex: Number, selectedOption: Number }],
  marksObtained: { type: Number, default: 0 },
  totalMarks: { type: Number, required: true },
  timeSpent: { type: Number, default: 0 },
  attemptDate: { type: Date, default: Date.now }
});

quizAttemptSchema.index({ quiz: 1, student: 1 });
quizAttemptSchema.index({ student: 1 });
quizAttemptSchema.index({ quiz: 1 });
quizAttemptSchema.index({ academicSession: 1 });
quizAttemptSchema.index({ attemptDate: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
