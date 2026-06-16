import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import SessionWarning from "@/components/SessionWarning";
import { AlertDialogProvider } from "@/components/AlertDialog";
import ErrorBoundary from "@/components/ErrorBoundary";

// Eager loads (small, always needed)
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import NotFound from "@/pages/NotFound";
import Unauthorized from "@/pages/Unauthorized";

// Layouts (needed for initial shell)
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import TeacherLayout from "@/layouts/TeacherLayout";
import StudentLayout from "@/components/StudentLayout";

// Super Admin Portal Pages — lazy loaded
const SuperAdminDashboard = lazy(() => import("@/pages/superadmin/Dashboard"));
const SuperAdminUsers = lazy(() => import("@/pages/superadmin/Users"));
const SuperAdminDepartments = lazy(() => import("@/pages/superadmin/Departments"));
const SuperAdminSettings = lazy(() => import("@/pages/superadmin/Settings"));
const SuperAdminActivityLogs = lazy(() => import("@/pages/superadmin/ActivityLogs"));
const SuperAdminProfile = lazy(() => import("@/pages/superadmin/Profile"));
const SuperAdminStudents = lazy(() => import("@/pages/superadmin/Students"));
const SuperAdminSubjects = lazy(() => import("@/pages/superadmin/Subjects"));
const SuperAdminAttendance = lazy(() => import("@/pages/superadmin/Attendance"));
const SuperAdminTimetable = lazy(() => import("@/pages/superadmin/Timetable"));
const SuperAdminResults = lazy(() => import("@/pages/superadmin/Results"));
const SuperAdminChallans = lazy(() => import("@/pages/superadmin/Challans"));
const SuperAdminNotifications = lazy(() => import("@/pages/superadmin/Notifications"));
const SuperAdminClasses = lazy(() => import("@/pages/superadmin/Classes"));
const SuperAdminExams = lazy(() => import("@/pages/superadmin/Exams"));
const SuperAdminQuizzes = lazy(() => import("@/pages/superadmin/Quizzes"));
const SuperAdminLibrary = lazy(() => import("@/pages/superadmin/Library"));
const SuperAdminFeeStructure = lazy(() => import("@/pages/superadmin/FeeStructure"));
const SuperAdminReports = lazy(() => import("@/pages/superadmin/Reports"));
const SuperAdminHelpCenter = lazy(() => import("@/pages/superadmin/HelpCenter"));

// Teacher Portal Pages — lazy loaded
const TeacherDashboard = lazy(() => import("@/pages/teacher/Dashboard"));
const TeacherAttendance = lazy(() => import("@/pages/teacher/Attendance"));
const TeacherQuizzes = lazy(() => import("@/pages/teacher/Quizzes"));
const TeacherCreateQuiz = lazy(() => import("@/pages/teacher/CreateQuiz"));
const TeacherResults = lazy(() => import("@/pages/teacher/Results"));
const TeacherTimetable = lazy(() => import("@/pages/teacher/Timetable"));
const TeacherStudents = lazy(() => import("@/pages/teacher/Students"));
const TeacherSubjects = lazy(() => import("@/pages/teacher/Subjects"));
const TeacherNotifications = lazy(() => import("@/pages/teacher/Notifications"));
const TeacherProfile = lazy(() => import("@/pages/teacher/Profile"));
const TeacherHelpCenter = lazy(() => import("@/pages/teacher/HelpCenter"));

// Student Portal Pages — lazy loaded
const StudentDashboard = lazy(() => import("@/pages/student/Dashboard"));
const StudentAttendance = lazy(() => import("@/pages/student/Attendance"));
const StudentTimetable = lazy(() => import("@/pages/student/Timetable"));
const StudentTeachers = lazy(() => import("@/pages/student/Teachers"));
const StudentCourses = lazy(() => import("@/pages/student/Courses"));
const StudentQuizzes = lazy(() => import("@/pages/student/Quizzes"));
const StudentQuizAttempt = lazy(() => import("@/pages/student/QuizAttempt"));
const StudentQuizResult = lazy(() => import("@/pages/student/QuizResult"));
const StudentResults = lazy(() => import("@/pages/student/Results"));
const StudentPayments = lazy(() => import("@/pages/student/Payments"));
const StudentProfile = lazy(() => import("@/pages/student/Profile"));
const StudentNotifications = lazy(() => import("@/pages/student/Notifications"));
const StudentHelpCenter = lazy(() => import("@/pages/student/HelpCenter"));

