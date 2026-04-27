import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { ShelfItem } from '../types/item';
import { StarIcon } from './StarIcon';

interface ProjectCardProps {
  project: ShelfItem;
  onPositionChange: (id: string, x: number, y: number) => void;
  zIndex: number;
  onDragStart: () => void;
  onDelete?: (id: string) => void;
  isDraggable?: boolean;
}

export const ProjectCard = ({ project, onPositionChange, zIndex, onDragStart, onDelete, isDraggable = true }: ProjectCardProps) => {
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!showDelete) return;

    const handleClickOutside = () => setShowDelete(false);
    window.addEventListener('pointerdown', handleClickOutside);
    return () => window.removeEventListener('pointerdown', handleClickOutside);
  }, [showDelete]);

  const handleTap = (e: any) => {
    if (!isDraggable) return;
    
    // Verifica se é touch para evitar comportamento indesejado no desktop
    const isTouch = e.pointerType === 'touch';
    if (isTouch) {
      setShowDelete(!showDelete);
    }
  };

  return (
    <motion.div
      drag={isDraggable}
      dragMomentum={false}
      onPointerDown={() => isDraggable && onDragStart()} // Traz para frente ao clicar
      onTap={handleTap}
      onDragStart={() => {
        if (isDraggable) {
          onDragStart();
          setShowDelete(false);
        }
      }}
      onDragEnd={(_, info) => {
        if (isDraggable) {
          onPositionChange(project.id, project.x + info.offset.x, project.y + info.offset.y);
        }
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={isDraggable ? { scale: 1.02, rotate: 0 } : {}}
      whileDrag={isDraggable ? { scale: 1.05, cursor: 'grabbing' } : {}}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        x: project.x,
        y: project.y,
        rotate: project.rotation,
        zIndex: zIndex,
      }}
      className={`w-32.5 sm:w-37.5 md:w-45 ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} group`}
    >
      {isDraggable && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(project.id);
          }}
          onPointerDown={(e) => e.stopPropagation()} // Evita que o clique no botão ative o clique fora imediatamente
          className={`absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center transition-all z-10 cursor-pointer shadow-md hover:bg-red-600 ${showDelete ? 'opacity-100 scale-110' : 'opacity-0 scale-90 md:group-hover:opacity-100 md:group-hover:scale-100'}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M17.293 5.29295C17.6835 4.90243 18.3165 4.90243 18.707 5.29295C19.0976 5.68348 19.0976 6.31649 18.707 6.70702L13.4131 12L18.7061 17.293L18.7754 17.3691C19.0954 17.7619 19.0721 18.341 18.7061 18.707C18.3399 19.0731 17.7609 19.0958 17.3682 18.7754L17.292 18.707L11.999 13.414L6.70802 18.706C6.3175 19.0966 5.68449 19.0965 5.29396 18.706C4.90344 18.3155 4.90344 17.6825 5.29396 17.292L10.585 12L5.29298 6.70799L5.22462 6.63182C4.90423 6.23907 4.92691 5.66007 5.29298 5.29393C5.65897 4.92794 6.23811 4.9046 6.63087 5.22459L6.70705 5.29393L11.999 10.5859L17.293 5.29295Z" fill="currentColor"/>
          </svg>
        </button>
      )}
      <img
        src={project.imagemUrl}
        alt={project.titulo}
        className="block shadow-lg rounded-sm w-full h-auto pointer-events-none transition-shadow duration-300 group-hover:shadow-2xl"
      />
      
      <div className="mt-2 pointer-events-none">
        <h3 className="font-medium text-[13px] text-black leading-tight">
          {project.titulo}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          {/* Estrela preenchida com cantos arredondados */}
          <StarIcon />
          <span className="font-medium text-[11px] text-gray-500">{project.nota}</span>
        </div>
      </div>
    </motion.div>
  );
};
