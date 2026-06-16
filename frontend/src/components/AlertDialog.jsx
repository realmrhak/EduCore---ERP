import { useState, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, XCircle, X, ShieldAlert, HelpCircle } from 'lucide-react';

/**
 * Custom Alert/Confirm Dialog — Green themed, dark modal overlay
 * Replaces window.alert() and window.confirm() across all dashboards.
 *
 * Usage:
 *   const { alert, confirm } = useAlertDialog();
 *   await alert('Something happened', { type: 'success' });
 *   const ok = await confirm('Delete this department?');
 *
 * Types: info, success, warning, error, confirm
 * The dialog appears with a dark overlay, icon, title, message, and OK/Cancel buttons.
 */

const AlertDialogContext = createContext(null);

export function useAlertDialog() {
  const ctx = useContext(AlertDialogContext);
  if (!ctx) throw new Error('useAlertDialog must be used within AlertDialogProvider');
  return ctx;
}

const ICON_MAP = {
  info: { icon: Info, color: '#16a34a', bg: 'rgba(22,163,74,0.15)' },
  success: { icon: CheckCircle, color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  warning: { icon: AlertTriangle, color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  error: { icon: XCircle, color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  confirm: { icon: HelpCircle, color: '#16a34a', bg: 'rgba(22,163,74,0.15)' },
  danger: { icon: ShieldAlert, color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
};

export function AlertDialogProvider({ children }) {
  const [dialogs, setDialogs] = useState([]);

  const addDialog = useCallback((dialog) => {
    return new Promise((resolve) => {
      const id = Date.now() + Math.random();
      const dialogObj = { ...dialog, id, resolve };
      setDialogs(prev => [...prev, dialogObj]);
    });
  }, []);

  const removeDialog = useCallback((id) => {
    setDialogs(prev => prev.filter(d => d.id !== id));
  }, []);

  const alert = useCallback((message, options = {}) => {
    return addDialog({
      type: options.type || 'info',
      title: options.title || 'Notification',
      message,
      mode: 'alert',
    });
  }, [addDialog]);

  const confirm = useCallback((message, options = {}) => {
    return addDialog({
      type: options.type || 'confirm',
      title: options.title || 'Confirm Action',
      message,
      confirmText: options.confirmText || 'OK',
      cancelText: options.cancelText || 'Cancel',
      mode: 'confirm',
    });
  }, [addDialog]);

  const handleResolve = useCallback((id, value) => {
    setDialogs(prev => {
      const dialog = prev.find(d => d.id === id);
      if (dialog) dialog.resolve(value);
      return prev.filter(d => d.id !== id);
    });
  }, []);

  return (
    <AlertDialogContext.Provider value={{ alert, confirm }}>
      {children}
      <AnimatePresence>
        {dialogs.map((dialog) => (
          <DialogOverlay key={dialog.id} dialog={dialog} onResolve={handleResolve} />
        ))}
      </AnimatePresence>
    </AlertDialogContext.Provider>
  );
}

function DialogOverlay({ dialog, onResolve }) {
  const { type, title, message, mode, confirmText, cancelText } = dialog;
  const iconConfig = ICON_MAP[type] || ICON_MAP.info;
  const Icon = iconConfig.icon;

  const handleCancel = () => {
    onResolve(dialog.id, false);
  };

  const handleConfirm = () => {
    onResolve(dialog.id, true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={mode === 'alert' ? handleConfirm : undefined}
    >
      {/* Dark semi-transparent overlay with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={mode === 'alert' ? handleConfirm : handleCancel}
          className="absolute top-4 right-4 p-1 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon + Content */}
        <div className="p-6 pb-2">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: iconConfig.bg }}
            >
              <Icon className="w-6 h-6" style={{ color: iconConfig.color }} />
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <h3 className="text-base font-semibold text-white mb-1.5">{title}</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">{message}</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="px-6 py-5 flex items-center justify-end gap-3">
          {mode === 'confirm' && (
            <button
              onClick={handleCancel}
              className="px-5 py-2.5 bg-white/5 text-white/70 rounded-xl text-sm font-medium hover:bg-white/10 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/20 border border-white/5"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1E293B] ${
              type === 'danger' || type === 'error'
                ? 'bg-[#EF4444] text-white hover:bg-[#DC2626] focus:ring-[#EF4444]/50'
                : 'bg-[#22c55e] text-[#052e16] hover:bg-[#16a34a] hover:text-white focus:ring-[#22c55e]/50'
            }`}
          >
            {mode === 'confirm' ? confirmText : 'OK'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AlertDialogProvider;
