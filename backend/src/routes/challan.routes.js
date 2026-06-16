const express = require('express');
const { body } = require('express-validator');
const feeController = require('../controllers/fee.controller');
const { auth } = require('../middleware/auth.middleware');
const { requireSuperAdmin, requireAdmin } = require('../middleware/role.middleware');
const { validateObjectId } = require('../middleware/validate.middleware');
const upload = require('../middleware/upload.middleware');
const { uploadToCloudinaryMiddleware } = require('../middleware/upload.middleware');

const router = express.Router();

// Challans - proxied to fee controller
router.get('/', auth, feeController.getChallans);
router.post('/', auth, requireAdmin, [
  body('student').notEmpty().withMessage('Student is required'),
  body('challanType').isIn(['Tuition', 'Lab', 'Library', 'Exam', 'Other', 'Comprehensive']).withMessage('Invalid challan type'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('dueDate').isISO8601().withMessage('Invalid due date'),
], upload.single('pdfFile'), uploadToCloudinaryMiddleware('challans'), feeController.createChallan);
router.put('/:id', auth, requireAdmin, validateObjectId('id'), [
  body('amount').optional().isFloat({ min: 0 }),
  body('dueDate').optional().isISO8601(),
  body('status').optional().isIn(['Paid', 'Unpaid', 'Partial', 'Overdue']),
  body('challanType').optional().isIn(['Tuition', 'Lab', 'Library', 'Exam', 'Other', 'Comprehensive']),
], feeController.updateChallan);
router.delete('/:id', auth, requireSuperAdmin, validateObjectId('id'), feeController.deleteChallan);

module.exports = router;
