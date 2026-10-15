import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, Sparkles, Eye, RefreshCw } from 'lucide-react';
import { db } from '../utils/db';
import { getProductImageSet } from '../utils/productImages';

interface PortfolioProps {
  onEnterShop: () => void;
}

interface FormPiece {
  id: string;
  title: string;
  code: string;
  tag: string;
  year: string;
  imgUrl: string;
  secondaryImgUrl: string;
  allImages: string[];
  material: string;
  weight: string;
}

const DEFAULT_FORM_PIECES: FormPiece[] = [
  {
    id: 'sov-01',
    title: 'SOVEREIGN',
    code: 'FORM 01 ∞ PIECE 01',
    tag: 'SIGNATURE SILHOUETTE',
    year: '2026',
    imgUrl: 'https://ik.imagekit.io/dto1zguat/Evolve_1.jpg',
    secondaryImgUrl: 'https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983',
    allImages: ['https://ik.imagekit.io/dto1zguat/Evolve_1.jpg', 'https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983'],
    material: 'Organic Supima Cotton',
    weight: '480 GSM Heavyweight'
  },
  {
    id: 'dst-02',
    title: 'DUSTBOUND',
    code: 'FORM 01 ∞ PIECE 02',
    tag: 'LIMITED CAPSULE',
    year: '2026',
    imgUrl: 'https://ik.imagekit.io/dto1zguat/Dustbound_1.jpg?updatedAt=1775277953541',
    secondaryImgUrl: 'https://ik.imagekit.io/dto1zguat/Dustbound_2.jpg',
    allImages: ['https://ik.imagekit.io/dto1zguat/Dustbound_1.jpg?updatedAt=1775277953541', 'https://ik.imagekit.io/dto1zguat/Dustbound_2.jpg'],
    material: 'Dyed Mineral Fleece',
    weight: '420 GSM Hand-Distressed'
  },
  {
    id: 'eth-03',
    title: 'ETERNAL HORIZON',
    code: 'FORM 01 ∞ PIECE 03',
    tag: 'ARCHITECTURAL OUTERWEAR',
    year: '2026',
    imgUrl: 'https://ik.imagekit.io/dto1zguat/EternalHorizon_1.jpg?updatedAt=1775278022400',
    secondaryImgUrl: 'https://ik.imagekit.io/dto1zguat/EternalHorizon_2.jpg?updatedAt=1775278048419',
    allImages: ['https://ik.imagekit.io/dto1zguat/EternalHorizon_1.jpg?updatedAt=1775278022400', 'https://ik.imagekit.io/dto1zguat/EternalHorizon_2.jpg?updatedAt=1775278048419'],
    material: 'Virgin Merino Blend',
    weight: '560 GSM Bonded Structure'
  },
  {
    id: 'evl-04',
    title: 'EVOLVE TEE',
    code: 'FORM 01 ∞ PIECE 04',
    tag: 'FOUNDATIONAL PIECE',
    year: '2026',
    imgUrl: 'https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983',
    secondaryImgUrl: 'https://ik.imagekit.io/dto1zguat/Evolve_1.jpg',
    allImages: ['https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983', 'https://ik.imagekit.io/dto1zguat/Evolve_1.jpg'],
    material: 'Combed Long-Staple Cotton',
    weight: '320 GSM Structural Drop'
  },
  {
    id: 'eth-05',
    title: 'ETERNAL MONOLITH',
    code: 'FORM 01 ∞ PIECE 05',
    tag: 'STUDIO ARCHIVE',
    year: '2026',
    imgUrl: 'https://ik.imagekit.io/dto1zguat/EternalHorizon_2.jpg?updatedAt=1775278048419',
    secondaryImgUrl: 'https://ik.imagekit.io/dto1zguat/EternalHorizon_3.jpg',
    allImages: ['https://ik.imagekit.io/dto1zguat/EternalHorizon_2.jpg?updatedAt=1775278048419', 'https://ik.imagekit.io/dto1zguat/EternalHorizon_3.jpg'],
    material: 'Raw Texturized Canvas',
    weight: '620 GSM Tailored Weave'
  }
];

