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

  // Spring physics for smooth 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [16, -16]), { stiffness: 140, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-18, 18]), { stiffness: 140, damping: 20 });
  
  // Specular sheen tracking
  const glareX = useTransform(mouseX, [-0.5, 0.5], ['10%', '90%']);
  const glareY = useTransform(mouseY, [-0.5, 0.5], ['10%', '90%']);

  // Parallax shifts for internal depth elements
  const depthX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), { stiffness: 120, damping: 22 });
  const depthY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 22 });

  // Handle mouse movements for 3D tilt and optical zoom lens
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);

    if (isZoomMode) {
      const zoomX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const zoomY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setZoomCoords({ x: zoomX, y: zoomY });
    }
  }, [mouseX, mouseY, isZoomMode]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }, [mouseX, mouseY]);

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
      <div 
        className="relative z-10 w-full max-w-md px-4 flex flex-col items-center justify-center"
        style={{ perspective: 1400 }}
      >
        <motion.div
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
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          className="relative w-full aspect-[3/4] max-w-[280px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-[420px] rounded-sm bg-[#0A0A0A] border border-white/15 cursor-grab active:cursor-grabbing shadow-[0_30px_90px_rgba(0,0,0,0.9)] group"
        >
          {/* Ambient Z-Backplane Light Pool (Z: -30px) */}
          <motion.div
            style={{
              x: depthX,
              y: depthY,
              transform: "translateZ(-30px)",
            }}
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.18),transparent_70%)] pointer-events-none filter blur-xl"
          />

          {/* MAIN PRODUCT IMAGE WITH 3D DEPTH & ANAMORPHIC SHIMMER */}
          <div className="absolute inset-0 overflow-hidden rounded-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImage}
                initial={{ opacity: 0, scale: 1.08, rotateY: 10 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.94, rotateY: -10 }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 w-full h-full"
              >
                {!isZoomMode ? (
                  <motion.img 
                    src={currentImage}
                    alt={product.title}
                    animate={{ scale: [1, 1.025, 1] }}
                    transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                    className={`w-full h-full object-cover object-center filter brightness-[0.94] contrast-[1.04] transition-all duration-700 ${
                      !product.inStock ? 'grayscale contrast-125' : ''
                    }`}
                  />
                ) : (
                  // HIGH-RESOLUTION 3D TEXTURE INSPECTION MODE (LOUPE)
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
                    <div className="absolute top-4 left-4 px-2.5 py-1 bg-black/80 border border-gold-400/40 text-[9px] font-mono text-gold-300 uppercase tracking-widest backdrop-blur-md">
                      2.8X MACRO WEAVE INSPECTION
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Subtle Gradient & Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.55)_100%)] pointer-events-none" />

            {/* Dynamic Interactive Specular Sheen (Moves with cursor in 3D) */}
            <motion.div 
              className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity duration-700"
              style={{
                background: `radial-gradient(circle 380px at ${glareX} ${glareY}, rgba(255,255,255,0.3), transparent 70%)`,
                mixBlendMode: "overlay",
              }}
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

          {/* Top 3D Floating Status Badge (Z: +35px) */}
          <motion.div 
            style={{ transform: "translateZ(35px)" }}
            className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-30"
          >
            {product.houseCode ? (
              <div className="flex items-center gap-2 px-2.5 py-1 bg-black/75 backdrop-blur-md border border-white/15 rounded-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
                <span className="text-[8.5px] font-mono tracking-[0.25em] text-white/90 uppercase font-medium">
                  {product.houseCode}
                </span>
              </div>
            ) : <div />}

            <div className="flex items-center gap-1.5">
              {allImages.length > 1 && (
                <div className="px-2 py-0.5 bg-black/70 border border-white/15 backdrop-blur-md rounded-sm">
                  <span className="text-[8px] font-mono text-white/60 tracking-wider">
                    0{currentImageIndex + 1}/0{allImages.length}
                  </span>
                </div>
              )}
              {product.imageTag && (
                <div className="px-2 py-0.5 bg-gold-500/15 border border-gold-400/30 backdrop-blur-md rounded-sm">
                  <span className="text-[8px] font-mono text-gold-300 tracking-[0.2em] uppercase">
                    {product.imageTag}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Out of Stock Holographic Lockdown Lock (Z: +50px) */}
          {!product.inStock && (
            <motion.div 
              style={{ transform: "translateZ(50px)" }}
              className="absolute inset-0 flex items-center justify-center p-6 z-40 pointer-events-none"
            >
              <div className="border border-gold-400/30 p-6 text-center bg-black/90 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.8)] max-w-[240px]">
                <Lock size={26} className="text-gold-400 mx-auto mb-2 animate-pulse" />
                <p className="text-white font-serif tracking-[0.25em] text-base uppercase">EXHAUSTED</p>
                <div className="h-[1px] w-12 bg-gold-400/50 mx-auto my-2" />
                <p className="text-gold-400/80 text-[8.5px] font-mono uppercase tracking-[0.3em]">ACQUISITION CLOSED</p>
              </div>
            </motion.div>
          )}

          {/* Side Nav Arrows for Multi-Images */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                aria-label="Previous Perspective"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-white/10 hover:border-gold-400 text-white/70 hover:text-gold-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-30"
                style={{ transform: "translateZ(40px)" }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                aria-label="Next Perspective"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-white/10 hover:border-gold-400 text-white/70 hover:text-gold-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-30"
                style={{ transform: "translateZ(40px)" }}
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}

          {/* Bottom 3D Interactive Control Bar (Z: +40px) */}
          <motion.div 
            style={{ transform: "translateZ(40px)" }}
            className="absolute bottom-3 inset-x-3 flex items-center justify-between z-30 pointer-events-auto"
          >
            {/* Macro Weave Inspection Toggle */}
            <button
              onClick={() => setIsZoomMode(!isZoomMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[8.5px] font-mono tracking-[0.2em] uppercase rounded-none border transition-all duration-300 backdrop-blur-md ${
                isZoomMode 
                  ? 'bg-gold-400 text-black border-gold-400 font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                  : 'bg-black/70 text-white/80 border-white/15 hover:border-gold-400/60 hover:text-gold-300'
              }`}
            >
              {isZoomMode ? <ZoomOut size={11} /> : <ZoomIn size={11} />}
              <span>{isZoomMode ? 'EXIT LOUPE' : 'INSPECT WEAVE'}</span>
            </button>

            {/* Quick Perspective Toggle (Front / Reverse) */}
            {allImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((currentImageIndex + 1) % allImages.length);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[8.5px] font-mono tracking-[0.2em] uppercase rounded-none border border-gold-500/30 bg-black/80 hover:border-gold-400 text-gold-300 transition-all duration-300 shadow-lg cursor-pointer"
              >
                <RefreshCw size={10} className="text-gold-400" />
                <span>{currentImageIndex === 0 ? "VIEW REVERSE (02)" : "VIEW FRONT (01)"}</span>
              </button>
            )}

            <span className="text-[8px] font-mono text-white/40 tracking-widest hidden lg:inline-block">
              3D GYROSCOPE ACTIVE
            </span>
          </motion.div>
        </motion.div>

        {/* --- MULTI-PERSPECTIVE 3D FILMSTRIP THUMBNAILS DOCK --- */}
        {allImages.length > 1 && (
          <div className="relative z-20 mt-4 sm:mt-5 flex items-center justify-center gap-2 p-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-none">
            {allImages.map((img: string, idx: number) => {
              const isActive = idx === currentImageIndex;
              const label = idx === 0 ? '01 FRONT' : (idx === 1 ? '02 REVERSE' : `0${idx + 1} DETAIL`);
              return (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative w-14 h-16 sm:w-16 sm:h-18 rounded-none overflow-hidden border transition-all duration-300 ${
                    isActive 
                      ? 'border-gold-400 shadow-[0_0_12px_rgba(212,175,55,0.5)]' 
                      : 'border-white/10 opacity-50 hover:opacity-90 hover:border-white/40'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`Perspective ${idx + 1}`}
                    className="w-full h-full object-cover" 
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-gold-400/10 pointer-events-none" />
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-black/90 text-[6.5px] sm:text-[7.5px] font-mono text-center text-white/90 py-0.5 tracking-wider">
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
