import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight, ShieldCheck, Lock, Sparkles, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  onCheckout: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout }) => {
  const { cartItems, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, total, cartLoading } = useCart();
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      showToast("Your vault chamber is unoccupied.");
      return;
    }
    setIsCartOpen(false);
    onCheckout();
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Cinematic Backdrop with Deep Vignette */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md"
          />
          
          {/* High-Security Vault Chamber Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            className="fixed inset-y-0 right-0 z-[130] w-full sm:w-[500px] bg-[#070707] border-l border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-white select-none"
          >
            {/* Ambient Lighting & Vault Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#121212] rounded-full blur-[100px] pointer-events-none" />

            {/* Header: High-Security Vault Seal */}
            <div className="p-6 sm:p-8 border-b border-white/10 bg-[#040404]/95 backdrop-blur-md flex justify-between items-center relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] uppercase font-mono tracking-[0.35em] text-gold-500 font-semibold">
                    Subterranean Allocation Chamber
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Lock size={18} className="text-gold-400" />
                  <h2 className="text-2xl font-serif text-white tracking-[0.12em] uppercase">
                    THE VAULT
                  </h2>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 border border-gold-500/40 bg-gold-500/10 text-gold-300 rounded-full">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)} {cartItems.length === 1 ? 'Piece' : 'Pieces'}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setIsCartOpen(false)} 
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all cursor-pointer"
                aria-label="Seal Vault Chamber"
              >
                <X size={18} />
              </button>

              {/* Loading progress bar */}
              {cartLoading && (
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gold-500/20 overflow-hidden">
                  <div className="w-full h-full bg-gold-500 animate-pulse origin-left" />
                </div>
              )}
            </div>

            {/* Items Stream in Vault */}
            <div className={`flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 relative z-10 custom-scrollbar ${cartLoading ? 'opacity-70 pointer-events-none' : ''} transition-opacity duration-200`}>
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-5">
                  <div className="w-20 h-20 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/20">
                    <Lock size={32} strokeWidth={1} />
                  </div>
                  <div className="max-w-xs space-y-2">
                    <p className="font-serif tracking-[0.15em] text-base text-white/80 uppercase">
                      Chamber Unallocated
                    </p>
                    <p className="text-xs text-white/40 leading-relaxed font-light">
                      No artifacts currently secured in safe-keeping. Explore the current collection to reserve singular creations.
                    </p>
                  </div>
                </div>
              ) : (
                cartItems.map((item, index) => (
                  <motion.div 
                    layout
                    key={`${item.cartItemId || item.id}-${index}`} 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className="relative group bg-gradient-to-r from-[#0d0d0d] via-[#090909] to-[#070707] p-4 rounded-sm border border-white/10 hover:border-gold-500/40 transition-all duration-500 shadow-xl flex gap-4"
                  >
                    {/* Visual Preview */}
                    <div className="w-24 h-32 bg-black shrink-0 overflow-hidden relative rounded-sm border border-white/5">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {item.selectedSize && (
                        <span className="absolute bottom-2 left-2 text-[8px] font-mono uppercase tracking-wider bg-black/80 border border-white/20 px-1.5 py-0.5 text-white/80">
                          {item.selectedSize}
                        </span>
                      )}
                    </div>

                    {/* Specifications & Tactical Counter */}
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[8px] font-mono uppercase tracking-[0.25em] text-gold-500/80 block mb-0.5">
                              Allocation #{String(index + 1).padStart(2, '0')}
                            </span>
                            <h3 className="text-white font-serif tracking-wide text-sm font-medium leading-snug line-clamp-2">
                              {item.title}
                            </h3>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.cartItemId)}
                            className="p-1 text-white/30 hover:text-red-400 transition-colors shrink-0"
                            title="Release from Vault"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        <p className="text-gold-400 font-mono text-xs font-semibold mt-2 tracking-wider">
                          ₹{item.price.toLocaleString('en-IN')}
                        </p>
                      </div>

                      {/* Tactile Dial Quantity Control */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2 bg-black border border-white/10 rounded-sm p-1">
                          <button 
                            onClick={() => updateQuantity(item.cartItemId, -1)}
                            disabled={item.quantity <= 1 || cartLoading}
                            className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white disabled:opacity-25 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="text-xs font-mono font-bold w-6 text-center text-white">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.cartItemId, 1)}
                            disabled={cartLoading || (item.maxStock !== undefined && item.quantity >= item.maxStock)}
                            className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white disabled:opacity-25 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        {item.maxStock !== undefined && item.quantity >= item.maxStock ? (
                          <span className="text-[8px] font-mono uppercase tracking-wider text-amber-400">
                            Atelier Limit
                          </span>
                        ) : (
                          <span className="text-[8px] font-mono uppercase tracking-wider text-emerald-400/80 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-400" /> Allocated
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer: Valuation Summary & Action */}
            <div className="p-6 sm:p-8 border-t border-white/10 bg-[#040404] relative z-10 space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-white/50 font-mono">
                  <span className="uppercase tracking-widest text-[9px]">Transit Protocol</span>
                  <span className="text-emerald-400 uppercase tracking-wider text-[9px]">
                    Complimentary White-Glove
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-white/5">
                  <div>
                    <span className="text-white/50 text-[10px] uppercase font-mono tracking-[0.25em] block">
                      Valuation Total
                    </span>
                    <span className="text-[9px] text-white/30 font-mono">All statutory levies included</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-serif text-white tracking-wider">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Checkout Trigger */}
              <button 
                onClick={handleCheckout}
                disabled={cartItems.length === 0 || cartLoading}
                className="w-full relative group overflow-hidden py-4 px-6 bg-white text-black font-mono text-xs uppercase tracking-[0.25em] font-bold hover:text-white transition-colors duration-500 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Lock size={14} />
                  Initiate Secure Acquisition
                </span>
                <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gold-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[9px] font-mono text-white/40 uppercase tracking-widest pt-1">
                <ShieldCheck size={12} className="text-gold-500/80" />
                <span>Protected Under Deuz & Co. Archival Protocol</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
