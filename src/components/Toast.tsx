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
      className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl shadow-sm z-[3000] flex items-center gap-3 border border-black/5 bg-white text-black"
    >
      {type === 'success' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-green-500">
          <path fillRule="evenodd" clipRule="evenodd" d="M1.25 12C1.25 17.9371 6.06294 22.75 12 22.75C17.9371 22.75 22.75 17.9371 22.75 12C22.75 6.06294 17.9371 1.25 12 1.25C6.06294 1.25 1.25 6.06294 1.25 12ZM16.6757 8.26285C17.0828 8.63604 17.1103 9.26861 16.7372 9.67573L11.2372 15.6757C11.0528 15.8768 10.7944 15.9938 10.5217 15.9998C10.249 16.0057 9.98576 15.9 9.79289 15.7071L7.29289 13.2071C6.90237 12.8166 6.90237 12.1834 7.29289 11.7929C7.68342 11.4024 8.31658 11.4024 8.70711 11.7929L10.4686 13.5544L15.2628 8.32428C15.636 7.91716 16.2686 7.88966 16.6757 8.26285Z" fill="currentColor"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-red-500">
          <path d="M12 1.25C17.9371 1.25 22.75 6.06294 22.75 12C22.75 17.9371 17.9371 22.75 12 22.75C6.06294 22.75 1.25 17.9371 1.25 12C1.25 6.06294 6.06294 1.25 12 1.25ZM9.63086 8.22461C9.2381 7.90427 8.65909 7.92689 8.29297 8.29297C7.92698 8.65909 7.90429 9.23813 8.22461 9.63086L8.29297 9.70703L10.5859 12L8.29395 14.293C7.90357 14.6835 7.90344 15.3166 8.29395 15.707C8.68447 16.0972 9.31758 16.0974 9.70801 15.707L12 13.4141L14.292 15.707L14.3682 15.7754C14.7608 16.0957 15.3399 16.0729 15.7061 15.707C16.0721 15.3411 16.0954 14.7619 15.7754 14.3691L15.7061 14.293L13.4131 12L15.707 9.70703L15.7754 9.63086C16.0957 9.23812 16.073 8.65909 15.707 8.29297C15.3409 7.92689 14.7619 7.90427 14.3691 8.22461L14.293 8.29297L12 10.5859L9.70703 8.29297L9.63086 8.22461Z" fill="currentColor"/>
        </svg>
      )}
      <span className="font-medium text-sm tracking-tight">{message}</span>
    </motion.div>
  );
};
