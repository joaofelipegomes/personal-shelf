export type Category = 'Livro' | 'Filme' | 'Jogos' | 'Teatro' | 'Música' | 'Texto';
export type ItemType = 'image' | 'text';
export type FontFamily = 'sans' | 'serif' | 'mono' | 'display';

export interface ShelfItem {
  id: string;
  type?: ItemType;
  titulo: string;
  autor?: string,
  data?: Date,
  categoria: Category;
  nota: number;
  imagemUrl?: string;
  fontFamily?: FontFamily; // Novo campo para fontes
  x: number;
  y: number;
  rotation: number;
  zIndex?: number;
}
