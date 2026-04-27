import type { ShelfItem as ItemType } from '../types/item';

interface ShelfItemProps {
  item: ItemType;
  onDelete?: (id: string) => void; // Tornando opcional se necessário
  onClick: (item: ItemType) => void;
}

export const ShelfItem = ({ item, onClick }: ShelfItemProps) => {
  return (
    <button 
      type='button'
      className="group h-fit overflow-hidden transition-all duration-300 cursor-pointer"
      onClick={() => onClick(item)}
    >
      <div className="relative overflow-hidden">
        <img 
          src={item.imagemUrl} 
          alt={item.titulo} 
          className="group-hover:opacity-70 w-full h-auto object-cover transition-all duration-500"
        />
      </div>
    </button>
  );
};
