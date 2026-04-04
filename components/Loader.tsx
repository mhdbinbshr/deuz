import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoaderProps {
  onLoadingComplete: () => void;
}

const Loader: React.FC<LoaderProps> = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Non-linear loading simulation
    const steps = [
      { increment: 1, delay: 30 },
      { increment: 2, delay: 50 },
      { increment: 5, delay: 20 },
      { increment: 1, delay: 100 },
    ];
    
    let currentProgress = 0;
    let mounted = true;
    
    const runLoader = async () => {
      while (currentProgress < 100 && mounted) {
        const step = steps[Math.floor(Math.random() * steps.length)];
        currentProgress = Math.min(currentProgress + step.increment, 100);
        if (mounted) setProgress(currentProgress);
        await new Promise(r => setTimeout(r, step.delay));
      }
      
      // Artificial delay at 100% before revealing
      if (mounted) {
        setTimeout(() => {
          onLoadingComplete();
        }, 500);
      }
    };

    runLoader();
    return () => { mounted = false; };
  }, [onLoadingComplete]);

  const loadingText = useMemo(() => {
    if (progress >= 75) return "Welcome to DEUZ";
    if (progress >= 50) return "Securing Authority";
    if (progress >= 25) return "Refining Form";
    return "Establishing Foundation";
  }, [progress]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] text-white"
      initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
      exit={{ 
        clipPath: "inset(100% 0% 0% 0%)",
        transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } 
      }}
    >
      <div className="relative w-full max-w-md px-10 flex flex-col items-center">
        {/* Cinematic Lens Flare / Abstract Shape */}
        <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
           {/* Outer Ring */}
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 15, ease: "linear", repeat: Infinity }}
             className="absolute inset-0 border border-white/5 rounded-full border-t-white/20"
           />
           {/* Inner Ring */}
           <motion.div 
             animate={{ rotate: -360 }}
             transition={{ duration: 20, ease: "linear", repeat: Infinity }}
             className="absolute inset-4 border border-white/5 rounded-full border-b-gold-500/20"
           />
           
           {/* Logo Construction */}
           <motion.div
             initial={{ scale: 0.8, opacity: 0, filter: "blur(10px)" }}
             animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
             transition={{ duration: 1.2, ease: "easeOut" }}
             className="relative z-10 flex flex-col items-center"
           >
              <img 
                src="https://ik.imagekit.io/dto1zguat/Logo.png?updatedAt=1775277696501" 
                alt="DEUZ & CO" 
                className="w-32 md:w-40 h-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              />
           </motion.div>
        </div>

        {/* Dynamic Text Reveal */}
        <div className="h-8 mb-8 relative w-full flex justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={loadingText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute text-[10px] md:text-xs font-serif tracking-[0.4em] text-white/40 text-center uppercase whitespace-nowrap"
            >
              {loadingText}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-[1px] bg-white/10 relative overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 bottom-0 bg-gold-500"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear", duration: 0.1 }}
          />
        </div>

        {/* Counter */}
        <div className="w-full flex justify-between mt-2">
           <span className="text-[10px] text-white/30 uppercase tracking-widest">DEUZ Protocol</span>
           <span className="text-[10px] font-mono text-gold-500">{progress}%</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Loader;