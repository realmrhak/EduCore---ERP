import { useState, useRef } from 'react';
import { authAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { User, Lock, Save, Camera, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProfile() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    emergencyContact: user?.emergencyContact || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await authAPI.updateProfile(profile);
      await refreshUser();
      toast.success('Profile updated');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    }
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await authAPI.changePassword(passwords.currentPassword, passwords.newPassword);
      toast.success('Password changed');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Password change failed');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
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
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-full sm:max-w-2xl overflow-x-hidden">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A] mb-6">Profile Management</h1>

          {/* Profile Image Section */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6 mb-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><Camera className="w-4 h-4 text-[#16a34a]" /> Profile Photo</h2>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group">
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
              <div className="text-center sm:text-left">
                <p className="text-sm font-medium text-[#0F172A]">{user?.name}</p>
                <p className="text-xs text-[#94A3B8]">{user?.email}</p>
                <p className="text-xs text-[#475569] mt-2">Click the camera icon to upload a new photo. Max size: 5MB.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6 mb-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><User className="w-4 h-4 text-[#16a34a]" /> Personal Info</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#475569]">Email</label>
                <input value={user?.email || ''} disabled className="w-full px-3 py-2 border rounded-lg text-sm bg-[#F8FAFC] text-[#94A3B8]" />
              </div>
              <div>
                <label className="text-xs text-[#475569]">Role</label>
                <input value={user?.role || ''} disabled className="w-full px-3 py-2 border rounded-lg text-sm bg-[#F8FAFC] text-[#94A3B8] capitalize" />
              </div>
              {['name', 'phone', 'address', 'emergencyContact'].map((field) => (
                <div key={field}>
                  <label className="text-xs text-[#475569] capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                  <input
                    value={profile[field] || ''}
                    onChange={(e) => setProfile({ ...profile, [field]: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-[#16a34a]"
                  />
                </div>
              ))}
              <button onClick={handleProfileSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium hover:bg-[#15803d] disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</h2>
            <div className="space-y-4">
              {['currentPassword', 'newPassword', 'confirm'].map((field) => (
                <input
                  key={field}
                  type="password"
                  placeholder={field === 'confirm' ? 'Confirm New Password' : field.replace(/([A-Z])/g, ' $1')}
                  value={passwords[field]}
                  onChange={(e) => setPasswords({ ...passwords, [field]: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-[#16a34a]"
                />
              ))}
              <button onClick={handlePasswordChange} className="px-4 py-2 border border-[#16a34a] text-[#16a34a] rounded-lg text-sm font-medium hover:bg-[#16a34a] hover:text-white transition-all">
                Update Password
              </button>
            </div>
          </div>
        </motion.div>
      </div>
  );
}
