const { validationResult, param } = require('express-validator');
const mongoose = require('mongoose');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(v => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
    }
    next();
  };
};

// Validate MongoDB ObjectId in route params
const validateObjectId = (paramName = 'id') => {
  return param(paramName).custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error(`Invalid ${paramName} format`);
    }
    return true;
  });
};

module.exports = validate;
module.exports.validateObjectId = validateObjectId;
