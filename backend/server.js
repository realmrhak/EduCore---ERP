const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env (only in development)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '.env') });
}

const app = require('./src/app');
const connectDB = require('./src/config/database');
const { User, Department, Subject, AcademicSession, Settings } = require('./src/models');
const logger = require('./src/utils/logger');

async function seedIfEmpty() {
  const forceReseed = process.env.FORCE_RESEED === 'true';
  const count = await User.countDocuments();

  if (count > 0 && !forceReseed) {
    logger.info(`Database already has ${count} users — skipping seed.`);
    logger.info('  ℹ️  Set FORCE_RESEED=true in .env to force a full database reset.');
    return;
  }

  if (forceReseed && count > 0) {
    logger.info(`FORCE_RESEED=true — clearing database (${count} users) and re-seeding...`);
  } else {
    logger.info('Database is empty — running auto-seed...');
  }

  // Clear all collections before seeding
  await User.deleteMany({});
  await Department.deleteMany({});
  await Subject.deleteMany({});
  await AcademicSession.deleteMany({});
  await Settings.deleteMany({});
  logger.info('Collections cleared.');

  const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@educore.edu';
  const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'admin123';

  const activeSession = await AcademicSession.create({
    name: '2025-2026',
    startDate: new Date('2025-09-01'),
    endDate: new Date('2026-06-30'),
    isActive: true,
  });

  const departments = await Department.insertMany([
    { name: 'Computer Science', code: 'CS', description: 'Computer Science and Engineering Department', totalSemesters: 8 },
    { name: 'Information Technology', code: 'IT', description: 'Information Technology Department', totalSemesters: 8 },
    { name: 'Business Administration', code: 'BBA', description: 'Business Administration Department', totalSemesters: 8 },
    { name: 'Mathematics', code: 'MATH', description: 'Mathematics Department', totalSemesters: 8 },
    { name: 'Physics', code: 'PHY', description: 'Physics Department', totalSemesters: 8 },
  ]);

  const csDept = departments[0];
  const itDept = departments[1];
  const bbaDept = departments[2];

  // Super Admin — password auto-hashed by pre-save hook
  await User.create({
    name: 'Dr. Julian Vance',
    email: SUPER_ADMIN_EMAIL,
    password: SUPER_ADMIN_PASSWORD,
    role: 'superadmin',
    gender: 'Male',
    phone: '+1 (555) 100-0001',
    cnic: '42101-1234567-1',
    status: 'Active',
  });

  // Teachers — use create() to trigger pre-save password hashing hook
  const teacherData = [
    { name: 'Prof. Sarah Jenkins', email: 's.jenkins@educore.edu', password: 'teacher123', role: 'teacher', gender: 'Female', phone: '+1 (555) 234-8901', cnic: '42101-2345678-2', department: csDept._id, employeeId: 'EMP-01001', salary: 75000, status: 'Active' },
    { name: 'Dr. Marcus Thorne', email: 'm.thorne@educore.edu', password: 'teacher123', role: 'teacher', gender: 'Male', phone: '+1 (555) 345-9012', cnic: '42101-3456789-3', department: csDept._id, employeeId: 'EMP-01002', salary: 80000, status: 'Active' },
    { name: 'Prof. David Chen', email: 'd.chen@educore.edu', password: 'teacher123', role: 'teacher', gender: 'Male', phone: '+1 (555) 456-7890', cnic: '42101-4567890-4', department: itDept._id, employeeId: 'EMP-01003', salary: 72000, status: 'Active' },
    { name: 'Dr. Elena Rodriguez', email: 'e.rodriguez@educore.edu', password: 'teacher123', role: 'teacher', gender: 'Female', phone: '+1 (555) 567-8901', cnic: '42101-5678901-5', department: departments[3]._id, employeeId: 'EMP-01004', salary: 78000, status: 'Active' },
    { name: 'Prof. James Wilson', email: 'j.wilson@educore.edu', password: 'teacher123', role: 'teacher', gender: 'Male', phone: '+1 (555) 678-9012', cnic: '42101-6789012-6', department: csDept._id, employeeId: 'EMP-01005', salary: 76000, status: 'Active' },
    { name: 'Dr. Aisha Khan', email: 'a.khan@educore.edu', password: 'teacher123', role: 'teacher', gender: 'Female', phone: '+1 (555) 789-0123', cnic: '42101-7890123-7', department: itDept._id, employeeId: 'EMP-01006', salary: 77000, status: 'Active' },
  ];
  const teachers = [];
  for (const td of teacherData) {
    teachers.push(await User.create(td));
  }

  // Accountant & Librarian
  await User.create({ name: 'Robert Finance', email: 'r.finance@educore.edu', password: 'accountant123', role: 'accountant', gender: 'Male', phone: '+1 (555) 800-0001', employeeId: 'EMP-02001', status: 'Active' });
  await User.create({ name: 'Lisa Library', email: 'l.library@educore.edu', password: 'librarian123', role: 'librarian', gender: 'Female', phone: '+1 (555) 900-0001', employeeId: 'EMP-03001', status: 'Active' });

  // Students
  const studentData = [
    { name: 'Alice Anderson', fatherName: 'Robert Anderson', email: 'alice.a@educore.edu', password: 'student123', role: 'student', gender: 'Female', phone: '+1 (555) 111-2222', cnic: '42101-1111111-1', department: csDept._id, semester: 4, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073200', status: 'Active' },
    { name: 'Benjamin Baker', fatherName: 'Thomas Baker', email: 'ben.b@educore.edu', password: 'student123', role: 'student', gender: 'Male', phone: '+1 (555) 222-3333', cnic: '42101-2222222-2', department: csDept._id, semester: 4, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073201', status: 'Active' },
    { name: 'Catherine Cole', fatherName: 'William Cole', email: 'cat.c@educore.edu', password: 'student123', role: 'student', gender: 'Female', phone: '+1 (555) 333-4444', cnic: '42101-3333333-3', department: csDept._id, semester: 4, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073202', status: 'Active' },
    { name: 'Daniel Diaz', fatherName: 'Michael Diaz', email: 'dan.d@educore.edu', password: 'student123', role: 'student', gender: 'Male', phone: '+1 (555) 444-5555', cnic: '42101-4444444-4', department: itDept._id, semester: 4, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073203', status: 'Active' },
    { name: 'Emma Evans', fatherName: 'David Evans', email: 'emma.e@educore.edu', password: 'student123', role: 'student', gender: 'Female', phone: '+1 (555) 555-6666', cnic: '42101-5555555-5', department: csDept._id, semester: 4, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073204', status: 'Active' },
    { name: 'Frank Foster', fatherName: 'Joseph Foster', email: 'frank.f@educore.edu', password: 'student123', role: 'student', gender: 'Male', phone: '+1 (555) 666-7777', cnic: '42101-6666666-6', department: bbaDept._id, semester: 2, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073205', status: 'Active' },
    { name: 'Grace Green', fatherName: 'Charles Green', email: 'grace.g@educore.edu', password: 'student123', role: 'student', gender: 'Female', phone: '+1 (555) 777-8888', cnic: '42101-7777777-7', department: itDept._id, semester: 2, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073206', status: 'Active' },
    { name: 'Henry Hughes', fatherName: 'James Hughes', email: 'henry.h@educore.edu', password: 'student123', role: 'student', gender: 'Male', phone: '+1 (555) 888-9999', cnic: '42101-8888888-8', department: csDept._id, semester: 6, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073207', status: 'Active' },
    { name: 'Isabella Irving', fatherName: 'George Irving', email: 'bella.i@educore.edu', password: 'student123', role: 'student', gender: 'Female', phone: '+1 (555) 999-0000', cnic: '42101-9999999-9', department: bbaDept._id, semester: 6, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073208', status: 'Active' },
    { name: 'Jack Johnson', fatherName: 'Edward Johnson', email: 'jack.j@educore.edu', password: 'student123', role: 'student', gender: 'Male', phone: '+1 (555) 000-1111', cnic: '42101-0000000-0', department: csDept._id, semester: 2, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073209', status: 'Active' },
  ];
  for (const sd of studentData) {
    await User.create(sd);
  }

  await Subject.insertMany([
    { name: 'Introduction to Computer Science', code: 'CS101', department: csDept._id, semester: 1, creditHours: 3, assignedTeacher: teachers[0]._id, status: 'Active' },
    { name: 'Advanced Data Structures', code: 'CS301', department: csDept._id, semester: 4, creditHours: 4, assignedTeacher: teachers[0]._id, status: 'Active' },
    { name: 'Database Systems', code: 'CS304', department: csDept._id, semester: 4, creditHours: 3, assignedTeacher: teachers[4]._id, status: 'Active' },
    { name: 'Operating Systems', code: 'CS305', department: csDept._id, semester: 4, creditHours: 3, assignedTeacher: teachers[1]._id, status: 'Active' },
    { name: 'Network Security', code: 'IT301', department: itDept._id, semester: 4, creditHours: 3, assignedTeacher: teachers[2]._id, status: 'Active' },
    { name: 'Cloud Architecture', code: 'IT302', department: itDept._id, semester: 4, creditHours: 3, assignedTeacher: teachers[5]._id, status: 'Active' },
    { name: 'Linear Algebra', code: 'MATH201', department: departments[3]._id, semester: 2, creditHours: 3, assignedTeacher: teachers[3]._id, status: 'Active' },
    { name: 'Business Communication', code: 'BBA101', department: bbaDept._id, semester: 1, creditHours: 3, status: 'Active' },
  ]);

  await Settings.create({
    schoolName: 'EduCore University',
    schoolAddress: '123 Academic Avenue, Education City',
    schoolPhone: '+1 (555) 000-0000',
    schoolEmail: 'info@educore.edu',
    academicYear: '2025-2026',
    currency: 'USD',
  });

  logger.info('Auto-seed completed!');
  console.log('  ═══════════════════════════════════════════');
  console.log('  LOGIN CREDENTIALS:');
  console.log(`  Super Admin : ${SUPER_ADMIN_EMAIL} / ${SUPER_ADMIN_PASSWORD}`);
  console.log('  Teacher     : s.jenkins@educore.edu / teacher123');
  console.log('  Student     : alice.a@educore.edu / student123');
  console.log('  Accountant  : r.finance@educore.edu / accountant123');
  console.log('  Librarian   : l.library@educore.edu / librarian123');
  console.log('  ═══════════════════════════════════════════');

  // Reset FORCE_RESEED so it doesn't re-seed on next restart
  process.env.FORCE_RESEED = '';
}

/**
 * Repair quizzes that were created without academicSession.
 */
async function repairQuizzesMissingSession() {
  try {
    const Quiz = require('./src/models/Quiz');
    const AcademicSession = require('./src/models/AcademicSession');

    const activeSession = await AcademicSession.findOne({ isActive: true });
    if (!activeSession) {
      logger.info('[REPAIR] No active academic session found — skipping quiz repair.');
      return;
    }

    const result = await Quiz.updateMany(
      { academicSession: { $exists: false } },
      { $set: { academicSession: activeSession._id } }
    );

    if (result.modifiedCount > 0) {
      logger.info(`[REPAIR] Fixed ${result.modifiedCount} quiz(es) missing academicSession → set to "${activeSession.name}"`);
    }
  } catch (err) {
    logger.warn('[REPAIR] Could not repair quizzes:', err.message);
  }
}

const startServer = async () => {
  try {
    // ── Database Connection ────────────────────────────────────────────────
    logger.info('Connecting to MongoDB...');
    await connectDB();
    logger.info('MongoDB connected successfully.');

    // Auto-seed if database is empty
    await seedIfEmpty();

    // Repair quizzes that were created without academicSession
    await repairQuizzesMissingSession();

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });

    // Initialize WebSocket for real-time notifications
    try {
      initWebSocket(server);
      logger.info('WebSocket server ready for real-time notifications');
    } catch (wsErr) {
      logger.warn('WebSocket initialization failed (non-fatal):', wsErr.message);
    }

    const shutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        const mongoose = require('mongoose');
        mongoose.connection.close(false).then(() => {
          logger.info('Database connection closed.');
          process.exit(0);
        });
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err?.message || err);
  process.exit(1);
});

const { initWebSocket } = require('./src/services/websocket.service');

startServer();
