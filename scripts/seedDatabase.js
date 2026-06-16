const path = require('path');

// Resolve mongoose and dotenv
let mongoose;
try {
  mongoose = require('mongoose');
} catch (err) {
  mongoose = require('../backend/node_modules/mongoose');
}

let dotenv;
try {
  dotenv = require('dotenv');
} catch (err) {
  dotenv = require('../backend/node_modules/dotenv');
}
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const connectDB = require('../backend/src/config/database');

const {
  User,
  Department,
  Subject,
  AcademicSession,
  Timetable,
  Notification,
  Quiz,
  Settings,
  Challan
} = require('../backend/src/models');

const seedData = async () => {
  try {
    await connectDB();

    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@educore.edu';
    const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
    const TEACHER_PW = 'teacher123';
    const ACCOUNTANT_PW = 'accountant123';
    const LIBRARIAN_PW = 'librarian123';
    const STUDENT_PW = 'student123';

    await User.deleteMany({});
    await Department.deleteMany({});
    await Subject.deleteMany({});
    await AcademicSession.deleteMany({});
    await Timetable.deleteMany({});
    await Notification.deleteMany({});
    await Quiz.deleteMany({});
    await Settings.deleteMany({});
    await Challan.deleteMany({});

    console.log('Database cleared');

    const activeSession = await AcademicSession.create({
      name: '2025-2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
      isActive: true,
    });
    console.log('Academic session created');

    const departments = await Department.insertMany([
      { name: 'Computer Science', code: 'CS', description: 'Computer Science and Engineering Department', totalSemesters: 8 },
      { name: 'Information Technology', code: 'IT', description: 'Information Technology Department', totalSemesters: 8 },
      { name: 'Business Administration', code: 'BBA', description: 'Business Administration Department', totalSemesters: 8 },
      { name: 'Mathematics', code: 'MATH', description: 'Mathematics Department', totalSemesters: 8 },
      { name: 'Physics', code: 'PHY', description: 'Physics Department', totalSemesters: 8 },
    ]);
    console.log('Departments created');

    const csDept = departments[0];
    const itDept = departments[1];
    const bbaDept = departments[2];

    // ── Use User.create() for ALL users to ensure the pre-save
    //    password-hashing hook fires exactly once.  In Mongoose 7+
    //    insertMany() also triggers pre('save'), so passing a
    //    pre-hashed password causes a double-hash and login will fail.
    // ──────────────────────────────────────────────────────────────

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
    console.log('Super Admin created');

    const teacherData = [
      { name: 'Prof. Sarah Jenkins', email: 's.jenkins@educore.edu', password: TEACHER_PW, role: 'teacher', gender: 'Female', phone: '+1 (555) 234-8901', cnic: '42101-2345678-2', department: csDept._id, employeeId: 'EMP-01001', salary: 75000, status: 'Active' },
      { name: 'Dr. Marcus Thorne', email: 'm.thorne@educore.edu', password: TEACHER_PW, role: 'teacher', gender: 'Male', phone: '+1 (555) 345-9012', cnic: '42101-3456789-3', department: csDept._id, employeeId: 'EMP-01002', salary: 80000, status: 'Active' },
      { name: 'Prof. David Chen', email: 'd.chen@educore.edu', password: TEACHER_PW, role: 'teacher', gender: 'Male', phone: '+1 (555) 456-7890', cnic: '42101-4567890-4', department: itDept._id, employeeId: 'EMP-01003', salary: 72000, status: 'Active' },
      { name: 'Dr. Elena Rodriguez', email: 'e.rodriguez@educore.edu', password: TEACHER_PW, role: 'teacher', gender: 'Female', phone: '+1 (555) 567-8901', cnic: '42101-5678901-5', department: departments[3]._id, employeeId: 'EMP-01004', salary: 78000, status: 'Active' },
      { name: 'Prof. James Wilson', email: 'j.wilson@educore.edu', password: TEACHER_PW, role: 'teacher', gender: 'Male', phone: '+1 (555) 678-9012', cnic: '42101-6789012-6', department: csDept._id, employeeId: 'EMP-01005', salary: 76000, status: 'Active' },
      { name: 'Dr. Aisha Khan', email: 'a.khan@educore.edu', password: TEACHER_PW, role: 'teacher', gender: 'Female', phone: '+1 (555) 789-0123', cnic: '42101-7890123-7', department: itDept._id, employeeId: 'EMP-01006', salary: 77000, status: 'Active' },
    ];
    const teachers = [];
    for (const td of teacherData) {
      teachers.push(await User.create(td));
    }
    console.log('Teachers created');

    await User.create({ name: 'Robert Finance', email: 'r.finance@educore.edu', password: ACCOUNTANT_PW, role: 'accountant', gender: 'Male', phone: '+1 (555) 800-0001', employeeId: 'EMP-02001', status: 'Active' });
    await User.create({ name: 'Lisa Library', email: 'l.library@educore.edu', password: LIBRARIAN_PW, role: 'librarian', gender: 'Female', phone: '+1 (555) 900-0001', employeeId: 'EMP-03001', status: 'Active' });
    console.log('Accountant & Librarian created');

    const studentData = [
      { name: 'Alice Anderson', fatherName: 'Robert Anderson', email: 'alice.a@educore.edu', password: STUDENT_PW, role: 'student', gender: 'Female', phone: '+1 (555) 111-2222', cnic: '42101-1111111-1', department: csDept._id, semester: 4, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073200', status: 'Active' },
      { name: 'Benjamin Baker', fatherName: 'Thomas Baker', email: 'ben.b@educore.edu', password: STUDENT_PW, role: 'student', gender: 'Male', phone: '+1 (555) 222-3333', cnic: '42101-2222222-2', department: csDept._id, semester: 4, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073201', status: 'Active' },
      { name: 'Catherine Cole', fatherName: 'William Cole', email: 'cat.c@educore.edu', password: STUDENT_PW, role: 'student', gender: 'Female', phone: '+1 (555) 333-4444', cnic: '42101-3333333-3', department: csDept._id, semester: 4, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073202', status: 'Active' },
      { name: 'Daniel Diaz', fatherName: 'Michael Diaz', email: 'dan.d@educore.edu', password: STUDENT_PW, role: 'student', gender: 'Male', phone: '+1 (555) 444-5555', cnic: '42101-4444444-4', department: itDept._id, semester: 4, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073203', status: 'Active' },
      { name: 'Emma Evans', fatherName: 'David Evans', email: 'emma.e@educore.edu', password: STUDENT_PW, role: 'student', gender: 'Female', phone: '+1 (555) 555-6666', cnic: '42101-5555555-5', department: csDept._id, semester: 4, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073204', status: 'Active' },
      { name: 'Frank Foster', fatherName: 'Joseph Foster', email: 'frank.f@educore.edu', password: STUDENT_PW, role: 'student', gender: 'Male', phone: '+1 (555) 666-7777', cnic: '42101-6666666-6', department: bbaDept._id, semester: 2, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073205', status: 'Active' },
      { name: 'Grace Green', fatherName: 'Charles Green', email: 'grace.g@educore.edu', password: STUDENT_PW, role: 'student', gender: 'Female', phone: '+1 (555) 777-8888', cnic: '42101-7777777-7', department: itDept._id, semester: 2, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073206', status: 'Active' },
      { name: 'Henry Hughes', fatherName: 'James Hughes', email: 'henry.h@educore.edu', password: STUDENT_PW, role: 'student', gender: 'Male', phone: '+1 (555) 888-9999', cnic: '42101-8888888-8', department: csDept._id, semester: 6, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073207', status: 'Active' },
      { name: 'Isabella Irving', fatherName: 'George Irving', email: 'bella.i@educore.edu', password: STUDENT_PW, role: 'student', gender: 'Female', phone: '+1 (555) 999-0000', cnic: '42101-9999999-9', department: bbaDept._id, semester: 6, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073208', status: 'Active' },
      { name: 'Jack Johnson', fatherName: 'Edward Johnson', email: 'jack.j@educore.edu', password: STUDENT_PW, role: 'student', gender: 'Male', phone: '+1 (555) 000-1111', cnic: '42101-0000000-0', department: csDept._id, semester: 2, academicSession: activeSession._id, registrationNumber: '2025-ESTUDY-073209', status: 'Active' },
    ];
    const students = [];
    for (const sd of studentData) {
      students.push(await User.create(sd));
    }
    console.log('Students created');

    const subjects = await Subject.insertMany([
      { name: 'Introduction to Computer Science', code: 'CS101', department: csDept._id, semester: 1, creditHours: 3, assignedTeacher: teachers[0]._id, status: 'Active' },
      { name: 'Advanced Data Structures', code: 'CS301', department: csDept._id, semester: 4, creditHours: 4, assignedTeacher: teachers[0]._id, status: 'Active' },
      { name: 'Database Systems', code: 'CS304', department: csDept._id, semester: 4, creditHours: 3, assignedTeacher: teachers[4]._id, status: 'Active' },
      { name: 'Operating Systems', code: 'CS305', department: csDept._id, semester: 4, creditHours: 3, assignedTeacher: teachers[1]._id, status: 'Active' },
      { name: 'Advanced Algorithms', code: 'CS401', department: csDept._id, semester: 6, creditHours: 4, assignedTeacher: teachers[0]._id, status: 'Active' },
      { name: 'Software Engineering', code: 'CS405', department: csDept._id, semester: 6, creditHours: 3, assignedTeacher: teachers[1]._id, status: 'Active' },
      { name: 'Network Security', code: 'IT301', department: itDept._id, semester: 4, creditHours: 3, assignedTeacher: teachers[2]._id, status: 'Active' },
      { name: 'Cloud Architecture', code: 'IT302', department: itDept._id, semester: 4, creditHours: 3, assignedTeacher: teachers[5]._id, status: 'Active' },
      { name: 'Linear Algebra', code: 'MATH201', department: departments[3]._id, semester: 2, creditHours: 3, assignedTeacher: teachers[3]._id, status: 'Active' },
      { name: 'Business Communication', code: 'BBA101', department: bbaDept._id, semester: 1, creditHours: 3, status: 'Active' },
    ]);
    console.log('Subjects created');

    await Timetable.insertMany([
      { department: csDept._id, semester: 4, day: 'Monday', subject: subjects[1]._id, teacher: teachers[0]._id, startTime: '09:00', endTime: '11:00', room: 'Room 302', academicSession: '2025-2026' },
      { department: csDept._id, semester: 4, day: 'Monday', subject: subjects[2]._id, teacher: teachers[4]._id, startTime: '11:00', endTime: '13:00', room: 'Lab 402', academicSession: '2025-2026' },
      { department: csDept._id, semester: 4, day: 'Tuesday', subject: subjects[3]._id, teacher: teachers[1]._id, startTime: '09:00', endTime: '11:00', room: 'Room 305', academicSession: '2025-2026' },
      { department: csDept._id, semester: 4, day: 'Wednesday', subject: subjects[2]._id, teacher: teachers[4]._id, startTime: '09:00', endTime: '11:00', room: 'Lab 402', academicSession: '2025-2026' },
      { department: csDept._id, semester: 4, day: 'Thursday', subject: subjects[1]._id, teacher: teachers[0]._id, startTime: '09:00', endTime: '11:00', room: 'Room 302', academicSession: '2025-2026' },
      { department: csDept._id, semester: 4, day: 'Friday', subject: subjects[3]._id, teacher: teachers[1]._id, startTime: '09:00', endTime: '11:00', room: 'Room 305', academicSession: '2025-2026' },
    ]);
    console.log('Timetable entries created');

    await Challan.insertMany([
      { student: students[0]._id, challanType: 'Mid-Semester', amount: 1850, issueDate: new Date(), dueDate: new Date(Date.now() + 30 * 86400000), status: 'Pending', academicSession: '2025-2026' },
      { student: students[1]._id, challanType: 'Mid-Semester', amount: 1850, issueDate: new Date(), dueDate: new Date(Date.now() - 5 * 86400000), status: 'Overdue', academicSession: '2025-2026' },
      { student: students[2]._id, challanType: 'Mid-Semester', amount: 1850, issueDate: new Date(), dueDate: new Date(Date.now() + 30 * 86400000), status: 'Paid', academicSession: '2025-2026' },
    ]);
    console.log('Challans created');

    await Settings.create({
      schoolName: 'EduCore University',
      schoolAddress: '123 Academic Avenue, Education City',
      schoolPhone: '+1 (555) 000-0000',
      schoolEmail: 'info@educore.edu',
      academicYear: '2025-2026',
      currency: 'USD',
    });
    console.log('Settings created');

    const aliceId = students[0]._id;
    await Notification.insertMany([
      { recipient: aliceId, title: 'Assignment 3 Grade Published', message: 'Data Structures Assignment 3 grades have been published.', category: 'Academic', isRead: false },
      { recipient: aliceId, title: 'Library Book Overdue', message: 'Please return "Introduction to Algorithms" to the library.', category: 'System', isRead: false },
      { recipient: aliceId, title: 'Mid-term Fee Challan Generated', message: 'Your mid-semester fee challan has been generated. Amount: $1,850.00', category: 'Finance', isRead: false },
    ]);
    console.log('Notifications created');

    await Quiz.create({
      title: 'Mid-term Data Structures',
      department: csDept._id,
      semester: 4,
      academicSession: activeSession._id,
      subject: subjects[1]._id,
      createdBy: teachers[0]._id,
      timeLimit: 45,
      totalMarks: 25,
      shuffleQuestions: false,
      status: 'Published',
      questions: [
        { question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(n^2)'], correctAnswer: 1, marks: 1 },
        { question: 'Which data structure uses LIFO?', options: ['Queue', 'Stack', 'Linked List', 'Tree'], correctAnswer: 1, marks: 1 },
        { question: 'What is the height of a balanced BST with n nodes?', options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'], correctAnswer: 1, marks: 1 },
        { question: 'Which sorting algorithm has the best average case?', options: ['Bubble Sort', 'Quick Sort', 'Insertion Sort', 'Selection Sort'], correctAnswer: 1, marks: 1 },
        { question: 'What is a heap?', options: ['Complete binary tree', 'Linked list', 'Array', 'Graph'], correctAnswer: 0, marks: 1 },
      ],
    });
    console.log('Quiz created');

    console.log('\nSeed completed successfully!');
    console.log('  ═══════════════════════════════════════════');
    console.log('  LOGIN CREDENTIALS:');
    console.log(`  Super Admin : ${SUPER_ADMIN_EMAIL} / ${SUPER_ADMIN_PASSWORD}`);
    console.log('  Teacher     : s.jenkins@educore.edu / teacher123');
    console.log('  Accountant  : r.finance@educore.edu / accountant123');
    console.log('  Librarian   : l.library@educore.edu / librarian123');
    console.log('  Student     : alice.a@educore.edu / student123');
    console.log('  ═══════════════════════════════════════════');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
