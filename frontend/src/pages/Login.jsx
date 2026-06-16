import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

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

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── KEY FIX: React to auth state changes ───────────────────
  // When isAuthenticated becomes true (after login()), navigate
  // to the correct dashboard. This is more reliable than calling
  // navigate() inside the submit handler because it guarantees
  // the React state has already been committed.
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      const dashboardPath = getDashboardPath(user.role);
      if (dashboardPath !== '/login') {
        navigate(dashboardPath, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Navigation is handled by the useEffect above — no need to
      // call navigate() here. Just let the state change trigger it.
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Invalid credentials';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1920&q=80)',
          filter: 'brightness(0.6)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#14532d]/80 via-[#16a34a]/60 to-[#14532d]/80" />

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/10"
          style={{
            width: Math.random() * 8 + 4,
            height: Math.random() * 8 + 4,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: Math.random() * 4 + 3,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[440px] mx-4"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#f0fdf4] flex items-center justify-center mb-3 sm:mb-4">
              <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-[#16a34a]" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A]">EduCore ERP</h1>
            <p className="text-sm text-[#475569] mt-1">Sign in to access your academic portal</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-red-50 text-[#EF4444] text-sm p-3 rounded-lg mb-4"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#16a34a]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@university.edu"
                  className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-[#0F172A]">Password</label>
                <Link to="/forgot-password" className="text-xs sm:text-sm text-[#16a34a] hover:text-[#15803d] font-medium">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#16a34a]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-10 sm:pr-11 py-2.5 sm:py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-[#16a34a] hover:text-[#15803d] p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#16a34a] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#15803d] hover:shadow-lg hover:shadow-[#16a34a]/25 transition-all disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom note */}
          <div className="mt-5 sm:mt-6 flex items-center gap-2 sm:gap-3 bg-[#f0fdf4] rounded-xl p-3 sm:p-4">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#16a34a] flex-shrink-0" />
            <div className="text-sm">
              <p className="text-[#475569]">Public registration is disabled.</p>
              <p className="text-[#16a34a] font-medium">Contact Admin for account creation.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
