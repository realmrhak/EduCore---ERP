const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  semester: { type: Number, required: true },
  day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  room: { type: String, required: true },
  academicSession: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

timetableSchema.index({ department: 1, semester: 1, day: 1 });
timetableSchema.index({ teacher: 1, day: 1 });
timetableSchema.index({ academicSession: 1 });
timetableSchema.index({ department: 1, semester: 1, academicSession: 1, day: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
