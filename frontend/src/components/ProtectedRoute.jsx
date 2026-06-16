import { useEffect, useRef, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/services/api';

/**
 * ProtectedRoute — Guards routes with JWT-based authentication and role authorization.
 *
 * Behaviour:
 * 1. While auth is initializing → show a loading spinner
 * 2. If no token / not authenticated → redirect to /login
 * 3. If authenticated but role doesn't match allowedRoles → redirect to their own dashboard
 * 4. On every mount (and periodically), call GET /api/auth/me to verify the token server-side
 *    - If the API returns 401 → clear auth state and redirect to /login
 * 5. Render children only when everything checks out
 */

function getDashboardForRole(role) {
  switch (role) {
    case 'superadmin': return '/superadmin/dashboard';
    case 'teacher': return '/teacher/dashboard';
    case 'admin': return '/teacher/dashboard';
    case 'student': return '/student/dashboard';
    default: return '/login';
  }
}

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, loading, isReady, logout } = useAuth();
  const location = useLocation();
  const verifyRef = useRef(false);
  const intervalRef = useRef(null);

  // Server-side token verification
  const verifyToken = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      logout();
      return;
    }
    try {
      const res = await authAPI.me();
      const rawUser = res.data?.data ?? res.data?.user ?? null;
      if (!rawUser) {
        logout();
      }
    } catch {
      logout();
    }
  }, [logout]);

  // Verify token on mount for this route
  useEffect(() => {
    if (!verifyRef.current && isReady && isAuthenticated) {
      verifyRef.current = true;
      verifyToken();
    }
  }, [isReady, isAuthenticated, verifyToken]);

  // Periodically re-verify token (every 5 minutes)
  useEffect(() => {
    if (isAuthenticated) {
      intervalRef.current = setInterval(() => {
        verifyToken();
      }, 5 * 60 * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, verifyToken]);

  // ─── Render Guards ────────────────────────────────────

  // 1. Still initializing — show spinner
  if (loading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-[#16a34a] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#64748B]">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // 2. Not authenticated → login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Role mismatch → redirect to their own dashboard (NOT /unauthorized)
  // This blocks cross-portal URL access (e.g., a student typing /superadmin/dashboard)
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    const userDashboard = getDashboardForRole(user?.role);
    return <Navigate to={userDashboard} replace />;
  }

  // 4. All checks passed → render children
  return children;
}