const Portfolio: React.FC<PortfolioProps> = ({ onEnterShop }) => {
  const [liveProducts, setLiveProducts] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Live Firestore subscription: Real-time synchronization with collection
  // When admin adds new product, updates, or transfers to archive, it reflects here immediately
  useEffect(() => {
    const unsubscribe = db.subscribeProducts((prods) => {
      if (prods && Array.isArray(prods)) {
        setLiveProducts(prods);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Map products: active collection items only (exclude archived items)
  const pieces: FormPiece[] = React.useMemo(() => {
    if (liveProducts && liveProducts.length > 0) {
      const activeProducts = liveProducts.filter((p: any) => !p.isArchived);
      if (activeProducts.length > 0) {
        return activeProducts.map((p: any, idx: number) => {
          const cleanTitle = p.title
            ? p.title.replace(/^DEUZ\s*(FORM\s*\d+\s*)?[—–-]\s*/i, '').trim()
            : `PIECE 0${idx + 1}`;
          const imgSet = getProductImageSet(p);
          return {
            id: p._id || p.id || `live-piece-${idx}`,
            title: cleanTitle || p.title || 'EXCLUSIVE CUT',
            code: p.houseCode || `FORM 01 ∞ 0${idx + 1}`,
            tag: p.imageTag || 'EXCLUSIVE CUT',
            year: '2026',
            imgUrl: imgSet.primary,
            secondaryImgUrl: imgSet.secondary,
            allImages: imgSet.allImages,
            material: p.details?.Fabric || 'ORGANIC SUPIMA COTTON',
            weight: p.details?.Silhouette || p.details?.Cut || ''
          };
        });
      }
    }
    return DEFAULT_FORM_PIECES;
  }, [liveProducts]);

  // Ensure activeIndex is always within valid range when collection updates
  useEffect(() => {
    if (activeIndex >= pieces.length && pieces.length > 0) {
      setActiveIndex(0);
    }
  }, [pieces.length, activeIndex]);

  // Motion values for real-time 3D cursor perspective
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Responsive 3D springs
  const springX = useSpring(mouseX, { stiffness: 90, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 90, damping: 20 });

  // Map mouse coordinate to 3D rotation angles
  const rotateX = useTransform(springY, [-0.5, 0.5], [16, -16]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-22, 22]);

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

  // Auto-play: Automatically advance through the images of DEUZ FORM 01
  useEffect(() => {
    if (isPaused || pieces.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % pieces.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, pieces.length, activeIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextPiece();
      if (e.key === 'ArrowLeft') prevPiece();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPiece, prevPiece]);

  const [centerHovered, setCenterHovered] = useState(false);
  const [manualCenterPerspective, setManualCenterPerspective] = useState<number | null>(null);

  // Reset perspective when active index changes
  useEffect(() => {
    setCenterHovered(false);
    setManualCenterPerspective(null);
  }, [activeIndex]);

  const activePiece = pieces[activeIndex] || pieces[0];
  const prevPieceIndex = (activeIndex - 1 + pieces.length) % pieces.length;
  const nextPieceIndex = (activeIndex + 1) % pieces.length;

  const isShowingCenterAlternate = manualCenterPerspective !== null
    ? manualCenterPerspective === 1
    : centerHovered;

  const centerDisplayImg = isShowingCenterAlternate
    ? (activePiece.secondaryImgUrl || activePiece.imgUrl)
    : activePiece.imgUrl;

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
                HOUSE ARCHIVE ∞ FORM 01
              </motion.span>
              <span className="text-white/20 font-mono text-[9px]">∞ EXCLUSIVE CUT</span>
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
                className="inline-block text-[9px] font-mono tracking-[0.3em] uppercase text-white/40 px-2 py-0.5 border border-white/10 bg-white/[0.02]"
              >
                ONE OF ONE
              </motion.span>
            </div>

            {/* Sub-text */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="text-white/40 text-[10px] md:text-[11px] font-mono tracking-[0.2em] uppercase mt-1.5 font-light max-w-lg"
            >
              CREATED ONCE. NEVER REPRODUCED.
            </motion.p>
          </div>

          <div className="flex items-center gap-3">
            {/* Direct House Entry */}
            <motion.button
              whileHover={{ x: 2 }}
              onClick={onEnterShop}
              className="group flex items-center gap-1.5 px-3.5 py-1.5 text-[9px] font-mono tracking-[0.25em] uppercase text-white/60 hover:text-gold-300 transition-colors border-b border-white/15 hover:border-gold-400/80 bg-white/[0.02]"
            >
              <span>ENTER HOUSE</span>
              <ArrowUpRight size={12} className="text-gold-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* 3D Interactive Exhibition Stage */}
      <div 
        ref={stageRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          handleMouseLeave();
          setIsPaused(false);
        }}
        onTouchStart={(e) => {
          setIsPaused(true);
          setTouchStartX(e.touches[0].clientX);
        }}
        onTouchEnd={(e) => {
          if (touchStartX !== null) {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (diff > 40) nextPiece();
            if (diff < -40) prevPiece();
            setTouchStartX(null);
          }
          setIsPaused(false);
        }}
        className="relative z-10 w-full max-w-7xl mx-auto h-[520px] md:h-[660px] flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ perspective: 1200 }}
      >
        {/* 3D Rotational Stage Anchor */}
        <motion.div
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {/* LEFT RECESSED PIECE (3D Ghost Preview with Soft Edge Fade for ALL Screens) */}
          <div
            onClick={prevPiece}
            className="flex absolute -left-8 sm:left-[1%] md:left-[3%] lg:left-[6%] xl:left-[8%] top-1/2 -translate-y-1/2 w-[160px] sm:w-[220px] md:w-[280px] lg:w-[340px] h-[260px] sm:h-[340px] md:h-[400px] lg:h-[460px] cursor-pointer items-center justify-center transition-all duration-700 select-none group z-10"
            style={{
              transform: 'translateZ(-140px) rotateY(32deg)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="relative w-full h-full flex items-center justify-center opacity-35 group-hover:opacity-65 transition-opacity duration-500">
              <img
                src={pieces[prevPieceIndex]?.imgUrl}
                alt={pieces[prevPieceIndex]?.title}
                className="max-w-full max-h-full object-contain pointer-events-none filter grayscale contrast-125"
                style={{
                  WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 85%)',
                  maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 85%)',
                }}
              />
              <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-center whitespace-nowrap opacity-70 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-1">
                <span className="text-[7px] sm:text-[8px] font-mono tracking-[0.35em] text-gold-400 uppercase block mb-0.5">
                  ∞ {pieces[prevPieceIndex]?.code}
                </span>
                <p className="text-[8px] sm:text-[9px] font-serif tracking-[0.25em] text-white/80 uppercase">
                  PREVIOUS PIECE
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT RECESSED PIECE (3D Ghost Preview with Soft Edge Fade for ALL Screens) */}
          <div
            onClick={nextPiece}
            className="flex absolute -right-8 sm:right-[1%] md:right-[3%] lg:right-[6%] xl:right-[8%] top-1/2 -translate-y-1/2 w-[160px] sm:w-[220px] md:w-[280px] lg:w-[340px] h-[260px] sm:h-[340px] md:h-[400px] lg:h-[460px] cursor-pointer items-center justify-center transition-all duration-700 select-none group z-10"
            style={{
              transform: 'translateZ(-140px) rotateY(-32deg)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="relative w-full h-full flex items-center justify-center opacity-35 group-hover:opacity-65 transition-opacity duration-500">
              <img
                src={pieces[nextPieceIndex]?.imgUrl}
                alt={pieces[nextPieceIndex]?.title}
                className="max-w-full max-h-full object-contain pointer-events-none filter grayscale contrast-125"
                style={{
                  WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 85%)',
                  maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 85%)',
                }}
              />
              <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-center whitespace-nowrap opacity-70 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-1">
                <span className="text-[7px] sm:text-[8px] font-mono tracking-[0.35em] text-gold-400 uppercase block mb-0.5">
                  ∞ {pieces[nextPieceIndex]?.code}
                </span>
                <p className="text-[8px] sm:text-[9px] font-serif tracking-[0.25em] text-white/80 uppercase">
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
              className="relative w-[92vw] sm:w-[540px] md:w-[640px] h-[480px] md:h-[580px] flex flex-col items-center justify-center z-20"
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

              {/* Free-floating 3D Oscillating Image Container with Soft Feather Edge-Fading & Perspective Animation */}
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
                className="relative w-full h-[360px] md:h-[440px] flex items-center justify-center cursor-pointer group"
                onMouseEnter={() => {
                  setCenterHovered(true);
                  setManualCenterPerspective(null);
                }}
                onMouseLeave={() => {
                  setCenterHovered(false);
                  setManualCenterPerspective(null);
                }}
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
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={centerDisplayImg}
                      initial={{ opacity: 0, scale: 0.94, filter: 'blur(3px)' }}
                      animate={{ opacity: 1, scale: isShowingCenterAlternate ? 1.03 : 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, scale: 1.04, filter: 'blur(3px)' }}
                      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                      src={centerDisplayImg}
                      alt={activePiece.title}
                      className="max-w-full max-h-full object-contain filter contrast-[1.08] brightness-105 drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
                    />
                  </AnimatePresence>
                  
                  {/* Gentle Shimmer Sheen across the unboxed silhouette */}
                  <motion.div
                    key={`sheen-${centerDisplayImg}`}
                    initial={{ x: '-150%' }}
                    animate={{ x: '150%' }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-[-25deg] pointer-events-none"
                  />
                </div>

                {/* Perspective Angle Switcher Hologram Button */}
                <motion.div
                  style={{
                    transform: 'translateZ(65px)',
                  }}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 bg-black/80 backdrop-blur-md border border-gold-400/40 text-[8px] md:text-[9px] font-mono tracking-[0.25em] text-gold-300 uppercase shadow-2xl pointer-events-auto cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setManualCenterPerspective(prev => prev === 1 ? 0 : 1);
                  }}
                >
                  <RefreshCw size={10} className={`text-gold-400 ${isShowingCenterAlternate ? 'rotate-180' : ''} transition-transform duration-500`} />
                  <span>{isShowingCenterAlternate ? 'VIEW FRONT' : 'VIEW REVERSE'}</span>
                  <span className="text-white/40">|</span>
                  <span className="text-white/60">{isShowingCenterAlternate ? '02' : '01'}</span>
                </motion.div>

                {/* Floating 3D Metadata Hologram Badge */}
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
                  <span className="text-white/30 font-sans">∞</span>
                  <span>{activePiece.code}</span>
                </motion.div>
              </motion.div>

              {/* Unboxed 3D Focal Information Card */}
              <motion.div
                style={{
                  transform: 'translateZ(50px)',
                }}
                className="mt-1 text-center max-w-lg px-4"
              >
                {/* Tag */}
                <motion.div 
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="flex items-center justify-center gap-2 mb-1"
                >
                  <span className="text-[9px] font-mono tracking-[0.35em] uppercase text-gold-400 flex items-center gap-1.5 font-medium">
                    <Sparkles size={10} className="text-gold-400 animate-pulse" />
                    {activePiece.tag}
                  </span>
                </motion.div>

                {/* Edition Name without / */}
                <motion.div
                  initial={{ opacity: 0, y: 8, letterSpacing: '0.15em' }}
                  animate={{ opacity: 1, y: 0, letterSpacing: '0.3em' }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="relative inline-block my-1"
                >
                  <h3 className="text-base sm:text-lg md:text-xl font-serif text-white tracking-[0.3em] uppercase font-light">
                    {activePiece.title}
                  </h3>
                  {/* Subtle golden underline animation */}
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-[1px] w-full bg-gradient-to-r from-transparent via-gold-400/60 to-transparent mt-1"
                  />
                </motion.div>

                {/* Action Button */}
                <motion.div 
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
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
    </section>
  );
};

export default Portfolio;
