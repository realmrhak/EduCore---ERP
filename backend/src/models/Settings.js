const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  schoolName: { type: String, default: 'EduCore University' },
  schoolAddress: { type: String, default: '' },
  schoolPhone: { type: String, default: '' },
  schoolEmail: { type: String, default: '' },
  schoolLogo: { type: String, default: '' },
  academicYear: { type: String, default: '' },
  currency: { type: String, default: 'USD' },
  timezone: { type: String, default: 'UTC' },
}, { timestamps: true });

// Settings is a singleton collection; no meaningful indexes needed.

module.exports = mongoose.model('Settings', settingsSchema);
