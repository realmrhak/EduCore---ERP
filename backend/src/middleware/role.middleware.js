const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Access denied. Super Admin only.' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!['superadmin', 'admin', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied. Admin/Teacher only.' });
  }
  next();
};

const requireStaff = (req, res, next) => {
  if (!['superadmin', 'admin', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied. Staff only.' });
  }
  next();
};

const requireTeacher = (req, res, next) => {
  if (!['superadmin', 'admin', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied. Teacher/Admin only.' });
  }
  next();
};

const requireAccountant = (req, res, next) => {
  if (!['accountant', 'superadmin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied. Accountant/Admin only.' });
  }
  next();
};

const requireLibrarian = (req, res, next) => {
  if (!['librarian', 'superadmin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied. Librarian/Admin only.' });
  }
  next();
};

const requireStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Access denied. Student only.' });
  }
  next();
};

const requireSuperAdminOrTeacher = (req, res, next) => {
  if (!['superadmin', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied. Super Admin or Teacher only.' });
  }
  next();
};

const canAccessUser = (req, res, next) => {
  const targetId = req.params.id;
  if (
    req.user.role === 'superadmin' ||
    req.user._id.toString() === targetId
  ) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied' });
};

module.exports = {
  requireSuperAdmin,
  requireAdmin,
  requireStaff,
  requireTeacher,
  requireAccountant,
  requireLibrarian,
  requireStudent,
  requireSuperAdminOrTeacher,
  canAccessUser,
};