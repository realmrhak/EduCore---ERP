const express = require('express');
const { body } = require('express-validator');
const Timetable = require('../models/Timetable');
const { auth } = require('../middleware/auth.middleware');
const { requireSuperAdmin } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { validateObjectId } = require('../middleware/validate.middleware');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { department, semester } = req.query;
    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    const entries = await Timetable.find(query)
      .populate('subject', 'name code')
      .populate('teacher', 'name')
      .populate('department', 'name code')
      .sort({ day: 1, startTime: 1 })
      .lean();
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.post('/', auth, requireSuperAdmin, validate([
  body('subject').notEmpty(),
  body('teacher').notEmpty(),
  body('department').notEmpty(),
  body('day').isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  body('startTime').notEmpty(),
  body('endTime').notEmpty(),
]), async (req, res) => {
  try {
    const entry = new Timetable(req.body);
    await entry.save();
    const populated = await Timetable.findById(entry._id)
      .populate('subject', 'name code')
      .populate('teacher', 'name')
      .populate('department', 'name code')
      .lean();
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.put('/:id', auth, requireSuperAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const entry = await Timetable.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' })
      .populate('subject', 'name code').populate('teacher', 'name').populate('department', 'name code').lean();
    if (!entry) return res.status(404).json({ success: false, message: 'Timetable entry not found' });
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.delete('/:id', auth, requireSuperAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const entry = await Timetable.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Timetable entry not found' });
    res.json({ success: true, message: 'Timetable entry deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

module.exports = router;
