const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  totalSemesters: { type: Number, default: 8 },
  createdAt: { type: Date, default: Date.now }
});

// Department is a small lookup collection; unique indexes on name/code suffice.
// No additional indexes needed.

module.exports = mongoose.model('Department', departmentSchema);
