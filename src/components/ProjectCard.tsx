import { motion } from 'framer-motion';
import type { ShelfItem } from '../types/item';
import { StarIcon } from './StarIcon';

interface ProjectCardProps {
  project: ShelfItem;
  onPositionChange: (id: string, x: number, y: number) => void;
  zIndex: number;
  onDragStart: () => void;
}

export const ProjectCard = ({ project, onPositionChange, zIndex, onDragStart }: ProjectCardProps) => {
  return (
    <motion.div
      drag
      dragMomentum={false}
      onPointerDown={() => onDragStart()} // Traz para frente ao clicar
      onDragStart={onDragStart}
      onDragEnd={(_, info) => {
        onPositionChange(project.id, project.x + info.offset.x, project.y + info.offset.y);
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02, rotate: 0 }}
      whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        x: project.x,
        y: project.y,
        rotate: project.rotation,
        zIndex: zIndex,
      }}
      className="w-32.5 sm:w-37.5 md:w-45 cursor-grab active:cursor-grabbing"
    >
      <img
        src={project.imagemUrl}
        alt={project.titulo}
        className="block shadow-lg rounded-sm w-full h-auto pointer-events-none"
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
