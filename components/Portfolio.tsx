import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import { ArrowUpRight, ChevronLeft, ChevronRight, Sparkles, Eye, RotateCw } from 'lucide-react';

interface PortfolioProps {
  onEnterShop: () => void;
}

interface FormPiece {
  id: string;
  title: string;
  code: string;
  subtitle: string;
  tag: string;
  year: string;
  imgUrl: string;
  material: string;
  weight: string;
}

const DEFAULT_FORM_PIECES: FormPiece[] = [
  {
    id: 'sov-01',
    title: 'SOVEREIGN',
    code: 'FORM 01 / PIECE 01',
    subtitle: 'Sculpted Heavy French Terry Hoodie',
    tag: 'SIGNATURE SILHOUETTE',
    year: '2026',
    imgUrl: 'https://ik.imagekit.io/dto1zguat/Evolve_1.jpg',
    material: 'Organic Supima Cotton',
    weight: '480 GSM Heavyweight'
  },
  {
    id: 'dst-02',
    title: 'DUSTBOUND',
    code: 'FORM 01 / PIECE 02',
    subtitle: 'Mineral Washed Custom Fleece',
    tag: 'LIMITED CAPSULE',
    year: '2026',
    imgUrl: 'https://ik.imagekit.io/dto1zguat/Dustbound_1.jpg?updatedAt=1775277953541',
    material: 'Dyed Mineral Fleece',
    weight: '420 GSM Hand-Distressed'
  },
  {
    id: 'eth-03',
    title: 'ETERNAL HORIZON',
    code: 'FORM 01 / PIECE 03',
    subtitle: 'Double-Faced Bonded Wool Silhouette',
    tag: 'ARCHITECTURAL OUTERWEAR',
    year: '2026',
    imgUrl: 'https://ik.imagekit.io/dto1zguat/EternalHorizon_1.jpg?updatedAt=1775278022400',
    material: 'Virgin Merino Blend',
    weight: '560 GSM Bonded Structure'
  },
  {
    id: 'evl-04',
    title: 'EVOLVE TEE',
    code: 'FORM 01 / PIECE 04',
    subtitle: 'Mercerized Combed Heavy Cotton',
    tag: 'FOUNDATIONAL PIECE',
    year: '2026',
    imgUrl: 'https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983',
    material: 'Combed Long-Staple Cotton',
    weight: '320 GSM Structural Drop'
  },
  {
    id: 'eth-05',
    title: 'ETERNAL MONOLITH',
    code: 'FORM 01 / PIECE 05',
    subtitle: 'Singular Architectural Pattern Overcoat',
    tag: 'STUDIO ARCHIVE',
    year: '2026',
    imgUrl: 'https://ik.imagekit.io/dto1zguat/EternalHorizon_2.jpg?updatedAt=1775278048419',
    material: 'Raw Texturized Canvas',
    weight: '620 GSM Tailored Weave'
  }
];

