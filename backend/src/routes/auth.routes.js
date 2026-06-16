const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth.middleware');
const { authLimiter, forgotPasswordLimiter } = require('../middleware/rateLimiter.middleware');
const upload = require('../middleware/upload.middleware');
const { uploadToCloudinaryMiddleware } = require('../middleware/upload.middleware');

const router = express.Router();

router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').exists().isLength({ min: 6 }),
], authController.login);

router.post('/refresh-token', [
  body('refreshToken').notEmpty(),
], authController.refreshToken);

router.get('/me', auth, authController.getMe);

router.put('/profile', auth, [
  body('name').optional().trim().notEmpty(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
], authController.updateProfile);

// Profile image upload with Cloudinary
router.post('/profile/image', auth, upload.single('profileImage'), uploadToCloudinaryMiddleware('profiles'), authController.uploadProfileImage);

router.put('/change-password', auth, [
  body('currentPassword').exists(),
  body('newPassword').isLength({ min: 6 }),
], authController.changePassword);

router.post('/forgot-password', forgotPasswordLimiter, [
  body('email').isEmail().normalizeEmail(),
], authController.forgotPassword);

router.post('/reset-password', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
], authController.resetPassword);

module.exports = router;
