const { User } = require('../models');

class TeacherService {
  async getAllTeachers() {
    const teachers = await User.find({ role: { $in: ['admin', 'teacher'] }, isDeleted: false, status: 'Active' })
      .populate('department', 'name code')
      .populate('assignedSubjects', 'name code')
      .select('-password')
      .sort({ name: 1 });
    return teachers;
  }
}

module.exports = new TeacherService();
