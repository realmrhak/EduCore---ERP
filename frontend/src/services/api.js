import axios from 'axios';

// ── API URL Configuration ────────────────────────────────────────────────────
// Development: '/api' → Vite proxy forwards to localhost:5000
// Production (split deploy): Set VITE_API_URL to full Render backend URL, e.g.:
//   VITE_API_URL=https://educore-erp.onrender.com/api
// Production (single server): Leave empty — '/api' will hit the same server
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Increase timeout for Render cold starts (can take 30-60 seconds)
  timeout: API_URL.startsWith('http') ? 60000 : 30000,
  withCredentials: true,
});

// ── Request Interceptor: Attach JWT Token ────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor: Handle 401 + Token Refresh ─────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we have a refresh token, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorCode = error.response?.data?.code;

      // Only try refresh for expired tokens, not invalid ones
      if (errorCode === 'TOKEN_EXPIRED') {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          originalRequest._retry = true;
          try {
            const res = await api.post('/auth/refresh-token', { refreshToken });
            const newToken = res.data?.data?.token;
            const newRefreshToken = res.data?.data?.refreshToken;

            if (newToken) {
              localStorage.setItem('token', newToken);
              if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            }
          } catch {
            // Refresh failed, clear everything
          }
        }
      }

      // Clear auth state if refresh failed or no refresh token
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/forgot-password') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    // Provide more descriptive error for network errors
    if (!error.response) {
      error.message = error.code === 'ECONNABORTED'
        ? 'Request timed out. The server may be waking up — please try again.'
        : 'Network error. Please check your internet connection.';
    }

    return Promise.reject(error);
  }
);

