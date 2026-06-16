import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Clock, LogOut } from 'lucide-react';

const WARNING_AFTER_MS = 25 * 60 * 1000; // 25 min — show warning
const AUTO_LOGOUT_AFTER_MS = 30 * 60 * 1000; // 30 min — auto logout

export default function SessionWarning() {
  const { user, logout, extendSession } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 min countdown in seconds

  const handleActivity = useCallback(() => {
    setShowWarning(false);
    setCountdown(300);
    extendSession();
  }, [extendSession]);

  useEffect(() => {
    if (!user) return;

    let lastActivity = Date.now();
    let warningShown = false;

    const updateActivity = () => {
      lastActivity = Date.now();
      if (warningShown) {
        handleActivity();
        warningShown = false;
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, updateActivity));

    const interval = setInterval(() => {
      const inactiveMs = Date.now() - lastActivity;

      if (inactiveMs >= AUTO_LOGOUT_AFTER_MS) {
        logout();
        return;
      }

      if (inactiveMs >= WARNING_AFTER_MS && !warningShown) {
        setShowWarning(true);
        warningShown = true;
      }

      if (warningShown) {
        const remainingMs = AUTO_LOGOUT_AFTER_MS - inactiveMs;
        setCountdown(Math.max(0, Math.floor(remainingMs / 1000)));
      }
    }, 1000);

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
      clearInterval(interval);
    };
  }, [user, logout, handleActivity]);

  if (!showWarning) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-[#F59E0B]/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#0F172A]">Session Expiring</h3>
            <p className="text-sm text-[#64748B]">Your session is about to expire due to inactivity</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-4 py-3 mb-4">
          <Clock className="w-5 h-5 text-[#F59E0B]" />
          <span className="text-xl font-bold text-[#92400E]">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
          <span className="text-sm text-[#A16207]">remaining</span>
        </div>

        <p className="text-sm text-[#475569] mb-5">
          You will be automatically logged out for security. Click "Stay Active" to continue your session.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => { setShowWarning(false); handleActivity(); }}
            className="flex-1 px-4 py-2.5 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] transition-colors"
          >
            Stay Active
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#475569] hover:border-[#EF4444] hover:text-[#EF4444] transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
