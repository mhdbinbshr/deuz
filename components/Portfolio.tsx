import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, Sparkles, Eye, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
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
    allImages: [
      'https://ik.imagekit.io/dto1zguat/Evolve_1.jpg',
      'https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983'
    ],
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
    allImages: [
      'https://ik.imagekit.io/dto1zguat/Dustbound_1.jpg?updatedAt=1775277953541',
      'https://ik.imagekit.io/dto1zguat/Dustbound_2.jpg'
    ],
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
    allImages: [
      'https://ik.imagekit.io/dto1zguat/EternalHorizon_1.jpg?updatedAt=1775278022400',
      'https://ik.imagekit.io/dto1zguat/EternalHorizon_2.jpg?updatedAt=1775278048419'
    ],
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
    allImages: [
      'https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983',
      'https://ik.imagekit.io/dto1zguat/Evolve_1.jpg'
    ],
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
    allImages: [
      'https://ik.imagekit.io/dto1zguat/EternalHorizon_2.jpg?updatedAt=1775278048419',
      'https://ik.imagekit.io/dto1zguat/EternalHorizon_3.jpg'
    ],
    material: 'Raw Texturized Canvas',
    weight: '620 GSM Tailored Weave'
  }
];

// Luxury cinema easing curve
const CINEMA_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const Portfolio: React.FC<PortfolioProps> = ({ onEnterShop }) => {
  const [liveProducts, setLiveProducts] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [perspectiveIndex, setPerspectiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Live Firestore subscription: Real-time synchronization with collection
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

  // Preload all product & perspective images so transitions are 100% instant and butter-smooth
  useEffect(() => {
    pieces.forEach((piece) => {
      const urls = [piece.imgUrl, piece.secondaryImgUrl, ...(piece.allImages || [])].filter(Boolean);
      urls.forEach((url) => {
        const img = new Image();
        img.src = url;
      });
    });
  }, [pieces]);

  // Ensure activeIndex is always within valid range when collection updates
  useEffect(() => {
    if (activeIndex >= pieces.length && pieces.length > 0) {
      setActiveIndex(0);
      setPerspectiveIndex(0);
    }
  }, [pieces.length, activeIndex]);

  const activePiece = pieces[activeIndex] || pieces[0];
  const prevPieceIndex = (activeIndex - 1 + pieces.length) % pieces.length;
  const nextPieceIndex = (activeIndex + 1) % pieces.length;

  // Multi-perspective image set for the active product
  const activeImages = React.useMemo(() => {
    if (activePiece?.allImages && activePiece.allImages.length > 0) {
      return activePiece.allImages;
    }
    const fallback = [activePiece?.imgUrl, activePiece?.secondaryImgUrl].filter(Boolean);
    return fallback.length > 0 ? fallback : [activePiece?.imgUrl];
  }, [activePiece]);

  // Handle manual navigation with direction awareness
  const nextPiece = useCallback(() => {
    setDirection(1);
    setPerspectiveIndex(0);
    setActiveIndex((prev) => (prev + 1) % pieces.length);
  }, [pieces.length]);

  const prevPiece = useCallback(() => {
    setDirection(-1);
    setPerspectiveIndex(0);
    setActiveIndex((prev) => (prev - 1 + pieces.length) % pieces.length);
  }, [pieces.length]);

  // Unified, conflict-free progression: cycles smoothly through perspectives (Front -> Reverse),
  // then glides seamlessly to the next piece so timers never collide mid-transition.
  useEffect(() => {
    if (isPaused) return;
    const stepTimer = setTimeout(() => {
      if (activeImages.length > 1 && perspectiveIndex < activeImages.length - 1) {
        setDirection(1);
        setPerspectiveIndex((prev) => prev + 1);
      } else if (pieces.length > 1) {
        setDirection(1);
        setPerspectiveIndex(0);
        setActiveIndex((prev) => (prev + 1) % pieces.length);
      } else {
        setDirection(1);
        setPerspectiveIndex((prev) => (prev + 1) % Math.max(1, activeImages.length));
      }
    }, 4200);

    return () => clearTimeout(stepTimer);
  }, [isPaused, perspectiveIndex, activeImages.length, pieces.length, activeIndex]);

  // Weighted Cinema Dolly 3D Spring Physics (silky high-inertia damping)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothSpring = { stiffness: 75, damping: 26, mass: 1.25 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), smoothSpring);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-14, 14]), smoothSpring);
  const translateZ = useSpring(useTransform(mouseX, [-0.5, 0.5], [28, 28]), smoothSpring);
  const shadowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [26, -26]), smoothSpring);
  const shadowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [28, 10]), smoothSpring);
  const haloX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-18, 18]), smoothSpring);
  const haloY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-18, 18]), smoothSpring);

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

  const safePerspectiveIndex = perspectiveIndex < activeImages.length ? perspectiveIndex : 0;
  const centerDisplayImg = activeImages[safePerspectiveIndex] || activePiece.imgUrl;
  const compositeImageKey = `${activePiece.id}-p${safePerspectiveIndex}-${centerDisplayImg}`;

  return (
    <section id="works" className="relative w-full max-w-[100vw] bg-black/40 py-14 sm:py-20 md:py-28 overflow-hidden select-none">
      {/* Dynamic 3D Atmospheric Backing */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.18, 1],
            opacity: [0.14, 0.28, 0.14],
            x: ['-4%', '4%', '-4%'],
            y: ['-3%', '3%', '-3%']
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[700px] md:w-[1050px] h-[700px] md:h-[1050px] rounded-full bg-gradient-to-b from-gold-500/15 via-amber-700/5 to-transparent blur-[130px]"
        />
        {/* Subtle Anamorphic Horizontal Stage Beam */}
        <motion.div
          animate={{
            opacity: [0.08, 0.22, 0.08],
            scaleX: [0.85, 1.15, 0.85]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-5xl h-[1px] bg-gradient-to-r from-transparent via-gold-400/40 to-transparent blur-[1px]"
        />
        <div className="absolute inset-0 bg-radial from-transparent via-black/60 to-black pointer-events-none" />
      </div>

      {/* Editorial Header */}
      <div className="relative z-10 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            {/* Animated Micro Header Eyebrow */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-2"
            >
              <span className="w-5 h-[1px] bg-gold-400/80" />
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="text-[8.5px] sm:text-[9px] md:text-[10px] font-mono tracking-[0.25em] sm:tracking-[0.35em] uppercase text-gold-400 font-medium flex items-center gap-1.5"
              >
                <Sparkles size={10} className="text-gold-400 animate-pulse" />
                HOUSE ARCHIVE ∞ FORM 01
              </motion.span>
              <span className="text-white/20 font-mono text-[8.5px] sm:text-[9px]">∞ EXCLUSIVE CUT</span>
            </motion.div>

            {/* Title */}
            <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3">
              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-base xs:text-lg md:text-2xl font-serif text-white tracking-[0.2em] sm:tracking-[0.25em] uppercase font-light"
              >
                DEUZ — <span className="italic text-gold-300 font-normal">FORM 01</span>
              </motion.h2>

              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="inline-block text-[8.5px] sm:text-[9px] font-mono tracking-[0.25em] sm:tracking-[0.3em] uppercase text-white/40 px-2 py-0.5 border border-white/10 bg-white/[0.02]"
              >
                ONE OF ONE
              </motion.span>
            </div>

            {/* Sub-text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="text-white/40 text-[9.5px] sm:text-[10px] md:text-[11px] font-mono tracking-[0.18em] sm:tracking-[0.2em] uppercase mt-1.5 font-light max-w-lg"
            >
              CREATED ONCE. NEVER REPRODUCED.
            </motion.p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <motion.button
              whileHover={{ x: 2 }}
              onClick={onEnterShop}
              className="group flex items-center gap-1.5 px-3.5 py-1.5 text-[9px] font-mono tracking-[0.25em] uppercase text-white/60 hover:text-gold-300 transition-colors border-b border-white/15 hover:border-gold-400/80 bg-white/[0.02] cursor-pointer"
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
        className="relative z-10 w-full max-w-7xl mx-auto min-h-[430px] h-[min(75vh,470px)] xs:h-[min(77vh,510px)] sm:h-[min(79vh,560px)] md:h-[min(83vh,670px)] flex items-center justify-center cursor-pointer select-none px-2"
        style={{ perspective: 1600 }}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* LEFT RECESSED PIECE (Smooth Cross-Dissolve + Subtle 3D Wing Float) */}
          <motion.div
            onClick={prevPiece}
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformStyle: 'preserve-3d', rotateY: 22 }}
            className="flex absolute -left-10 xs:-left-6 sm:left-[1%] md:left-[3%] lg:left-[6%] xl:left-[8%] top-1/2 -translate-y-1/2 w-[130px] xs:w-[160px] sm:w-[220px] md:w-[280px] lg:w-[340px] h-[230px] xs:h-[280px] sm:h-[360px] md:h-[420px] lg:h-[480px] cursor-pointer items-center justify-center select-none group z-10"
          >
            <div className="relative w-full h-full flex items-center justify-center opacity-25 sm:opacity-35 group-hover:opacity-70 transition-opacity duration-700">
              <AnimatePresence initial={false}>
                <motion.img
                  key={`prev-${pieces[prevPieceIndex]?.id}-${pieces[prevPieceIndex]?.imgUrl}`}
                  src={pieces[prevPieceIndex]?.imgUrl}
                  alt={pieces[prevPieceIndex]?.title}
                  initial={{ opacity: 0, scale: 0.9, x: -18, filter: 'grayscale(100%) blur(6px)' }}
                  animate={{ opacity: 1, scale: 1, x: 0, filter: 'grayscale(100%) blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.9, x: 18, filter: 'grayscale(100%) blur(6px)' }}
                  transition={{ duration: 0.95, ease: CINEMA_EASE }}
                  className="absolute max-w-full max-h-full object-contain pointer-events-none contrast-125 drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)] group-hover:scale-105 transition-transform duration-700"
                />
              </AnimatePresence>
              <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-center whitespace-nowrap opacity-70 sm:opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:-translate-y-1">
                <span className="text-[7px] sm:text-[8px] font-mono tracking-[0.35em] text-gold-400 uppercase block mb-0.5">
                  ∞ {pieces[prevPieceIndex]?.code}
                </span>
                <p className="text-[8px] sm:text-[9px] font-serif tracking-[0.25em] text-white/80 uppercase flex items-center justify-center gap-1">
                  <ChevronLeft size={10} className="text-gold-400" /> PREVIOUS PIECE
                </p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT RECESSED PIECE (Smooth Cross-Dissolve + Subtle 3D Wing Float) */}
          <motion.div
            onClick={nextPiece}
            animate={{ y: [5, -5, 5] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformStyle: 'preserve-3d', rotateY: -22 }}
            className="flex absolute -right-10 xs:-right-6 sm:right-[1%] md:right-[3%] lg:right-[6%] xl:right-[8%] top-1/2 -translate-y-1/2 w-[130px] xs:w-[160px] sm:w-[220px] md:w-[280px] lg:w-[340px] h-[230px] xs:h-[280px] sm:h-[360px] md:h-[420px] lg:h-[480px] cursor-pointer items-center justify-center select-none group z-10"
          >
            <div className="relative w-full h-full flex items-center justify-center opacity-25 sm:opacity-35 group-hover:opacity-70 transition-opacity duration-700">
              <AnimatePresence initial={false}>
                <motion.img
                  key={`next-${pieces[nextPieceIndex]?.id}-${pieces[nextPieceIndex]?.imgUrl}`}
                  src={pieces[nextPieceIndex]?.imgUrl}
                  alt={pieces[nextPieceIndex]?.title}
                  initial={{ opacity: 0, scale: 0.9, x: 18, filter: 'grayscale(100%) blur(6px)' }}
                  animate={{ opacity: 1, scale: 1, x: 0, filter: 'grayscale(100%) blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.9, x: -18, filter: 'grayscale(100%) blur(6px)' }}
                  transition={{ duration: 0.95, ease: CINEMA_EASE }}
                  className="absolute max-w-full max-h-full object-contain pointer-events-none contrast-125 drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)] group-hover:scale-105 transition-transform duration-700"
                />
              </AnimatePresence>
              <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-center whitespace-nowrap opacity-70 sm:opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:-translate-y-1">
                <span className="text-[7px] sm:text-[8px] font-mono tracking-[0.35em] text-gold-400 uppercase block mb-0.5">
                  ∞ {pieces[nextPieceIndex]?.code}
                </span>
                <p className="text-[8px] sm:text-[9px] font-serif tracking-[0.25em] text-white/80 uppercase flex items-center justify-center gap-1">
                  NEXT PIECE <ChevronRight size={10} className="text-gold-400" />
                </p>
              </div>
            </div>
          </motion.div>

          {/* CENTER HERO PIECE — Continuous Overlapping 3D Cinema Stage (No Blank Wait Gaps) */}
          <div
            className="relative w-[92vw] sm:w-[560px] md:w-[660px] h-full max-h-[450px] xs:max-h-[490px] sm:max-h-[540px] md:max-h-[630px] flex flex-col items-center justify-center z-20"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Volumetric Breathing Gold Aura Behind Garment */}
            <motion.div
              style={{ x: haloX, y: haloY }}
              animate={{
                scale: [1, 1.16, 1],
                opacity: [0.32, 0.56, 0.32]
              }}
              transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-[270px] xs:w-[330px] md:w-[490px] h-[270px] xs:h-[330px] md:h-[490px] rounded-full bg-gradient-to-tr from-gold-500/25 via-amber-500/12 to-transparent blur-[95px] pointer-events-none"
            />

            {/* Subtle 3D Orbital Pedestal Ring Around Center Piece */}
            <motion.div
              animate={{ rotateZ: 360 }}
              transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
              style={{
                transform: 'translateZ(-25px) rotateX(74deg)',
                transformStyle: 'preserve-3d'
              }}
              className="absolute w-[240px] xs:w-[300px] sm:w-[390px] md:w-[460px] aspect-square rounded-full border border-gold-400/20 border-dashed pointer-events-none"
            />

            {/* Free-Floating 3D Oscillating Garment Container with Weighted Dolly Physics */}
            <motion.div
              style={{
                rotateX,
                rotateY,
                z: translateZ,
                transformStyle: 'preserve-3d'
              }}
              animate={{
                y: [-7, 7, -7],
                rotateZ: [-0.45, 0.45, -0.45],
                scale: [1, 1.016, 1]
              }}
              transition={{
                duration: 7.2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="relative w-full flex-1 min-h-0 max-h-[300px] xs:max-h-[350px] sm:max-h-[425px] md:max-h-[485px] flex items-center justify-center cursor-pointer group"
              onClick={onEnterShop}
            >
              {/* Layered Overlapping Image Stage — Seamless Cross-Dissolve + 3D Depth Glide */}
              <div
                className="relative w-full h-full flex items-center justify-center p-2 sm:p-4"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <AnimatePresence initial={false}>
                  <motion.div
                    key={compositeImageKey}
                    initial={{
                      opacity: 0,
                      scale: 0.93,
                      y: 12,
                      rotateY: direction * 14,
                      filter: 'blur(8px) brightness(1.22)'
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      rotateY: 0,
                      filter: 'blur(0px) brightness(1.04)'
                    }}
                    exit={{
                      opacity: 0,
                      scale: 1.04,
                      y: -10,
                      rotateY: direction * -12,
                      filter: 'blur(8px) brightness(0.9)'
                    }}
                    transition={{
                      duration: 1.05,
                      ease: CINEMA_EASE,
                      opacity: { duration: 0.85, ease: CINEMA_EASE }
                    }}
                    className="absolute inset-0 flex items-center justify-center p-2 sm:p-4 pointer-events-none"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Volumetric Depth Echo Silhouette Behind Main Garment */}
                    <img
                      src={centerDisplayImg}
                      alt=""
                      aria-hidden="true"
                      className="absolute max-w-[92%] max-h-[92%] object-contain opacity-25 blur-[14px] brightness-150 scale-105 pointer-events-none select-none"
                      style={{ transform: 'translateZ(-24px)' }}
                    />

                    {/* Primary High-Definition Garment Image */}
                    <motion.img
                      src={centerDisplayImg}
                      alt={activePiece.title}
                      whileHover={{ scale: 1.025 }}
                      transition={{ duration: 0.6, ease: CINEMA_EASE }}
                      className="relative z-10 max-w-full max-h-full object-contain filter contrast-[1.07] drop-shadow-[0_28px_65px_rgba(0,0,0,0.95)]"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Silky Anamorphic Light Sweep Across Silhouette on Transition */}
                <motion.div
                  key={`sheen-${compositeImageKey}`}
                  initial={{ x: '-140%', opacity: 0 }}
                  animate={{ x: '160%', opacity: [0, 0.55, 0] }}
                  transition={{ duration: 1.35, ease: CINEMA_EASE }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-200/20 to-transparent skew-x-[-25deg] pointer-events-none z-20 mix-blend-screen"
                />
              </div>

              {/* Dynamic 3D Floor Shadow Responding to Tilt & Levitation */}
              <motion.div
                style={{
                  x: shadowX,
                  y: shadowY
                }}
                animate={{
                  scale: [0.9, 1.06, 0.9],
                  opacity: [0.55, 0.8, 0.55]
                }}
                transition={{ duration: 7.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-5 w-3/5 h-6 bg-black/85 blur-xl rounded-full pointer-events-none"
              />

              {/* Floating Metadata Hologram Badge */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`code-${activePiece.id}`}
                  initial={{ opacity: 0, y: -6, filter: 'blur(3px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 6, filter: 'blur(3px)' }}
                  transition={{ duration: 0.5, ease: CINEMA_EASE }}
                  className="absolute top-2 right-4 md:right-8 flex items-center gap-2 px-2.5 py-1 bg-black/65 backdrop-blur-md border-b border-gold-400/45 text-[8px] md:text-[9px] font-mono tracking-[0.3em] text-gold-300 uppercase shadow-2xl pointer-events-none z-30"
                >
                  <span className="w-1 h-1 rounded-full bg-gold-400 animate-ping" />
                  <span className="text-white/30 font-sans">∞</span>
                  <span>{activePiece.code}</span>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Looping Perspective Indicator Badge with Smooth Progress Pulse */}
            {activeImages.length > 1 && (
              <div className="z-30 pointer-events-auto flex items-center justify-center my-1">
                <div className="relative flex items-center gap-2 px-3 py-1 bg-black/75 border border-white/15 rounded-full backdrop-blur-md shadow-lg overflow-hidden">
                  <RefreshCw size={9} className="text-gold-400 animate-spin" style={{ animationDuration: '7s' }} />
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`label-${safePerspectiveIndex}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.35, ease: CINEMA_EASE }}
                      className="text-[7.5px] sm:text-[8px] font-mono tracking-[0.25em] text-white/85 uppercase font-medium min-w-[115px] text-center"
                    >
                      {safePerspectiveIndex === 0
                        ? 'FRONT PERSPECTIVE'
                        : safePerspectiveIndex === 1
                        ? 'REVERSE PERSPECTIVE'
                        : 'ATELIER DETAIL'}
                    </motion.span>
                  </AnimatePresence>
                  <div className="flex items-center gap-1.5 ml-1">
                    {activeImages.map((_, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDirection(pIdx > safePerspectiveIndex ? 1 : -1);
                          setPerspectiveIndex(pIdx);
                        }}
                        aria-label={`View perspective ${pIdx + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                          pIdx === safePerspectiveIndex
                            ? 'w-3.5 bg-gold-400 shadow-[0_0_8px_#D4AF37]'
                            : 'w-1.5 bg-white/25 hover:bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Unboxed 3D Focal Information Card — Smooth Crossfade on Piece Change */}
            <motion.div
              style={{
                transform: 'translateZ(50px)'
              }}
              className="mt-1 text-center max-w-lg px-4"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`info-${activePiece.id}`}
                  initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
                  transition={{ duration: 0.55, ease: CINEMA_EASE }}
                >
                  {/* Tag */}
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-[9px] font-mono tracking-[0.35em] uppercase text-gold-400 flex items-center gap-1.5 font-medium">
                      <Sparkles size={10} className="text-gold-400 animate-pulse" />
                      {activePiece.tag}
                    </span>
                  </div>

                  {/* Edition Name */}
                  <div className="relative inline-block my-1">
                    <h3 className="text-base sm:text-lg md:text-xl font-serif text-white tracking-[0.3em] uppercase font-light">
                      {activePiece.title}
                    </h3>
                    <motion.div
                      initial={{ scaleX: 0.2, opacity: 0.4 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ duration: 0.85, ease: CINEMA_EASE }}
                      className="h-[1px] w-full bg-gradient-to-r from-transparent via-gold-400/60 to-transparent mt-1"
                    />
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Action Button */}
              <div className="mt-3 flex items-center justify-center">
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onEnterShop}
                  className="group relative flex items-center gap-2 px-4 py-1.5 bg-black/40 hover:bg-gold-500/15 text-gold-300 hover:text-white transition-all duration-300 text-[9px] font-mono tracking-[0.3em] uppercase border-b border-gold-400/70 cursor-pointer"
                >
                  <Eye size={11} className="text-gold-400 group-hover:scale-110 transition-transform" />
                  <span>EXAMINE PIECE</span>
                  <ArrowUpRight size={11} className="text-gold-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
