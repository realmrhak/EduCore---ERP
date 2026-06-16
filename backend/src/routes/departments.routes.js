const express = require('express');
const { body } = require('express-validator');
const Department = require('../models/Department');
const { auth } = require('../middleware/auth.middleware');
const { requireSuperAdmin } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { validateObjectId } = require('../middleware/validate.middleware');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 }).lean();
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.post('/', auth, requireSuperAdmin, validate([
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('code').trim().notEmpty().isLength({ max: 10 }),
  body('totalSemesters').optional().isInt({ min: 1, max: 16 }),
]), async (req, res) => {
  try {
    const dept = new Department(req.body);
    await dept.save();
    res.status(201).json({ success: true, data: dept });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.put('/:id', auth, requireSuperAdmin, validateObjectId('id'), validate([
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('code').optional().trim().notEmpty().isLength({ max: 10 }),
  body('totalSemesters').optional().isInt({ min: 1, max: 16 }),
  body('headOfDepartment').optional().trim(),
]), async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' }).lean();
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: dept });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.delete('/:id', auth, requireSuperAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

module.exports = router;
