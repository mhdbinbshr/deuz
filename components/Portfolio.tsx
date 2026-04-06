import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

interface PortfolioProps {
  onEnterShop: () => void;
}

const Portfolio: React.FC<PortfolioProps> = ({ onEnterShop }) => {
  const targetRef = useRef<HTMLDivElement>(null);
  const { content } = useSettings();
  
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"]
  });

  // Extremely smooth spring for cinematic feel
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 30,
    damping: 20,
    mass: 0.8,
    restDelta: 0.001
  });

  // Horizontal scroll logic: moves content left as user scrolls down
  const x = useTransform(smoothProgress, [0, 1], ["0%", "-75%"]);
  
  // Parallax effect for images (moves slightly opposite to scroll)
  const imageX = useTransform(smoothProgress, [0, 1], ["0%", "25%"]);

  const displayImages = content.scrollImages && content.scrollImages.length > 0 
    ? content.scrollImages 
    : [
        'https://images.unsplash.com/photo-1478720568477-152d9b164e63?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1495554605298-8d361208bd48?q=80&w=1000&auto=format&fit=crop'
      ];

  return (
    <section id="works" className="bg-transparent py-20 relative">
      <div className="px-6 md:px-12 mb-12 flex items-end justify-between max-w-7xl mx-auto">
        <div>
          <h2 className="text-gold-500 text-sm font-bold tracking-[0.3em] uppercase mb-4">HOUSE RELEASE</h2>
          <h3 className="text-4xl md:text-5xl font-serif text-white">DEUZ — FORM 01</h3>
        </div>
        <button onClick={onEnterShop} className="hidden md:block text-xs uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors border-b border-transparent hover:border-white pb-1">
          ENTER THE HOUSE.
        </button>
      </div>

      {/* Horizontal Scroll Container */}
      <div ref={targetRef} className="h-[400vh] relative">
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <motion.div style={{ x }} className="flex gap-12 px-12">
            {displayImages.map((imgUrl, index) => (
              <div key={index} className="group relative w-[85vw] md:w-[700px] h-[75vh] flex-shrink-0 cursor-none overflow-hidden">
                <div className="w-full h-full overflow-hidden bg-white/5 border border-white/5 relative backdrop-blur-sm flex items-center justify-center">
                  <motion.img
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                    src={imgUrl}
                    alt={`Showcase ${index + 1}`}
                    className="w-full h-full object-contain opacity-60 group-hover:opacity-100 transition-opacity duration-700"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-700" />
                </div>
                
                {/* Project Info */}
                <div className="absolute bottom-0 left-0 p-10 w-full bg-gradient-to-t from-black via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="overflow-hidden">
                    <motion.h4 
                      initial={{ y: 30, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="text-5xl font-serif text-white mb-3"
                    >
                      Dossier 0{index + 1}
                    </motion.h4>
                  </div>
                  <div className="flex justify-between items-center text-xs uppercase tracking-widest text-white/70">
                    <span className="tracking-[0.3em]">Archive</span>
                    <span className="text-gold-500">2026</span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* End Card */}
            <div className="w-[400px] h-[75vh] flex flex-col justify-center items-start pl-16 flex-shrink-0">
               <h3 className="text-7xl font-serif text-white/20 mb-8">Next?</h3>
               <button onClick={onEnterShop} className="text-4xl text-white hover:text-gold-500 font-serif border-b border-white/20 pb-2 text-left transition-colors duration-500">
                 ENTER THE HOUSE
               </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;