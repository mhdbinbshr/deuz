import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import { Sparkles, Compass, Infinity as InfinityIcon } from 'lucide-react';

const NEW_LOGO_URL = "https://ik.imagekit.io/dto1zguat/1775236374031.png?updatedAt=1788674480127";

const About: React.FC = () => {
  const { content } = useSettings();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse coordinate values normalized between -0.5 and 0.5
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // High-inertia physics spring for silky, luxurious motion
  const springConfig = { stiffness: 180, damping: 22 };
  const mouseXSpring = useSpring(x, springConfig);
  const mouseYSpring = useSpring(y, springConfig);

  // Map spring outputs to 3D rotation and dynamic offsets
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [18, -18]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-22, 22]);
  const shadowX = useTransform(mouseXSpring, [-0.5, 0.5], [25, -25]);
  const shadowY = useTransform(mouseYSpring, [-0.5, 0.5], [25, -25]);
  const sheenX = useTransform(mouseXSpring, [-0.5, 0.5], ['-30%', '130%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
    const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!cardRef.current || e.touches.length === 0) return;
    const rect = cardRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const mouseX = (touch.clientX - rect.left) / rect.width - 0.5;
    const mouseY = (touch.clientY - rect.top) / rect.height - 0.5;
    x.set(Math.max(-0.5, Math.min(0.5, mouseX)));
    y.set(Math.max(-0.5, Math.min(0.5, mouseY)));
    setIsHovered(true);
  };

  const handleInteractionEnd = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  // Determine logo source with priority on the requested logo
  const logoSrc = (!content.aboutImage || content.aboutImage.includes("file_0000000054e071fa80c009a3a2a07326"))
    ? NEW_LOGO_URL
    : content.aboutImage;

  return (
    <section id="house-standards" className="relative py-32 bg-transparent px-6 md:px-12 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-center relative z-10">
        
        {/* Text Side (Left Column) */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-gold-400 text-xs sm:text-sm font-mono tracking-[0.35em] uppercase mb-6 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-gold-400"></span>
              {content.aboutTitle || 'THE HOUSE STANDARD'}
            </h2>
            
            <h3 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-white leading-tight mb-8" 
              dangerouslySetInnerHTML={{ 
                __html: (content.aboutSubtitle || 'DEUZ IS THE <br /> <span className="text-white/30">DESIGN.</span>').replace('\n', '<br />') 
              }} 
            />
            
            <p className="text-base sm:text-lg text-gray-400 font-light leading-relaxed mb-8 max-w-2xl">
              {content.aboutDescription || 'DEUZ & CO is anchored in singularity. One design defines the house — structured with discipline, refined with precision, and elevated through measured evolution. We do not multiply form. We perfect it. Each release strengthens the standard.'}
            </p>
          </motion.div>

          {/* Markers */}
          <div className="grid grid-cols-3 gap-3 md:gap-8 mt-10 border-t border-white/10 pt-10">
            {[
              { label: 'I', value: 'ICON' },
              { label: 'II', value: 'PRECISION' },
              { label: 'III', value: 'PERMANENCE' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 * idx, duration: 0.8 }}
                className="flex flex-col justify-between"
              >
                <div className="text-xs sm:text-sm md:text-lg lg:text-xl font-serif text-white mb-2 tracking-[0.15em] uppercase">
                  {stat.value}
                </div>
                <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.25em] text-gold-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-2 text-[9px] font-mono tracking-[0.25em] text-white/40 uppercase">
            <Compass size={12} className="text-gold-400/80 animate-spin-slow" />
            <span>DEUZ & CO</span>
          </div>
        </div>

        {/* 3D Animated Logo Stage (Right Column) */}
        <div className="lg:col-span-5 flex justify-center items-center">
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleInteractionEnd}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleInteractionEnd}
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[460px] aspect-[4/5] rounded-xl cursor-grab active:cursor-grabbing select-none"
            style={{ perspective: 1200 }}
          >
            {/* Ambient Back Glow Nebula */}
            <motion.div 
              animate={{ 
                scale: [1, 1.14, 1],
                opacity: isHovered ? 0.65 : [0.35, 0.5, 0.35]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -inset-8 rounded-full bg-gradient-to-tr from-gold-500/25 via-amber-500/15 to-transparent blur-[85px] pointer-events-none"
            />

            {/* 3D Tilting & Floating Monolith Showcase */}
            <motion.div
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d"
              }}
              animate={!isHovered ? {
                y: [-8, 8, -8],
                rotateZ: [-1, 1, -1]
              } : { y: 0, rotateZ: 0 }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative w-full h-full rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.07] via-black/60 to-black/90 backdrop-blur-md overflow-hidden p-8 flex flex-col justify-between shadow-[0_30px_70px_rgba(0,0,0,0.85)] group"
            >
              {/* Subtle Tech Grid Lines Overlay */}
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)`,
                  backgroundSize: '24px 24px'
                }}
              />

              {/* Corner Coordinates & Tech Markers */}
              <div className="relative z-20 flex justify-between items-start text-[8px] sm:text-[9px] font-mono tracking-[0.3em] text-white/50 uppercase">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
                  <InfinityIcon size={14} className="text-gold-400/90" />
                </div>
                <div className="text-right text-white/40">
                  <span>REF. 2026.01</span>
                </div>
              </div>

              {/* Central 3D Floating Logo Stage */}
              <div 
                className="relative my-auto flex items-center justify-center py-6"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* 3D Floor Shadow that moves opposite to tilt */}
                <motion.div 
                  style={{
                    x: shadowX,
                    y: shadowY,
                    transform: "translateZ(-30px)"
                  }}
                  animate={{
                    scale: [0.85, 1.05, 0.85],
                    opacity: [0.4, 0.7, 0.4]
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-44 sm:w-56 h-12 rounded-[50%] bg-gold-500/20 blur-xl pointer-events-none"
                />

                {/* Concentric 3D Orbit Ring 1 (Slow Horizontal Ring) */}
                <motion.div 
                  animate={{ rotateZ: 360 }}
                  transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
                  style={{
                    transform: "translateZ(-15px) rotateX(68deg)",
                    transformStyle: "preserve-3d"
                  }}
                  className="absolute w-60 sm:w-72 h-60 sm:h-72 rounded-full border border-gold-400/20 border-dashed pointer-events-none"
                />

                {/* Concentric 3D Orbit Ring 2 (Counter-rotating Oval) */}
                <motion.div 
                  animate={{ rotateZ: -360 }}
                  transition={{ duration: 44, repeat: Infinity, ease: "linear" }}
                  style={{
                    transform: "translateZ(-5px) rotateX(74deg) rotateY(15deg)",
                    transformStyle: "preserve-3d"
                  }}
                  className="absolute w-72 sm:w-84 h-72 sm:h-84 rounded-full border border-white/10 pointer-events-none"
                />

                {/* THE 3D LOGO LAYER */}
                <motion.div 
                  style={{ 
                    transform: "translateZ(55px)",
                    transformStyle: "preserve-3d" 
                  }}
                  animate={{
                    rotateY: isHovered ? 0 : [-3, 3, -3],
                    z: [50, 65, 50]
                  }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative flex items-center justify-center p-2"
                >
                  {/* Under-glow halo directly behind the PNG */}
                  <div className="absolute inset-0 bg-gradient-to-r from-gold-500/30 via-amber-400/20 to-gold-600/30 rounded-full blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none scale-110" />

                  {/* Secondary 3D Depth Silhouette layer behind */}
                  <img 
                    src={logoSrc} 
                    alt="The House Standard Logo 3D Depth" 
                    className="absolute max-w-[210px] sm:max-w-[250px] max-h-[220px] object-contain filter blur-[6px] opacity-40 brightness-150 transform translate-y-3 pointer-events-none select-none"
                    style={{ transform: "translateZ(-15px)" }}
                    referrerPolicy="no-referrer"
                  />

                  {/* Primary 3D PNG Logo */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative"
                  >
                    <img 
                      src={logoSrc} 
                      alt="The House Standard Logo" 
                      className="relative z-10 max-w-[210px] sm:max-w-[250px] max-h-[220px] object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] filter brightness-110 contrast-110 transition-all duration-500 select-none pointer-events-none"
                      referrerPolicy="no-referrer"
                    />

                    {/* Shimmer / Specular Light Sweep Animation across logo */}
                    <motion.div 
                      animate={{
                        x: ["-180%", "220%"]
                      }}
                      transition={{
                        duration: 3.5,
                        repeat: Infinity,
                        repeatDelay: 2.2,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-28deg] pointer-events-none mix-blend-overlay"
                    />
                  </motion.div>
                </motion.div>
              </div>

              {/* Bottom Footer */}
              <div 
                className="relative z-20 pt-4 border-t border-white/10 flex items-center justify-between"
                style={{ transform: "translateZ(35px)" }}
              >
                <div>
                  <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.25em] text-gold-400/90 uppercase block mb-0.5">
                    DEUZ & CO
                  </span>
                  <p className="text-[10px] sm:text-[11px] font-serif tracking-[0.2em] text-white/90 uppercase">
                    NOT FOR EVERYONE
                  </p>
                </div>

                {/* Floating Rotating Hallmark Badge */}
                <div className="relative w-14 h-14 rounded-full border border-gold-400/30 bg-black/40 backdrop-blur-sm flex items-center justify-center animate-spin-slow">
                  <div className="text-[7px] font-mono uppercase tracking-[0.2em] text-gold-400/90 text-center leading-tight">
                    EST.<br />2026
                  </div>
                  <Sparkles size={8} className="absolute -top-1 -right-1 text-gold-400 animate-ping" />
                </div>
              </div>

              {/* Surface Specular Glare reacting to cursor */}
              <motion.div 
                style={{
                  x: sheenX,
                  opacity: isHovered ? 0.12 : 0.04
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent skew-x-12 pointer-events-none transition-opacity duration-300"
              />
            </motion.div>
          </motion.div>
        </div>

      </div>
    </section>
  );
};

export default About;