// Suspense fallback spinner
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-[#16a34a] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#64748B]">Loading page...</p>
      </div>
    </div>
  );
}

export function getDashboardPath(role) {
  switch (role) {
    case "superadmin": return "/superadmin/dashboard";
    case "teacher": return "/teacher/dashboard";
    case "admin": return "/teacher/dashboard";
    case "accountant": return "/superadmin/dashboard";
    case "librarian": return "/superadmin/dashboard";
    case "student": return "/student/dashboard";
    default: return "/login";
  }
}

function PublicRoute({ children }) {
  const { isAuthenticated, user, loading, isReady } = useAuth();

  if (loading || !isReady) {
    return <PageLoader />;
  }

  if (isAuthenticated && user?.role) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* SUPER ADMIN PORTAL */}
          <Route path="/superadmin" element={<ProtectedRoute allowedRoles={["superadmin"]}><SuperAdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="users" element={<SuperAdminUsers />} />
            <Route path="students" element={<SuperAdminStudents />} />
            <Route path="departments" element={<SuperAdminDepartments />} />
            <Route path="subjects" element={<SuperAdminSubjects />} />
            <Route path="classes" element={<SuperAdminClasses />} />
            <Route path="attendance" element={<SuperAdminAttendance />} />
            <Route path="timetable" element={<SuperAdminTimetable />} />
            <Route path="exams" element={<SuperAdminExams />} />
            <Route path="quizzes" element={<SuperAdminQuizzes />} />
            <Route path="results" element={<SuperAdminResults />} />
            <Route path="challans" element={<SuperAdminChallans />} />
            <Route path="fee-structure" element={<SuperAdminFeeStructure />} />
            <Route path="library" element={<SuperAdminLibrary />} />
            <Route path="reports" element={<SuperAdminReports />} />
            <Route path="notifications" element={<SuperAdminNotifications />} />
            <Route path="activity-logs" element={<SuperAdminActivityLogs />} />
            <Route path="help" element={<SuperAdminHelpCenter />} />
            <Route path="settings" element={<SuperAdminSettings />} />
            <Route path="profile" element={<SuperAdminProfile />} />
          </Route>

          {/* TEACHER PORTAL */}
          <Route path="/teacher" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><TeacherLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="attendance" element={<TeacherAttendance />} />
            <Route path="quizzes" element={<TeacherQuizzes />} />
            <Route path="quizzes/create" element={<TeacherCreateQuiz />} />
            <Route path="results" element={<TeacherResults />} />
            <Route path="timetable" element={<TeacherTimetable />} />
            <Route path="students" element={<TeacherStudents />} />
            <Route path="subjects" element={<TeacherSubjects />} />
            <Route path="notifications" element={<TeacherNotifications />} />
            <Route path="help" element={<TeacherHelpCenter />} />
            <Route path="profile" element={<TeacherProfile />} />
          </Route>

          {/* STUDENT PORTAL */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={["student"]}><StudentLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="timetable" element={<StudentTimetable />} />
            <Route path="teachers" element={<StudentTeachers />} />
            <Route path="courses" element={<StudentCourses />} />
            <Route path="quizzes" element={<StudentQuizzes />} />
            <Route path="quizzes/:id/attempt" element={<StudentQuizAttempt />} />
            <Route path="quizzes/:id/result" element={<StudentQuizResult />} />
            <Route path="results" element={<StudentResults />} />
            <Route path="payments" element={<StudentPayments />} />
            <Route path="notifications" element={<StudentNotifications />} />
            <Route path="help" element={<StudentHelpCenter />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AlertDialogProvider>
        <SessionWarning />
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1E293B',
              color: '#F8FAFC',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.05)',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#F8FAFC' }, style: { borderLeft: '4px solid #22c55e' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#F8FAFC' }, style: { borderLeft: '4px solid #EF4444' } },
          }}
        />
      </AlertDialogProvider>
    </AuthProvider>
  );
}
