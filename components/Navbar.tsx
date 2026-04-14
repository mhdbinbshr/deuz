
import React, { useState } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, Heart, ChevronDown, User, LogOut, LayoutDashboard, Package } from 'lucide-react';
import { NavLink } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ROUTES } from '../constants/routes';

interface NavbarProps {
  onOpenWishlist: () => void;
  onOpenFashionStore: () => void;
  onOpenCardStore: () => void;
  onOpenAdmin?: () => void;
  onOpenMyOrders?: () => void;
  onOpenArchive: () => void;
  onOpenContact: () => void;
}

const links: NavLink[] = [
  { name: 'Home', href: ROUTES.HOME },
  { name: 'Maison', href: ROUTES.ABOUT },
  { name: 'Store', href: '#' },
  { name: 'Archive', href: '#' },
  { name: 'Contact', href: '#' },
];

const Navbar: React.FC<NavbarProps> = ({ 
  onOpenWishlist, 
  onOpenFashionStore,
  onOpenCardStore,
  onOpenAdmin,
  onOpenMyOrders,
  onOpenArchive,
  onOpenContact
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [mobileStoreExpanded, setMobileStoreExpanded] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeHover, setActiveHover] = useState<string | null>(null);

  const { user, openAuthModal, logout } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const handleStoreNavigation = (type: 'fashion' | 'card') => {
    setMobileMenuOpen(false);
    setIsStoreOpen(false);
    if (type === 'fashion') onOpenFashionStore();
    if (type === 'card') onOpenCardStore();
  };

  const handleNavLinkClick = (e: React.MouseEvent, name: string) => {
      if (name === 'Archive') {
          e.preventDefault();
          setMobileMenuOpen(false);
          onOpenArchive();
      } else if (name === 'Contact') {
          e.preventDefault();
          setMobileMenuOpen(false);
          onOpenContact();
      }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isScrolled 
            ? 'bg-black/40 backdrop-blur-2xl border-b border-white/[0.03] py-4' 
            : 'bg-transparent py-8'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-8 md:px-12 flex items-center justify-between">
          
          {/* Logo Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex items-center gap-4 z-50"
          >
            <a href="#" className="group flex flex-col items-start">
              <span className="text-xl md:text-2xl font-serif text-white tracking-[0.2em] group-hover:text-gold-400 transition-colors duration-500">
                DEUZ & CO
              </span>
            </a>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2" onMouseLeave={() => setActiveHover(null)}>
            <div className="flex items-center space-x-12">
              {links.map((link, i) => {
                if (link.name === 'Store') {
                   return (
                    <div 
                      key="store-dropdown"
                      className="relative h-full flex items-center"
                      onMouseEnter={() => setIsStoreOpen(true)}
                      onMouseLeave={() => setIsStoreOpen(false)}
                    >
                      <button className="group relative flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-medium text-white/60 hover:text-white transition-all duration-300 py-4">
                        Store
                        <span className={`w-1 h-1 rounded-full bg-gold-500 transition-opacity duration-300 ${isStoreOpen ? 'opacity-100' : 'opacity-0'}`} />
                      </button>

                      <AnimatePresence>
                        {isStoreOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 15, filter: "blur(10px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: 10, filter: "blur(5px)" }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute top-full left-1/2 -translate-x-1/2 w-64 bg-[#050505]/80 border border-white/5 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col py-3 rounded-sm overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                            <button 
                              onClick={() => handleStoreNavigation('fashion')}
                              className="relative text-left px-6 py-4 text-[10px] uppercase tracking-[0.25em] text-white/60 hover:text-white hover:bg-white/[0.02] transition-all duration-300 group"
                            >
                              <span className="relative z-10 flex justify-between items-center">
                                Fashion House
                                <ArrowIcon className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300 text-gold-500" />
                              </span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                   );
                }
                
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleNavLinkClick(e, link.name)}
                    onMouseEnter={() => setActiveHover(link.name)}
                    className="relative text-[10px] uppercase tracking-[0.3em] font-medium text-white/60 hover:text-white transition-colors duration-500 py-2"
                  >
                    {link.name}
                    <motion.div
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold-500 rounded-full"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: activeHover === link.name ? 1 : 0, scale: activeHover === link.name ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </a>
                );
              })}
            </div>
          </div>
            
          {/* Right Actions */}
          <div className="flex items-center gap-8 md:gap-10">
            {/* User Profile */}
            <div 
              className="relative"
              onMouseEnter={() => setIsUserMenuOpen(true)}
              onMouseLeave={() => setIsUserMenuOpen(false)}
            >
              {user ? (
                 <div 
                   className="relative group cursor-pointer"
                   onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                 >
                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-[10px] uppercase tracking-widest hidden lg:block">{user.fullName.split(' ')[0]}</span>
                      <User size={18} strokeWidth={1} className="text-white" />
                    </div>
                    
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          exit={{ opacity: 0, y: 10, filter: "blur(5px)" }}
                          className="absolute top-full right-0 mt-4 w-56 max-w-[calc(100vw-2rem)] bg-[#050505]/95 border border-white/10 backdrop-blur-3xl shadow-2xl rounded-sm overflow-hidden z-50 origin-top-right"
                        >
                          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                            <p className="text-white text-xs font-serif tracking-wider">{user.fullName}</p>
                            <p className="text-white/30 text-[9px] uppercase tracking-widest mt-1 truncate">{user.email}</p>
                          </div>
                          
                          {/* My Orders Link */}
                          {onOpenMyOrders && (
                             <button 
                               onClick={() => {
                                 setIsUserMenuOpen(false);
                                 onOpenMyOrders();
                               }}
                               className="w-full text-left px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-white/70 hover:text-gold-500 hover:bg-white/[0.02] transition-all flex items-center gap-3 border-b border-white/5"
                             >
                               <Package size={12} /> My Dossiers
                             </button>
                          )}

                          {/* Wishlist Link */}
                          {onOpenWishlist && (
                             <button 
                               onClick={() => {
                                 setIsUserMenuOpen(false);
                                 onOpenWishlist();
                               }}
                               className="w-full text-left px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-white/70 hover:text-red-500 hover:bg-white/[0.02] transition-all flex items-center gap-3 border-b border-white/5"
                             >
                               <Heart size={12} /> Wishlist
                             </button>
                          )}

                          {/* Admin Link */}
                          {user.role === 'admin' && onOpenAdmin && (
                             <button 
                               onClick={() => {
                                 setIsUserMenuOpen(false);
                                 onOpenAdmin();
                               }}
                               className="w-full text-left px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-white/70 hover:text-gold-500 hover:bg-white/[0.02] transition-all flex items-center gap-3 border-b border-white/5"
                             >
                               <LayoutDashboard size={12} /> Dashboard
                             </button>
                          )}

                          <button 
                            onClick={logout}
                            className="w-full text-left px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-white/50 hover:text-red-400 hover:bg-white/[0.02] transition-all flex items-center gap-3"
                          >
                            <LogOut size={12} /> Sign Out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
              ) : (
                <button
                   onClick={openAuthModal}
                   className="text-[10px] uppercase tracking-[0.25em] text-white/60 hover:text-gold-400 transition-colors duration-300"
                >
                   Login
                </button>
              )}
            </div>

            {/* Wishlist */}
            <button
               onClick={onOpenWishlist}
               className="relative text-white/60 hover:text-red-500 transition-colors duration-300 group"
            >
               <Heart size={18} strokeWidth={1} className="group-hover:fill-red-500/20 transition-all duration-300" />
            </button>

            {/* Cart */}
            <button
               onClick={() => setIsCartOpen(true)}
               className="relative text-white/60 hover:text-gold-400 transition-colors duration-300 group"
            >
               <ShoppingBag size={18} strokeWidth={1} />
               <AnimatePresence>
                 {cartCount > 0 && (
                   <motion.span
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     exit={{ scale: 0 }}
                     className="absolute -top-2 -right-2 w-3.5 h-3.5 bg-gold-500 text-black text-[9px] font-bold flex items-center justify-center rounded-full"
                   >
                     {cartCount}
                   </motion.span>
                 )}
               </AnimatePresence>
            </button>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-white/80 hover:text-gold-400 transition-colors"
            >
              <Menu size={24} strokeWidth={1} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 bg-[#020202]/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-between items-start p-8 w-full">
                {user ? (
                   <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-gold-500 text-[9px] uppercase tracking-[0.3em]">Authenticated</p>
                        {user.role === 'admin' && <span className="text-[9px] bg-gold-500/20 text-gold-500 px-1 rounded">ADMIN</span>}
                      </div>
                      <p className="text-white font-serif text-xl tracking-wide">{user.fullName}</p>
                      
                      <div className="flex flex-col items-start gap-2 mt-3">
                        {onOpenMyOrders && (
                          <button 
                            onClick={() => { onOpenMyOrders(); setMobileMenuOpen(false); }} 
                            className="text-white/70 text-[10px] uppercase tracking-widest hover:text-gold-500 flex items-center gap-2"
                          >
                             <Package size={12} /> My Dossiers
                          </button>
                        )}
                        {user.role === 'admin' && onOpenAdmin && (
                          <button 
                            onClick={() => { onOpenAdmin(); setMobileMenuOpen(false); }} 
                            className="text-white/70 text-[10px] uppercase tracking-widest hover:text-gold-500 flex items-center gap-2"
                          >
                             <LayoutDashboard size={12} /> Dashboard
                          </button>
                        )}
                        <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-white/30 text-[10px] uppercase tracking-widest hover:text-white border-b border-white/10 pb-1">Sign Out</button>
                      </div>
                   </div>
                ) : (
                   <button 
                    onClick={() => { openAuthModal(); setMobileMenuOpen(false); }}
                    className="text-[10px] uppercase tracking-[0.3em] text-white/60 hover:text-white border border-white/10 px-6 py-3 rounded-sm"
                   >
                     Login / Join
                   </button>
                )}
                
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white/40 hover:text-white transition-colors ml-4 shrink-0"
                >
                  <X size={32} strokeWidth={1} />
                </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-sm px-6 mx-auto pb-20">
              <div className="flex flex-col space-y-8 w-full">
              {links.map((link, i) => {
                 if (link.name === 'Store') {
                   return (
                     <motion.div
                       key="mobile-store"
                       initial={{ opacity: 0, y: 30 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: 0.1 + (i * 0.1), ease: "easeOut" }}
                     >
                       <button 
                          onClick={() => setMobileStoreExpanded(!mobileStoreExpanded)}
                          className="flex items-center justify-center gap-2 text-4xl font-serif text-white hover:text-gold-500 transition-colors tracking-wide w-full group"
                       >
                          <span className="relative">
                            Store
                            <span className="block h-[1px] w-0 group-hover:w-full bg-gold-500 transition-all duration-500 absolute bottom-0 left-0" />
                          </span>
                          <ChevronDown size={20} className={`text-white/30 transition-transform duration-500 ${mobileStoreExpanded ? 'rotate-180' : ''}`} />
                       </button>
                       
                       <AnimatePresence>
                         {mobileStoreExpanded && (
                           <motion.div
                             initial={{ height: 0, opacity: 0 }}
                             animate={{ height: 'auto', opacity: 1 }}
                             exit={{ height: 0, opacity: 0 }}
                             className="overflow-hidden flex flex-col gap-0 mt-6 border-l border-white/10 ml-[50%] -translate-x-1/2"
                           >
                              <button 
                                onClick={() => handleStoreNavigation('fashion')}
                                className="py-4 pl-6 text-xs uppercase tracking-[0.3em] text-white/50 hover:text-white transition-colors text-left"
                              >
                                Fashion House
                              </button>
                           </motion.div>
                         )}
                       </AnimatePresence>
                     </motion.div>
                   );
                 }
                 
                 return (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleNavLinkClick(e, link.name)}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + (i * 0.1), ease: "easeOut" }}
                    className="text-4xl font-serif text-white hover:text-gold-500 transition-colors tracking-wide group"
                  >
                    <span className="relative">
                       {link.name}
                       <span className="block h-[1px] w-0 group-hover:w-full bg-gold-500 transition-all duration-500 absolute bottom-0 left-0" />
                    </span>
                  </motion.a>
                 );
              })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const ArrowIcon = ({ className }: { className?: string }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

export default Navbar;
