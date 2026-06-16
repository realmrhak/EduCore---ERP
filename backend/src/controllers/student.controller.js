const csv = require('csv-parser');
const fs = require('fs');
const { User } = require('../models');
const studentService = require('../services/student.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { validationResult } = require('express-validator');
const { generateRegistrationNumber } = require('../utils/generateId');

const getStudents = catchAsync(async (req, res) => {
  const { department, semester, status, search, page = 1, limit = 20 } = req.query;
  const { students, count } = await studentService.getAllStudents({
    department,
    semester,
    status,
    search,
    page,
    limit,
  });
  return sendSuccess(res, {
    students,
    total: count,
    page: parseInt(page),
    pages: Math.ceil(count / parseInt(limit)),
  }, 'Students list fetched');
});

const promoteSemester = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, 'Validation error', 400, errors.array());

  const { department, fromSemester, toSemester } = req.body;
  const count = await studentService.promoteSemesters({ department, fromSemester, toSemester });
  return sendSuccess(res, null, `${count} students promoted to semester ${toSemester}`);
});

const importStudentsCSV = catchAsync(async (req, res) => {
  if (!req.file) {
    return sendError(res, 'CSV file is required', 400);
  }

  const results = [];
  const errors = [];
  let rowCount = 0;
  const rows = [];

  // First pass: parse all rows synchronously
  await new Promise((resolve, reject) => {
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Second pass: process rows sequentially to avoid race conditions
  for (const row of rows) {
    rowCount++;
    try {
      if (!row.name || !row.email || !row.department) {
        errors.push({ row: rowCount, error: 'Missing required fields (name, email, department)' });
        continue;
      }

      const existingUser = await User.findOne({ email: row.email.toLowerCase() });
      if (existingUser) {
        errors.push({ row: rowCount, error: `Email ${row.email} already exists` });
        continue;
      }

      const registrationNumber = await generateRegistrationNumber();

      const student = new User({
        name: row.name.trim(),
        email: row.email.toLowerCase().trim(),
        password: row.password || 'student123',
        role: 'student',
        department: row.department,
        semester: parseInt(row.semester) || 1,
        fatherName: row.fatherName || '',
        motherName: row.motherName || '',
        gender: row.gender || 'Male',
        phone: row.phone || '',
        address: row.address || '',
        registrationNumber,
        status: 'Active',
      });

      await student.save();
      results.push({ row: rowCount, student: student._id, name: student.name });
    } catch (err) {
      errors.push({ row: rowCount, error: err.message });
    }
  }

  // Clean up temp file
  fs.unlink(req.file.path, (err) => {
    if (err) console.error('Error deleting temp file:', err);
  });

  return sendSuccess(res, {
    imported: results.length,
    failed: errors.length,
    errors: errors.length > 0 ? errors : undefined,
  }, `${results.length} students imported successfully`);
});

module.exports = {
  getStudents,
  promoteSemester,
  importStudentsCSV,
};