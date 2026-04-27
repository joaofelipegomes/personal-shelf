import { motion } from 'framer-motion';
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
  return (
    <motion.div
      drag={isDraggable}
      dragMomentum={false}
      onPointerDown={() => isDraggable && onDragStart()} // Traz para frente ao clicar
      onDragStart={() => isDraggable && onDragStart()}
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
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer shadow-md hover:bg-red-600"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M18 6L6 18M6 6l12 12" />
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
