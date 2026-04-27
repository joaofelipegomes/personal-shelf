import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { InfiniteCanvas } from './components/InfiniteCanvas';
import { Auth } from './components/Auth';

function ProfilePage() {
  const { username } = useParams();
  return (
    <div className="w-full h-screen overflow-hidden selection:bg-black/10">
      <InfiniteCanvas username={username} />
    </div>
  );
}

function App() {
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
