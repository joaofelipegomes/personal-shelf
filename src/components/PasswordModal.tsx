import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { ToastType } from './Toast';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (message: string, type: ToastType) => void;
}

export const PasswordModal = ({ isOpen, onClose, showToast }: PasswordModalProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      showToast('A senha deve ter no mínimo 6 caracteres', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('As senhas não coincidem', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      showToast('Senha atualizada com sucesso', 'success');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Erro ao atualizar senha', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="z-[6000] fixed inset-0 bg-black/40 cursor-default"
          />
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-0 left-1/2 -translate-x-1/2 z-[6001] fixed flex flex-col bg-white shadow-2xl border border-black/5 rounded-[48px] sm:rounded-b-none w-[calc(100%-24px)] sm:w-[450px] max-h-[92vh] sm:max-h-[95vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="bg-gray-200 rounded-full w-12 h-1.5" />
            </div>

            <div className="flex justify-between items-center p-6 pt-2 mb-2">
              <h2 className="font-bold text-black text-2xl">Alterar Senha</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 px-8 pb-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase px-1">Nova Senha</label>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="bg-gray-50 p-4 pr-12 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black w-full transition-all text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 4.25C11.0058 4.25 10.0648 4.41965 9.18654 4.70497C8.93836 4.78559 8.74992 4.98943 8.689 5.24317C8.62807 5.49691 8.70342 5.76408 8.88794 5.9486L18.9086 15.9693C19.2008 16.2614 19.6741 16.2623 19.9673 15.9713C20.9298 15.016 21.7239 13.9948 22.2078 13.3163C22.461 12.9642 22.75 12.5622 22.75 12C22.75 11.4378 22.4077 10.9616 22.1546 10.6095C21.4487 9.61974 20.1869 8.04576 18.4797 6.71298C16.774 5.38141 14.5706 4.25 12 4.25ZM7.27775 6.21709C7.02388 5.96322 6.62572 5.92487 6.32806 6.12561C4.20574 7.55694 2.60227 9.54781 1.79219 10.6837C1.53904 11.0358 1.25 11.4378 1.25 12C1.25 12.5622 1.59226 13.0384 1.84541 13.3905C2.55126 14.3803 3.81313 15.9542 5.52031 17.287C7.22595 18.6186 9.42944 19.75 12 19.75C14.1829 19.75 16.1016 18.9335 17.6719 17.8744C17.8576 17.7491 17.9776 17.5475 17.9991 17.3245C18.0206 17.1015 17.9413 16.8806 17.7829 16.7223L7.27775 6.21709ZM9.52944 9.5C8.8934 10.136 8.5 11.0147 8.5 11.9853C8.5 13.9264 10.0736 15.5 12.0147 15.5C12.9853 15.5 13.864 15.1066 14.5 14.4706L9.52944 9.5Z" fill="currentColor"></path>
                          <path fillRule="evenodd" clipRule="evenodd" d="M2.29289 2.29289C2.68342 1.90237 3.31658 1.90237 3.70711 2.29289L21.7071 20.2929C22.0976 20.6834 22.0976 21.3166 21.7071 21.7071C21.3166 22.0976 20.6834 22.0976 20.2929 21.7071L2.29289 3.70711C1.90237 3.31658 1.90237 2.68342 2.29289 2.29289Z" fill="currentColor"></path>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path fillRule="evenodd" clipRule="evenodd" d="M5.52031 6.71298C7.22595 5.38141 9.42944 4.25 12 4.25C14.5706 4.25 16.774 5.38141 18.4797 6.71298C20.1869 8.04576 21.4487 9.61974 22.1546 10.6095L22.2078 10.6837C22.461 11.0358 22.75 11.4378 22.75 12C22.75 12.5622 22.461 12.9642 22.2078 13.3163L22.1546 13.3905C21.4487 14.3803 20.1869 15.9542 18.4797 17.287C16.774 18.6186 14.5706 19.75 12 19.75C9.42944 19.75 7.22595 18.6186 5.52031 17.287C3.81313 15.9542 2.55126 14.3803 1.84541 13.3905L1.79219 13.3163C1.53904 12.9642 1.25 11.4378 1.25 12C1.25 11.4378 1.53904 11.0358 1.79219 10.6837L1.84541 10.6095C2.55126 9.61974 3.81313 8.04576 5.52031 6.71298ZM8.5 12C8.5 13.933 10.067 15.5 12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12Z" fill="currentColor"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase px-1">Confirmar Nova Senha</label>
                  <div className="relative">
                    <input
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="bg-gray-50 p-4 pr-12 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black w-full transition-all text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 4.25C11.0058 4.25 10.0648 4.41965 9.18654 4.70497C8.93836 4.78559 8.74992 4.98943 8.689 5.24317C8.62807 5.49691 8.70342 5.76408 8.88794 5.9486L18.9086 15.9693C19.2008 16.2614 19.6741 16.2623 19.9673 15.9713C20.9298 15.016 21.7239 13.9948 22.2078 13.3163C22.461 12.9642 22.75 12.5622 22.75 12C22.75 11.4378 22.4077 10.9616 22.1546 10.6095C21.4487 9.61974 20.1869 8.04576 18.4797 6.71298C16.774 5.38141 14.5706 4.25 12 4.25ZM7.27775 6.21709C7.02388 5.96322 6.62572 5.92487 6.32806 6.12561C4.20574 7.55694 2.60227 9.54781 1.79219 10.6837C1.53904 11.0358 1.25 11.4378 1.25 12C1.25 12.5622 1.59226 13.0384 1.84541 13.3905C2.55126 14.3803 3.81313 15.9542 5.52031 17.287C7.22595 18.6186 9.42944 19.75 12 19.75C14.1829 19.75 16.1016 18.9335 17.6719 17.8744C17.8576 17.7491 17.9776 17.5475 17.9991 17.3245C18.0206 17.1015 17.9413 16.8806 17.7829 16.7223L7.27775 6.21709ZM9.52944 9.5C8.8934 10.136 8.5 11.0147 8.5 11.9853C8.5 13.9264 10.0736 15.5 12.0147 15.5C12.9853 15.5 13.864 15.1066 14.5 14.4706L9.52944 9.5Z" fill="currentColor"></path>
                          <path fillRule="evenodd" clipRule="evenodd" d="M2.29289 2.29289C2.68342 1.90237 3.31658 1.90237 3.70711 2.29289L21.7071 20.2929C22.0976 20.6834 22.0976 21.3166 21.7071 21.7071C21.3166 22.0976 20.6834 22.0976 20.2929 21.7071L2.29289 3.70711C1.90237 3.31658 1.90237 2.68342 2.29289 2.29289Z" fill="currentColor"></path>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path fillRule="evenodd" clipRule="evenodd" d="M5.52031 6.71298C7.22595 5.38141 9.42944 4.25 12 4.25C14.5706 4.25 16.774 5.38141 18.4797 6.71298C20.1869 8.04576 21.4487 9.61974 22.1546 10.6095L22.2078 10.6837C22.461 11.0358 22.75 11.4378 22.75 12C22.75 12.5622 22.461 12.9642 22.2078 13.3163L22.1546 13.3905C21.4487 14.3803 20.1869 15.9542 18.4797 17.287C16.774 18.6186 14.5706 19.75 12 19.75C9.42944 19.75 7.22595 18.6186 5.52031 17.287C3.81313 15.9542 2.55126 14.3803 1.84541 13.3905L1.79219 13.3163C1.53904 12.9642 1.25 11.4378 1.25 12C1.25 11.4378 1.53904 11.0358 1.79219 10.6837L1.84541 10.6095C2.55126 9.61974 3.81313 8.04576 5.52031 6.71298ZM8.5 12C8.5 13.933 10.067 15.5 12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12Z" fill="currentColor"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className="bg-black text-white shadow-lg mt-6 py-4 rounded-2xl w-full font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
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
