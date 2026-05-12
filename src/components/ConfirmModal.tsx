import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay - Darkened backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 z-[4000] bg-black/40 cursor-default"
          />
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onCancel();
              }
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-3 left-2.5 right-2.5 sm:bottom-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 w-auto sm:w-[450px] bg-white rounded-[32px] sm:rounded-t-[48px] sm:rounded-b-none p-8 pt-2 shadow-2xl border border-black/5 z-[4001] text-center"
          >
            {/* Apple Sheet Handle */}
            <div className="flex justify-center pt-3 pb-6">
              <div className="bg-gray-200 rounded-full w-12 h-1.5" />
            </div>

            <h3 className="text-lg font-bold text-black">{title}</h3>
            <p className="text-gray-500 mt-2 text-sm leading-relaxed">{message}</p>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={onCancel}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onCancel();
                }}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
