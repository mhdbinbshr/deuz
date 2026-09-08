import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Instagram, Mail, ArrowRight, ShieldCheck, Copy, CheckCircle2, Crown, Send, Check } from 'lucide-react';
import { 
  getContactUrl, 
  getMailtoUrl, 
  CONCIERGE_CONFIG, 
  generateConciergeMessage 
} from '../utils/conciergeService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ConciergeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderCode: string;
  totalAmount: number;
  items: any[];
  address: any;
  onMethodSelect: (method: 'gmail' | 'instagram' | 'private') => void;
  onInteractionStart: (details: any) => void;
}

const ConciergeCheckoutModal: React.FC<ConciergeCheckoutModalProps> = ({
  isOpen,
  onClose,
  orderCode,
  totalAmount,
  items,
  address,
  onMethodSelect,
  onInteractionStart
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'gmail' | 'instagram' | 'private' | null>(null);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [privatePreference, setPrivatePreference] = useState<'whatsapp' | 'gmail' | 'instagram'>('whatsapp');
  const [privateHandle, setPrivateHandle] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(orderCode);
    setCopied(true);
    showToast("Unique Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelect = (method: 'gmail' | 'instagram' | 'private') => {
    setSelectedChannel(method);
  };

  const compileDossier = () => {
    return generateConciergeMessage(orderCode, totalAmount, items, address);
  };

  const handleContinue = async () => {
    if (!selectedChannel) return;
    
    // Generate Invoice PDF
    const doc = new jsPDF();
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('DEUZ & CO.', 105, 30, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('NOT FOR EVERYONE — ATELIER ACQUISITION DOSSIER', 105, 38, { align: 'center' });
    
    doc.setDrawColor(50, 50, 50);
    doc.line(20, 50, 190, 50);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ALLOCATION DOSSIER', 20, 65);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Unique Code: ${orderCode}`, 20, 75);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 20, 82);
    doc.text(`Channel: ${selectedChannel.toUpperCase()}`, 20, 89);
    
    doc.text('BILLED TO:', 120, 65);
    doc.setTextColor(255, 255, 255);
    doc.text(`${address?.fullName || address?.firstName || 'Client'}`, 120, 75);
    doc.setTextColor(200, 200, 200);
    doc.text(`${address?.email || ''}`, 120, 82);
    doc.text(`${address?.mobile || ''}`, 120, 89);
    
    doc.setFont('helvetica', 'bold');
    doc.text('SHIPPING ADDRESS:', 20, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(`${address?.address || ''}`, 20, 115);
    doc.text(`${address?.city || ''}, ${address?.state || ''} ${address?.pincode || ''}`, 20, 122);
    
    const itemData = items.map((item: any) => [
      item.title,
      item.houseCode ? `[${item.houseCode}]` : 'ATELIER',
      item.selectedSize || item.size || 'STD',
      item.quantity.toString(),
      `₹ ${item.price.toLocaleString('en-IN')}`
    ]);
    
    autoTable(doc, {
      startY: 135,
      head: [['ARTIFACT', 'HOUSE CODE', 'SIZE', 'QTY', 'VALUE']],
      body: itemData,
      theme: 'plain',
      styles: { 
        fillColor: [0, 0, 0], 
        textColor: [200, 200, 200],
        fontSize: 9,
        cellPadding: 6,
        lineColor: [50, 50, 50],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [15, 15, 15], 
        textColor: [212, 175, 55],
        fontStyle: 'bold',
        halign: 'left'
      }
    });
    
    const finalY = (doc as any).lastAutoTable?.finalY || 135;
    doc.setDrawColor(50, 50, 50);
    doc.line(120, finalY + 10, 190, finalY + 10);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL VALUE:', 120, finalY + 20);
    doc.setTextColor(212, 175, 55);
    doc.text(`₹ ${totalAmount.toLocaleString('en-IN')}`, 190, finalY + 20, { align: 'right' });
    
    doc.save(`DEUZ_${orderCode}.pdf`);

    onInteractionStart({ channel: selectedChannel, orderCode });
    onMethodSelect(selectedChannel);
    
    const message = compileDossier();

    if (selectedChannel === 'gmail') {
      // 1. Gmail: auto-copy shipping address, product price, unique code, house code
      await navigator.clipboard.writeText(message);
      showToast("Dossier copied! Opening Gmail...");
      const gmailUrl = getContactUrl('gmail', message, orderCode) || getMailtoUrl(message, orderCode);
      setTimeout(() => {
        window.open(gmailUrl, '_blank');
        onClose();
      }, 500);
    } else if (selectedChannel === 'instagram') {
      // 2. Instagram: auto-copy shipping address, product price, unique code, house code
      await navigator.clipboard.writeText(message);
      showToast("Dossier copied! Opening Instagram...");
      const instaUrl = getContactUrl('instagram', message, orderCode);
      setTimeout(() => {
        if (instaUrl) window.open(instaUrl, '_blank');
        onClose();
      }, 500);
    } else if (selectedChannel === 'private') {
      // 3. Private: sent to admin dashboard, team will contact them
      showToast("Dossier sent to Admin Dashboard. We will reach out shortly.");
      setTimeout(() => {
        onClose();
      }, 800);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-[#0A0A0A] border border-white/10 shadow-2xl overflow-hidden rounded-sm"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-black shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={16} className="text-gold-400" />
                  <span className="text-[10px] uppercase tracking-widest text-gold-400 font-bold font-mono">
                    ALLOCATION SECURED
                  </span>
                </div>
                <h2 className="text-xl font-serif text-white tracking-widest uppercase">
                  Private Concierge Payment
                </h2>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              
              {/* Dossier Card */}
              <div className="bg-[#050505] border border-white/10 p-5 relative overflow-hidden rounded-sm">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold-400/80 to-transparent" />
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-gold-400 font-mono block mb-1">
                      UNIQUE PURCHASE CODE
                    </span>
                    <span className="text-xl font-mono text-white tracking-widest font-bold">
                      {orderCode}
                    </span>
                  </div>
                  <button 
                    onClick={handleCopyCode}
                    className="p-2 hover:bg-white/10 transition-colors rounded text-white/60 hover:text-white"
                    title="Copy Unique Code"
                  >
                    {copied ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                </div>
                
                <div className="space-y-2 mb-4 border-t border-b border-white/5 py-3">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white/40 uppercase">House Code(s)</span>
                    <span className="text-gold-400">
                      {items?.map(i => i.houseCode).filter(Boolean).join(', ') || 'ARC-ATELIER'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white/40 uppercase">Total Valuation</span>
                    <span className="text-white font-serif font-bold">₹{(totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-white/50 truncate">
                  Ship to: {address?.fullName || `${address?.firstName || ''} ${address?.lastName || ''}`}, {address?.city || ''}
                </div>
              </div>

              {/* Toast Feedback */}
              {toastMessage && (
                <div className="p-3 bg-gold-400 text-black text-xs font-mono font-bold flex items-center gap-2 rounded">
                  <Check size={14} />
                  <span>{toastMessage}</span>
                </div>
              )}

              {/* Channel Options */}
              <div className="space-y-3">
                {/* 1. GMAIL */}
                <button
                  onClick={() => handleSelect('gmail')}
                  className={`w-full p-4 border transition-all text-left flex items-start gap-4 rounded-sm ${selectedChannel === 'gmail' ? 'border-gold-400 bg-gold-400/10' : 'border-white/10 hover:border-gold-400/60 bg-black'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${selectedChannel === 'gmail' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white'}`}>
                    <Mail size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-mono font-bold tracking-wider text-white">
                        1. Gmail Concierge
                      </span>
                      <span className="text-[9px] font-mono text-gold-400 bg-gold-400/10 px-1.5 py-0.5 rounded">
                        AUTO-COPY
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 font-light mt-1">
                      Redirects to Gmail with auto-copy of shipping address, price, unique code ({orderCode}), and house code.
                    </p>
                  </div>
                </button>

                {/* 2. INSTAGRAM */}
                <button
                  onClick={() => handleSelect('instagram')}
                  className={`w-full p-4 border transition-all text-left flex items-start gap-4 rounded-sm ${selectedChannel === 'instagram' ? 'border-pink-500 bg-pink-500/10' : 'border-white/10 hover:border-pink-500/60 bg-black'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${selectedChannel === 'instagram' ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-white'}`}>
                    <Instagram size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-mono font-bold tracking-wider text-white">
                        2. Instagram Direct (@{CONCIERGE_CONFIG.instagramHandle})
                      </span>
                      <span className="text-[9px] font-mono text-pink-400 bg-pink-400/10 px-1.5 py-0.5 rounded">
                        AUTO-COPY
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 font-light mt-1">
                      Redirects to Instagram DM with auto-copy of shipping address, price, unique code, and house code.
                    </p>
                  </div>
                </button>

                {/* 3. PRIVATE */}
                <button
                  onClick={() => handleSelect('private')}
                  className={`w-full p-4 border transition-all text-left flex items-start gap-4 rounded-sm ${selectedChannel === 'private' ? 'border-gold-400 bg-gold-400/10' : 'border-white/10 hover:border-gold-400/60 bg-black'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${selectedChannel === 'private' ? 'bg-gold-400/20 text-gold-400' : 'bg-white/5 text-white'}`}>
                    <Crown size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-mono font-bold tracking-wider text-white">
                        3. Private Executive Desk
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                        ADMIN DASHBOARD
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 font-light mt-1">
                      Details sent to Admin Dashboard. Our team will contact you through WhatsApp, Gmail, or Instagram.
                    </p>

                    {selectedChannel === 'private' && (
                      <div className="mt-3 pt-3 border-t border-white/10" onClick={e => e.stopPropagation()}>
                        <span className="text-[9px] font-mono uppercase text-white/60 block mb-1.5">
                          How should our team reach you?
                        </span>
                        <div className="flex gap-2">
                          {(['whatsapp', 'gmail', 'instagram'] as const).map(ch => (
                            <button
                              key={ch}
                              type="button"
                              onClick={() => setPrivatePreference(ch)}
                              className={`px-2.5 py-1 text-[10px] font-mono uppercase rounded border ${privatePreference === ch ? 'bg-gold-400 text-black border-gold-400 font-bold' : 'border-white/10 text-white/50'}`}
                            >
                              {ch}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              </div>
              
              <button
                onClick={handleContinue}
                disabled={!selectedChannel}
                className="w-full py-4 bg-gold-400 hover:bg-white text-black font-mono uppercase tracking-[0.2em] text-xs font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
              >
                <span>PROCEED WITH SELECTED OPTION</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConciergeCheckoutModal;
