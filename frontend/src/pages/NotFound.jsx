import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-16 h-16 text-[#F59E0B] mx-auto mb-4" />
        <h1 className="text-6xl font-bold text-[#16a34a] mb-2">404</h1>
        <h2 className="text-xl font-semibold text-[#0F172A] mb-2">Page Not Found</h2>
        <p className="text-sm text-[#475569] mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d]"
        >
          <Home className="w-4 h-4" /> Go Home
        </Link>
      </div>
    </div>
  );
}
