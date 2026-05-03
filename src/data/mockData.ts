import type { ShelfItem } from '../types/item';

export const mockItemsBase: Omit<ShelfItem, 'x' | 'y' | 'rotation'>[] = [
  {
    id: '1',
    titulo: 'O rio que me corta por dentro',
    categoria: 'Livro',
    nota: 5,
    imagemUrl: '/2985362C-7DCF-4CD3-9AB7-DA0717605D2A.jpeg'
  },
  {
    id: '2',
    titulo: 'Ópera do Malandro',
    categoria: 'Teatro',
    nota: 4.5,
    imagemUrl: '/F18925B0-7E90-43B9-B9DB-D1D9DA833698_1_105_c.jpeg'
  },
  {
    id: '3',
    titulo: 'Hamlet, Sonhos que Virão',
    categoria: 'Teatro',
    nota: 5,
    imagemUrl: '/1EBEB7DD-8492-47D2-8193-A251B1A0625E_1_105_c.jpeg'
  },
  {
    id: '4',
    titulo: 'Ópera do Malandro (Bravo)',
    categoria: 'Teatro',
    nota: 5,
    imagemUrl: '/7AEF0394-19A6-4C48-8FBC-30439B76CF32_1_105_c.jpeg'
  },
  {
    id: '5',
    titulo: 'Tudo é rio',
    categoria: 'Livro',
    nota: 5,
    imagemUrl: '/EDDE0A69-35A7-4C6A-A031-1EAA756F8F53.jpeg'
  },
  {
    id: '6',
    titulo: 'O cozer das pedras',
    categoria: 'Livro',
    nota: 5,
    imagemUrl: '/7EA068EC-7AF6-47DB-B5A3-E1FF25EDBFCC.jpeg'
  },
  {
    id: '7',
    titulo: 'Senhora dos Afogados',
    categoria: 'Teatro',
    nota: 5,
    imagemUrl: '/657708ED-0CAD-4870-B281-30975CB6DAC8_1_105_c.jpeg'
  },
  {
    id: '9',
    titulo: 'A cabeça do santo',
    categoria: 'Livro',
    nota: 4.9,
    imagemUrl: '/71-YhujYUxS.jpg'
  },
  {
    id: '10',
    titulo: 'Dorival e a Mar',
    categoria: 'Livro',
    nota: 4.9,
    imagemUrl: '/22DD273C-841B-4490-B3B4-BF77112FC684.jpeg'
  },
  {
    id: '11',
    titulo: 'Deixa o Mundo Acabar',
    categoria: 'Música',
    nota: 4.9,
    imagemUrl: '/1E43A051-DF14-4C69-8B07-DA5BC6E446FF.jpeg'
  },
  {
    id: '12',
    titulo: 'AFIM',
    categoria: 'Música',
    nota: 5,
    imagemUrl: '/5AE430D6-BFE5-4BF6-838F-350624B2FC40.jpeg'
  },
  {
    id: '13',
    titulo: 'Pedaço',
    categoria: 'Música',
    nota: 5,
    imagemUrl: '/F37AD981-401D-4BDA-B284-D22AF1BC6F81.jpeg'
  }
];

export const mockItems = mockItemsBase as ShelfItem[];
