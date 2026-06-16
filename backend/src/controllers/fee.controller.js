const feeService = require('../services/fee.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { validationResult } = require('express-validator');

class FeeController {
  // Challans
  getChallans = catchAsync(async (req, res) => {
    const challans = await feeService.getChallans(req.query, req.user);
    return sendSuccess(res, challans, 'Challans fetched successfully');
  });

  createChallan = catchAsync(async (req, res) => {
    // If a file was uploaded via Cloudinary, add the URL to the body
    if (req.cloudinaryResult) {
      req.body.pdfUrl = req.cloudinaryResult.url;
    } else if (req.file) {
      req.body.pdfUrl = `/uploads/${req.file.filename}`;
    }

    const challan = await feeService.createChallan(req.body, req.user._id);
    return sendSuccess(res, challan, 'Challan created successfully', 201);
  });

  updateChallan = catchAsync(async (req, res) => {
    const challan = await feeService.updateChallan(req.params.id, req.body);
    if (!challan) return sendError(res, 'Challan not found', 404);
    return sendSuccess(res, challan, 'Challan updated successfully');
  });

  deleteChallan = catchAsync(async (req, res) => {
    const challan = await feeService.deleteChallan(req.params.id);
    if (!challan) return sendError(res, 'Challan not found', 404);
    return sendSuccess(res, null, 'Challan deleted');
  });

  getDefaulters = catchAsync(async (req, res) => {
    const defaulters = await feeService.getDefaulters();
    return sendSuccess(res, defaulters, 'Defaulters fetched successfully');
  });

  // Fee Structures
  getFeeStructures = catchAsync(async (req, res) => {
    const structures = await feeService.getFeeStructures(req.query);
    return sendSuccess(res, structures, 'Fee structures list fetched');
  });

  createFeeStructure = catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 'Validation error', 400, errors.array());

    const structure = await feeService.createFeeStructure(req.body);
    return sendSuccess(res, structure, 'Fee structure created successfully', 201);
  });

  updateFeeStructure = catchAsync(async (req, res) => {
    const structure = await feeService.updateFeeStructure(req.params.id, req.body);
    if (!structure) return sendError(res, 'Fee structure not found', 404);
    return sendSuccess(res, structure, 'Fee structure updated successfully');
  });

  deleteFeeStructure = catchAsync(async (req, res) => {
    const structure = await feeService.deleteFeeStructure(req.params.id);
    if (!structure) return sendError(res, 'Fee structure not found', 404);
    return sendSuccess(res, null, 'Fee structure deactivated');
  });
}

module.exports = new FeeController();
