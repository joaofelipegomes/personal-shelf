import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { InfiniteCanvas } from './components/InfiniteCanvas';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import { LoadingScreen } from './components/LoadingScreen';

function ProfilePage({ isPasswordRecovery, onRecoveryComplete }: { isPasswordRecovery?: boolean; onRecoveryComplete?: () => void }) {
  const { username } = useParams();
  
  useEffect(() => {
    document.documentElement.classList.add('canvas-mode');
    document.body.classList.add('canvas-mode');
    return () => {
      document.documentElement.classList.remove('canvas-mode');
      document.body.classList.remove('canvas-mode');
    };
  }, []);

  return (
    <div className="fixed inset-0 selection:bg-black/10">
      <InfiniteCanvas username={username} isPasswordRecovery={isPasswordRecovery} onRecoveryComplete={onRecoveryComplete} />
    </div>
  );
}

let renderCount = 0;

function App() {
  const [session, setSession] = useState<any>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  renderCount++;
  console.log(`App render #${renderCount}, loading=${loading}, session=${!!session}, username=${username}`);

  useEffect(() => {
    const handleGestureStart = (e: Event) => e.preventDefault();
    const handleWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };

    document.addEventListener('gesturestart', handleGestureStart);
    document.addEventListener('wheel', handleWheelZoom, { passive: false });

    // Auth logic
    const fetchProfile = async (userId: string) => {
      try {
        const profilePromise = supabase
          .from('profiles')
          .select('username')
          .eq('id', userId)
          .single();
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
        );

        const { data: profile } = await Promise.race([profilePromise, timeoutPromise]) as any;
        return profile?.username || null;
      } catch (err) {
        console.error('Error fetching profile:', err);
        return null;
      }
    };

    const initAuth = async () => {
      console.log('App: Starting initAuth');
      
      try {
        // 1. Get session (fastest way to check if logged in)
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        
        // 2. Decide if we need to fetch the profile
        // Only fetch profile if we are at root/auth and need to redirect to the user's shelf
        const isRootPath = window.location.pathname === '/' || window.location.pathname === '/auth';
        
        if (initialSession?.user && isRootPath) {
          console.log('App: User found in session and on root path, fetching profile for redirection');
          const uname = await fetchProfile(initialSession.user.id);
          setUsername(uname);
        }
      } catch (error) {
        console.error('App: Auth initialization error:', error);
      } finally {
        console.log('App: initAuth finished');
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('App: onAuthStateChange event:', event);
      
      // Só atualiza o estado se o ID do usuário mudar ou se a sessão expirar
      setSession(newSession);
      
      if (newSession?.user) {
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
          const uname = await fetchProfile(newSession.user.id);
          setUsername(uname);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const uname = await fetchProfile(newSession.user.id);
          setUsername(uname);
        }
      } else {
        setUsername(null);
      }
    });

    return () => {
      document.removeEventListener('gesturestart', handleGestureStart);
      document.removeEventListener('wheel', handleWheelZoom);
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>
        {/* Rota padrão: Se estiver logado e tiver username, vai pro profile. Senão, Auth. */}
        <Route 
          path="/" 
          element={session && username ? <Navigate to={`/${username}`} replace /> : <Auth />} 
        />
        <Route path="/auth" element={session && username ? <Navigate to={`/${username}`} replace /> : <Auth />} />
        <Route path="/:username" element={<ProfilePage isPasswordRecovery={isPasswordRecovery} onRecoveryComplete={() => setIsPasswordRecovery(false)} />} />
      </Routes>
    </Router>
  );
}

export default App;
