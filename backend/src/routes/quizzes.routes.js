const express = require('express');
const { body } = require('express-validator');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const AcademicSession = require('../models/AcademicSession');
const { auth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { validateObjectId } = require('../middleware/validate.middleware');
const router = express.Router();

const stripAnswers = (quiz) => {
  const obj = quiz.toObject ? quiz.toObject() : { ...quiz };
  if (obj.questions) {
    obj.questions = obj.questions.map((q) => {
      const { correctAnswer, ...rest } = q;
      return rest;
    });
  }
  return obj;
};

// Must be before /:id routes
router.get('/attempts/my', auth, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ student: req.user._id })
      .populate('quiz', 'title subject totalMarks')
      .sort({ attemptDate: -1 })
      .lean();
    res.json({ success: true, data: attempts });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { department, semester, status, createdBy, subject, page = 1, limit = 20 } = req.query;
    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (status) query.status = status;
    if (createdBy) query.createdBy = createdBy;
    if (subject) query.subject = subject;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    // Students can only see published quizzes for their department/semester
    if (req.user.role === 'student') {
      query.status = 'Published';
      query.department = req.user.department;
      query.semester = req.user.semester;
    }

    const [quizzes, total] = await Promise.all([
      Quiz.find(query)
        .populate('department', 'name code')
        .populate('subject', 'name code')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Quiz.countDocuments(query),
    ]);

    res.json({ success: true, data: quizzes, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.get('/:id', auth, validateObjectId('id'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('department', 'name code')
      .populate('subject', 'name code')
      .populate('createdBy', 'name')
      .lean();
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const isStaff = ['admin', 'superadmin', 'teacher'].includes(req.user.role);
    res.json({ success: true, data: isStaff ? quiz : stripAnswers(quiz) });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.post('/', auth, requireAdmin, validate([
  body('title').trim().notEmpty().isLength({ max: 200 }),
  body('subject').notEmpty(),
  body('department').notEmpty(),
  body('semester').isInt({ min: 1 }),
  body('totalMarks').isInt({ min: 1 }),
  body('timeLimit').optional().isInt({ min: 1 }),
  body('questions').isArray({ min: 1 }),
]), async (req, res) => {
  try {
    if (!req.body.academicSession) {
      const activeSession = await AcademicSession.findOne({ isActive: true });
      if (activeSession) req.body.academicSession = activeSession._id;
    }
    const quiz = new Quiz({ ...req.body, createdBy: req.user._id });
    await quiz.save();
    const populated = await Quiz.findById(quiz._id)
      .populate('department', 'name code')
      .populate('subject', 'name code')
      .populate('createdBy', 'name')
      .lean();
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.put('/:id', auth, requireAdmin, validateObjectId('id'), validate([
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('subject').optional().notEmpty(),
  body('department').optional().notEmpty(),
  body('semester').optional().isInt({ min: 1 }),
  body('totalMarks').optional().isInt({ min: 1 }),
  body('timeLimit').optional().isInt({ min: 1 }),
  body('status').optional().isIn(['Draft', 'Published', 'Closed']),
  body('questions').optional().isArray({ min: 1 }),
]), async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' })
      .populate('department', 'name code').populate('subject', 'name code').populate('createdBy', 'name').lean();
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    res.json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.delete('/:id', auth, requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    await QuizAttempt.deleteMany({ quiz: req.params.id });
    res.json({ success: true, message: 'Quiz deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.post('/:id/publish', auth, requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, { status: 'Published' }, { returnDocument: 'after' }).lean();
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    res.json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.post('/:id/attempt', auth, validateObjectId('id'), async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can attempt quizzes' });
    }

    const { answers, timeSpent } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: 'Answers are required' });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (quiz.status !== 'Published') {
      return res.status(400).json({ success: false, message: 'Quiz is not published' });
    }

    const existingAttempt = await QuizAttempt.findOne({ quiz: req.params.id, student: req.user._id });
    if (existingAttempt) {
      return res.status(400).json({ success: false, message: 'You have already attempted this quiz' });
    }

    if (quiz.timeLimit && timeSpent > quiz.timeLimit * 60) {
      return res.status(400).json({ success: false, message: 'Time limit exceeded' });
    }

    let marksObtained = 0;
    answers.forEach((ans) => {
      const question = quiz.questions[ans.questionIndex];
      if (question && ans.selectedOption === question.correctAnswer) {
        marksObtained += question.marks || 1;
      }
    });

    let academicSession = quiz.academicSession;
    if (!academicSession) {
      const activeSession = await AcademicSession.findOne({ isActive: true });
      if (activeSession) academicSession = activeSession._id;
    }

    const attempt = new QuizAttempt({
      quiz: req.params.id, student: req.user._id, answers, marksObtained,
      totalMarks: quiz.totalMarks, timeSpent: timeSpent || 0,
      academicSession: academicSession || undefined,
    });

    await attempt.save();

    res.json({
      success: true,
      data: {
        _id: attempt._id, quiz: attempt.quiz, student: attempt.student,
        marksObtained: attempt.marksObtained, totalMarks: attempt.totalMarks,
        timeSpent: attempt.timeSpent, attemptDate: attempt.attemptDate,
        answers: attempt.answers,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[QUIZ] Attempt error:', error.message);
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.get('/:id/attempts', auth, requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ quiz: req.params.id })
      .populate('student', 'name registrationNumber')
      .sort({ attemptDate: -1 })
      .lean();
    res.json({ success: true, data: attempts });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

module.exports = router;
