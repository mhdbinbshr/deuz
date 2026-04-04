import React from 'react';
import { motion } from 'framer-motion';
import { X, Scale, CreditCard, Box, ShieldAlert, Copyright, FileText } from 'lucide-react';

interface TermsPageProps {
  onClose: () => void;
}

const TermsPage: React.FC<TermsPageProps> = ({ onClose }) => {
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
          className="text-center mb-16"
        >
          <div className="w-16 h-16 mx-auto bg-gold-900/10 border border-gold-500/20 rounded-full flex items-center justify-center mb-6">
             <Scale size={24} className="text-gold-500" strokeWidth={1} />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-white tracking-widest mb-4">TERMS & CONDITIONS</h1>
          <div className="h-[1px] w-24 bg-gold-500 mx-auto" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="space-y-8"
        >
          <div className="bg-white/5 p-8 md:p-12 border border-white/10 relative overflow-hidden mb-12">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <FileText size={120} />
             </div>
             <h2 className="text-xl font-serif text-white mb-4">Concierge Retail Model</h2>
             <p className="text-white/60 text-sm font-light leading-relaxed">
               DEUZ & CO operates under a private concierge retail model.
               All orders are confirmed manually through official communication channels. Submission of an enquiry does not guarantee order confirmation until explicitly approved by DEUZ & CO.
             </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
             <div className="bg-[#0A0A0A] p-8 border border-white/5 hover:border-gold-500/30 transition-colors group">
                <div className="mb-4 text-gold-500 group-hover:scale-110 transition-transform origin-left">
                   <Box size={20} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-3">Product Availability</h3>
                <p className="text-white/50 text-xs leading-relaxed">
                  Each DEUZ & CO piece is designed individually. A design is used for only one product. Availability is therefore limited and subject to confirmation at the time of enquiry.
                </p>
             </div>

             <div className="bg-[#0A0A0A] p-8 border border-white/5 hover:border-gold-500/30 transition-colors group">
                <div className="mb-4 text-gold-500 group-hover:scale-110 transition-transform origin-left">
                   <CreditCard size={20} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-3">Pricing & Payments</h3>
                <p className="text-white/50 text-xs leading-relaxed mb-2">
                  Prices are confirmed during order communication. DEUZ & CO reserves the right to modify pricing without prior notice.
                </p>
                <p className="text-white/50 text-xs leading-relaxed">
                  Payments are accepted only through approved methods communicated directly via official channels. Orders are processed only after payment confirmation.
                </p>
             </div>

             <div className="bg-[#0A0A0A] p-8 border border-white/5 hover:border-gold-500/30 transition-colors group">
                <div className="mb-4 text-gold-500 group-hover:scale-110 transition-transform origin-left">
                   <Copyright size={20} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-3">Intellectual Property</h3>
                <p className="text-white/50 text-xs leading-relaxed">
                  All designs, visuals, content, branding, and concepts under DEUZ & CO are protected intellectual property. Reproduction or unauthorized use is strictly prohibited.
                </p>
             </div>

             <div className="bg-[#0A0A0A] p-8 border border-white/5 hover:border-gold-500/30 transition-colors group">
                <div className="mb-4 text-gold-500 group-hover:scale-110 transition-transform origin-left">
                   <ShieldAlert size={20} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-3">Limitation of Liability</h3>
                <p className="text-white/50 text-xs leading-relaxed">
                  DEUZ & CO is not responsible for delays caused by courier services, unforeseen logistical disruptions, or force majeure events.
                </p>
             </div>
          </div>

          <div className="mt-16 pt-16 border-t border-white/10 text-center">
             <p className="text-white text-sm font-serif italic tracking-wide">
               By engaging with DEUZ & CO, you agree to these terms.
             </p>
          </div>

        </motion.div>
      </div>
    </motion.div>
  );
};

export default TermsPage;