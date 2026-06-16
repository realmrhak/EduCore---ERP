const express = require('express');
const { body, validationResult } = require('express-validator');
const userController = require('../controllers/user.controller');
const { getStudents, promoteSemester, importStudentsCSV } = require('../controllers/student.controller');
const teacherController = require('../controllers/teacher.controller');
const { auth } = require('../middleware/auth.middleware');
const { requireSuperAdmin, requireAdmin, canAccessUser } = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

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

router.get('/', auth, requireSuperAdmin, userController.getAllUsers);
router.get('/teachers', auth, teacherController.getTeachers);
router.get('/students', auth, requireAdmin, getStudents);

router.post('/promote-semester', auth, requireSuperAdmin, validate([
  body('department').notEmpty(),
  body('fromSemester').isInt({ min: 1 }),
  body('toSemester').isInt({ min: 1 }),
]), promoteSemester);

router.get('/:id', auth, canAccessUser, userController.getUserById);

router.post('/', auth, requireSuperAdmin, validate([
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['student', 'admin', 'teacher']),
]), userController.createUser);

router.post('/import-csv', auth, requireSuperAdmin, upload.single('file'), importStudentsCSV);

router.put('/:id', auth, requireSuperAdmin, validate([
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['student', 'admin', 'teacher', 'librarian', 'accountant']),
  body('status').optional().isIn(['Active', 'Inactive', 'Suspended']),
  body('department').optional().trim(),
  body('semester').optional().isInt({ min: 1, max: 8 }),
  body('phone').optional().trim(),
  body('gender').optional().isIn(['Male', 'Female', 'Other']),
  body('fatherName').optional().trim(),
  body('motherName').optional().trim(),
  body('address').optional().trim(),
  body('emergencyContact').optional().trim(),
]), userController.updateUser);
router.delete('/:id', auth, requireSuperAdmin, userController.deleteUser);
router.post('/:id/promote', auth, requireSuperAdmin, userController.promoteToTeacher);

module.exports = router;