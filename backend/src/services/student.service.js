const { User } = require('../models');

class StudentService {
  async getAllStudents({ department, semester, status, search, page = 1, limit = 20 }) {
    const query = { role: 'student', isDeleted: false };
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await User.find(query)
      .populate('department', 'name code')
      .select('-password')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);
    return { students, count };
  }

  async promoteSemesters({ department, fromSemester, toSemester }) {
    const result = await User.updateMany(
      { role: 'student', department, semester: fromSemester, isDeleted: false },
      { $set: { semester: toSemester } }
    );
    return result.modifiedCount;
  }
}

module.exports = new StudentService();
