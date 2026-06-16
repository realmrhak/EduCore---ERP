const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, default: '' },
  category: { type: String, default: '' },
  totalCopies: { type: Number, default: 1 },
  availableCopies: { type: Number, default: 1 },
  finePerDay: { type: Number, default: 10 },
  shelfLocation: { type: String, default: '' },
  publisher: { type: String, default: '' },
  edition: { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

bookSchema.index({ isDeleted: 1 });
bookSchema.index({ category: 1 });
bookSchema.index({ title: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ isbn: 1 });
bookSchema.index({ isDeleted: 1, isActive: 1 });

module.exports = mongoose.model('Book', bookSchema);
