const { User, ActivityLog } = require('../models');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { generateRegistrationNumber, generateEmployeeId } = require('../utils/generateId');
const { validationResult } = require('express-validator');

class UserController {
  getAllUsers = catchAsync(async (req, res) => {
    const { role, department, status, search, page = 1, limit = 20 } = req.query;
    const query = { isDeleted: false };
    if (role) query.role = role;
    if (department) query.department = department;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(query)
      .populate('department', 'name code')
      .select('-password -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil -__v')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const count = await User.countDocuments(query);
    return sendSuccess(res, {
      users,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / parseInt(limit)),
    }, 'Users list fetched');
  });

  getUserById = catchAsync(async (req, res) => {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false })
      .populate('department', 'name code')
      .populate('assignedSubjects', 'name code')
      .select('-password -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil -__v');
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, user, 'User details fetched');
  });

  createUser = catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 'Validation error', 400, errors.array());

    const { name, fatherName, motherName, gender, cnic, phone, address, emergencyContact,
      email, password, role, department, semester, academicSession, status, salary } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return sendError(res, 'Email already exists', 400);

    let registrationNumber;
    let employeeId;
    if (role === 'student') {
      registrationNumber = await generateRegistrationNumber();
    } else if (role === 'teacher') {
      employeeId = await generateEmployeeId();
    }

    const user = new User({
      name, fatherName, motherName, gender, cnic, phone, address, emergencyContact,
      email, password, role, department, semester, academicSession, status,
      registrationNumber, employeeId, salary,
    });
    await user.save();

    await ActivityLog.create({
      action: 'User Created',
      user: req.user._id,
      userName: req.user.name,
      category: 'User Mgt',
      details: `Created ${role}: ${name}`,
    });

    const safeUser = await User.findById(user._id).populate('department', 'name code').select('-password');
    return sendSuccess(res, safeUser, 'User created successfully', 201);
  });

  updateUser = catchAsync(async (req, res) => {
    // Whitelist only allowed fields to prevent mass assignment
    const allowedFields = [
      'name', 'email', 'role', 'status', 'department', 'semester',
      'phone', 'gender', 'fatherName', 'motherName', 'address',
      'emergencyContact', 'cnic', 'academicSession', 'salary',
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after' })
      .populate('department', 'name code')
      .select('-password -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil -__v');
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, user, 'User updated successfully');
  });

  deleteUser = catchAsync(async (req, res) => {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, status: 'Suspended' },
      { returnDocument: 'after' }
    ).select('-password');
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, null, 'User deactivated successfully');
  });

  promoteToTeacher = catchAsync(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, { role: 'teacher' }, { returnDocument: 'after' }).select('-password');
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, user, 'User promoted to Teacher');
  });
}

module.exports = new UserController();