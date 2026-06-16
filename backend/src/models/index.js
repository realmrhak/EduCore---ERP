const AcademicSession = require('./AcademicSession');
const ActivityLog = require('./ActivityLog');
const Attendance = require('./Attendance');
const Book = require('./Book');
const Challan = require('./Challan');
const Department = require('./Department');
const Exam = require('./Exam');
const FeeStructure = require('./FeeStructure');
const IssueRecord = require('./IssueRecord');
const Notification = require('./Notification');
const Quiz = require('./Quiz');
const QuizAttempt = require('./QuizAttempt');
const Result = require('./Result');
const Settings = require('./Settings');
const Subject = require('./Subject');
const Timetable = require('./Timetable');
const User = require('./User');

module.exports = {
  AcademicSession,
  ActivityLog,
  Attendance,
  Book,
  Challan,
  Fee: Challan, // Alias for fee management compatibility
  FeeStructure,
  Department,
  Exam,
  IssueRecord,
  Notification,
  Quiz,
  QuizAttempt,
  Result,
  Mark: Result, // Alias for marks management compatibility
  Settings,
  Subject,
  Timetable,
  User,
};