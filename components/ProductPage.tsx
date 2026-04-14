
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Filter, ChevronDown, Check, ShieldCheck, RefreshCw, AlertCircle, Crown, Lock, ArrowRight, ShoppingBag } from 'lucide-react';
import { CartItem, WishlistItem } from '../types';
import { db } from '../utils/db';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface ProductPageProps {
  onBack: () => void;
  onBuyNow: (item: Omit<CartItem, 'quantity'>) => void;
  onToggleWishlist: (item: WishlistItem) => void;
  wishlistItems: WishlistItem[];
}

const ProductCard = ({ product, onClick, itemVariants }: { product: any, onClick: () => void, itemVariants: any }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const allImages = useMemo(() => {
    return product.gallery?.length > 0 
      ? [product.image, ...product.gallery] 
      : [product.image];
  }, [product.image, product.gallery]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (allImages.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % allImages.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [allImages.length]);

  return (
    <motion.div
      layout
      variants={itemVariants}
      onClick={onClick}
      className="group cursor-pointer flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -10 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <div className="w-full aspect-[3/4] overflow-hidden bg-[#0A0A0A] relative mb-6 rounded-sm">
        {allImages.map((img: string, idx: number) => (
          <motion.img 
            key={idx}
            layoutId={idx === 0 ? `product-image-${product.id}` : undefined}
            src={img} 
            alt={product.title} 
            initial={idx === 0 ? { scale: 1.1, filter: 'blur(5px)' } : { opacity: 0 }}
            animate={{ 
                scale: currentImageIndex === idx ? 1 : 1.05, 
                filter: 'blur(0px)',
                opacity: currentImageIndex === idx ? 1 : 0,
                zIndex: currentImageIndex === idx ? 10 : 0
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${product.inStock ? 'opacity-80 group-hover:opacity-100' : 'opacity-40 grayscale'}`} 
          />
        ))}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-20 pointer-events-none" />
        
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div className="bg-black/80 px-4 py-2 text-white text-xs uppercase tracking-widest border border-white/20 backdrop-blur-sm">
                Waitlist Only
            </div>
          </div>
        )}
        
        {/* Small Badge on Grid Card */}
        {product.imageTag && (
            <div className="absolute top-4 left-4 bg-black/40 border border-white/10 backdrop-blur-md px-3 py-1.5 z-30 rounded-sm pointer-events-none">
                <div className="flex items-center gap-1">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-white font-medium">{product.imageTag}</span>
                </div>
            </div>
        )}

        {product.inStock && (
        <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.22,1,0.36,1] flex justify-between items-center bg-gradient-to-t from-black/80 via-black/40 to-transparent z-30 pointer-events-none">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white font-medium">View Artifact</span>
        </div>
        )}
      </div>
      
      <div className="flex flex-col gap-2 px-1">
        <div className="flex justify-between items-start gap-4">
            <motion.h3 layoutId={`product-title-${product.id}`} className="text-lg font-serif text-white leading-tight group-hover:text-gold-500 transition-colors duration-300">{product.title}</motion.h3>
            <motion.span layoutId={`product-price-${product.id}`} className="text-sm text-white/60 font-mono">₹{product.price.toLocaleString('en-IN')}</motion.span>
        </div>
        
        <div className="flex flex-col gap-1 mt-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">{product.category}</span>
            {product.houseCode && (
                <span className="text-[10px] uppercase tracking-[0.2em] text-gold-500/70">House Code: {product.houseCode}</span>
            )}
        </div>
      </div>
    </motion.div>
  );
};

const ProductPage: React.FC<ProductPageProps> = ({ 
  onBack, 
  onBuyNow,
  onToggleWishlist,
  wishlistItems
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [filterCategory, setFilterCategory] = useState('All');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedProduct && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedProduct]);
  const [sortOption, setSortOption] = useState('Featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [showPolicy, setShowPolicy] = useState(false);
  const [error, setError] = useState('');
  
  const { addToCart } = useCart();
  const { openAuthModal, user } = useAuth();

  // Fetch Products on Mount
  useEffect(() => {
    const fetchProducts = async () => {
        try {
            // Fix: Cast to any[] because mock db returns Promise<never>
            const data = await db.getProducts() as any[];
            if (data && data.length > 0) {
                // Map Backend Model to Frontend UI
                const mapped = data.map((p: any) => ({
                    id: p._id,
                    title: p.title,
                    price: p.price,
                    category: p.category,
                    image: p.image,
                    gallery: p.gallery || [],
                    description: p.description,
                    details: p.details || {},
                    inStock: p.countInStock > 0,
                    countInStock: p.countInStock,
                    isArchived: p.isArchived, // Add archived state
                    // Enforce Alpha sizing fallback if not present, though DB should now provide it
                    sizes: p.sizes && p.sizes.length > 0 ? p.sizes : ['S', 'M', 'L', 'XL', 'XXL'],
                    outOfStockSizes: p.outOfStockSizes || [],
                    sizeStock: p.sizeStock || {},
                    imageTag: p.imageTag,
                    houseCode: p.houseCode
                }));
                // Filter out archived products for the public store
                setProducts(mapped.filter((p: any) => !p.isArchived));
            } else {
                setProducts([]);
            }
        } catch (e) {
            console.error(e);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };
    fetchProducts();
  }, []);

  // Auto-rotate gallery images
  useEffect(() => {
    if (selectedProduct) {
      setCurrentImageIndex(0);
      const allImages = selectedProduct.gallery?.length > 0 
        ? [selectedProduct.image, ...selectedProduct.gallery] 
        : [selectedProduct.image];
        
      if (allImages.length > 1) {
        const interval = setInterval(() => {
          setCurrentImageIndex(prev => (prev + 1) % allImages.length);
        }, 4000);
        return () => clearInterval(interval);
      }
    }
  }, [selectedProduct]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category)))], [products]);
  
  const sortOptions = [
    'Featured', 
    'Latest Arrivals', 
    'Price: Low to High', 
    'Price: High to Low',
    'Name: A-Z',
    'Name: Z-A'
  ];

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (filterCategory !== 'All') {
      result = result.filter(p => p.category === filterCategory);
    }

    switch (sortOption) {
      case 'Price: Low to High':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'Price: High to Low':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'Latest Arrivals':
        result.reverse();
        break;
      case 'Name: A-Z':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'Name: Z-A':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'Featured':
      default:
        break;
    }

    return result;
  }, [products, filterCategory, sortOption]);

  const isInWishlist = (id: string | number) => wishlistItems.some(i => i.id === id);

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setSelectedSize('');
    setError('');
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;
    if (selectedProduct.sizes && selectedProduct.sizes.length > 0 && !selectedSize) {
      setError('Size selection required.');
      return;
    }
    const maxStock = selectedSize && selectedProduct.sizeStock && typeof selectedProduct.sizeStock[selectedSize] === 'number' 
        ? selectedProduct.sizeStock[selectedSize] 
        : selectedProduct.countInStock;
        
    await addToCart({ 
        ...selectedProduct, 
        selectedSize,
        maxStock
    });
  };

  const handleBuyNow = async () => {
    if (!selectedProduct) return;
    if (selectedProduct.sizes && selectedProduct.sizes.length > 0 && !selectedSize) {
      setError('Size selection required.');
      return;
    }
    const maxStock = selectedSize && selectedProduct.sizeStock && typeof selectedProduct.sizeStock[selectedSize] === 'number' 
        ? selectedProduct.sizeStock[selectedSize] 
        : selectedProduct.countInStock;
        
    const success = await addToCart({ ...selectedProduct, selectedSize, maxStock }, false);
    
    if (success) {
        if (!user) {
            openAuthModal();
        } else {
            onBuyNow({ ...selectedProduct, selectedSize, maxStock });
        }
    }
  };

  const getSizeDetails = (fit: 'oversized' | 'regular' | undefined, size: string) => {
    if (!size) return null;
    const isOversized = fit === 'oversized';
    
    if (isOversized) {
      switch (size) {
        case 'XS': return 'Chest : 40" | Length : 25.5" | Shoulder : 19" | Sleeve : 8.5"';
        case 'S': return 'Chest : 42" | Length : 26.5" | Shoulder : 20" | Sleeve : 9"';
        case 'M': return 'Chest : 44" | Length : 27.5" | Shoulder : 21" | Sleeve : 9.5"';
        case 'L': return 'Chest : 46" | Length : 28" | Shoulder : 22" | Sleeve : 10"';
        case 'XL': return 'Chest : 48" | Length : 29.5" | Shoulder : 23" | Sleeve : 10.5"';
        case 'XXL': return 'Chest : 50" | Length : 30.5" | Shoulder : 24" | Sleeve : 11.5"';
        default: return null;
      }
    } else {
      switch (size) {
        case 'XS': return 'Chest : 36" | Length : 25" | Shoulder : 15" | Sleeve Length : 6.5" | Sleeve Open : 6"';
        case 'S': return 'Chest : 38" | Length : 26" | Shoulder : 16" | Sleeve Length : 7" | Sleeve Open : 6.25"';
        case 'M': return 'Chest : 40" | Length : 27" | Shoulder : 17" | Sleeve Length : 7.5" | Sleeve Open : 6.5"';
        case 'L': return 'Chest : 42" | Length : 28" | Shoulder : 18" | Sleeve Length : 8" | Sleeve Open : 6.75"';
        case 'XL': return 'Chest : 44" | Length : 29" | Shoulder : 18.5" | Sleeve Length : 8.5" | Sleeve Open : 7"';
        case 'XXL': return 'Chest : 46" | Length : 30" | Shoulder : 18.75" | Sleeve Length : 9" | Sleeve Open : 7.25"';
        default: return null;
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    exit: { opacity: 0 }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 20 } },
    exit: { opacity: 0, y: -20 }
  };

  if (loading) {
     return <div className="fixed inset-0 z-50 bg-[#050505] flex items-center justify-center text-white">Loading Collection...</div>;
  }

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="fixed inset-0 z-50 bg-[#050505] overflow-y-auto overflow-x-hidden"
    >
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-6 md:p-10 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <button 
            onClick={() => selectedProduct ? setSelectedProduct(null) : onBack()}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-300 ease-out" />
            <span className="uppercase tracking-[0.2em] text-[9px] md:text-[10px] font-medium">
              {selectedProduct ? 'Back to Collection' : 'Return to Surface'}
            </span>
          </button>
        </div>
        <div className="text-sm md:text-base font-serif text-white tracking-[0.3em] pointer-events-auto">DEUZ & CO</div>
        <div className="w-6" /> 
      </nav>

      <AnimatePresence mode="wait">
        {selectedProduct ? (
          // --- PRODUCT DETAIL VIEW ---
          <motion.div
            key="detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-screen flex flex-col md:flex-row md:h-screen md:overflow-hidden"
          >
            {/* Left: Product Visuals */}
            <div className="w-full md:w-1/2 lg:w-5/12 relative bg-[#080808] flex items-center justify-center overflow-hidden shrink-0 py-12 md:py-0 md:h-full">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold-900/10 via-black to-black opacity-50" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="absolute w-[800px] h-[800px] border border-white/5 rounded-full"
              />
              
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                className="relative z-10 w-3/4 sm:w-2/3 md:w-80 lg:w-96 aspect-[3/4] group perspective-[1000px] overflow-hidden rounded-sm shadow-[0_30px_60px_rgba(0,0,0,0.9)]"
              >
                 {(() => {
                   const allImages = selectedProduct.gallery?.length > 0 
                     ? [selectedProduct.image, ...selectedProduct.gallery] 
                     : [selectedProduct.image];
                   
                   return (
                     <>
                       {allImages.map((img: string, idx: number) => (
                         <motion.img 
                           key={idx}
                           src={img} 
                           alt={`${selectedProduct.title} - Image ${idx + 1}`}
                           layoutId={idx === 0 ? `product-image-${selectedProduct.id}` : undefined}
                           initial={idx === 0 ? { scale: 1.1, filter: 'blur(10px)' } : { opacity: 0 }}
                           animate={{ 
                             scale: currentImageIndex === idx ? 1 : 1.05, 
                             filter: 'blur(0px)',
                             opacity: currentImageIndex === idx ? 1 : 0,
                             zIndex: currentImageIndex === idx ? 10 : 0
                           }}
                           transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                           className={`absolute inset-0 w-full h-full object-cover ${!selectedProduct.inStock ? 'grayscale contrast-125' : ''}`}
                         />
                       ))}
                       
                       {allImages.length > 1 && (
                         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                           {allImages.map((_: any, idx: number) => (
                             <button
                               key={idx}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setCurrentImageIndex(idx);
                               }}
                               className={`h-1.5 rounded-full transition-all duration-500 ${currentImageIndex === idx ? 'w-6 bg-gold-500' : 'w-1.5 bg-white/30 hover:bg-white/60'}`}
                             />
                           ))}
                         </div>
                       )}
                     </>
                   );
                 })()}
                 <div className="absolute -bottom-12 left-0 right-0 h-32 bg-gradient-to-t from-black via-transparent to-transparent z-20 pointer-events-none" />
                 
                 {/* Visual Badge for Exhausted */}
                 {!selectedProduct.inStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="border border-white/20 p-6 text-center bg-black/80">
                            <Lock size={32} className="text-white/40 mx-auto mb-2" />
                            <p className="text-white font-serif tracking-widest text-lg">EXHAUSTED</p>
                            <p className="text-white/40 text-[9px] uppercase tracking-[0.3em] mt-1">WAITLIST ONLY</p>
                        </div>
                    </div>
                 )}
              </motion.div>
            </div>

            {/* Right: Details */}
            <div className="w-full md:w-1/2 lg:w-7/12 flex-1 md:h-full flex flex-col justify-start px-6 md:px-12 lg:px-16 pt-8 md:pt-32 pb-12 md:pb-24 bg-[#050505] overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-2xl w-full"
              >
                 {/* --- HEADER: Release Status ONLY (Type of Wear Removed) --- */}
                <div className="flex items-center justify-end mb-8 border-b border-white/5 pb-6">
                  <div className="text-right">
                    <span className="text-[9px] text-white/40 uppercase tracking-widest block mb-1">Release Status</span>
                    <div className={`flex items-center justify-end gap-2 text-xs uppercase tracking-widest ${selectedProduct.inStock ? 'text-green-500' : 'text-red-500'}`}>
                      {selectedProduct.inStock ? (
                         <>
                           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]" />
                           <span>Active</span>
                         </>
                      ) : (
                         <>
                           <AlertCircle size={14} />
                           <span>Exhausted</span>
                         </>
                      )}
                    </div>
                  </div>
                </div>

                {selectedProduct.imageTag && (
                  <div className="inline-flex items-center gap-2 border border-gold-500/50 px-3 py-1 mb-4 bg-gold-500/10">
                    <span className="text-[9px] text-gold-500 uppercase tracking-[0.2em] font-bold">
                      {selectedProduct.imageTag}
                    </span>
                  </div>
                )}

                <motion.h1 
                  layoutId={`product-title-${selectedProduct.id}`}
                  className="text-3xl md:text-5xl font-serif text-white mb-3 leading-tight"
                >
                  {selectedProduct.title}
                </motion.h1>

                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[9px] text-white/30 uppercase tracking-[0.3em] font-mono">
                    {selectedProduct.category}
                  </span>
                  {selectedProduct.houseCode && (
                    <>
                      <span className="text-white/20">•</span>
                      <span className="text-[9px] text-gold-500/70 uppercase tracking-[0.3em] font-mono">
                        House Code: {selectedProduct.houseCode}
                      </span>
                    </>
                  )}
                </div>

                <p className="text-sm text-white/50 font-light leading-relaxed mb-8">
                  {selectedProduct.description}
                </p>

                <div className="flex items-end gap-4 mb-8">
                   <motion.span 
                    layoutId={`product-price-${selectedProduct.id}`}
                    className="text-2xl font-serif text-white"
                   >
                     ₹{selectedProduct.price.toLocaleString('en-IN')}
                   </motion.span>
                   <span className="text-[9px] text-white/40 mb-1.5 uppercase tracking-[0.2em]">INR (Inclusive of all taxes)</span>
                </div>

                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && selectedProduct.category !== 'card' && (
                  <div className="mb-10">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs uppercase tracking-widest text-white/40">Select Configuration</span>
                      <span className="text-[10px] text-gold-500 uppercase tracking-widest">{selectedProduct.fit === 'oversized' ? 'Oversized Fit' : 'Standard Fit'}</span>
                    </div>
                    {/* Premium Size Selector - 5 Cols for S, M, L, XL, XXL */}
                    <div className="grid grid-cols-5 gap-2">
                      {selectedProduct.sizes.map((size: string) => {
                        const isSizeOutOfStock = selectedProduct.outOfStockSizes?.includes(size);
                        return (
                          <button
                            key={size}
                            onClick={() => { setSelectedSize(size); setError(''); }}
                            disabled={!selectedProduct.inStock || isSizeOutOfStock}
                            className={`
                              h-12 flex items-center justify-center text-xs font-medium uppercase tracking-widest transition-all duration-300 border
                              ${selectedSize === size 
                                ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                                : 'bg-transparent text-white/40 border-white/10 hover:border-white/40 hover:text-white'
                              }
                              disabled:opacity-20 disabled:cursor-not-allowed relative overflow-hidden
                            `}
                          >
                            {size}
                            {isSizeOutOfStock && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-[1px] bg-red-500/50 rotate-45 absolute" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    <AnimatePresence>
                      {selectedSize && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 text-[10px] text-white/50 font-mono uppercase tracking-widest border border-white/5 p-3 bg-white/5 flex flex-col gap-2"
                        >
                          <div className="flex justify-between items-center">
                              <span>{getSizeDetails(selectedProduct.fit, selectedSize)}</span>
                              {selectedProduct.sizeStock && typeof selectedProduct.sizeStock[selectedSize] === 'number' && (
                                  <span className="text-gold-500 font-bold">
                                      {selectedProduct.sizeStock[selectedSize]} IN STOCK
                                  </span>
                              )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {error && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-gold-500 text-xs mt-3 flex items-center gap-2">
                            <AlertCircle size={12} />
                            <span className="uppercase tracking-wide text-[10px] font-bold">Action Required:</span> {error}
                        </motion.div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-4 mb-8">
                  {!selectedProduct.inStock ? (
                      <div className="w-full py-6 bg-white/5 border border-white/10 text-center flex flex-col items-center justify-center gap-2 cursor-not-allowed opacity-70">
                          <Lock size={16} className="text-white/40" />
                          <span className="text-white/40 text-[10px] uppercase tracking-[0.3em]">Acquisition Closed</span>
                      </div>
                  ) : (
                      <div className="flex gap-4 h-14">
                        {/* Acquire Button */}
                        <button 
                          onClick={handleBuyNow}
                          disabled={!selectedProduct.inStock}
                          className="group relative flex-[2] overflow-hidden bg-white px-8 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <div className="absolute inset-0 bg-gold-500 translate-y-full transition-transform duration-500 ease-[0.22,1,0.36,1] group-hover:translate-y-0" />
                          <span className="relative z-10 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-black transition-colors">
                            Acquire
                            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                          </span>
                        </button>

                        {/* Add to Vault Button */}
                        <button 
                          onClick={handleAddToCart}
                          disabled={!selectedProduct.inStock}
                          className="group relative flex-1 overflow-hidden border border-white/20 bg-transparent px-6 transition-all duration-500 hover:border-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <div className="absolute inset-0 bg-white translate-y-full transition-transform duration-500 ease-[0.22,1,0.36,1] group-hover:translate-y-0" />
                          <span className="relative z-10 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors group-hover:text-black">
                            <ShoppingBag size={14} className="mb-0.5" />
                            Vault
                          </span>
                        </button>

                        {/* Wishlist Button */}
                        <button 
                          onClick={() => onToggleWishlist(selectedProduct)}
                          className={`group relative flex w-14 items-center justify-center border transition-all duration-500 ${
                            isInWishlist(selectedProduct.id)
                              ? 'border-red-500 bg-red-500/10 text-red-500' 
                              : 'border-white/20 bg-transparent text-white hover:border-white'
                          }`}
                        >
                          <Heart 
                            size={20} 
                            fill={isInWishlist(selectedProduct.id) ? "currentColor" : "none"} 
                            strokeWidth={1.5}
                            className={`transition-transform duration-300 ${isInWishlist(selectedProduct.id) ? 'scale-110' : 'group-hover:scale-110'}`}
                          />
                        </button>
                      </div>
                  )}
                </div>

                <div className="border-t border-white/10 pt-4">
                  <button 
                    onClick={() => setShowPolicy(!showPolicy)}
                    className="flex justify-between items-center w-full py-4 text-left group"
                  >
                    <span className="text-xs uppercase tracking-widest text-white/80 group-hover:text-gold-500 transition-colors">Policies & Warranty</span>
                    <ChevronDown size={16} className={`text-white/40 transition-transform duration-500 ${showPolicy ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showPolicy && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="pb-6 space-y-4 text-sm text-white/50 font-light">
                          <div className="flex gap-3">
                            <ShieldCheck className="shrink-0 text-gold-500" size={18} />
                            <div>
                              <strong className="text-white block mb-1">Authenticity Guaranteed</strong>
                              Every item is verified by our master curators.
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <RefreshCw className="shrink-0 text-gold-500" size={18} />
                            <div>
                              <strong className="text-white block mb-1">7-Day Return Policy</strong>
                              Easy returns on unworn items with tags attached.
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {selectedProduct.details && (
                    <div className="border-t border-white/10 pt-6 mt-4">
                       <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                          {Object.entries(selectedProduct.details).map(([key, value]) => (
                            <div key={key}>
                               <h4 className="text-gold-500 text-[10px] uppercase tracking-widest mb-1 opacity-70">{key}</h4>
                               <p className="text-white text-sm font-serif">{value as string}</p>
                            </div>
                          ))}
                       </div>
                    </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        ) : (
          // --- STORE COLLECTION GRID VIEW ---
          <motion.div
             key="grid"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
             className="min-h-screen pt-32 px-6 md:px-12 max-w-7xl mx-auto pb-20"
          >
             {/* Header & Controls */}
             <div className="mb-16 space-y-8 border-b border-white/10 pb-8">
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, delay: 0.2 }}
                 className="text-center flex flex-col items-center"
               >
                 <h1 className="text-4xl md:text-6xl font-serif text-white mb-4">The Collection</h1>
                 <p className="text-white/40 text-sm max-w-md">Limited release artifacts. No replication protocol.</p>
               </motion.div>
               
               <div className="flex flex-col md:flex-row justify-center md:justify-end gap-6 w-full">
                 {/* Sort Dropdown */}
                 <div className="relative group z-30">
                    <button className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/70 hover:text-white transition-colors">
                      Sort: {sortOption} <ChevronDown size={14} />
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#0A0A0A] border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto shadow-2xl translate-y-2 group-hover:translate-y-0">
                       {sortOptions.map(opt => (
                         <button 
                           key={opt}
                           onClick={() => setSortOption(opt)}
                           className={`block w-full text-left px-6 py-3 text-xs uppercase tracking-widest transition-colors ${
                             sortOption === opt ? 'bg-white/10 text-gold-500' : 'text-white/50 hover:bg-white/5 hover:text-white'
                           }`}
                         >
                           {opt}
                         </button>
                       ))}
                    </div>
                 </div>

                 {/* Mobile Filter Toggle */}
                 <button 
                   onClick={() => setIsFilterOpen(!isFilterOpen)}
                   className="md:hidden flex items-center gap-2 text-xs uppercase tracking-widest text-gold-500"
                 >
                   <Filter size={14} /> Filters
                 </button>
               </div>
             </div>

             <div className="flex flex-col md:flex-row gap-12">
                {/* Sidebar Filters */}
                <aside className={`md:w-64 space-y-8 ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
                   <div>
                     <h3 className="text-gold-500 text-xs font-bold uppercase tracking-widest mb-6">Categories</h3>
                     <div className="space-y-4">
                       {categories.map(cat => (
                         <button
                           key={cat}
                           onClick={() => setFilterCategory(cat)}
                           className={`block text-xs uppercase tracking-widest transition-all duration-300 ${
                             filterCategory === cat ? 'text-white pl-4 border-l-2 border-gold-500' : 'text-white/40 hover:text-white hover:pl-2'
                           }`}
                         >
                           {cat}
                         </button>
                       ))}
                     </div>
                   </div>
                </aside>

                {/* Product Grid */}
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16"
                >
                   <AnimatePresence>
                   {filteredProducts.map((product) => (
                     <ProductCard 
                       key={product.id} 
                       product={product} 
                       onClick={() => handleProductSelect(product)} 
                       itemVariants={itemVariants} 
                     />
                   ))}
                   </AnimatePresence>
                </motion.div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductPage;
