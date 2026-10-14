import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Compass, Sparkles, X, ZoomIn, Play, Pause, ChevronLeft, ChevronRight, Film } from 'lucide-react';
import { db } from '../utils/db';
import { ArchivedProductReel } from './ArchivedProductReel';

interface ArchivePageProps {
  onBack: () => void;
}

interface MuseumArtifact {
  _id?: string;
  id?: string;
  image: string;
  gallery?: string[];
  title: string;
  houseCode?: string;
  edition?: string;
  details?: Record<string, string>;
  isArchived?: boolean;
}

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];

// Helper to extract complete images for a product
const getArtifactImages = (item: MuseumArtifact): string[] => {
  const rawList = [
    item.image,
    ...(Array.isArray(item.gallery) ? item.gallery : [])
  ].filter((img, i, arr) => Boolean(img) && typeof img === 'string' && arr.indexOf(img) === i);

  if (rawList.length === 0) return ['https://ik.imagekit.io/dto1zguat/Evolve_1.jpg'];
  return rawList;
};

export const ArchivePage: React.FC<ArchivePageProps> = ({ onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<MuseumArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtifact, setSelectedArtifact] = useState<{ item: MuseumArtifact; index: number } | null>(null);

  // Museum Ambient Spotlight coordinates
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = ({ clientX, clientY }: MouseEvent) => {
      mouseX.set(clientX);
      mouseY.set(clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const fetchArchived = async () => {
      try {
        const allProducts = await db.getProducts() as any[];
        const safeProducts = Array.isArray(allProducts) ? allProducts : [];
        
        // Products strictly transferred from collection to archive by admin
        let archived = safeProducts.filter((p: any) => p.isArchived === true);

        // Fallback for demonstration if admin has not yet archived items
        if (archived.length === 0 && safeProducts.length > 0) {
          archived = safeProducts.slice(0, 4).map((p: any) => ({
            ...p,
            isArchived: true
          }));
        }

        setItems(archived);
      } catch (e) {
        console.error('Failed to load archive artifacts:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchArchived();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[100] bg-[#050505] text-[#e8e0d5] overflow-y-auto overflow-x-hidden select-none cursor-default font-serif"
      ref={containerRef}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(197,160,89,0.3) #050505'
      }}
    >
      {/* Vintage Museum Wall Texture & Classical Ambient Spotlight */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }} 
        />
        
        {/* Museum warm golden gallery spotlight tracking mouse */}
        <motion.div
          className="absolute w-[900px] h-[900px] bg-[radial-gradient(circle,rgba(212,175,55,0.06)_0%,rgba(160,120,40,0.02)_40%,transparent_70%)] rounded-full blur-[80px]"
          style={{
            x: useSpring(mouseX, { stiffness: 25, damping: 40 }),
            y: useSpring(mouseY, { stiffness: 25, damping: 40 }),
            translateX: '-50%',
            translateY: '-50%'
          }}
        />

        {/* Vintage Vignette Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]" />
      </div>

      {/* Classical Museum Top Header & Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-12 py-6 sm:py-8 flex justify-between items-center backdrop-blur-md bg-black/40 border-b border-[#c5a059]/20">
        <button 
          onClick={onBack}
          className="flex items-center gap-3 sm:gap-4 group cursor-pointer"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#c5a059]/40 flex items-center justify-center bg-[#0a0a0a] group-hover:bg-[#c5a059] group-hover:border-[#c5a059] transition-all duration-500 shadow-[0_0_15px_rgba(197,160,89,0.1)]">
            <ArrowLeft size={16} className="text-[#c5a059] group-hover:text-black transition-colors" />
          </div>
          <div className="text-left">
            <span className="block text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-[#c5a059]/70 group-hover:text-[#c5a059] transition-colors font-mono">
              Exit Conservatoire
            </span>
            <span className="block text-xs sm:text-sm font-serif tracking-[0.2em] text-[#f4ecd8]">
              SALON DES ARCHIVES
            </span>
          </div>
        </button>

        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <div className="text-[#c5a059] font-serif text-xs tracking-[0.3em] uppercase">
              DEUZ & CO. ARCHIVAL COLLECTION
            </div>
            <div className="text-[9px] text-[#e8e0d5]/40 font-mono tracking-widest mt-0.5">
              Permanently Retired Artifacts • Curated Preservation
            </div>
          </div>
          <div className="w-9 h-9 rounded-full border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
            <Compass size={16} />
          </div>
        </div>
      </nav>

      {/* Classical Museum Wing Entrance / Hero */}
      <section className="relative z-10 pt-40 pb-20 sm:pt-48 sm:pb-28 px-6 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2 border border-[#c5a059]/30 rounded-full bg-[#0a0a0a]/60 shadow-[0_0_20px_rgba(197,160,89,0.15)]">
            <Sparkles size={12} className="text-[#c5a059] animate-pulse" />
            <span className="text-[9px] uppercase font-mono tracking-[0.35em] text-[#c5a059] font-medium">
              Conservatoire & Historic Register
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-8xl font-serif text-[#f4ecd8] tracking-[0.1em] uppercase drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)] leading-tight">
            The Museum Archive
          </h1>

          <p className="text-xs sm:text-sm md:text-base font-serif italic text-[#c5a059]/80 max-w-2xl mx-auto tracking-widest leading-relaxed">
            "A permanent sanctuary for retired silhouettes, singular prototypes, and historical editions withdrawn from active circulation."
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#c5a059]/50 to-transparent" />
            <span className="text-[9px] uppercase font-mono tracking-[0.4em] text-[#e8e0d5]/40">
              Historical Catalogue • {items.length} Exhibits Preserved
            </span>
            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#c5a059]/50 to-transparent" />
          </div>
        </motion.div>
      </section>

      {/* Auto-Animated Continuous Archival Tape Film Reel */}
      {!loading && items.length > 0 && (
        <ArchivedProductReel 
          items={items} 
          onSelectArtifact={(item, index) => setSelectedArtifact({ item, index })} 
        />
      )}

      {/* Classical Grand Vitrine Gallery Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 pb-36">
        {loading ? (
          <div className="py-32 text-center">
            <div className="w-12 h-12 rounded-full border border-[#c5a059]/40 border-t-[#c5a059] animate-spin mx-auto mb-4" />
            <p className="text-[10px] uppercase font-mono tracking-[0.3em] text-[#c5a059]/70">
              Unsealing Conservatoire Vitrines...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-32 text-center space-y-4">
            <p className="text-xl font-serif text-[#f4ecd8] tracking-widest uppercase">
              No Archival Artifacts Registered
            </p>
            <p className="text-xs text-[#c5a059]/60 font-mono tracking-wider">
              Products transferred from active collection by the admin will appear preserved here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24 sm:gap-y-36">
            {items.map((item, index) => (
              <MuseumVitrineDisplay
                key={item._id || item.id || `archive_${index}`}
                item={item}
                index={index}
                containerRef={containerRef}
                onSelect={() => setSelectedArtifact({ item, index })}
              />
            ))}
          </div>
        )}
      </section>

      {/* Museum Vitrine Full-Screen Inspection Modal with Complete Images & Auto Scroll */}
      <AnimatePresence>
        {selectedArtifact && (
          <InspectionModal
            artifact={selectedArtifact.item}
            index={selectedArtifact.index}
            onClose={() => setSelectedArtifact(null)}
          />
        )}
      </AnimatePresence>

      {/* Classical Museum Hall Footer */}
      <footer className="relative z-10 py-20 text-center border-t border-[#c5a059]/20 bg-gradient-to-b from-transparent to-black">
        <div className="w-8 h-8 rounded-full border border-[#c5a059]/30 mx-auto flex items-center justify-center text-[#c5a059] mb-4">
          <Compass size={16} />
        </div>
        <p className="text-[#c5a059] font-serif text-sm tracking-[0.3em] uppercase">
          Conservatoire Permanent Deuz & Co.
        </p>
        <p className="text-[9px] text-[#e8e0d5]/40 font-mono uppercase tracking-widest mt-2">
          Mumbai • New Delhi • Bengaluru • Hyderabad
        </p>
      </footer>
    </motion.div>
  );
};

// --- 3D Vintage Museum Vitrine Component with Auto Animated Scroll Reel ---

interface VitrineProps {
  item: MuseumArtifact;
  index: number;
  containerRef: React.RefObject<HTMLDivElement>;
  onSelect: () => void;
}

const MuseumVitrineDisplay: React.FC<VitrineProps> = ({ item, index, containerRef, onSelect }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const images = getArtifactImages(item);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto animated image scroll / carousel timer
  useEffect(() => {
    if (images.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % images.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [images.length, isPaused]);

  // Smooth mouse tilt physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 120, damping: 18 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // 3D Rotation on hover
  const rotateX = useTransform(springY, [-0.5, 0.5], ['6deg', '-6deg']);
  const rotateY = useTransform(springX, [-0.5, 0.5], ['-6deg', '6deg']);

  // Museum Glass specular reflection & lighting
  const glareX = useTransform(springX, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(springY, [-0.5, 0.5], ['0%', '100%']);

  // Scroll Parallax
  const { scrollYProgress } = useScroll({
    target: cardRef,
    container: containerRef,
    offset: ['start end', 'end start']
  });

  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    [index % 2 === 0 ? 30 : 80, index % 2 === 0 ? -30 : -80]
  );
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsPaused(false);
  };

  const romanNumeral = ROMAN_NUMERALS[index % ROMAN_NUMERALS.length];
  const houseCode = item.houseCode || item.details?.houseCode || `HC-${String(index + 1).padStart(3, '0')}`;
  const editionName = item.title;

  return (
    <motion.div
      ref={cardRef}
      style={{ y: parallaxY, opacity }}
      className={`relative group ${index % 2 !== 0 ? 'md:mt-24' : ''}`}
    >
      {/* Exhibit Roman Numeral Header */}
      <div className="flex items-center justify-between mb-4 px-2 border-b border-[#c5a059]/20 pb-2">
        <span className="text-[11px] font-serif text-[#c5a059] tracking-[0.3em]">
          EXHIBIT {romanNumeral}
        </span>
        <div className="flex items-center gap-2">
          {images.length > 1 && (
            <span className="text-[8px] font-mono tracking-widest text-[#c5a059]/70 uppercase px-2 py-0.5 rounded bg-[#c5a059]/10 border border-[#c5a059]/20 flex items-center gap-1">
              <Film size={10} />
              <span>{images.length} Complete Images • Auto Scroll</span>
            </span>
          )}
          <span className="text-[9px] font-mono tracking-widest text-[#e8e0d5]/40 uppercase">
            Conservatoire Record
          </span>
        </div>
      </div>

      {/* Interactive 3D Museum Shadowbox Vitrine */}
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsPaused(false)}
        onMouseLeave={handleMouseLeave}
        onClick={onSelect}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d'
        }}
        className="relative w-full aspect-[3/4] cursor-pointer perspective-[1200px]"
      >
        {/* Layer 1: Vintage Museum Archival Frame */}
        <div
          className="absolute inset-0 bg-[#0a0a0a] rounded-sm border-2 border-[#c5a059]/40 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden transition-all duration-700 group-hover:border-[#c5a059] group-hover:shadow-[0_30px_90px_rgba(197,160,89,0.15)]"
          style={{ transform: 'translateZ(0px)' }}
        >
          {/* Inner shadow for shadowbox depth */}
          <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] z-10 pointer-events-none" />

          {/* Classical Corner Filigree Markers */}
          <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#c5a059]/70 z-20" />
          <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#c5a059]/70 z-20" />
          <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#c5a059]/70 z-20" />
          <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#c5a059]/70 z-20" />

          {/* AUTO ANIMATED COMPLETE IMAGES DISPLAY */}
          <div className="relative w-full h-full overflow-hidden">
            <AnimatePresence initial={false} mode="wait">
              <motion.img
                key={images[activeImageIndex]}
                src={images[activeImageIndex]}
                alt={editionName}
                initial={{ opacity: 0.2, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.2, scale: 0.98 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover grayscale sepia-[0.35] brightness-90 contrast-[1.1] transition-all duration-700 ease-out group-hover:grayscale-0 group-hover:sepia-0 group-hover:brightness-105 group-hover:scale-105"
              />
            </AnimatePresence>

            {/* Subtle vintage 35mm film grain & optical scan lines */}
            <div 
              className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 3px, rgba(0,0,0,0.4) 4px)'
              }}
            />
          </div>

          {/* Museum Glass Glare Reflection Effect */}
          <motion.div
            style={{
              background: useTransform(
                [glareX, glareY],
                ([gx, gy]) =>
                  `radial-gradient(circle at ${gx} ${gy}, rgba(255,245,220,0.12) 0%, transparent 60%)`
              )
            }}
            className="absolute inset-0 pointer-events-none mix-blend-screen z-20"
          />

          {/* Slide Indicator Bar when multiple images exist */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 z-30 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#c5a059]/30">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === activeImageIndex
                      ? 'w-5 bg-[#c5a059]'
                      : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
              <span className="text-[8px] font-mono text-[#c5a059]/90 ml-1">
                {activeImageIndex + 1}/{images.length}
              </span>
            </div>
          )}

          {/* Inspect Badge on Hover */}
          <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/80 border border-[#c5a059] text-[9px] uppercase font-mono tracking-widest text-[#c5a059] rounded-full shadow-lg">
              <ZoomIn size={12} /> Inspect Complete Gallery
            </span>
          </div>
        </div>

        {/* Layer 2: Classical Museum Engraved Brass Plaque - ONLY SHOWS PRODUCT IMAGE, EDITION NAME, HOUSE CODE */}
        <motion.div
          style={{ transform: 'translateZ(35px)' }}
          className="absolute -bottom-6 left-6 right-6 z-30 pointer-events-none"
        >
          <div className="bg-gradient-to-b from-[#1c1711] via-[#120f0b] to-[#0a0806] border-2 border-[#c5a059]/70 p-4 sm:p-5 shadow-[0_15px_35px_rgba(0,0,0,0.9)] relative transition-all duration-500 group-hover:border-[#c5a059] group-hover:shadow-[0_20px_45px_rgba(197,160,89,0.2)]">
            {/* Screws in four corners of brass plaque */}
            <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#c5a059]/80 border border-[#4a3b20]" />
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#c5a059]/80 border border-[#4a3b20]" />
            <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#c5a059]/80 border border-[#4a3b20]" />
            <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#c5a059]/80 border border-[#4a3b20]" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Edition Name */}
              <div className="space-y-0.5 min-w-0">
                <span className="text-[8px] font-mono tracking-[0.25em] uppercase text-[#c5a059]/70 block">
                  Edition Name
                </span>
                <h3 className="font-serif text-base sm:text-lg text-[#f4ecd8] tracking-[0.15em] uppercase truncate">
                  {editionName}
                </h3>
              </div>

              {/* House Code */}
              <div className="text-left sm:text-right space-y-0.5 shrink-0">
                <span className="text-[8px] font-mono tracking-[0.25em] uppercase text-[#c5a059]/70 block">
                  House Code
                </span>
                <p className="font-mono text-xs sm:text-sm font-bold text-[#c5a059] tracking-[0.2em]">
                  {houseCode}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// --- Inspection Modal with Complete Images Auto Scroll Reel ---

interface InspectionModalProps {
  artifact: MuseumArtifact;
  index: number;
  onClose: () => void;
}

const InspectionModal: React.FC<InspectionModalProps> = ({ artifact, index, onClose }) => {
  const images = getArtifactImages(artifact);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  // Auto animated scroll timer in modal
  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % images.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [autoPlay, images.length]);

  const houseCode = artifact.houseCode || artifact.details?.houseCode || `HC-ARCHIVE-${String(index + 1).padStart(3, '0')}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-4xl w-full bg-[#080808] border-2 border-[#c5a059]/40 p-6 sm:p-8 shadow-[0_0_100px_rgba(0,0,0,0.95)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Classical Filigree Corners */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#c5a059]" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#c5a059]" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#c5a059]" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#c5a059]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-[#c5a059]/70 hover:text-[#c5a059] transition-colors z-20 cursor-pointer"
          aria-label="Close Inspection"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <span className="text-[9px] uppercase font-mono tracking-[0.35em] text-[#c5a059] block mb-1">
            Exhibition Catalogue • Exhibit {ROMAN_NUMERALS[index % ROMAN_NUMERALS.length]}
          </span>
          <h3 className="text-2xl sm:text-3xl font-serif text-[#f4ecd8] tracking-widest uppercase">
            Curatorial Inspection Reel
          </h3>
        </div>

        {/* COMPLETE PRODUCT IMAGES WITH AUTO ANIMATED SCROLL */}
        <div className="relative aspect-[3/4] max-h-[50vh] sm:max-h-[55vh] mx-auto rounded-sm overflow-hidden border border-[#c5a059]/30 bg-black shadow-2xl">
          <AnimatePresence initial={false} mode="wait">
            <motion.img
              key={images[currentIdx]}
              src={images[currentIdx]}
              alt={artifact.title}
              initial={{ opacity: 0.3, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0.3, x: -20 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="w-full h-full object-contain p-4"
            />
          </AnimatePresence>

          {/* Auto Animated Controls */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentIdx((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059] hover:bg-[#c5a059] hover:text-black transition-colors cursor-pointer"
                title="Previous Image"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentIdx((prev) => (prev + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059] hover:bg-[#c5a059] hover:text-black transition-colors cursor-pointer"
                title="Next Image"
              >
                <ChevronRight size={18} />
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/80 px-4 py-1.5 rounded-full border border-[#c5a059]/40 backdrop-blur-md">
                <button
                  onClick={() => setAutoPlay(!autoPlay)}
                  className="text-[#c5a059] hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest"
                >
                  {autoPlay ? <Pause size={12} /> : <Play size={12} />}
                  <span>{autoPlay ? 'Auto Scroll Active' : 'Paused'}</span>
                </button>
                <span className="text-white/30">|</span>
                <span className="text-[10px] font-mono text-[#c5a059] font-bold">
                  {currentIdx + 1} / {images.length}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Thumbnail Filmstrip if multiple complete images */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-3 overflow-x-auto py-1">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIdx(idx);
                  setAutoPlay(false);
                }}
                className={`w-12 h-12 rounded-sm overflow-hidden border transition-all cursor-pointer ${
                  idx === currentIdx
                    ? 'border-[#c5a059] ring-2 ring-[#c5a059]/40 scale-105'
                    : 'border-white/10 opacity-50 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Brass Engraved Plaque - ONLY SHOWS EDITION NAME & HOUSE CODE */}
        <div className="mt-6 mx-auto max-w-md bg-gradient-to-b from-[#18140e] to-[#0c0a07] border-2 border-[#c5a059]/60 p-5 text-center shadow-lg relative">
          <div className="absolute top-2 left-2 w-2 h-2 rounded-full border border-[#c5a059]/60 bg-[#c5a059]/20" />
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full border border-[#c5a059]/60 bg-[#c5a059]/20" />
          <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full border border-[#c5a059]/60 bg-[#c5a059]/20" />
          <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full border border-[#c5a059]/60 bg-[#c5a059]/20" />

          {/* Edition Name */}
          <p className="text-[9px] uppercase font-mono tracking-[0.3em] text-[#c5a059]/70 mb-0.5">
            Edition Name
          </p>
          <h4 className="text-xl sm:text-2xl font-serif text-[#f4ecd8] tracking-[0.15em] uppercase mb-3">
            {artifact.title}
          </h4>

          <div className="w-16 h-[1px] bg-[#c5a059]/40 mx-auto mb-2" />

          {/* House Code */}
          <p className="text-[9px] uppercase font-mono tracking-[0.3em] text-[#c5a059]/70 mb-0.5">
            House Code
          </p>
          <p className="text-sm font-mono tracking-[0.25em] text-[#c5a059] font-bold">
            {houseCode}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ArchivePage;
