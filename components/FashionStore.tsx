import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, MousePointer2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSettings, CollectionOneItem } from '../context/SettingsContext';

interface FashionStoreProps {
  onEnterStore: () => void;
}

const AFTERLIGHT_PRIMARY = "https://ik.imagekit.io/dto1zguat/Afterlight_1.png";
const AFTERLIGHT_SECONDARY = "https://ik.imagekit.io/dto1zguat/Afterlight_2.png";

const GOLDEN_EMBERS = [
  { id: 0, left: '12%', top: '78%', size: 3, duration: 9.5, delay: 0.2, driftX: 18 },
  { id: 1, left: '22%', top: '64%', size: 2, duration: 11.2, delay: 1.4, driftX: -14 },
  { id: 2, left: '31%', top: '84%', size: 3.5, duration: 8.8, delay: 0.8, driftX: 22 },
  { id: 3, left: '44%', top: '72%', size: 2.5, duration: 12.4, delay: 2.1, driftX: -18 },
  { id: 4, left: '58%', top: '82%', size: 3, duration: 10.1, delay: 0.5, driftX: 15 },
  { id: 5, left: '69%', top: '68%', size: 2, duration: 11.8, delay: 1.9, driftX: -20 },
  { id: 6, left: '79%', top: '76%', size: 3.5, duration: 9.2, delay: 2.7, driftX: 16 },
  { id: 7, left: '88%', top: '62%', size: 2.5, duration: 10.6, delay: 1.1, driftX: -12 },
  { id: 8, left: '17%', top: '38%', size: 2, duration: 13.0, delay: 3.0, driftX: 14 },
  { id: 9, left: '83%', top: '34%', size: 2.5, duration: 11.5, delay: 0.9, driftX: -16 },
  { id: 10, left: '36%', top: '28%', size: 2, duration: 10.4, delay: 2.4, driftX: 12 },
  { id: 11, left: '64%', top: '26%', size: 3, duration: 9.8, delay: 1.6, driftX: -15 }
];

