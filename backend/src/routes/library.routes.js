const express = require('express');
const { body, param } = require('express-validator');
const { Book, IssueRecord } = require('../models');
const { auth } = require('../middleware/auth.middleware');
const { requireAdmin, requireLibrarian, requireStudent } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { validateObjectId } = require('../middleware/validate.middleware');
const router = express.Router();

// GET /api/library/books - List books with search
router.get('/books', auth, async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const query = { isDeleted: false };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.category = category;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const [books, total] = await Promise.all([
      Book.find(query).sort({ title: 1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      Book.countDocuments(query),
    ]);

    res.json({ success: true, data: books, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// POST /api/library/books - Add book (admin/librarian only)
router.post('/books', auth, requireLibrarian, validate([
  body('title').trim().notEmpty().isLength({ max: 200 }),
  body('author').trim().notEmpty().isLength({ max: 100 }),
  body('isbn').optional().trim(),
  body('totalCopies').isInt({ min: 1 }),
  body('category').optional().trim(),
  body('shelfLocation').optional().trim(),
  body('finePerDay').optional().isFloat({ min: 0 }),
  body('edition').optional().trim(),
]), async (req, res) => {
  try {
    const book = new Book(req.body);
    if (book.availableCopies === undefined || book.availableCopies === null) {
      book.availableCopies = book.totalCopies || 1;
    }
    await book.save();
    res.status(201).json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// PUT /api/library/books/:id - Update book (admin/librarian only)
router.put('/books/:id', auth, requireLibrarian, validateObjectId('id'), validate([
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('author').optional().trim().notEmpty().isLength({ max: 100 }),
  body('isbn').optional().trim(),
  body('totalCopies').optional().isInt({ min: 1 }),
  body('category').optional().trim(),
  body('shelfLocation').optional().trim(),
  body('finePerDay').optional().isFloat({ min: 0 }),
  body('edition').optional().trim(),
]), async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// DELETE /api/library/books/:id - Soft delete book (admin/librarian only)
router.delete('/books/:id', auth, requireLibrarian, validateObjectId('id'), async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, { isDeleted: true, isActive: false }, { returnDocument: 'after' });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, message: 'Book removed from catalog' });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// GET /api/library/issues - List issue records (students see only their own)
router.get('/issues', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (req.user.role === 'student') query.student = req.user._id;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const [issues, total] = await Promise.all([
      IssueRecord.find(query)
        .populate('book', 'title author isbn')
        .populate('student', 'name registrationNumber')
        .sort({ issueDate: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      IssueRecord.countDocuments(query),
    ]);

    res.json({ success: true, data: issues, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// POST /api/library/issue - Issue a book (admin/librarian only)
router.post('/issue', auth, requireLibrarian, validate([
  body('bookId').notEmpty(),
  body('studentId').notEmpty(),
  body('dueDate').isISO8601(),
]), async (req, res) => {
  try {
    const { bookId, studentId, dueDate } = req.body;

    const book = await Book.findById(bookId);
    if (!book || book.isDeleted) return res.status(404).json({ success: false, message: 'Book not found' });
    if (book.availableCopies <= 0) return res.status(400).json({ success: false, message: 'No copies available' });

    const existingIssue = await IssueRecord.findOne({ book: bookId, student: studentId, status: 'Issued' });
    if (existingIssue) return res.status(400).json({ success: false, message: 'Student already has this book issued' });

    const issue = new IssueRecord({ book: bookId, student: studentId, dueDate, issuedBy: req.user._id });
    await issue.save();

    book.availableCopies -= 1;
    await book.save();

    const populated = await IssueRecord.findById(issue._id)
      .populate('book', 'title author')
      .populate('student', 'name registrationNumber')
      .lean();

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// POST /api/library/return/:id - Return a book (admin/librarian only)
router.post('/return/:id', auth, requireLibrarian, validateObjectId('id'), async (req, res) => {
  try {
    const issue = await IssueRecord.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue record not found' });
    if (issue.status === 'Returned') return res.status(400).json({ success: false, message: 'Book already returned' });

    const now = new Date();
    let fine = 0;
    if (now > issue.dueDate) {
      const book = await Book.findById(issue.book);
      const finePerDay = book?.finePerDay || 10;
      const overdueDays = Math.ceil((now - issue.dueDate) / (1000 * 60 * 60 * 24));
      fine = overdueDays * finePerDay;
    }

    issue.status = 'Returned';
    issue.returnDate = now;
    issue.fineAmount = fine;
    issue.returnedTo = req.user._id;
    await issue.save();

    await Book.findByIdAndUpdate(issue.book, { $inc: { availableCopies: 1 } });

    const populated = await IssueRecord.findById(issue._id)
      .populate('book', 'title author')
      .populate('student', 'name registrationNumber')
      .lean();

    res.json({ success: true, data: populated, fine });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// GET /api/library/overdue - Get overdue books (admin/librarian only)
router.get('/overdue', auth, requireLibrarian, async (req, res) => {
  try {
    const overdue = await IssueRecord.find({ status: 'Issued', dueDate: { $lt: new Date() } })
      .populate('book', 'title author isbn finePerDay')
      .populate('student', 'name registrationNumber email phone')
      .sort({ dueDate: 1 })
      .lean();
    res.json({ success: true, data: overdue });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// POST /api/library/reserve - Reserve a book (admin/librarian only)
router.post('/reserve', auth, requireLibrarian, validate([
  body('bookId').notEmpty(),
  body('studentId').notEmpty(),
]), async (req, res) => {
  try {
    const { bookId, studentId, dueDate } = req.body;
    const book = await Book.findById(bookId);
    if (!book || book.isDeleted) return res.status(404).json({ success: false, message: 'Book not found' });

    const existing = await IssueRecord.findOne({ book: bookId, student: studentId, status: { $in: ['Issued', 'Reserved'] } });
    if (existing) return res.status(400).json({ success: false, message: 'Student already has this book issued or reserved' });

    const reservation = new IssueRecord({
      book: bookId, student: studentId,
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'Reserved', issuedBy: req.user._id,
    });
    await reservation.save();

    const populated = await IssueRecord.findById(reservation._id)
      .populate('book', 'title author')
      .populate('student', 'name registrationNumber')
      .lean();

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// GET /api/library/stats - Library statistics (admin/librarian only)
router.get('/stats', auth, requireLibrarian, async (req, res) => {
  try {
    const [totalBooks, totalCopies, issuedCount, overdueCount, reservedCount, returnedCount, categoryStats] = await Promise.all([
      Book.countDocuments({ isDeleted: false }),
      Book.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, total: { $sum: '$totalCopies' }, available: { $sum: '$availableCopies' } } }]),
      IssueRecord.countDocuments({ status: 'Issued' }),
      IssueRecord.countDocuments({ status: 'Issued', dueDate: { $lt: new Date() } }),
      IssueRecord.countDocuments({ status: 'Reserved' }),
      IssueRecord.countDocuments({ status: 'Returned' }),
      Book.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$category', count: { $sum: 1 }, copies: { $sum: '$totalCopies' } } }, { $sort: { count: -1 } }]),
    ]);

    res.json({ success: true, data: { totalBooks, totalCopies: totalCopies[0]?.total || 0, availableCopies: totalCopies[0]?.available || 0, issuedCount, overdueCount, reservedCount, returnedCount, categoryStats } });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

module.exports = router;
