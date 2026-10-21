import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, MousePointer2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface FashionStoreProps {
  onEnterStore: () => void;
}

const AFTERLIGHT_PRIMARY = "https://ik.imagekit.io/dto1zguat/Afterlight_1.png";
const AFTERLIGHT_SECONDARY = "https://ik.imagekit.io/dto1zguat/Afterlight_2.png";

const FashionStore: React.FC<FashionStoreProps> = ({ onEnterStore }) => {
  const containerRef = useRef<HTMLElement>(null);
  const [isWalkingIn, setIsWalkingIn] = useState(false);
  const { content } = useSettings();

  // Perspective cycling between Afterlight 1 and 2
  const [autoPerspective, setAutoPerspective] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAutoPerspective(prev => (prev === 0 ? 1 : 0));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Use previous Afterlight product image as requested
  const displayImage = autoPerspective === 0 ? AFTERLIGHT_PRIMARY : AFTERLIGHT_SECONDARY;
  const displayDesc = content.latestDropDescription || "A study in structure and restraint. Heavyweight French terry designed for enduring presence.";
  const displayCategory = content.latestDropCategory || "TEE";
  const displayPrice = content.latestDropPrice || "₹2,999";
  const displayStatus = content.latestDropStatus || "Active";

  const handleEnterClick = () => {
    setIsWalkingIn(true);
    setTimeout(() => {
      onEnterStore();
      setIsWalkingIn(false);
    }, 400);
  };

  return (
    <section 
      ref={containerRef} 
      id="collection-section"
      className="relative w-full max-w-[100vw] min-h-screen min-h-[100dvh] py-8 sm:py-12 md:py-16 bg-[#020202] flex items-center justify-center select-none px-4 xs:px-6 sm:px-10 md:px-16 overflow-hidden"
    >
      {/* Background Radial Glow & Vignette */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] md:w-[1000px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.04)_0%,transparent_70%)] blur-[100px] pointer-events-none z-0" />

      {/* Subtle Background Perspective Depth Cards */}
      <div className="absolute -left-16 sm:-left-20 top-1/2 -translate-y-1/2 w-64 sm:w-80 h-96 sm:h-[480px] bg-white/[0.015] border border-white/[0.04] rounded-2xl rotate-[-8deg] pointer-events-none hidden sm:block opacity-30 blur-[0.5px]" />
      <div className="absolute -right-16 sm:-right-20 top-1/2 -translate-y-1/2 w-64 sm:w-80 h-96 sm:h-[480px] bg-white/[0.015] border border-white/[0.04] rounded-2xl rotate-[8deg] pointer-events-none hidden sm:block opacity-30 blur-[0.5px]" />

      {/* Composition Container — Constrained by both viewport width and height so no overhanging layer ever cuts the screen */}
      <div className="relative w-[80vw] max-w-[275px] xs:max-w-[315px] sm:w-[72vw] sm:max-w-[370px] md:max-w-[400px] lg:max-w-[420px] flex flex-col items-center justify-center my-auto">
        {/* Main Photo Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          animate={isWalkingIn ? { scale: 1.08, opacity: 0 } : {}}
          className="relative w-full aspect-[4/5] sm:aspect-[1122/1402] max-h-[75dvh] sm:max-h-[80dvh] rounded-none overflow-hidden border border-white/15 bg-[#070709] shadow-[0_30px_90px_rgba(0,0,0,0.95)] z-10"
        >
          {/* Top Header Bar inside Photo Card: Reticle on Left, COLLECTION I on Right, Divider Line below */}
          <div className="absolute inset-x-0 top-0 z-20 px-3.5 xs:px-4 sm:px-6 pt-3.5 xs:pt-4 sm:pt-5 pointer-events-none">
            <div className="flex items-center justify-between pb-2.5 xs:pb-3 sm:pb-4 border-b border-white/15">
              <div className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full border border-white/30">
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
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
              New Drop
            </span>
          </motion.div>

          {/* Garment Image Canvas with Afterlight Product Image */}
          <div className="relative w-full h-full bg-[#050505] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img 
                key={displayImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                src={displayImage}
                className="w-full h-full object-cover object-center"
                alt="Afterlight — DEUZ New Drop"
              />
            </AnimatePresence>

            {/* Subtle Gold Sheen Wave on Perspective Transition */}
            <motion.div 
              key={`sheen-${autoPerspective}`}
              initial={{ x: "-100%", opacity: 0.35 }}
              animate={{ x: "200%", opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-300/20 to-transparent skew-x-[-22deg] pointer-events-none z-20"
            />

            {/* Top scrim for clean contrast */}
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

            {/* Bottom dark gradient scrim for caption legibility */}
            <div className="absolute inset-x-0 bottom-0 h-40 sm:h-52 bg-gradient-to-t from-black/95 via-black/75 to-transparent pointer-events-none z-10" />
          </div>

          {/* Bottom Card Content: Caption, Timeline Bar, and Domain (sits cleanly below EXPLORE COLLECTION I) */}
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
          className="absolute -right-2 xs:-right-3 sm:-right-8 md:-right-14 lg:-right-18 bottom-[84px] xs:bottom-[92px] sm:bottom-[104px] md:bottom-[112px] w-[148px] xs:w-[172px] sm:w-[220px] md:w-[250px] bg-[#070709]/95 border-0 backdrop-blur-2xl rounded-none pt-2.5 px-3 pb-4 xs:pt-3 xs:px-3.5 xs:pb-4.5 sm:pt-4 sm:px-5 sm:pb-5.5 md:pt-4.5 md:px-5.5 md:pb-6 shadow-[-20px_25px_60px_rgba(0,0,0,0.95),0_20px_50px_rgba(0,0,0,0.95)] z-20 pointer-events-auto overflow-hidden"
        >
          {/* Looping Ambient Gold Core Glow */}
          <motion.div
            animate={{
              opacity: [0.12, 0.35, 0.12],
              scale: [0.85, 1.2, 0.85],
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gold-500/20 blur-2xl pointer-events-none"
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
          <div className="relative z-10 flex items-center justify-between pb-2 sm:pb-2.5 border-b border-white/10 mb-2 sm:mb-3 overflow-hidden">
            <motion.span
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-[8px] xs:text-[9px] sm:text-[10.5px] font-mono uppercase tracking-[0.15em] sm:tracking-[0.18em] text-gold-500 font-semibold"
            >
              PROPERTIES
            </motion.span>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.12, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: 0, ease: "easeInOut" }}
                className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FF5F56] shadow-[0_0_6px_rgba(255,95,86,0.6)] inline-block"
              />
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.12, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: 0.4, ease: "easeInOut" }}
                className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FFBD2E] shadow-[0_0_6px_rgba(255,189,46,0.6)] inline-block"
              />
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.12, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: 0.8, ease: "easeInOut" }}
                className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#27C93F] shadow-[0_0_6px_rgba(39,201,63,0.6)] inline-block"
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
          <div className="relative z-10 space-y-1.5 xs:space-y-2 sm:space-y-2.5 font-mono text-[9px] xs:text-[9.5px] sm:text-[11px]">
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-white/45 shrink-0">Category</span>
              <span className="text-white font-bold uppercase tracking-wider truncate">{displayCategory}</span>
            </div>
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
          </div>
        </motion.div>

        {/* Rectangular EXPLORE COLLECTION I Bar — Pure CSS left/right overhang (no transform conflict), responsive across all screen widths */}
        <motion.div 
          animate={{ 
            y: [-2, 2, -2] 
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-[60px] xs:bottom-[66px] sm:bottom-[74px] md:bottom-[80px] -left-2.5 -right-2.5 xs:-left-3.5 xs:-right-3.5 sm:-left-6 sm:-right-6 md:-left-8 md:-right-8 z-30 pointer-events-auto"
        >
          {/* Subtle green ambient glow under right side of bar */}
          <div className="absolute -bottom-1 right-[16%] w-14 sm:w-24 h-5 sm:h-6 bg-emerald-500/35 blur-md pointer-events-none" />

          <motion.button 
            onClick={handleEnterClick}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full group relative px-3.5 xs:px-5 sm:px-7 py-2.5 xs:py-3 sm:py-4 md:py-4.5 bg-[#0c0c0e]/90 hover:bg-[#111115]/95 border border-white/15 hover:border-gold-500/50 backdrop-blur-xl rounded-none transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.95)] flex items-center justify-center gap-2 sm:gap-3.5 cursor-pointer"
          >
            <span className="text-[9.5px] xs:text-[10.5px] sm:text-[13px] md:text-[14px] uppercase tracking-[0.2em] xs:tracking-[0.26em] sm:tracking-[0.32em] text-white font-sans font-medium group-hover:text-gold-200 transition-colors whitespace-nowrap">
              EXPLORE COLLECTION I
            </span>
            <ArrowUpRight size={14} className="text-gold-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300 shrink-0 sm:w-[17px] sm:h-[17px]" />
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
