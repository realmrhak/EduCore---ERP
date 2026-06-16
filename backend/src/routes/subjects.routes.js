const express = require('express');
const { body } = require('express-validator');
const Subject = require('../models/Subject');
const { auth } = require('../middleware/auth.middleware');
const { requireSuperAdmin } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { validateObjectId } = require('../middleware/validate.middleware');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { department, semester, page = 1, limit = 20 } = req.query;
    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const [subjects, total] = await Promise.all([
      Subject.find(query)
        .populate('department', 'name code')
        .populate('assignedTeacher', 'name')
        .sort({ code: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Subject.countDocuments(query),
    ]);

    res.json({ success: true, data: subjects, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.post('/', auth, requireSuperAdmin, validate([
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('code').trim().notEmpty().isLength({ max: 20 }),
  body('department').notEmpty(),
  body('semester').isInt({ min: 1, max: 12 }),
  body('creditHours').optional().isInt({ min: 1, max: 10 }),
]), async (req, res) => {
  try {
    const subject = new Subject(req.body);
    await subject.save();
    const populated = await Subject.findById(subject._id).populate('department', 'name code').populate('assignedTeacher', 'name').lean();
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.put('/:id', auth, requireSuperAdmin, validateObjectId('id'), validate([
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('code').optional().trim().notEmpty().isLength({ max: 20 }),
  body('department').optional().notEmpty(),
  body('semester').optional().isInt({ min: 1, max: 12 }),
  body('creditHours').optional().isInt({ min: 1, max: 10 }),
  body('assignedTeacher').optional().trim(),
]), async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' })
      .populate('department', 'name code').populate('assignedTeacher', 'name').lean();
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.delete('/:id', auth, requireSuperAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, message: 'Subject deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.post('/:id/assign-teacher', auth, requireSuperAdmin, validateObjectId('id'), validate([
  body('teacherId').notEmpty(),
]), async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, { assignedTeacher: req.body.teacherId }, { returnDocument: 'after' })
      .populate('department', 'name code').populate('assignedTeacher', 'name').lean();
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

module.exports = router;