const FashionStore: React.FC<FashionStoreProps> = ({ onEnterStore }) => {
  const containerRef = useRef<HTMLElement>(null);
  const [isWalkingIn, setIsWalkingIn] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [autoPerspective, setAutoPerspective] = useState(0);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });
  const { content } = useSettings();

  // Build list of standalone Collection 1 items (Primary spotlight + any additional Collection 1 items added by Admin)
  const collectionItems = useMemo<CollectionOneItem[]>(() => {
    const primaryImages = [
      content.latestDropImage || AFTERLIGHT_PRIMARY,
      content.latestDropSecondaryImage || (!content.latestDropImage ? AFTERLIGHT_SECONDARY : ''),
      ...(Array.isArray(content.latestDropGallery) ? content.latestDropGallery : [])
    ].filter((url, idx, arr) => Boolean(url) && typeof url === 'string' && arr.indexOf(url) === idx);

    const primaryItem: CollectionOneItem = {
      id: 'primary-collection-1',
      title: content.latestDropTitle || 'DEUZ — AFTERLIGHT',
      houseCode: content.latestDropHouseCode || 'DEUZ-C01-AFT',
      tag: content.latestDropTag || 'New Drop',
      category: content.latestDropCategory || 'TEE',
      price: content.latestDropPrice || '₹2,999',
      status: content.latestDropStatus || 'Active',
      description:
        content.latestDropDescription ||
        'A study in structure and restraint. Heavyweight French terry designed for enduring presence.',
      image: primaryImages[0] || AFTERLIGHT_PRIMARY,
      secondaryImage: primaryImages[1] || '',
      gallery: primaryImages.slice(2),
      details:
        content.latestDropDetails && typeof content.latestDropDetails === 'object'
          ? content.latestDropDetails
          : {}
    };

    const extraItems = Array.isArray(content.collectionOneItems)
      ? content.collectionOneItems.filter(item => item && (item.title || item.image))
      : [];

    return [primaryItem, ...extraItems];
  }, [content]);

  const safeItemIndex = activeItemIndex < collectionItems.length ? activeItemIndex : 0;
  const activeItem = collectionItems[safeItemIndex] || collectionItems[0];

  const activeItemImages = useMemo(() => {
    const list = [
      activeItem.image || AFTERLIGHT_PRIMARY,
      activeItem.secondaryImage || '',
      ...(Array.isArray(activeItem.gallery) ? activeItem.gallery : [])
    ].filter((url, idx, arr) => Boolean(url) && typeof url === 'string' && arr.indexOf(url) === idx);
    return list.length > 0 ? list : [AFTERLIGHT_PRIMARY, AFTERLIGHT_SECONDARY];
  }, [activeItem]);

  // Perspective cycling across the active Collection 1 item's images
  useEffect(() => {
    setAutoPerspective(0);
  }, [safeItemIndex]);

  useEffect(() => {
    if (activeItemImages.length <= 1) return;
    const interval = setInterval(() => {
      setAutoPerspective(prev => (prev + 1) % activeItemImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [activeItemImages.length]);

  const displayImage = activeItemImages[autoPerspective % activeItemImages.length] || AFTERLIGHT_PRIMARY;
  const displayTitle = activeItem.title || 'DEUZ — AFTERLIGHT';
  const displayTag = activeItem.tag || 'New Drop';
  const displayDesc =
    activeItem.description ||
    'A study in structure and restraint. Heavyweight French terry designed for enduring presence.';
  const displayCategory = activeItem.category || 'TEE';
  const displayPrice = activeItem.price || '₹2,999';
  const displayStatus = activeItem.status || 'Active';

  // Filter out Silhouette and Fabric from Collection 1 details
  const displayDetails = useMemo(() => {
    if (activeItem.details && typeof activeItem.details === 'object') {
      return Object.entries(activeItem.details).filter(([k, v]) => {
        const lowerKey = k.trim().toLowerCase();
        return (
          lowerKey !== '' &&
          lowerKey !== 'silhouette' &&
          lowerKey !== 'fabric' &&
          String(v).trim() !== ''
        );
      });
    }
    return [];
  }, [activeItem.details]);

  const handlePointerMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMouseTilt({ x: normX, y: normY });
  };

  const handlePointerLeave = () => {
    setMouseTilt({ x: 0, y: 0 });
  };

  const handleEnterClick = () => {
    setIsWalkingIn(true);
    setTimeout(() => {
      onEnterStore();
      setIsWalkingIn(false);
    }, 400);
  };

  const handlePrevItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveItemIndex(prev => (prev - 1 + collectionItems.length) % collectionItems.length);
  };

  const handleNextItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveItemIndex(prev => (prev + 1) % collectionItems.length);
  };

  return (
    <section
      ref={containerRef}
      id="collection-section"
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      className="relative w-full max-w-[100vw] min-h-screen min-h-[100dvh] py-8 sm:py-12 md:py-16 bg-[#020202] flex items-center justify-center select-none px-4 xs:px-6 sm:px-10 md:px-16 overflow-hidden"
    >
      {/* ===================================================================== */}
      {/* CINEMATIC MULTI-LAYERED BACKGROUND ANIMATION & ATMOSPHERIC STAGE      */}
      {/* ===================================================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* 1. Deep Obsidian & Champagne Gold Breathing Core Aura */}
        <motion.div
          animate={{
            scale: [1, 1.18, 0.96, 1],
            opacity: [0.45, 0.75, 0.5, 0.45]
          }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          style={{
            x: mouseTilt.x * -24,
            y: mouseTilt.y * -24
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] sm:w-[920px] md:w-[1180px] h-[680px] sm:h-[920px] rounded-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.13)_0%,rgba(212,175,55,0.04)_38%,transparent_70%)] blur-[90px]"
        />

        {/* 2. Secondary Emerald & Obsidian Counter-Drifting Nebula Glow */}
        <motion.div
          animate={{
            x: [-60, 70, -40, -60],
            y: [40, -50, 30, 40],
            scale: [0.9, 1.15, 0.95, 0.9],
            opacity: [0.2, 0.42, 0.25, 0.2]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] sm:w-[760px] h-[520px] sm:h-[760px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,rgba(212,175,55,0.05)_45%,transparent_72%)] blur-[110px]"
        />

        {/* 3. Volumetric Diagonal Cinema God-Rays / Light Shafts */}
        <motion.div
          animate={{
            rotate: [-28, -22, -30, -28],
            x: ["-12%", "8%", "-6%", "-12%"],
            opacity: [0.18, 0.38, 0.22, 0.18]
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[35%] left-[8%] w-[260px] sm:w-[420px] h-[170%] bg-gradient-to-b from-gold-400/15 via-gold-500/5 to-transparent blur-[55px] origin-top"
        />
        <motion.div
          animate={{
            rotate: [26, 32, 23, 26],
            x: ["10%", "-10%", "6%", "10%"],
            opacity: [0.14, 0.34, 0.18, 0.14]
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute -top-[35%] right-[8%] w-[240px] sm:w-[380px] h-[170%] bg-gradient-to-b from-amber-200/12 via-gold-500/5 to-transparent blur-[60px] origin-top"
        />

        {/* 4. Architectural Coordinate Grid & Vertical Laser Scanline */}
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(212,175,55,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.22) 1px, transparent 1px)`,
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(circle at 50% 50%, black 25%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 25%, transparent 78%)'
          }}
        />
        <motion.div
          animate={{ y: ["-10%", "110%"], opacity: [0, 0.45, 0.45, 0] }}
          transition={{ duration: 8.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-gold-400/50 to-transparent shadow-[0_0_20px_rgba(212,175,55,0.45)]"
        />

        {/* 5. Concentric 3D Orbital Atelier Rings Behind Collection I */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.03, 1] }}
            transition={{
              rotate: { duration: 48, repeat: Infinity, ease: "linear" },
              scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-[340px] xs:w-[420px] sm:w-[580px] md:w-[680px] lg:w-[760px] aspect-square rounded-full border border-gold-500/[0.12] border-dashed"
          />
          <motion.div
            animate={{ rotate: -360, scale: [1.02, 0.97, 1.02] }}
            transition={{
              rotate: { duration: 36, repeat: Infinity, ease: "linear" },
              scale: { duration: 9, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute w-[280px] xs:w-[350px] sm:w-[490px] md:w-[570px] lg:w-[630px] aspect-square rounded-full border border-white/[0.06]"
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gold-400/70 shadow-[0_0_12px_#D4AF37]" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/50 shadow-[0_0_8px_#fff]" />
          </motion.div>
        </div>

        {/* 6. Sweeping Horizontal Anamorphic Cinema Lens Flare */}
        <motion.div
          animate={{
            x: ["-35%", "35%", "-35%"],
            opacity: [0.15, 0.5, 0.15],
            scaleX: [0.85, 1.25, 0.85]
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[1100px] h-[2px] bg-gradient-to-r from-transparent via-gold-300/35 to-transparent blur-[1px]"
        />

        {/* 7. Floating 3D Perspective Architectural Monolith Wings (Left & Right) */}
        <motion.div
          animate={{
            y: [-16, 16, -16],
            rotateZ: [-9, -6, -9],
            rotateY: [14, 22, 14],
            opacity: [0.22, 0.42, 0.22]
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          style={{
            transformPerspective: 1000,
            x: mouseTilt.x * -18
          }}
          className="absolute -left-16 sm:-left-12 md:left-4 lg:left-12 top-1/2 -translate-y-1/2 w-60 sm:w-72 md:w-80 h-96 sm:h-[460px] bg-gradient-to-b from-white/[0.03] via-gold-500/[0.015] to-transparent border border-gold-500/15 rounded-2xl hidden sm:flex flex-col justify-between p-5 backdrop-blur-[2px] shadow-[0_25px_70px_rgba(0,0,0,0.85)]"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <span className="text-[8px] font-mono tracking-[0.3em] text-gold-400/60 uppercase">ARCHIVE // 01</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500/60" />
          </div>
          <div className="my-auto space-y-2 opacity-40">
            <div className="w-2/3 h-[1px] bg-gradient-to-r from-gold-400/50 to-transparent" />
            <div className="w-1/2 h-[1px] bg-gradient-to-r from-white/40 to-transparent" />
          </div>
          <div className="text-[7.5px] font-mono tracking-[0.28em] text-white/30 uppercase">
            SINGULAR FORM ARCHITECTURE
          </div>
        </motion.div>

        <motion.div
          animate={{
            y: [16, -16, 16],
            rotateZ: [9, 6, 9],
            rotateY: [-14, -22, -14],
            opacity: [0.22, 0.42, 0.22]
          }}
          transition={{ duration: 9.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          style={{
            transformPerspective: 1000,
            x: mouseTilt.x * 18
          }}
          className="absolute -right-16 sm:-right-12 md:right-4 lg:right-12 top-1/2 -translate-y-1/2 w-60 sm:w-72 md:w-80 h-96 sm:h-[460px] bg-gradient-to-b from-white/[0.03] via-gold-500/[0.015] to-transparent border border-gold-500/15 rounded-2xl hidden sm:flex flex-col justify-between p-5 backdrop-blur-[2px] shadow-[0_25px_70px_rgba(0,0,0,0.85)]"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
            <span className="text-[8px] font-mono tracking-[0.3em] text-gold-400/60 uppercase">EDITION // I</span>
          </div>
          <div className="my-auto space-y-2 opacity-40 flex flex-col items-end">
            <div className="w-2/3 h-[1px] bg-gradient-to-l from-gold-400/50 to-transparent" />
            <div className="w-1/2 h-[1px] bg-gradient-to-l from-white/40 to-transparent" />
          </div>
          <div className="text-[7.5px] font-mono tracking-[0.28em] text-white/30 uppercase text-right">
            DEUZ ATELIER STANDARD
          </div>
        </motion.div>

        {/* 8. Floating Golden Dust / Bokeh Embers */}
        {GOLDEN_EMBERS.map(ember => (
          <motion.span
            key={ember.id}
            animate={{
              y: [0, -110, 0],
              x: [0, ember.driftX, 0],
              opacity: [0, 0.75, 0],
              scale: [0.6, 1.35, 0.6]
            }}
            transition={{
              duration: ember.duration,
              repeat: Infinity,
              delay: ember.delay,
              ease: "easeInOut"
            }}
            style={{
              left: ember.left,
              top: ember.top,
              width: ember.size,
              height: ember.size
            }}
            className="absolute rounded-full bg-gold-300 shadow-[0_0_10px_#D4AF37]"
          />
        ))}

        {/* 9. Deep Cinema Vignette Framing */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,rgba(2,2,2,0.88)_100%)]" />
      </div>

      {/* ===================================================================== */}
      {/* FOREGROUND COLLECTION I SHOWCASE CARD (FULL ORIGINAL IMAGE SIZE)      */}
      {/* ===================================================================== */}
      <div className="relative z-10 w-auto max-w-[92vw] sm:max-w-[560px] md:max-w-[640px] lg:max-w-[700px] flex flex-col items-center justify-center my-auto">
        {/* Main Photo Card — Fits Full Original Image Proportions Without Cropping */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          animate={isWalkingIn ? { scale: 1.08, opacity: 0 } : {}}
          className="relative w-full rounded-none overflow-hidden border border-white/15 bg-[#070709] shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_55px_rgba(212,175,55,0.08)] z-10 flex flex-col"
        >
          {/* Top Header Bar inside Photo Card: Reticle on Left, COLLECTION I on Right */}
          <div className="absolute inset-x-0 top-0 z-20 px-3.5 xs:px-4 sm:px-6 pt-3.5 xs:pt-4 sm:pt-5 pointer-events-none">
            <div className="flex items-center justify-between pb-2.5 xs:pb-3 sm:pb-4 border-b border-white/15">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full border border-white/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
                </div>
                {collectionItems.length > 1 && (
                  <div className="flex items-center gap-1 pointer-events-auto">
                    <button
                      type="button"
                      onClick={handlePrevItem}
                      title="Previous Collection 1 Artifact"
                      className="w-6 h-6 rounded-full bg-black/60 border border-white/20 hover:border-gold-400 text-white/80 hover:text-gold-300 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <span className="text-[8px] font-mono text-gold-400 px-1">
                      {safeItemIndex + 1}/{collectionItems.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextItem}
                      title="Next Collection 1 Artifact"
                      className="w-6 h-6 rounded-full bg-black/60 border border-white/20 hover:border-gold-400 text-white/80 hover:text-gold-300 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>

              <span className="text-[9px] xs:text-[10px] sm:text-xs font-mono tracking-[0.24em] sm:tracking-[0.28em] text-white/70 uppercase">
                COLLECTION I
              </span>
            </div>
          </div>

          {/* Moving Green 'New Drop' Cursor */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: [0, 24, -16, 12, -4, 0],
              y: [0, -26, 14, -18, 6, 0]
            }}
            transition={{
              opacity: { duration: 0.6, delay: 0.2 },
              x: { repeat: Infinity, duration: 6.5, ease: "easeInOut" },
              y: { repeat: Infinity, duration: 5.5, ease: "easeInOut" }
            }}
            className="absolute top-[20%] sm:top-[24%] left-[16%] sm:left-[26%] z-30 pointer-events-none flex items-start gap-1 drop-shadow-[0_8px_25px_rgba(0,0,0,0.9)]"
          >
            <MousePointer2 size={16} className="text-emerald-400 fill-emerald-400 -rotate-12 shrink-0 drop-shadow-[0_0_12px_rgba(52,211,153,0.95)] sm:w-[18px] sm:h-[18px]" />
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-emerald-500 text-black text-[8.5px] sm:text-[10px] font-mono font-black uppercase tracking-wider rounded-sm shadow-[0_0_12px_rgba(16,185,129,0.5)]">
              {displayTag}
            </span>
          </motion.div>

          {/* Garment Image Canvas — Full Uncropped Original Image */}
          <div className="relative w-full bg-[#050505] flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={`${activeItem.id}-${displayImage}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                src={displayImage}
                className="w-full h-auto max-h-[82dvh] object-contain object-center block"
                alt={displayTitle}
              />
            </AnimatePresence>

            {/* Subtle Gold Sheen Wave on Perspective Transition */}
            <motion.div
              key={`sheen-${safeItemIndex}-${autoPerspective}`}
              initial={{ x: "-100%", opacity: 0.35 }}
              animate={{ x: "200%", opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-300/20 to-transparent skew-x-[-22deg] pointer-events-none z-20"
            />

            {/* Image Perspective Selector Dots (if multiple images configured) */}
            {activeItemImages.length > 1 && (
              <div className="absolute top-14 sm:top-16 right-4 sm:right-6 z-20 flex items-center gap-1.5">
                {activeItemImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAutoPerspective(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === autoPerspective % activeItemImages.length
                        ? 'w-4 bg-gold-400 shadow-[0_0_8px_#D4AF37]'
                        : 'w-1.5 bg-white/35 hover:bg-white/70'
                    }`}
                    title={`View angle ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Top scrim for clean contrast */}
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

            {/* Bottom dark gradient scrim for caption legibility */}
            <div className="absolute inset-x-0 bottom-0 h-44 sm:h-56 bg-gradient-to-t from-black/95 via-black/80 to-transparent pointer-events-none z-10" />
          </div>

          {/* Bottom Card Content: Caption, Timeline Bar, and Domain */}
          <div className="absolute inset-x-0 bottom-0 pt-16 pb-2 xs:pb-2.5 sm:pb-3.5 px-3 xs:px-4 sm:px-5 pointer-events-none z-10 flex flex-col justify-end">
            <p className="text-white/60 text-[9px] xs:text-[10px] sm:text-[12px] font-sans font-light leading-snug sm:leading-relaxed max-w-[96%] mb-2 sm:mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] line-clamp-2">
              {displayDesc}
            </p>

            {/* Progress Bar & Domain */}
            <div className="w-full">
              <div className="w-full h-[2px] bg-white/15 overflow-hidden flex">
                <div className="w-[55%] h-full bg-gold-500 shadow-[0_0_6px_#D4AF37]" />
                <div className="w-[45%] h-full bg-white/15" />
              </div>
              <p className="text-[6.5px] xs:text-[7px] sm:text-[8px] font-mono tracking-[0.22em] text-white/35 text-center uppercase mt-1 sm:mt-1.5">
                www.deuzandco.com
              </p>
            </div>
          </div>
        </motion.div>

        {/* Cinematic Overlapping PROPERTIES Box — 3D Orbital Loop Animation + Light Sweep */}
        <motion.div
          initial={{ opacity: 0, x: 20, y: 10 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ transformPerspective: 900 }}
          animate={{
            y: [-5, 5, -5],
            x: [0, -3, 2, 0],
            rotateX: [2.5, -2.5, 2.5],
            rotateY: [-3.5, 3.5, -3.5],
            rotateZ: [-0.8, 0.8, -0.8],
            scale: [1, 1.015, 1]
          }}
          transition={{
            opacity: { duration: 0.7, delay: 0.2 },
            y: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
            x: { duration: 7, repeat: Infinity, ease: "easeInOut" },
            rotateX: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            rotateY: { duration: 7.5, repeat: Infinity, ease: "easeInOut" },
            rotateZ: { duration: 6.5, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -right-2 xs:-right-3 sm:-right-7 md:-right-12 lg:-right-16 bottom-[78px] xs:bottom-[86px] sm:bottom-[96px] md:bottom-[104px] w-[138px] xs:w-[162px] sm:w-[204px] md:w-[230px] bg-[#070709]/95 border border-white/10 backdrop-blur-2xl rounded-none pt-2 px-2.5 pb-3 xs:pt-2.5 xs:px-3 xs:pb-3.5 sm:pt-3 sm:px-4 sm:pb-4 shadow-[-20px_25px_60px_rgba(0,0,0,0.95),0_20px_50px_rgba(0,0,0,0.95)] z-20 pointer-events-auto overflow-hidden"
        >
          {/* Looping Ambient Gold Core Glow */}
          <motion.div
            animate={{
              opacity: [0.12, 0.35, 0.12],
              scale: [0.85, 1.2, 0.85]
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gold-500/20 blur-2xl pointer-events-none"
          />

          {/* Looping Anamorphic Light Sweep Across Box */}
          <motion.div
            animate={{ x: ["-140%", "240%"] }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              repeatDelay: 2.2,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-gold-400/12 to-transparent skew-x-[-25deg] pointer-events-none z-0"
          />

          {/* Header: PROPERTIES on Left in Gold, Traffic Light Dots on Right */}
          <div className="relative z-10 flex items-center justify-between pb-1.5 sm:pb-2 border-b border-white/10 mb-1.5 sm:mb-2 overflow-hidden">
            <motion.span
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] font-mono uppercase tracking-[0.14em] sm:tracking-[0.16em] text-gold-500 font-semibold"
            >
              PROPERTIES
            </motion.span>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.12, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: 0, ease: "easeInOut" }}
                className="w-1.5 h-1.5 xs:w-1.5 xs:h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#FF5F56] shadow-[0_0_6px_rgba(255,95,86,0.6)] inline-block"
              />
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.12, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: 0.4, ease: "easeInOut" }}
                className="w-1.5 h-1.5 xs:w-1.5 xs:h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#FFBD2E] shadow-[0_0_6px_rgba(255,189,46,0.6)] inline-block"
              />
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.12, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: 0.8, ease: "easeInOut" }}
                className="w-1.5 h-1.5 xs:w-1.5 xs:h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#27C93F] shadow-[0_0_6px_rgba(39,201,63,0.6)] inline-block"
              />
            </div>

            {/* Looping Gold Laser Scanline on Header Divider */}
            <motion.div
              animate={{ x: ["-100%", "250%"] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-0 left-0 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-gold-400/70 to-transparent pointer-events-none"
            />
          </div>

          {/* Properties Rows */}
          <div className="relative z-10 space-y-1 xs:space-y-1.5 sm:space-y-1.5 font-mono text-[8px] xs:text-[8.5px] sm:text-[10px]">
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-white/45 shrink-0">Price</span>
              <span className="text-white/70 font-semibold tracking-wider truncate">{displayPrice}</span>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-white/45 shrink-0">Status</span>
              <motion.span
                animate={{ opacity: [0.75, 1, 0.75] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="text-emerald-500/90 font-medium tracking-wider drop-shadow-[0_0_8px_rgba(16,185,129,0.35)] truncate"
              >
                {displayStatus}
              </motion.span>
            </div>
            {displayDetails.map(([key, val], idx) => (
              <div key={idx} className="flex justify-between items-baseline gap-2 pt-0.5 border-t border-white/[0.06]">
                <span className="text-white/40 shrink-0 text-[8.5px]">{key}</span>
                <span className="text-gold-300/90 font-medium tracking-wide truncate text-[8.5px]">{val}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Rectangular EXPLORE COLLECTION I Bar */}
        <motion.div
          animate={{
            y: [-2, 2, -2]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-[56px] xs:bottom-[62px] sm:bottom-[68px] md:bottom-[74px] -left-2 -right-2 xs:-left-3 xs:-right-3 sm:-left-5 sm:-right-5 md:-left-6 md:-right-6 z-30 pointer-events-auto"
        >
          {/* Subtle green ambient glow under right side of bar */}
          <div className="absolute -bottom-1 right-[16%] w-12 sm:w-20 h-4 sm:h-5 bg-emerald-500/35 blur-md pointer-events-none" />

          <motion.button
            onClick={handleEnterClick}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full group relative px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 md:py-3.5 bg-[#0c0c0e]/90 hover:bg-[#111115]/95 border border-white/15 hover:border-gold-500/50 backdrop-blur-xl rounded-none transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.95)] flex items-center justify-center gap-2 sm:gap-3 cursor-pointer"
          >
            <span className="text-[8.5px] xs:text-[9.5px] sm:text-[11.5px] md:text-[12.5px] uppercase tracking-[0.18em] xs:tracking-[0.24em] sm:tracking-[0.28em] text-white font-sans font-medium group-hover:text-gold-200 transition-colors whitespace-nowrap">
              EXPLORE COLLECTION I
            </span>
            <ArrowUpRight size={13} className="text-gold-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300 shrink-0 sm:w-[15px] sm:h-[15px]" />
          </motion.button>
        </motion.div>
      </div>

      {/* Walk-in screen transition */}
      {isWalkingIn && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="fixed inset-0 pointer-events-none z-[100] bg-black flex items-center justify-center px-4"
        >
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl sm:text-4xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-100 to-gold-600 tracking-[0.3em] sm:tracking-[0.5em] text-center uppercase"
          >
            DEUZ & CO
          </motion.h1>
        </motion.div>
      )}
    </section>
  );
};

export default FashionStore;
