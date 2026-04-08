import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, CreditCard, ArrowRight, Copy, CheckCircle2, AlertCircle, Activity, MessageCircle, Mail, Instagram } from 'lucide-react';
import { Order } from '../types';
import { db } from '../utils/db';

interface ConciergeInitiatedPageProps {
  orderCode: string;
  onBackToGallery: () => void;
}

const ConciergeInitiatedPage: React.FC<ConciergeInitiatedPageProps> = ({ orderCode, onBackToGallery }) => {
  const [dossier, setDossier] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareFeedback, setShareFeedback] = useState(false);

  useEffect(() => {
      const fetchSystemTruth = async () => {
          try {
              const data = await db.trackOrder(orderCode);
              setDossier(data);
          } catch (err) {
              setError('Unable to verify dossier integrity. Please check your network.');
          } finally {
              setLoading(false);
          }
      };
      
      // Delay slightly to allow DB consistency if strictly eventual consistent, 
      // though typically immediate for single writer.
      setTimeout(fetchSystemTruth, 500);
  }, [orderCode]);

  const handleShare = async () => {
    if (!dossier) return;
    const total = dossier.totalAmount || dossier.total || 0;
    const code = dossier.conciergeCode || dossier.code || '';
    const textToCopy = `Acquisition Dossier #${code}. Value: ₹${total.toLocaleString('en-IN')}`;
    navigator.clipboard.writeText(textToCopy);
    setShareFeedback(true);
    setTimeout(() => setShareFeedback(false), 2000);
  };

  const handleContactConcierge = () => {
      // Removed concierge contact logic
  };

  const getChannelIcon = (method?: string) => {
      if (method === 'whatsapp') return <MessageCircle size={16} />;
      if (method === 'email') return <Mail size={16} />;
      if (method === 'instagram') return <Instagram size={16} />;
      return <Activity size={16} />;
  };

  const getChannelName = (method?: string) => {
      if (method === 'whatsapp') return 'WhatsApp';
      if (method === 'email') return 'Concierge Email';
      if (method === 'instagram') return 'Instagram Direct';
      return 'Private Concierge';
  };

  // Map strict states to steps for display
  const getSteps = () => {
      const isPaid = dossier?.orderStatus !== 'ORDER_SECURED' && dossier?.orderStatus !== 'CANCELLED';
      const hasLink = !!dossier?.paymentLink && !isPaid;
      
      return [
        { id: 1, label: 'Request Initiated', status: 'completed', icon: Check },
        { id: 2, label: 'Curator Review', status: hasLink ? 'completed' : 'current', icon: Crown },
        { id: 3, label: 'Private Payment Link', status: isPaid ? 'completed' : hasLink ? 'current' : 'pending', icon: CreditCard },
        { id: 4, label: 'Allocation Secured', status: isPaid ? 'current' : 'pending', icon: CheckCircle2 }
      ];
  };

  if (loading) {
      return (
        <div className="fixed inset-0 z-[70] bg-[#020202] flex items-center justify-center p-6">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-white/10 border-t-gold-500 rounded-full animate-spin" />
                <span className="text-white/40 text-[10px] uppercase tracking-[0.3em] animate-pulse">Verifying Dossier Integrity</span>
            </div>
        </div>
      );
  }

  if (error || !dossier) {
      return (
        <div className="fixed inset-0 z-[70] bg-[#020202] flex items-center justify-center p-6">
            <div className="text-center max-w-md">
                <div className="flex justify-center mb-6">
                    <AlertCircle size={32} className="text-red-500" />
                </div>
                <h2 className="text-white font-serif text-xl tracking-widest mb-4">SYSTEM NOTIFICATION</h2>
                <p className="text-white/50 text-sm mb-8">{error || 'Dossier record unavailable.'}</p>
                <button onClick={onBackToGallery} className="border border-white/20 text-white px-8 py-3 uppercase tracking-widest text-[10px] md:text-xs hover:bg-white hover:text-black transition-colors">
                    Return to Gallery
                </button>
            </div>
        </div>
      );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-[#020202] overflow-y-auto flex flex-col items-center justify-center p-6"
    >
       {/* Ambient Light */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-[120px] pointer-events-none fixed" />

       <motion.div 
         initial={{ y: 50, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
         className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row my-auto"
       >
          {/* Left: Summary & Status */}
          <div className="w-full md:w-5/12 bg-black border-b md:border-b-0 md:border-r border-white/10 p-10 flex flex-col justify-between relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-500 to-transparent" />
             
             <div>
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="w-14 h-14 bg-gold-900/10 border border-gold-500/20 rounded-full flex items-center justify-center mb-6"
                >
                   <Activity className="text-gold-500" size={24} strokeWidth={1.5} />
                </motion.div>
                
                <h1 className="text-2xl font-serif text-white tracking-widest mb-2 leading-tight uppercase">
                  PRIVATE CHECKOUT
INITIATED
                </h1>
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-pulse" />
                    <p className="text-gold-500 text-[10px] uppercase tracking-wider">
                    A concierge will assist you shortly
                    </p>
                </div>

                <div className="bg-white/5 border-l-2 border-gold-500 p-4 mb-8">
                   <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={12} className="text-gold-500"/>
                      <span className="text-[9px] uppercase tracking-widest text-gold-500 font-bold">No Payment Taken</span>
                   </div>
                   <p className="text-[10px] text-white/60 leading-relaxed font-light">
                      This is a preliminary acquisition request. Your allocation is reserved, but <strong>no payment</strong> has been processed yet.
                   </p>
                </div>

                <div className="space-y-4 mb-8">
                   <div>
                      <span className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">Order Reference</span>
                      <div className="flex items-center gap-2">
                         <span className="text-white font-mono text-lg tracking-wide">{dossier.conciergeCode || dossier.code}</span>
                         <button onClick={handleShare} className="text-white/20 hover:text-white transition-colors" title="Copy Reference">
                            {shareFeedback ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                         </button>
                      </div>
                   </div>
                   <div>
                      <span className="text-[9px] uppercase tracking-widest text-white/30 block mb-1">Response Channel</span>
                      <span className="text-white text-sm font-medium capitalize flex items-center gap-2">
                         {getChannelIcon(dossier.contactMethod)} {getChannelName(dossier.contactMethod)} <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      </span>
                   </div>
                </div>
             </div>

             <div className="pt-6 border-t border-white/10">
                <span className="text-[9px] uppercase tracking-widest text-white/30 block mb-2">Estimated Value</span>
                <span className="text-2xl font-serif text-white">₹{(dossier.totalAmount || dossier.total || 0).toLocaleString('en-IN')}</span>
             </div>
          </div>

          {/* Right: Timeline & Actions */}
          <div className="w-full md:w-7/12 p-10 bg-[#0A0A0A] flex flex-col justify-center">
             <div className="bg-[#050505] border border-white/10 p-8 relative overflow-hidden group mb-8 shadow-2xl shadow-gold-500/5">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500/80 to-transparent opacity-70"></div>
                
                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-serif text-white tracking-[0.3em] uppercase text-sm">DEUZ & CO. INVOICE</h3>
                   <Crown size={16} className="text-gold-500/50" />
                </div>
                
                <div className="space-y-2 mb-6 border-t border-b border-white/10 py-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40 uppercase tracking-widest">Dossier</span>
                    <span className="text-white font-mono">{dossier.conciergeCode || dossier.code}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40 uppercase tracking-widest">Date Issued</span>
                    <span className="text-white font-mono">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {dossier.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-white/80">{item.title} <span className="text-white/40 ml-2">x{item.quantity}</span></span>
                      <span className="text-white/80 font-mono">₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-4 pb-6 flex justify-between items-center text-sm">
                  <span className="text-white/40 uppercase tracking-widest">Total Value</span>
                  <span className="text-gold-500 font-serif text-xl tracking-wider">₹{(dossier.totalAmount || dossier.total || 0).toLocaleString('en-IN')}</span>
                </div>

                <button 
                  onClick={onBackToGallery}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all duration-300 uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 group-hover:border-gold-500/30"
                >
                   Return to Home <ArrowRight size={12} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
             </div>

             <h3 className="text-xs uppercase tracking-[0.2em] text-white/50 mb-8 flex items-center gap-2">
                <div className="h-px w-8 bg-gold-500/50" /> Order updates will appear here
             </h3>

             {dossier.trackingInfo && dossier.trackingInfo.trackingNumber && (
                <div className="bg-white/5 border border-white/10 p-4 mb-8">
                   <h4 className="text-[10px] uppercase tracking-widest text-gold-500 mb-2">Shipment Tracking</h4>
                   <div className="flex flex-col gap-1">
                      <span className="text-sm text-white font-medium">{dossier.trackingInfo.carrier}</span>
                      <span className="text-xs text-white/60 font-mono">{dossier.trackingInfo.trackingNumber}</span>
                      {dossier.trackingInfo.trackingUrl && (
                         <a href={dossier.trackingInfo.trackingUrl} target="_blank" rel="noreferrer" className="text-[10px] text-gold-500 hover:text-white uppercase tracking-widest mt-2 flex items-center gap-1">
                            Track Package <ArrowRight size={10} />
                         </a>
                      )}
                   </div>
                </div>
             )}

             <div className="relative space-y-0 pl-4 mb-10">
                <div className="absolute top-2 left-[23px] bottom-6 w-px bg-white/10" />

                {getSteps().map((step, idx) => (
                   <motion.div 
                     key={step.id}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: 0.5 + (idx * 0.1) }}
                     className="relative flex items-center gap-6 pb-8 last:pb-0 group"
                   >
                      <div className={`relative z-10 w-5 h-5 rounded-full border flex items-center justify-center bg-[#0A0A0A] ${
                          step.status === 'completed' ? 'border-gold-500 text-gold-500' :
                          step.status === 'current' ? 'border-white text-white animate-pulse' : 'border-white/20 text-white/20'
                      }`}>
                          {step.status === 'completed' ? <Check size={10} /> : <div className={`w-1.5 h-1.5 rounded-full ${step.status === 'current' ? 'bg-white' : 'bg-transparent'}`} />}
                      </div>
                      
                      <div className={`${step.status === 'pending' ? 'opacity-30' : 'opacity-100'}`}>
                         <p className="text-xs uppercase tracking-widest font-bold text-white mb-0.5">{step.label}</p>
                         <p className="text-[10px] text-white/50 font-serif italic">
                            {idx === 0 ? 'Protocol verified' : idx === 1 ? 'Curator allocated' : idx === 2 ? 'Secure link sent' : 'Inventory secured'}
                         </p>
                      </div>
                   </motion.div>
                ))}
             </div>

             <div className="space-y-3">
                {dossier.paymentLink && dossier.orderStatus === 'ORDER_SECURED' ? (
                    <a 
                      href={dossier.paymentLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-4 bg-green-500 text-black hover:bg-white hover:text-black transition-all duration-300 uppercase tracking-[0.2em] text-xs font-bold flex items-center justify-center gap-2 group"
                    >
                       <CreditCard size={16} /> Complete Payment
                       <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                ) : null}
             </div>
          </div>
       </motion.div>
    </motion.div>
  );
};

export default ConciergeInitiatedPage;