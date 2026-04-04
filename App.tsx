
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary } from './components/ErrorBoundary';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
// import CardShowcase from './components/CardShowcase'; // Hidden
import FashionStore from './components/FashionStore';
import About from './components/About';
import Portfolio from './components/Portfolio';
import Contact from './components/Contact';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
import ProductPage from './components/ProductPage';
import CardGamePage from './components/CardGamePage';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import CheckoutPage from './components/CheckoutPage';
import ConciergeInitiatedPage from './components/ConciergeInitiatedPage';
import MyOrdersPage from './components/MyOrdersPage';
import AuthModal from './components/AuthModal';
import AdminDashboard from './components/AdminDashboard';
import AdminLoginPage from './components/AdminLoginPage';
import AdminSetupPage from './components/AdminSetupPage';
import PremiumBackground from './components/PremiumBackground';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import TermsPage from './components/TermsPage';
import ShippingPage from './components/ShippingPage';
import ReturnsPage from './components/ReturnsPage';
import ArchivePage from './components/ArchivePage';
import ContactPage from './components/ContactPage';
import ServicesPage from './components/ServicesPage';
import { AdminRoute } from './components/AdminRoute'; 
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';
import { WishlistItem } from './types';
import { storage } from './utils/storage';
import { db } from './utils/db';

// ... (Existing WelcomeToast component)
const WelcomeToast = ({ name }: { name: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: -20, x: 20 }} 
    animate={{ opacity: 1, y: 0, x: 0 }} 
    exit={{ opacity: 0, y: -20, x: 20 }}
    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    className="fixed top-24 right-8 z-[90] bg-[#0A0A0A]/90 border border-gold-500/20 backdrop-blur-md px-6 py-4 flex items-center gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-sm pointer-events-none"
  >
     <div className="w-2 h-2 rounded-full bg-gold-500 animate-pulse shadow-[0_0_10px_#D4AF37]" />
     <div>
       <p className="text-white font-serif text-sm tracking-wide">Welcome back, {name}</p>
       <p className="text-gold-500/60 text-[9px] uppercase tracking-widest mt-1">Your concierge remembers your preferences.</p>
     </div>
  </motion.div>
);

