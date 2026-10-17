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

  // Handle navigation
  const nextPiece = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % pieces.length);
  }, [pieces.length]);

  const prevPiece = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + pieces.length) % pieces.length);
  }, [pieces.length]);

  // Perspective looping within the active product (Front, Reverse, Detail perspectives)
  const [perspectiveIndex, setPerspectiveIndex] = useState(0);

  const activePiece = pieces[activeIndex] || pieces[0];
  const prevPieceIndex = (activeIndex - 1 + pieces.length) % pieces.length;
  const nextPieceIndex = (activeIndex + 1) % pieces.length;

  // Multi-perspective image set for the active product
  const activeImages = React.useMemo(() => {
    if (activePiece.allImages && activePiece.allImages.length > 0) {
      return activePiece.allImages;
    }
    const fallback = [activePiece.imgUrl, activePiece.secondaryImgUrl].filter(Boolean);
    return fallback.length > 0 ? fallback : [activePiece.imgUrl];
  }, [activePiece]);

  // Reset perspective to first view whenever product changes
  useEffect(() => {
    setPerspectiveIndex(0);
  }, [activeIndex]);

  // Requirement 5: Show the different perspective images of the product in Form 01, come as loop
  useEffect(() => {
    if (isPaused || activeImages.length <= 1) return;
    const perspectiveTimer = setInterval(() => {
      setPerspectiveIndex(prev => (prev + 1) % activeImages.length);
    }, 2800);
    return () => clearInterval(perspectiveTimer);
  }, [isPaused, activeImages.length, activeIndex]);

  // Requirement 2: Change the product after some seconds of Form 01 (7.5s cycle allows full perspective viewing)
  useEffect(() => {
    if (isPaused || pieces.length <= 1) return;
    const productInterval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % pieces.length);
    }, 7500);
    return () => clearInterval(productInterval);
  }, [isPaused, pieces.length, activeIndex]);

  // Requirement 3: Cinematic 3D Animation with Interactive Spring Physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [14, -14]), { stiffness: 180, damping: 24 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-18, 18]), { stiffness: 180, damping: 24 });
  const translateZ = useSpring(useTransform(mouseX, [-0.5, 0.5], [35, 35]), { stiffness: 180, damping: 24 });
  const shadowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [30, -30]), { stiffness: 180, damping: 24 });
  const shadowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [35, 12]), { stiffness: 180, damping: 24 });

  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleStageMouseLeave = () => {
    setIsPaused(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextPiece();
      if (e.key === 'ArrowLeft') prevPiece();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPiece, prevPiece]);

  const centerDisplayImg = activeImages[perspectiveIndex] || activePiece.imgUrl;

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
        onMouseMove={handleStageMouseMove}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={handleStageMouseLeave}
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
        className="relative z-10 w-full max-w-7xl mx-auto h-[530px] md:h-[670px] flex items-center justify-center cursor-pointer select-none"
        style={{ perspective: 1400 }}
      >
        {/* Stage Anchor */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* LEFT RECESSED PIECE (Preview with Full Silhouette) */}
          <div
            onClick={prevPiece}
            className="flex absolute -left-8 sm:left-[1%] md:left-[3%] lg:left-[6%] xl:left-[8%] top-1/2 -translate-y-1/2 w-[160px] sm:w-[220px] md:w-[280px] lg:w-[340px] h-[280px] sm:h-[360px] md:h-[420px] lg:h-[480px] cursor-pointer items-center justify-center transition-all duration-700 select-none group z-10"
          >
            <div className="relative w-full h-full flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity duration-500">
              <img
                src={pieces[prevPieceIndex]?.imgUrl}
                alt={pieces[prevPieceIndex]?.title}
                className="max-w-full max-h-full object-contain pointer-events-none filter grayscale contrast-125 drop-shadow-xl"
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

          {/* RIGHT RECESSED PIECE (Preview with Full Silhouette) */}
          <div
            onClick={nextPiece}
            className="flex absolute -right-8 sm:right-[1%] md:right-[3%] lg:right-[6%] xl:right-[8%] top-1/2 -translate-y-1/2 w-[160px] sm:w-[220px] md:w-[280px] lg:w-[340px] h-[280px] sm:h-[360px] md:h-[420px] lg:h-[480px] cursor-pointer items-center justify-center transition-all duration-700 select-none group z-10"
          >
            <div className="relative w-full h-full flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity duration-500">
              <img
                src={pieces[nextPieceIndex]?.imgUrl}
                alt={pieces[nextPieceIndex]?.title}
                className="max-w-full max-h-full object-contain pointer-events-none filter grayscale contrast-125 drop-shadow-xl"
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

          {/* CENTER HERO PIECE (Free-floating with Real Cinematic 3D Physics and Full Product Visibility) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activePiece.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-[92vw] sm:w-[560px] md:w-[660px] h-[520px] md:h-[620px] flex flex-col items-center justify-center z-20"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Backlight Volumetric Depth Glow */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.35, 0.55, 0.35],
                }}
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-[360px] md:w-[500px] h-[360px] md:h-[500px] rounded-full bg-gradient-to-tr from-gold-500/25 via-amber-600/15 to-transparent blur-[90px] pointer-events-none"
              />

              {/* Free-floating 3D Oscillating Image Container with Dynamic Mouse Physics */}
              <motion.div
                style={{
                  rotateX,
                  rotateY,
                  z: translateZ,
                  transformStyle: 'preserve-3d',
                }}
                animate={{
                  y: [-8, 8, -8],
                  rotateZ: [-0.6, 0.6, -0.6],
                }}
                transition={{
                  duration: 6.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative w-full h-[400px] sm:h-[460px] md:h-[500px] flex items-center justify-center cursor-pointer group"
                onClick={onEnterShop}
              >
                {/* Fully Visible Product Image Frame (No Edge-cutting masks) */}
                <div 
                  className="relative w-full h-full flex items-center justify-center p-2 sm:p-4"
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={`${activePiece.id}-p${perspectiveIndex}`}
                      initial={{ opacity: 0, rotateY: 26, scale: 0.94, filter: 'blur(3px)' }}
                      animate={{ opacity: 1, rotateY: 0, scale: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, rotateY: -26, scale: 0.95, filter: 'blur(3px)' }}
                      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                      src={centerDisplayImg}
                      alt={activePiece.title}
                      className="max-w-full max-h-full object-contain filter contrast-[1.08] brightness-105 drop-shadow-[0_25px_60px_rgba(0,0,0,0.95)]"
                    />
                  </AnimatePresence>
                  
                  {/* Gentle Shimmer Sheen across the silhouette on perspective flip */}
                  <motion.div
                    key={`sheen-${centerDisplayImg}`}
                    initial={{ x: '-150%' }}
                    animate={{ x: '150%' }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] pointer-events-none"
                  />
                </div>

                {/* Dynamic 3D Depth Shadow responding to tilt */}
                <motion.div
                  style={{
                    x: shadowX,
                    y: shadowY,
                  }}
                  className="absolute -bottom-6 w-3/5 h-6 bg-black/80 blur-xl rounded-full pointer-events-none"
                />

                {/* Floating Metadata Hologram Badge */}
                <motion.div
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

              {/* Requirement 5: Looping Perspective Indicator Badge */}
              {activeImages.length > 1 && (
                <div className="z-30 pointer-events-auto flex items-center justify-center my-1">
                  <div className="flex items-center gap-2 px-3 py-1 bg-black/70 border border-white/15 rounded-full backdrop-blur-md shadow-lg">
                    <RefreshCw size={9} className="text-gold-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="text-[7.5px] sm:text-[8px] font-mono tracking-[0.25em] text-white/80 uppercase font-medium">
                      {perspectiveIndex === 0 ? 'FRONT PERSPECTIVE' : (perspectiveIndex === 1 ? 'REVERSE PERSPECTIVE' : 'ATELIER DETAIL')}
                    </span>
                    <div className="flex items-center gap-1.5 ml-1">
                      {activeImages.map((_, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPerspectiveIndex(pIdx);
                          }}
                          aria-label={`View perspective ${pIdx + 1}`}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                            pIdx === perspectiveIndex
                              ? 'bg-gold-400 scale-125 shadow-[0_0_8px_#D4AF37]'
                              : 'bg-white/25 hover:bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
