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
  const [selectedChannel, setSelectedChannel] = useState<'instagram' | 'whatsapp' | 'email' | null>(null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(orderCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelect = (method: 'instagram' | 'whatsapp' | 'email') => {
    setSelectedChannel(method);
  };

  const handleContinue = () => {
    if (!selectedChannel) return;
    
    // Generate Invoice PDF
    const doc = new jsPDF();
    
    // Cinematic styling - Pure Black
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 297, 'F'); // A4 size background
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('DEUZ & CO.', 105, 30, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('NOT FOR EVERYONE', 105, 38, { align: 'center' });
    
    doc.setDrawColor(50, 50, 50);
    doc.line(20, 50, 190, 50);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ALLOCATION DOSSIER', 20, 65);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Dossier ID: ${orderCode}`, 20, 75);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 82);
    doc.text(`Channel: ${selectedChannel?.toUpperCase()}`, 20, 89);
    
    doc.text('BILLED TO:', 120, 65);
    doc.setTextColor(255, 255, 255);
    doc.text(`${address?.fullName || address?.firstName || 'Guest'}`, 120, 75);
    doc.setTextColor(200, 200, 200);
    doc.text(`${address?.email || ''}`, 120, 82);
    doc.text(`${address?.mobile || ''}`, 120, 89);
    
    // Shipping Address
    doc.setFont('helvetica', 'bold');
    doc.text('SHIPPING ADDRESS:', 20, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(`${address?.address || ''}`, 20, 115);
    doc.text(`${address?.city || ''}, ${address?.state || ''} ${address?.pincode || ''}`, 20, 122);
    
    const itemData = items.map((item: any) => [
        item.title,
        item.selectedSize || item.size || 'STD',
        item.quantity.toString(),
        `₹ ${item.price.toLocaleString('en-IN')}`
    ]);
    
    autoTable(doc, {
        startY: 135,
        head: [['ARTIFACT', 'SIZE', 'QTY', 'VALUE']],
        body: itemData,
        theme: 'plain',
        styles: { 
            fillColor: [0, 0, 0], 
            textColor: [200, 200, 200],
            fontSize: 10,
            cellPadding: 6,
            lineColor: [50, 50, 50],
            lineWidth: 0.1
        },
        headStyles: { 
            fillColor: [15, 15, 15], 
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left'
        },
        alternateRowStyles: {
            fillColor: [5, 5, 5]
        }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || 135;
    
    doc.setDrawColor(50, 50, 50);
    doc.line(120, finalY + 10, 190, finalY + 10);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL VALUE:', 120, finalY + 20);
    doc.text(`₹ ${totalAmount.toLocaleString('en-IN')}`, 190, finalY + 20, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Not for everyone.', 105, 280, { align: 'center' });
    
    doc.save(`DEUZ_Dossier_${orderCode}.pdf`);

    onInteractionStart(getInteractionDetails());
    onMethodSelect(selectedChannel);
    
    const message = generateConciergeMessage(orderCode, totalAmount, items, address);
    const url = getContactUrl(selectedChannel, message, orderCode);
    
    if (selectedChannel === 'instagram') {
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
            className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-[#0A0A0A] border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-black shrink-0">
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
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
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
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <span className="text-[9px] uppercase tracking-widest text-white/40 block mb-2">Artifacts</span>
                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                        {items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs items-center">
                                <span className="text-white/80 truncate pr-4">{item.quantity}x {item.title}</span>
                                <span className="text-white/40 font-mono shrink-0">{item.selectedSize || 'STD'}</span>
                            </div>
                        ))}
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-white/40 uppercase tracking-widest text-center">
                  "Not for everyone"
                </p>
              </div>

              <div className="bg-gold-500/10 border border-gold-500/20 p-4 text-center">
                <p className="text-xs text-gold-500/80 leading-relaxed font-light">
                  <strong className="text-gold-500 block mb-1 uppercase tracking-widest text-[10px]">Action Required</strong>
                  Copy your Dossier Reference above. Select your preferred channel below and send us the reference code to complete your acquisition.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleSelect('instagram')}
                  className={`w-full p-4 border transition-all group flex items-center justify-between ${selectedChannel === 'instagram' ? 'border-gold-500 bg-gold-500/10' : 'border-white/10 hover:border-gold-500 bg-black hover:bg-gold-500/5'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${selectedChannel === 'instagram' ? 'bg-gold-500/20 text-gold-500' : 'bg-white/5 text-white group-hover:bg-gold-500/20 group-hover:text-gold-500'}`}>
                      <Instagram size={18} />
                    </div>
                    <div className="text-left">
                      <span className="block text-sm text-white uppercase tracking-widest font-bold mb-0.5">Instagram Direct</span>
                      <span className="block text-[10px] text-white/40 font-mono">@{CONCIERGE_CONFIG.instagramHandle}</span>
                    </div>
                  </div>
                  {selectedChannel === 'instagram' ? <CheckCircle2 size={16} className="text-gold-500" /> : <ArrowRight size={16} className="text-white/20 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />}
                </button>

                <button
                  onClick={() => handleSelect('whatsapp')}
                  className={`w-full p-4 border transition-all group flex items-center justify-between ${selectedChannel === 'whatsapp' ? 'border-green-500 bg-green-500/10' : 'border-white/10 hover:border-green-500 bg-black hover:bg-green-500/5'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${selectedChannel === 'whatsapp' ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-white group-hover:bg-green-500/20 group-hover:text-green-500'}`}>
                      <MessageCircle size={18} />
                    </div>
                    <div className="text-left">
                      <span className="block text-sm text-white uppercase tracking-widest font-bold mb-0.5">WhatsApp Secure</span>
                      <span className="block text-[10px] text-white/40 font-mono">+{CONCIERGE_CONFIG.whatsappNumber}</span>
                    </div>
                  </div>
                  {selectedChannel === 'whatsapp' ? <CheckCircle2 size={16} className="text-green-500" /> : <ArrowRight size={16} className="text-white/20 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />}
                </button>

                <button
                  onClick={() => handleSelect('email')}
                  className={`w-full p-4 border transition-all group flex items-center justify-between ${selectedChannel === 'email' ? 'border-white bg-white/10' : 'border-white/10 hover:border-white bg-black hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${selectedChannel === 'email' ? 'bg-white/20 text-white' : 'bg-white/5 text-white group-hover:bg-white/20'}`}>
                      <Mail size={18} />
                    </div>
                    <div className="text-left">
                      <span className="block text-sm text-white uppercase tracking-widest font-bold mb-0.5">Encrypted Email</span>
                      <span className="block text-[10px] text-white/40 font-mono">{CONCIERGE_CONFIG.emailAddress}</span>
                    </div>
                  </div>
                  {selectedChannel === 'email' ? <CheckCircle2 size={16} className="text-white" /> : <ArrowRight size={16} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />}
                </button>
              </div>
              
              <button
                onClick={handleContinue}
                disabled={!selectedChannel}
                className="w-full py-4 bg-gold-500 text-black font-serif uppercase tracking-[0.2em] text-xs font-bold hover:bg-white transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                Continue to Concierge
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConciergeCheckoutModal;
