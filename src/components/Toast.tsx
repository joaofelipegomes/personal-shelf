import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  x?: number;
  y?: number;
  bgColor?: string;
  textColor?: string;
}

export const Toast = ({ message, type, onClose, x, y, bgColor, textColor }: ToastProps) => {
  const toastRef = useRef<HTMLDivElement>(null);
  const [adjustedX, setAdjustedX] = useState(x || 0);

  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Ajusta a posição X para não sair da tela
  useEffect(() => {
    if (x !== undefined && toastRef.current) {
      const toastWidth = toastRef.current.offsetWidth;
      const screenWidth = window.innerWidth;
      const margin = 20; // Margem de segurança da borda

      let finalX = x;
      
      // Impede de sair pela direita
      if (x + toastWidth / 2 > screenWidth - margin) {
        finalX = screenWidth - toastWidth / 2 - margin;
      }
      
      // Impede de sair pela esquerda
      if (x - toastWidth / 2 < margin) {
        finalX = toastWidth / 2 + margin;
      }

      setAdjustedX(finalX);
    }
  }, [x]);

  const isContextual = x !== undefined && y !== undefined;

  const defaultBg = type === 'error' ? '#ffebee' : '#e8f5e9';
  const defaultText = '#000000';

  return (
    <div 
      className="z-[10000] fixed pointer-events-none"
      style={isContextual ? { 
        left: adjustedX, 
        top: Math.max(20, (y || 0) - 40), // Impede de sair pelo topo
        transform: 'translateX(-50%)' 
      } : { 
        top: '2rem', 
        left: '50%', 
        transform: 'translateX(-50%)' 
      }}
    >
      <motion.div
        ref={toastRef}
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: { type: "spring", stiffness: 400, damping: 25 } 
        }}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
        className="flex justify-center items-center shadow-[0_8px_30px_rgba(0,0,0,0.12)] px-4 py-2 border border-black/[0.04] rounded-full min-w-[100px] pointer-events-auto"
        style={{ 
          backgroundColor: bgColor || defaultBg,
          color: textColor || defaultText
        }}
      >
        <span className="font-semibold text-sm tracking-tight whitespace-nowrap">
          {message}
        </span>
      </motion.div>
    </div>
  );
};