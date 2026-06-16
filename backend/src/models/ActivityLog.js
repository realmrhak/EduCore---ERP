const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, default: '' },
  category: { type: String, enum: ['Academic', 'Security', 'Finance', 'User Mgt', 'System'], required: true },
  details: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ category: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ action: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
