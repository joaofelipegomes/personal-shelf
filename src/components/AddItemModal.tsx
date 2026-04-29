import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const getContrastColor = (hex: string) => {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Fórmula de luminância relativa
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: {
    titulo: string;
    nota: number;
    imagemUrl: string;
    isAutoRotation: boolean;
    rotationType: 'left' | 'center' | 'right';
  }) => void;
  buttonColor?: string;
}

export const AddItemModal = ({ isOpen, onClose, onAdd, buttonColor = '#000000' }: AddItemModalProps) => {
  const [formData, setFormData] = useState({
    titulo: '',
    nota: 0,
    imagemUrl: '',
    isAutoRotation: true,
    rotationType: 'center' as 'left' | 'center' | 'right',
  });

  const buttonTextColor = getContrastColor(buttonColor);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        titulo: '',
        nota: 0,
        imagemUrl: '',
        isAutoRotation: true,
        rotationType: 'center',
      });
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imagemUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imagemUrl) {
      alert('Por favor, selecione uma imagem.');
      return;
    }
    onAdd(formData as any);
    setFormData({
      titulo: '',
      nota: 0,
      imagemUrl: '',
      isAutoRotation: true,
      rotationType: 'center',
    });
    onClose();
  };

  const handleClose = () => {
    setFormData({
      titulo: '',
      nota: 0,
      imagemUrl: '',
      isAutoRotation: true,
      rotationType: 'center',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay - Invisible but clickable */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="z-[2000] fixed inset-0 cursor-default"
          />
          
          {/* Modal Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="top-4 right-4 bottom-4 z-[2001] fixed flex flex-col bg-white shadow-2xl shadow-sm border border-black/5 rounded-[32px] w-[calc(100%-32px)] sm:w-[400px] overflow-hidden"
          >
            <div className="flex justify-end items-center p-6 pb-0">
              <button 
                onClick={handleClose}
                className="hover:bg-gray-100 p-2 rounded-full text-gray-500 transition-colors cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M17.293 5.29295C17.6835 4.90243 18.3165 4.90243 18.707 5.29295C19.0976 5.68348 19.0976 6.31649 18.707 6.70702L13.4131 12L18.7061 17.293L18.7754 17.3691C19.0954 17.7619 19.0721 18.341 18.7061 18.707C18.3399 19.0731 17.7609 19.0958 17.3682 18.7754L17.292 18.707L11.999 13.414L6.70802 18.706C6.3175 19.0966 5.68449 19.0965 5.29396 18.706C4.90344 18.3155 4.90344 17.6825 5.29396 17.292L10.585 12L5.29298 6.70799L5.22462 6.63182C4.90423 6.23907 4.92691 5.66007 5.29298 5.29393C5.65897 4.92794 6.23811 4.9046 6.63087 5.22459L6.70705 5.29393L11.999 10.5859L17.293 5.29295Z" fill="currentColor"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 space-y-8 p-6 pt-2 overflow-y-auto">
              <div className="space-y-2">
                <input
                  required
                  type="text"
                  value={formData.titulo}
                  onChange={e => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  className="bg-gray-50 p-4 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black w-full transition-all font-medium text-sm"
                  placeholder="O que você quer adicionar?"
                />
              </div>

              <div className="space-y-2">
                <div className="flex gap-1 mt-2">
                  <svg width="0" height="0" className="absolute">
                    <defs>
                      <linearGradient id="half-star">
                        <stop offset="50%" stopColor="#facd15" />
                        <stop offset="50%" stopColor="#e5e7eb" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFull = formData.nota >= star;
                    const isHalf = formData.nota === star - 0.5;
                    
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          const currentRating = formData.nota;
                          let newRating = star;
                          
                          // Cicla entre cheia (100%) e metade (50%)
                          if (currentRating === star) {
                            newRating = star - 0.5; // Vira metade
                          } else if (currentRating === star - 0.5) {
                            // Se for a primeira estrela e já estiver em 0.5, permite virar 0
                            if (star === 1) {
                              newRating = 0;
                            } else {
                              newRating = star; // Volta a ser cheia
                            }
                          } else if (currentRating === 0 && star === 1) {
                            newRating = 1;
                          }
                          
                          setFormData(prev => ({ ...prev, nota: newRating }));
                        }}
                        className="cursor-pointer transition-transform active:scale-90"
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="transition-colors duration-200"
                        >
                          <path
                            d="M11.996 1.25c1.05 0 1.876.793 2.403 1.862l1.763 3.553c.053.11.18.265.37.407.19.141.377.22.5.24l3.189.534c1.152.194 2.118.758 2.431 1.742.313.982-.146 2.004-.974 2.834h-.001l-2.478 2.499a1.272 1.272 0 00-.277.528 1.318 1.318 0 00-.044.604v.002l.71 3.09c.294 1.287.196 2.562-.71 3.23-.911.668-2.155.372-3.286-.301l-2.99-1.785c-.125-.075-.34-.136-.6-.136-.26 0-.48.06-.613.138l-.002.001-2.984 1.781c-1.129.676-2.371.967-3.282.297-.907-.667-1.009-1.94-.714-3.225l.709-3.09v-.002a1.318 1.318 0 00-.043-.604 1.272 1.272 0 00-.277-.528l-2.48-2.5c-.823-.83-1.28-1.85-.97-2.832.312-.984 1.275-1.55 2.428-1.743l3.187-.534h.001c.117-.02.3-.097.49-.24.19-.141.318-.297.371-.407l.003-.005 1.76-3.549V3.11c.533-1.069 1.362-1.86 2.41-1.86z"
                            fill={isFull ? '#facd15' : isHalf ? 'url(#half-star)' : '#e5e7eb'}
                          />
                        </svg>
                      </button>
                    );
                  })}
                  <span className="ml-2 font-bold text-black self-center text-sm">{formData.nota > 0 ? formData.nota : 'Dar nota'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="group relative mt-3">
                  <input
                    required
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="z-10 absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <div className="flex flex-col justify-center items-center bg-gray-50 group-hover:bg-gray-100 border-2 border-gray-200 group-hover:border-gray-300 border-dashed rounded-[24px] w-full h-40 overflow-hidden transition-all">
                    {formData.imagemUrl ? (
                      <img src={formData.imagemUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="p-3 bg-white rounded-2xl shadow-sm mb-2">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-black">
                            <path d="M2.25002 16.75C2.25002 16.1977 2.69774 15.75 3.25002 15.75C3.80231 15.75 4.25002 16.1977 4.25002 16.75C4.25002 17.7443 4.25882 18.0453 4.31838 18.2676C4.50332 18.9578 5.04226 19.4967 5.73244 19.6816C5.95472 19.7412 6.25567 19.75 7.25002 19.75H16.75L17.375 19.748C17.8899 19.7428 18.1009 19.7263 18.2676 19.6816C18.9578 19.4967 19.4967 18.9578 19.6817 18.2676C19.7412 18.0453 19.75 17.7443 19.75 16.75C19.75 16.1977 20.1977 15.75 20.75 15.75C21.3023 15.75 21.75 16.1977 21.75 16.75C21.75 17.6156 21.7582 18.2444 21.6133 18.7852C21.2434 20.1655 20.1655 21.2434 18.7852 21.6133C18.2445 21.7582 17.6156 21.75 16.75 21.75H7.25002C6.38444 21.75 5.75559 21.7582 5.21487 21.6133C3.8345 21.2434 2.75661 20.1655 2.38674 18.7852C2.24186 18.2444 2.25002 17.6156 2.25002 16.75Z" fill="currentColor"></path>
                            <path d="M12 16.75C11.4477 16.75 11 16.3023 11 15.75V5.14066C10.6959 5.44576 10.3742 5.79408 10.0605 6.15531C9.5874 6.70024 9.14786 7.24867 8.82518 7.66215C8.66425 7.86837 8.39588 8.22335 8.30565 8.34281C7.97823 8.78739 7.35189 8.88288 6.90721 8.5557C6.46264 8.22829 6.36714 7.60194 6.69432 7.15726C6.78996 7.03063 7.07974 6.64733 7.24803 6.43168C7.58372 6.00152 8.04638 5.42459 8.54979 4.84476C9.04902 4.26976 9.60862 3.66902 10.1348 3.20414C10.3967 2.97271 10.6741 2.75342 10.9502 2.58695C11.1989 2.43706 11.5734 2.25003 12 2.25004C12.4266 2.25005 12.8011 2.43706 13.0498 2.58695C13.3259 2.75342 13.6033 2.97271 13.8652 3.20414C14.3913 3.66901 14.9509 4.26978 15.4502 4.84476C15.9536 5.42459 16.4162 6.00154 16.7519 6.43168C16.9202 6.64733 17.21 7.03064 17.3056 7.15726C17.6328 7.60191 17.5373 8.2273 17.0928 8.55473C16.6481 8.88224 16.0218 8.78751 15.6943 8.34281C15.6041 8.22335 15.3357 7.86837 15.1748 7.66215C14.8521 7.24868 14.4126 6.70024 13.9394 6.15531C13.6258 5.79408 13.3041 5.44576 13 5.14066V15.75C13 16.3023 12.5523 16.75 12 16.75Z" fill="currentColor"></path>
                          </svg>
                        </div>
                        <span className="font-bold text-black text-sm">Adicionar capa</span>
                        <span className="text-gray-400 text-[11px] mt-1">PNG, JPG ou WEBP</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center mb-4 px-1">
                  <span className="text-sm font-bold text-black">Ajustar posição</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[10px] text-gray-400 uppercase">Auto</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isAutoRotation: !prev.isAutoRotation }))}
                      className="relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none"
                      style={{ backgroundColor: formData.isAutoRotation ? buttonColor : '#e5e7eb' }}
                    >
                      <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${formData.isAutoRotation ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {!formData.isAutoRotation && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      className="overflow-hidden"
                    >
                      <div className="flex justify-around items-end gap-4 bg-gray-50 mt-2 p-4 border border-gray-100 rounded-2xl">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, rotationType: 'left' }))}
                          className="group flex flex-col items-center gap-2 cursor-pointer"
                        >
                          <div className={`w-12 h-16 rounded-md border-2 transition-all ${formData.rotationType === 'left' ? 'border-black bg-white -rotate-6' : 'border-gray-200 bg-gray-100 group-hover:border-gray-300'}`} />
                          <span className={`text-[10px] font-bold uppercase ${formData.rotationType === 'left' ? 'text-black' : 'text-gray-400'}`}>Esq.</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, rotationType: 'center' }))}
                          className="group flex flex-col items-center gap-2 cursor-pointer"
                        >
                          <div className={`w-12 h-16 rounded-md border-2 transition-all ${formData.rotationType === 'center' ? 'border-black bg-white' : 'border-gray-200 bg-gray-100 group-hover:border-gray-300'}`} />
                          <span className={`text-[10px] font-bold uppercase ${formData.rotationType === 'center' ? 'text-black' : 'text-gray-400'}`}>Centro</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, rotationType: 'right' }))}
                          className="group flex flex-col items-center gap-2 cursor-pointer"
                        >
                          <div className={`w-12 h-16 rounded-md border-2 transition-all ${formData.rotationType === 'right' ? 'border-black bg-white rotate-6' : 'border-gray-200 bg-gray-100 group-hover:border-gray-300'}`} />
                          <span className={`text-[10px] font-bold uppercase ${formData.rotationType === 'right' ? 'text-black' : 'text-gray-400'}`}>Dir.</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>

            <div className="p-6 border-gray-100 border-t">
              <button
                type="submit"
                onClick={handleSubmit}
                className="shadow-black/10 shadow-lg shadow-sm border border-black/5 py-4 rounded-xl w-full font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                style={{ backgroundColor: buttonColor, color: buttonTextColor }}
              >
                Adicionar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
