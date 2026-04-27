import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: {
    titulo: string;
    nota: number;
    imagemUrl: string;
    descricao: string;
  }) => void;
}

export const AddItemModal = ({ isOpen, onClose, onAdd }: AddItemModalProps) => {
  const [formData, setFormData] = useState({
    titulo: '',
    nota: 5,
    imagemUrl: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imagemUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imagemUrl) {
      alert('Por favor, selecione uma imagem.');
      return;
    }
    onAdd(formData as any);
    setFormData({
      titulo: '',
      nota: 5,
      imagemUrl: '',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay - Invisible but clickable */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="z-[2000] fixed inset-0 cursor-default"
          />
          
          {/* Modal Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="top-4 right-4 bottom-4 z-[2001] fixed flex flex-col bg-white shadow-2xl border border-black/5 rounded-[32px] w-[calc(100%-32px)] sm:w-[400px] overflow-hidden"
          >
            <div className="flex justify-end items-center p-6 pb-0">
              <button 
                onClick={onClose}
                className="hover:bg-gray-100 p-2 rounded-full text-gray-500 transition-colors cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 space-y-6 p-6 overflow-y-auto">
              <div className="space-y-2">
                <label className="font-semibold text-[11px] text-gray-700 text-sm uppercase tracking-wider">Título</label>
                <input
                  required
                  type="text"
                  value={formData.titulo}
                  onChange={e => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  className="bg-gray-50 p-4 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black w-full transition-all"
                  placeholder=""
                />
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-[11px] text-gray-700 text-sm uppercase tracking-wider">Nota ({formData.nota})</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.nota}
                  onChange={e => setFormData(prev => ({ ...prev, nota: parseFloat(e.target.value) }))}
                  className="bg-gray-200 rounded-lg w-full h-2 accent-black appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-[11px] text-gray-700 text-sm uppercase tracking-wider">Foto</label>
                <div className="group relative mt-3">
                  <input
                    required
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="z-10 absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <div className="flex flex-col justify-center items-center bg-gray-50 group-hover:bg-gray-100 border-2 border-gray-200 group-hover:border-gray-300 border-dashed rounded-lg w-full h-32 overflow-hidden transition-all">
                    {formData.imagemUrl ? (
                      <img src={formData.imagemUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                        </svg>
                        <span className="mt-1 font-medium text-gray-500 text-sm">Clique para enviar</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </form>

            <div className="p-6 border-gray-100 border-t">
              <button
                type="submit"
                onClick={handleSubmit}
                className="bg-black shadow-black/10 shadow-lg py-4 rounded-xl w-full font-bold text-white text-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                Adicionar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
