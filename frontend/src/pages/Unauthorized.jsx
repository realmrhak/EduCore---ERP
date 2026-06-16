import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function getDashboardPath(role) {
  switch (role) {
    case 'superadmin': return '/superadmin/dashboard';
    case 'teacher': return '/teacher/dashboard';
    case 'admin': return '/teacher/dashboard';
    case 'accountant': return '/superadmin/dashboard';
    case 'librarian': return '/superadmin/dashboard';
    case 'student': return '/student/dashboard';
    default: return '/login';
  }
}

export default function Unauthorized() {
  const { user } = useAuth();
  const home = getDashboardPath(user?.role);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="text-center max-w-md">
        <ShieldX className="w-16 h-16 text-[#EF4444] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Access Denied</h1>
        <p className="text-sm text-[#475569] mb-6">
          You do not have permission to view this page.
        </p>
        <Link
          to={home}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
