import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Sparkles, Eye, ZoomIn, ZoomOut, Lock, ShieldCheck, RefreshCw, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { getProductImageSet } from '../utils/productImages';

interface ProductShowcase3DProps {
  product: any;
  currentImageIndex: number;
  setCurrentImageIndex: (idx: number) => void;
}

const ProductShowcase3D: React.FC<ProductShowcase3DProps> = ({
  product,
  currentImageIndex,
  setCurrentImageIndex,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  
  const [isHovered, setIsHovered] = useState(false);
  const [isZoomMode, setIsZoomMode] = useState(false);
  const [zoomCoords, setZoomCoords] = useState({ x: 50, y: 50 });
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const allImages = useMemo(() => {
    const imgSet = getProductImageSet(product);
    return imgSet.allImages;
  }, [product]);

  // Handle mouse movements for optical zoom lens only
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    if (isZoomMode) {
      const rect = stageRef.current.getBoundingClientRect();
      const zoomX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const zoomY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setZoomCoords({ x: zoomX, y: zoomY });
    }
  }, [isZoomMode]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Auto change product perspective in Fashion House 3D showcase
  useEffect(() => {
    if (isZoomMode || isHovered || allImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((currentImageIndex + 1) % allImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isZoomMode, isHovered, allImages.length, currentImageIndex, setCurrentImageIndex]);

  // Next / Prev image navigation
  const nextImage = useCallback(() => {
    setCurrentImageIndex((currentImageIndex + 1) % allImages.length);
  }, [currentImageIndex, allImages.length, setCurrentImageIndex]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((currentImageIndex - 1 + allImages.length) % allImages.length);
  }, [currentImageIndex, allImages.length, setCurrentImageIndex]);

  const currentImage = allImages[currentImageIndex] || product.image;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden"
    >
      {/* --- VOLUMETRIC BACKGROUND & 3D ATELIER ENVIRONMENT --- */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold-900/15 via-[#080808] to-[#040404]" />
      
      {/* Concentric Orbital Compass Rings */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        className="absolute w-[680px] h-[680px] rounded-full border border-gold-400/[0.04] pointer-events-none flex items-center justify-center"
      >
        <div className="w-[480px] h-[480px] rounded-full border border-dashed border-white/[0.04]" />
      </motion.div>

      {/* Floating Gold Atmosphere Dust Motes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(9)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gold-400/40"
            style={{
              width: `${(i % 3) + 2}px`,
              height: `${(i % 3) + 2}px`,
              top: `${20 + (i * 9) % 65}%`,
              left: `${10 + (i * 11) % 80}%`,
              boxShadow: '0 0 10px rgba(212,175,55,0.6)',
            }}
            animate={{
              y: [0, -25 - (i * 4), 0],
              x: [0, (i % 2 === 0 ? 12 : -12), 0],
              opacity: [0.2, 0.7, 0.2],
            }}
            transition={{
              duration: 7 + (i % 4),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Diagonal Atmospheric Light Ray */}
      <div className="absolute -top-[15%] left-[20%] w-[180px] h-[120vh] bg-gradient-to-b from-gold-400/[0.07] via-gold-500/[0.02] to-transparent rotate-[25deg] blur-[40px] pointer-events-none" />

      {/* --- 3D INTERACTIVE GYROSCOPIC STAGE --- */}
      {/* --- CINEMATIC PRODUCT SHOWCASE STAGE --- */}
      <div className="relative z-10 w-full max-w-lg lg:max-w-xl px-3 sm:px-4 flex flex-col items-center justify-center my-auto shrink-0">
        <div
          ref={stageRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStartX !== null && allImages.length > 1) {
              const diff = touchStartX - e.changedTouches[0].clientX;
              if (diff > 45) nextImage();
              if (diff < -45) prevImage();
              setTouchStartX(null);
            }
          }}
          className="relative aspect-[4/5] h-[min(46vh,350px)] xs:h-[min(50vh,390px)] sm:h-[min(54vh,440px)] md:h-[min(56vh,460px)] lg:h-[min(62vh,510px)] xl:h-[min(65vh,540px)] max-h-[calc(100vh-185px)] w-auto max-w-[88vw] rounded-none bg-[#0A0A0A] border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.9)] group mx-auto shrink-0"
        >
          {/* Ambient Backplane Light Pool */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.18),transparent_70%)] pointer-events-none filter blur-xl" />

          {/* MAIN PRODUCT IMAGE WITH ANAMORPHIC SHIMMER (Fitting fully to border) */}
          <div className="absolute inset-0 overflow-hidden rounded-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 w-full h-full"
              >
                {!isZoomMode ? (
                  <motion.img 
                    src={currentImage}
                    alt={product.title}
                    className={`w-full h-full object-cover object-center filter brightness-[0.98] contrast-[1.04] transition-all duration-700 ${
                      !product.inStock ? 'grayscale contrast-125' : ''
                    }`}
                  />
                ) : (
                  // HIGH-RESOLUTION TEXTURE INSPECTION MODE (LOUPE)
                  <div 
                    className="w-full h-full overflow-hidden relative cursor-crosshair"
                    style={{
                      backgroundImage: `url(${currentImage})`,
                      backgroundPosition: `${zoomCoords.x}% ${zoomCoords.y}%`,
                      backgroundSize: '280%',
                    }}
                  >
                    {/* Loupe Grid Overlay & Reticle */}
                    <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                    <div className="absolute top-4 left-4 px-2.5 py-1 bg-black/85 border border-gold-400/40 text-[9px] font-mono text-gold-300 uppercase tracking-widest backdrop-blur-md">
                      MACRO WEAVE INSPECTION
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Subtle Gradient & Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.55)_100%)] pointer-events-none" />

            {/* Dynamic Specular Sheen */}
            <motion.div 
              className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity duration-700 bg-gradient-to-tr from-transparent via-white/10 to-transparent"
            />

            {/* Vertical Anamorphic Holographic Scanline Sweep */}
            {!isZoomMode && (
              <motion.div
                animate={{ y: ["-100%", "280%"] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear", repeatDelay: 2.5 }}
                className="absolute inset-x-0 h-28 bg-gradient-to-b from-transparent via-gold-400/[0.1] to-transparent pointer-events-none"
              />
            )}
          </div>

          {/* Luxury Corner Crosshair Reticles */}
          <div className="absolute top-3 left-3 text-gold-400/60 font-mono text-[9px] pointer-events-none z-20">+</div>
          <div className="absolute top-3 right-3 text-gold-400/60 font-mono text-[9px] pointer-events-none z-20">+</div>
          <div className="absolute bottom-3 left-3 text-gold-400/60 font-mono text-[9px] pointer-events-none z-20">+</div>
          <div className="absolute bottom-3 right-3 text-gold-400/60 font-mono text-[9px] pointer-events-none z-20">+</div>

          {/* Top Status Bar - Cinematic Obsidian & Gold Hardware Badges */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none z-30">
            {product.houseCode ? (
              <div className="relative flex items-center gap-2 px-3 py-1.5 bg-[#060608]/85 backdrop-blur-xl border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold-400/70" />
                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold-400/70" />
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse shadow-[0_0_8px_#D4AF37]" />
                <span className="text-[8.5px] sm:text-[9px] font-mono tracking-[0.28em] text-white/95 uppercase font-medium">
                  {product.houseCode}
                </span>
              </div>
            ) : <div />}

            <div className="flex items-center gap-1.5">
              {product.imageTag && (
                <div className="relative flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#141109]/90 via-[#0a0906]/90 to-[#141109]/90 border border-gold-400/40 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.12)]">
                  <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-gold-400/80" />
                  <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-gold-400/80" />
                  <Sparkles size={9} className="text-gold-400 animate-pulse" />
                  <span className="text-[8px] sm:text-[8.5px] font-mono text-gold-300 tracking-[0.24em] uppercase font-semibold">
                    {product.imageTag}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Out of Stock Lockdown Lock */}
          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center p-6 z-40 pointer-events-none">
              <div className="border border-gold-400/30 p-6 text-center bg-black/90 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.8)] max-w-[240px]">
                <Lock size={26} className="text-gold-400 mx-auto mb-2 animate-pulse" />
                <p className="text-white font-serif tracking-[0.25em] text-base uppercase">EXHAUSTED</p>
                <div className="h-[1px] w-12 bg-gold-400/50 mx-auto my-2" />
                <p className="text-gold-400/80 text-[8.5px] font-mono uppercase tracking-[0.3em]">ACQUISITION CLOSED</p>
              </div>
            </div>
          )}

          {/* Side Nav Arrows for Multi-Images - Sculptural Atelier Controls */}
          {allImages.length > 1 && (
            <>
              <motion.button
                type="button"
                whileHover={{ scale: 1.06, x: -2 }}
                whileTap={{ scale: 0.94 }}
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                aria-label="Previous Perspective"
                className="group/nav absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-11 sm:w-10 sm:h-12 bg-[#060608]/80 hover:bg-[#0c0b08]/95 border border-white/15 hover:border-gold-400/80 text-white/75 hover:text-gold-300 flex items-center justify-center transition-all duration-300 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.85)] hover:shadow-[0_0_25px_rgba(212,175,55,0.3)] opacity-80 sm:opacity-0 group-hover:opacity-100 z-30 cursor-pointer overflow-hidden"
              >
                <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold-400/60 group-hover/nav:border-gold-300 transition-colors" />
                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold-400/60 group-hover/nav:border-gold-300 transition-colors" />
                <ChevronLeft size={17} className="group-hover/nav:-translate-x-0.5 transition-transform duration-300" />
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.06, x: 2 }}
                whileTap={{ scale: 0.94 }}
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                aria-label="Next Perspective"
                className="group/nav absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-11 sm:w-10 sm:h-12 bg-[#060608]/80 hover:bg-[#0c0b08]/95 border border-white/15 hover:border-gold-400/80 text-white/75 hover:text-gold-300 flex items-center justify-center transition-all duration-300 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.85)] hover:shadow-[0_0_25px_rgba(212,175,55,0.3)] opacity-80 sm:opacity-0 group-hover:opacity-100 z-30 cursor-pointer overflow-hidden"
              >
                <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-gold-400/60 group-hover/nav:border-gold-300 transition-colors" />
                <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-gold-400/60 group-hover/nav:border-gold-300 transition-colors" />
                <ChevronRight size={17} className="group-hover/nav:translate-x-0.5 transition-transform duration-300" />
              </motion.button>
            </>
          )}

          {/* Bottom Interactive Control Bar - Luxury Cinematic Hardware Buttons */}
          <div className="absolute bottom-3.5 inset-x-3.5 flex items-center justify-between gap-2 z-30 pointer-events-auto">
            {/* Macro Weave Inspection Toggle */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsZoomMode(!isZoomMode)}
              className={`group/loupe relative flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 text-[8.5px] sm:text-[9px] font-mono tracking-[0.24em] uppercase border transition-all duration-300 backdrop-blur-xl cursor-pointer overflow-hidden ${
                isZoomMode 
                  ? 'bg-gradient-to-r from-gold-500 via-gold-300 to-gold-500 text-black border-gold-300 font-bold shadow-[0_0_25px_rgba(212,175,55,0.55)]' 
                  : 'bg-[#070709]/88 text-white/90 border-white/20 hover:border-gold-400/80 hover:text-gold-200 shadow-[0_12px_30px_rgba(0,0,0,0.9)] hover:shadow-[0_0_20px_rgba(212,175,55,0.22)]'
              }`}
            >
              {/* Architectural Corner Reticles */}
              <span className={`absolute top-0 left-0 w-1.5 h-1.5 border-t border-l transition-colors ${isZoomMode ? 'border-black/60' : 'border-gold-400/70 group-hover/loupe:border-gold-300'}`} />
              <span className={`absolute top-0 right-0 w-1.5 h-1.5 border-t border-r transition-colors ${isZoomMode ? 'border-black/60' : 'border-gold-400/70 group-hover/loupe:border-gold-300'}`} />
              <span className={`absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l transition-colors ${isZoomMode ? 'border-black/60' : 'border-gold-400/70 group-hover/loupe:border-gold-300'}`} />
              <span className={`absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r transition-colors ${isZoomMode ? 'border-black/60' : 'border-gold-400/70 group-hover/loupe:border-gold-300'}`} />

              {/* Subtle Shimmer Sweep on Hover */}
              {!isZoomMode && (
                <span className="absolute inset-0 -translate-x-full group-hover/loupe:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-gold-300/15 to-transparent pointer-events-none" />
              )}

              {isZoomMode ? (
                <ZoomOut size={12} className="text-black shrink-0" />
              ) : (
                <ZoomIn size={12} className="text-gold-400 group-hover/loupe:scale-110 transition-transform duration-300 shrink-0" />
              )}
              <span className="relative z-10">{isZoomMode ? 'EXIT LOUPE' : 'INSPECT WEAVE'}</span>
            </motion.button>

            {/* Quick Perspective Toggle (Front / Reverse) */}
            {allImages.length > 1 && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((currentImageIndex + 1) % allImages.length);
                }}
                className="group/flip relative flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 text-[8.5px] sm:text-[9px] font-mono tracking-[0.24em] uppercase border border-gold-400/45 hover:border-gold-300 bg-gradient-to-r from-[#09090c]/90 via-[#15120a]/90 to-[#09090c]/90 backdrop-blur-xl text-gold-200 hover:text-white transition-all duration-300 shadow-[0_12px_30px_rgba(0,0,0,0.9),0_0_18px_rgba(212,175,55,0.15)] hover:shadow-[0_0_25px_rgba(212,175,55,0.35)] cursor-pointer overflow-hidden"
              >
                {/* Architectural Corner Reticles */}
                <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold-400/80 group-hover/flip:border-gold-200 transition-colors" />
                <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-gold-400/80 group-hover/flip:border-gold-200 transition-colors" />
                <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-gold-400/80 group-hover/flip:border-gold-200 transition-colors" />
                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold-400/80 group-hover/flip:border-gold-200 transition-colors" />

                {/* Subtle Shimmer Sweep on Hover */}
                <span className="absolute inset-0 -translate-x-full group-hover/flip:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-gold-300/20 to-transparent pointer-events-none" />

                <RefreshCw size={11} className="text-gold-400 group-hover/flip:rotate-180 transition-transform duration-500 ease-out shrink-0" />
                <span className="relative z-10 font-medium">{currentImageIndex === 0 ? "VIEW REVERSE" : "VIEW FRONT"}</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* --- MULTI-PERSPECTIVE FILMSTRIP THUMBNAILS DOCK --- */}
        {allImages.length > 1 && (
          <div className="relative z-20 mt-3 sm:mt-3.5 flex items-center justify-center gap-2.5 p-1.5 bg-[#070709]/85 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.9)] rounded-none shrink-0">
            <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold-400/60 pointer-events-none" />
            <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-gold-400/60 pointer-events-none" />
            <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-gold-400/60 pointer-events-none" />
            <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold-400/60 pointer-events-none" />
            {allImages.map((img: string, idx: number) => {
              const isActive = idx === currentImageIndex;
              const label = idx === 0 ? 'FRONT' : (idx === 1 ? 'REVERSE' : 'DETAIL');
              return (
                <motion.button
                  key={idx}
                  type="button"
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`group/thumb relative w-12 h-14 sm:w-14 sm:h-16 rounded-none overflow-hidden border transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'border-gold-400 shadow-[0_0_16px_rgba(212,175,55,0.5)] ring-1 ring-gold-400/40' 
                      : 'border-white/15 opacity-55 hover:opacity-100 hover:border-gold-400/50'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`Perspective ${label}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105" 
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-t from-gold-500/20 via-transparent to-transparent pointer-events-none" />
                  )}
                  <div className={`absolute bottom-0 inset-x-0 text-[6.5px] sm:text-[7px] font-mono text-center py-0.5 tracking-[0.2em] uppercase transition-colors ${
                    isActive ? 'bg-gold-400 text-black font-bold' : 'bg-black/90 text-white/85 group-hover/thumb:text-gold-300'
                  }`}>
                    {label}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductShowcase3D;
