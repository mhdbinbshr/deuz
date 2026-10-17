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
      className="relative min-h-screen py-16 sm:py-24 md:py-28 bg-[#020202] flex items-center justify-center select-none px-4 sm:px-6 overflow-hidden"
    >
      {/* Background Radial Glow & Vignette */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] md:w-[1000px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.04)_0%,transparent_70%)] blur-[100px] pointer-events-none z-0" />

      {/* Subtle Background Perspective Depth Cards */}
      <div className="absolute -left-16 sm:-left-20 top-1/2 -translate-y-1/2 w-64 sm:w-80 h-96 sm:h-[480px] bg-white/[0.015] border border-white/[0.04] rounded-2xl rotate-[-8deg] pointer-events-none hidden sm:block opacity-30 blur-[0.5px]" />
      <div className="absolute -right-16 sm:-right-20 top-1/2 -translate-y-1/2 w-64 sm:w-80 h-96 sm:h-[480px] bg-white/[0.015] border border-white/[0.04] rounded-2xl rotate-[8deg] pointer-events-none hidden sm:block opacity-30 blur-[0.5px]" />

      {/* Composition Container */}
      <div className="relative w-full max-w-lg sm:max-w-xl md:max-w-2xl flex items-center justify-center my-auto">
        {/* Main Photo Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          animate={isWalkingIn ? { scale: 1.08, opacity: 0 } : {}}
          className="relative w-full max-w-[340px] xs:max-w-[380px] sm:max-w-[420px] aspect-[1122/1402] rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 bg-[#070709] shadow-[0_30px_90px_rgba(0,0,0,0.95)] z-10"
        >
          {/* Top-Left Circular Target Reticle (Subtle corner anchor) */}
          <div className="absolute top-5 left-5 z-20 flex items-center justify-center w-7 h-7 rounded-full border border-white/35 pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
          </div>

          {/* (Top labelling 'DEUZ & CO' and 'COLLECTION I' removed as requested) */}

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
            className="absolute top-[20%] left-[24%] sm:left-[28%] z-30 pointer-events-none flex items-start gap-1 drop-shadow-[0_8px_25px_rgba(0,0,0,0.9)]"
          >
            <MousePointer2 size={19} className="text-emerald-400 fill-emerald-400 -rotate-12 shrink-0 drop-shadow-[0_0_12px_rgba(52,211,153,0.95)]" />
            <span className="px-2.5 py-1 bg-emerald-500 text-black text-[9.5px] sm:text-[10px] font-mono font-black uppercase tracking-wider rounded-sm shadow-[0_0_12px_rgba(16,185,129,0.5)]">
              New Drop
            </span>
          </motion.div>

          {/* Garment Image Canvas with Afterlight Product Image (Fitting fully to border) */}
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

            {/* Top scrim for clean contrast without hiding the garment */}
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

            {/* Subtle bottom gradient scrim that doesn't bury the garment */}
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none z-10" />
          </div>

          {/* Bottom Card Content: Caption, Timeline Bar, and Domain */}
          <div className="absolute inset-x-0 bottom-0 pt-24 pb-20 sm:pb-22 px-5 sm:px-6 pointer-events-none z-10 flex flex-col justify-end">
            <p className="text-white/75 text-[10px] sm:text-[11px] font-sans font-light leading-relaxed max-w-[240px] sm:max-w-[280px] mb-2.5">
              {displayDesc}
            </p>

            {/* Progress Bar & Domain */}
            <div className="w-full">
              <div className="w-full h-[2px] bg-white/15 rounded-full overflow-hidden flex">
                <div className="w-1/2 h-full bg-gold-400 shadow-[0_0_6px_#D4AF37]" />
                <div className="w-1/2 h-full bg-white/15" />
              </div>
              <p className="text-[7.5px] sm:text-[8px] font-mono tracking-[0.25em] text-white/40 text-center uppercase mt-1">
                www.deuzandco.com
              </p>
            </div>
          </div>
        </motion.div>

        {/* macOS PROPERTIES Tab (Permanently visible with continuous animation, slightly overlapping with explore button) */}
        <motion.div
          animate={{ 
            y: [-5, 6, -5],
            x: [0, 2.5, -2, 0],
            rotate: [-0.6, 0.6, -0.6]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -right-2 xs:right-0 sm:-right-4 md:-right-6 bottom-7 sm:bottom-9 md:bottom-10 w-48 xs:w-52 sm:w-60 bg-[#09090c]/95 border border-white/20 backdrop-blur-2xl rounded-xl p-3.5 sm:p-4 md:p-5 shadow-[0_25px_60px_rgba(0,0,0,0.95)] z-20 pointer-events-auto"
        >
          {/* Header with macOS Traffic Lights on the Left & PROPERTIES Title */}
          <div className="flex items-center justify-between pb-2 sm:pb-2.5 border-b border-white/10 mb-2.5 sm:mb-3">
            <div className="flex items-center gap-2">
              {/* macOS Red, Yellow, Green Traffic Light Dots */}
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] shadow-sm inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] shadow-sm inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] shadow-sm inline-block" />
              </div>
              <span className="text-[10px] sm:text-[10.5px] font-mono uppercase tracking-[0.22em] text-white/80 font-bold ml-1">
                PROPERTIES
              </span>
            </div>
            <span className="text-[8.5px] font-mono uppercase tracking-widest text-gold-400/80 font-semibold">
              SPEC
            </span>
          </div>

          {/* Properties Rows */}
          <div className="space-y-2.5 sm:space-y-3 font-mono text-[9.5px] sm:text-[11px]">
            <div className="flex justify-between items-baseline">
              <span className="text-white/45">Category</span>
              <span className="text-white font-bold uppercase tracking-wider">{displayCategory}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-white/45">Price</span>
              <span className="text-gold-400 font-bold tracking-wider">{displayPrice}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-white/45">Status</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {displayStatus}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Floating EXPLORE COLLECTION Tab (Positioned at Bottom Center with slight overlap over the Properties box) */}
        <motion.div 
          animate={{ 
            y: [-3, 3, -3] 
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
        >
          {/* Green ambient backlight glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-56 h-12 bg-emerald-500/25 blur-2xl pointer-events-none" />

          <motion.button 
            onClick={handleEnterClick}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="group relative px-6 xs:px-8 sm:px-10 py-3 sm:py-3.5 bg-[#09090c]/92 hover:bg-black border border-white/25 hover:border-gold-400/90 backdrop-blur-2xl rounded-full transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_25px_rgba(16,185,129,0.15)] flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer"
          >
            <span className="text-xs sm:text-[13px] uppercase tracking-[0.28em] text-white font-mono font-medium group-hover:text-gold-200 transition-colors whitespace-nowrap">
              EXPLORE COLLECTION
            </span>
            <ArrowUpRight size={17} className="text-gold-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300 shrink-0" />
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
