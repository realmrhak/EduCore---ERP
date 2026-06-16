const teacherService = require('../services/teacher.service');
const { sendSuccess } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

class TeacherController {
  getTeachers = catchAsync(async (req, res) => {
    const teachers = await teacherService.getAllTeachers();
    return sendSuccess(res, teachers, 'Teachers list fetched');
  });
}

module.exports = new TeacherController();
