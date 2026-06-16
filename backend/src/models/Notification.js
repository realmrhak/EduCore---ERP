const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  category: { type: String, enum: ['Academic', 'System', 'Finance', 'Message'], default: 'System' },
  isRead: { type: Boolean, default: false },
  relatedEntity: { type: mongoose.Schema.Types.ObjectId },
  relatedType: { type: String, default: '' },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ category: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
