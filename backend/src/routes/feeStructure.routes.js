const express = require('express');
const { body } = require('express-validator');
const feeController = require('../controllers/fee.controller');
const { auth } = require('../middleware/auth.middleware');
const { requireSuperAdmin, requireAdmin } = require('../middleware/role.middleware');
const { validateObjectId } = require('../middleware/validate.middleware');

const router = express.Router();

// Fee Structures - proxied to fee controller
router.get('/defaulters', auth, requireAdmin, feeController.getDefaulters);
router.get('/', auth, feeController.getFeeStructures);
router.post('/', auth, requireSuperAdmin, [
  body('name').trim().notEmpty(),
  body('department').notEmpty(),
  body('semester').isInt({ min: 1 }),
  body('academicSession').trim().notEmpty(),
  body('tuitionFee').isFloat({ min: 0 }),
], feeController.createFeeStructure);
router.put('/:id', auth, requireSuperAdmin, validateObjectId('id'), [
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
router.delete('/:id', auth, requireSuperAdmin, validateObjectId('id'), feeController.deleteFeeStructure);

module.exports = router;
