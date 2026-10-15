
import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, ShoppingBag, Heart, ChevronDown, User, LogOut, LayoutDashboard, 
  Package, ArrowRight, Sparkles, Layers, ShieldCheck, ArrowUpRight, Compass, Home, MessageSquare,
  Plane
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { CustomerProfileChamber } from './CustomerProfileChamber';
import { CUSTOMER_STAGES } from '../types';

interface NavbarProps {
  onOpenWishlist: () => void;
  onOpenFashionStore: () => void;
  onOpenAdmin?: () => void;
  onOpenMyOrders?: () => void;
  onOpenArchive: () => void;
  onOpenContact: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onOpenWishlist, 
  onOpenFashionStore,
  onOpenAdmin,
  onOpenMyOrders,
  onOpenArchive,
  onOpenContact
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileChamberOpen, setIsProfileChamberOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user, openAuthModal, logout } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const { scrollY } = useScroll();

  const userStageId = user?.stage || 'applicant';
  const userStageMeta = CUSTOMER_STAGES.find(s => s.id === userStageId) || CUSTOMER_STAGES[0];

  // Comprehensive screen touch, click, scroll and Escape key dismissal for user menu on all screens
  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleTouchOrClickOutside = (e: Event) => {
      const target = e.target as Node | null;
      if (userMenuRef.current && target && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleScrollOrMove = () => {
      setIsUserMenuOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };

    // Capture phase guarantees touches or clicks anywhere on screen dismiss menu instantly
    window.addEventListener('touchstart', handleTouchOrClickOutside, { capture: true, passive: true });
    window.addEventListener('pointerdown', handleTouchOrClickOutside, { capture: true });
    window.addEventListener('mousedown', handleTouchOrClickOutside, { capture: true });
    window.addEventListener('scroll', handleScrollOrMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('touchstart', handleTouchOrClickOutside, { capture: true });
      window.removeEventListener('pointerdown', handleTouchOrClickOutside, { capture: true });
      window.removeEventListener('mousedown', handleTouchOrClickOutside, { capture: true });
      window.removeEventListener('scroll', handleScrollOrMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

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
            
          {/* Right Actions */}
          <div className="flex items-center gap-4 sm:gap-6 md:gap-8 shrink-0">
            {/* User Profile — Fully Responsive on All Screens */}
            <div 
              ref={userMenuRef}
              className="relative"
            >
              {user ? (
                 <button 
                   type="button"
                   aria-expanded={isUserMenuOpen}
                   aria-label="User Account Dossier Menu"
                   className="relative group cursor-pointer flex items-center gap-1.5 p-1 text-white/70 hover:text-gold-400 transition-colors duration-300 outline-none"
                   onClick={(e) => {
                     e.stopPropagation();
                     setIsUserMenuOpen(prev => !prev);
                   }}
                 >
                    <span className="text-[10px] uppercase font-mono tracking-widest hidden lg:block text-white/70 group-hover:text-gold-400 transition-colors">
                      {user.fullName.split(' ')[0]}
                    </span>
                    <User size={18} strokeWidth={1.2} className="text-gold-400 group-hover:text-gold-300 transition-colors" />
                 </button>
              ) : (
                 <button
                   type="button"
                   aria-expanded={isUserMenuOpen}
                   aria-label="Client Account & Authentication"
                   className="relative group cursor-pointer flex items-center gap-1.5 p-1 text-white/60 hover:text-gold-400 transition-colors duration-300 outline-none"
                   onClick={(e) => {
                     e.stopPropagation();
                     setIsUserMenuOpen(prev => !prev);
                   }}
                 >
                    <span className="text-[10px] uppercase font-mono tracking-widest hidden xl:block text-white/60 group-hover:text-gold-400 transition-colors">
                      Sign In
                    </span>
                    <User size={18} strokeWidth={1.2} className="transition-colors group-hover:text-gold-400" />
                 </button>
              )}
              
              <AnimatePresence>
                {isUserMenuOpen && (
                  <>
                    {/* Fullscreen Touch & Click Dismissal Backdrop (Active on ALL screens) */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => setIsUserMenuOpen(false)}
                      onTouchStart={() => setIsUserMenuOpen(false)}
                      className="fixed inset-0 z-40 bg-black/40 sm:bg-black/20 backdrop-blur-[1px] sm:backdrop-blur-none cursor-default"
                      aria-hidden="true"
                    />

                    {/* Rectangular Profile Dropdown Container with Rounded Corners & Tabular Grid View */}
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      className="fixed sm:absolute top-[64px] sm:top-full left-2.5 right-2.5 sm:left-auto sm:right-0 sm:mt-2 sm:w-[390px] max-w-[calc(100vw-1.25rem)] sm:max-w-md bg-[#0A0A0A]/98 border border-gold-500/35 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(212,175,55,0.12)] rounded-2xl overflow-hidden z-50 origin-top sm:origin-top-right pointer-events-auto max-h-[calc(100vh-5rem)] flex flex-col"
                      onClick={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                    >
                      {/* Sweeping Laser Line Header */}
                      <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden pointer-events-none z-20">
                        <motion.div 
                          animate={{ x: ['-100%', '200%'] }} 
                          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                          className="w-1/2 h-full bg-gradient-to-r from-transparent via-gold-400 to-transparent shadow-[0_0_12px_#D4AF37]"
                        />
                      </div>

                      {user ? (
                        <>
                          {/* Tabular Header Spec Bar */}
                          <div className="p-3.5 sm:p-4 border-b border-white/10 bg-gradient-to-b from-white/[0.04] via-gold-500/[0.02] to-transparent shrink-0">
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <span className="text-[8px] font-mono uppercase tracking-[0.25em] text-gold-400/90 font-bold flex items-center gap-1.5">
                                <ShieldCheck size={11} className="text-gold-400" />
                                <span>TABULAR DOSSIER DIRECTORY</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="p-1 text-white/40 hover:text-white rounded-md hover:bg-white/10 cursor-pointer transition-colors"
                                aria-label="Close menu"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            {/* Client Identification Card */}
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-black border border-gold-500/40 flex items-center justify-center text-gold-400 font-serif text-sm font-bold shrink-0 shadow-[0_0_12px_rgba(212,175,55,0.15)]">
                                {user.fullName?.charAt(0).toUpperCase() || 'P'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-white text-xs sm:text-sm font-serif font-bold tracking-wide truncate">
                                  {user.fullName}
                                </p>
                                <p className="text-white/45 text-[9px] sm:text-[10px] font-mono tracking-wider truncate">
                                  {user.email}
                                </p>
                              </div>
                            </div>

                            {/* Tabular Spec Sheet Strip */}
                            <div className="mt-3 grid grid-cols-3 divide-x divide-white/10 border border-white/10 rounded-xl overflow-hidden bg-black/50 text-center font-mono">
                              <div className="py-1 px-1.5 flex flex-col justify-center">
                                <span className="text-[7px] text-white/40 uppercase tracking-widest">STAGE</span>
                                <span className="text-[9px] text-gold-300 font-bold tracking-wider truncate">
                                  0{userStageMeta.level} • {userStageMeta.name}
                                </span>
                              </div>
                              <div className="py-1 px-1.5 flex flex-col justify-center">
                                <span className="text-[7px] text-white/40 uppercase tracking-widest">HOUSE ID</span>
                                <span className="text-[9px] text-amber-300 font-bold tracking-wider truncate">
                                  {user.houseCode || user.houseId || 'PENDING'}
                                </span>
                              </div>
                              <div className="py-1 px-1.5 flex flex-col justify-center">
                                <span className="text-[7px] text-white/40 uppercase tracking-widest">CLEARANCE</span>
                                <span className={`text-[9px] font-bold tracking-wider truncate ${user.role === 'admin' ? 'text-red-400' : 'text-emerald-400'}`}>
                                  {user.role === 'admin' ? 'ADMIN' : 'PATRON'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Tabular Table Header */}
                          <div className="px-3.5 py-1.5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between text-[7.5px] font-mono text-white/40 uppercase tracking-[0.2em]">
                            <span className="w-8">NO.</span>
                            <span className="flex-1">MODULE DIRECTORY</span>
                            <span className="text-right">COMMAND</span>
                          </div>

                          {/* Tabular Rows Container */}
                          <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-white/5 [scrollbar-width:thin] [scrollbar-color:rgba(212,175,55,0.2)_transparent]">
                            {/* Row 01: Client Profile & Progression */}
                            <button 
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                setIsProfileChamberOpen(true);
                              }}
                              className="w-full text-left px-3.5 py-2.5 hover:bg-gold-500/10 active:bg-gold-500/15 transition-all flex items-center gap-3 group cursor-pointer"
                            >
                              <span className="w-7 py-0.5 text-center text-[9px] font-mono font-bold text-gold-400 bg-gold-500/15 border border-gold-500/30 rounded-md shrink-0">
                                01
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <User size={12} className="text-gold-400" />
                                  <span className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-gold-300 font-semibold group-hover:text-gold-200 truncate">
                                    Client Profile &amp; Progression
                                  </span>
                                </div>
                                <p className="text-[8.5px] font-mono text-white/45 truncate mt-0.5 pl-4.5">
                                  Aeronautical telemetry &amp; dossier coordinates
                                </p>
                              </div>
                              <div className="shrink-0 flex items-center gap-1 text-[8.5px] font-mono text-gold-400/70 group-hover:text-gold-300">
                                <span className="hidden sm:inline">VIEW</span>
                                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </button>

                            {/* Row 02: My Orders */}
                            {onOpenMyOrders && (
                              <button 
                                type="button"
                                onClick={() => {
                                  setIsUserMenuOpen(false);
                                  onOpenMyOrders();
                                }}
                                className="w-full text-left px-3.5 py-2.5 hover:bg-white/[0.04] active:bg-white/[0.08] transition-all flex items-center gap-3 group cursor-pointer"
                              >
                                <span className="w-7 py-0.5 text-center text-[9px] font-mono font-bold text-white/70 bg-white/5 border border-white/10 rounded-md shrink-0 group-hover:border-gold-500/40 group-hover:text-gold-400">
                                  02
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <Package size={12} className="text-white/70 group-hover:text-gold-400 transition-colors" />
                                    <span className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-white/85 group-hover:text-white font-medium truncate">
                                      My Orders &amp; Allocations
                                    </span>
                                  </div>
                                  <p className="text-[8.5px] font-mono text-white/45 truncate mt-0.5 pl-4.5">
                                    Track parcels, delivery &amp; archive receipts
                                  </p>
                                </div>
                                <div className="shrink-0 flex items-center gap-1 text-[8.5px] font-mono text-white/40 group-hover:text-white">
                                  <span className="hidden sm:inline">TRACK</span>
                                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                </div>
                              </button>
                            )}

                            {/* Row 03: Wishlist */}
                            {onOpenWishlist && (
                              <button 
                                type="button"
                                onClick={() => {
                                  setIsUserMenuOpen(false);
                                  onOpenWishlist();
                                }}
                                className="w-full text-left px-3.5 py-2.5 hover:bg-white/[0.04] active:bg-white/[0.08] transition-all flex items-center gap-3 group cursor-pointer"
                              >
                                <span className="w-7 py-0.5 text-center text-[9px] font-mono font-bold text-red-400/90 bg-red-500/10 border border-red-500/25 rounded-md shrink-0">
                                  03
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <Heart size={12} className="text-red-400" />
                                    <span className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-white/85 group-hover:text-red-300 font-medium truncate">
                                      Curated Wishlist
                                    </span>
                                  </div>
                                  <p className="text-[8.5px] font-mono text-white/45 truncate mt-0.5 pl-4.5">
                                    Private reserved pieces &amp; artifacts
                                  </p>
                                </div>
                                <div className="shrink-0 flex items-center gap-1 text-[8.5px] font-mono text-white/40 group-hover:text-red-400">
                                  <span className="hidden sm:inline">SAVED</span>
                                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                </div>
                              </button>
                            )}

                            {/* Row 04: Private Concierge */}
                            {onOpenContact && (
                              <button 
                                type="button"
                                onClick={() => {
                                  setIsUserMenuOpen(false);
                                  onOpenContact();
                                }}
                                className="w-full text-left px-3.5 py-2.5 hover:bg-white/[0.04] active:bg-white/[0.08] transition-all flex items-center gap-3 group cursor-pointer"
                              >
                                <span className="w-7 py-0.5 text-center text-[9px] font-mono font-bold text-sky-400/90 bg-sky-500/10 border border-sky-500/25 rounded-md shrink-0">
                                  04
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <MessageSquare size={12} className="text-sky-400" />
                                    <span className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-white/85 group-hover:text-sky-300 font-medium truncate">
                                      Private Salon Concierge
                                    </span>
                                  </div>
                                  <p className="text-[8.5px] font-mono text-white/45 truncate mt-0.5 pl-4.5">
                                    Direct atelier inquiries &amp; appointments
                                  </p>
                                </div>
                                <div className="shrink-0 flex items-center gap-1 text-[8.5px] font-mono text-white/40 group-hover:text-sky-400">
                                  <span className="hidden sm:inline">CONNECT</span>
                                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                </div>
                              </button>
                            )}

                            {/* Row 05: Admin Dashboard */}
                            {user.role === 'admin' && onOpenAdmin && (
                              <button 
                                type="button"
                                onClick={() => {
                                  setIsUserMenuOpen(false);
                                  onOpenAdmin();
                                }}
                                className="w-full text-left px-3.5 py-2.5 hover:bg-amber-500/10 active:bg-amber-500/15 transition-all flex items-center gap-3 group cursor-pointer"
                              >
                                <span className="w-7 py-0.5 text-center text-[9px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/35 rounded-md shrink-0">
                                  05
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <LayoutDashboard size={12} className="text-amber-400" />
                                    <span className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-amber-300 font-semibold truncate">
                                      Chamber Dashboard
                                    </span>
                                  </div>
                                  <p className="text-[8.5px] font-mono text-white/45 truncate mt-0.5 pl-4.5">
                                    Orders, catalog, telemetry &amp; users
                                  </p>
                                </div>
                                <div className="shrink-0 flex items-center gap-1 text-[8.5px] font-mono text-amber-400/80 group-hover:text-amber-300">
                                  <span className="hidden sm:inline">MANAGE</span>
                                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                </div>
                              </button>
                            )}
                          </div>

                          {/* Tabular Sign Out Footer */}
                          <div className="p-3 bg-black border-t border-white/10 shrink-0">
                            <button 
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                logout();
                              }}
                              className="w-full py-2 px-3 rounded-xl text-left text-[10px] uppercase font-mono tracking-widest text-white/60 hover:text-red-400 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 transition-all flex items-center justify-between group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <LogOut size={13} className="text-white/40 group-hover:text-red-400 transition-colors" />
                                <span>Sign Out of Dossier</span>
                              </div>
                              <span className="text-[8.5px] text-white/30 group-hover:text-red-400/70 font-mono tracking-wider">
                                TERMINATE SESSION
                              </span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Guest Identification Tabular Header */}
                          <div className="p-3.5 sm:p-4 border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent shrink-0">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[8px] font-mono uppercase tracking-[0.25em] text-gold-400 font-bold flex items-center gap-1.5">
                                <Sparkles size={11} className="text-gold-400" />
                                <span>CLIENT RECEPTION &amp; ACCESS</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="p-1 text-white/40 hover:text-white rounded-md hover:bg-white/10 cursor-pointer transition-colors"
                                aria-label="Close menu"
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <p className="text-white text-xs sm:text-sm font-serif font-bold tracking-wide">
                              Welcome to Deuz &amp; Co.
                            </p>
                            <p className="text-white/50 text-[9.5px] sm:text-[10px] font-mono mt-0.5 leading-relaxed">
                              Establish your patron dossier or sign in to track bespoke acquisitions.
                            </p>
                          </div>

                          {/* Tabular Two-Column Action Grid */}
                          <div className="p-3 sm:p-3.5 space-y-3 flex-1 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsUserMenuOpen(false);
                                  openAuthModal('login');
                                }}
                                className="py-2.5 px-2 bg-gradient-to-r from-gold-500 via-gold-400 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-black font-mono text-[9.5px] sm:text-[10px] uppercase tracking-wider font-bold rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.25)] transition-all"
                              >
                                <User size={14} />
                                <span>[01] Sign In</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setIsUserMenuOpen(false);
                                  openAuthModal('signup');
                                }}
                                className="py-2.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold-500/40 text-white font-mono text-[9.5px] sm:text-[10px] uppercase tracking-wider font-medium rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                              >
                                <Sparkles size={14} className="text-gold-400" />
                                <span>[02] Register</span>
                              </button>
                            </div>

                            {/* Tabular Directory Rows for Guests */}
                            <div className="border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5 bg-black/40">
                              {onOpenMyOrders && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsUserMenuOpen(false);
                                    onOpenMyOrders();
                                  }}
                                  className="w-full py-2.5 px-3 text-white/70 hover:text-white text-left text-[9.5px] sm:text-[10px] font-mono uppercase tracking-wider flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="text-[8px] text-gold-400 font-bold bg-gold-500/10 border border-gold-500/30 px-1 py-0.2 rounded">03</span>
                                    <Package size={12} className="text-gold-400" />
                                    <span>Track Order by Reference</span>
                                  </span>
                                  <ArrowRight size={12} className="text-white/40 group-hover:text-gold-400 group-hover:translate-x-0.5 transition-all" />
                                </button>
                              )}

                              {onOpenContact && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsUserMenuOpen(false);
                                    onOpenContact();
                                  }}
                                  className="w-full py-2.5 px-3 text-white/70 hover:text-white text-left text-[9.5px] sm:text-[10px] font-mono uppercase tracking-wider flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="text-[8px] text-gold-400 font-bold bg-gold-500/10 border border-gold-500/30 px-1 py-0.2 rounded">04</span>
                                    <Compass size={12} className="text-gold-400" />
                                    <span>Concierge Inquiries</span>
                                  </span>
                                  <ArrowRight size={12} className="text-white/40 group-hover:text-gold-400 group-hover:translate-x-0.5 transition-all" />
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
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
                    <p className="text-[9px] font-mono text-gold-500 uppercase tracking-[0.3em]">DEUZ ATELIER ∞ DIRECTORY</p>
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
                          <span className="text-[8px] font-mono uppercase tracking-wider text-gold-400 bg-gold-500/10 border border-gold-500/30 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                            <Plane size={8} className="rotate-45" />
                            <span>STAGE 0{userStageMeta.level} • {userStageMeta.name}</span>
                          </span>
                          {user.role === 'admin' && (
                            <span className="text-[8px] font-mono uppercase tracking-[0.25em] text-gold-400 bg-gold-400/20 px-1.5 py-0.5 rounded border border-gold-400/30">
                              CHAMBER ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-white font-serif text-sm tracking-wide">{user.fullName}</p>
                        <p className="text-white/40 text-[9px] font-mono tracking-wider truncate max-w-[220px] sm:max-w-[280px]">{user.email}</p>
                        {(user.houseCode || user.houseId) && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-[9px] font-bold tracking-widest">
                            <Sparkles size={10} className="text-amber-400" />
                            <span>HOUSE ID: {user.houseCode || user.houseId}</span>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => { logout(); setMobileMenuOpen(false); }}
                        className="text-[9px] uppercase tracking-widest text-white/40 hover:text-red-400 transition-colors border-b border-transparent hover:border-red-400 pb-0.5 cursor-pointer shrink-0"
                      >
                        Sign Out
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5">
                      <button
                        onClick={() => { setIsProfileChamberOpen(true); setMobileMenuOpen(false); }}
                        className="col-span-2 flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-gold-400 bg-gold-500/10 border border-gold-500/30 hover:bg-gold-500/20 transition-all p-2 rounded cursor-pointer"
                      >
                        <span className="flex items-center gap-2 font-semibold">
                          <User size={13} /> Client Profile & Progression
                        </span>
                        <span className="text-[9px] text-white/50 font-bold">Open Dossier &gt;</span>
                      </button>
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
                    onClick={() => { setMobileMenuOpen(false); openAuthModal(); }}
                    className="p-3.5 sm:p-4 rounded-sm border border-gold-500/30 hover:border-gold-500/60 bg-gradient-to-r from-gold-500/10 via-white/[0.02] to-transparent flex items-center justify-between relative overflow-hidden group cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <User size={18} className="text-gold-400 shrink-0" />
                      <div>
                        <p className="text-xs font-serif text-white tracking-wider">Client Authentication</p>
                        <p className="text-[10px] text-white/40 tracking-wide">Sign in to access your atelier account</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="px-3.5 py-1.5 text-[9px] uppercase font-mono tracking-widest text-gold-400 border border-gold-500/40 rounded-sm group-hover:bg-gold-500 group-hover:text-black transition-all">
                        Login / Join
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Staggered Navigation Directory Cards */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <p className="text-[9px] font-mono text-white/40 uppercase tracking-[0.3em]">
                      CHAMBERS ∞ DIRECT ACCESS
                    </p>
                    <span className="text-[8px] font-mono text-gold-500/60 tracking-widest">6 DESTINATIONS</span>
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
                              STORE ∞ LIVE
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

                  {/* 05: Private Concierge */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.26 }}
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
                            <span className="text-[9px] font-mono text-gold-500/70">05</span>
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

                  {/* 06: Saved Wishlist */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
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

      {/* Customer Profile & Stage Flight Radar Chamber */}
      <CustomerProfileChamber
        isOpen={isProfileChamberOpen}
        onClose={() => setIsProfileChamberOpen(false)}
        onOpenConcierge={onOpenContact}
      />
    </>
  );
};

export default Navbar;
