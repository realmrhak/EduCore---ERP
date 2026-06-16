import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/services/api';
import { motion } from 'framer-motion';
import { UserCircle, Mail, Phone, Building2, GraduationCap, Save, Lock, Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherProfile() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.updateProfile(formData);
      await refreshUser();
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);
      await authAPI.uploadProfileImage(formData);
      await refreshUser();
      toast.success('Profile image updated');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to upload image');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A]">My Profile</h1>
          <p className="text-sm text-[#475569]">View and manage your profile information.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6 text-center">
              <div className="relative inline-block mx-auto mb-4">
                <div className="w-24 h-24 rounded-full bg-[rgba(22,163,74,0.08)] flex items-center justify-center overflow-hidden border-2 border-[#E2E8F0]">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-[#16a34a]">{getInitials(user?.name)}</span>
                  )}
                </div>
                {uploading && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-[#16a34a] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#15803d] transition-colors disabled:opacity-50"
                  title="Upload photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <h3 className="text-lg font-semibold text-[#0F172A]">{user?.name}</h3>
              <p className="text-sm text-[#16a34a] font-medium capitalize">{user?.role === 'teacher' ? 'Teacher' : 'Admin'}</p>
              <div className="mt-4 pt-4 border-t border-[#F1F5F9] space-y-2 text-left">
                <div className="flex items-center gap-2 text-sm text-[#475569]">
                  <Mail className="w-4 h-4 text-[#94A3B8]" />
                  {user?.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-[#475569]">
                  <Building2 className="w-4 h-4 text-[#94A3B8]" />
                  {user?.department?.name || 'Not assigned'}
                </div>
                <div className="flex items-center gap-2 text-sm text-[#475569]">
                  <GraduationCap className="w-4 h-4 text-[#94A3B8]" />
                  ID: {user?.employeeId || user?._id?.slice(-6)}
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#0F172A]">Profile Information</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs text-[#16a34a] font-medium hover:underline"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a] resize-none"
                      rows={3}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-semibold hover:bg-[#15803d] transition-all disabled:opacity-60"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                    <span className="text-sm text-[#475569]">Full Name</span>
                    <span className="text-sm font-medium text-[#0F172A]">{user?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                    <span className="text-sm text-[#475569]">Email</span>
                    <span className="text-sm font-medium text-[#0F172A]">{user?.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                    <span className="text-sm text-[#475569]">Phone</span>
                    <span className="text-sm font-medium text-[#0F172A]">{user?.phone || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                    <span className="text-sm text-[#475569]">Address</span>
                    <span className="text-sm font-medium text-[#0F172A]">{user?.address || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-[#475569]">Department</span>
                    <span className="text-sm font-medium text-[#0F172A]">{user?.department?.name || 'Not assigned'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#0F172A]">Security</h3>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="flex items-center gap-1 text-xs text-[#16a34a] font-medium hover:underline"
                >
                  <Lock className="w-3 h-3" />
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </button>
              </div>

              {showPasswordForm && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={e => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={e => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={e => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-semibold hover:bg-[#15803d] transition-all disabled:opacity-60"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
                    Update Password
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
