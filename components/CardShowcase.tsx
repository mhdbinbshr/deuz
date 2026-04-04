import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Play } from 'lucide-react';

interface CardShowcaseProps {
  onEnterGame: () => void;
}

const CardShowcase: React.FC<CardShowcaseProps> = ({ onEnterGame }) => {
  const containerRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 20,
    restDelta: 0.001
  });
  
  const rotateY = useTransform(smoothProgress, [0.1, 0.8], [0, 180]);
  const scale = useTransform(smoothProgress, [0.1, 0.8], [0.8, 1]);
  const opacity = useTransform(smoothProgress, [0, 0.2], [0, 1]);
  const lightPosition = useTransform(smoothProgress, [0.1, 0.8], ["0%", "100%"]);

  const titleOpacity = useTransform(smoothProgress, [0.7, 0.9], [1, 0]);
  const titleY = useTransform(smoothProgress, [0, 0.5], [0, -50]);

  return (
    <section 
      ref={containerRef}
      id="showcase" 
      className="relative h-[200vh] bg-cinema-dark"
    >
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        
        <motion.div 
          style={{ opacity: titleOpacity, y: titleY }}
          className="absolute top-24 md:top-32 text-center z-10 w-full px-4"
        >
          <h2 className="text-gold-400 text-xs uppercase tracking-[0.4em] mb-4">The Masterpiece</h2>
          <p className="text-white/60 font-serif italic text-2xl">"A visual symphony in your hand."</p>
        </motion.div>

        {/* The 3D Card Container */}
        <div 
          className="relative w-72 h-[450px] md:w-96 md:h-[600px] group mt-12 md:mt-0"
          style={{ perspective: "1500px" }}
        >
          <motion.div
            style={{ 
              rotateY,
              scale,
              transformStyle: "preserve-3d",
            }}
            className="w-full h-full relative"
          >
            {/* Front Side */}
            <div 
              className="absolute inset-0 w-full h-full rounded-2xl bg-black border border-white/10 shadow-2xl overflow-hidden transition-all duration-700 ease-out group-hover:shadow-[0_0_80px_rgba(212,175,55,0.3)] group-hover:border-gold-500/50"
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            >
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1629196914375-f7e48f477b6d?q=80&w=1000&auto=format&fit=crop')] bg-cover opacity-30 grayscale" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full border-[12px] border-double border-gold-600/20 m-4 rounded-xl flex items-center justify-center">
                    <span className="text-gold-500/40 font-serif text-4xl font-bold tracking-widest opacity-20 rotate-90">DEUZ</span>
                  </div>
               </div>
               <motion.div 
                 style={{ left: lightPosition }}
                 className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 blur-md"
               />
            </div>

            {/* Back Side */}
            <div 
              className="absolute inset-0 w-full h-full rounded-2xl bg-black shadow-2xl overflow-hidden transition-all duration-700 ease-out group-hover:shadow-[0_0_80px_rgba(212,175,55,0.3)] border border-transparent group-hover:border-gold-500/50"
              style={{ 
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden", 
                transform: "rotateY(180deg)" 
              }}
            >
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
              <div className="absolute bottom-8 left-8 right-8">
                <div className="w-12 h-1 bg-gold-500 mb-4" />
                <h3 className="text-white text-3xl font-serif font-bold tracking-wide">NOIR</h3>
                <p className="text-white/60 text-xs uppercase tracking-widest mt-2">Limited Edition</p>
              </div>
               <motion.div 
                 style={{ right: lightPosition }}
                 className="absolute top-0 bottom-0 w-full bg-gradient-to-l from-transparent via-white/20 to-transparent skew-x-[-10deg] pointer-events-none"
               />
            </div>
          </motion.div>
          
          <motion.div 
            style={{ 
              opacity,
              scaleX: scale 
            }}
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[80%] h-4 bg-black blur-xl opacity-60 rounded-[100%]"
          />
        </div>

        {/* Enter Game Button */}
        <motion.div
           style={{ opacity }}
           className="absolute bottom-10 z-20"
        >
          <button 
             onClick={onEnterGame}
             className="group relative px-8 py-4 bg-gold-600/10 border border-gold-500/30 overflow-hidden flex items-center gap-4 hover:border-gold-500 transition-colors duration-500"
          >
             <div className="absolute inset-0 bg-gold-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
             <span className="relative z-10 text-white text-xs uppercase tracking-[0.2em] font-bold group-hover:text-black transition-colors">Enter The Game</span>
             <Play size={14} className="relative z-10 text-gold-500 group-hover:text-black transition-colors" fill="currentColor" />
          </button>
        </motion.div>

      </div>
    </section>
  );
};

export default CardShowcase;