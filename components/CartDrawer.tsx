import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight, Check } from 'lucide-react';
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
        showToast("Your collection is empty.");
        return;
    }
    setIsCartOpen(false);
    onCheckout();
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
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
            <div className="p-4 md:p-8 border-b border-white/10 flex justify-between items-center bg-[#050505] relative">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} className="text-gold-500" />
                <h2 className="text-xl font-serif text-white tracking-widest">THE VAULT</h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <X size={24} />
              </button>
              {cartLoading && (
                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gold-500/20 overflow-hidden">
                      <div className="w-full h-full bg-gold-500 animate-pulse origin-left"></div>
                  </div>
              )}
            </div>

            {/* Items */}
            <div className={`flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-8 ${cartLoading ? 'opacity-70 pointer-events-none' : ''} transition-opacity duration-200`}>
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4 text-center">
                  <ShoppingBag size={48} strokeWidth={1} />
                  <div>
                    <p className="font-serif tracking-widest text-sm mb-2">No pieces selected.</p>
                    <p className="text-[10px] uppercase tracking-widest opacity-60">Curate your selection to proceed.</p>
                  </div>
                </div>
              ) : (
                cartItems.map((item, index) => (
                  <motion.div 
                    layout
                    key={`${item.cartItemId || item.id}-${index}`} 
                    className="flex gap-4 bg-white/5 p-4 rounded-sm border border-white/5 relative group"
                  >
                    <div className="w-20 h-24 bg-black shrink-0 overflow-hidden relative">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-80" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-white font-serif tracking-wider text-sm">{item.title}</h3>
                          <button 
                            onClick={() => removeFromCart(item.cartItemId)}
                            className="text-white/30 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-gold-500 text-xs">₹{item.price.toLocaleString('en-IN')}</p>
                          {item.selectedSize && <span className="text-[10px] text-white/50 border border-white/20 px-1">{item.selectedSize}</span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                           <div className="flex items-center gap-3 bg-black border border-white/10 px-2 py-1">
                             <button 
                               onClick={() => updateQuantity(item.cartItemId, -1)}
                               disabled={item.quantity <= 1 || cartLoading}
                               className="text-white/50 hover:text-white disabled:opacity-30 transition-colors"
                             >
                               <Minus size={12} />
                             </button>
                             <span className="text-xs w-4 text-center">{item.quantity}</span>
                             <button 
                               onClick={() => updateQuantity(item.cartItemId, 1)}
                               disabled={cartLoading || (item.maxStock !== undefined && item.quantity >= item.maxStock)}
                               className="text-white/50 hover:text-white disabled:opacity-30 transition-colors"
                             >
                               <Plus size={12} />
                             </button>
                           </div>
                           {item.maxStock !== undefined && item.quantity > item.maxStock && (
                             <span className="text-[9px] text-red-500 uppercase tracking-wider font-bold">Exceeds Stock ({item.maxStock} max)</span>
                           )}
                           {item.maxStock !== undefined && item.quantity === item.maxStock && (
                             <span className="text-[9px] text-red-500 uppercase tracking-wider">Max Stock: {item.maxStock}</span>
                           )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 md:p-8 border-t border-white/10 bg-[#050505]">
              <div className="flex justify-between items-center mb-6">
                <span className="text-white/60 text-xs uppercase tracking-widest">ESTIMATED VALUE</span>
                <span className="text-2xl font-serif text-white">₹{total.toLocaleString('en-IN')}</span>
              </div>
              
              {cartItems.some(item => item.maxStock !== undefined && item.quantity > item.maxStock) && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] uppercase tracking-widest text-center">
                  Some items exceed available stock. Please reduce quantities.
                </div>
              )}
              
              <button 
                onClick={handleCheckout}
                disabled={cartItems.length === 0 || cartLoading || cartItems.some(item => item.maxStock !== undefined && item.quantity > item.maxStock)}
                className="w-full py-4 bg-white text-black hover:bg-gold-500 hover:text-white disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black transition-all duration-300 font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 group"
              >
                {cartLoading ? (
                    <motion.span 
                        animate={{ opacity: [0.5, 1, 0.5] }} 
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        Updating...
                    </motion.span>
                ) : (
                    <>
                        REQUEST PRIVATE ACQUISITION 
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Toast Notification */}
          {toast.visible && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-white text-black px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest shadow-2xl flex items-center gap-2"
            >
              <Check size={14} />
              {toast.message}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;