const Portfolio: React.FC<PortfolioProps> = ({ onEnterShop }) => {
  const { content } = useSettings();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoOrbit, setIsAutoOrbit] = useState(true);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Normalize form pieces list with custom settings if present
  const pieces: FormPiece[] = React.useMemo(() => {
    if (content.scrollImages && content.scrollImages.length > 0) {
      return content.scrollImages.map((url, idx) => {
        const fallback = DEFAULT_FORM_PIECES[idx % DEFAULT_FORM_PIECES.length];
        return {
          id: `custom-piece-${idx}`,
          title: fallback.title,
          code: `FORM 01 / 0${idx + 1}`,
          subtitle: fallback.subtitle,
          tag: fallback.tag,
          year: fallback.year,
          imgUrl: url,
          material: fallback.material,
          weight: fallback.weight
        };
      });
    }
    return DEFAULT_FORM_PIECES;
  }, [content.scrollImages]);

  // Motion values for real-time 3D cursor perspective
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Responsive 3D springs
  const springX = useSpring(mouseX, { stiffness: 90, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 90, damping: 20 });

  // Map mouse coordinate to 3D rotation angles
  const rotateX = useTransform(springY, [-0.5, 0.5], [16, -16]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-22, 22]);
  const translateZLayer = useTransform(springX, [-0.5, 0.5], [-15, 15]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  // Handle navigation
  const nextPiece = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % pieces.length);
  }, [pieces.length]);

  const prevPiece = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + pieces.length) % pieces.length);
  }, [pieces.length]);

  // Auto-orbit cycling when active
  useEffect(() => {
    if (!isAutoOrbit) return;
    const timer = setInterval(() => {
      nextPiece();
    }, 6000);
    return () => clearInterval(timer);
  }, [isAutoOrbit, nextPiece]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextPiece();
      if (e.key === 'ArrowLeft') prevPiece();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPiece, prevPiece]);

  const activePiece = pieces[activeIndex] || pieces[0];
  const prevPieceIndex = (activeIndex - 1 + pieces.length) % pieces.length;
  const nextPieceIndex = (activeIndex + 1) % pieces.length;

  return (
    <section id="works" className="relative bg-black/40 py-20 md:py-28 overflow-hidden select-none">
      {/* Dynamic 3D Atmospheric Backing - No hard borders */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.12, 0.25, 0.12],
            x: ['-5%', '5%', '-5%'],
            y: ['-5%', '5%', '-5%']
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[700px] md:w-[1000px] h-[700px] md:h-[1000px] rounded-full bg-gradient-to-b from-gold-500/15 via-amber-700/5 to-transparent blur-[120px]"
        />
        <div className="absolute inset-0 bg-radial from-transparent via-black/60 to-black pointer-events-none" />
      </div>

      {/* Editorial Header - Refined Small Size, Extra Styled & Animated */}
      <div className="relative z-10 px-6 md:px-12 max-w-7xl mx-auto mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            {/* Animated Micro Header Eyebrow */}
            <motion.div 
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex items-center gap-2.5 mb-2"
            >
              <span className="w-5 h-[1px] bg-gold-400/80" />
              <motion.span 
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="text-[9px] md:text-[10px] font-mono tracking-[0.35em] uppercase text-gold-400 font-medium flex items-center gap-1.5"
              >
                <Sparkles size={10} className="text-gold-400 animate-pulse" />
                HOUSE ARCHIVE // FORM 01
              </motion.span>
              <span className="text-white/20 font-mono text-[9px]">// [2026.EDITION]</span>
            </motion.div>

            {/* Small Sized Extra-Styled Title */}
            <div className="flex items-baseline gap-3">
              <motion.h2 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-lg md:text-2xl font-serif text-white tracking-[0.25em] uppercase font-light"
              >
                DEUZ — <span className="italic text-gold-300 font-normal">FORM 01</span>
              </motion.h2>

              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="hidden sm:inline-block text-[9px] font-mono tracking-[0.3em] uppercase text-white/40 px-2 py-0.5 border border-white/10 bg-white/[0.02]"
              >
                PERMANENT COLLECTION
              </motion.span>
            </div>

            {/* Small Styled Sub-text */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="text-white/40 text-[10px] md:text-[11px] font-mono tracking-[0.2em] uppercase mt-1.5 font-light max-w-lg"
            >
              Dimensional silhouettes in permanent levitation. Pure sculpted form, free of boundary.
            </motion.p>
          </div>

          <div className="flex items-center gap-3">
            {/* 3D Auto-Orbit Toggle Button - Small & Extra Styled */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAutoOrbit(!isAutoOrbit)}
              className={`group flex items-center gap-2 px-3 py-1.5 text-[9px] font-mono tracking-[0.25em] uppercase transition-all duration-300 ${
                isAutoOrbit
                  ? 'text-gold-300 bg-gold-500/10 border-b border-gold-400 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                  : 'text-white/40 hover:text-white border-b border-white/10 hover:border-white/30 bg-black/20'
              }`}
              title="Toggle continuous 3D perspective rotation"
            >
              <RotateCw 
                size={11} 
                className={`transition-transform duration-500 ${isAutoOrbit ? 'animate-spin text-gold-400' : 'group-hover:rotate-45'}`} 
                style={{ animationDuration: '7s' }} 
              />
              <span>{isAutoOrbit ? 'ORBIT • ON' : 'ORBIT • PAUSED'}</span>
            </motion.button>

            {/* Direct Shop Entry - Extra Styled */}
            <motion.button
              whileHover={{ x: 2 }}
              onClick={onEnterShop}
              className="group flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono tracking-[0.25em] uppercase text-white/60 hover:text-gold-300 transition-colors border-b border-white/15 hover:border-gold-400/80 bg-white/[0.02]"
            >
              <span>ENTER SHOP</span>
              <ArrowUpRight size={12} className="text-gold-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* 3D Interactive Exhibition Stage (Without page-scroll locking) */}
      <div 
        ref={stageRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX === null) return;
          const diff = touchStartX - e.changedTouches[0].clientX;
          if (diff > 40) nextPiece();
          if (diff < -40) prevPiece();
          setTouchStartX(null);
        }}
        className="relative z-10 w-full max-w-7xl mx-auto h-[540px] md:h-[680px] flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ perspective: 1200 }}
      >
        {/* Navigation Arrow Controls (Sides) */}
        <button
          onClick={prevPiece}
          aria-label="Previous Piece"
          className="absolute left-4 md:left-8 z-30 w-12 h-12 flex items-center justify-center text-white/40 hover:text-gold-400 transition-all duration-300 hover:scale-110"
        >
          <ChevronLeft size={36} strokeWidth={1.2} />
        </button>
        <button
          onClick={nextPiece}
          aria-label="Next Piece"
          className="absolute right-4 md:right-8 z-30 w-12 h-12 flex items-center justify-center text-white/40 hover:text-gold-400 transition-all duration-300 hover:scale-110"
        >
          <ChevronRight size={36} strokeWidth={1.2} />
        </button>

        {/* 3D Rotational Stage Anchor */}
        <motion.div
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {/* LEFT RECESSED PIECE (3D Ghost Preview with Soft Edge Fade) */}
          <div
            onClick={prevPiece}
            className="hidden lg:flex absolute left-[5%] xl:left-[8%] top-1/2 -translate-y-1/2 w-[340px] h-[460px] cursor-pointer items-center justify-center transition-all duration-700 select-none group"
            style={{
              transform: 'translateZ(-140px) rotateY(32deg)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="relative w-full h-full flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity duration-500">
              <img
                src={pieces[prevPieceIndex].imgUrl}
                alt={pieces[prevPieceIndex].title}
                className="max-w-full max-h-full object-contain pointer-events-none filter grayscale contrast-125"
                style={{
                  WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 85%)',
                  maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 85%)',
                }}
              />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-1">
                <span className="text-[8px] font-mono tracking-[0.35em] text-gold-400 uppercase block mb-0.5">
                  // {pieces[prevPieceIndex].code}
                </span>
                <p className="text-[9px] font-serif tracking-[0.25em] text-white/80 uppercase">
                  PREVIOUS PIECE
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT RECESSED PIECE (3D Ghost Preview with Soft Edge Fade) */}
          <div
            onClick={nextPiece}
            className="hidden lg:flex absolute right-[5%] xl:right-[8%] top-1/2 -translate-y-1/2 w-[340px] h-[460px] cursor-pointer items-center justify-center transition-all duration-700 select-none group"
            style={{
              transform: 'translateZ(-140px) rotateY(-32deg)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="relative w-full h-full flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity duration-500">
              <img
                src={pieces[nextPieceIndex].imgUrl}
                alt={pieces[nextPieceIndex].title}
                className="max-w-full max-h-full object-contain pointer-events-none filter grayscale contrast-125"
                style={{
                  WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 85%)',
                  maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 85%)',
                }}
              />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-1">
                <span className="text-[8px] font-mono tracking-[0.35em] text-gold-400 uppercase block mb-0.5">
                  // {pieces[nextPieceIndex].code}
                </span>
                <p className="text-[9px] font-serif tracking-[0.25em] text-white/80 uppercase">
                  NEXT PIECE
                </p>
              </div>
            </div>
          </div>

          {/* CENTER 3D HERO PIECE (Free-floating, completely unboxed, edge-faded) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activePiece.id}
              initial={{ opacity: 0, scale: 0.88, z: -100, rotateY: 18 }}
              animate={{ opacity: 1, scale: 1, z: 40, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, z: 80, rotateY: -18 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              style={{
                transformStyle: 'preserve-3d',
              }}
              className="relative w-[92vw] sm:w-[540px] md:w-[640px] h-[480px] md:h-[580px] flex flex-col items-center justify-center"
            >
              {/* Backlight Volumetric Depth Glow (Zero solid border) */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.35, 0.55, 0.35],
                }}
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  transform: 'translateZ(-60px)',
                }}
                className="absolute w-[340px] md:w-[480px] h-[340px] md:h-[480px] rounded-full bg-gradient-to-tr from-gold-500/25 via-amber-600/15 to-transparent blur-[90px] pointer-events-none"
              />

              {/* Free-floating 3D Oscillating Image Container with Soft Feather Edge-Fading */}
              <motion.div
                animate={{
                  y: [-12, 12, -12],
                  rotateZ: [-1.2, 1.2, -1.2],
                  z: [30, 50, 30],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  transformStyle: 'preserve-3d',
                }}
                className="relative w-full h-[360px] md:h-[440px] flex items-center justify-center"
                onClick={onEnterShop}
              >
                {/* The Unboxed Image with Gradient Feather Mask (No solid borders) */}
                <div 
                  className="relative w-full h-full flex items-center justify-center"
                  style={{
                    WebkitMaskImage: 'radial-gradient(ellipse 75% 82% at 50% 50%, rgba(0,0,0,1) 45%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0) 100%)',
                    maskImage: 'radial-gradient(ellipse 75% 82% at 50% 50%, rgba(0,0,0,1) 45%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0) 100%)',
                  }}
                >
                  <img
                    src={activePiece.imgUrl}
                    alt={activePiece.title}
                    className="max-w-full max-h-full object-contain filter contrast-[1.08] brightness-105 drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
                  />
                  
                  {/* Gentle Shimmer Sheen across the unboxed silhouette */}
                  <motion.div
                    animate={{ x: ['-200%', '200%'] }}
                    transition={{
                      duration: 3.8,
                      repeat: Infinity,
                      repeatDelay: 2,
                      ease: 'easeInOut',
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] pointer-events-none"
                  />
                </div>

                {/* Floating 3D Metadata Hologram Badge - Small, Extra Styled & Animated */}
                <motion.div
                  style={{
                    transform: 'translateZ(65px)',
                  }}
                  animate={{
                    y: [-2, 2, -2],
                    opacity: [0.85, 1, 0.85],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute top-2 right-4 md:right-8 flex items-center gap-2 px-2.5 py-1 bg-black/60 backdrop-blur-md border-b border-gold-400/40 text-[8px] md:text-[9px] font-mono tracking-[0.3em] text-gold-300 uppercase shadow-2xl pointer-events-none"
                >
                  <span className="w-1 h-1 rounded-full bg-gold-400 animate-ping" />
                  <span className="text-white/30">//</span>
                  <span>{activePiece.code}</span>
                </motion.div>
              </motion.div>

              {/* Unboxed 3D Focal Information Card - Small Sized, Extra Styled & Animated */}
              <motion.div
                style={{
                  transform: 'translateZ(50px)',
                }}
                className="mt-1 text-center max-w-lg px-4"
              >
                {/* Animated Small Tag & Weight Eyebrow */}
                <motion.div 
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="flex items-center justify-center gap-2 mb-1"
                >
                  <span className="text-[9px] font-mono tracking-[0.35em] uppercase text-gold-400 flex items-center gap-1.5 font-medium">
                    <Sparkles size={10} className="text-gold-400 animate-pulse" />
                    [{activePiece.tag}]
                  </span>
                  <span className="text-white/20 font-mono text-[9px]">•</span>
                  <span className="text-[8px] md:text-[9px] font-mono tracking-[0.25em] text-white/50 uppercase">
                    {activePiece.weight}
                  </span>
                </motion.div>

                {/* Small Sized Extra-Styled Title with Animated Letter Spacing & Reveal */}
                <motion.div
                  initial={{ opacity: 0, y: 8, letterSpacing: '0.15em' }}
                  animate={{ opacity: 1, y: 0, letterSpacing: '0.3em' }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="relative inline-block my-1"
                >
                  <h3 className="text-base sm:text-lg md:text-xl font-serif text-white tracking-[0.3em] uppercase font-light">
                    <span className="text-white/30 font-mono text-xs mr-2 font-normal">/</span>
                    {activePiece.title}
                    <span className="text-white/30 font-mono text-xs ml-2 font-normal">/</span>
                  </h3>
                  {/* Subtle golden underline animation */}
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-[1px] w-full bg-gradient-to-r from-transparent via-gold-400/60 to-transparent mt-1"
                  />
                </motion.div>

                {/* Small Sized Architectural Specifications Strip */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-1 flex flex-col items-center gap-1"
                >
                  <p className="text-[10px] md:text-[11px] text-white/60 font-light tracking-[0.2em] uppercase font-mono">
                    {activePiece.subtitle}
                  </p>
                  <p className="text-[9px] text-gold-400/80 font-mono tracking-[0.25em] uppercase">
                    FABRIC // {activePiece.material}
                  </p>
                </motion.div>

                {/* Small Sized Action Button with Animated Interactions */}
                <motion.div 
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mt-3 flex items-center justify-center"
                >
                  <motion.button
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onEnterShop}
                    className="group relative flex items-center gap-2 px-4 py-1.5 bg-black/40 hover:bg-gold-500/15 text-gold-300 hover:text-white transition-all duration-300 text-[9px] font-mono tracking-[0.3em] uppercase border-b border-gold-400/70"
                  >
                    <Eye size={11} className="text-gold-400 group-hover:scale-110 transition-transform" />
                    <span>EXAMINE PIECE</span>
                    <ArrowUpRight size={11} className="text-gold-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Piece Selector Ribbon & Pagination Dials (Small Size, Extra Styled & Animated) */}
      <div className="relative z-10 max-w-4xl mx-auto mt-4 md:mt-6 px-6">
        <div className="flex items-center justify-center gap-1.5 md:gap-2.5 flex-wrap">
          {pieces.map((piece, idx) => {
            const isActive = idx === activeIndex;
            return (
              <motion.button
                key={piece.id}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveIndex(idx)}
                className={`group relative px-2.5 md:px-3 py-1.5 text-left transition-all duration-300 ${
                  isActive ? 'opacity-100' : 'opacity-40 hover:opacity-80'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-mono tracking-[0.2em] ${isActive ? 'text-gold-400 font-bold' : 'text-white/50'}`}>
                    0{idx + 1}
                  </span>
                  <span className={`text-[10px] md:text-[11px] font-serif tracking-[0.2em] uppercase transition-colors ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>
                    {piece.title}
                  </span>
                </div>
                {/* Animated Indicator Line */}
                <div className="relative mt-1 h-[2px] w-full bg-white/[0.06] overflow-hidden">
                  {isActive && (
                    <motion.div 
                      layoutId="activeForm01Tab"
                      className="absolute inset-0 bg-gradient-to-r from-gold-400 via-amber-300 to-gold-400"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Small Animated Helper Hint */}
        <motion.p 
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="text-center text-[8px] md:text-[9px] font-mono tracking-[0.3em] text-white/30 uppercase mt-4 block md:hidden"
        >
          [ SWIPE OR DRAG TO ROTATE 3D PIECES ]
        </motion.p>
      </div>
    </section>
  );
};

export default Portfolio;
