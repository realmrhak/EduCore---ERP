const express = require('express');
const Settings = require('../models/Settings');
const { auth } = require('../middleware/auth.middleware');
const { requireSuperAdmin } = require('../middleware/role.middleware');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let settings = await Settings.findOne().lean();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.put('/', auth, requireSuperAdmin, async (req, res) => {
  try {
    // Whitelist allowed fields
    const allowedFields = [
      'schoolName', 'schoolAddress', 'schoolPhone', 'schoolEmail',
      'academicYear', 'currency', 'logo', 'gradingScale',
    ];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(updates);
    } else {
      Object.assign(settings, updates);
      await settings.save();
    }
    res.json({ success: true, data: settings, message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

module.exports = router;
