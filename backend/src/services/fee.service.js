const { Challan, FeeStructure } = require('../models');
const User = require('../models/User');

class FeeService {
  async getChallans(query, user) {
    const filter = {};
    if (query.student) filter.student = query.student;
    if (query.status) filter.status = query.status;
    if (user.role === 'student') filter.student = user._id;

    const challans = await Challan.find(filter)
      .populate('student', 'name registrationNumber semester department')
      .populate('department', 'name code')
      .sort({ createdAt: -1 });
    return challans;
  }

  async createChallan(data, userId) {
    // Auto-fill semester and department from student record if not provided
    if (data.student && (!data.semester || !data.department)) {
      const student = await User.findById(data.student).select('semester department');
      if (student) {
        if (!data.semester && student.semester) data.semester = student.semester;
        if (!data.department && student.department) data.department = student.department;
      }
    }
    // Default academicSession
    if (!data.academicSession) data.academicSession = '2025-2026';

    const challan = new Challan({ ...data, uploadedBy: userId });
    await challan.save();
    return Challan.findById(challan._id)
      .populate('student', 'name registrationNumber semester department')
      .populate('department', 'name code');
  }

  async updateChallan(id, data) {
    return Challan.findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .populate('student', 'name registrationNumber semester department')
      .populate('department', 'name code');
  }

  async deleteChallan(id) {
    return Challan.findByIdAndDelete(id);
  }

  async getDefaulters() {
    const defaulters = await Challan.find({
      status: { $in: ['Pending', 'Overdue'] },
      dueDate: { $lt: new Date() },
    })
      .populate('student', 'name registrationNumber email phone department semester')
      .populate('department', 'name code')
      .sort({ dueDate: 1 });
    return defaulters;
  }

  async getFeeStructures(filters) {
    const query = { isDeleted: false };
    if (filters.department) query.department = filters.department;
    if (filters.semester) query.semester = parseInt(filters.semester);
    if (filters.academicSession) query.academicSession = filters.academicSession;

    const structures = await FeeStructure.find(query)
      .populate('department', 'name code')
      .sort({ semester: 1 });
    return structures;
  }

  async createFeeStructure(data) {
    const structure = await FeeStructure.create(data);
    return FeeStructure.findById(structure._id).populate('department', 'name code');
  }

  async updateFeeStructure(id, data) {
    return FeeStructure.findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .populate('department', 'name code');
  }

  async deleteFeeStructure(id) {
    return FeeStructure.findByIdAndUpdate(id, { isDeleted: true, isActive: false }, { returnDocument: 'after' });
  }
}

module.exports = new FeeService();
