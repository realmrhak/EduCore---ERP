const express = require('express');
const { body } = require('express-validator');
const Exam = require('../models/Exam');
const AcademicSession = require('../models/AcademicSession');
const { auth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { validateObjectId } = require('../middleware/validate.middleware');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { department, semester, status, examType, page = 1, limit = 20 } = req.query;
    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (status) query.status = status;
    if (examType) query.examType = examType;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const [exams, total] = await Promise.all([
      Exam.find(query)
        .populate('department', 'name code')
        .populate('subject', 'name code')
        .populate('createdBy', 'name')
        .sort({ examDate: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Exam.countDocuments(query),
    ]);

    res.json({ success: true, data: exams, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.post('/', auth, requireAdmin, validate([
  body('title').trim().notEmpty().isLength({ max: 200 }),
  body('subject').notEmpty(),
  body('department').notEmpty(),
  body('semester').isInt({ min: 1 }),
  body('examDate').isISO8601(),
  body('totalMarks').isInt({ min: 1 }),
  body('examType').isIn(['Midterm', 'Final', 'Quiz', 'Assignment', 'Practical']),
]), async (req, res) => {
  try {
    if (!req.body.academicSession) {
      const activeSession = await AcademicSession.findOne({ isActive: true });
      if (activeSession) req.body.academicSession = activeSession._id;
    }
    const exam = new Exam({ ...req.body, createdBy: req.user._id });
    await exam.save();
    const populated = await Exam.findById(exam._id)
      .populate('department', 'name code')
      .populate('subject', 'name code')
      .populate('createdBy', 'name')
      .lean();
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.put('/:id', auth, requireAdmin, validateObjectId('id'), validate([
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('subject').optional().notEmpty(),
  body('department').optional().notEmpty(),
  body('semester').optional().isInt({ min: 1 }),
  body('examDate').optional().isISO8601(),
  body('totalMarks').optional().isInt({ min: 1 }),
  body('examType').optional().isIn(['Midterm', 'Final', 'Quiz', 'Assignment', 'Practical']),
  body('status').optional().isIn(['Scheduled', 'InProgress', 'Completed', 'Cancelled']),
]), async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' })
      .populate('department', 'name code')
      .populate('subject', 'name code')
      .populate('createdBy', 'name')
      .lean();
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.delete('/:id', auth, requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, message: 'Exam deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

module.exports = router;
