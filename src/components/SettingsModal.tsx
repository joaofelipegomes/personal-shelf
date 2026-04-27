import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { ToastType } from './Toast';

const getVibrantColor = (hex: string) => {
  if (hex.toLowerCase() === '#f0f0f0') return '#000000';
  hex = hex.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  } else {
    s = 0;
  }

  s = Math.min(s + 0.4, 0.9);
  l = Math.max(l - 0.2, 0.4);

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  const finalR = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const finalG = Math.round(hue2rgb(p, q, h) * 255);
  const finalB = Math.round(hue2rgb(p, q, h - 1/3) * 255);
  
  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(finalR)}${toHex(finalG)}${toHex(finalB)}`;
};

const getContrastColor = (hex: string) => {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

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
  onPreviewColorChange?: (color: string) => void;
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

export const SettingsModal = ({ isOpen, onClose, currentProfile, onUpdate, onPreviewColorChange, showToast }: SettingsModalProps) => {
  const [formData, setFormData] = useState({
    username: currentProfile.username,
    full_name: currentProfile.full_name || '',
    bg_color: currentProfile.bg_color || '#f0f0f0'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (onPreviewColorChange && isOpen) {
      onPreviewColorChange(formData.bg_color);
    }
  }, [formData.bg_color, isOpen, onPreviewColorChange]);

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
            className="top-1/2 left-1/2 z-[5001] fixed bg-white shadow-2xl shadow-sm border border-black/5 p-8 rounded-3xl w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-bold text-black text-2xl">Ajustes</h2>
              <button 
                onClick={onClose}
                className="hover:bg-gray-100 p-2 rounded-full text-gray-500 transition-colors cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M17.293 5.29295C17.6835 4.90243 18.3165 4.90243 18.707 5.29295C19.0976 5.68348 19.0976 6.31649 18.707 6.70702L13.4131 12L18.7061 17.293L18.7754 17.3691C19.0954 17.7619 19.0721 18.341 18.7061 18.707C18.3399 19.0731 17.7609 19.0958 17.3682 18.7754L17.292 18.707L11.999 13.414L6.70802 18.706C6.3175 19.0966 5.68449 19.0965 5.29396 18.706C4.90344 18.3155 4.90344 17.6825 5.29396 17.292L10.585 12L5.29298 6.70799L5.22462 6.63182C4.90423 6.23907 4.92691 5.66007 5.29298 5.29393C5.65897 4.92794 6.23811 4.9046 6.63087 5.22459L6.70705 5.29393L11.999 10.5859L17.293 5.29295Z" fill="currentColor"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="bg-gray-50 p-4 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black w-full transition-all text-sm font-medium"
                  placeholder="Seu nome"
                />
              </div>

              <div className="space-y-2">
                <input
                  required
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData(prev => ({ ...prev, username: e.target.value.replace(/\s/g, '') }))}
                  className="bg-gray-50 p-4 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black w-full transition-all text-sm font-medium"
                  placeholder="Nome de usuário"
                />
              </div>

              <div className="space-y-3">
                <span className="text-sm font-bold text-black px-1">Cor de fundo</span>
                <div className="flex flex-wrap justify-center gap-3 mt-1">
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
                className="disabled:opacity-50 shadow-lg mt-4 py-4 rounded-2xl w-full font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                style={{ 
                  backgroundColor: getVibrantColor(formData.bg_color),
                  color: getContrastColor(getVibrantColor(formData.bg_color))
                }}
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
