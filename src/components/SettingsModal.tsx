import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { ToastType } from './Toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: {
    id: string;
    username: string;
    full_name: string | null;
    bg_color?: string;
  };
  onUpdate: (newData: { username: string, full_name: string, bg_color: string }) => void;
  showToast: (message: string, type: ToastType) => void;
}

const PASTEL_COLORS = [
  { name: 'Cinza', value: '#f0f0f0' },
  { name: 'Areia', value: '#f5f5dc' },
  { name: 'Céu', value: '#e0f2f7' },
  { name: 'Rosa', value: '#fce4ec' },
  { name: 'Menta', value: '#e8f5e9' },
  { name: 'Lavanda', value: '#f3e5f5' },
  { name: 'Pêssego', value: '#fff3e0' },
];

export const SettingsModal = ({ isOpen, onClose, currentProfile, onUpdate, showToast }: SettingsModalProps) => {
  const [formData, setFormData] = useState({
    username: currentProfile.username,
    full_name: currentProfile.full_name || '',
    bg_color: currentProfile.bg_color || '#f0f0f0'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      username: currentProfile.username,
      full_name: currentProfile.full_name || '',
      bg_color: currentProfile.bg_color || '#f0f0f0'
    });
  }, [currentProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error, data } = await supabase
        .from('profiles')
        .update({
          username: formData.username.toLowerCase().trim(),
          full_name: formData.full_name.trim(),
          bg_color: formData.bg_color
        })
        .eq('id', currentProfile.id)
        .select();

      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        if (error.code === '23505') throw new Error('Este @username já está em uso.');
        throw error;
      }

      console.log('Dados atualizados com sucesso:', data);

      onUpdate({
        username: formData.username.toLowerCase().trim(),
        full_name: formData.full_name.trim(),
        bg_color: formData.bg_color
      });
      showToast('Perfil atualizado!', 'success');
      onClose();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
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
            className="z-[5000] fixed inset-0 cursor-default"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="top-1/2 left-1/2 z-[5001] fixed bg-white shadow-2xl p-8 rounded-3xl w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-bold text-black text-2xl">Ajustes</h2>
              <button 
                onClick={onClose}
                className="hover:bg-gray-100 p-2 rounded-full text-gray-500 transition-colors cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="font-semibold text-[11px] text-gray-700 text-sm uppercase tracking-wider">Nome</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="bg-gray-50 p-4 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black w-full transition-all"
                  placeholder="Seu nome"
                />
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-[11px] text-gray-700 text-sm uppercase tracking-wider">Nome de Usuário</label>
                <input
                  required
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-gray-50 p-4 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black w-full transition-all"
                  placeholder="ex: felip"
                />
              </div>

              <div className="space-y-3">
                <label className="font-semibold text-[11px] text-gray-700 text-sm uppercase tracking-wider">Cor de Fundo</label>
                <div className="flex flex-wrap justify-center gap-3 mt-3">
                  {PASTEL_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, bg_color: color.value }))}
                      className={`w-10 h-10 rounded-full border-2 transition-all cursor-pointer ${
                        formData.bg_color === color.value ? 'border-black scale-110 shadow-md' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <button
                disabled={loading}
                className="bg-black disabled:opacity-50 shadow-lg mt-4 py-4 rounded-2xl w-full font-bold text-white text-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
