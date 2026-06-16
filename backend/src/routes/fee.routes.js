const express = require('express');
const { body } = require('express-validator');
const feeController = require('../controllers/fee.controller');
const { auth } = require('../middleware/auth.middleware');
const { requireSuperAdmin, requireAdmin, requireAccountant } = require('../middleware/role.middleware');
const { validateObjectId } = require('../middleware/validate.middleware');

const router = express.Router();

// Challans
router.get('/challans', auth, feeController.getChallans);
router.post('/challans', auth, requireAdmin, [
  body('student').notEmpty().withMessage('Student is required'),
  body('challanType').isIn(['Tuition', 'Lab', 'Library', 'Exam', 'Other', 'Comprehensive']),
  body('amount').isFloat({ min: 0 }),
  body('dueDate').isISO8601(),
], feeController.createChallan);
router.put('/challans/:id', auth, requireAdmin, validateObjectId('id'), [
  body('amount').optional().isFloat({ min: 0 }),
  body('dueDate').optional().isISO8601(),
  body('status').optional().isIn(['Paid', 'Unpaid', 'Partial', 'Overdue']),
], feeController.updateChallan);
router.delete('/challans/:id', auth, requireSuperAdmin, validateObjectId('id'), feeController.deleteChallan);

// Fee Structures
router.get('/structures/defaulters', auth, requireAdmin, feeController.getDefaulters);
router.get('/structures', auth, feeController.getFeeStructures);
router.post('/structures', auth, requireSuperAdmin, [
  body('name').trim().notEmpty(),
  body('department').notEmpty(),
  body('semester').isInt({ min: 1 }),
  body('academicSession').trim().notEmpty(),
  body('tuitionFee').isFloat({ min: 0 }),
], feeController.createFeeStructure);
router.put('/structures/:id', auth, requireSuperAdmin, validateObjectId('id'), [
  body('name').optional().trim().notEmpty(),
  body('department').optional().notEmpty(),
  body('semester').optional().isInt({ min: 1 }),
  body('academicSession').optional().trim().notEmpty(),
  body('tuitionFee').optional().isFloat({ min: 0 }),
  body('labFee').optional().isFloat({ min: 0 }),
  body('libraryFee').optional().isFloat({ min: 0 }),
  body('examFee').optional().isFloat({ min: 0 }),
  body('otherFee').optional().isFloat({ min: 0 }),
], feeController.updateFeeStructure);
router.delete('/structures/:id', auth, requireSuperAdmin, validateObjectId('id'), feeController.deleteFeeStructure);

module.exports = router;
