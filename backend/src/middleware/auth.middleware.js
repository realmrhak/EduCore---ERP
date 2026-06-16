const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWT_SECRET, JWT_REFRESH_SECRET } = require('../config/env');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token, authorization denied' });
    }

    // Enforce HS256 algorithm to prevent algorithm confusion attacks
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

    const user = await User.findById(decoded.id)
      .select('-password -passwordResetToken -passwordResetExpires -__v')
      .populate('department', 'name code');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Token is not valid' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active. Contact administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

// Refresh token verification
const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
};

module.exports = { auth, verifyRefreshToken };
