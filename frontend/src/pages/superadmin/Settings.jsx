import { useState, useEffect } from 'react';
import { settingsAPI, academicSessionAPI, extractData } from '@/services/api';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Save, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminSettings() {
  const { isSuperAdmin } = useAuth();
  const [settings, setSettings] = useState({
    schoolName: '', schoolAddress: '', schoolPhone: '', schoolEmail: '', academicYear: '', currency: 'USD',
  });
  const [sessions, setSessions] = useState([]);
  const [sessionForm, setSessionForm] = useState({ name: '', startDate: '', endDate: '', isActive: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, sess] = await Promise.all([settingsAPI.get(), academicSessionAPI.getAll()]);
        if (s.data.data) setSettings(s.data?.data ?? s.data);
        setSessions(extractData(sess));
      } catch (e) {
        toast.error('Failed to load settings');
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSaveSettings = async () => {
    try {
      await settingsAPI.update(settings);
      toast.success('Settings saved');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    }
  };

  const handleCreateSession = async () => {
    try {
      await academicSessionAPI.create(sessionForm);
      toast.success('Academic session created');
      const sess = await academicSessionAPI.getAll();
      setSessions(extractData(sess));
      setSessionForm({ name: '', startDate: '', endDate: '', isActive: false });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create session');
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-3 sm:p-8 text-center text-[#475569]">Only Super Admin can access settings.</div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-full sm:max-w-3xl overflow-x-hidden">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0F172A] mb-6 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" /> Settings & Configuration
          </h1>

          {loading ? <p className="text-[#94A3B8]">Loading...</p> : (
            <>
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6 mb-6 space-y-4">
                <h2 className="text-sm font-semibold text-[#0F172A]">School Information</h2>
                {['schoolName', 'schoolAddress', 'schoolPhone', 'schoolEmail', 'academicYear', 'currency'].map((field) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-[#475569] mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                    <input
                      value={settings[field] || ''}
                      onChange={(e) => setSettings({ ...settings, [field]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-[#16a34a]"
                    />
                  </div>
                ))}
                <button onClick={handleSaveSettings} className="flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium">
                  <Save className="w-4 h-4" /> Save Settings
                </button>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6">
                <h2 className="text-sm font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Academic Sessions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <input placeholder="Session Name" value={sessionForm.name} onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                  <input type="date" value={sessionForm.startDate} onChange={(e) => setSessionForm({ ...sessionForm, startDate: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                  <input type="date" value={sessionForm.endDate} onChange={(e) => setSessionForm({ ...sessionForm, endDate: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                </div>
                <label className="flex items-center gap-2 text-sm mb-4">
                  <input type="checkbox" checked={sessionForm.isActive} onChange={(e) => setSessionForm({ ...sessionForm, isActive: e.target.checked })} />
                  Set as active session
                </label>
                <button onClick={handleCreateSession} className="px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium mb-4">Add Session</button>
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div key={s._id} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#F8FAFC] rounded-lg text-sm">
                      <span className="font-medium truncate">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#94A3B8] text-xs">{new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()}</span>
                        {s.isActive && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs whitespace-nowrap">Active</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
  );
}
