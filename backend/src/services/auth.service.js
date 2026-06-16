const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, ActivityLog } = require('../models');
const { JWT_SECRET, JWT_EXPIRY, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRY } = require('../config/env');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 15;

const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  registrationNumber: user.registrationNumber,
  employeeId: user.employeeId,
  department: user.department,
  semester: user.semester,
  status: user.status,
  profileImage: user.profileImage,
  gender: user.gender,
  fatherName: user.fatherName,
  motherName: user.motherName,
  phone: user.phone,
  address: user.address,
  emergencyContact: user.emergencyContact,
  academicSession: user.academicSession,
});

class AuthService {
  async login({ email, password, ipAddress }) {
    const user = await User.findOne({ email, isDeleted: false }).populate('department', 'name code');
    if (!user) {
      // Don't reveal whether user exists
      throw new Error('Invalid credentials');
    }

    // Check account lockout
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockUntil = user.lockUntil || 0;
      if (Date.now() - lockUntil < LOCK_TIME_MINUTES * 60 * 1000) {
        throw new Error('Account is temporarily locked due to too many failed login attempts. Try again later.');
      }
      // Lock expired, reset attempts
      user.loginAttempts = 0;
      user.lockUntil = undefined;
    }

    if (user.status !== 'Active') {
      throw new Error('Account is inactive or suspended');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment failed login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = Date.now();
      }
      await user.save();
      throw new Error('Invalid credentials');
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Generate access token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY, algorithm: 'HS256' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user._id, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRY, algorithm: 'HS256' }
    );

    await ActivityLog.create({
      action: 'User Login',
      user: user._id,
      userName: user.name,
      category: 'Security',
      details: `${user.role} logged in`,
      ipAddress,
    });

    return { token, refreshToken, user: buildUserResponse(user) };
  }

  async refreshToken(oldRefreshToken) {
    const decoded = jwt.verify(oldRefreshToken, JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }
    const user = await User.findById(decoded.id);
    if (!user || user.status !== 'Active') {
      throw new Error('Invalid refresh token');
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY, algorithm: 'HS256' }
    );

    const refreshToken = jwt.sign(
      { id: user._id, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRY, algorithm: 'HS256' }
    );

    return { token, refreshToken };
  }

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new Error('Current password is incorrect');

    user.password = newPassword;
    await user.save();
    return { success: true };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email, isDeleted: false });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.passwordResetExpires = Date.now() + 3600000;
      await user.save();

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] Password reset token for ${user.email}: ${resetToken}`);
      }
      return { success: true, resetToken };
    }
    return { success: true };
  }

  async resetPassword({ token, newPassword }) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) throw new Error('Invalid or expired reset token');

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    return { success: true };
  }
}

module.exports = new AuthService();
module.exports.buildUserResponsePublic = buildUserResponse;
