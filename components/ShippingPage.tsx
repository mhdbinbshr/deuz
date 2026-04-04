import React from 'react';
import { motion } from 'framer-motion';
import { X, Truck, Globe, Clock, Calendar, Mail, AlertTriangle, Package, MapPin } from 'lucide-react';

interface ShippingPageProps {
  onClose: () => void;
}

const ShippingPage: React.FC<ShippingPageProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#050505] overflow-y-auto"
    >
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
      
      <nav className="sticky top-0 left-0 right-0 z-50 p-8 flex justify-between items-center bg-[#050505]/90 backdrop-blur-md border-b border-white/5">
        <div className="text-xl font-serif text-white tracking-[0.2em]">DEUZ & CO</div>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors group flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest hidden md:block group-hover:mr-1 transition-all">Close</span>
          <X size={24} strokeWidth={1} />
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-20 relative z-10">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="w-20 h-20 mx-auto bg-gold-900/10 border border-gold-500/20 rounded-full flex items-center justify-center mb-8 relative">
             <div className="absolute inset-0 border border-white/5 rounded-full animate-[spin_10s_linear_infinite]" />
             <Truck size={32} className="text-gold-500" strokeWidth={1} />
          </div>
          <h1 className="text-4xl md:text-6xl font-serif text-white tracking-widest mb-6">SHIPPING POLICY</h1>
          <div className="h-[1px] w-24 bg-gold-500 mx-auto" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="space-y-8"
        >
          {/* Hero Section - Region */}
          <div className="bg-white/5 p-8 md:p-12 border border-white/10 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-700">
                <Globe size={120} />
             </div>
             <div className="relative z-10">
                <div className="flex items-center gap-3 text-gold-500 mb-4">
                    <MapPin size={18} />
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Shipping Region</span>
                </div>
                <h2 className="text-2xl font-serif text-white mb-2">Domestic Exclusivity</h2>
                <p className="text-white/60 text-sm font-light leading-relaxed max-w-lg">
                  Currently, DEUZ & CO ships within <span className="text-white font-medium">India only</span>. International logistics for our global clientele are currently being established.
                </p>
             </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
             {/* Processing */}
             <div className="bg-[#0A0A0A] p-8 border border-white/5 hover:border-gold-500/30 transition-colors group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[1px] h-0 bg-gold-500 group-hover:h-full transition-all duration-700 ease-out" />
                <div className="mb-6 w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/50 group-hover:text-gold-500 group-hover:bg-gold-500/10 transition-colors">
                   <Clock size={20} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-3">Processing Time</h3>
                <p className="text-white/50 text-xs leading-loose">
                  Orders may be ready-stock or made-to-order. Processing timelines will be communicated individually at the time of confirmation via your concierge channel.
                </p>
             </div>

             {/* Delivery Timeline */}
             <div className="bg-[#0A0A0A] p-8 border border-white/5 hover:border-gold-500/30 transition-colors group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[1px] h-0 bg-gold-500 group-hover:h-full transition-all duration-700 ease-out delay-100" />
                <div className="mb-6 w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/50 group-hover:text-gold-500 group-hover:bg-gold-500/10 transition-colors">
                   <Calendar size={20} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-3">Delivery Timeline</h3>
                <p className="text-white/50 text-xs leading-loose">
                  Standard delivery timeframe is <span className="text-white">3–7 business days</span> after dispatch. Expedited shipping options may be available upon request.
                </p>
             </div>

             {/* Confirmation */}
             <div className="bg-[#0A0A0A] p-8 border border-white/5 hover:border-gold-500/30 transition-colors group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[1px] h-0 bg-gold-500 group-hover:h-full transition-all duration-700 ease-out delay-200" />
                <div className="mb-6 w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/50 group-hover:text-gold-500 group-hover:bg-gold-500/10 transition-colors">
                   <Mail size={20} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-3">Shipping Confirmation</h3>
                <p className="text-white/50 text-xs leading-loose">
                  Tracking details (if applicable) will be shared directly to your registered contact method once the order has been successfully dispatched.
                </p>
             </div>

             {/* Delays */}
             <div className="bg-[#0A0A0A] p-8 border border-white/5 hover:border-gold-500/30 transition-colors group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[1px] h-0 bg-gold-500 group-hover:h-full transition-all duration-700 ease-out delay-300" />
                <div className="mb-6 w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/50 group-hover:text-gold-500 group-hover:bg-gold-500/10 transition-colors">
                   <AlertTriangle size={20} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-3">Logistics Disclaimer</h3>
                <p className="text-white/50 text-xs leading-loose">
                  While we aim for timely delivery, DEUZ & CO is not responsible for courier delays beyond our control (e.g., weather, strikes, or regional restrictions).
                </p>
             </div>
          </div>

          <div className="mt-16 pt-16 border-t border-white/10 text-center">
             <div className="inline-flex items-center gap-4 px-6 py-3 border border-white/10 rounded-full bg-white/[0.02]">
                <Package size={16} className="text-gold-500" />
                <p className="text-white/60 text-xs uppercase tracking-wider">
                   All shipments are securely packaged to preserve the integrity of each piece.
                </p>
             </div>
          </div>

        </motion.div>
      </div>
    </motion.div>
  );
};

export default ShippingPage;