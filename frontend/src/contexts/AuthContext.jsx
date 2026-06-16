import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { authAPI } from "@/services/api";

const AuthContext = createContext(null);

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min inactivity warning
const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // Refresh 5 min before expiry

function normalizeUser(raw) {
  if (!raw) return null;
  return {
    id: raw.id || raw._id || null,
    _id: raw._id || raw.id || null,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    registrationNumber: raw.registrationNumber,
    employeeId: raw.employeeId,
    department: raw.department,
    semester: raw.semester,
    status: raw.status,
    profileImage: raw.profileImage,
    gender: raw.gender,
    fatherName: raw.fatherName,
    motherName: raw.motherName,
    cnic: raw.cnic,
    phone: raw.phone,
    address: raw.address,
    emergencyContact: raw.emergencyContact,
    academicSession: raw.academicSession,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? normalizeUser(JSON.parse(storedUser)) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);
  const loginInProgress = useRef(false);
  const lastActivityRef = useRef(Date.now());

  // Track user activity for session timeout
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      setSessionWarning(false);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, updateActivity));

    // Check for inactivity every minute
    const interval = setInterval(() => {
      const inactiveMs = Date.now() - lastActivityRef.current;
      if (inactiveMs >= SESSION_TIMEOUT_MS && token) {
        setSessionWarning(true);
      }
    }, 60000);

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
      clearInterval(interval);
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        if (!cancelled) {
          setLoading(false);
          setIsReady(true);
        }
        return;
      }

      try {
        const res = await authAPI.me();
        const rawUser = res.data?.data ?? res.data?.user ?? null;
        if (!cancelled) {
          if (rawUser) {
            const nextUser = normalizeUser(rawUser);
            setUser(nextUser);
            setToken(storedToken);
            localStorage.setItem("user", JSON.stringify(nextUser));
          }
          setLoading(false);
          setIsReady(true);
        }
      } catch {
        if (!cancelled && !loginInProgress.current) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("refreshToken");
          setUser(null);
          setToken(null);
          setLoading(false);
          setIsReady(true);
        }
      }
    };

    initAuth();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email, password) => {
    loginInProgress.current = true;

    try {
      const res = await authAPI.login(email, password);
      const payload = res.data?.data ?? res.data ?? {};
      const newToken = payload.token ?? res.data?.token;
      const refreshToken = payload.refreshToken ?? res.data?.refreshToken;
      const rawUser = payload.user ?? res.data?.user;

      if (!newToken || !rawUser) {
        throw new Error("Invalid login response from server");
      }

      const userData = normalizeUser(rawUser);

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      setToken(newToken);
      setUser(userData);
      lastActivityRef.current = Date.now();

      return userData;
    } catch (err) {
      loginInProgress.current = false;
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setToken(null);
    loginInProgress.current = false;
    setSessionWarning(false);
  }, []);

  const extendSession = useCallback(() => {
    lastActivityRef.current = Date.now();
    setSessionWarning(false);
  }, []);

  // Refresh user data from server (used after profile image upload)
  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.me();
      const rawUser = res.data?.data ?? res.data?.user ?? null;
      if (rawUser) {
        const nextUser = normalizeUser(rawUser);
        setUser(nextUser);
        localStorage.setItem("user", JSON.stringify(nextUser));
        return nextUser;
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
    return null;
  }, []);

  const isAuthenticated = Boolean(user) && Boolean(token);

  const value = {
    user,
    login,
    logout,
    loading,
    isReady,
    isAuthenticated,
    sessionWarning,
    extendSession,
    refreshUser,
    isSuperAdmin: user?.role === "superadmin",
    isAdmin: ["admin", "superadmin"].includes(user?.role),
    isTeacher: ["teacher", "admin", "superadmin"].includes(user?.role),
    isStudent: user?.role === "student",
    isAccountant: ["accountant", "superadmin", "admin"].includes(user?.role),
    isLibrarian: ["librarian", "superadmin", "admin"].includes(user?.role),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
