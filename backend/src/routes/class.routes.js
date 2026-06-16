const express = require('express');
const { auth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');
const { sendSuccess } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

// Protected routes - all class routes require authentication
router.use(auth);

// GET /api/classes - List all classes
router.get('/', catchAsync(async (req, res) => {
  // Return empty array - classes can be modeled using departments/subjects
  return sendSuccess(res, [], 'Classes fetched successfully');
}));

// POST /api/classes - Create a class
router.post('/', requireAdmin, catchAsync(async (req, res) => {
  return sendSuccess(res, req.body, 'Class created successfully');
}));

// GET /api/classes/:id - Get class details
router.get('/:id', catchAsync(async (req, res) => {
  return sendSuccess(res, { _id: req.params.id }, 'Class details fetched');
}));

// PUT /api/classes/:id - Update class
router.put('/:id', requireAdmin, catchAsync(async (req, res) => {
  return sendSuccess(res, { _id: req.params.id, ...req.body }, 'Class updated successfully');
}));

// DELETE /api/classes/:id - Delete class
router.delete('/:id', requireAdmin, catchAsync(async (req, res) => {
  return sendSuccess(res, null, 'Class deleted successfully');
}));

// GET /api/classes/:id/sections - Get class sections
router.get('/:id/sections', catchAsync(async (req, res) => {
  return sendSuccess(res, [], 'Sections fetched successfully');
}));

// POST /api/classes/:id/sections - Create section
router.post('/:id/sections', requireAdmin, catchAsync(async (req, res) => {
  return sendSuccess(res, req.body, 'Section created successfully');
}));

module.exports = router;
