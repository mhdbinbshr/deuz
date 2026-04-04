import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, MotionValue } from 'framer-motion';
import { ArrowLeft, Lock, Crown, Calendar, Eye, MapPin, Hash } from 'lucide-react';
import { db } from '../utils/db';

interface ArchivePageProps {
  onBack: () => void;
}

const ArchivePage: React.FC<ArchivePageProps> = ({ onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Global mouse spotlight effect for the background
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
            // Safety check for array
            const safeProducts = Array.isArray(allProducts) ? allProducts : [];
            const archived = safeProducts.filter((p: any) => p.isArchived || p.countInStock === 0);
            
            // Populate with premium mock data if archive is sparse to showcase the UI
            if (archived.length < 8) {
                setItems([
                    ...archived,
                    {
                        _id: 'mock-1',
                        title: 'Obsidian Monolith',
                        image: 'https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?q=80&w=1000&auto=format&fit=crop',
                        category: 'Artifact',
                        year: '2023',
                        owner: 'Private Collection',
                        location: 'Paris, FR'
                    },
                    {
                        _id: 'mock-2',
                        title: 'Aether Veil',
                        image: 'https://images.unsplash.com/photo-1490481651871-32d2e76f897d?q=80&w=1000&auto=format&fit=crop',
                        category: 'Haute Couture',
                        year: '2024',
                        owner: 'Anonymous',
                        location: 'Tokyo, JP'
                    },
                    {
                        _id: 'mock-3',
                        title: 'Chronos Dial',
                        image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=1000&auto=format&fit=crop',
                        category: 'Timepiece',
                        year: '2022',
                        owner: 'The Crown',
                        location: 'London, UK'
                    },
                    {
                        _id: 'mock-4',
                        title: 'Solaris Drape',
                        image: 'https://images.unsplash.com/photo-1550614000-4b9519e02a29?q=80&w=1000&auto=format&fit=crop',
                        category: 'Textile',
                        year: '2025',
                        owner: 'Auction Winner',
                        location: 'Dubai, UAE'
                    },
                    {
                        _id: 'mock-5',
                        title: 'Nebula Shard',
                        image: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=1000&auto=format&fit=crop',
                        category: 'Relic',
                        year: '2021',
                        owner: 'Royal Archives',
                        location: 'Kyoto, JP'
                    },
                    {
                        _id: 'mock-6',
                        title: 'Void Walker',
                        image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=1000&auto=format&fit=crop',
                        category: 'Footwear',
                        year: '2025',
                        owner: 'Private Collector',
                        location: 'New York, US'
                    },
                    {
                        _id: 'mock-7',
                        title: 'Eclipse Core',
                        image: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=1000&auto=format&fit=crop',
                        category: 'Sculpture',
                        year: '2022',
                        owner: 'The Foundation',
                        location: 'Berlin, DE'
                    },
                    {
                        _id: 'mock-8',
                        title: 'Argent Visor',
                        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=1000&auto=format&fit=crop',
                        category: 'Accessory',
                        year: '2023',
                        owner: 'Studio Vault',
                        location: 'Milan, IT'
                    }
                ]);
            } else {
                setItems(archived);
            }
        } catch (e) {
            console.error(e);
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
      className="fixed inset-0 z-[100] bg-[#010101] overflow-y-auto overflow-x-hidden perspective-[2000px] cursor-default"
      ref={containerRef}
    >
      {/* Cinematic Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-8 md:p-12 flex justify-between items-center pointer-events-none mix-blend-difference">
        <div className="pointer-events-auto">
            <button 
                onClick={onBack}
                className="flex items-center gap-4 group"
            >
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:border-white transition-all duration-700 ease-[0.16,1,0.3,1]">
                    <ArrowLeft size={16} className="text-white group-hover:text-black transition-colors" />
                </div>
                <div>
                    <span className="block text-[9px] uppercase tracking-[0.3em] text-white/40 group-hover:text-white transition-colors">Return to Surface</span>
                    <span className="block text-xs font-serif text-white tracking-widest mt-1">THE ARCHIVE</span>
                </div>
            </button>
        </div>
        <div className="text-right hidden md:block">
            <div className="text-white/20 font-serif text-sm tracking-[0.3em]">EST. 2026</div>
            <div className="text-[9px] text-white/10 uppercase tracking-widest mt-1">Vault Security: Active</div>
        </div>
      </nav>

      {/* Dynamic Background Spotlight */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div
            className="absolute w-[800px] h-[800px] bg-gradient-to-r from-gold-900/5 via-purple-900/5 to-transparent rounded-full blur-[120px] opacity-30"
            style={{
                x: useSpring(mouseX, { stiffness: 20, damping: 40 }),
                y: useSpring(mouseY, { stiffness: 20, damping: 40 }),
                translateX: '-50%',
                translateY: '-50%'
            }}
        />
        {/* Film Grain Texture */}
        <div 
            className="absolute inset-0 opacity-[0.07] pointer-events-none mix-blend-overlay"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }} 
        />
      </div>

      {/* Hero / Entrance */}
      <section className="h-[70vh] flex flex-col items-center justify-center relative z-10 px-6">
         <motion.div
            initial={{ opacity: 0, y: 100, filter: 'blur(20px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
         >
            <div className="inline-flex items-center gap-3 mb-8 border-b border-white/10 pb-4 px-8">
                <Lock size={12} className="text-gold-500" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-white/60">Restricted Access • Level 0</span>
            </div>
            <h1 className="text-6xl md:text-9xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/10 tracking-[0.1em] mb-8 drop-shadow-2xl uppercase">
                The House Archive
            </h1>
            <p className="text-white/30 text-xs md:text-sm max-w-md mx-auto font-light leading-loose tracking-widest font-mono">
                Every design at DEUZ & CO is singular.<br/>
                Once acquired, it exits commerce permanently.
            </p>
         </motion.div>
      </section>

      {/* The Gallery */}
      <section className="relative z-10 px-6 md:px-12 pb-40">
         <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-x-32 gap-y-64">
            {items.map((item, index) => (
                <Archive3DDisplay 
                    key={item._id || index} 
                    item={item} 
                    index={index} 
                    containerRef={containerRef}
                />
            ))}
         </div>
      </section>

      <footer className="relative z-10 py-24 text-center border-t border-white/5 bg-gradient-to-b from-transparent to-black">
         <Crown size={24} className="mx-auto text-white/20 mb-6" />
         <p className="text-white/20 text-xs uppercase tracking-[0.4em]">Deuz & Co. Archives</p>
      </footer>
    </motion.div>
  );
};

// --- 3D Interactive Component ---

const Archive3DDisplay: React.FC<{ item: any; index: number; containerRef: React.RefObject<HTMLDivElement> }> = ({ item, index, containerRef }) => {
    const ref = useRef<HTMLDivElement>(null);
    
    // Smooth Mouse Physics
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    const mouseXSpring = useSpring(x, { stiffness: 100, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 100, damping: 20 });

    // Transform map: range of mouse pixel movement -> range of rotation degrees
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);
    
    // Dynamic Lighting map: glare moves opposite to rotation
    const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
    const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

    // Scroll Parallax - Critical: Pass containerRef to track scroll in the overlay
    const { scrollYProgress } = useScroll({
        target: ref,
        container: containerRef,
        offset: ["start end", "end start"]
    });
    
    // Parallax Y movement with staggered effect
    const parallaxY = useTransform(scrollYProgress, [0, 1], [index % 2 === 0 ? 50 : 120, index % 2 === 0 ? -50 : -120]);
    const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.95, 1, 1, 0.95]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        
        const rect = ref.current.getBoundingClientRect();
        
        // Calculate normalized mouse position from center (-0.5 to 0.5)
        const width = rect.width;
        const height = rect.height;
        
        const mouseXRel = e.clientX - rect.left;
        const mouseYRel = e.clientY - rect.top;
        
        const xPct = (mouseXRel / width) - 0.5;
        const yPct = (mouseYRel / height) - 0.5;
        
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div 
            ref={ref}
            style={{ y: parallaxY, opacity, scale }}
            className={`relative group ${index % 2 !== 0 ? 'lg:mt-32' : ''}`}
        >
            {/* The 3D Container */}
            <motion.div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                }}
                className="relative w-full aspect-[4/5] md:aspect-[3/4] cursor-none perspective-1000"
            >
                {/* -- LAYER 1: The Artifact Frame -- */}
                <div 
                    className="absolute inset-0 bg-[#080808] rounded-sm border border-white/5 shadow-[0_30px_80px_rgba(0,0,0,0.8)] overflow-hidden"
                    style={{ transform: "translateZ(0px)" }}
                >
                    {/* Background Texture */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')] opacity-5" />
                    
                    {/* Image with Vintage Filter */}
                    <motion.img 
                        src={item.image} 
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale contrast-[1.15] sepia-[0.3] brightness-90 group-hover:grayscale-0 group-hover:sepia-0 group-hover:opacity-100 group-hover:contrast-100 group-hover:brightness-100 group-hover:scale-105 transition-all duration-[1.5s] ease-[0.16,1,0.3,1]"
                    />
                    
                    {/* Dark Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-[#020202]/40 opacity-80" />

                    {/* -- Dynamic Specular Highlight (The Glare) -- */}
                    <motion.div 
                        style={{ 
                            background: useTransform(
                                [glareX, glareY],
                                ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.08) 0%, transparent 50%)`
                            )
                        }}
                        className="absolute inset-0 pointer-events-none mix-blend-soft-light z-20"
                    />
                </div>

                {/* -- LAYER 2: The Plaque (Redesigned - Premium) -- */}
                <motion.div 
                    style={{ transform: "translateZ(30px)" }}
                    className="absolute bottom-8 left-8 right-8 pointer-events-none z-30"
                >
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 relative overflow-hidden group-hover:bg-black/60 transition-colors duration-700">
                        {/* Decorative Corner Lines */}
                        <div className="absolute top-0 left-0 w-2 h-[1px] bg-white/30" />
                        <div className="absolute top-0 left-0 h-2 w-[1px] bg-white/30" />
                        <div className="absolute bottom-0 right-0 w-2 h-[1px] bg-white/30" />
                        <div className="absolute bottom-0 right-0 h-2 w-[1px] bg-white/30" />

                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-xl md:text-2xl font-serif text-white tracking-wide mix-blend-screen leading-none">{item.title}</h3>
                                <p className="text-[9px] text-white/30 font-serif italic mt-1">{item.category || 'Archive Item'}</p>
                            </div>
                            
                            {/* Premium Product Code Display */}
                            <div className="flex flex-col items-end pl-8 border-l border-white/10 relative">
                                <div className="absolute -left-[1px] top-0 h-4 w-[1px] bg-gold-500" /> {/* Gold accent on border */}
                                
                                <span className="text-[8px] font-serif text-gold-500 tracking-[0.3em] uppercase mb-1 opacity-80">Reference</span>
                                
                                <div className="flex items-baseline gap-2 font-mono relative z-10">
                                    <span className="text-lg text-white/20 font-light">ARC</span>
                                    <span className="text-2xl md:text-3xl text-white tracking-[0.2em] font-light shadow-black drop-shadow-lg">
                                        {String(index + 1).padStart(3, '0')}
                                    </span>
                                </div>
                                
                                {/* Decorative Micro-elements */}
                                <div className="flex items-center gap-1 mt-2 opacity-40">
                                    <div className="w-1 h-1 bg-white rounded-full" />
                                    <div className="w-8 h-[1px] bg-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </motion.div>
        </motion.div>
    );
};

export default ArchivePage;