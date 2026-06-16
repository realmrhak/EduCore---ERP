const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  fatherName: { type: String, default: '' },
  motherName: { type: String, default: '' },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
  cnic: { type: String, sparse: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  emergencyContact: { type: String, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'teacher', 'student', 'accountant', 'librarian'],
    default: 'student',
  },
  registrationNumber: { type: String, unique: true, sparse: true },
  employeeId: { type: String, unique: true, sparse: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  semester: { type: Number, default: 1, min: 1, max: 12 },
  academicSession: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession' },
  status: {
    type: String,
    enum: ['Active', 'Graduated', 'Suspended'],
    default: 'Active'
  },
  isDeleted: { type: Boolean, default: false },
  profileImage: { type: String, default: '' },
  assignedSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  salary: { type: Number, default: 0 },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Number },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
}, { timestamps: true });

userSchema.index({ role: 1, department: 1 });
userSchema.index({ status: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ department: 1, semester: 1 });
userSchema.index({ isDeleted: 1, status: 1 });
userSchema.index({ academicSession: 1 });
userSchema.index({ role: 1, isDeleted: 1 });

userSchema.pre('validate', function () {
  if (this.academicSession === '') {
    this.academicSession = undefined;
  }
  if (this.department === '') {
    this.department = undefined;
  }
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.__v;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  return obj;
};

module.exports = mongoose.model('User', userSchema);