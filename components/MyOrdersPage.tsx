import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Package, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  Copy, 
  ExternalLink, 
  Check, 
  FileText, 
  Crown, 
  Truck, 
  CreditCard, 
  ArrowLeft,
  Mail,
  Instagram,
  MessageCircle,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { db } from '../utils/db';
import { storage } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import { CONCIERGE_CONFIG } from '../utils/conciergeService';
import { Order, ORDER_STATUS_LABELS, ORDER_STATUS_DESCRIPTIONS, ORDER_PHASES, OrderStatus } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MyOrdersPageProps {
  onBack: () => void;
}

const statusMap: Record<string, number> = {
  'ORDER_SECURED': 1,
  'PAYMENT_AUTHORIZED': 2,
  'ORDER_VERIFIED': 3,
  'IN_PRODUCTION': 4,
  'QUALITY_ASSURED': 5,
  'READY_FOR_DISPATCH': 6,
  'DISPATCHED': 7,
  'IN_TRANSIT': 8,
  'ARRIVED_AT_HUB': 9,
  'OUT_FOR_DELIVERY': 10,
  'DELIVERED': 11,
  'EXPERIENCE_UNLOCKED': 12,
  'CANCELLED': 0
};

const OrderTimeline = ({ currentStatus }: { currentStatus: OrderStatus }) => {
  const currentStep = statusMap[currentStatus] ?? 1;

  if (currentStatus === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 text-red-400 bg-red-950/20 px-4 py-3 border border-red-500/20 rounded-sm w-full my-4">
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <span className="text-[10px] uppercase font-mono tracking-widest font-bold">Allocation Cancelled</span>
      </div>
    );
  }

  return (
    <div className="w-full py-4 my-2">
      <div className="relative flex justify-between items-center px-2">
        {/* Background track */}
        <div className="absolute left-4 right-4 top-[8px] h-[2px] bg-white/10 -z-0" />
        
        {/* Active progress */}
        <div 
          className="absolute left-4 top-[8px] h-[2px] bg-gold-500 transition-all duration-700 -z-0" 
          style={{ width: `${Math.min(100, Math.max(5, (currentStep / 11) * 100))}%` }}
        />

        {ORDER_PHASES.map((phase, idx) => {
          const isCompleted = currentStep >= (idx === 0 ? 2 : idx === 1 ? 5 : idx === 2 ? 9 : 11);
          const isCurrent = (
            (idx === 0 && currentStep <= 2) ||
            (idx === 1 && currentStep > 2 && currentStep <= 5) ||
            (idx === 2 && currentStep > 5 && currentStep <= 9) ||
            (idx === 3 && currentStep > 9)
          );

          return (
            <div key={phase.name} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-gold-500 border-gold-400 text-black' 
                    : isCurrent 
                    ? 'bg-black border-gold-400 text-gold-400 ring-4 ring-gold-500/20' 
                    : 'bg-[#0A0A0A] border-white/20 text-white/30'
                }`} 
              >
                {isCompleted ? <Check size={10} strokeWidth={3} /> : <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-gold-400' : 'bg-transparent'}`} />}
              </div>
              <span className={`text-[7.5px] sm:text-[9px] font-mono uppercase tracking-wider text-center transition-colors duration-300 ${
                isCurrent ? 'text-gold-400 font-bold' : isCompleted ? 'text-white/80' : 'text-white/30'
              }`}>
                {phase.name.split(' — ')[1] || phase.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MyOrdersPage: React.FC<MyOrdersPageProps> = ({ onBack }) => {
  const { user, isLoading, openAuthModal } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [orderTab, setOrderTab] = useState<'all' | 'current' | 'delivered'>('all');
  const [updatingChannelOrderId, setUpdatingChannelOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3500);
  };

  // Real-time Firestore sync via subscribeMyOrders (placed before conditional returns to satisfy Rules of Hooks)
  useEffect(() => {
    if (isLoading) return;
    let unsubscribe: () => void = () => {};

    const setupLiveSubscription = async () => {
      try {
        unsubscribe = db.subscribeMyOrders((liveOrders) => {
          setOrders(liveOrders);
          setLoading(false);
        });
      } catch (err) {
        console.warn("Real-time listener setup error:", err);
      }

      try {
        const initialOrders = await db.getMyOrders();
        setOrders(initialOrders);
      } catch (err) {
        console.error("Failed to load initial orders:", err);
      } finally {
        setLoading(false);
      }
    };

    setupLiveSubscription();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isLoading, user?.id]);

  // Link or search for a specific dossier by code or email
  const handleSearchOrLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    try {
      const foundOrder = await db.trackOrder(query);
      if (foundOrder) {
        storage.saveConfirmedOrder(foundOrder);
        storage.saveOrderCode(foundOrder.conciergeCode || foundOrder.code || query);
        setOrders(prev => {
          const exists = prev.some(o => (o.conciergeCode === foundOrder.conciergeCode || o.id === foundOrder.id));
          return exists ? prev : [foundOrder, ...prev];
        });
        showToast("Dossier located & confirmed product synchronized!");
        setSearchQuery('');
        return;
      }

      const localOrder = storage.getConfirmedOrderByCode(query);
      if (localOrder) {
        setOrders(prev => {
          const exists = prev.some(o => (o.conciergeCode === localOrder.conciergeCode || o.id === localOrder.id));
          return exists ? prev : [localOrder, ...prev];
        });
        showToast("Confirmed dossier restored from local registry!");
        setSearchQuery('');
        return;
      }

      showToast("No active dossier found matching that allocation reference.");
    } catch (err) {
      console.error("Search dossier error:", err);
      showToast("Error querying atelier registry.");
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#020202] text-white flex flex-col items-center justify-center p-6 text-center select-none font-mono">
        <div className="w-12 h-12 rounded-full border-2 border-gold-500 border-t-transparent animate-spin mb-4" />
        <span className="text-[10px] text-gold-400 uppercase tracking-[0.3em]">
          VERIFYING ATELIER CREDENTIALS...
        </span>
      </div>
    );
  }

  if (!user && orders.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#020202] text-white flex flex-col items-center justify-center p-6 text-center select-none font-mono">
        <div className="w-16 h-16 rounded-full border border-gold-500/30 flex items-center justify-center mb-6 bg-gold-500/5">
          <ShieldCheck size={24} className="text-gold-500" />
        </div>
        <span className="text-[10px] text-gold-500 uppercase tracking-[0.3em] mb-2">Restricted Chamber</span>
        <h2 className="text-xl sm:text-3xl font-serif text-white mb-3">CLIENT AUTHENTICATION OR DOSSIER CODE</h2>
        <p className="text-xs sm:text-sm text-white/50 max-w-md mb-6 leading-relaxed font-sans">
          Log in to view your registered dossiers automatically, or enter your unique Allocation Code (e.g. DEUZ-XXXX-XXXX) to track an active order.
        </p>
        <form onSubmit={handleSearchOrLink} className="flex items-center gap-2 w-full max-w-md mb-6">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter DEUZ Allocation Code..." 
            className="flex-1 bg-black border border-white/20 focus:border-gold-500 text-xs text-white px-4 py-3 rounded-sm font-mono tracking-wider outline-none uppercase"
          />
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-5 py-3 bg-gold-500 hover:bg-gold-400 disabled:opacity-40 text-black text-[10px] font-mono uppercase font-bold tracking-widest rounded-sm transition-all shrink-0 cursor-pointer"
          >
            {isSearching ? 'Locating...' : 'Track'}
          </button>
        </form>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none justify-center">
          <button 
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-3 border border-white/20 text-white/70 hover:text-white uppercase tracking-widest text-[10px] transition-colors cursor-pointer"
          >
            Return to Gallery
          </button>
          <button 
            onClick={() => {
              onBack();
              openAuthModal('login');
            }}
            className="w-full sm:w-auto px-6 py-3 bg-white text-black hover:bg-gold-500 hover:text-white uppercase tracking-widest text-[10px] font-bold transition-colors cursor-pointer"
          >
            Authenticate / Log In
          </button>
        </div>
      </div>
    );
  }

  if (user && user.authProvider === 'google' && user.profileCompleted === false) {
    return (
      <div className="fixed inset-0 z-50 bg-[#020202] text-white flex flex-col items-center justify-center p-6 text-center select-none font-mono">
        <div className="w-16 h-16 rounded-full border border-gold-500/30 flex items-center justify-center mb-6 bg-gold-500/5">
          <ShieldCheck size={24} className="text-gold-500" />
        </div>
        <span className="text-[10px] text-gold-500 uppercase tracking-[0.3em] mb-2">Additional Registration Required</span>
        <h2 className="text-xl sm:text-3xl font-serif text-white mb-3">COMPLETE YOUR CLIENT DOSSIER</h2>
        <p className="text-xs sm:text-sm text-white/50 max-w-md mb-8 leading-relaxed font-sans">
          Please complete your additional Client Dossier registration details before accessing private order archives.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none justify-center">
          <button 
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-3 border border-white/20 text-white/70 hover:text-white uppercase tracking-widest text-[10px] transition-colors cursor-pointer"
          >
            Return to Gallery
          </button>
          <button 
            onClick={() => {
              onBack();
              openAuthModal('signup');
            }}
            className="w-full sm:w-auto px-6 py-3 bg-gold-500 text-black hover:bg-gold-400 uppercase tracking-widest text-[10px] font-bold transition-colors cursor-pointer"
          >
            Complete Dossier Registration
          </button>
        </div>
      </div>
    );
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast("Allocation code copied to clipboard");
  };

  // Switch confirmation channel for an order
  const handleSwitchChannel = async (order: Order, newChannel: 'gmail' | 'instagram' | 'private') => {
    const orderRefId = order._id || order.id || order.conciergeCode;
    const code = order.conciergeCode || order.code || orderRefId;
    setUpdatingChannelOrderId(orderRefId);

    try {
      await db.updateOrderChannel(orderRefId, newChannel);

      // Build dossier text
      const itemsList = (order.items || []).map((it: any, idx: number) => 
        `${idx + 1}. ${it.title} [${it.houseCode || 'HC'}] (Size: ${it.selectedSize || it.size || 'STD'} x${it.quantity || 1}) - INR ${((it.price || 0) * (it.quantity || 1)).toLocaleString('en-IN')}`
      ).join('\n');

      const dossierText = `DEUZ & CO. ALLOCATION DOSSIER\nREF: ${code}\nSTATUS: ${ORDER_STATUS_LABELS[order.orderStatus as OrderStatus] || order.orderStatus}\nTOTAL: INR ${(order.totalAmount || order.total || 0).toLocaleString('en-IN')}\n\nITEMS:\n${itemsList}`;

      await navigator.clipboard.writeText(dossierText).catch(() => {});

      if (newChannel === 'gmail') {
        const subject = encodeURIComponent(`DEUZ & CO. Acquisition Dossier - ${code}`);
        const body = encodeURIComponent(dossierText);
        const targetEmail = CONCIERGE_CONFIG.emailAddress || 'deuzandco@gmail.com';
        window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
      } else if (newChannel === 'instagram') {
        const igHandle = CONCIERGE_CONFIG.instagramHandle || 'deuzandco';
        window.open(`https://ig.me/m/${igHandle}`, '_blank', 'noopener,noreferrer');
      }

      // Optimistic update
      setOrders(prev => prev.map(o => (o._id === orderRefId || o.id === orderRefId) ? { ...o, contactMethod: newChannel } : o));
      showToast(`Switched channel to ${newChannel.toUpperCase()}! Dossier copied.`);
    } catch (e) {
      console.error(e);
      showToast("Channel update recorded.");
    } finally {
      setUpdatingChannelOrderId(null);
    }
  };

  // Download PDF Invoice
  const handleDownloadPDF = (order: Order) => {
    try {
      const doc = new jsPDF();
      const code = order.conciergeCode || order.code || order._id;

      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, 210, 45, 'F');

      doc.setTextColor(212, 175, 55);
      doc.setFont('times', 'bold');
      doc.setFontSize(22);
      doc.text('DEUZ & CO.', 105, 20, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text('NOT FOR EVERYONE — ATELIER ACQUISITION DOSSIER', 105, 28, { align: 'center' });
      doc.text(`AUTHENTICATION CODE: ${code}`, 105, 35, { align: 'center' });

      doc.setTextColor(40, 40, 40);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ALLOCATION SUMMARY', 14, 58);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`Date Registered: ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB')}`, 14, 66);
      doc.text(`Current Status: ${ORDER_STATUS_LABELS[order.orderStatus as OrderStatus] || order.orderStatus}`, 14, 73);
      doc.text(`Channel: ${(order.contactMethod || 'private').toUpperCase()}`, 14, 80);

      const itemData = (order.items || []).map((it: any, idx: number) => [
        `${idx + 1}. ${it.title}`,
        it.houseCode ? `[${it.houseCode}]` : 'ATELIER',
        it.selectedSize || it.size || 'Standard',
        (it.quantity || 1).toString(),
        `INR ${((it.price || 0) * (it.quantity || 1)).toLocaleString('en-IN')}`
      ]);

      autoTable(doc, {
        startY: 95,
        head: [['ARTIFACT', 'HOUSE CODE', 'SIZE', 'QTY', 'VALUE']],
        body: itemData,
        theme: 'striped',
        headStyles: { fillColor: [15, 15, 15], textColor: [212, 175, 55], fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 70 },
          4: { halign: 'right' }
        }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 140;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 15, 15);
      doc.text(`TOTAL VALUE: INR ${(order.totalAmount || order.total || 0).toLocaleString('en-IN')}`, 196, finalY + 12, { align: 'right' });

      doc.save(`DEUZ-DOSSIER-${code}.pdf`);
      showToast("Invoice PDF saved.");
    } catch (e) {
      console.error(e);
      showToast("Failed to download PDF.");
    }
  };

  const getStatusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
      case 'PAYMENT_AUTHORIZED':
      case 'DELIVERED':
      case 'EXPERIENCE_UNLOCKED':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
      case 'IN_PRODUCTION':
      case 'QUALITY_ASSURED':
        return 'bg-amber-950/60 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]';
      case 'READY_FOR_DISPATCH':
      case 'DISPATCHED':
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        return 'bg-sky-950/60 text-sky-400 border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.2)]';
      case 'CANCELLED':
        return 'bg-red-950/60 text-red-400 border-red-500/40';
      case 'ORDER_SECURED':
      default:
        return 'bg-gold-500/15 text-gold-400 border-gold-500/40 shadow-[0_0_12px_rgba(212,175,55,0.2)]';
    }
  };

  const filteredOrders = orders.filter(o => {
    if (orderTab === 'all') return true;
    if (orderTab === 'current') return ['ORDER_SECURED', 'PAYMENT_AUTHORIZED', 'ORDER_VERIFIED', 'IN_PRODUCTION', 'QUALITY_ASSURED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'IN_TRANSIT', 'ARRIVED_AT_HUB', 'OUT_FOR_DELIVERY'].includes(o.orderStatus);
    if (orderTab === 'delivered') return ['DELIVERED', 'EXPERIENCE_UNLOCKED'].includes(o.orderStatus);
    return true;
  });

  const latestConfirmedOrder = orders.find(o => o.items && o.items.length > 0);
  const latestConfirmedProduct = latestConfirmedOrder?.items?.[0];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#040404] overflow-y-auto overflow-x-hidden"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-8 left-1/2 z-[100] bg-gold-500 text-black px-6 py-3 rounded-sm font-mono text-xs font-bold uppercase tracking-widest shadow-2xl flex items-center gap-2"
          >
            <Check size={16} />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 flex justify-between items-center bg-[#070707]/95 backdrop-blur-md border-b border-white/10">
        <button 
          onClick={onBack} 
          className="group flex items-center gap-2.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold-500/50 text-white hover:text-gold-400 font-mono text-xs uppercase tracking-widest rounded-sm transition-all cursor-pointer"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>RETURN TO HOME</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-white/50 uppercase tracking-[0.2em] hidden sm:inline">
            Executive Admin Desk • Real-Time Sync
          </span>
          <button onClick={onBack} className="p-2 text-white/40 hover:text-white transition-colors cursor-pointer" title="Close">
            <X size={20} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-8">
        
        {/* HERO TITLE SECTION */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown size={16} className="text-gold-400" />
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-gold-400 font-semibold">
                DEUZ & CO. PRIVATE REGISTRY
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif text-white uppercase tracking-wider">
              My Acquisition Dossiers
            </h1>
            <p className="text-xs text-white/50 font-light mt-1 max-w-xl">
              Real-time synchronization with our Executive Atelier Desk. Monitor crafting, quality control, carrier tracking, and switch confirmation methods anytime.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-black border border-gold-500/30 rounded-sm font-mono text-xs text-gold-400">
              {orders.length} Registered Allocation{orders.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* DOSSIER LOOKUP & LINK BAR */}
        <div className="bg-[#0A0A0A] border border-white/10 p-4 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Search size={16} className="text-gold-400 shrink-0" />
            <div className="text-left">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white block font-bold">
                Link or Search Dossier
              </span>
              <span className="text-[9px] font-mono text-white/40 block">
                Synchronize confirmed product via Allocation Code (e.g., DEUZ-XXXX-XXXX)
              </span>
            </div>
          </div>

          <form onSubmit={handleSearchOrLink} className="flex items-center gap-2 w-full sm:w-auto">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter DEUZ Code..." 
              className="bg-black border border-white/20 focus:border-gold-500 text-xs text-white px-3 py-2 rounded-sm font-mono tracking-wider outline-none w-full sm:w-64 uppercase"
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-40 text-black text-[10px] font-mono uppercase font-bold tracking-widest rounded-sm transition-all shrink-0 cursor-pointer"
            >
              {isSearching ? 'Querying...' : 'Link'}
            </button>
          </form>
        </div>

        {/* LATEST CONFIRMED PRODUCT SPOTLIGHT HERO */}
        {latestConfirmedProduct && (
          <div className="bg-gradient-to-r from-gold-950/40 via-[#0B0B0B] to-[#0D0D0D] border border-gold-500/40 rounded-sm p-6 relative overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.08)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-20 h-24 sm:w-24 sm:h-28 bg-black border border-gold-500/40 rounded-sm overflow-hidden shrink-0 shadow-lg relative group">
                  <img 
                    src={latestConfirmedProduct.image || (latestConfirmedProduct as any).product?.image || 'https://ik.imagekit.io/dto1zguat/Evolve_4.jpg'} 
                    alt={latestConfirmedProduct.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://ik.imagekit.io/dto1zguat/Evolve_4.jpg'; }}
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/90 text-[8px] font-mono text-gold-400 rounded">
                    CONFIRMED
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono text-gold-400 uppercase tracking-widest px-2 py-0.5 bg-gold-400/10 border border-gold-400/30 rounded">
                      {latestConfirmedProduct.houseCode || 'DEUZ-ATELIER'}
                    </span>
                    {latestConfirmedProduct.selectedSize && (
                      <span className="text-[9px] font-mono text-white/70 uppercase tracking-wider px-2 py-0.5 bg-white/5 border border-white/10 rounded">
                        SIZE: {latestConfirmedProduct.selectedSize}
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      CONFIRMED IN DOSSIER
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-serif text-white font-medium">
                    {latestConfirmedProduct.title}
                  </h2>

                  <p className="text-xs font-mono text-white/50">
                    Allocation Reference: <span className="text-gold-400 font-bold">{latestConfirmedOrder.conciergeCode || latestConfirmedOrder.code}</span> • Qty: {latestConfirmedProduct.quantity || 1} • Unit Valuation: ₹{(latestConfirmedProduct.price || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
                <div className="text-left sm:text-right">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 block">
                    TOTAL DOSSIER VALUATION
                  </span>
                  <span className="text-2xl font-serif font-bold text-gold-400">
                    ₹{((latestConfirmedOrder.totalAmount || latestConfirmedOrder.total || 0)).toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={() => handleDownloadPDF(latestConfirmedOrder)}
                  className="px-4 py-2 bg-white/5 hover:bg-gold-500 hover:text-black border border-gold-500/40 text-gold-400 text-[10px] font-mono uppercase font-bold tracking-widest rounded-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText size={12} />
                  <span>DOWNLOAD INVOICE PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB FILTERS */}
        <div className="flex flex-wrap gap-2.5 border-b border-white/10 pb-4">
          {[
            { 
              id: 'all', 
              label: `All (${orders.length})` 
            },
            { 
              id: 'current', 
              label: `Current (${orders.filter(o => ['ORDER_SECURED', 'PAYMENT_AUTHORIZED', 'ORDER_VERIFIED', 'IN_PRODUCTION', 'QUALITY_ASSURED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'IN_TRANSIT', 'ARRIVED_AT_HUB', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)).length})` 
            },
            { 
              id: 'delivered', 
              label: `Delivered (${orders.filter(o => ['DELIVERED', 'EXPERIENCE_UNLOCKED'].includes(o.orderStatus)).length})` 
            }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setOrderTab(tab.id as any)}
              className={`px-5 py-2.5 text-[10px] sm:text-xs uppercase font-mono tracking-widest rounded-sm transition-all cursor-pointer ${
                orderTab === tab.id 
                  ? 'bg-gold-500 text-black font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                  : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-12 h-12 border-2 border-white/10 border-t-gold-500 rounded-full animate-spin" />
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest animate-pulse">
              Connecting to Deuz Executive Registry...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-16 text-center border border-white/10 bg-[#0A0A0A] rounded-sm p-8 space-y-4">
            <Search size={44} className="text-gold-400/40 mb-2" />
            <h2 className="text-xl font-serif text-white uppercase tracking-wider">No Dossiers Located</h2>
            <p className="text-white/40 text-xs max-w-md font-light">
              No allocations found under the "{orderTab.toUpperCase()}" filter. You can link an existing allocation code above or explore our boutique collection.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={onBack}
                className="px-6 py-3 bg-gold-500 hover:bg-gold-400 text-black font-mono text-xs uppercase font-bold tracking-widest rounded-sm transition-all cursor-pointer"
              >
                EXPLORE ATELIER COLLECTION
              </button>
            </div>
          </div>
        ) : (
          /* ORDERS LIST */
          <div className="space-y-8">
            {filteredOrders.map((order) => {
              const currentStatus = (order.orderStatus || 'ORDER_SECURED') as OrderStatus;
              const activeMethod = (order.contactMethod || 'private').toLowerCase();
              const code = order.conciergeCode || order.code || order._id;

              return (
                <motion.div 
                  key={order.id || order._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0A0A0A] border border-white/10 hover:border-gold-500/40 rounded-sm overflow-hidden transition-all duration-300 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative group"
                >
                  {/* Top Gold Accent Bar */}
                  <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />

                  {/* DOSSIER HEADER */}
                  <div className="p-6 sm:p-8 border-b border-white/10 bg-white/[0.01] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl sm:text-2xl font-mono font-bold text-gold-400 tracking-wider">
                          {code}
                        </span>
                        <button 
                          onClick={() => handleCopyCode(code)} 
                          className="p-1.5 bg-white/5 hover:bg-gold-500 hover:text-black text-white/50 rounded transition-colors"
                          title="Copy Allocation Code"
                        >
                          <Copy size={13} />
                        </button>
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-white/60 text-[9px] font-mono uppercase tracking-wider rounded">
                          {activeMethod === 'gmail' ? 'Gmail' : activeMethod === 'instagram' ? 'Instagram' : 'Private Concierge'}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/40 uppercase font-mono tracking-widest flex items-center gap-2">
                        <Clock size={11} className="text-white/40" />
                        <span>Registered on {new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* LIVE STATUS PILL */}
                    <div className="flex flex-col sm:items-end gap-1.5">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">
                        Live Lifecycle Status
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </div>
                        <span className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-sm border ${getStatusBadgeStyle(currentStatus)}`}>
                          {ORDER_STATUS_LABELS[currentStatus] || currentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DOSSIER BODY */}
                  <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT & CENTER: ARTIFACT DETAILS, TIMELINE & NOTES */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Products List (USER REQUEST: show the product and current status after confirming order) */}
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block mb-3">
                          Acquired Artifacts ({order.items?.length || 0})
                        </span>

                        <div className="space-y-4">
                          {(order.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between gap-4 p-4 bg-black/60 border border-white/10 hover:border-gold-500/30 transition-colors rounded-sm">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-20 bg-black border border-gold-500/30 rounded-sm overflow-hidden shrink-0 relative">
                                  <img 
                                    src={item.image || item.product?.image || (item.gallery && item.gallery[0]) || 'https://ik.imagekit.io/dto1zguat/Evolve_4.jpg'} 
                                    alt={item.title} 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://ik.imagekit.io/dto1zguat/Evolve_4.jpg'; }}
                                  />
                                  <div className="absolute bottom-0 inset-x-0 bg-black/90 text-[7px] font-mono text-center text-gold-400 py-0.5 uppercase tracking-wider">
                                    CONFIRMED
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-1.5 py-0.5 bg-gold-500/10 text-gold-400 text-[9px] font-mono uppercase tracking-wider border border-gold-500/20 rounded">
                                      {item.houseCode ? `[${item.houseCode}]` : 'ATELIER'}
                                    </span>
                                    {item.selectedSize && (
                                      <span className="px-1.5 py-0.5 bg-white/10 text-white text-[9px] font-mono uppercase tracking-wider rounded">
                                        SIZE: {item.selectedSize}
                                      </span>
                                    )}
                                    <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 text-[8px] font-mono uppercase tracking-wider border border-emerald-500/30 rounded flex items-center gap-1">
                                      <Check size={8} /> CONFIRMED ALLOCATION
                                    </span>
                                  </div>
                                  <p className="text-white font-serif text-sm sm:text-base font-medium">
                                    {item.title}
                                  </p>
                                  <p className="text-white/50 text-xs font-mono">
                                    Qty: <span className="text-white font-bold">{item.quantity || 1}</span> • Unit: ₹{(item.price || 0).toLocaleString('en-IN')}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-[9px] font-mono text-white/40 block mb-0.5 uppercase">SUBTOTAL</span>
                                <span className="text-sm sm:text-base font-serif font-bold text-gold-400">
                                  ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 4-Phase Progression Stepper */}
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block mb-2">
                          Atelier Lifecycle Stepper
                        </span>
                        <OrderTimeline currentStatus={currentStatus} />
                      </div>

                      {/* Status Description from Admin */}
                      <div className="bg-white/[0.02] border border-white/10 p-4 rounded-sm flex items-start gap-3">
                        <AlertCircle size={16} className="text-gold-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-gold-400 block mb-1">
                            Curator Status Briefing
                          </span>
                          <p className="text-xs text-white/70 font-light leading-relaxed">
                            {ORDER_STATUS_DESCRIPTIONS[currentStatus] || "Your allocation is being monitored by our curators."}
                          </p>
                        </div>
                      </div>

                      {/* Tracking / Logistics (if entered by Admin) */}
                      {order.trackingInfo && order.trackingInfo.trackingNumber && (
                        <div className="bg-sky-950/20 border border-sky-500/30 p-4 rounded-sm flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Truck size={18} className="text-sky-400" />
                            <div>
                              <span className="text-[9px] font-mono uppercase tracking-wider text-sky-400 block">
                                Express Freight • {order.trackingInfo.carrier || 'Courier'}
                              </span>
                              <span className="text-xs font-mono text-white font-bold">
                                Waybill: {order.trackingInfo.trackingNumber}
                              </span>
                            </div>
                          </div>
                          {order.trackingInfo.trackingUrl && (
                            <a 
                              href={order.trackingInfo.trackingUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-sky-500 hover:bg-white text-black font-mono text-[10px] uppercase font-bold tracking-wider rounded-sm transition-colors flex items-center gap-1"
                            >
                              <span>TRACK</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Payment Link (if issued by Admin) */}
                      {order.paymentLink && currentStatus === 'ORDER_SECURED' && (
                        <div className="bg-emerald-950/30 border border-emerald-500/40 p-4 rounded-sm flex items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                              Payment Link Active
                            </span>
                            <span className="text-xs text-white/60">
                              Official invoice link generated by curator desk.
                            </span>
                          </div>
                          <a
                            href={order.paymentLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-emerald-500 hover:bg-white text-black font-mono text-xs uppercase font-bold tracking-wider rounded-sm transition-colors flex items-center gap-1.5 shadow-md"
                          >
                            <CreditCard size={13} />
                            <span>PAY NOW</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* RIGHT COLUMN: FINANCIAL SUMMARY, CHANNEL SWITCHER & ACTIONS */}
                    <div className="border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-between space-y-6">
                      
                      <div className="space-y-6">
                        {/* Financial summary */}
                        <div className="bg-black/40 p-4 border border-white/5 rounded-sm">
                          <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block mb-1">
                            Total Registered Value
                          </span>
                          <span className="text-2xl font-serif font-bold text-gold-400 block">
                            ₹{(order.totalAmount || order.total || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
                            <ShieldCheck size={11} /> Complimentary Express Freight
                          </span>
                        </div>

                        {/* Shipping Coordinates preview */}
                        {order.shippingAddress && (
                          <div>
                            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block mb-1">
                              Delivery Coordinates
                            </span>
                            <p className="text-xs text-white/80 font-mono font-semibold">
                              {order.shippingAddress.fullName}
                            </p>
                            <p className="text-xs text-white/50 font-light">
                              {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                            </p>
                            <p className="text-xs text-white/40 font-mono mt-0.5">
                              {order.shippingAddress.mobile}
                            </p>
                          </div>
                        )}

                        {/* CHANGE CONFIRMATION METHOD (USER REQUEST: allow users to change confirmation method even after selecting one) */}
                        <div className="pt-4 border-t border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-white/50">
                              Confirmation Channel
                            </span>
                            <span className="text-[9px] font-mono text-gold-400 font-bold uppercase">
                              {activeMethod}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              onClick={() => handleSwitchChannel(order, 'gmail')}
                              disabled={updatingChannelOrderId === (order._id || order.id)}
                              className={`p-2 rounded-sm border text-center transition-all cursor-pointer ${
                                activeMethod === 'gmail' 
                                  ? 'bg-gold-500/20 border-gold-400 text-gold-300' 
                                  : 'bg-black/50 border-white/10 text-white/50 hover:text-white hover:border-white/30'
                              }`}
                              title="Switch to Gmail"
                            >
                              <Mail size={14} className="mx-auto mb-1" />
                              <span className="text-[8px] font-mono uppercase block font-bold">Gmail</span>
                            </button>

                            <button
                              onClick={() => handleSwitchChannel(order, 'instagram')}
                              disabled={updatingChannelOrderId === (order._id || order.id)}
                              className={`p-2 rounded-sm border text-center transition-all cursor-pointer ${
                                activeMethod === 'instagram' 
                                  ? 'bg-pink-500/20 border-pink-400 text-pink-300' 
                                  : 'bg-black/50 border-white/10 text-white/50 hover:text-white hover:border-white/30'
                              }`}
                              title="Switch to Instagram"
                            >
                              <Instagram size={14} className="mx-auto mb-1" />
                              <span className="text-[8px] font-mono uppercase block font-bold">Instagram</span>
                            </button>

                            <button
                              onClick={() => handleSwitchChannel(order, 'private')}
                              disabled={updatingChannelOrderId === (order._id || order.id)}
                              className={`p-2 rounded-sm border text-center transition-all cursor-pointer ${
                                activeMethod === 'private' 
                                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' 
                                  : 'bg-black/50 border-white/10 text-white/50 hover:text-white hover:border-white/30'
                              }`}
                              title="Switch to Private Concierge"
                            >
                              <MessageCircle size={14} className="mx-auto mb-1" />
                              <span className="text-[8px] font-mono uppercase block font-bold">Private</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="space-y-2 pt-4 border-t border-white/10">
                        <button
                          onClick={() => handleDownloadPDF(order)}
                          className="w-full py-3 bg-white/5 hover:bg-gold-500 hover:text-black border border-gold-500/30 text-gold-400 font-mono text-xs uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer font-bold"
                        >
                          <FileText size={14} />
                          <span>DOWNLOAD INVOICE PDF</span>
                        </button>
                      </div>

                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* RETURN TO HOME BUTTON (USER REQUEST: add a return to home button after confirming order) */}
        <div className="pt-8 pb-16 flex justify-center">
          <button
            onClick={onBack}
            className="px-10 py-4 bg-white hover:bg-gold-500 text-black font-mono font-bold text-xs uppercase tracking-[0.25em] rounded-sm transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center gap-2 cursor-pointer group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
            <span>RETURN TO HOME / ATELIER</span>
          </button>
        </div>

      </main>
    </motion.div>
  );
};

export default MyOrdersPage;
