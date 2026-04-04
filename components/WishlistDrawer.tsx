import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Trash2, ShoppingBag } from 'lucide-react';
import { WishlistItem } from '../types';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistItems: WishlistItem[];
  onRemoveItem: (id: string | number) => void;
  onMoveToCart: (item: WishlistItem) => void;
}

const WishlistDrawer: React.FC<WishlistDrawerProps> = ({ 
  isOpen, 
  onClose, 
  wishlistItems, 
  onRemoveItem,
  onMoveToCart
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[70] w-full md:w-[450px] bg-[#0A0A0A] border-l border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-[#050505]">
              <div className="flex items-center gap-3">
                <Heart size={20} className="text-red-500 fill-red-500" />
                <h2 className="text-xl font-serif text-white tracking-widest">FAVOURITES</h2>
              </div>
              <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {wishlistItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
                  <Heart size={48} strokeWidth={1} />
                  <p className="font-serif tracking-widest text-sm">YOUR WISHLIST IS EMPTY</p>
                </div>
              ) : (
                wishlistItems.map((item) => (
                  <motion.div 
                    layout
                    key={item.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex gap-4 bg-white/5 p-4 rounded-sm border border-white/5 group"
                  >
                    <div className="w-20 h-24 bg-black shrink-0 overflow-hidden relative">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-80" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <h3 className="text-white font-serif tracking-wider text-sm">{item.title}</h3>
                        <button 
                          onClick={() => onRemoveItem(item.id)}
                          className="text-white/30 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-gold-500 text-xs mt-1">₹{item.price.toFixed(2)}</p>

                      <button 
                        onClick={() => onMoveToCart(item)}
                        className="mt-4 flex items-center justify-center gap-2 py-2 bg-white/10 hover:bg-gold-500 hover:text-black transition-colors text-[10px] uppercase tracking-widest font-bold"
                      >
                        <ShoppingBag size={12} />
                        Move to Cart
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WishlistDrawer;