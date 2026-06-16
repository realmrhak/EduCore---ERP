const { User } = require('../models');

const generateRegistrationNumber = async () => {
  const year = new Date().getFullYear();
  const count = await User.countDocuments({ role: 'student', createdAt: { $gte: new Date(year, 0, 1) } });
  return `${year}-ESTUDY-${String(73200 + count).padStart(6, '0')}`;
};

const generateEmployeeId = async () => {
  const count = await User.countDocuments({ role: { $in: ['admin', 'teacher', 'accountant', 'librarian'] } });
  return `EMP-${String(1000 + count).padStart(5, '0')}`;
};

module.exports = { generateRegistrationNumber, generateEmployeeId };
