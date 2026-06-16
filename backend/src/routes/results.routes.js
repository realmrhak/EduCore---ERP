const express = require('express');
const { body } = require('express-validator');
const Result = require('../models/Result');
const Subject = require('../models/Subject');
const { auth } = require('../middleware/auth.middleware');
const { requireAdmin, requireSuperAdmin } = require('../middleware/role.middleware');
const { validateObjectId } = require('../middleware/validate.middleware');
const upload = require('../middleware/upload.middleware');
const { uploadToCloudinaryMiddleware } = require('../middleware/upload.middleware');
const router = express.Router();

router.get('/pending', auth, requireSuperAdmin, async (req, res) => {
  try {
    const results = await Result.find({ status: 'Pending' })
      .populate('student', 'name registrationNumber')
      .populate('subject', 'name code')
      .populate('uploadedBy', 'name')
      .lean();
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.get('/student/:id', auth, validateObjectId('id'), async (req, res) => {
  try {
    if (req.user.role === 'student' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const results = await Result.find({ student: req.params.id, status: 'Approved' })
      .populate('subject', 'name code')
      .populate('department', 'name code')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { student, subject, examType, status, department, semester, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user.role === 'student') {
      query.student = req.user._id;
      // Allow students to see their own Pending results (for notification purposes)
      if (status) query.status = status;
      // Otherwise no status filter — return both Approved and Pending
    } else if (['admin', 'superadmin', 'teacher'].includes(req.user.role)) {
      if (student) query.student = student;
      if (status) query.status = status;
    } else {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (subject) query.subject = subject;
    if (examType) query.examType = examType;
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const [results, total] = await Promise.all([
      Result.find(query)
        .populate('student', 'name registrationNumber')
        .populate('subject', 'name code')
        .populate('department', 'name code')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Result.countDocuments(query),
    ]);

    res.json({ success: true, data: results, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// Get a single result by ID — used by students to view/download specific PDF
router.get('/:id', auth, validateObjectId('id'), async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('student', 'name registrationNumber')
      .populate('subject', 'name code')
      .populate('department', 'name code')
      .lean();

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    // Students can only access their own results
    if (req.user.role === 'student' && result.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.post('/', auth, requireAdmin, upload.single('pdfFile'), uploadToCloudinaryMiddleware('results'), async (req, res) => {
  try {
    const { results } = req.body;
    let parsedResults = results;

    if (typeof results === 'string') {
      try {
        parsedResults = JSON.parse(results);
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid results format' });
      }
    }

    if (!Array.isArray(parsedResults) || parsedResults.length === 0) {
      return res.status(400).json({ success: false, message: 'Results array is required' });
    }

    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      const subjectId = parsedResults[0]?.subject;
      if (subjectId) {
        const subject = await Subject.findById(subjectId);
        if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
        if (subject.assignedTeacher && subject.assignedTeacher.toString() !== req.user._id.toString()) {
          return res.status(403).json({ success: false, message: `You are not assigned to teach ${subject.name}.` });
        }
      }
    }

    const pdfUrl = req.cloudinaryResult ? req.cloudinaryResult.url : (req.file ? `/uploads/${req.file.filename}` : '');

    // Auto-approve if uploaded by superadmin; otherwise keep Pending for approval workflow
    const autoStatus = req.user.role === 'superadmin' ? 'Approved' : 'Pending';
    const approvedBy = req.user.role === 'superadmin' ? req.user._id : null;

    const resultDocs = parsedResults.map((r) => ({
      ...r, uploadedBy: req.user._id, status: autoStatus, approvedBy, pdfUrl: pdfUrl || r.pdfUrl || '',
    }));
    const created = await Result.insertMany(resultDocs);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// Delete a result — superadmin only. Removes from DB + Cloudinary/local file so student can no longer see it.
router.delete('/:id', auth, requireSuperAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

    // Delete PDF from Cloudinary if it was uploaded there
    if (result.pdfUrl && result.pdfUrl.includes('cloudinary')) {
      try {
        // Extract public_id from Cloudinary URL: educore/results/xxxxx
        const urlParts = result.pdfUrl.split('/');
        const uploadIdx = urlParts.indexOf('upload');
        if (uploadIdx !== -1) {
          // After /upload/ there may be v1234567890/ then folder/file
          let publicIdParts = urlParts.slice(uploadIdx + 2); // skip 'upload' and version
          // Remove file extension for public_id
          const lastPart = publicIdParts[publicIdParts.length - 1];
          publicIdParts[publicIdParts.length - 1] = lastPart.replace(/\.[^.]+$/, '');
          const publicId = publicIdParts.join('/');
          const { deleteFromCloudinary } = require('../middleware/upload.middleware');
          await deleteFromCloudinary(publicId);
        }
      } catch (cloudErr) {
        console.error('Failed to delete Cloudinary file:', cloudErr.message);
        // Continue — still delete the DB record even if Cloudinary delete fails
      }
    } else if (result.pdfUrl && result.pdfUrl.startsWith('/uploads/')) {
      // Delete local file
      const fs = require('fs');
      const path = require('path');
      const localPath = path.join(__dirname, '../../uploads', path.basename(result.pdfUrl));
      fs.unlink(localPath, () => {}); // fire-and-forget
    }

    await Result.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Result deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.put('/:id/approve', auth, requireSuperAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const result = await Result.findByIdAndUpdate(
      req.params.id, { status: 'Approved', approvedBy: req.user._id }, { returnDocument: 'after' }
    ).lean();
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.put('/:id/reject', auth, requireSuperAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const result = await Result.findByIdAndUpdate(req.params.id, { status: 'Rejected' }, { returnDocument: 'after' }).lean();
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

module.exports = router;
