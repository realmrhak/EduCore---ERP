const Book = require('../models/Book');
const IssueRecord = require('../models/IssueRecord');
const User = require('../models/User');

const calculateFine = (dueDate, returnDate, finePerDay) => {
  const due = new Date(dueDate);
  const returned = returnDate ? new Date(returnDate) : new Date();
  const diffDays = Math.ceil((returned - due) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays * finePerDay : 0;
};

class LibraryService {
  async getBooks({ search, category, page = 1, limit = 20 }) {
    const query = { isDeleted: false };
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
    }
    const books = await Book.find(query)
      .sort({ title: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Book.countDocuments(query);
    return { books, total };
  }

  async createBook(data) {
    const totalCopies = data.totalCopies || 1;
    return Book.create({ ...data, availableCopies: totalCopies });
  }

  async updateBook(id, data) {
    const book = await Book.findByIdAndUpdate(id, data, { returnDocument: 'after' });
    if (!book) throw new Error('Book not found');
    return book;
  }

  async deleteBook(id) {
    const book = await Book.findByIdAndUpdate(id, { isDeleted: true, isActive: false }, { returnDocument: 'after' });
    if (!book) throw new Error('Book not found');
    return book;
  }

  async getIssues({ student, status, page = 1, limit = 20 }, user) {
    const query = {};
    if (status) query.status = status;
    if (user.role === 'student') {
      query.student = user._id;
    } else if (student) {
      query.student = student;
    }

    const issues = await IssueRecord.find(query)
      .populate('book', 'title author isbn finePerDay')
      .populate('student', 'name registrationNumber')
      .sort({ issueDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await IssueRecord.countDocuments(query);
    return { issues, total };
  }

  async issueBook({ bookId, studentId, dueDate }, librarianId) {
    const book = await Book.findById(bookId);
    if (!book || book.isDeleted) throw new Error('Book not found');
    if (book.availableCopies < 1) throw new Error('No copies available');

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      throw new Error('Invalid student');
    }

    const issue = await IssueRecord.create({
      book: book._id,
      student: student._id,
      dueDate,
      issuedBy: librarianId,
    });

    book.availableCopies -= 1;
    await book.save();

    return IssueRecord.findById(issue._id)
      .populate('book', 'title author isbn')
      .populate('student', 'name registrationNumber');
  }

  async returnBook(id, librarianId) {
    const issue = await IssueRecord.findById(id).populate('book');
    if (!issue) throw new Error('Issue record not found');
    if (issue.status === 'Returned') throw new Error('Already returned');

    const returnDate = new Date();
    const fineAmount = calculateFine(issue.dueDate, returnDate, issue.book.finePerDay);

    issue.returnDate = returnDate;
    issue.status = 'Returned';
    issue.fineAmount = fineAmount;
    issue.returnedTo = librarianId;
    await issue.save();

    await Book.findByIdAndUpdate(issue.book._id, { $inc: { availableCopies: 1 } });
    return { issue, fineAmount };
  }

  async getOverdueIssues() {
    return IssueRecord.find({
      status: 'Issued',
      dueDate: { $lt: new Date() },
    })
      .populate('book', 'title author finePerDay')
      .populate('student', 'name registrationNumber email');
  }
}

module.exports = new LibraryService();
