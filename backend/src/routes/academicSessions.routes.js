const express = require('express');
const { body, validationResult } = require('express-validator');
const AcademicSession = require('../models/AcademicSession');
const { auth, requireSuperAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const sessions = await AcademicSession.find().sort({ startDate: -1 });
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/active', auth, async (req, res) => {
  try {
    const session = await AcademicSession.findOne({ isActive: true });
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', auth, requireSuperAdmin, [
  body('name').trim().notEmpty(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    if (req.body.isActive) {
      await AcademicSession.updateMany({}, { isActive: false });
    }

    const session = await AcademicSession.create(req.body);
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    if (req.body.isActive) {
      await AcademicSession.updateMany({ _id: { $ne: req.params.id } }, { isActive: false });
    }
    const session = await AcademicSession.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
