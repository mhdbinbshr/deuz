import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Crown, 
  CreditCard, 
  ArrowRight, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  MessageCircle, 
  Mail, 
  Instagram, 
  Home, 
  FileText, 
  Sparkles, 
  MapPin, 
  RefreshCw,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Order, OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_DESCRIPTIONS, ORDER_PHASES } from '../types';
import { db } from '../utils/db';
import { CONCIERGE_CONFIG } from '../utils/conciergeService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ConciergeInitiatedPageProps {
  orderCode: string;
  onBackToGallery: () => void;
}

const ORDER_STATUS_PROGRESS: Record<string, number> = {
  'ORDER_SECURED': 0,
  'PAYMENT_AUTHORIZED': 1,
  'ORDER_VERIFIED': 2,
  'IN_PRODUCTION': 3,
  'QUALITY_ASSURED': 4,
  'READY_FOR_DISPATCH': 5,
  'DISPATCHED': 6,
  'IN_TRANSIT': 7,
  'ARRIVED_AT_HUB': 8,
  'OUT_FOR_DELIVERY': 9,
  'DELIVERED': 10,
  'EXPERIENCE_UNLOCKED': 11,
  'CANCELLED': -1
};

const ConciergeInitiatedPage: React.FC<ConciergeInitiatedPageProps> = ({ orderCode, onBackToGallery }) => {
  const [dossier, setDossier] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUpdatingChannel, setIsUpdatingChannel] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Real-time listener: updates automatically when Admin updates order status
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = db.subscribeOrder(orderCode, (data) => {
      if (isMounted && data) {
        setDossier(data);
        setLoading(false);
      }
    });

    // Initial fallback fetch
    db.trackOrder(orderCode)
      .then((data) => {
        if (isMounted && data) {
          setDossier(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          // Keep waiting for listener or display notice after timeout
          setTimeout(() => {
            if (isMounted && !dossier) {
              setError('Unable to verify dossier integrity. Please check your connection.');
              setLoading(false);
            }
          }, 2000);
        }
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [orderCode]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Order Code ${code} copied to clipboard`);
  };

  // Allow user to change the confirmation method even after selecting one
  const handleChangeChannel = async (newChannel: 'gmail' | 'instagram' | 'whatsapp' | 'private') => {
    if (!dossier) return;
    setIsUpdatingChannel(true);
    try {
      const orderId = dossier._id || dossier.id || orderCode;
      await db.updateOrderChannel(orderId, newChannel);
      setDossier(prev => prev ? { ...prev, contactMethod: newChannel } : null);
      
      const channelTitles: Record<string, string> = {
        gmail: 'Gmail Concierge',
        instagram: 'Instagram Direct',
        whatsapp: 'WhatsApp Fast-lane',
        private: 'Private Atelier Desk'
      };

      showToast(`Confirmation method updated to ${channelTitles[newChannel]}`);
    } catch (e) {
      console.error(e);
      showToast('Failed to update confirmation method');
    } finally {
      setIsUpdatingChannel(false);
    }
  };

  const getDossierSummaryText = () => {
    if (!dossier) return '';
    const itemsList = (dossier.items || []).map((item, idx) => 
      `${idx + 1}. ${item.title} (Size: ${item.selectedSize || 'STD'}, Qty: ${item.quantity}, Price: INR ${(item.price * item.quantity).toLocaleString('en-IN')}${item.houseCode ? `, House Code: ${item.houseCode}` : ''})`
    ).join('\n');

    const address = dossier.shippingAddress;
    const addressStr = address 
      ? `${address.fullName || ((address as any).firstName + ' ' + (address as any).lastName)}\n${(address as any).address || address.house + ', ' + address.street}, ${address.city}, ${address.state} - ${address.pincode}\nMobile: ${address.mobile || (address as any).phone || 'N/A'}\nEmail: ${address.email}`
      : 'Address recorded in atelier registry';

    return `=== DEUZ & CO. ATELIER ACQUISITION DOSSIER ===\nUNIQUE PURCHASE CODE: ${dossier.conciergeCode || orderCode}\nTOTAL VALUE: INR ${(dossier.totalAmount || dossier.total || 0).toLocaleString('en-IN')}\n\nARTIFACT DETAILS:\n${itemsList}\n\nINSURED SHIPPING COORDINATES:\n${addressStr}\n\nCONFIRMATION CHANNEL: ${(dossier.contactMethod || 'private').toUpperCase()}\nSTATUS: ${dossier.orderStatus || 'ORDER_SECURED'}\n===========================================`;
  };

  const handleLaunchCurrentChannel = () => {
    if (!dossier) return;
    const text = getDossierSummaryText();
    const code = dossier.conciergeCode || orderCode;
    const method = dossier.contactMethod || 'private';

    if (method === 'gmail') {
      const subject = encodeURIComponent(`DEUZ ATELIER ACQUISITION — ${code}`);
      const body = encodeURIComponent(text);
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONCIERGE_CONFIG.emailAddress)}&su=${subject}&body=${body}`;
      navigator.clipboard.writeText(text);
      showToast("Order dossier copied! Opening Gmail...");
      window.open(gmailUrl, '_blank');
    } else if (method === 'instagram') {
      navigator.clipboard.writeText(text);
      showToast("Order dossier copied! Opening Instagram DM...");
      window.open(`https://ig.me/m/${CONCIERGE_CONFIG.instagramHandle}`, '_blank');
    } else if (method === 'whatsapp') {
      const waUrl = `https://wa.me/${CONCIERGE_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
      navigator.clipboard.writeText(text);
      showToast("Order dossier copied! Opening WhatsApp...");
      window.open(waUrl, '_blank');
    } else {
      navigator.clipboard.writeText(text);
      showToast("Dossier confirmed! Transmitted to Executive Admin Desk.");
    }
  };

  const handleDownloadInvoice = () => {
    if (!dossier) return;
    const doc = new jsPDF();
    doc.setFillColor(5, 5, 5);
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('DEUZ & CO.', 105, 26, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 180, 180);
    doc.text('HAUTE COUTURE & PRIVATE ARCHIVAL ATELIER', 105, 33, { align: 'center' });
    
    doc.setDrawColor(60, 60, 60);
    doc.line(20, 40, 190, 40);
    
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(212, 175, 55);
    doc.text(`UNIQUE ALLOCATION CODE: ${dossier.conciergeCode || orderCode}`, 20, 50);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(220, 220, 220);
    doc.text(`DATE ISSUED: ${new Date(dossier.createdAt || Date.now()).toLocaleDateString('en-GB')}`, 20, 58);
    doc.text(`ATELIER STATUS: ${ORDER_STATUS_LABELS[dossier.orderStatus as OrderStatus] || dossier.orderStatus}`, 20, 65);
    doc.text(`CONFIRMATION CHANNEL: ${(dossier.contactMethod || 'Private Desk').toUpperCase()}`, 20, 72);
    
    const addr = dossier.shippingAddress;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(212, 175, 55);
    doc.text('INSURED DELIVERY COORDINATES:', 115, 50);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text(addr ? (addr.fullName || `${addr.firstName || ''} ${addr.lastName || ''}`) : 'Client on record', 115, 58);
    doc.setTextColor(180, 180, 180);
    if (addr) {
      doc.text(`${(addr as any).address || addr.house || ''}`, 115, 65);
      doc.text(`${addr.city || ''}, ${addr.state || ''} ${addr.pincode || ''}`, 115, 72);
      doc.text(`Phone: ${addr.mobile || (addr as any).phone || 'N/A'}`, 115, 79);
    }
    
    const itemData = (dossier.items || []).map((item, idx) => [
      `${idx + 1}. ${item.title}`,
      item.houseCode ? `[${item.houseCode}]` : 'ATELIER',
      item.selectedSize || 'STD',
      (item.quantity || 1).toString(),
      `INR ${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}`
    ]);
    
    autoTable(doc, {
      startY: 90,
      head: [['ARTIFACT / PRODUCT', 'HOUSE CODE', 'SIZE', 'QTY', 'VALUE']],
      body: itemData,
      theme: 'plain',
      styles: { 
        fillColor: [10, 10, 10], 
        textColor: [220, 220, 220],
        fontSize: 8.5,
        cellPadding: 5,
        lineColor: [40, 40, 40],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [20, 20, 20], 
        textColor: [212, 175, 55],
        fontStyle: 'bold'
      }
    });
    
    const finalY = (doc as any).lastAutoTable?.finalY || 140;
    doc.setDrawColor(60, 60, 60);
    doc.line(115, finalY + 8, 190, finalY + 8);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL VALUE:', 115, finalY + 18);
    doc.setTextColor(212, 175, 55);
    doc.text(`INR ${(dossier.totalAmount || dossier.total || 0).toLocaleString('en-IN')}`, 190, finalY + 18, { align: 'right' });
    
    doc.save(`DEUZ_DOSSIER_${dossier.conciergeCode || orderCode}.pdf`);
    showToast("Official Invoice PDF downloaded");
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[80] bg-[#030303] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-white/10 border-t-gold-400 rounded-full animate-spin" />
          <span className="text-white/60 font-mono text-xs uppercase tracking-[0.3em] animate-pulse">
            Verifying Atelier Dossier Integrity...
          </span>
        </div>
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="fixed inset-0 z-[80] bg-[#030303] flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-[#0A0A0A] border border-white/10 p-8 rounded-sm">
          <div className="flex justify-center mb-6">
            <AlertCircle size={36} className="text-gold-400" />
          </div>
          <h2 className="text-white font-serif text-xl tracking-widest uppercase mb-3">Dossier Registered</h2>
          <p className="text-white/60 text-xs font-mono mb-8">
            Your purchase reference: <span className="text-gold-400">{orderCode}</span>.
            {error || 'Our atelier servers are syncing your allocation.'}
          </p>
          <button 
            onClick={onBackToGallery} 
            className="w-full py-3.5 bg-white hover:bg-gold-400 text-black font-mono font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <Home size={15} />
            <span>RETURN TO HOME</span>
          </button>
        </div>
      </div>
    );
  }

  const currentStatus = dossier.orderStatus || 'ORDER_SECURED';
  const currentStepProgress = ORDER_STATUS_PROGRESS[currentStatus] ?? 0;
  const statusLabel = ORDER_STATUS_LABELS[currentStatus as OrderStatus] || currentStatus;
  const statusDescription = ORDER_STATUS_DESCRIPTIONS[currentStatus as OrderStatus] || "Your allocation is being handled with priority by the atelier concierge.";

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-[#030303] text-white flex flex-col overflow-y-auto"
    >
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 bg-gold-400 text-black font-mono text-xs font-bold uppercase tracking-widest rounded-sm shadow-[0_10px_30px_rgba(212,175,55,0.4)] flex items-center gap-2"
          >
            <Check size={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation Bar with RETURN TO HOME */}
      <header className="sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between">
        <button 
          onClick={onBackToGallery}
          className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-gold-400 hover:text-black border border-white/10 rounded-sm text-white/80 transition-all text-xs font-mono uppercase tracking-[0.2em]"
          title="Return directly to the homepage"
        >
          <Home size={15} />
          <span>RETURN TO HOME</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
          <span className="font-serif tracking-[0.25em] text-xs sm:text-sm uppercase text-gold-400">
            MY DOSSIER • CONFIRMED
          </span>
        </div>

        <button
          onClick={handleDownloadInvoice}
          className="hidden sm:flex items-center gap-2 text-gold-400 hover:text-white transition-colors text-xs font-mono uppercase tracking-widest"
        >
          <FileText size={14} />
          <span>DOWNLOAD INVOICE</span>
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 lg:p-12 space-y-8">

        {/* ========================================================================= */}
        {/* HERO STATUS BANNER: CURRENT STATUS & UNIQUE CODE */}
        {/* ========================================================================= */}
        <div className="bg-[#0A0A0A] border border-gold-400/40 p-6 sm:p-10 rounded-sm relative overflow-hidden shadow-[0_0_60px_rgba(212,175,55,0.12)]">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="px-2.5 py-1 bg-gold-400/10 border border-gold-400/30 text-gold-400 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm flex items-center gap-1.5">
                  <Sparkles size={12} className="animate-spin" />
                  <span>LIVE ATELIER DOSSIER</span>
                </span>
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                  Real-Time Admin Sync Active
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-serif text-white uppercase tracking-wider">
                  {dossier.conciergeCode || orderCode}
                </h1>
                <button 
                  onClick={() => handleCopyCode(dossier.conciergeCode || orderCode)}
                  className="p-2 bg-white/5 hover:bg-gold-400 hover:text-black border border-white/10 rounded-sm text-white/60 transition-colors"
                  title="Copy Unique Code"
                >
                  <Copy size={15} />
                </button>
              </div>
              <p className="text-xs text-white/50 font-mono mt-1">
                Issued on {new Date(dossier.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Current Status Highlight */}
            <div className="bg-black/60 border border-gold-400/30 p-4 sm:p-5 rounded-sm min-w-[260px] text-right">
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block mb-1">
                CURRENT ORDER STATUS
              </span>
              <div className="flex items-center justify-end gap-2">
                <div className="w-2 h-2 rounded-full bg-gold-400 animate-ping" />
                <span className="text-base sm:text-lg font-serif font-bold text-gold-400 uppercase tracking-wider">
                  {statusLabel}
                </span>
              </div>
              <span className="text-[10px] text-white/60 font-mono mt-1 block">
                {currentStatus === 'ORDER_SECURED' ? 'Private Concierge In Progress' :
                 currentStatus === 'IN_PRODUCTION' ? 'Master Tailors Handcrafting' :
                 currentStatus === 'DISPATCHED' ? 'In Armored Transit' : 'Atelier Registry Synced'}
              </span>
            </div>
          </div>

          {/* Interactive Phase Timeline */}
          <div className="mt-8 pt-2">
            <div className="relative flex justify-between items-center px-2">
              <div className="absolute left-2 right-2 top-[6px] h-[1px] bg-white/10 -z-0" />
              <div 
                className="absolute left-2 top-[6px] h-[2px] bg-gold-400 transition-all duration-1000 -z-0" 
                style={{ width: `${Math.min(100, Math.max(8, (currentStepProgress / 11) * 100))}%` }}
              />

              {ORDER_PHASES.map((phase) => {
                const phaseLastStatusIndex = ORDER_STATUS_PROGRESS[phase.statuses[phase.statuses.length - 1]] ?? 0;
                const phaseFirstStatusIndex = ORDER_STATUS_PROGRESS[phase.statuses[0]] ?? 0;
                const isCompleted = currentStepProgress >= phaseLastStatusIndex;
                const isCurrent = currentStepProgress >= phaseFirstStatusIndex && currentStepProgress <= phaseLastStatusIndex;

                return (
                  <div key={phase.name} className="relative z-10 flex flex-col items-center">
                    <div 
                      className={`w-3.5 h-3.5 rounded-full border transition-all duration-500 flex items-center justify-center ${
                        isCompleted || isCurrent 
                          ? 'bg-gold-400 border-gold-400 shadow-[0_0_12px_rgba(212,175,55,0.6)]' 
                          : 'bg-black border-white/20'
                      } ${isCurrent ? 'ring-4 ring-gold-400/20 scale-125' : ''}`}
                    >
                      {isCompleted && <Check size={8} className="text-black font-bold" />}
                    </div>
                    <span className={`text-[8.5px] sm:text-[9.5px] uppercase font-mono tracking-widest mt-3 whitespace-nowrap ${
                      isCompleted || isCurrent ? 'text-gold-400 font-bold' : 'text-white/30'
                    }`}>
                      {phase.name.split(' — ')[1] || phase.name}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-4 bg-white/[0.02] border border-white/10 rounded-sm flex items-start gap-3">
              <ShieldCheck size={16} className="text-gold-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono text-gold-400 uppercase tracking-widest font-bold block mb-1">
                  ATELIER PROTOCOL DIRECTIVE
                </span>
                <p className="text-xs text-white/70 font-light leading-relaxed">
                  {statusDescription}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* REQUEST 2: ALLOW USERS TO CHANGE THE CONFIRMATION METHOD EVEN AFTER SELECTING ONE */}
        {/* ========================================================================= */}
        <div className="bg-[#0A0A0A] border border-white/10 p-6 sm:p-8 rounded-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <span className="text-[9.5px] font-mono text-gold-400 uppercase tracking-widest block mb-1">
                COMMUNICATION CHANNEL CONTROL
              </span>
              <h2 className="text-lg font-serif text-white uppercase tracking-wider">
                Confirmation & Response Method
              </h2>
              <p className="text-xs text-white/50 font-light mt-0.5">
                You can switch your preferred confirmation method anytime. Changes update the Admin Command Center instantly.
              </p>
            </div>

            {/* Current Active Channel Badge */}
            <div className="px-3.5 py-2 bg-white/5 border border-white/10 rounded flex items-center gap-2">
              <span className="text-[10px] font-mono text-white/40 uppercase">ACTIVE:</span>
              <span className="text-xs font-mono font-bold text-gold-400 uppercase">
                {dossier.contactMethod === 'gmail' ? 'Gmail Concierge' :
                 dossier.contactMethod === 'instagram' ? 'Instagram Direct' :
                 dossier.contactMethod === 'whatsapp' ? 'WhatsApp Fast-lane' :
                 'Private Atelier Desk'}
              </span>
            </div>
          </div>

          {/* Interactive Channel Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { id: 'gmail', label: 'Gmail Concierge', icon: Mail, desc: 'Auto-copies dossier to client email draft' },
              { id: 'instagram', label: 'Instagram DM', icon: Instagram, desc: `Direct chat with @${CONCIERGE_CONFIG.instagramHandle}` },
              { id: 'whatsapp', label: 'WhatsApp Fast-lane', icon: MessageCircle, desc: 'Direct conversation with our private curator' },
              { id: 'private', label: 'Private Desk', icon: Crown, desc: 'Admin team contacts you directly' },
            ].map((chan) => {
              const isSelected = (dossier.contactMethod || 'private') === chan.id;
              const Icon = chan.icon;

              return (
                <button
                  key={chan.id}
                  onClick={() => handleChangeChannel(chan.id as any)}
                  disabled={isUpdatingChannel}
                  className={`p-4 rounded-sm border text-left transition-all duration-300 relative group flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-gold-400/10 border-gold-400 shadow-[0_0_20px_rgba(212,175,55,0.15)]' 
                      : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/[0.02]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-gold-400 text-black' : 'bg-white/5 text-white/60 group-hover:text-white'
                      }`}>
                        <Icon size={16} />
                      </div>
                      {isSelected && (
                        <span className="text-[9px] font-mono uppercase tracking-widest text-gold-400 font-bold flex items-center gap-1">
                          <Check size={12} /> SELECTED
                        </span>
                      )}
                    </div>

                    <h3 className={`text-sm font-serif font-bold uppercase tracking-wider mb-1 ${
                      isSelected ? 'text-white' : 'text-white/80'
                    }`}>
                      {chan.label}
                    </h3>
                    <p className="text-[11px] text-white/50 font-light leading-snug">
                      {chan.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[9.5px] font-mono">
                    <span className={isSelected ? 'text-gold-400 font-bold' : 'text-white/40'}>
                      {isSelected ? 'Active Preference' : 'Click to Switch'}
                    </span>
                    <ArrowRight size={12} className={`transition-transform ${isSelected ? 'text-gold-400 translate-x-0.5' : 'text-white/30'}`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Trigger for Current Channel */}
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.01] p-4 rounded-sm">
            <div className="text-xs text-white/70 font-mono">
              Ready to transmit or re-open your transmission for <span className="text-gold-400 font-bold uppercase">{dossier.contactMethod || 'private'}</span>?
            </div>
            <button
              onClick={handleLaunchCurrentChannel}
              className="w-full sm:w-auto px-6 py-3 bg-gold-400 hover:bg-white text-black font-mono font-bold text-xs uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2"
            >
              <span>TRANSMIT / RE-OPEN {dossier.contactMethod === 'gmail' ? 'GMAIL' : dossier.contactMethod === 'instagram' ? 'INSTAGRAM' : dossier.contactMethod === 'whatsapp' ? 'WHATSAPP' : 'DESK'}</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* REQUEST 3: MAKE MY DOSSIER SECTION ATTRACTIVE — SHOW PRODUCT & CURRENT STATUS */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT 2 COLS: ATTRACTIVE PRODUCT SHOWCASE */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0A0A0A] border border-white/10 p-6 sm:p-8 rounded-sm">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                <div>
                  <span className="text-[9.5px] font-mono text-gold-400 uppercase tracking-widest block mb-1">
                    ACQUISITION INVENTORY
                  </span>
                  <h2 className="text-xl font-serif text-white uppercase tracking-wider">
                    Allocated Artifacts ({dossier.items?.length || 0})
                  </h2>
                </div>
                <span className="text-xs font-mono text-white/40">
                  Insured Valuation
                </span>
              </div>

              {/* Product Cards */}
              <div className="space-y-4">
                {(dossier.items || []).map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-4 bg-black/60 border border-white/10 hover:border-gold-400/40 rounded-sm transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Product Thumbnail */}
                      <div className="w-16 h-20 sm:w-20 sm:h-24 bg-neutral-900 border border-white/10 rounded-sm overflow-hidden shrink-0 relative">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/30 text-[10px] font-mono uppercase">
                            Artifact
                          </div>
                        )}
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/80 text-[8px] font-mono text-gold-400 rounded">
                          #{idx + 1}
                        </div>
                      </div>

                      {/* Product Details */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-mono text-gold-400 uppercase tracking-widest px-2 py-0.5 bg-gold-400/10 border border-gold-400/20 rounded">
                            {item.houseCode || 'ARC-ATELIER'}
                          </span>
                          {item.selectedSize && (
                            <span className="text-[9px] font-mono text-white/60 uppercase tracking-wider px-2 py-0.5 bg-white/5 border border-white/10 rounded">
                              Size: {item.selectedSize}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-serif font-medium text-white group-hover:text-gold-400 transition-colors">
                          {item.title}
                        </h3>

                        <p className="text-xs text-white/50 font-mono mt-1">
                          Quantity: <span className="text-white font-bold">{item.quantity}</span> • Unit: INR {Number(item.price || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="text-left sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      <span className="text-[9px] font-mono text-white/40 uppercase block mb-0.5">
                        SUBTOTAL
                      </span>
                      <span className="text-base font-serif font-bold text-white">
                        INR {(Number(item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total & Breakdown */}
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.01] p-4 rounded-sm">
                <div>
                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">
                    TOTAL ALLOCATION VALUATION
                  </span>
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-gold-400">
                    INR {(dossier.totalAmount || dossier.total || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleDownloadInvoice}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-gold-400 text-white text-xs font-mono uppercase tracking-widest rounded-sm transition-all flex items-center gap-2"
                  >
                    <FileText size={14} />
                    <span>Download Invoice PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Shipment Tracking Card (if available) */}
            {dossier.trackingInfo && dossier.trackingInfo.trackingNumber && (
              <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-sm">
                <div className="flex items-center gap-2 text-gold-400 mb-3">
                  <Activity size={16} />
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
                    ACTIVE LOGISTICS & DISPATCH
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/40 p-4 border border-white/5 rounded">
                  <div>
                    <span className="text-xs text-white/40 font-mono block">Carrier: {dossier.trackingInfo.carrier}</span>
                    <span className="text-sm text-white font-mono font-bold">{dossier.trackingInfo.trackingNumber}</span>
                  </div>
                  {dossier.trackingInfo.trackingUrl && (
                    <a
                      href={dossier.trackingInfo.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-gold-400/10 border border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-black text-xs font-mono uppercase tracking-widest rounded transition-colors flex items-center gap-1.5"
                    >
                      <span>Track Shipment</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COL: SHIPPING DATA & RETURN HOME */}
          <div className="space-y-6">

            {/* Shipping Coordinates Card */}
            <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-sm">
              <div className="flex items-center gap-2 text-gold-400 mb-4 pb-3 border-b border-white/10">
                <MapPin size={16} />
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest">
                  Insured Delivery Coordinates
                </h3>
              </div>

              {dossier.shippingAddress ? (
                <div className="space-y-3 text-xs font-mono text-white/80">
                  <div>
                    <span className="text-[9px] text-white/40 uppercase block mb-0.5">RECIPIENT</span>
                    <p className="font-serif text-sm font-bold text-white">
                      {dossier.shippingAddress.fullName || `${dossier.shippingAddress.firstName || ''} ${dossier.shippingAddress.lastName || ''}`}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] text-white/40 uppercase block mb-0.5">ADDRESS</span>
                    <p className="text-white/70">{dossier.shippingAddress.address}</p>
                    <p className="text-white/70">
                      {dossier.shippingAddress.city}, {dossier.shippingAddress.state} — {dossier.shippingAddress.pincode}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] text-white/40 uppercase block mb-0.5">COMMUNICATION</span>
                    <p className="text-white/70">Mobile: {dossier.shippingAddress.mobile || (dossier.shippingAddress as any).phone || 'On Record'}</p>
                    <p className="text-white/70">Email: {dossier.shippingAddress.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-white/50 font-mono">
                  Coordinates recorded in encrypted atelier archives.
                </p>
              )}
            </div>

            {/* Quick Contact Card */}
            <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-sm space-y-4">
              <span className="text-[9.5px] font-mono text-gold-400 uppercase tracking-widest block">
                ATELIER DESK CONTACT
              </span>
              <p className="text-xs text-white/60 font-light leading-relaxed">
                Our executive curators monitor this dossier continuously. Need urgent assistance with sizing, delivery changes, or custom requests?
              </p>

              <a
                href={`https://wa.me/${CONCIERGE_CONFIG.whatsappNumber}?text=${encodeURIComponent(`Hello Deuz Concierge, I am inquiring regarding Dossier #${dossier.conciergeCode || orderCode}`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle size={15} />
                <span>Instant WhatsApp Concierge</span>
              </a>
            </div>

            {/* RETURN TO HOME BUTTON (Request 1) */}
            <div className="bg-gradient-to-b from-[#0A0A0A] to-black border border-gold-400/30 p-6 rounded-sm text-center space-y-4">
              <Crown size={24} className="text-gold-400 mx-auto" />
              <h3 className="text-sm font-serif uppercase tracking-widest text-white">
                Allocation Registered Successfully
              </h3>
              <p className="text-[11px] text-white/50 font-mono">
                Your dossier has been logged. You may return to browse the boutique collections at any time.
              </p>

              <button
                onClick={onBackToGallery}
                className="w-full py-4 bg-white hover:bg-gold-400 text-black font-mono font-bold text-xs uppercase tracking-[0.25em] rounded-sm transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2"
              >
                <Home size={16} />
                <span>RETURN TO HOME</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </motion.div>
  );
};

export default ConciergeInitiatedPage;
