import { useMotionValue, motion, AnimatePresence, useMotionValueEvent, animate } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { ProjectCard } from './ProjectCard';
import type { ShelfItem } from '../types/item';
import { MoveIcon } from './MoveIcon';
import { PlusIcon } from './PlusIcon';
import { AddItemModal } from './AddItemModal';
import { SettingsModal } from './SettingsModal';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Toast } from './Toast';
import type { ToastType } from './Toast';
import { ConfirmModal } from './ConfirmModal';

const CANVAS_SIZE = 5000;
const ORIGIN_X = CANVAS_SIZE / 2;
const ORIGIN_Y = CANVAS_SIZE / 2;

interface InfiniteCanvasProps {
  username?: string;
}

const getVibrantColor = (hex: string) => {
  // Se for a cor cinza padrão, retorna preto
  if (hex.toLowerCase() === '#f0f0f0') return '#000000';
  
  // Remove o # se existir
  hex = hex.replace('#', '');
  
  // Converte para RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // Converte RGB para HSL para manipular vibração
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Aumenta a saturação para ficar mais "vivo" e ajusta o brilho para contraste
  s = Math.min(s + 0.4, 0.9); // Mais saturado
  l = Math.max(l - 0.2, 0.4); // Um pouco mais escuro que a cor pastel para contraste

  // Converte de volta para RGB
  const hslToRgb = (h: number, s: number, l: number) => {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  const [finalR, finalG, finalB] = hslToRgb(h, s, l);
  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(finalR)}${toHex(finalG)}${toHex(finalB)}`;
};

const getContrastColor = (hex: string) => {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Fórmula de luminância relativa
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

export const InfiniteCanvas = ({ username }: InfiniteCanvasProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const [zoomDisplay, setZoomDisplay] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastTouchDistance = useRef<number | null>(null);
  const navigate = useNavigate();
  
  const [items, setItems] = useState<ShelfItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [maxZIndex, setMaxZIndex] = useState(10);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [profileData, setProfileData] = useState<{id: string, username: string, full_name: string | null, bg_color?: string} | null>(null);
  
  const [isMobile, setIsMobile] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [previewColor, setPreviewColor] = useState<string | null>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useMotionValueEvent(scale, "change", (latest) => {
    setZoomDisplay(Math.round(latest * 100));
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Se o target estiver dentro de um modal ou menu, não interfere
      if ((e.target as HTMLElement).closest('.z-50') || 
          (e.target as HTMLElement).closest('.z-\\[2001\\]') || 
          (e.target as HTMLElement).closest('.z-\\[5001\\]')) {
        return;
      }

      e.preventDefault();
      const delta = -e.deltaY;
      const zoomSpeed = 0.002;
      const currentScale = scale.get();
      const factor = 1 + (delta * zoomSpeed);
      const newScale = Math.min(Math.max(currentScale * factor, 0.1), 3);
      scale.set(newScale);
    };

    const getDistance = (touches: React.TouchList | TouchList) => {
      return Math.sqrt(
        Math.pow(touches[0].clientX - touches[1].clientX, 2) +
        Math.pow(touches[0].clientY - touches[1].clientY, 2)
      );
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastTouchDistance.current = getDistance(e.touches);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastTouchDistance.current !== null) {
        // Se o target estiver dentro de um modal ou menu, não interfere
        if ((e.target as HTMLElement).closest('.z-50') || 
            (e.target as HTMLElement).closest('.z-\\[2001\\]') || 
            (e.target as HTMLElement).closest('.z-\\[5001\\]')) {
          return;
        }

        e.preventDefault();
        const distance = getDistance(e.touches);
        const factor = distance / lastTouchDistance.current;
        
        const currentScale = scale.get();
        const newScale = Math.min(Math.max(currentScale * factor, 0.1), 3);
        
        scale.set(newScale);
        lastTouchDistance.current = distance;
      }
    };

    const handleTouchEnd = () => {
      lastTouchDistance.current = null;
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scale]);

  useEffect(() => {
    async function loadShelf() {
      if (!username) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setNotFound(false);
      try {
        const { data: profile, error: profileError } = await supabase.from('profiles').select('id, username, full_name, bg_color').eq('username', username.toLowerCase()).single();
        if (profileError || !profile) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setProfileData(profile);
        const { data: shelfItems } = await supabase.from('shelf_items').select('*').eq('user_id', profile.id);
        if (shelfItems) {
          const mappedItems = shelfItems.map((i: any) => ({ ...i, imagemUrl: i.imagem_url, zIndex: i.z_index }));
          setItems(mappedItems);
          const maxZ = shelfItems.length > 0 ? Math.max(...shelfItems.map((i: any) => i.z_index || 1), 10) : 10;
          setMaxZIndex(maxZ);
        }
        const { data: { user } } = await supabase.auth.getUser();
        setIsOwner(user?.id === profile.id);
        setCurrentUserId(user?.id || null);
      } catch (err) {
        console.error('Erro ao carregar prateleira:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadShelf();
  }, [username]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    navigate('/');
  };

  const deleteItem = async (id: string) => {
    if (!isOwner) return;
    const { error } = await supabase.from('shelf_items').delete().eq('id', id);
    if (!error) {
      setItems(prev => prev.filter(item => item.id !== id));
      showToast('Item removido!', 'success');
    } else {
      showToast('Erro ao deletar: ' + error.message, 'error');
    }
  };

  const savePosition = async (id: string, updates: Partial<ShelfItem>) => {
    if (!isOwner) return;
    await supabase.from('shelf_items').update({ x: updates.x, y: updates.y, rotation: updates.rotation, z_index: updates.zIndex }).eq('id', id);
  };

  const handlePositionChange = (id: string, newX: number, newY: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, x: newX, y: newY } : item));
    const item = items.find(i => i.id === id);
    if (item && isOwner) savePosition(id, { x: newX, y: newY, rotation: item.rotation, zIndex: item.zIndex });
    setIsDraggingCard(false);
  };

  const bringToFront = (id: string) => {
    const newZ = maxZIndex + 1;
    setMaxZIndex(newZ);
    setItems(prev => prev.map(item => item.id === id ? { ...item, zIndex: newZ } : item));
    const item = items.find(i => i.id === id);
    if (item && isOwner) savePosition(id, { x: item.x, y: item.y, rotation: item.rotation, zIndex: newZ });
    setIsDraggingCard(true);
  };

  const addItem = async (data: any) => {
    if (!currentUserId || !isOwner) return;
    const newZ = maxZIndex + 1;
    setMaxZIndex(newZ);
    const currentScale = scale.get();
    
    // Pegar dimensões reais do container para centralização precisa
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
    
    const viewportCenterX = ORIGIN_X + (containerWidth / 2 - x.get() - ORIGIN_X) / currentScale;
    const viewportCenterY = ORIGIN_Y + (containerHeight / 2 - y.get() - ORIGIN_Y) / currentScale;
    
    const cardWidth = isMobile ? 130 : 180;
    const cardHeight = isMobile ? 180 : 250;
    
    let rotation = 0;
    if (data.isAutoRotation) {
      rotation = (Math.random() * 10) - 5;
    } else {
      if (data.rotationType === 'left') rotation = -8;
      else if (data.rotationType === 'right') rotation = 8;
      else rotation = 0;
    }

    const newItemData = { 
      user_id: currentUserId, 
      titulo: data.titulo, 
      nota: data.nota, 
      imagem_url: data.imagemUrl, 
      x: viewportCenterX - (cardWidth / 2), 
      y: viewportCenterY - (cardHeight / 2), 
      rotation, 
      z_index: newZ 
    };
    const { data: savedItem, error } = await supabase.from('shelf_items').insert([newItemData]).select().single();
    if (error) {
      showToast('Erro ao salvar item: ' + error.message, 'error');
    } else if (savedItem) {
      setItems(prev => [...prev, { ...savedItem, imagemUrl: savedItem.imagem_url, zIndex: savedItem.z_index } as ShelfItem]);
      showToast('Item adicionado!', 'success');
    }
  };

  const updateProfile = (newData: any) => {
    setProfileData(prev => prev ? { ...prev, ...newData } : null);
    if (newData.username !== username) navigate(`/${newData.username}`);
  };

  useEffect(() => {
    if (isMobile) {
      scale.set(0.7);
    }
    x.set(-(ORIGIN_X - window.innerWidth / 2));
    y.set(-(ORIGIN_Y - window.innerHeight / 2));
  }, [isMobile, x, y, scale]);

  useEffect(() => {
    const handleGlobalUp = () => setIsDraggingCard(false);
    window.addEventListener('pointerup', handleGlobalUp);
    return () => window.removeEventListener('pointerup', handleGlobalUp);
  }, []);

  const displayName = profileData?.full_name ? profileData.full_name.split(' ')[0] : (profileData?.username || username);
  const currentBgColor = previewColor || profileData?.bg_color || '#f0f0f0';
  const buttonColor = getVibrantColor(currentBgColor);
  const buttonTextColor = getContrastColor(buttonColor);

  useEffect(() => {
    // Atualiza a cor da barra de status e áreas seguras no mobile (Safari/Chrome)
    document.documentElement.style.backgroundColor = currentBgColor;
    document.body.style.backgroundColor = currentBgColor;
    document.documentElement.style.setProperty('--color-canvas-bg', currentBgColor);
    
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', currentBgColor);
    }
  }, [currentBgColor]);

  if (loading) return (
    <div 
      className="flex justify-center items-center w-full h-[100dvh] transition-colors duration-500" 
      style={{ backgroundColor: currentBgColor }}
    >
      <p 
        className="font-medium text-sm uppercase tracking-widest animate-pulse opacity-40"
        style={{ color: getContrastColor(currentBgColor) }}
      >
        Carregando prateleira...
      </p>
    </div>
  );
  if (notFound) return <div className="flex flex-col justify-center items-center bg-[#f0f0f0] p-6 w-full h-[100dvh] text-center"><h2 className="font-bold text-black text-2xl">Prateleira não encontrada</h2><p className="mt-2 text-gray-500">O usuário @{username} ainda não criou sua prateleira.</p><button onClick={() => navigate('/')} className="bg-black mt-6 px-6 py-3 rounded-2xl font-bold text-white hover:scale-105 transition-transform cursor-pointer">Ir para o Início</button></div>;

  return (
    <div ref={containerRef} className="relative w-full h-[100dvh] overflow-hidden transition-colors duration-500 touch-none" style={{ backgroundColor: currentBgColor }}>
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <ConfirmModal isOpen={!!confirmDelete} title="Excluir item" message="Tem certeza que deseja remover este item da sua coleção? Essa ação não pode ser desfeita." onConfirm={() => confirmDelete && deleteItem(confirmDelete)} onCancel={() => setConfirmDelete(null)} />

      {profileData && (
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => { setIsSettingsOpen(false); setPreviewColor(null); }} 
          currentProfile={profileData as any} 
          onUpdate={updateProfile} 
          onPreviewColorChange={setPreviewColor}
          showToast={showToast} 
        />
      )}

      {/* Menu Superior Expansível Verticalmente */}
      <div ref={menuRef} className="top-6 left-6 z-50 fixed flex flex-col items-start gap-2 pointer-events-none">
        <button 
          onClick={() => isOwner && setIsMenuOpen(!isMenuOpen)}
          className={`pointer-events-auto bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-black/5 flex items-center justify-center gap-2 transition-all ${isOwner ? 'hover:bg-gray-50 cursor-pointer active:scale-95' : 'cursor-default'}`}
        >
          {isOwner && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15.75 10C15.75 7.92893 14.0711 6.25 12 6.25C9.92893 6.25 8.25 7.92893 8.25 10C8.25 12.0711 9.92893 13.75 12 13.75C14.0711 13.75 15.75 12.0711 15.75 10Z" fill="currentColor" />
              <path d="M20.7955 12C20.7955 7.1424 16.8576 3.20455 12 3.20455C7.1424 3.20455 3.20455 7.1424 3.20455 12C3.20455 16.8576 7.1424 20.7955 12 20.7955C16.8576 20.7955 20.7955 16.8576 20.7955 12ZM22.75 12C22.75 17.9371 17.9371 22.75 12 22.75C6.06294 22.75 1.25 17.9371 1.25 12C1.25 6.06294 6.06294 1.25 12 1.25C17.9371 1.25 22.75 6.06294 22.75 12Z" fill="currentColor" />
              <path d="M18.75 20.001C18.75 16.2732 15.728 13.25 12 13.25C8.27196 13.25 5.25 16.2732 5.25 20.001C5.25008 20.2368 5.36127 20.459 5.5498 20.6006C7.3465 21.9501 9.58092 22.75 12 22.75C14.4191 22.75 16.6535 21.9501 18.4502 20.6006C18.6387 20.459 18.7499 20.2368 18.75 20.001Z" fill="currentColor" />
            </svg>
          )}
          <span className="font-bold text-black text-sm uppercase tracking-tight">{displayName}</span>
        </button>

        <AnimatePresence>
          {isMenuOpen && isOwner && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-start gap-2 pointer-events-auto"
            >
              <button 
                onClick={() => { setIsSettingsOpen(true); setIsMenuOpen(false); }}
                className="flex items-center gap-2 bg-white/80 hover:bg-gray-50 shadow-sm backdrop-blur-md px-4 py-2 border border-black/5 rounded-2xl font-bold text-black text-sm whitespace-nowrap active:scale-95 transition-all cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M15.8964 2.30109C15.3763 2.24998 14.7443 2.24999 13.9741 2.25H13.9741L10.0259 2.25H10.0259C9.25571 2.24999 8.62365 2.24998 8.10357 2.30109C7.55891 2.35461 7.07864 2.46829 6.62404 2.72984C6.16937 2.99144 5.82995 3.34942 5.51044 3.79326C5.20544 4.21693 4.88869 4.76293 4.50285 5.42801L2.54214 8.80762L2.54214 8.80762C2.15475 9.47532 1.83673 10.0235 1.61974 10.5002C1.39243 10.9996 1.25 11.4737 1.25 12C1.25 12.5263 1.39243 13.0004 1.61974 13.4998C1.83673 13.9766 2.15475 14.5247 2.54214 15.1924L4.50282 18.5719C4.88867 19.237 5.20543 19.7831 5.51044 20.2067C5.82995 20.6506 6.16937 21.0086 6.62404 21.2702C7.07864 21.5317 7.55891 21.6454 8.10357 21.6989C8.62366 21.75 9.25573 21.75 10.026 21.75L13.974 21.75C14.7443 21.75 15.3763 21.75 15.8964 21.6989C16.4411 21.6454 16.9214 21.5317 17.376 21.2702C17.8306 21.0086 18.17 20.6506 18.4896 20.2067C18.7945 19.7831 19.1113 19.2371 19.4971 18.5721L19.4971 18.572L21.4579 15.1924L21.4579 15.1923C21.8453 14.5246 22.1633 13.9765 22.3803 13.4998C22.6076 13.0004 22.75 12.5263 22.75 12C22.75 11.4737 22.6076 10.9996 22.3803 10.5002C22.1633 10.0235 21.8453 9.47535 21.4579 8.80767L19.4972 5.42801C19.1113 4.76293 18.7946 4.21694 18.4896 3.79326C18.1701 3.34942 17.8306 2.99144 17.376 2.72984C16.9214 2.46829 16.4411 2.35461 15.8964 2.30109ZM12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z" fill="currentColor" />
                </svg>
                Ajustes
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white/80 hover:bg-red-50 shadow-sm backdrop-blur-md px-4 py-2 border border-black/5 rounded-2xl font-bold text-red-500 text-sm whitespace-nowrap active:scale-95 transition-all cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12.8047 1.25403C13.5272 1.22641 14.1992 1.33335 14.7617 1.80189L14.8633 1.89271C15.3521 2.35212 15.5566 2.95757 15.6523 3.62806C15.75 4.31254 15.75 5.19262 15.75 6.25696V17.7443C15.75 18.8083 15.75 19.6878 15.6523 20.3722C15.5566 21.0427 15.3521 21.6481 14.8633 22.1076L14.7617 22.1984C14.1991 22.667 13.5272 22.7738 12.8047 22.7462C12.2782 22.7261 11.6504 22.6298 10.918 22.5011L10.1504 22.3634L7.15039 21.8185L7.10742 21.8107C6.36019 21.6751 5.73189 21.5611 5.23633 21.4064C4.77688 21.2629 4.36492 21.0658 4.02832 20.7306L3.88867 20.5792C3.52921 20.1493 3.38117 19.6519 3.31348 19.1066C3.24994 18.5947 3.24997 17.9609 3.25 17.2081V6.79212C3.24997 6.03933 3.24993 5.40562 3.31348 4.89368C3.38118 4.34837 3.52919 3.85098 3.88867 3.42103L4.02832 3.26966C4.36491 2.93446 4.77689 2.73732 5.23633 2.59388C5.73188 2.43917 6.36022 2.32517 7.10742 2.18958L7.15039 2.18177L10.1504 1.63685L10.918 1.49915C11.6504 1.37043 12.2782 1.27418 12.8047 1.25403ZM12 11.0001C11.4477 11.0001 11 11.4478 11 12.0001V12.0099L11.0049 12.1124C11.0561 12.6167 11.4822 13.0099 12 13.0099C12.5178 13.0099 12.9439 12.6167 12.9951 12.1124L13 12.0099V12.0001C13 11.4478 12.5523 11.0001 12 11.0001Z" fill="currentColor" />
                  <path d="M18.75 17.7499V6.24974C18.75 5.73206 18.3567 5.30595 17.8525 5.25462L17.6475 5.24486C17.1433 5.19352 16.75 4.76742 16.75 4.24974C16.75 3.69745 17.1977 3.24974 17.75 3.24974C19.4069 3.24974 20.75 4.59288 20.75 6.24974V17.7499C20.75 19.4067 19.4069 20.7499 17.75 20.7499C17.1977 20.7499 16.75 20.3022 16.75 19.7499C16.75 19.2322 17.1433 18.8061 17.6475 18.7548L17.8525 18.745C18.3567 18.6937 18.75 18.2675 18.75 17.7499Z" fill="currentColor" />
                </svg>
                Sair
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        drag
        dragListener={!isDraggingCard}
        dragMomentum={true}
        dragTransition={{ power: 0.2, timeConstant: 200 }}
        style={{ x, y }}
        className="absolute w-1250 h-1250 cursor-grab active:cursor-grabbing"
      >
        <motion.div 
          style={{ 
            scale, 
            transformOrigin: `${ORIGIN_X}px ${ORIGIN_Y}px`,
            width: '100%',
            height: '100%'
          }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          <div 
            className="absolute flex items-center gap-3 opacity-20 text-black pointer-events-none select-none"
            style={{ 
              left: ORIGIN_X, 
              top: ORIGIN_Y, 
              transform: 'translate(-50%, -50%)' 
            }}
          >
            <MoveIcon />
            <p className="font-semibold text-base uppercase tracking-tight whitespace-nowrap">
              Arraste para mover
            </p>
          </div>

          {items.map((item) => (
            <ProjectCard 
              key={item.id} 
              project={item} 
              onPositionChange={handlePositionChange} 
              zIndex={item.zIndex || 1} 
              onDragStart={() => bringToFront(item.id)} 
              onDelete={isOwner ? (id) => setConfirmDelete(id) : undefined} 
              isDraggable={true} 
              canvasScale={scale.get()}
            />
          ))}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {zoomDisplay !== 100 && (
          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => {
              animate(scale, 1, {
                type: "spring",
                bounce: 0,
                duration: 0.5
              });
            }}
            className="bottom-8 left-8 z-50 fixed bg-white/80 hover:bg-white shadow-sm backdrop-blur-md px-3 py-1.5 border border-black/5 rounded-full font-bold text-[10px] text-black/60 hover:text-black active:scale-90 transition-all cursor-pointer pointer-events-auto select-none"
          >
            {zoomDisplay}%
          </motion.button>
        )}
      </AnimatePresence>

      <button
        onClick={() => isOwner ? setIsModalOpen(true) : navigate('/')}
        className="right-8 bottom-8 z-[1000] fixed flex justify-center items-center shadow-sm shadow-xl border border-black/5 rounded-full w-14 h-14 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
        style={{ backgroundColor: buttonColor, color: buttonTextColor }}
      >
        <PlusIcon size={28} />
      </button>

      {isOwner && (
        <AddItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addItem} buttonColor={buttonColor} />
      )}
    </div>
  );
};
