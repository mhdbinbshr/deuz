import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, MousePointer2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface FashionStoreProps {
  onEnterStore: () => void;
}

const FashionStore: React.FC<FashionStoreProps> = ({ onEnterStore }) => {
  const containerRef = useRef<HTMLElement>(null);
  const [isWalkingIn, setIsWalkingIn] = useState(false);
  const { content } = useSettings();
  
  // Reduced height to 105vh to essentially eliminate dead space while allowing scroll trigger
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 40,
    damping: 20
  });

  const yPos = useTransform(smoothProgress, [0, 1], [50, 0]); 
  const atmosphereOpacity = useTransform(smoothProgress, [0.1, 0.8], [0, 1]);

  const handleEnterClick = () => {
    setIsWalkingIn(true);
    setTimeout(() => {
      onEnterStore();
      setTimeout(() => setIsWalkingIn(false), 2000);
    }, 2000);
  };

  return (
    <section 
      ref={containerRef}
      className="relative h-[105vh] bg-transparent flex flex-col items-center overflow-hidden"
    >
      {/* Global Ambient Light for High-End Feel */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-blue-900/5 via-transparent to-gold-900/5 z-0" />

      <div className="sticky top-0 h-screen w-full flex items-center justify-center perspective-[1200px] overflow-hidden">
        
        {/* Volumetric Light Beams (God Rays) */}
        <motion.div 
          style={{ opacity: isWalkingIn ? 0 : atmosphereOpacity }} 
          animate={isWalkingIn ? { opacity: 0 } : {}}
          transition={{ duration: 1 }}
          className="absolute inset-0 pointer-events-none z-10"
        >
           <div className="absolute top-[-20%] left-[20%] w-[200px] h-[150vh] bg-gradient-to-b from-white/5 to-transparent rotate-[15deg] blur-[30px]" />
           <div className="absolute top-[-20%] left-[40%] w-[100px] h-[150vh] bg-gradient-to-b from-white/3 to-transparent rotate-[15deg] blur-[20px]" />
        </motion.div>

        {/* --- FIGMA STYLE ANIMATION CONTAINER --- */}
        <motion.div
          initial={false}
          animate={isWalkingIn ? { 
             z: 1000,        
             opacity: 0,
          } : {}}
          transition={{ 
             duration: 2.5, 
             ease: [0.65, 0, 0.35, 1] 
          }}
          style={{ 
            y: isWalkingIn ? 0 : yPos, 
            transformStyle: "preserve-3d" 
          }}
          className="relative w-full max-w-5xl h-[70vh] flex items-center justify-center"
        >
            {/* Background Abstract Card (Wireframe Style) */}
            <motion.div 
                initial={{ opacity: 0, x: -100, rotate: -5 }}
                whileInView={{ opacity: 0.4, x: -150, rotate: -6 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute w-[300px] h-[400px] border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm z-0 flex flex-col p-4 hidden md:flex"
            >
                <div className="w-full h-32 bg-white/5 rounded-lg mb-4 animate-pulse" />
                <div className="space-y-3">
                    <div className="w-2/3 h-2 bg-white/10 rounded-full" />
                    <div className="w-1/2 h-2 bg-white/10 rounded-full" />
                </div>
                {/* Fake User Cursor */}
                <motion.div 
                    animate={{ x: [0, 20, 0], y: [0, 40, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    className="absolute top-10 right-10 flex items-center gap-2"
                >
                    <MousePointer2 size={16} className="text-purple-500 fill-purple-500" />
                    <span className="bg-purple-500 text-[9px] text-white px-1 rounded-sm uppercase tracking-wider">Design</span>
                </motion.div>
            </motion.div>

            {/* Main Visual Card (The "Prototype") */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative w-[320px] md:w-[400px] aspect-[3/4] bg-[#050505] rounded-sm overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 group"
            >
                <img 
                    src={content.storeImage || "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop"} 
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-[1.5s]"
                    alt="Collection Preview"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                
                {/* Simulated UI Overlay */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-center border-b border-white/10 pb-4">
                    <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
                        <div className="w-1 h-1 bg-white rounded-full" />
                    </div>
                    <div className="text-[9px] uppercase tracking-[0.3em] text-white/50">COLLECTION I</div>
                </div>

                <div className="absolute bottom-8 left-8 right-8">
                    <h2 className="text-3xl font-serif text-white mb-2">SOVEREIGN</h2>
                    <p className="text-white/40 text-xs font-light leading-relaxed mb-6">
                        A study in structure and restraint. Precision-cut silhouettes designed for enduring presence.
                    </p>
                    <div className="flex gap-2">
                        <div className="h-[2px] w-full bg-white/20 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ x: '-100%' }}
                                whileInView={{ x: '0%' }}
                                transition={{ duration: 1.5, delay: 0.5 }}
                                className="h-full bg-gold-500 w-2/3" 
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Floating Detail Card (Properties Panel Style) */}
            <motion.div 
                initial={{ opacity: 0, y: 70 }}
                whileInView={{ opacity: 1, y: 50 }}
                transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                className="absolute right-4 md:right-auto md:left-[50%] md:ml-[100px] w-48 md:w-64 bg-black/80 backdrop-blur-md border border-white/10 rounded-sm p-4 md:p-6 z-20"
            >
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                    <span className="text-[9px] uppercase tracking-widest text-gold-500">Properties</span>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                </div>
                <div className="space-y-3 font-mono text-[10px] text-white/60">
                    <div className="flex justify-between">
                        <span>Material</span>
                        <span className="text-white">Silk</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Opacity</span>
                        <span className="text-white">85%</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Grade</span>
                        <span className="text-gold-500">S-Tier</span>
                    </div>
                </div>
                
                {/* Another Cursor */}
                <motion.div 
                    animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -bottom-8 -left-8 flex items-center gap-2"
                >
                    <MousePointer2 size={16} className="text-green-500 fill-green-500 -rotate-90" />
                    <span className="bg-green-500 text-[9px] text-black px-1 rounded-sm uppercase tracking-wider font-bold">You</span>
                </motion.div>
            </motion.div>

        </motion.div>

        {/* --- INTERACTION OVERLAY --- */}
        <AnimatePresence>
          {!isWalkingIn && (
             <motion.div 
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 100, transition: { duration: 0.5 } }}
               className="absolute bottom-12 md:bottom-24 z-50 flex flex-col items-center gap-6 w-full px-4"
             >
                <div className="w-full max-w-[800px] h-32 bg-gradient-to-t from-black via-black/80 to-transparent absolute -top-20 pointer-events-none" />
                
                <motion.button
                  onClick={handleEnterClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-6 py-4 md:px-12 md:py-5 overflow-hidden bg-white/5 border border-white/10 backdrop-blur-md rounded-none hover:border-gold-500/50 transition-all duration-500 shadow-[0_20px_40px_rgba(0,0,0,0.4)] w-full max-w-sm md:max-w-md"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gold-600/20 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 ease-out" />
                  
                  <div className="relative flex flex-col items-center gap-1">
                    <div className="flex items-center justify-center gap-3 w-full">
                      <span className="text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] text-white font-medium group-hover:text-gold-200 transition-colors text-center">EXPLORE COLLECTION I</span>
                      <ArrowUpRight size={16} className="text-gold-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300 flex-shrink-0" />
                    </div>
                    <div className="w-full h-[1px] bg-white/20 mt-1 group-hover:bg-gold-500 transition-colors duration-500 scale-x-0 group-hover:scale-x-100 origin-left" />
                  </div>
                </motion.button>
             </motion.div>
          )}
        </AnimatePresence>
        
        {/* Cinematic POV Transition Overlay */}
        {isWalkingIn && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 1.5, delay: 0.5 }}
             className="absolute inset-0 pointer-events-none z-[100] bg-black"
           >
              <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: 1 }}
                 className="absolute inset-0 flex items-center justify-center"
              >
                 <h1 className="text-4xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-600 tracking-[0.5em]">DEUZ & CO</h1>
              </motion.div>
           </motion.div>
        )}

      </div>
    </section>
  );
};

export default FashionStore;