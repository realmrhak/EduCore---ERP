const { auth } = require('./auth.middleware');

const {
    requireSuperAdmin,
    requireAdmin,
    requireStaff,
    requireTeacher,
    requireAccountant,
    requireLibrarian,
    requireStudent,
    requireSuperAdminOrTeacher,
    canAccessUser,
} = require('./role.middleware');

module.exports = {
    auth,
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
