import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Instagram, MessageCircle, Mail, ArrowRight, ShieldCheck, Copy, CheckCircle2 } from 'lucide-react';
import { getContactUrl, getInteractionDetails, CONCIERGE_CONFIG, generateConciergeMessage } from '../utils/conciergeService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ConciergeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderCode: string;
  totalAmount: number;
  items: any[];
  address: any;
  onMethodSelect: (method: 'instagram' | 'whatsapp' | 'email') => void;
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
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(orderCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelect = (method: 'instagram' | 'whatsapp' | 'email') => {
    // Generate Invoice PDF
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('DEUZ & CO - Invoice', 14, 22);
    doc.setFontSize(10);
    doc.text(`Order ID: ${orderCode}`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);
    doc.text(`Client: ${address?.fullName || address?.firstName || 'Guest'}`, 14, 42);
    
    doc.setFontSize(14);
    doc.text('Items', 14, 55);
    
    const itemData = items.map((item: any) => [
        item.title,
        item.selectedSize || item.size || 'N/A',
        item.houseCode || 'N/A',
        item.quantity.toString(),
        `$${item.price}`
    ]);
    
    autoTable(doc, {
        startY: 60,
        head: [['Item', 'Size', 'House Code', 'Qty', 'Price']],
        body: itemData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [20, 20, 20] }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || 60;
    doc.setFontSize(12);
    doc.text(`Total: $${totalAmount}`, 14, finalY + 10);
    
    doc.save(`invoice-${orderCode}.pdf`);

    onInteractionStart(getInteractionDetails());
    onMethodSelect(method);
    
    const message = generateConciergeMessage(orderCode, totalAmount, items, address);
    const url = getContactUrl(method, message, orderCode);
    
    if (method === 'instagram') {
      navigator.clipboard.writeText(message);
    }
    
    if (url) {
      window.open(url, '_blank');
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
            className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-black">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={16} className="text-gold-500" />
                  <span className="text-[10px] uppercase tracking-widest text-gold-500 font-bold">Allocation Secured</span>
                </div>
                <h2 className="text-xl font-serif text-white tracking-widest uppercase">Select Channel</h2>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="bg-[#050505] border border-white/10 p-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent opacity-50"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-gold-500 block mb-1">Dossier Reference</span>
                    <span className="text-xl font-serif text-white tracking-widest">{orderCode}</span>
                  </div>
                  <button 
                    onClick={handleCopyCode}
                    className="p-2 hover:bg-white/10 transition-colors rounded-sm text-white/60 hover:text-white"
                    title="Copy Reference"
                  >
                    {copied ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                </div>
                
                <div className="space-y-2 mb-4 border-t border-b border-white/5 py-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40 uppercase tracking-widest">Items</span>
                    <span className="text-white font-mono">{items?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40 uppercase tracking-widest">Estimated Value</span>
                    <span className="text-gold-500 font-serif">₹{(totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <p className="text-[10px] text-white/40 uppercase tracking-widest text-center">
                  "Crafting immersive visual experiences."
                </p>
              </div>

              <p className="text-xs text-white/60 leading-relaxed font-light text-center px-4">
                Your allocation is reserved. To complete the acquisition and arrange secure delivery, please connect with your personal concierge through your preferred channel. The invoice above will be automatically forwarded.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleSelect('instagram')}
                  className="w-full p-4 border border-white/10 hover:border-gold-500 bg-black hover:bg-gold-500/5 transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-gold-500/20 transition-colors">
                      <Instagram size={18} className="text-white group-hover:text-gold-500" />
                    </div>
                    <div className="text-left">
                      <span className="block text-sm text-white uppercase tracking-widest font-bold mb-0.5">Instagram Direct</span>
                      <span className="block text-[10px] text-white/40 font-mono">@{CONCIERGE_CONFIG.instagramHandle}</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-white/20 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  onClick={() => handleSelect('whatsapp')}
                  className="w-full p-4 border border-white/10 hover:border-green-500 bg-black hover:bg-green-500/5 transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                      <MessageCircle size={18} className="text-white group-hover:text-green-500" />
                    </div>
                    <div className="text-left">
                      <span className="block text-sm text-white uppercase tracking-widest font-bold mb-0.5">WhatsApp Secure</span>
                      <span className="block text-[10px] text-white/40 font-mono">+{CONCIERGE_CONFIG.whatsappNumber}</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-white/20 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  onClick={() => handleSelect('email')}
                  className="w-full p-4 border border-white/10 hover:border-white bg-black hover:bg-white/5 transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <Mail size={18} className="text-white" />
                    </div>
                    <div className="text-left">
                      <span className="block text-sm text-white uppercase tracking-widest font-bold mb-0.5">Encrypted Email</span>
                      <span className="block text-[10px] text-white/40 font-mono">{CONCIERGE_CONFIG.emailAddress}</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConciergeCheckoutModal;
