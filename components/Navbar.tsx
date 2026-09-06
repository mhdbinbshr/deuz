
import React, { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, ShoppingBag, Heart, ChevronDown, User, LogOut, LayoutDashboard, 
  Package, ArrowRight, Sparkles, Layers, ShieldCheck, ArrowUpRight, Compass, Home, MessageSquare 
} from 'lucide-react';
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

  // Bulletproof background scroll lock when the directory drawer is open
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const scrollY = window.scrollY;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    // Lock page completely in place to prevent background scrolling
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [mobileMenuOpen]);

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
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 flex items-center justify-between gap-4">
          
          {/* Logo Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex items-center gap-3 z-50 shrink-0"
          >
            <a href="#" className="group flex flex-col items-start">
              <span className="text-xs sm:text-sm md:text-base font-serif text-white tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap group-hover:text-gold-400 transition-colors duration-500">
                DEUZ & CO
              </span>
            </a>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-center flex-1 px-4" onMouseLeave={() => setActiveHover(null)}>
            <div className="flex items-center space-x-8 xl:space-x-12">
              {links.map((link, i) => {
                if (link.name === 'Store') {
                   return (
                    <div 
                      key="store-dropdown"
                      className="relative h-full flex items-center"
                      onMouseEnter={() => setIsStoreOpen(true)}
                      onMouseLeave={() => setIsStoreOpen(false)}
                    >
                      <button 
                        onClick={() => handleStoreNavigation('fashion')}
                        className="group relative flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] font-medium text-white/60 hover:text-white transition-all duration-300 py-4 cursor-pointer"
                      >
                        Store
                        <ChevronDown size={11} className={`text-gold-500/70 transition-transform duration-300 ${isStoreOpen ? 'rotate-180 text-gold-400' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isStoreOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 16, rotateX: -14, scale: 0.94, filter: "blur(8px)" }}
                            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: 10, rotateX: -10, scale: 0.96, filter: "blur(4px)" }}
                            transition={{ type: "spring", stiffness: 380, damping: 26, mass: 0.8 }}
                            style={{ transformPerspective: 1200, transformStyle: "preserve-3d" }}
                            className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 pointer-events-auto"
                          >
                            {/* Main 3D Glass Mega-Dropdown Container */}
                            <div className="relative w-[540px] bg-[#070707]/95 border border-white/10 backdrop-blur-2xl shadow-[0_30px_70px_rgba(0,0,0,0.95),0_0_50px_rgba(212,175,55,0.08)] rounded-md overflow-hidden p-5 flex gap-5">
                              
                              {/* Glowing Laser Scanline across top border */}
                              <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden pointer-events-none">
                                <motion.div 
                                  animate={{ x: ['-100%', '200%'] }} 
                                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                                  className="w-1/2 h-full bg-gradient-to-r from-transparent via-gold-400 to-transparent shadow-[0_0_12px_#D4AF37]"
                                />
                              </div>

                              {/* Ambient Top Light Beam */}
                              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-56 h-28 bg-gold-500/10 rounded-full blur-[40px] pointer-events-none" />

                              {/* Left Column: Interactive Collections */}
                              <div className="flex-1 flex flex-col justify-between space-y-2">
                                <div className="text-[9px] font-mono uppercase tracking-[0.3em] text-gold-500/80 mb-1 flex items-center gap-1.5">
                                  <Sparkles size={11} className="text-gold-400 animate-pulse" />
                                  <span>DEUZ Atelier & Curations</span>
                                </div>

                                {/* Option 1: Pret-a-Porter */}
                                <motion.button 
                                  whileHover={{ x: 4, scale: 1.01 }}
                                  transition={{ duration: 0.2 }}
                                  onClick={() => handleStoreNavigation('fashion')}
                                  className="w-full text-left p-3 rounded bg-white/[0.02] hover:bg-gradient-to-r hover:from-gold-500/15 hover:via-white/[0.04] hover:to-transparent border border-white/5 hover:border-gold-500/30 transition-all duration-300 group flex items-start justify-between relative overflow-hidden cursor-pointer"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 rounded bg-black/60 border border-white/10 text-gold-400 group-hover:border-gold-500/40 group-hover:text-gold-300 transition-colors">
                                      <Layers size={14} />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-white text-xs font-serif tracking-wider group-hover:text-gold-300 transition-colors">Fashion House</h4>
                                        <span className="text-[8px] px-1.5 py-0.2 bg-gold-500/20 text-gold-400 font-mono tracking-wider rounded">SIGNATURE</span>
                                      </div>
                                      <p className="text-[10px] text-white/40 tracking-wide mt-0.5 group-hover:text-white/60">Architectural silhouettes & sculpted garments</p>
                                    </div>
                                  </div>
                                  <ArrowUpRight size={14} className="text-white/30 group-hover:text-gold-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </motion.button>

                                {/* Option 2: Vault Archives */}
                                <motion.button 
                                  whileHover={{ x: 4, scale: 1.01 }}
                                  transition={{ duration: 0.2 }}
                                  onClick={() => { setIsStoreOpen(false); onOpenArchive(); }}
                                  className="w-full text-left p-3 rounded bg-white/[0.02] hover:bg-gradient-to-r hover:from-gold-500/15 hover:via-white/[0.04] hover:to-transparent border border-white/5 hover:border-gold-500/30 transition-all duration-300 group flex items-start justify-between relative overflow-hidden cursor-pointer"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 rounded bg-black/60 border border-white/10 text-white/70 group-hover:border-gold-500/40 group-hover:text-gold-300 transition-colors">
                                      <ShieldCheck size={14} />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-white text-xs font-serif tracking-wider group-hover:text-gold-300 transition-colors">The Vault</h4>
                                        <span className="text-[8px] px-1.5 py-0.2 bg-white/10 text-white/60 font-mono tracking-wider rounded">ARCHIVE</span>
                                      </div>
                                      <p className="text-[10px] text-white/40 tracking-wide mt-0.5 group-hover:text-white/60">Singular retired drops & recorded artifacts</p>
                                    </div>
                                  </div>
                                  <ArrowUpRight size={14} className="text-white/30 group-hover:text-gold-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </motion.button>

                                {/* Option 3: Private Concierge Bespoke */}
                                <motion.button 
                                  whileHover={{ x: 4, scale: 1.01 }}
                                  transition={{ duration: 0.2 }}
                                  onClick={() => { setIsStoreOpen(false); onOpenContact(); }}
                                  className="w-full text-left p-3 rounded bg-white/[0.02] hover:bg-gradient-to-r hover:from-gold-500/15 hover:via-white/[0.04] hover:to-transparent border border-white/5 hover:border-gold-500/30 transition-all duration-300 group flex items-start justify-between relative overflow-hidden cursor-pointer"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 rounded bg-black/60 border border-white/10 text-white/70 group-hover:border-gold-500/40 group-hover:text-gold-300 transition-colors">
                                      <Sparkles size={14} />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-white text-xs font-serif tracking-wider group-hover:text-gold-300 transition-colors">Concierge Desk</h4>
                                        <span className="text-[8px] px-1.5 py-0.2 bg-white/10 text-white/60 font-mono tracking-wider rounded">VIP</span>
                                      </div>
                                      <p className="text-[10px] text-white/40 tracking-wide mt-0.5 group-hover:text-white/60">Bespoke sizing, private acquisition & requests</p>
                                    </div>
                                  </div>
                                  <ArrowUpRight size={14} className="text-white/30 group-hover:text-gold-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </motion.button>
                              </div>

                              {/* Right Column: 3D Feature Preview Card */}
                              <motion.div 
                                whileHover={{ scale: 1.02, rotateY: 4 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                onClick={() => handleStoreNavigation('fashion')}
                                className="w-44 shrink-0 bg-gradient-to-b from-white/[0.06] to-black/80 border border-white/10 rounded-sm overflow-hidden p-3 flex flex-col justify-between group cursor-pointer relative"
                              >
                                <div className="relative h-32 w-full overflow-hidden rounded-sm bg-black/50 mb-2">
                                  <motion.img 
                                    src="https://ik.imagekit.io/dto1zguat/Evolve_1.jpg" 
                                    alt="Sovereign Form"
                                    animate={{ scale: [1, 1.04, 1] }}
                                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                                  />
                                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-md border border-gold-500/30 text-[8px] font-mono text-gold-400 tracking-wider">
                                    FORM 01
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[10px] font-serif text-white tracking-widest uppercase">SOVEREIGN</p>
                                  <p className="text-[9px] text-white/40 tracking-wider mt-0.5">Heavy French Terry</p>
                                  <div className="mt-3 flex items-center justify-between text-[9px] text-gold-400 uppercase tracking-widest font-semibold group-hover:text-gold-300">
                                    <span>Enter Store</span>
                                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                  </div>
                                </div>
                              </motion.div>
                            </div>
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
          <div className="flex items-center gap-4 sm:gap-6 md:gap-8 shrink-0">
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
                          initial={{ opacity: 0, y: 16, rotateX: -14, scale: 0.94, filter: "blur(6px)" }}
                          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1, filter: "blur(0px)" }}
                          exit={{ opacity: 0, y: 10, rotateX: -10, scale: 0.96, filter: "blur(4px)" }}
                          transition={{ type: "spring", stiffness: 380, damping: 26, mass: 0.8 }}
                          style={{ transformPerspective: 1000, transformStyle: "preserve-3d" }}
                          className="absolute top-full right-0 mt-3 w-64 max-w-[calc(100vw-2rem)] bg-[#070707]/95 border border-white/10 backdrop-blur-2xl shadow-[0_30px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(212,175,55,0.08)] rounded-md overflow-hidden z-50 origin-top-right pointer-events-auto"
                        >
                          {/* Sweeping Laser Line */}
                          <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden pointer-events-none">
                            <motion.div 
                              animate={{ x: ['-100%', '200%'] }} 
                              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                              className="w-1/2 h-full bg-gradient-to-r from-transparent via-gold-400 to-transparent shadow-[0_0_12px_#D4AF37]"
                            />
                          </div>

                          <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                            <p className="text-white text-xs font-serif tracking-wider">{user.fullName}</p>
                            <p className="text-white/40 text-[9px] uppercase tracking-widest mt-1 truncate">{user.email}</p>
                          </div>
                          
                          {/* My Orders Link */}
                          {onOpenMyOrders && (
                             <motion.button 
                               whileHover={{ x: 4 }}
                               onClick={() => {
                                 setIsUserMenuOpen(false);
                                 onOpenMyOrders();
                               }}
                               className="w-full text-left px-5 py-3.5 text-[10px] uppercase tracking-[0.2em] text-white/70 hover:text-gold-400 hover:bg-white/[0.03] transition-all flex items-center justify-between border-b border-white/5 group cursor-pointer"
                             >
                               <span className="flex items-center gap-3">
                                 <Package size={13} className="text-gold-500/80" /> My Dossiers
                               </span>
                               <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-gold-400" />
                             </motion.button>
                          )}

                          {/* Wishlist Link */}
                          {onOpenWishlist && (
                             <motion.button 
                               whileHover={{ x: 4 }}
                               onClick={() => {
                                 setIsUserMenuOpen(false);
                                 onOpenWishlist();
                               }}
                               className="w-full text-left px-5 py-3.5 text-[10px] uppercase tracking-[0.2em] text-white/70 hover:text-red-400 hover:bg-white/[0.03] transition-all flex items-center justify-between border-b border-white/5 group cursor-pointer"
                             >
                               <span className="flex items-center gap-3">
                                 <Heart size={13} className="text-red-400/80" /> Wishlist
                               </span>
                               <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-red-400" />
                             </motion.button>
                          )}

                          {/* Admin Link */}
                          {user.role === 'admin' && onOpenAdmin && (
                             <motion.button 
                               whileHover={{ x: 4 }}
                               onClick={() => {
                                 setIsUserMenuOpen(false);
                                 onOpenAdmin();
                               }}
                               className="w-full text-left px-5 py-3.5 text-[10px] uppercase tracking-[0.2em] text-white/70 hover:text-gold-400 hover:bg-white/[0.03] transition-all flex items-center justify-between border-b border-white/5 group cursor-pointer"
                             >
                               <span className="flex items-center gap-3">
                                 <LayoutDashboard size={13} className="text-gold-400" /> Dashboard
                               </span>
                               <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-gold-400" />
                             </motion.button>
                          )}

                          <motion.button 
                            whileHover={{ x: 4 }}
                            onClick={logout}
                            className="w-full text-left px-5 py-3.5 text-[10px] uppercase tracking-[0.2em] text-white/50 hover:text-red-400 hover:bg-white/[0.03] transition-all flex items-center gap-3 group cursor-pointer"
                          >
                            <LogOut size={13} /> Sign Out
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
              ) : (
                <button
                   onClick={openAuthModal}
                   className="hidden sm:block text-[10px] uppercase tracking-[0.25em] text-white/60 hover:text-gold-400 transition-colors duration-300 whitespace-nowrap"
                >
                   Login
                </button>
              )}
            </div>

            {/* Wishlist */}
            <button
               onClick={onOpenWishlist}
               className="relative text-white/60 hover:text-red-500 transition-colors duration-300 group p-1"
               aria-label="View Wishlist"
            >
               <Heart size={18} strokeWidth={1} className="group-hover:fill-red-500/20 transition-all duration-300" />
            </button>

            {/* Cart */}
            <button
               onClick={() => setIsCartOpen(true)}
               className="relative text-white/60 hover:text-gold-400 transition-colors duration-300 group p-1"
               aria-label="View Cart"
            >
               <ShoppingBag size={18} strokeWidth={1} />
               <AnimatePresence>
                 {cartCount > 0 && (
                   <motion.span
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     exit={{ scale: 0 }}
                     className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gold-500 text-black text-[9px] font-bold flex items-center justify-center rounded-full"
                   >
                     {cartCount}
                   </motion.span>
                 )}
               </AnimatePresence>
            </button>

            {/* Right Three Line Luxury Menu Toggle */}
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setMobileMenuOpen(true)}
              className="relative p-2.5 rounded-full border border-white/10 hover:border-gold-500/40 bg-white/[0.03] hover:bg-white/[0.08] transition-all duration-300 group flex items-center justify-center cursor-pointer overflow-hidden shrink-0"
              aria-label="Open House Directory"
            >
              <div className="absolute inset-0 bg-gold-500/0 group-hover:bg-gold-500/10 rounded-full blur-md transition-all duration-300 pointer-events-none" />
              
              <div className="flex flex-col items-end gap-1.5 w-5 relative z-10">
                <span className="h-[1.5px] w-5 bg-white group-hover:bg-gold-400 group-hover:w-5 transition-all duration-300 rounded-full" />
                <span className="h-[1.5px] w-3.5 bg-gold-500 group-hover:bg-gold-300 group-hover:w-5 transition-all duration-300 rounded-full" />
                <span className="h-[1.5px] w-4.5 bg-white group-hover:bg-gold-400 group-hover:w-5 transition-all duration-300 rounded-full" />
              </div>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* 3D Cinematic Right Slide-in Directory Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop with fade blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMobileMenuOpen(false)}
              onWheel={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onTouchMove={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer touch-none"
            />

            {/* 3D Perspective Panel */}
            <motion.div
              initial={{ x: '100%', rotateY: 22, opacity: 0 }}
              animate={{ x: 0, rotateY: 0, opacity: 1 }}
              exit={{ x: '100%', rotateY: 18, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30, mass: 0.85 }}
              style={{ transformPerspective: 1400, transformOrigin: "right center" }}
              className="fixed top-0 right-0 h-screen h-[100dvh] max-h-screen w-full sm:w-[480px] md:w-[520px] bg-[#070707]/98 border-l border-white/10 backdrop-blur-3xl shadow-[-25px_0_70px_rgba(0,0,0,0.95),0_0_50px_rgba(212,175,55,0.08)] flex flex-col z-50 text-left overflow-hidden"
            >
              {/* Sweeping Laser Line along left border */}
              <div className="absolute top-0 bottom-0 left-0 w-[2px] overflow-hidden pointer-events-none z-30">
                <motion.div 
                  animate={{ y: ['-100%', '200%'] }} 
                  transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                  className="w-full h-1/2 bg-gradient-to-b from-transparent via-gold-400 to-transparent shadow-[0_0_12px_#D4AF37]"
                />
              </div>

              {/* Ambient Glowing Orbs */}
              <div className="absolute top-10 -right-24 w-72 h-72 bg-gold-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-20 -left-20 w-80 h-80 bg-gold-500/5 rounded-full blur-[90px] pointer-events-none" />
              
              {/* Background Monogram Watermark */}
              <div className="absolute -right-6 bottom-32 text-[140px] font-serif font-bold text-white/[0.015] pointer-events-none select-none tracking-tighter leading-none">
                DEUZ
              </div>

              {/* Pinned Top Header */}
              <div className="relative z-20 shrink-0 px-6 sm:px-8 pt-7 pb-4 flex items-center justify-between border-b border-white/5 bg-[#070707]/95 backdrop-blur-md">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
                    <p className="text-[9px] font-mono text-gold-500 uppercase tracking-[0.3em]">DEUZ ATELIER // DIRECTORY</p>
                  </div>
                  <h3 className="text-white font-serif text-lg tracking-[0.15em] mt-0.5">HOUSE INDEX</h3>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-10 h-10 rounded-full border border-white/10 hover:border-gold-500/40 bg-white/[0.02] hover:bg-white/[0.08] flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer group"
                  aria-label="Close directory"
                >
                  <X size={18} strokeWidth={1.5} className="group-hover:text-gold-400 transition-colors" />
                </motion.button>
              </div>

              {/* Designated Scrollable Navigation Body */}
              <div 
                style={{ WebkitOverflowScrolling: 'touch' }}
                className="relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 sm:px-8 py-4 sm:py-6 space-y-3 sm:space-y-4 overscroll-contain touch-pan-y [scrollbar-width:thin] [scrollbar-color:rgba(212,175,55,0.3)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/15 hover:[&::-webkit-scrollbar-thumb]:bg-gold-500/40 [&::-webkit-scrollbar-thumb]:rounded-full"
              >
                
                {/* User Status / Dossier Card */}
                {user ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="p-3.5 sm:p-4 rounded-sm border border-white/10 bg-white/[0.02] backdrop-blur-xl relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[8px] font-mono uppercase tracking-[0.25em] text-gold-500 bg-gold-500/10 px-1.5 py-0.5 rounded border border-gold-500/20">
                            AUTHENTICATED
                          </span>
                          {user.role === 'admin' && (
                            <span className="text-[8px] font-mono uppercase tracking-[0.25em] text-gold-400 bg-gold-400/20 px-1.5 py-0.5 rounded border border-gold-400/30">
                              CHAMBER ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-white font-serif text-sm tracking-wide">{user.fullName}</p>
                        <p className="text-white/40 text-[9px] font-mono tracking-wider truncate max-w-[220px] sm:max-w-[280px]">{user.email}</p>
                      </div>
                      <button 
                        onClick={() => { logout(); setMobileMenuOpen(false); }}
                        className="text-[9px] uppercase tracking-widest text-white/40 hover:text-red-400 transition-colors border-b border-transparent hover:border-red-400 pb-0.5 cursor-pointer shrink-0"
                      >
                        Sign Out
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5">
                      {onOpenMyOrders && (
                        <button
                          onClick={() => { onOpenMyOrders(); setMobileMenuOpen(false); }}
                          className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/70 hover:text-gold-400 transition-colors p-1.5 rounded hover:bg-white/[0.03] cursor-pointer"
                        >
                          <Package size={12} className="text-gold-500" /> My Dossiers
                        </button>
                      )}
                      <button
                        onClick={() => { onOpenWishlist(); setMobileMenuOpen(false); }}
                        className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/70 hover:text-red-400 transition-colors p-1.5 rounded hover:bg-white/[0.03] cursor-pointer"
                      >
                        <Heart size={12} className="text-red-400" /> Wishlist
                      </button>
                      {user.role === 'admin' && onOpenAdmin && (
                        <button
                          onClick={() => { onOpenAdmin(); setMobileMenuOpen(false); }}
                          className="col-span-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/70 hover:text-gold-400 transition-colors p-1.5 rounded hover:bg-white/[0.03] cursor-pointer"
                        >
                          <LayoutDashboard size={12} className="text-gold-400" /> System Dashboard
                        </button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    className="p-3.5 sm:p-4 rounded-sm border border-white/10 bg-gradient-to-r from-gold-500/10 via-white/[0.02] to-transparent flex items-center justify-between relative overflow-hidden group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-black/60 border border-gold-500/30 flex items-center justify-center text-gold-400 group-hover:border-gold-500 transition-colors shrink-0">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-serif text-white tracking-wider">Client Authentication</p>
                        <p className="text-[10px] text-white/40 tracking-wide">Initialize private dossier & track orders</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setMobileMenuOpen(false); openAuthModal(); }}
                      className="px-3 py-1.5 text-[9px] uppercase font-mono tracking-widest text-gold-400 border border-gold-500/40 rounded-sm hover:bg-gold-500 hover:text-black transition-all cursor-pointer shrink-0 ml-2"
                    >
                      Login / Join
                    </button>
                  </motion.div>
                )}

                {/* Staggered Navigation Directory Cards */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <p className="text-[9px] font-mono text-white/40 uppercase tracking-[0.3em]">
                      CHAMBERS // DIRECT ACCESS
                    </p>
                    <span className="text-[8px] font-mono text-gold-500/60 tracking-widest">7 DESTINATIONS</span>
                  </div>

                  {/* 01: Home */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    whileHover={{ x: 4, scale: 1.01 }}
                    className="p-3 sm:p-3.5 rounded-sm border border-white/5 hover:border-gold-500/30 bg-white/[0.015] hover:bg-white/[0.04] transition-all group cursor-pointer"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-sm bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/40 group-hover:text-gold-400 group-hover:border-gold-500/30 transition-all shrink-0">
                          <Home size={13} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-gold-500/70">01</span>
                            <h4 className="font-serif text-sm sm:text-base text-white group-hover:text-gold-300 transition-colors tracking-wide truncate">
                              Origin Surface
                            </h4>
                            <span className="text-[8px] px-1.5 py-0.2 bg-white/5 text-white/50 font-mono tracking-wider rounded shrink-0">GENESIS</span>
                          </div>
                          <p className="text-[10px] text-white/40 tracking-wider mt-0.5 truncate">Return to monolith genesis & hero</p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-white/20 group-hover:text-gold-400 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </motion.div>

                  {/* 02: Maison */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.14 }}
                    whileHover={{ x: 4, scale: 1.01 }}
                    className="p-3 sm:p-3.5 rounded-sm border border-white/5 hover:border-gold-500/30 bg-white/[0.015] hover:bg-white/[0.04] transition-all group cursor-pointer"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      const el = document.getElementById('about');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-sm bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/40 group-hover:text-gold-400 group-hover:border-gold-500/30 transition-all shrink-0">
                          <Compass size={13} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-gold-500/70">02</span>
                            <h4 className="font-serif text-sm sm:text-base text-white group-hover:text-gold-300 transition-colors tracking-wide truncate">
                              The Maison
                            </h4>
                            <span className="text-[8px] px-1.5 py-0.2 bg-white/5 text-white/50 font-mono tracking-wider rounded shrink-0">MANIFESTO</span>
                          </div>
                          <p className="text-[10px] text-white/40 tracking-wider mt-0.5 truncate">Singularity, discipline & architectural evolution</p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-white/20 group-hover:text-gold-400 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </motion.div>

                  {/* 03: Fashion House */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 }}
                    whileHover={{ x: 4, scale: 1.01 }}
                    className="p-3 sm:p-3.5 rounded-sm border border-gold-500/20 hover:border-gold-500/50 bg-gradient-to-r from-gold-500/5 via-white/[0.02] to-transparent hover:bg-white/[0.04] transition-all group cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.03)]"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenFashionStore();
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-sm bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 group-hover:border-gold-400 transition-all shrink-0">
                          <Layers size={13} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-gold-500">03</span>
                            <h4 className="font-serif text-sm sm:text-base text-white group-hover:text-gold-300 transition-colors tracking-wide truncate">
                              Fashion House
                            </h4>
                            <span className="text-[8px] px-1.5 py-0.2 bg-gold-500/20 text-gold-400 font-mono tracking-wider rounded shrink-0 flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-gold-400 animate-ping" />
                              STORE // LIVE
                            </span>
                          </div>
                          <p className="text-[10px] text-white/40 tracking-wider mt-0.5 truncate">Pret-à-porter silhouettes & sculpted drops</p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-gold-400/50 group-hover:text-gold-400 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </motion.div>

                  {/* 04: The Vault Archive */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.22 }}
                    whileHover={{ x: 4, scale: 1.01 }}
                    className="p-3 sm:p-3.5 rounded-sm border border-white/5 hover:border-gold-500/30 bg-white/[0.015] hover:bg-white/[0.04] transition-all group cursor-pointer"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenArchive();
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-sm bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/40 group-hover:text-gold-400 group-hover:border-gold-500/30 transition-all shrink-0">
                          <ShieldCheck size={13} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-gold-500/70">04</span>
                            <h4 className="font-serif text-sm sm:text-base text-white group-hover:text-gold-300 transition-colors tracking-wide truncate">
                              The Vault Archive
                            </h4>
                            <span className="text-[8px] px-1.5 py-0.2 bg-white/5 text-white/50 font-mono tracking-wider rounded shrink-0">ARCHIVE</span>
                          </div>
                          <p className="text-[10px] text-white/40 tracking-wider mt-0.5 truncate">Historical records of singular pieces & locked editions</p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-white/20 group-hover:text-gold-400 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </motion.div>

                  {/* 05: Card Sanctum */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.26 }}
                    whileHover={{ x: 4, scale: 1.01 }}
                    className="p-3 sm:p-3.5 rounded-sm border border-white/5 hover:border-gold-500/30 bg-white/[0.015] hover:bg-white/[0.04] transition-all group cursor-pointer"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenCardStore();
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-sm bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/40 group-hover:text-gold-400 group-hover:border-gold-500/30 transition-all shrink-0">
                          <Sparkles size={13} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-gold-500/70">05</span>
                            <h4 className="font-serif text-sm sm:text-base text-white group-hover:text-gold-300 transition-colors tracking-wide truncate">
                              Card Sanctum
                            </h4>
                            <span className="text-[8px] px-1.5 py-0.2 bg-white/5 text-white/50 font-mono tracking-wider rounded shrink-0">COLLECTION</span>
                          </div>
                          <p className="text-[10px] text-white/40 tracking-wider mt-0.5 truncate">Single-edition tactile cards & 3D interactive showcase</p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-white/20 group-hover:text-gold-400 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </motion.div>

                  {/* 06: Private Concierge */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ x: 4, scale: 1.01 }}
                    className="p-3 sm:p-3.5 rounded-sm border border-white/5 hover:border-gold-500/30 bg-white/[0.015] hover:bg-white/[0.04] transition-all group cursor-pointer"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenContact();
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-sm bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/40 group-hover:text-gold-400 group-hover:border-gold-500/30 transition-all shrink-0">
                          <MessageSquare size={13} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-gold-500/70">06</span>
                            <h4 className="font-serif text-sm sm:text-base text-white group-hover:text-gold-300 transition-colors tracking-wide truncate">
                              Private Concierge
                            </h4>
                            <span className="text-[8px] px-1.5 py-0.2 bg-white/5 text-white/50 font-mono tracking-wider rounded shrink-0">BESPOKE</span>
                          </div>
                          <p className="text-[10px] text-white/40 tracking-wider mt-0.5 truncate">Direct communication, bespoke sizing & VIP liaison</p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-white/20 group-hover:text-gold-400 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </motion.div>

                  {/* 07: Saved Wishlist */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.34 }}
                    whileHover={{ x: 4, scale: 1.01 }}
                    className="p-3 sm:p-3.5 rounded-sm border border-white/5 hover:border-red-500/30 bg-white/[0.015] hover:bg-white/[0.04] transition-all group cursor-pointer"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenWishlist();
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-sm bg-red-500/5 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:border-red-400 transition-all shrink-0">
                          <Heart size={13} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-gold-500/70">07</span>
                            <h4 className="font-serif text-sm sm:text-base text-white group-hover:text-red-300 transition-colors tracking-wide truncate">
                              Saved Wishlist
                            </h4>
                            <span className="text-[8px] px-1.5 py-0.2 bg-red-500/10 text-red-400 font-mono tracking-wider rounded shrink-0">CURATION</span>
                          </div>
                          <p className="text-[10px] text-white/40 tracking-wider mt-0.5 truncate">Curated archive of your bookmarked pieces</p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-white/20 group-hover:text-red-400 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </motion.div>
                </div>

                {/* Bottom Scroll Cushion: ensures last element is clearly visible well above docked footer on all viewports */}
                <div className="h-8 sm:h-12 shrink-0 pointer-events-none" />
              </div>

              {/* Bottom Quick-Action Footer */}
              <div className="relative z-20 shrink-0 p-4 sm:p-6 border-t border-white/10 bg-[#050505] shadow-[0_-15px_35px_rgba(0,0,0,0.9)] space-y-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                {/* Bag Pill Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setMobileMenuOpen(false); setIsCartOpen(true); }}
                  className="w-full py-3 px-4 rounded bg-gradient-to-r from-gold-500/15 via-white/[0.05] to-gold-500/10 border border-gold-500/30 hover:border-gold-400 flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag size={16} className="text-gold-400" />
                    <span className="text-xs uppercase font-serif tracking-widest text-white">Acquisition Bag</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-gold-500 text-black">
                    {cartCount} {cartCount === 1 ? 'ITEM' : 'ITEMS'}
                  </span>
                </motion.button>

                <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 pt-0.5">
                  <span>DEUZ PROTOCOL • V1.0</span>
                  <span>SINGULARITY ONE</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
