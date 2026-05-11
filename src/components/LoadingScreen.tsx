import { motion } from 'framer-motion';

export const LoadingScreen = ({ bgColor = 'white' }: { bgColor?: string }) => {
  return (
    <div 
      className="flex flex-col justify-center items-center w-full h-[100dvh] transition-colors duration-500" 
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          <motion.div 
            animate={{ y: [0, -10, 0] }} 
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }} 
            className="bg-black rounded-full w-3 h-3" 
          />
          <motion.div 
            animate={{ y: [0, -10, 0] }} 
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.15 }} 
            className="bg-black rounded-full w-3 h-3" 
          />
          <motion.div 
            animate={{ y: [0, -10, 0] }} 
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }} 
            className="bg-black rounded-full w-3 h-3" 
          />
        </div>
      </div>
    </div>
  );
};
