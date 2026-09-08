import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, MousePointer2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { db, INITIAL_PRODUCTS } from '../utils/db';
import { Product } from '../types';

interface FashionStoreProps {
  onEnterStore: () => void;
}

const FashionStore: React.FC<FashionStoreProps> = ({ onEnterStore }) => {
  const containerRef = useRef<HTMLElement>(null);
  const [isWalkingIn, setIsWalkingIn] = useState(false);
  const { content } = useSettings();
  
  // Initialize with initial apparel products from database seeds
  const initialApparel = INITIAL_PRODUCTS.filter(p => p.category !== 'card' && (p as any).category !== 'Cards') as unknown as Product[];
  const [products, setProducts] = useState<Product[]>(initialApparel);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch live products from DB
  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      try {
        const fetchedProducts = await db.getProducts();
        const availableProducts = fetchedProducts.filter(p => !p.isArchived && p.category !== 'card' && p.category !== 'Cards' && (p as any).productType !== 'CARD');
        if (availableProducts.length > 0 && isMounted) {
          setProducts(availableProducts);
        }
      } catch (error) {
        console.error("Error fetching products for FashionStore:", error);
      }
    };
    fetchProducts();
    return () => { isMounted = false; };
  }, []);

  // Determine the featured latest drop decided by Admin or automatic newest
  const chosenProduct = React.useMemo(() => {
    if (products.length === 0) return null;

    // 1. If admin explicitly selected a product ID in site settings:
    if (content.latestDropProductId && content.latestDropProductId !== 'auto') {
      const matched = products.find(p => p._id === content.latestDropProductId || p.id === content.latestDropProductId);
      if (matched) return matched;
    }

    // 2. Otherwise (auto mode or match not found), select the latest drop:
    // Sort by createdAt descending if present, or take the first in catalog
    const sorted = [...products].sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });

    return sorted[0] || products[0];
  }, [products, content.latestDropProductId]);

  // Priority: Custom admin overrides from settings -> Chosen product fields -> House defaults
  const displayTitle = content.latestDropTitle || chosenProduct?.title || "DEUZ FORM 01 — SOVEREIGN";
  const displayImage = content.latestDropImage || chosenProduct?.image || (content.storeImage || "https://ik.imagekit.io/dto1zguat/Evolve_1.jpg");
  // Fixed forever as requested
  const displayDesc = "A study in structure and restraint. Precision-cut silhouettes designed for enduring presence.";
  const displayCategory = content.latestDropCategory || (chosenProduct ? chosenProduct.category : (content.sovereignCategory || "APPAREL"));
  const displayPrice = content.latestDropPrice || (chosenProduct ? `₹${chosenProduct.price.toLocaleString('en-IN')}` : (content.sovereignPrice || "₹12,000"));

  const isProductActive = content.latestDropStatus 
    ? (content.latestDropStatus.toLowerCase() !== 'exhausted')
    : (chosenProduct ? chosenProduct.countInStock > 0 : (content.sovereignStatus?.toLowerCase() !== 'exhausted'));

  const displayStatus = content.latestDropStatus || (isProductActive ? "Active" : "Exhausted");

  // Parallax on scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 40, damping: 20 });
  const yPos = useTransform(smoothProgress, [0, 1], [50, 0]);
  const atmosphereOpacity = useTransform(smoothProgress, [0.1, 0.8], [0, 1]);

  const handleEnterClick = () => {
    setIsWalkingIn(true);
    setTimeout(() => {
      onEnterStore();
      setIsWalkingIn(false);
    }, 350);
  };

  return (
    <section 
      ref={containerRef} 
      id="collection-section"
      className="relative h-[105vh] bg-transparent flex flex-col items-center overflow-hidden select-none"
    >
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-blue-900/5 via-transparent to-gold-900/5 z-0" />

      <div className="sticky top-0 h-screen w-full flex items-center justify-center perspective-[1200px] overflow-hidden">
        {/* Atmosphere light beams */}
        <motion.div 
          style={{ opacity: isWalkingIn ? 0 : atmosphereOpacity }}
          animate={isWalkingIn ? { opacity: 0 } : {}}
          transition={{ duration: 1 }}
          className="absolute inset-0 pointer-events-none z-10"
        >
          <div className="absolute top-[-20%] left-[20%] w-[200px] h-[150vh] bg-gradient-to-b from-white/5 to-transparent rotate-[15deg] blur-[30px]" />
          <div className="absolute top-[-20%] left-[40%] w-[100px] h-[150vh] bg-gradient-to-b from-white/3 to-transparent rotate-[15deg] blur-[20px]" />
        </motion.div>

        {/* Center 3D Stage with z-depth animation */}
        <motion.div
          initial={false}
          animate={isWalkingIn ? { z: 1000, opacity: 0 } : {}}
          transition={{ duration: 2.5, ease: [0.65, 0, 0.35, 1] }}
          style={{ y: isWalkingIn ? 0 : yPos, transformStyle: "preserve-3d" }}
          className="relative w-full max-w-5xl h-[70vh] flex items-center justify-center"
        >
          {/* Main Center Garment Image Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative w-[320px] md:w-[400px] aspect-[3/4] bg-[#050505] rounded-sm overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 group"
          >
            <AnimatePresence mode="wait">
              <motion.img 
                key={displayImage}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 0.85, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                src={displayImage}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s]"
                alt="Collection Preview"
              />
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 pointer-events-none" />

            {/* Bottom text & progress bar inside Card */}
            <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8 right-6 sm:right-8 pointer-events-none z-20">
              <div className="mb-3 sm:mb-4">
                <p className="text-white/60 text-[11px] sm:text-xs font-light leading-relaxed line-clamp-2">
                  {displayDesc}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="h-[2px] w-full bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ x: "-100%" }}
                    whileInView={{ x: "0%" }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="h-full bg-gold-500 w-2/3"
                  />
                </div>
                <div className="text-center text-[8px] font-mono text-white/30 tracking-[0.2em]">
                  www.deuzandco.com
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating Properties Box on right */}
          <motion.div 
            initial={{ opacity: 0, y: 70 }}
            whileInView={{ opacity: 1, y: 50 }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
            className="absolute right-4 md:right-auto md:left-[50%] md:ml-[100px] w-48 md:w-64 bg-black/80 backdrop-blur-md border border-white/10 rounded-sm p-4 md:p-6 z-20 shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
              <span className="text-[9px] uppercase tracking-widest text-gold-500 font-mono font-medium">
                PROPERTIES
              </span>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              </div>
            </div>

            <div className="space-y-3 font-mono text-[10px] text-white/60">
              <div className="flex justify-between items-center gap-2">
                <span>Drop</span>
                <span className="text-gold-400 uppercase font-medium truncate max-w-[120px]" title={displayTitle}>
                  {displayTitle.replace(/^DEUZ FORM \d+\s*[—–-]\s*/i, '')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Category</span>
                <span className="text-white uppercase font-medium">
                  {displayCategory}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Price</span>
                <span className="text-white font-medium">
                  {displayPrice}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className={isProductActive ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                  {displayStatus}
                </span>
              </div>
            </div>

            {/* You Pointer indicator */}
            <motion.div 
              animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-8 -left-8 flex items-center gap-2 pointer-events-none"
            >
              <MousePointer2 size={16} className="text-green-500 fill-green-500 -rotate-90" />
              <span className="bg-green-500 text-[9px] text-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-bold">
                You
              </span>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Centered EXPLORE COLLECTION I button */}
        <AnimatePresence>
          {!isWalkingIn && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100, transition: { duration: 0.5 } }}
              className="absolute bottom-12 md:bottom-24 z-50 flex flex-col items-center gap-6 w-full px-4"
            >
              <div className="w-full max-w-[800px] h-32 bg-gradient-to-t from-black via-black/80 to-transparent absolute -top-20 pointer-events-none" />
              <motion.button 
                onClick={handleEnterClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-6 py-4 md:px-12 md:py-5 overflow-hidden bg-white/5 border border-white/10 backdrop-blur-md rounded-none hover:border-gold-500/50 transition-all duration-500 shadow-[0_20px_40px_rgba(0,0,0,0.4)] w-full max-w-sm md:max-w-md"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gold-600/20 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 ease-out" />
                <div className="relative flex flex-col items-center gap-1">
                  <div className="flex items-center justify-center gap-3 w-full">
                    <span className="text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] text-white font-medium group-hover:text-gold-200 transition-colors text-center font-mono">
                      EXPLORE COLLECTION I
                    </span>
                    <ArrowUpRight size={16} className="text-gold-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300 flex-shrink-0" />
                  </div>
                  <div className="w-full h-[1px] bg-white/20 mt-1 group-hover:bg-gold-500 transition-colors duration-500 scale-x-0 group-hover:scale-x-100 origin-left" />
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Walk-in screen transition */}
        {isWalkingIn && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="absolute inset-0 pointer-events-none z-[100] bg-black"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 }}
              className="absolute inset-0 flex items-center justify-center px-4"
            >
              <h1 className="text-2xl sm:text-4xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-600 tracking-[0.2em] sm:tracking-[0.5em] text-center">
                DEUZ & CO
              </h1>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default FashionStore;
