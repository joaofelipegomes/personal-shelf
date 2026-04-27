export type Category = 'Livro' | 'Filme' | 'Jogos' | 'Teatro' | 'Música';

export interface ShelfItem {
  id: string;
  titulo: string;
  autor?: string,
  data?: Date,
  categoria: Category;
  nota: number;
  imagemUrl: string;
  descricao: string;
  x: number;
  y: number;
  rotation: number;
}
