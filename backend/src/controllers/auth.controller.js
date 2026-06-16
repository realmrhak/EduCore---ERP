const authService = require('../services/auth.service');
const { User } = require('../models');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { validationResult } = require('express-validator');
const { deleteFromCloudinary } = require('../middleware/upload.middleware');

class AuthController {
  login = catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation error', 400, errors.array());
    }

    const { email, password } = req.body;
    const ipAddress = req.ip;

    try {
      const result = await authService.login({ email, password, ipAddress });
      return sendSuccess(res, result, 'Login successful');
    } catch (error) {
      return sendError(res, error.message, 401);
    }
  });

  refreshToken = catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation error', 400, errors.array());
    }

    try {
      const result = await authService.refreshToken(req.body.refreshToken);
      return sendSuccess(res, result, 'Token refreshed');
    } catch (error) {
      return sendError(res, 'Invalid refresh token', 401);
    }
  });

  getMe = catchAsync(async (req, res) => {
    const { buildUserResponsePublic } = require('../services/auth.service');
    const userData = buildUserResponsePublic(req.user);
    return sendSuccess(res, userData, 'Current user fetched');
  });

  updateProfile = catchAsync(async (req, res) => {
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Students cannot modify their profile. Contact administration.'
      });
    }

    const allowed = ['name', 'phone', 'address', 'emergencyContact', 'profileImage', 'fatherName', 'motherName'];
    const updates = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { returnDocument: 'after' })
      .populate('department', 'name code')
      .select('-password -passwordResetToken -passwordResetExpires -__v -loginAttempts -lockUntil');

    const { buildUserResponsePublic } = require('../services/auth.service');
    return sendSuccess(res, buildUserResponsePublic(user), 'Profile updated');
  });

  uploadProfileImage = catchAsync(async (req, res) => {
    if (!req.file && !req.cloudinaryResult) {
      return sendError(res, 'No image file provided', 400);
    }

    const imageUrl = req.cloudinaryResult
      ? req.cloudinaryResult.url
      : `/uploads/${req.file.filename}`;

    if (req.user.profileImage && req.user.profileImage.includes('cloudinary')) {
      const matches = req.user.profileImage.match(/upload\/(?:v\d+\/)?(.+)\.\w+$/);
      if (matches && matches[1]) {
        await deleteFromCloudinary(matches[1]);
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: imageUrl },
      { returnDocument: 'after' }
    ).populate('department', 'name code').select('-password -passwordResetToken -passwordResetExpires -__v -loginAttempts -lockUntil');

    const { buildUserResponsePublic } = require('../services/auth.service');
    return sendSuccess(res, buildUserResponsePublic(user), 'Profile image uploaded successfully');
  });

  changePassword = catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation error', 400, errors.array());
    }

    const { currentPassword, newPassword } = req.body;
    try {
      await authService.changePassword(req.user._id, { currentPassword, newPassword });
      return sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  });

  forgotPassword = catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation error', 400, errors.array());
    }

    await authService.forgotPassword(req.body.email);
    return sendSuccess(res, null, 'If an account exists with that email, a reset link has been sent.');
  });

  resetPassword = catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation error', 400, errors.array());
    }

    const { token, newPassword } = req.body;
    try {
      await authService.resetPassword({ token, newPassword });
      return sendSuccess(res, null, 'Password reset successfully');
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  });
}

module.exports = new AuthController();
