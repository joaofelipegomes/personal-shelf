import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { InfiniteCanvas } from './components/InfiniteCanvas';
import { Auth } from './components/Auth';

function ProfilePage() {
  const { username } = useParams();
  return (
    <div className="w-full h-[100dvh] overflow-hidden selection:bg-black/10">
      <InfiniteCanvas username={username} />
    </div>
  );
}

function App() {
  useEffect(() => {
    const handleGestureStart = (e: Event) => e.preventDefault();
    const handleWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };

    document.addEventListener('gesturestart', handleGestureStart);
    document.addEventListener('wheel', handleWheelZoom, { passive: false });

    return () => {
      document.removeEventListener('gesturestart', handleGestureStart);
      document.removeEventListener('wheel', handleWheelZoom);
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* Rota padrão: Login */}
        <Route path="/" element={<Auth />} />
        {/* Rota de Auth explícita */}
        <Route path="/auth" element={<Auth />} />
        {/* Rota dinâmica para qualquer usuário */}
        <Route path="/:username" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
}

export default App;
