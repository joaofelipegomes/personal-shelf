import { useMotionValue, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ProjectCard } from './ProjectCard';
import type { ShelfItem } from '../types/item';
import { mockItemsBase } from '../data/mockData';
import { MoveIcon } from './MoveIcon';

const CANVAS_SIZE = 5000;
const ORIGIN_X = CANVAS_SIZE / 2;
const ORIGIN_Y = CANVAS_SIZE / 2;

export const InfiniteCanvas = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const [items, setItems] = useState<ShelfItem[]>(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    
    const cellWidth = isMobile ? 180 : 280; 
    const cellHeight = isMobile ? 250 : 380;
    const columns = isMobile ? 3 : 5;

    const generateSpiralPositions = (count: number) => {
      const pos: {dx: number, dy: number, dist: number}[] = [];
      const seen = new Set<string>();
      
      const rangeY = Math.ceil(count / columns) + 1;
      const rangeX = Math.ceil(columns / 2) + 1;

      for (let y = -rangeY; y <= rangeY; y++) {
        for (let x = -rangeX; x <= rangeX; x++) {
          const key = `${x},${y}`;
          if (!(x === 0 && y === 0) && !seen.has(key)) {
            const dist = Math.sqrt((x * 0.7) ** 2 + y ** 2);
            pos.push({ dx: x, dy: y, dist });
            seen.add(key);
          }
        }
      }
      
      return pos
        .sort((a, b) => a.dist - b.dist)
        .slice(0, count);
    };

    const positions = generateSpiralPositions(mockItemsBase.length);

    return mockItemsBase.map((item, index) => {
      const { dx, dy } = positions[index];
    
      const jitterX = (Math.random() * 60) - 30;
      const jitterY = (Math.random() * 150) - 75;

      const rowOffset = (Math.abs(dy) % 2 !== 0) ? cellWidth / 2 : 0;

      const xPos = ORIGIN_X + (dx * cellWidth) + rowOffset + jitterX - 90;
      const yPos = ORIGIN_Y + (dy * (cellHeight * 0.9)) + jitterY - 120;

      const direction = index % 2 === 0 ? 1 : -1;
      const rotation = (2 + Math.random() * 4) * direction;

      return {
        ...item,
        x: xPos,
        y: yPos,
        rotation: rotation
      };
    }) as ShelfItem[];
  });

  const [topItemId, setTopItemId] = useState<string | null>(null);
  const [isDraggingCard, setIsDraggingCard] = useState(false);

  useEffect(() => {
    x.set(-(ORIGIN_X - window.innerWidth / 2));
    y.set(-(ORIGIN_Y - window.innerHeight / 2));
  }, [x, y]);

  const handlePositionChange = (id: string, newX: number, newY: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, x: newX, y: newY } : item
    ));
    setIsDraggingCard(false);
  };

  const bringToFront = (id: string) => {
    setTopItemId(id);
    setIsDraggingCard(true);
  };

  useEffect(() => {
    const handleGlobalUp = () => setIsDraggingCard(false);
    window.addEventListener('pointerup', handleGlobalUp);
    return () => window.removeEventListener('pointerup', handleGlobalUp);
  }, []);

  return (
    <div className="relative bg-[#f0f0f0] w-full h-screen overflow-hidden">
      <motion.div
        drag
        dragListener={!isDraggingCard}
        dragMomentum={true}
        dragConstraints={{ left: -4000, right: 1000, top: -4000, bottom: 1000 }}
        dragElastic={0.05}
        dragTransition={{ power: 0.2, timeConstant: 200 }}
        style={{ x, y }}
        className="absolute w-1250 h-1250 cursor-grab active:cursor-grabbing"
      >
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{
            backgroundImage: 'radial-gradient(circle, #d1d1d1 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div 
          className="absolute flex items-center gap-3 opacity-20 pointer-events-none select-none"
          style={{ 
            left: ORIGIN_X, 
            top: ORIGIN_Y, 
            transform: 'translate(-50%, -50%)' 
          }}
        >
          <MoveIcon />
          {/* <Move size={20} className="text-black" /> */}
          <p className="font-semibold text-black text-base uppercase tracking-tight whitespace-nowrap">
            Arraste para mover
          </p>
        </div>

        {items.map((item) => (
          <ProjectCard 
            key={item.id} 
            project={item} 
            onPositionChange={handlePositionChange}
            zIndex={topItemId === item.id ? 100 : 1}
            onDragStart={() => bringToFront(item.id)}
          />
        ))}
      </motion.div>
    </div>
  );
};