// ── API Endpoints ────────────────────────────────────────────────────────────

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  updateProfile: (data) => api.put('/auth/profile', data),
  uploadProfileImage: (formData) => api.post('/auth/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  changePassword: (currentPassword, newPassword) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getTeachers: () => api.get('/users/teachers'),
  getStudents: (params) => api.get('/users/students', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  promote: (id) => api.post(`/users/${id}/promote`),
  promoteSemester: (data) => api.post('/users/promote-semester', data),
};

export const departmentAPI = {
  getAll: () => api.get('/departments'),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

export const subjectAPI = {
  getAll: (params) => api.get('/subjects', { params }),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
  assignTeacher: (id, teacherId) => api.post(`/subjects/${id}/assign-teacher`, { teacherId }),
};

export const attendanceAPI = {
  getAll: (params) => api.get('/attendance', { params }),
  mark: (records) => api.post('/attendance', { records }),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  getStudent: (id, params) => api.get(`/attendance/student/${id}`, { params }),
  getStats: (id) => api.get(`/attendance/stats/student/${id}`),
};

export const timetableAPI = {
  getAll: (params) => api.get('/timetables', { params }),
  create: (data) => api.post('/timetables', data),
  update: (id, data) => api.put(`/timetables/${id}`, data),
  delete: (id) => api.delete(`/timetables/${id}`),
};

export const quizAPI = {
  getAll: (params) => api.get('/quizzes', { params }),
  getById: (id) => api.get(`/quizzes/${id}`),
  create: (data) => api.post('/quizzes', data),
  update: (id, data) => api.put(`/quizzes/${id}`, data),
  delete: (id) => api.delete(`/quizzes/${id}`),
  publish: (id) => api.post(`/quizzes/${id}/publish`),
  attempt: (id, answers, timeSpent) => api.post(`/quizzes/${id}/attempt`, { answers, timeSpent }),
  getAttempts: (id) => api.get(`/quizzes/${id}/attempts`),
  getMyAttempts: () => api.get('/quizzes/attempts/my'),
};

export const resultAPI = {
  getAll: (params) => api.get('/results', { params }),
  create: (results, pdfFile) => {
    if (pdfFile) {
      const formData = new FormData();
      formData.append('results', JSON.stringify(results));
      formData.append('pdfFile', pdfFile);
      return api.post('/results', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/results', { results });
  },
  approve: (id) => api.put(`/results/${id}/approve`),
  reject: (id) => api.put(`/results/${id}/reject`),
  delete: (id) => api.delete(`/results/${id}`),
  getPending: () => api.get('/results/pending'),
  getStudent: (id) => api.get(`/results/student/${id}`),
  getById: (id) => api.get(`/results/${id}`),
};

export const challanAPI = {
  getAll: (params) => api.get('/challans', { params }),
  create: (data, pdfFile) => {
    if (pdfFile) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
      });
      formData.append('pdfFile', pdfFile);
      return api.post('/challans', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/challans', data);
  },
  update: (id, data) => api.put(`/challans/${id}`, data),
  delete: (id) => api.delete(`/challans/${id}`),
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  create: (data) => api.post('/notifications', data),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export const activityLogAPI = {
  getAll: (params) => api.get('/activity-logs', { params }),
};

export const statsAPI = {
  getAdmin: () => api.get('/dashboard/admin'),
  getTeacher: () => api.get('/dashboard/teacher'),
  getStudent: () => api.get('/dashboard/student'),
};

export const libraryAPI = {
  getBooks: (params) => api.get('/library/books', { params }),
  createBook: (data) => api.post('/library/books', data),
  updateBook: (id, data) => api.put(`/library/books/${id}`, data),
  deleteBook: (id) => api.delete(`/library/books/${id}`),
  getIssues: (params) => api.get('/library/issues', { params }),
  issueBook: (data) => api.post('/library/issue', data),
  returnBook: (id) => api.post(`/library/return/${id}`),
  getOverdue: () => api.get('/library/overdue'),
  reserveBook: (data) => api.post('/library/reserve', data),
  getStats: () => api.get('/library/stats'),
};

export const feeStructureAPI = {
  getAll: (params) => api.get('/fee-structures', { params }),
  create: (data) => api.post('/fee-structures', data),
  update: (id, data) => api.put(`/fee-structures/${id}`, data),
  delete: (id) => api.delete(`/fee-structures/${id}`),
  getDefaulters: () => api.get('/fee-structures/defaulters'),
};

export const academicSessionAPI = {
  getAll: () => api.get('/academic-sessions'),
  getActive: () => api.get('/academic-sessions/active'),
  create: (data) => api.post('/academic-sessions', data),
  update: (id, data) => api.put(`/academic-sessions/${id}`, data),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

export const classAPI = {
  getAll: (params) => api.get('/classes', { params }),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
  getSections: (classId) => api.get(`/classes/${classId}/sections`),
  createSection: (classId, data) => api.post(`/classes/${classId}/sections`, data),
};

export const examAPI = {
  getAll: (params) => api.get('/exams', { params }),
  create: (data) => api.post('/exams', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  delete: (id) => api.delete(`/exams/${id}`),
};

export const reportsAPI = {
  getSummary: () => api.get('/reports/summary'),
  exportStudents: () => api.get('/reports/students/export', { responseType: 'text' }),
  exportAttendance: (params) => api.get('/reports/attendance/export', { params, responseType: 'text' }),
  exportFees: () => api.get('/reports/fees/export', { responseType: 'text' }),
};

/**
 * Extract an array of items from an API response, regardless of how the backend wraps it.
 */
export function extractData(response, key) {
  const body = response?.data;
  if (!body) return [];

  if (key && body[key]) {
    return Array.isArray(body[key]) ? body[key] : [];
  }

  if (body.data) {
    if (Array.isArray(body.data)) return body.data;
    if (typeof body.data === 'object') {
      for (const k of ['items', 'users', 'students', 'teachers', 'departments', 'subjects', 'challans', 'books', 'issues', 'logs', 'notifications', 'exams', 'quizzes', 'results', 'attendance', 'timetables', 'classes', 'sections', 'sessions', 'entries', 'activities']) {
        if (Array.isArray(body.data[k])) return body.data[k];
      }
    }
  }

  for (const k of ['users', 'students', 'teachers', 'departments', 'subjects', 'challans', 'books', 'issues', 'logs', 'notifications', 'exams', 'quizzes', 'results', 'attendance', 'timetables', 'classes', 'sections', 'sessions', 'entries', 'activities']) {
    if (Array.isArray(body[k])) return body[k];
  }

  if (Array.isArray(body)) return body;

  return [];
}

export default api;
