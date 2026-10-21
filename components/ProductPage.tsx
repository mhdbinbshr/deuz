
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowLeft, Heart, Filter, ChevronDown, Check, ShieldCheck, RefreshCw, AlertCircle, Crown, Lock, ArrowRight, ShoppingBag, Sparkles, Eye, ArrowUpRight, Compass, Layers, Award } from 'lucide-react';
import ProductShowcase3D from './ProductShowcase3D';
import { CartItem, WishlistItem } from '../types';
import { db } from '../utils/db';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getProductImageSet } from '../utils/productImages';

interface ProductPageProps {
  onBack: () => void;
  onBuyNow: (item: Omit<CartItem, 'quantity'>) => void;
  onToggleWishlist: (item: WishlistItem) => void;
  wishlistItems: WishlistItem[];
}

interface ProductCardProps {
  product: any;
  onClick: () => void;
  itemVariants: any;
  isWishlisted?: boolean;
  onToggleWishlist?: (e: React.MouseEvent) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClick,
  itemVariants,
  isWishlisted,
  onToggleWishlist
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [autoIndex, setAutoIndex] = useState(0);

  // Guarantee paired primary and secondary views for every product
  const imageSet = useMemo(() => {
    return getProductImageSet({
      image: product.image,
      gallery: product.gallery,
      title: product.title,
      houseCode: product.houseCode
    });
  }, [product.image, product.gallery, product.title, product.houseCode]);

  const allImages = imageSet.allImages;

