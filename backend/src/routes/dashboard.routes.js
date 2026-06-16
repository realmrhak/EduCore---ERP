const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { auth } = require('../middleware/auth.middleware');
const { requireAdmin, requireTeacher, requireStudent } = require('../middleware/role.middleware');

const router = express.Router();

router.get('/admin', auth, requireAdmin, dashboardController.adminStats);
router.get('/teacher', auth, requireTeacher, dashboardController.teacherStats);
router.get('/student', auth, requireStudent, dashboardController.studentStats);

module.exports = router;
