import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Toast } from './Toast';
import type { ToastType } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';

const StarLogo = () => (
  <div className="flex justify-center items-center mb-6 hover:scale-110 transition-transform transform">
    <img 
      src="/prateleira.png" 
      alt="Logo Prateleira" 
      className="drop-shadow-xl w-20 h-20 object-contain"
    />
  </div>
);

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: ToastType, x?: number, y?: number } | null>(null);
  const navigate = useNavigate();
  const lastClickPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      lastClickPos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('click', handleGlobalClick, true);
    return () => window.removeEventListener('click', handleGlobalClick, true);
  }, []);

  useEffect(() => {
    // Limpa estilos que podem ter vindo do Canvas
    document.documentElement.style.backgroundColor = '';
    document.body.style.backgroundColor = '';
    document.documentElement.style.setProperty('--color-canvas-bg', 'transparent');
    
    // Reset theme color meta
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', '#ffffff');
    }
  }, []);

  const showToast = (message: string, type: ToastType) => {
    setToast({ 
      message, 
      type, 
      x: lastClickPos.current.x, 
      y: lastClickPos.current.y 
    });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) {
          if (authError.message.includes('User already registered') || authError.status === 422) {
            throw new Error('Este e-mail já está cadastrado.');
          }
          throw authError;
        }

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              { id: authData.user.id, username: username.toLowerCase() }
            ]);

          if (profileError) {
            if (profileError.code === '23505') {
              throw new Error('Este nome de usuário já está em uso.');
            }
            throw profileError;
          }
          showToast('Conta criada com sucesso!', 'success');
          
          setTimeout(() => navigate(`/${username.toLowerCase()}`), 1000);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('E-mail ou senha incorretos.');
          }
          throw error;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          navigate(`/${profile.username}`);
        }
      }
    } catch (error: any) {
      let message = error.message || 'Ocorreu um erro inesperado.';
      if (error.code === '23505' || message.includes('unique constraint')) {
        message = 'Este nome de usuário ou e-mail já está em uso.';
      } else if (error.code === '23503' || message.includes('violates foreign key constraint')) {
        message = 'Erro de referência. Por favor, tente novamente.';
      } else if (message.includes('Database error saving new user')) {
        message = 'Erro ao salvar usuário. O nome de usuário pode já existir.';
      }
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex justify-center items-center p-6 min-h-[100dvh] overflow-hidden">
      {/* Background Animado - Aumentado para garantir cobertura total */}
      <div className="top-1/2 left-1/2 -z-10 absolute w-[200vmax] h-[200vmax] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-full h-full animate-rainbow-slow" />
      </div>

      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            x={toast.x}
            y={toast.y}
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 relative space-y-6 bg-white shadow-2xl p-8 md:p-10 border border-black/5 rounded-[32px] w-full max-w-[420px]"
      >
        <div className="flex flex-col items-center text-center">
          <StarLogo />
          <motion.h1 
            key={isSignUp ? 'signup-title' : 'signin-title'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-bold text-gray-900 text-3xl tracking-tight"
          >
            {isSignUp ? 'Criar conta' : 'Bem-vindo de volta'}
          </motion.h1>
          <motion.p 
            key={isSignUp ? 'signup-p' : 'signin-p'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-gray-500"
          >
            {isSignUp ? 'Junte-se a nós e organize seus projetos' : 'Acesse sua prateleira'}
          </motion.p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {isSignUp && (
              <motion.div
                key="signup-field"
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
                className="p-0.5 overflow-hidden"
              >
                <div className="group relative">
                  <input
                    required
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                    className="bg-gray-50 px-5 py-4 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black w-full font-medium text-gray-900 placeholder:text-gray-400 text-sm transition-all"
                    placeholder="Nome de usuário"
                  />
                  <div className="top-1/2 right-4 absolute opacity-0 group-focus-within:opacity-100 transition-opacity -translate-y-1/2 pointer-events-none">
                    <span className="text-gray-300 text-xs">@</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-gray-50 px-5 py-4 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black w-full font-medium text-gray-900 placeholder:text-gray-400 text-sm transition-all"
              placeholder="E-mail"
            />
            <input
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-gray-50 px-5 py-4 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black w-full font-medium text-gray-900 placeholder:text-gray-400 text-sm transition-all"
              placeholder="Senha"
            />
          </div>

          <motion.button
            layout
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="relative bg-black disabled:opacity-50 shadow-black/10 shadow-lg mt-2 border border-black/5 rounded-xl w-full h-[56px] overflow-hidden font-bold text-white text-sm transition-all cursor-pointer"
          >
            <span className="z-10 relative">
              {loading ? (
                <div className="flex justify-center items-center gap-2">
                  <div className="bg-white/30 rounded-full w-1.5 h-1.5 animate-bounce" />
                  <div className="bg-white/30 rounded-full w-1.5 h-1.5 animate-bounce [animation-delay:-0.15s]" />
                  <div className="bg-white/30 rounded-full w-1.5 h-1.5 animate-bounce [animation-delay:-0.3s]" />
                </div>
              ) : isSignUp ? 'Criar minha conta' : 'Entrar na conta'}
            </span>
          </motion.button>
        </form>

        <div className="pt-2 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-gray-500 hover:text-black text-sm transition-colors cursor-pointer"
          >
            {isSignUp ? (
              <span>Já tem uma conta? <strong className="text-black">Entrar</strong></span>
            ) : (
              <span>Não tem conta? <strong className="text-black">Criar uma grátis</strong></span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};