  // Requirement 4: Auto change the product perspective in the Fashion House
  useEffect(() => {
    if (allImages.length <= 1) return;
    // Stagger slightly per product so cards alternate organically across the Fashion House grid
    const seed = typeof product.id === 'number'
      ? product.id
      : (product.id ? String(product.id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : 0);
    const delay = 3500 + (seed % 4) * 600;

    const interval = setInterval(() => {
      setAutoIndex(prev => (prev + 1) % allImages.length);
    }, delay);

    return () => clearInterval(interval);
  }, [allImages.length, product.id]);

  const currentImageIndex = isHovered 
    ? (autoIndex === 0 ? 1 : 0) 
    : autoIndex;
  const activeImage = allImages[currentImageIndex] || imageSet.primary;

  return (
    <motion.div
      layout
      variants={itemVariants}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer flex flex-col"
    >
      <div
        className="w-full aspect-[3/4] overflow-hidden bg-[#0A0A0A] relative mb-5 rounded-none border border-white/10 group-hover:border-gold-400/50 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.6)] group-hover:shadow-[0_25px_60px_rgba(212,175,55,0.12)]"
      >
        {/* Animated Alternate Product Image View with auto-perspective */}
        <AnimatePresence mode="wait">
          <motion.img 
            key={activeImage}
            layoutId={currentImageIndex === 0 ? `product-image-${product.id}` : undefined}
            src={activeImage} 
            alt={product.title} 
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ 
              opacity: product.inStock ? 1 : 0.45,
              scale: isHovered ? 1.04 : 1,
            }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ${!product.inStock ? 'grayscale' : ''}`} 
          />
        </AnimatePresence>

        {/* Dynamic Light Sweep on Image Change */}
        <motion.div
          key={`flare-${currentImageIndex}`}
          initial={{ x: '-100%', opacity: 0.3 }}
          animate={{ x: '200%', opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-300/20 to-transparent skew-x-[-20deg] pointer-events-none z-20"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 group-hover:opacity-75 transition-opacity duration-500 z-20 pointer-events-none" />

        {/* Corner Reticles */}
        <div className="absolute top-2.5 left-2.5 text-gold-400/30 font-mono text-[8px] z-30 pointer-events-none">+</div>
        <div className="absolute top-2.5 right-2.5 text-gold-400/30 font-mono text-[8px] z-30 pointer-events-none">+</div>
        
        {/* Auto Perspective Indicator - Cinematic Obsidian Pill */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-3 z-30 pointer-events-none flex items-center gap-2 px-2.5 py-1 bg-[#060608]/85 border border-white/15 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.85)]">
            <span className="absolute top-0 left-0 w-1 h-1 border-t border-l border-gold-400/70" />
            <span className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-gold-400/70" />
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse shadow-[0_0_6px_#D4AF37]" />
            <span className="text-[7.5px] font-mono tracking-[0.24em] text-white/90 uppercase font-medium">
              {currentImageIndex === 0 ? 'FRONT' : (currentImageIndex === 1 ? 'REVERSE' : 'DETAIL')}
            </span>
          </div>
        )}

        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div className="bg-black/85 px-4 py-2 text-white text-xs uppercase tracking-widest border border-white/20 backdrop-blur-sm">
                Waitlist Only
            </div>
          </div>
        )}
        
        {/* House Tag Badge */}
        {product.imageTag && (
          <div 
            className="absolute top-3.5 left-3.5 bg-gradient-to-r from-[#141109]/90 via-[#0a0906]/90 to-[#141109]/90 border border-gold-400/35 backdrop-blur-xl px-3 py-1.5 z-30 rounded-none pointer-events-none shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
          >
            <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold-400/80" />
            <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold-400/80" />
            <div className="flex items-center gap-1.5">
              <Sparkles size={9} className="text-gold-400 animate-pulse" />
              <span className="text-[8px] uppercase tracking-[0.26em] text-gold-300 font-mono font-semibold">{product.imageTag}</span>
            </div>
          </div>
        )}

        {/* Favourite Quick-Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist?.(e);
          }}
          className={`absolute top-3.5 right-3.5 z-40 w-9 h-9 rounded-none border backdrop-blur-xl flex items-center justify-center transition-all duration-300 cursor-pointer group/fav hover:scale-105 active:scale-95 ${
            isWishlisted
              ? 'bg-gradient-to-b from-rose-950/85 via-red-950/90 to-black border-rose-500/80 text-rose-300 shadow-[0_0_22px_rgba(244,63,94,0.55)]'
              : 'bg-[#070709]/85 border-white/20 text-white/75 hover:text-rose-400 hover:border-gold-400/70 shadow-[0_10px_25px_rgba(0,0,0,0.85)] hover:shadow-[0_0_18px_rgba(212,175,55,0.3)] opacity-90 sm:opacity-0 group-hover:opacity-100'
          }`}
          aria-label="Save to Favourites"
          title={isWishlisted ? "Remove from Favourites" : "Save to Favourites"}
        >
          {/* Subtle Corner Accents */}
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold-400/60" />
          <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-gold-400/60" />
          <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-gold-400/60" />
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold-400/60" />
          <Heart 
            size={15} 
            fill={isWishlisted ? "currentColor" : "none"} 
            strokeWidth={1.8} 
            className={`transition-transform duration-300 ${isWishlisted ? 'scale-110 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]' : 'group-hover/fav:scale-110'}`} 
          />
        </button>

        {product.inStock && (
          <div 
            className="absolute bottom-0 left-0 right-0 px-4 py-3.5 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-[0.22,1,0.36,1] flex justify-between items-center bg-gradient-to-t from-[#050507]/95 via-[#09090c]/90 to-black/60 backdrop-blur-xl z-30 pointer-events-none border-t border-gold-400/35 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]"
          >
            <span className="text-[9px] uppercase tracking-[0.28em] text-gold-200 font-mono font-medium flex items-center gap-2">
              <Eye size={11} className="text-gold-400" />
              Examine Artifact
            </span>
            <ArrowUpRight size={14} className="text-gold-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-1.5 px-1">
        <div className="flex justify-between items-start gap-4">
          <motion.h3 layoutId={`product-title-${product.id}`} className="text-base sm:text-lg font-serif text-white leading-snug group-hover:text-gold-300 transition-colors duration-300 tracking-wide">
            {product.title}
          </motion.h3>
          <motion.span layoutId={`product-price-${product.id}`} className="text-sm text-gold-400 font-mono tracking-wider shrink-0">
            ₹{product.price.toLocaleString('en-IN')}
          </motion.span>
        </div>
        
        <div className="flex items-center justify-between text-[9px] font-mono tracking-[0.2em] uppercase text-white/40 mt-0.5">
          <span>TEES</span>
          {product.houseCode && (
            <span className="text-gold-400/80">[{product.houseCode}]</span>
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
  const [addedToVault, setAddedToVault] = useState(false);
  
  const { addToCart } = useCart();
  const { openAuthModal, user } = useAuth();

  // Subscribe to Real-Time Products on Mount
  useEffect(() => {
    const mapProductList = (data: any[]) => {
      if (!data || data.length === 0) return [];
      return data.map((p: any) => {
        const imgSet = getProductImageSet(p);
        const rawStock = typeof p.countInStock === 'number' ? p.countInStock : 20;
        return {
          id: p._id || p.id,
          _id: p._id || p.id,
          title: p.title,
          price: p.price,
          category: p.category || 'TEES',
          fit: p.fit,
          uniquenessTag: p.uniquenessTag,
          image: imgSet.primary,
          gallery: imgSet.allImages.slice(1),
          description: p.description,
          details: p.details || {},
          inStock: rawStock > 0,
          countInStock: rawStock,
          isArchived: Boolean(p.isArchived),
          sizes: p.sizes && p.sizes.length > 0 ? p.sizes : ['S', 'M', 'L', 'XL', 'XXL'],
          outOfStockSizes: p.outOfStockSizes || [],
          sizeStock: p.sizeStock || {},
          imageTag: p.imageTag,
          houseCode: p.houseCode
        };
      });
    };

    const unsub = db.subscribeProducts((data) => {
      const mapped = mapProductList(data);
      const activeList = mapped.filter((p: any) => !p.isArchived);
      setProducts(activeList);
      setSelectedProduct((prev: any) => {
        if (!prev) return null;
        const updated = activeList.find((p: any) => p.id === prev.id || p.houseCode === prev.houseCode);
        return updated || null;
      });
      setLoading(false);
    });

    return () => {
      try { unsub(); } catch {}
    };
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
  }, [selectedProduct?.id]);

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

  const getEffectiveMaxStock = (product: any, size: string) => {
    if (size && product?.sizeStock && typeof product.sizeStock[size] === 'number') {
      return product.sizeStock[size];
    }
    return typeof product?.countInStock === 'number' ? product.countInStock : 99;
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;
    if (selectedProduct.sizes && selectedProduct.sizes.length > 0 && !selectedSize) {
      setError('Size selection required.');
      return;
    }
    const maxStock = getEffectiveMaxStock(selectedProduct, selectedSize);
    if (maxStock <= 0 || (selectedSize && selectedProduct.outOfStockSizes?.includes(selectedSize))) {
      setError('Selected size is currently out of stock.');
      return;
    }
        
    const added = await addToCart({ 
        ...selectedProduct, 
        selectedSize,
        maxStock
    });
    if (added) {
      setAddedToVault(true);
      setTimeout(() => setAddedToVault(false), 2200);
    } else {
      setError('Maximum allocation reached for this piece.');
    }
  };

  const handleBuyNow = async () => {
    if (!selectedProduct) return;
    if (selectedProduct.sizes && selectedProduct.sizes.length > 0 && !selectedSize) {
      setError('Size selection required.');
      return;
    }
    const maxStock = getEffectiveMaxStock(selectedProduct, selectedSize);
    if (maxStock <= 0 || (selectedSize && selectedProduct.outOfStockSizes?.includes(selectedSize))) {
      setError('Selected size is currently out of stock.');
      return;
    }
        
    await addToCart({ ...selectedProduct, selectedSize, maxStock }, false);
    
    if (!user) {
        openAuthModal();
    }
    onBuyNow({ ...selectedProduct, selectedSize, maxStock });
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
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-3.5 sm:px-8 md:px-10 py-3 sm:py-5 bg-gradient-to-b from-black/90 via-black/60 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <button 
            onClick={() => selectedProduct ? setSelectedProduct(null) : onBack()}
            className="flex items-center gap-2 px-2.5 sm:px-3.5 py-1.5 bg-black/75 border border-white/15 hover:border-gold-400/60 text-white/80 hover:text-white rounded-none backdrop-blur-md transition-all duration-300 group shadow-lg cursor-pointer"
          >
            <ArrowLeft size={13} className="text-gold-400 group-hover:-translate-x-1 transition-transform duration-300 ease-out" />
            <span className="uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[8px] sm:text-[9.5px] font-mono font-medium truncate max-w-[130px] sm:max-w-none">
              {selectedProduct ? 'Back to Collection' : 'Return to Surface'}
            </span>
          </button>
        </div>
        <div className="text-xs sm:text-sm md:text-base font-serif text-white tracking-[0.2em] sm:tracking-[0.3em] uppercase whitespace-nowrap pointer-events-auto">DEUZ & CO</div>
        <div className="w-6 hidden xs:block" /> 
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
            className="min-h-screen min-h-[100dvh] flex flex-col md:flex-row md:h-screen md:h-[100dvh] md:overflow-hidden"
          >
            {/* Left: Cinematic Product Visual Showcase */}
            <div className="w-full md:w-1/2 lg:w-1/2 relative bg-[#060606] flex flex-col items-center justify-center shrink-0 pt-16 sm:pt-18 md:pt-16 pb-3 md:pb-4 md:h-full border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto overflow-x-hidden">
              <ProductShowcase3D
                product={selectedProduct}
                currentImageIndex={currentImageIndex}
                setCurrentImageIndex={setCurrentImageIndex}
              />
            </div>

            {/* Right: Atelier Dossier & Acquisition Controls */}
            <div className="w-full md:w-1/2 lg:w-1/2 flex-1 md:h-full flex flex-col justify-start px-4 sm:px-6 md:px-10 lg:px-14 pt-6 sm:pt-10 md:pt-20 lg:pt-24 pb-16 md:pb-24 bg-[#050505] overflow-y-auto overflow-x-hidden">
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-2xl w-full mx-auto md:mx-0"
              >
                {/* Header: Category & Release Status */}
                <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Compass size={13} className="text-gold-400 animate-spin-slow" />
                    <span className="text-[10px] sm:text-xs font-mono tracking-[0.25em] text-gold-400 uppercase font-semibold">
                      {selectedProduct.category ? selectedProduct.category.toUpperCase() : 'ATELIER'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest">
                    {selectedProduct.inStock ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 sm:px-2.5 py-0.5 border border-emerald-400/25 rounded-none">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_6px_#22c55e]" />
                        Active Allocation
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-red-400 bg-red-400/10 px-2 sm:px-2.5 py-0.5 border border-red-400/25 rounded-none">
                        <AlertCircle size={12} />
                        Vault Closed
                      </span>
                    )}
                  </div>
                </div>

                {/* Artifact House Code & Image Tag */}
                <div className="flex items-center gap-2 mb-3">
                  {selectedProduct.houseCode && (
                    <div className="px-2.5 py-1 bg-white/[0.04] border border-white/15 rounded-none text-[9px] sm:text-[10px] font-mono tracking-[0.2em] text-white/90 uppercase">
                      {selectedProduct.houseCode}
                    </div>
                  )}
                  {selectedProduct.imageTag && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gold-500/10 border border-gold-400/30 rounded-none text-[8.5px] sm:text-[9.5px] font-mono tracking-[0.2em] text-gold-300 uppercase">
                      <Sparkles size={10} className="text-gold-400 animate-pulse" />
                      {selectedProduct.imageTag}
                    </div>
                  )}
                </div>

                {/* Title */}
                <motion.h1 
                  layoutId={`product-title-${selectedProduct.id}`}
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-serif text-white mb-2 leading-tight tracking-[0.06em] uppercase font-light break-words"
                >
                  {selectedProduct.title}
                </motion.h1>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5">
                  <span className="text-[9.5px] sm:text-[11px] text-white/50 uppercase tracking-[0.25em] font-mono">
                    CATEGORY: {selectedProduct.category ? selectedProduct.category.toUpperCase() : 'GARMENT'}
                  </span>
                  <span className="text-white/20 hidden sm:inline">•</span>
                  <span className="text-[9.5px] sm:text-[11px] text-gold-400/80 uppercase tracking-[0.25em] font-mono">
                    CRAFTED AT DEUZ ATELIER
                  </span>
                </div>

                {/* Product Description divided into paragraphs as provided by the admin */}
                <div className="space-y-3.5 mb-6 text-xs sm:text-sm text-white/75 font-light leading-relaxed tracking-wide font-sans">
                  {selectedProduct.description ? (
                    selectedProduct.description
                      .split(/\r?\n+/)
                      .map((para: string) => para.trim())
                      .filter((para: string) => para.length > 0)
                      .map((para: string, idx: number) => (
                        <p key={idx} className="leading-relaxed">
                          {para}
                        </p>
                      ))
                  ) : (
                    <p>A study in structure and restraint. Precision-cut silhouettes designed for enduring presence.</p>
                  )}
                </div>

                {/* Price & Taxation Indicator */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-white/[0.03] to-transparent border border-white/10 rounded-none mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                  <div>
                    <span className="text-[8px] sm:text-[8.5px] font-mono text-white/40 uppercase tracking-[0.28em] block mb-0.5">
                      ACQUISITION VALUE
                    </span>
                    <motion.span 
                      layoutId={`product-price-${selectedProduct.id}`}
                      className="text-xl sm:text-2xl md:text-3xl font-serif text-white tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-gold-200 to-gold-400"
                    >
                      ₹{selectedProduct.price.toLocaleString('en-IN')}
                    </motion.span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[8px] sm:text-[8.5px] text-gold-400/90 uppercase tracking-[0.22em] font-mono block">
                      TAXES INCLUDED (PAN-INDIA)
                    </span>
                    <span className="text-[7.5px] sm:text-[8px] text-white/35 uppercase tracking-widest font-mono">
                      COMPLIMENTARY INSURED EXPRESS FREIGHT
                    </span>
                  </div>
                </div>

                {/* Size Configuration Matrix */}
                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                  <div className="mb-6 sm:mb-8">
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                      <span className="text-[9.5px] sm:text-[10px] uppercase tracking-[0.25em] font-mono text-white/70">
                        SILHOUETTE SIZE SELECTION
                      </span>
                      <span className="text-[8.5px] sm:text-[9px] text-gold-400 uppercase tracking-[0.25em] font-mono px-2 py-0.5 bg-gold-400/10 border border-gold-400/20 rounded-none">
                        {selectedProduct.fit === 'oversized' ? 'Oversized Silhouette' : 'Standard Architectural Drape'}
                      </span>
                    </div>

                    {/* Premium Cinematic Size Matrix */}
                    <div className="grid grid-cols-3 xs:grid-cols-5 sm:grid-cols-6 gap-2 sm:gap-2.5">
                      {selectedProduct.sizes.map((size: string) => {
                        const isSelected = selectedSize === size;
                        return (
                          <button
                            key={size}
                            onClick={() => { setSelectedSize(size); setError(''); }}
                            disabled={!selectedProduct.inStock}
                            className={`
                              h-12 sm:h-13 flex flex-col items-center justify-center text-xs sm:text-sm font-mono uppercase tracking-widest transition-all duration-300 border rounded-none relative overflow-hidden cursor-pointer
                              ${isSelected 
                                ? 'bg-gradient-to-r from-[#DFBA53] via-[#FFE5A3] to-[#B88728] text-black border-amber-200 font-bold shadow-[0_0_24px_rgba(212,175,55,0.45)] scale-[1.02]' 
                                : 'bg-[#0A0A0A]/90 text-white/70 border-white/15 hover:border-gold-400/60 hover:text-white hover:bg-white/[0.04]'
                              }
                              disabled:opacity-25 disabled:cursor-not-allowed
                            `}
                          >
                            <span>{size}</span>
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Selected Size Dimension Tooltip */}
                    <AnimatePresence>
                      {selectedSize && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 text-[9px] sm:text-[9.5px] text-white/60 font-mono uppercase tracking-widest border border-white/10 p-3 bg-white/[0.03] rounded-none flex flex-col gap-1.5"
                        >
                          <div className="flex justify-between items-center text-gold-300">
                            <span>MEASUREMENTS</span>
                          </div>
                          <span className="text-white/80 font-mono text-[8.5px] sm:text-[9px]">
                            {getSizeDetails(selectedProduct.fit, selectedSize)}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {error && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-gold-400 text-xs mt-3 flex items-center gap-2 font-mono">
                        <AlertCircle size={13} className="text-gold-400 shrink-0" />
                        <span className="uppercase tracking-widest text-[8.5px] sm:text-[9px] font-bold">Action Required:</span> {error}
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Primary Acquisition Controls */}
                <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
                  {!selectedProduct.inStock ? (
                    <div className="w-full py-5 sm:py-6 bg-black/60 border border-white/10 rounded-none text-center flex flex-col items-center justify-center gap-2 cursor-not-allowed opacity-75">
                      <Lock size={18} className="text-gold-400" />
                      <span className="text-white/60 text-[9.5px] sm:text-[10px] uppercase tracking-[0.3em] font-mono">
                        ACQUISITION PROTOCOL CLOSED • EXHAUSTED
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-2 sm:gap-4 h-13 sm:h-16">
                      {/* Acquire Button - High Luxury Metallic Gold with Ambient Radiance */}
                      <button 
                        onClick={handleBuyNow}
                        disabled={!selectedProduct.inStock}
                        aria-label="Acquire Now"
                        className="group relative flex-[2] sm:flex-[2.2] overflow-hidden rounded-none bg-gradient-to-r from-[#DFBA53] via-[#FFF2C2] to-[#B88728] px-3 sm:px-8 border border-amber-200/90 shadow-[0_4px_24px_rgba(212,175,55,0.45)] hover:shadow-[0_0_45px_rgba(212,175,55,0.75)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                      >
                        {/* Shimmer light sweep */}
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />
                        
                        {/* Top rim highlight */}
                        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-white/80 pointer-events-none" />

                        <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-3 text-black font-mono">
                          <Sparkles size={15} className="text-black/90 shrink-0 hidden sm:inline-block animate-pulse" />
                          <span className="text-[11px] xs:text-xs sm:text-sm font-black uppercase tracking-[0.16em] xs:tracking-[0.22em] sm:tracking-[0.26em] drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)] whitespace-nowrap">
                            ACQUIRE NOW
                          </span>
                          <ArrowRight size={15} className="text-black stroke-[3] transition-transform duration-300 group-hover:translate-x-1.5 shrink-0" />
                        </span>
                      </button>

                      {/* Add to Vault Button - Obsidian Chamber with Polished Gold Accents */}
                      <button 
                        onClick={handleAddToCart}
                        disabled={!selectedProduct.inStock}
                        aria-label="Add to Vault"
                        className={`group relative flex-[1.2] sm:flex-[1.4] overflow-hidden rounded-none px-2.5 sm:px-6 transition-all duration-300 border-2 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
                          addedToVault
                            ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_28px_rgba(16,185,129,0.4)]'
                            : 'bg-gradient-to-b from-[#141414] via-[#0A0A0A] to-[#040404] border-gold-500/60 hover:border-gold-300 hover:bg-gold-500/10 hover:shadow-[0_0_32px_rgba(212,175,55,0.35)]'
                        }`}
                      >
                        {/* Ambient gold sheen overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-gold-500/0 via-gold-500/20 to-gold-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        
                        {/* Top subtle rim highlight */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gold-400/30 group-hover:bg-gold-300/60 transition-colors pointer-events-none" />

                        <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] xs:text-xs font-mono font-bold uppercase tracking-[0.14em] sm:tracking-[0.22em]">
                          {addedToVault ? (
                            <span className="flex items-center gap-1 text-emerald-300 font-black whitespace-nowrap">
                              <Check size={14} className="stroke-[3]" />
                              IN VAULT
                            </span>
                          ) : (
                            <>
                              <ShoppingBag size={14} className="text-gold-400 group-hover:text-gold-300 transition-transform duration-300 group-hover:scale-110 shrink-0" />
                              <span className="text-white group-hover:text-gold-200 transition-colors font-extrabold">
                                VAULT
                              </span>
                            </>
                          )}
                        </span>
                      </button>

                      {/* Premium & Cinematic Wishlist / Favourite Button */}
                      <motion.button 
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => onToggleWishlist({
                          id: selectedProduct.id,
                          title: selectedProduct.title,
                          price: selectedProduct.price,
                          image: selectedProduct.image,
                          category: selectedProduct.category,
                          houseCode: selectedProduct.houseCode,
                          countInStock: selectedProduct.countInStock
                        })}
                        aria-label="Save to Wishlist"
                        title={isInWishlist(selectedProduct.id) ? "Remove from Favourites" : "Save to Favourites"}
                        className={`group relative flex w-12 xs:w-14 sm:w-16 items-center justify-center rounded-none transition-all duration-500 shrink-0 cursor-pointer overflow-hidden border-2 shadow-2xl ${
                          isInWishlist(selectedProduct.id)
                            ? 'bg-gradient-to-b from-[#2d070d] via-[#1b0307] to-[#0a0103] border-rose-500/80 text-rose-300 shadow-[0_0_35px_rgba(244,63,94,0.5)]' 
                            : 'bg-gradient-to-b from-[#181818] via-[#0d0d0d] to-[#040404] border-gold-500/40 text-white/80 hover:border-gold-300 hover:text-gold-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]'
                        }`}
                      >
                        {/* Gold Atelier Corner Hairlines */}
                        <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 transition-colors ${isInWishlist(selectedProduct.id) ? 'border-rose-400' : 'border-gold-400/70'}`} />
                        <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 transition-colors ${isInWishlist(selectedProduct.id) ? 'border-rose-400' : 'border-gold-400/70'}`} />
                        <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 transition-colors ${isInWishlist(selectedProduct.id) ? 'border-rose-400' : 'border-gold-400/70'}`} />
                        <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 transition-colors ${isInWishlist(selectedProduct.id) ? 'border-rose-400' : 'border-gold-400/70'}`} />

                        {/* Radiant pulsing halo when wishlisted */}
                        {isInWishlist(selectedProduct.id) && (
                          <motion.div 
                            animate={{ scale: [1, 1.4, 1], opacity: [0.35, 0.7, 0.35] }} 
                            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                            className="absolute inset-0 bg-rose-500/25 blur-md pointer-events-none"
                          />
                        )}

                        {/* Light shimmer swipe on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

                        {/* Heart Icon with Micro-Interactions */}
                        <div className="relative z-10 flex items-center justify-center">
                          <Heart 
                            size={19} 
                            fill={isInWishlist(selectedProduct.id) ? "currentColor" : "none"} 
                            strokeWidth={1.8}
                            className={`transition-all duration-300 ${
                              isInWishlist(selectedProduct.id) 
                                ? 'scale-110 text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.9)]' 
                                : 'text-white/70 group-hover:scale-115 group-hover:text-gold-300 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                            }`}
                          />
                          {isInWishlist(selectedProduct.id) && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                            </span>
                          )}
                        </div>
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Technical Specifications Dossier Card */}
                {selectedProduct.details && (
                  <div className="p-4 sm:p-5 bg-white/[0.02] border border-white/10 rounded-sm mb-5 sm:mb-6">
                    <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-white/10 mb-3 sm:mb-4">
                      <div className="flex items-center gap-2">
                        <Layers size={13} className="text-gold-400" />
                        <span className="text-[9.5px] sm:text-[10px] font-mono uppercase tracking-[0.2em] sm:tracking-[0.25em] text-white/90 font-medium">
                          MATERIAL SPECIFICATION MATRIX
                        </span>
                      </div>
                      <span className="text-[7.5px] sm:text-[8px] font-mono text-gold-400/80 px-1.5 py-0.5 bg-gold-400/10 border border-gold-400/20 rounded">
                        SINGULAR RUN
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-3.5">
                      {Object.entries(selectedProduct.details).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <span className="text-gold-400/80 text-[8px] sm:text-[8.5px] uppercase tracking-[0.2em] sm:tracking-[0.25em] font-mono mb-0.5">
                            {key}
                          </span>
                          <span className="text-white text-[11px] sm:text-xs font-sans tracking-wide">
                            {value as string}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Policies & Authenticity Accordion */}
                <div className="border-t border-white/10 pt-2">
                  <button 
                    onClick={() => setShowPolicy(!showPolicy)}
                    className="flex justify-between items-center w-full py-3.5 sm:py-4 text-left group"
                  >
                    <span className="text-[10.5px] sm:text-xs uppercase tracking-[0.18em] sm:tracking-[0.2em] font-mono text-white/80 group-hover:text-gold-400 transition-colors flex items-center gap-2">
                      <Award size={14} className="text-gold-400 shrink-0" />
                      AUTHENTICITY & CONCIERGE PROTOCOLS
                    </span>
                    <ChevronDown size={14} className={`text-white/40 transition-transform duration-500 ${showPolicy ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showPolicy && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }} 
                        transition={{ duration: 0.35 }}
                        className="overflow-hidden"
                      >
                        <div className="pb-5 sm:pb-6 space-y-3.5 sm:space-y-4 text-[11px] sm:text-xs text-white/60 font-light border-t border-white/5 pt-3.5 sm:pt-4">
                          <div className="flex gap-2.5 sm:gap-3">
                            <ShieldCheck className="shrink-0 text-gold-400" size={16} />
                            <div>
                              <strong className="text-white block mb-0.5 font-mono text-[9.5px] sm:text-[10px] uppercase tracking-wider">
                                Guaranteed Atelier Origin
                              </strong>
                              Every piece is authenticated with its distinct house code and registered in the Deuz archive.
                            </div>
                          </div>
                          <div className="flex gap-2.5 sm:gap-3">
                            <RefreshCw className="shrink-0 text-gold-400" size={16} />
                            <div>
                              <strong className="text-white block mb-0.5 font-mono text-[9.5px] sm:text-[10px] uppercase tracking-wider">
                                7-Day Exchange & Vault Protocol
                              </strong>
                              Unworn artifacts with intact security tags qualify for concierge exchange or credit.
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
             className="w-full min-h-screen pt-24 sm:pt-32 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 pb-16 sm:pb-20"
          >
             {/* Header & Controls */}
             <div className="mb-10 sm:mb-16 space-y-6 sm:space-y-8 border-b border-white/10 pb-6 sm:pb-8">
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, delay: 0.2 }}
                 className="text-center flex flex-col items-center"
               >
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-gold-400/20 rounded-full mb-3 backdrop-blur-md">
                   <Sparkles size={11} className="text-gold-400 animate-pulse" />
                   <span className="text-[9px] font-mono tracking-[0.35em] text-gold-300 uppercase">
                     LIMITED ARTIFACT VAULT
                   </span>
                 </div>
                 <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif text-white mb-2 sm:mb-3 tracking-[0.12em] sm:tracking-[0.15em] uppercase">The Collection</h1>
                 <p className="text-white/40 text-[11px] sm:text-sm max-w-md font-mono tracking-widest uppercase">Limited release artifacts. No replication protocol.</p>
                 <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-gold-400/60 to-transparent mt-4" />
               </motion.div>
               
               <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 sm:gap-6 w-full">
                 {/* Mobile Filter Toggle */}
                 <button 
                   onClick={() => setIsFilterOpen(!isFilterOpen)}
                   className="md:hidden flex items-center gap-2 px-3.5 py-2 bg-black/70 border border-gold-400/40 text-[9.5px] font-mono uppercase tracking-[0.2em] text-gold-300 rounded-none cursor-pointer"
                 >
                   <Filter size={12} /> Categories
                 </button>

                 {/* Sort Dropdown */}
                 <div className="relative group z-30">
                    <button className="flex items-center gap-2 px-3.5 py-2 bg-black/70 border border-white/15 hover:border-gold-400/60 text-white/80 hover:text-white transition-all text-[9.5px] font-mono uppercase tracking-[0.2em] rounded-none shadow-md cursor-pointer">
                      <span className="text-white/40">SORT:</span>
                      <span className="text-gold-300 font-medium">{sortOption}</span>
                      <ChevronDown size={12} className="text-gold-400 group-hover:rotate-180 transition-transform duration-300" />
                    </button>
                    <div className="absolute right-0 top-full mt-1.5 w-52 sm:w-60 max-w-[calc(100vw-2rem)] bg-[#0A0A0A]/95 border border-gold-500/25 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.85)] translate-y-1 group-hover:translate-y-0 rounded-none overflow-hidden z-40">
                       {sortOptions.map(opt => (
                         <button 
                           key={opt}
                           onClick={() => setSortOption(opt)}
                           className={`block w-full text-left px-5 py-2.5 text-[9px] font-mono uppercase tracking-[0.2em] transition-all cursor-pointer ${
                             sortOption === opt ? 'bg-gold-500/15 text-gold-300 font-bold border-l-2 border-gold-400' : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                           }`}
                         >
                           {opt}
                         </button>
                       ))}
                    </div>
                 </div>
               </div>
             </div>

             <div className="flex flex-col md:flex-row gap-8 md:gap-10 lg:gap-12 w-full">
                {/* Sidebar Filters */}
                <aside className={`md:w-48 lg:w-56 shrink-0 space-y-6 md:space-y-8 ${isFilterOpen ? 'block bg-white/[0.02] border border-white/10 p-4 md:p-0 md:bg-transparent md:border-0' : 'hidden md:block'}`}>
                   <div>
                     <h3 className="text-gold-500 text-xs font-bold uppercase tracking-widest mb-4 md:mb-6">Categories</h3>
                     <div className="flex flex-wrap md:flex-col gap-2.5 md:gap-4">
                       {categories.map(cat => (
                         <button
                           key={cat}
                           onClick={() => {
                             setFilterCategory(cat);
                             setIsFilterOpen(false);
                           }}
                           className={`text-left text-xs uppercase tracking-widest transition-all duration-300 px-3 py-1.5 md:p-0 border md:border-0 ${
                             filterCategory === cat ? 'text-white border-gold-500 bg-gold-500/10 md:bg-transparent md:pl-4 md:border-l-2 md:border-gold-500' : 'text-white/40 border-white/10 hover:text-white md:hover:pl-2'
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
                  className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-x-6 sm:gap-x-8 gap-y-12 sm:gap-y-16"
                >
                   <AnimatePresence>
                   {filteredProducts.map((product) => (
                     <ProductCard 
                       key={product.id} 
                       product={product} 
                       onClick={() => handleProductSelect(product)} 
                       itemVariants={itemVariants} 
                       isWishlisted={isInWishlist(product.id)}
                       onToggleWishlist={() => onToggleWishlist(product)}
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