function AppContent() {
  const [loading, setLoading] = useState(true);
  const [showProductPage, setShowProductPage] = useState(false);
  const [showGamePage, setShowGamePage] = useState(false);
  const [showArchivePage, setShowArchivePage] = useState(false);
  const [showContactPage, setShowContactPage] = useState(false);
  const [showServicesPage, setShowServicesPage] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminSetup, setShowAdminSetup] = useState(false);
  const [showMyOrders, setShowMyOrders] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const [showReturns, setShowReturns] = useState(false);
  
  const [activeDossierCode, setActiveDossierCode] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  
  const { user } = useAuth();
  const { addToCart, clearCart } = useCart();

  useEffect(() => {
    if (user) {
      db.getMyOrders().then(orders => {
        const active = orders.filter(o => !['DELIVERED', 'EXPERIENCE_UNLOCKED', 'CANCELLED'].includes(o.orderStatus));
        setActiveOrders(active);
      });
    } else {
      setActiveOrders([]);
    }
  }, [user, activeDossierCode]);

  useEffect(() => {
    if (!loading && user) {
       const t1 = setTimeout(() => setShowWelcome(true), 1500);
       const t2 = setTimeout(() => setShowWelcome(false), 6000);
       return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [loading, user]);

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/admin' || path === '/admin/dashboard') {
      setShowAdmin(true);
    } else if (path === '/admin/login') {
      setShowAdminLogin(true);
    } else if (path === '/admin/setup') {
      setShowAdminSetup(true);
    }
  }, []);

  const toggleWishlist = (item: WishlistItem) => {
    setWishlistItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const moveWishlistToCart = (item: WishlistItem) => {
    addToCart(item);
    setWishlistItems(prev => prev.filter(i => i.id !== item.id));
  };

  const handleCheckout = () => {
    setShowCheckout(true);
  };

  const handleRegisterDossier = (details: { orderCode: string }) => {
    setActiveDossierCode(details.orderCode);
    clearCart();
    setShowCheckout(false);
  };

  useEffect(() => {
    if (!loading && !showProductPage && !showGamePage && !showCheckout && !activeDossierCode && !showAdmin && !showAdminLogin && !showAdminSetup && !showMyOrders && !showPrivacy && !showTerms && !showShipping && !showReturns && !showArchivePage && !showContactPage && !showServicesPage) {
      document.body.style.overflow = 'auto';
    } else {
      document.body.style.overflow = 'hidden';
    }
  }, [loading, showProductPage, showGamePage, showCheckout, activeDossierCode, showAdmin, showAdminLogin, showAdminSetup, showMyOrders, showPrivacy, showTerms, showShipping, showReturns, showArchivePage, showContactPage, showServicesPage]);

  useEffect(() => {
     const handler = (e: KeyboardEvent) => {
         if (e.ctrlKey && e.shiftKey && e.key === 'A') {
             setShowAdmin(prev => !prev);
         }
     };
     window.addEventListener('keydown', handler);
     return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="relative min-h-screen bg-transparent text-white selection:bg-gold-500/30 selection:text-gold-200">
      
      {/* Global Cinematic Background */}
      <PremiumBackground />

      {!loading && <CustomCursor />}
      
      <AuthModal />

      <AnimatePresence>
        {showWelcome && user && <WelcomeToast name={user.fullName.split(' ')[0]} />}
      </AnimatePresence>

      <div 
        className="pointer-events-none fixed inset-0 z-[60] opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <CartDrawer 
        onCheckout={handleCheckout}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistItems={wishlistItems}
        onRemoveItem={(id) => setWishlistItems(prev => prev.filter(i => i.id !== id))}
        onMoveToCart={moveWishlistToCart}
      />

      <AnimatePresence mode="wait">
        {loading ? (
          <Loader key="loader" onLoadingComplete={() => setLoading(false)} />
        ) : (
          <>
             {showAdminSetup ? (
                <AdminSetupPage
                  key="admin-setup"
                  onSuccess={() => {
                    setShowAdminSetup(false);
                    // Check if auto-login was successful via storage
                    const hasToken = storage.getToken();
                    if (hasToken) {
                        setShowAdmin(true);
                        window.history.pushState({}, '', '/admin/dashboard');
                    } else {
                        setShowAdminLogin(true);
                        window.history.pushState({}, '', '/admin/login');
                    }
                  }}
                  onCancel={() => {
                    setShowAdminSetup(false);
                    window.history.pushState({}, '', '/');
                  }}
                />
             ) : showAdminLogin ? (
                <AdminLoginPage 
                  key="admin-login"
                  onLoginSuccess={() => {
                    setShowAdminLogin(false);
                    setShowAdmin(true);
                    window.history.pushState({}, '', '/admin/dashboard');
                  }}
                  onCancel={() => {
                    setShowAdminLogin(false);
                    window.history.pushState({}, '', '/');
                  }}
                />
             ) : showAdmin ? (
                <AdminRoute key="admin-dash" onExit={() => setShowAdmin(false)}>
                  <AdminDashboard onExit={() => setShowAdmin(false)} />
                </AdminRoute>
             ) : (
                 <>
                 {!(showProductPage || showGamePage || showCheckout || activeDossierCode || showMyOrders || showPrivacy || showTerms || showShipping || showReturns || showArchivePage || showContactPage || showServicesPage) && (
                    <motion.main 
                      key="main-content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                      className="relative z-10"
                    >
                      <Navbar 
                        onOpenWishlist={() => setIsWishlistOpen(true)}
                        onOpenFashionStore={() => setShowProductPage(true)}
                        onOpenCardStore={() => setShowGamePage(true)}
                        onOpenAdmin={() => setShowAdmin(true)}
                        onOpenMyOrders={() => setShowMyOrders(true)}
                        onOpenArchive={() => setShowArchivePage(true)}
                        onOpenContact={() => setShowContactPage(true)}
                        onOpenServices={() => setShowServicesPage(true)}
                      />
                      <Hero />
                      {/* CardShowcase section hidden as requested */}
                      {/* <CardShowcase onEnterGame={() => setShowGamePage(true)} /> */}
                      <FashionStore onEnterStore={() => setShowProductPage(true)} />
                      <About />
                      <Portfolio onEnterShop={() => setShowProductPage(true)} />
                      <Contact />
                      <Footer 
                        onOpenStore={() => setShowProductPage(true)} 
                        onOpenPrivacy={() => setShowPrivacy(true)}
                        onOpenTerms={() => setShowTerms(true)}
                        onOpenShipping={() => setShowShipping(true)}
                        onOpenReturns={() => setShowReturns(true)}
                      />
                    </motion.main>
                 )}

                 <AnimatePresence mode="wait">
                    {showPrivacy && (
                      <PrivacyPolicyPage 
                        key="privacy-page" 
                        onClose={() => setShowPrivacy(false)} 
                      />
                    )}
                    {showTerms && (
                      <TermsPage 
                        key="terms-page" 
                        onClose={() => setShowTerms(false)} 
                      />
                    )}
                    {showShipping && (
                      <ShippingPage 
                        key="shipping-page" 
                        onClose={() => setShowShipping(false)} 
                      />
                    )}
                    {showReturns && (
                      <ReturnsPage 
                        key="returns-page" 
                        onClose={() => setShowReturns(false)} 
                      />
                    )}
                    {showArchivePage && (
                      <ArchivePage 
                        key="archive-page" 
                        onBack={() => setShowArchivePage(false)} 
                      />
                    )}
                    {showContactPage && (
                      <ContactPage 
                        key="contact-page" 
                        onClose={() => setShowContactPage(false)} 
                      />
                    )}
                    {showServicesPage && (
                      <ServicesPage 
                        key="services-page" 
                        onClose={() => setShowServicesPage(false)} 
                        onContact={() => {
                            setShowServicesPage(false);
                            setShowContactPage(true);
                        }}
                      />
                    )}
                    {showProductPage && (
                      <ProductPage 
                        key="product-page"
                        onBack={() => setShowProductPage(false)} 
                        onBuyNow={() => {
                            setShowProductPage(false);
                            setShowCheckout(true);
                        }}
                        onToggleWishlist={toggleWishlist}
                        wishlistItems={wishlistItems}
                      />
                    )}
                    {showGamePage && (
                      <CardGamePage 
                        key="game-page"
                        onBack={() => setShowGamePage(false)}
                      />
                    )}
                    {showCheckout && (
                      <CheckoutPage
                        key="checkout-page"
                        onBack={() => setShowCheckout(false)}
                        onRegisterConciergeOrder={handleRegisterDossier}
                      />
                    )}
                    {activeDossierCode && (
                      <ConciergeInitiatedPage
                        key="confirmation-page"
                        orderCode={activeDossierCode}
                        onBackToGallery={() => setActiveDossierCode(null)}
                      />
                    )}
                    {showMyOrders && (
                      <MyOrdersPage 
                        key="my-orders"
                        onBack={() => setShowMyOrders(false)}
                      />
                    )}
                 </AnimatePresence>
                 </>
             )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <SettingsProvider>
            <AppContent />
          </SettingsProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
