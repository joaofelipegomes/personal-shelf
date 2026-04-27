import type { ShelfItem } from '../types/item';

export const mockItemsBase: Omit<ShelfItem, 'x' | 'y' | 'rotation'>[] = [
  {
    id: '1',
    titulo: 'O rio que me corta por dentro',
    autor: 'Raul Damasceno',
    data: new Date('2026-01-10'),
    categoria: 'Livro',
    nota: 5,
    imagemUrl: '/2985362C-7DCF-4CD3-9AB7-DA0717605D2A.jpeg',
    descricao: '...'
  },
  {
    id: '2',
    titulo: 'Ópera do Malandro',
    autor: 'Chico Buarque',
    data: new Date('2026-02-14'),
    categoria: 'Teatro',
    nota: 4.5,
    imagemUrl: '/F18925B0-7E90-43B9-B9DB-D1D9DA833698_1_105_c.jpeg',
    descricao: '...'
  },
  {
    id: '3',
    titulo: 'Hamlet, Sonhos que Virão',
    autor: 'Shakespeare',
    data: new Date('2026-03-01'),
    categoria: 'Teatro',
    nota: 5,
    imagemUrl: '/1EBEB7DD-8492-47D2-8193-A251B1A0625E_1_105_c.jpeg',
    descricao: '...'
  },
  {
    id: '4',
    titulo: 'Ópera do Malandro (Bravo)',
    autor: 'Bravo Teatro',
    data: new Date('2026-03-22'),
    categoria: 'Teatro',
    nota: 5,
    imagemUrl: '/7AEF0394-19A6-4C48-8FBC-30439B76CF32_1_105_c.jpeg',
    descricao: '...'
  },
  {
    id: '5',
    titulo: 'Tudo é rio',
    autor: 'Carla Medeira',
    data: new Date('2026-04-01'),
    categoria: 'Livro',
    nota: 5,
    imagemUrl: '/EDDE0A69-35A7-4C6A-A031-1EAA756F8F53.jpeg',
    descricao: '...'
  },
  {
    id: '6',
    titulo: 'O cozer das pedras',
    autor: 'Patrick Torres',
    data: new Date('2026-04-15'),
    categoria: 'Livro',
    nota: 5,
    imagemUrl: '/7EA068EC-7AF6-47DB-B5A3-E1FF25EDBFCC.jpeg',
    descricao: '...'
  },
  {
    id: '7',
    titulo: 'Senhora dos Afogados',
    autor: 'Nelson Rodrigues',
    data: new Date('2026-03-28'),
    categoria: 'Teatro',
    nota: 5,
    imagemUrl: '/657708ED-0CAD-4870-B281-30975CB6DAC8_1_105_c.jpeg',
    descricao: '...'
  },
  {
    id: '9',
    titulo: 'A cabeça do santo',
    autor: 'Socorro, Socorro',
    data: new Date('2026-05-01'),
    categoria: 'Livro',
    nota: 4.9,
    imagemUrl: '/71-YhujYUxS.jpg',
    descricao: '...'
  },
  {
    id: '10',
    titulo: 'Dorival e a Mar',
    autor: 'Dorival Caymmi',
    data: new Date('2026-05-01'),
    categoria: 'Livro',
    nota: 4.9,
    imagemUrl: '/22DD273C-841B-4490-B3B4-BF77112FC684.jpeg',
    descricao: '...'
  },
  {
    id: '11',
    titulo: 'Deixa o Mundo Acabar',
    autor: 'Jáder',
    data: new Date('2026-05-01'),
    categoria: 'Música',
    nota: 4.9,
    imagemUrl: '/1E43A051-DF14-4C69-8B07-DA5BC6E446FF.jpeg',
    descricao: '...'
  },
  {
    id: '12',
    titulo: 'AFIM',
    autor: 'Zé Ibarra',
    data: new Date('2026-05-01'),
    categoria: 'Música',
    nota: 5,
    imagemUrl: '/5AE430D6-BFE5-4BF6-838F-350624B2FC40.jpeg',
    descricao: '...'
  },
  {
    id: '13',
    titulo: 'Pedaço',
    autor: 'Tom Ribeira',
    data: new Date('2026-05-01'),
    categoria: 'Música',
    nota: 5,
    imagemUrl: '/F37AD981-401D-4BDA-B284-D22AF1BC6F81.jpeg',
    descricao: '...'
  }
];

export const mockItems = mockItemsBase as ShelfItem[];
