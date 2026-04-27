import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShelfItem } from './ShelfItem';
import type { ShelfItem as ItemType } from '../types/item';

interface ShelfGridProps {
  items: ItemType[];
  onDelete: (id: string) => void;
  onItemClick: (item: ItemType) => void;
}

const getInitialColumns = () => {
  if (typeof window === 'undefined') return 1;
  const width = window.innerWidth;
  if (width >= 1280) return 4;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
};

export const ShelfGrid = ({ items, onDelete, onItemClick }: ShelfGridProps) => {
  const [columnCount, setColumnCount] = useState(getInitialColumns);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1280) setColumnCount(5);
      else if (width >= 1024) setColumnCount(4);
      else if (width >= 640) setColumnCount(3);
      else setColumnCount(2);
    };

    updateColumns();
    setIsReady(true);
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  if (items.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-center items-center py-20 text-[#999]"
      >
        <p className="font-medium text-slate-900 text-xl">Nenhum item encontrado.</p>
        <p className="text-sm">Sua estante está vazia.</p>
      </motion.div>
    );
  }

  const columns = Array.from({ length: columnCount }, (_, i) => ({
    id: `shelf-column-${i}`,
    columnItems: [] as ItemType[]
  }));

  items.forEach((item, index) => {
    columns[index % columnCount].columnItems.push(item);
  });

  return (
    <div className={`px-4 sm:px-6 lg:px-8 flex gap-10 items-start w-full transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
      {columns.map((column) => (
        <div key={column.id} className="flex flex-col flex-1 gap-10">
          <AnimatePresence>
            {isReady && column.columnItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 25
                }}
                className="w-full"
              >
                <ShelfItem item={item} onDelete={onDelete} onClick={onItemClick} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};
