# API Documentation — EduCore ERP

The API is structured as a REST API endpoints prefixing `/api/`. All protected requests expect an `Authorization` header with a bearer token:
`Authorization: Bearer <JWT_TOKEN>`

## 1. Authentication Module
- `POST /api/auth/login` - Authenticate users.
  - Body: `{ email, password }`
- `GET /api/auth/me` - Get current authenticated user details.
- `PUT /api/auth/profile` - Update profile data.
- `PUT /api/auth/change-password` - Change password.
- `POST /api/auth/forgot-password` - Send password reset token.
- `POST /api/auth/reset-password` - Reset password using reset token.

## 2. User Module
- `GET /api/users` - List all users (Super Admin only).
- `POST /api/users` - Create a new user (Super Admin only).
- `PUT /api/users/:id` - Update user details (Super Admin only).
- `DELETE /api/users/:id` - Soft-delete user (Super Admin only).
- `GET /api/users/teachers` - Get list of active teachers.
- `GET /api/users/students` - Get list of students (Admin only).
- `POST /api/users/promote-semester` - Promote group of students (Super Admin only).

## 3. Academic & Class Module
- `GET /api/classes` - List all classes and sections.
- `POST /api/classes` - Create class/section (Admin/Super Admin only).
- `GET /api/classes/:id` - Get class details.

## 4. Attendance Module
- `GET /api/attendance` - Query attendance history.
- `POST /api/attendance` - Mark attendance for a section (Teacher only).

## 5. Exam & Result Module
- `GET /api/exams` - List scheduled examinations.
- `POST /api/exams` - Create exam entry.
- `POST /api/exams/marks` - Upload student marks for an exam.
- `GET /api/quizzes` - List active quizzes.
- `POST /api/quizzes` - Create quiz.
- `POST /api/quizzes/:id/submit` - Submit quiz attempt (Student only).

## 6. Billing & Fees Module
- `GET /api/fee-structures` - List active fee structures.
- `POST /api/fee-structures` - Create fee structure.
- `GET /api/challans` - List fee challans.
- `POST /api/challans/collect` - Update payment logs for challan (Accountant only).

## 7. Library Module
- `GET /api/library/books` - List book catalogs.
- `POST /api/library/issue` - Log a book issuance (Librarian only).
- `POST /api/library/return` - Log a book return (Librarian only).
