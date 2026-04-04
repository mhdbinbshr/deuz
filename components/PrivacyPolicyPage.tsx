import React from 'react';
import { motion } from 'framer-motion';
import { X, ShieldCheck } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onClose: () => void;
}

const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onClose }) => {
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

      <div className="max-w-3xl mx-auto px-6 py-20 relative z-10">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="w-16 h-16 mx-auto bg-gold-900/10 border border-gold-500/20 rounded-full flex items-center justify-center mb-6">
             <ShieldCheck size={24} className="text-gold-500" strokeWidth={1} />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-white tracking-widest mb-4">PRIVACY PROTOCOL</h1>
          <div className="h-[1px] w-24 bg-gold-500 mx-auto" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="space-y-12 text-center md:text-left"
        >
          <div className="prose prose-invert max-w-none">
            <p className="text-xl font-serif text-white leading-relaxed text-center mb-12">
              At DEUZ & CO, discretion is part of our identity.
            </p>

            <div className="grid md:grid-cols-2 gap-12 mb-12">
               <div className="bg-white/5 p-8 border border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gold-500/50 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top" />
                  <h3 className="text-gold-500 text-xs uppercase tracking-[0.2em] mb-6 font-bold">Data Collection</h3>
                  <p className="text-white/60 text-sm font-light leading-relaxed mb-4">
                    We collect only the information necessary to process private orders and maintain direct communication with our clients. This may include:
                  </p>
                  <ul className="text-white/80 text-sm space-y-2 font-light">
                    <li className="flex items-center gap-2"><div className="w-1 h-1 bg-gold-500 rounded-full" /> Full name</li>
                    <li className="flex items-center gap-2"><div className="w-1 h-1 bg-gold-500 rounded-full" /> Contact number</li>
                    <li className="flex items-center gap-2"><div className="w-1 h-1 bg-gold-500 rounded-full" /> Email address</li>
                    <li className="flex items-center gap-2"><div className="w-1 h-1 bg-gold-500 rounded-full" /> Delivery address</li>
                    <li className="flex items-center gap-2"><div className="w-1 h-1 bg-gold-500 rounded-full" /> Order details</li>
                  </ul>
               </div>

               <div className="bg-white/5 p-8 border border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gold-500/50 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top" />
                  <h3 className="text-gold-500 text-xs uppercase tracking-[0.2em] mb-6 font-bold">Usage Protocol</h3>
                  <p className="text-white/60 text-sm font-light leading-relaxed mb-4">
                    Client data is used strictly for:
                  </p>
                  <ul className="text-white/80 text-sm space-y-2 font-light">
                    <li className="flex items-center gap-2"><div className="w-1 h-1 bg-gold-500 rounded-full" /> Order confirmation</li>
                    <li className="flex items-center gap-2"><div className="w-1 h-1 bg-gold-500 rounded-full" /> Shipping coordination</li>
                    <li className="flex items-center gap-2"><div className="w-1 h-1 bg-gold-500 rounded-full" /> After-sales communication</li>
                    <li className="flex items-center gap-2"><div className="w-1 h-1 bg-gold-500 rounded-full" /> Service updates</li>
                  </ul>
               </div>
            </div>

            <div className="space-y-8 text-white/50 text-sm font-light leading-loose tracking-wide max-w-2xl mx-auto text-center border-t border-white/10 pt-12">
              <p>
                All enquiries and transactions are conducted via official DEUZ & CO communication channels (Instagram and designated email).
                <br/>
                We do not sell, rent, or distribute personal information to third parties.
              </p>
              <p>
                We implement reasonable safeguards to protect all shared information. However, communication via social media and email is conducted at the user’s discretion.
              </p>
              <p className="text-white">
                By placing an order with DEUZ & CO, you consent to this policy.
              </p>
            </div>

            <div className="mt-16 pt-16 border-t border-white/10 text-center">
               <p className="text-[10px] uppercase tracking-[0.2em] text-gold-500 mb-2">Concierge Contact</p>
               <a href="mailto:deuzandco@gmail.com" className="text-xl font-serif text-white hover:text-gold-500 transition-colors border-b border-white/20 pb-1">
                 deuzandco@gmail.com
               </a>
            </div>

          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PrivacyPolicyPage;