import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import { Cinematic3D } from './Cinematic3D';

const Hero: React.FC = () => {
  const { content } = useSettings();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 400]); 
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const scale = useTransform(scrollY, [0, 1000], [1.1, 1]); 
  const indicatorOpacity = useTransform(scrollY, [0, 100], [1, 0]);

  // Cinematic Easing
  const ease = [0.22, 1, 0.36, 1];

  const letterContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.5
      }
    }
  };

  const letterAnimation = {
    hidden: { y: 100, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1,
      transition: { ease, duration: 1 } 
    }
  };

  // Explicitly set as per design requirement
  const titleText = "ARCHITECTS OF PRESENCE";

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden bg-transparent">
      {/* --- PREMIUM ANIMATED BACKGROUND --- */}
      <motion.div 
        style={{ opacity, scale }}
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      >
        {/* Replaced 3D with requested image */}
        <div className="absolute inset-0 w-full h-full">
          <img 
            src="https://ik.imagekit.io/dto1zguat/file_000000002ecc7208a8ede084113063e5.png" 
            alt="Hero Background" 
            className="w-full h-full object-cover object-center opacity-25"
          />
        </div>
        
        {/* Transparent Base to show Global Premium Background */}
        
        {/* Moving Light Source 1 (Gold) - Kept for Hero emphasis */}
        <motion.div 
          animate={{ 
            x: ['-20%', '20%', '-20%'],
            y: ['-20%', '10%', '-20%'],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-gold-600/10 rounded-full blur-[120px]"
        />

        {/* Moving Light Source 2 (Cool Blue/Grey) */}
        <motion.div 
          animate={{ 
            x: ['20%', '-20%', '20%'],
            y: ['20%', '-10%', '20%'],
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-slate-800/20 rounded-full blur-[100px]"
        />

        {/* Abstract "Light Leak" Beam */}
        <motion.div
           animate={{ rotate: [0, 360] }}
           transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vw] opacity-[0.03]"
           style={{ background: 'conic-gradient(from 0deg, transparent 0deg, white 20deg, transparent 40deg)' }}
        />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
      </motion.div>

      {/* --- TOP-DOWN CINEMATIC SPOTLIGHT --- */}
      <motion.div 
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[85vh] pointer-events-none z-0 origin-top"
      >
         {/* Main Beam - Volumetric */}
         <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] md:w-[800px] h-full bg-gradient-to-b from-white/10 via-gold-100/5 to-transparent blur-[50px] mix-blend-overlay"
            style={{ clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)" }}
         />
         
         {/* Core Shaft - Sharper */}
         <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] md:w-[400px] h-[90%] bg-gradient-to-b from-white/15 to-transparent blur-[30px]"
            style={{ clipPath: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)" }}
         />

         {/* Source Hotspot */}
         <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-gold-200/20 blur-[80px] rounded-full mix-blend-screen" />
      </motion.div>

      {/* Content */}
      <motion.div 
        style={{ y, opacity }}
        className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 pt-10 gap-0"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease }}
          className="mb-8"
        >
          <span className="text-gold-400 text-[10px] md:text-xs uppercase tracking-[0.5em] font-medium border border-gold-500/20 bg-gold-900/5 px-4 py-2 rounded-full backdrop-blur-md">
            EST•2026•KERALA
          </span>
        </motion.div>

        {/* Staggered Title Reveal */}
        {/* Increased vertical padding (py-8) to fix overlap/clipping of large font */}
        <motion.h1
          variants={letterContainer}
          initial="hidden"
          animate="show"
          className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-[9rem] font-serif text-white tracking-widest leading-[1.1] mix-blend-screen overflow-hidden max-w-6xl drop-shadow-2xl py-8"
        >
          <div className="flex justify-center flex-wrap overflow-hidden gap-x-4">
            {titleText.split(" ").map((word, wIdx) => (
                <span key={wIdx} className="inline-block whitespace-nowrap">
                    {Array.from(word).map((char, i) => (
                    <motion.span key={i} variants={letterAnimation} className="inline-block">
                        {char}
                    </motion.span>
                    ))}
                </span>
            ))}
          </div>
        </motion.h1>

        {/* Increased top margin (mt-24) to create luxurious whitespace */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.4, ease }}
          className="mt-24 max-w-lg text-sm md:text-base text-gray-400 font-light tracking-wide leading-relaxed mix-blend-plus-lighter relative z-20"
        >
          Designed to Outlast
        </motion.p>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        style={{ opacity: indicatorOpacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-20"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-white/0 via-white/40 to-white/0 overflow-hidden relative">
          <motion.div
            className="absolute top-0 left-0 w-full h-1/2 bg-gold-500"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;