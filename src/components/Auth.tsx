import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Toast } from './Toast';
import type { ToastType } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Reset background and theme color when on Auth page
    const defaultColor = '#f0f0f0';
    document.documentElement.style.backgroundColor = defaultColor;
    document.body.style.backgroundColor = defaultColor;
    document.documentElement.style.setProperty('--color-canvas-bg', defaultColor);
    
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', defaultColor);
    }
  }, []);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
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
          
          // Se o e-mail não precisa de confirmação, já podemos logar
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
      
      // Tradução de erros comuns do Supabase/Postgres
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
    <div className="flex justify-center items-center bg-transparent p-4 h-[100dvh]">
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
      <div className="space-y-8 bg-white shadow-sm p-8 border border-black/5 rounded-3xl w-full max-w-md">
        <div className="overflow-hidden text-center">

          <motion.p 
            key={isSignUp ? 'signup-p' : 'signin-p'}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-gray-500 text-sm"
          >
            {isSignUp ? 'Crie sua conta para começar' : 'Entre na sua prateleira'}
          </motion.p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {isSignUp && (
              <motion.div
                key="signup-field"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
                className="overflow-hidden p-1"
              >
                <input
                  required
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                  className="bg-gray-50 p-4 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black w-full font-medium text-sm transition-all"
                  placeholder="Nome de usuário"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-gray-50 p-4 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black w-full font-medium text-sm transition-all"
              placeholder="E-mail"
            />
          </div>

          <div>
            <input
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-gray-50 p-4 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black w-full font-medium text-sm transition-all"
              placeholder="Senha"
            />
          </div>

          <motion.button
            layout
            disabled={loading}
            className="bg-black disabled:opacity-50 shadow-lg py-4 rounded-2xl w-full font-bold text-white text-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            {loading ? 'Processando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </motion.button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-gray-600 text-sm hover:underline cursor-pointer"
          >
            {isSignUp ? 'Já tem uma conta? Entre agora' : 'Não tem conta? Crie uma grátis'}
          </button>
        </div>
      </div>
    </div>
  );
};
