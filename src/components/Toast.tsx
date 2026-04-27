import { motion } from 'framer-motion';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl z-[3000] flex items-center gap-3 border ${
        type === 'success' 
          ? 'bg-white border-green-100 text-green-800' 
          : 'bg-white border-red-100 text-red-800'
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="font-medium text-sm">{message}</span>
    </motion.div>
  );
};
