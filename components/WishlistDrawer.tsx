import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Trash2, ArrowRight, ShieldCheck, Sparkles, ShoppingBag } from 'lucide-react';
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
          {/* Cinematic Backdrop with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md"
          />
          
          {/* Cinematic Drawer Chamber */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            className="fixed inset-y-0 right-0 z-[130] w-full sm:w-[480px] bg-[#070707] border-l border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-white select-none"
          >
            {/* Ambient Interior Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gold-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-10 left-0 w-60 h-60 bg-red-950/20 rounded-full blur-[90px] pointer-events-none" />

            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-white/10 bg-[#040404]/90 backdrop-blur-md flex justify-between items-center relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
                  <span className="text-[9px] uppercase font-mono tracking-[0.35em] text-gold-500">
                    Private Curation
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Heart size={18} className="text-gold-400 fill-gold-400/20" />
                  <h2 className="text-xl sm:text-2xl font-serif text-white tracking-[0.1em] uppercase">
                    FAVOURITES
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 border border-white/10 rounded-full text-white/50">
                    {wishlistItems.length}
                  </span>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all cursor-pointer"
                aria-label="Close Favorites"
              >
                <X size={18} />
              </button>
            </div>

            {/* Items Stream */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 relative z-10 custom-scrollbar">
              {wishlistItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-5">
                  <div className="w-20 h-20 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/20">
                    <Heart size={32} strokeWidth={1} />
                  </div>
                  <div className="max-w-xs space-y-2">
                    <p className="font-serif tracking-[0.15em] text-base text-white/80 uppercase">
                      Dossier Unoccupied
                    </p>
                    <p className="text-xs text-white/40 leading-relaxed font-light">
                      Mark pieces with the heart sigil in the collection to reserve them within your private curation gallery.
                    </p>
                  </div>
                </div>
              ) : (
                wishlistItems.map((item, index) => (
                  <motion.div 
                    layout
                    key={item.id} 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="relative group bg-gradient-to-r from-[#0c0c0c] to-[#080808] p-4 rounded-sm border border-white/10 hover:border-gold-500/40 transition-all duration-500 shadow-lg flex gap-4"
                  >
                    {/* Visual Preview */}
                    <div className="w-24 h-32 bg-black shrink-0 overflow-hidden relative rounded-sm border border-white/5">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>

                    {/* Details & Actions */}
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[8px] font-mono uppercase tracking-[0.25em] text-gold-500/80 block mb-0.5">
                              Artifact #{String(index + 1).padStart(2, '0')}
                            </span>
                            <h3 className="text-white font-serif tracking-wide text-sm font-medium leading-snug line-clamp-2">
                              {item.title}
                            </h3>
                          </div>
                          <button 
                            onClick={() => onRemoveItem(item.id)}
                            className="p-1 text-white/30 hover:text-red-400 transition-colors shrink-0"
                            title="Remove from favorites"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-gold-400 font-mono text-xs font-semibold mt-2 tracking-wider">
                          ₹{item.price.toLocaleString('en-IN')}
                        </p>
                      </div>

                      {/* Transfer to Vault Button */}
                      <button 
                        onClick={() => onMoveToCart(item)}
                        className="mt-3 w-full py-2.5 px-3 bg-white/5 hover:bg-gold-500 hover:text-black border border-white/10 hover:border-gold-500 text-white transition-all duration-300 text-[9px] uppercase font-mono tracking-[0.2em] font-bold flex items-center justify-center gap-2 group/btn rounded-sm"
                      >
                        <ShoppingBag size={12} className="group-hover/btn:scale-110 transition-transform" />
                        <span>Transfer to Vault</span>
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {wishlistItems.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-[#040404] relative z-10 flex items-center justify-between text-xs">
                <span className="text-white/40 uppercase tracking-widest text-[9px] font-mono">
                  All pieces subject to limited atelier run
                </span>
                <button
                  onClick={() => {
                    wishlistItems.forEach(item => onMoveToCart(item));
                  }}
                  className="text-gold-400 hover:text-white uppercase tracking-wider text-[10px] font-mono underline transition-colors"
                >
                  Transfer All to Vault
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WishlistDrawer;
