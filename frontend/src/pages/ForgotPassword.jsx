import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '@/services/api';
import { GraduationCap, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Reset instructions sent if account exists');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#16a34a] to-[#0F172A] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(22,163,74,0.08)] flex items-center justify-center mb-3">
            <GraduationCap className="w-7 h-7 text-[#16a34a]" />
          </div>
          <h1 className="text-xl font-bold text-[#0F172A]">Forgot Password</h1>
          <p className="text-sm text-[#475569] mt-1 text-center">
            Enter your email and we will send reset instructions.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-sm text-[#475569]">
              If an account exists with <strong>{email}</strong>, you will receive reset instructions.
              Check your inbox or contact your administrator.
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-[#16a34a] font-medium">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-[#EF4444] text-sm p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@university.edu"
                  className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#16a34a]"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#16a34a] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#15803d] disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-[#475569] hover:text-[#16a34a]">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
