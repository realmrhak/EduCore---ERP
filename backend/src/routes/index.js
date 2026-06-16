const express = require('express');

const router = express.Router();

router.use('/academic-sessions', require('./academicSessions.routes'));
router.use('/activity-logs', require('./activityLogs.routes'));
router.use('/attendance', require('./attendance.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/challans', require('./challan.routes'));
router.use('/classes', require('./class.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/departments', require('./departments.routes'));
router.use('/exams', require('./exam.routes'));
router.use('/fee-structures', require('./feeStructure.routes'));
router.use('/fees', require('./fee.routes'));
router.use('/library', require('./library.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/quizzes', require('./quizzes.routes'));
router.use('/reports', require('./reports.routes'));
router.use('/results', require('./results.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/subjects', require('./subjects.routes'));
router.use('/timetables', require('./timetables.routes'));
router.use('/users', require('./user.routes'));

module.exports = router;
