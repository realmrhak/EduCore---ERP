import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from './Dashboard';
import TeacherDashboard from './TeacherDashboard';
import AccountantDashboard from './AccountantDashboard';
import LibrarianDashboard from './LibrarianDashboard';

export default function RoleDashboard() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'teacher':
      return <TeacherDashboard />;
    case 'accountant':
      return <AccountantDashboard />;
    case 'librarian':
      return <LibrarianDashboard />;
    default:
      return <AdminDashboard />;
  }
}
