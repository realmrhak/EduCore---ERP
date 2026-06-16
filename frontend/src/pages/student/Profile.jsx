import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/services/api';
import { motion } from 'framer-motion';
import { User, Mail, Phone, CreditCard, GraduationCap, Building2, Calendar, MapPin, Shield, Printer, Download, Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentProfile() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

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
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Hero Banner */}
        <div className="bg-[#16a34a] rounded-xl p-4 sm:p-8 text-white mb-4 sm:mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
          <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 overflow-hidden">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold">{getInitials(user?.name)}</span>
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
                className="absolute bottom-0 right-0 w-7 h-7 bg-white text-[#16a34a] rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Upload photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl font-semibold">{user?.name}</h1>
              <p className="text-sm text-white/70">{user?.registrationNumber || 'No Registration Number'}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">Active Student</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">{user?.department?.name || 'No Department'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6">
              <h3 className="text-base font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#16a34a]" /> Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                  <User className="w-4 h-4 text-[#94A3B8]" />
                  <div><p className="text-xs text-[#94A3B8]">Full Name</p><p className="text-sm font-medium text-[#0F172A]">{user?.name}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                  <User className="w-4 h-4 text-[#94A3B8]" />
                  <div><p className="text-xs text-[#94A3B8]">Father's Name</p><p className="text-sm font-medium text-[#0F172A]">{user?.fatherName || '-'}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                  <User className="w-4 h-4 text-[#94A3B8]" />
                  <div><p className="text-xs text-[#94A3B8]">Gender</p><p className="text-sm font-medium text-[#0F172A]">{user?.gender || '-'}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                  <CreditCard className="w-4 h-4 text-[#94A3B8]" />
                  <div><p className="text-xs text-[#94A3B8]">CNIC</p><p className="text-sm font-medium text-[#0F172A]">{user?.cnic || '-'}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                  <Phone className="w-4 h-4 text-[#94A3B8]" />
                  <div><p className="text-xs text-[#94A3B8]">Phone</p><p className="text-sm font-medium text-[#0F172A]">{user?.phone || '-'}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                  <Mail className="w-4 h-4 text-[#94A3B8]" />
                  <div><p className="text-xs text-[#94A3B8]">Email</p><p className="text-sm font-medium text-[#0F172A]">{user?.email}</p></div>
                </div>
              </div>
            </div>

            {/* Academic Info */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6">
              <h3 className="text-base font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#16a34a]" /> Academic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                  <Building2 className="w-4 h-4 text-[#94A3B8]" />
                  <div><p className="text-xs text-[#94A3B8]">Department</p><p className="text-sm font-medium text-[#0F172A]">{user?.department?.name || '-'}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                  <GraduationCap className="w-4 h-4 text-[#94A3B8]" />
                  <div><p className="text-xs text-[#94A3B8]">Current Semester</p><p className="text-sm font-medium text-[#0F172A]">Semester {user?.semester || '-'}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                  <Calendar className="w-4 h-4 text-[#94A3B8]" />
                  <div><p className="text-xs text-[#94A3B8]">Academic Session</p><p className="text-sm font-medium text-[#0F172A]">{user?.academicSession || '-'}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                  <Calendar className="w-4 h-4 text-[#94A3B8]" />
                  <div><p className="text-xs text-[#94A3B8]">Joined Date</p><p className="text-sm font-medium text-[#0F172A]">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</p></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Quick Metrics</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#94A3B8]">Cumulative GPA</p>
                  <p className="text-2xl font-bold text-[#0F172A]">3.45</p>
                  <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-[#16a34a] rounded-full" style={{ width: '86%' }} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">Attendance Rate</p>
                  <p className="text-2xl font-bold text-[#0F172A]">88%</p>
                  <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-[#16a34a] rounded-full" style={{ width: '88%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Last Login */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-[#94A3B8]" />
                <span className="text-xs font-medium text-[#475569] uppercase">Last Login</span>
              </div>
              <p className="text-sm text-[#0F172A] font-medium">{new Date().toLocaleString()}</p>
              <p className="text-xs text-[#94A3B8] mt-1">IP: 192.168.1.105</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-[#E2E8F0]">
          <p className="text-xs text-[#94A3B8]">Data verified as of {new Date().toLocaleDateString()}. Contact Registrar Office for discrepancies.</p>
          <div className="flex gap-2 self-end sm:self-auto">
            <button className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm text-[#475569] hover:border-[#16a34a] shrink-0">
              <Printer className="w-4 h-4" /> Print Profile
            </button>
            <button className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#16a34a] text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-[#15803d] shrink-0">
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
