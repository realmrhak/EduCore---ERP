const express = require('express');
const { body } = require('express-validator');
const attendanceController = require('../controllers/attendance.controller');
const { auth } = require('../middleware/auth.middleware');
const { requireAdmin, requireSuperAdminOrTeacher } = require('../middleware/role.middleware');
const { validateObjectId } = require('../middleware/validate.middleware');

const router = express.Router();

router.get('/', auth, attendanceController.getAttendance);
router.post('/', auth, requireSuperAdminOrTeacher, [
  body('student').notEmpty().withMessage('Student ID is required'),
  body('subject').notEmpty().withMessage('Subject ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('status').isIn(['Present', 'Absent', 'Late', 'Excused']).withMessage('Invalid attendance status'),
], attendanceController.markAttendance);
router.put('/:id', auth, requireAdmin, validateObjectId('id'), [
  body('status').optional().isIn(['Present', 'Absent', 'Late', 'Excused']),
  body('date').optional().isISO8601(),
], attendanceController.updateRecord);
router.get('/student/:id', auth, validateObjectId('id'), attendanceController.getStudentRecords);
router.get('/stats/student/:id', auth, validateObjectId('id'), attendanceController.getStudentStats);
router.get('/report/monthly', auth, requireAdmin, attendanceController.getMonthlyReport);

module.exports = router;
