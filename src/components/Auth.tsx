import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Toast } from './Toast';
import type { ToastType } from './Toast';
import { AnimatePresence } from 'framer-motion';

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const navigate = useNavigate();

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              { id: authData.user.id, username: username.toLowerCase() }
            ]);

          if (profileError) throw profileError;
          showToast('Conta criada com sucesso!', 'success');
          
          // Se o e-mail não precisa de confirmação, já podemos logar
          setTimeout(() => navigate(`/${username.toLowerCase()}`), 1000);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

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
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black">Personal Shelf</h1>
          <p className="text-gray-500 mt-2">
            {isSignUp ? 'Crie sua conta para começar' : 'Entre na sua prateleira'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="text-sm font-semibold text-gray-700">@username</label>
              <input
                required
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                placeholder="ex: felip"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-gray-700">E-mail</label>
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">Senha</label>
            <input
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg disabled:opacity-50"
          >
            {loading ? 'Processando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-gray-600 hover:underline cursor-pointer"
          >
            {isSignUp ? 'Já tem uma conta? Entre agora' : 'Não tem conta? Crie uma grátis'}
          </button>
        </div>
      </div>
    </div>
  );
};
