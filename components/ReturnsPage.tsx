import React from 'react';
import { motion } from 'framer-motion';
import { X, RefreshCw, AlertTriangle, Camera, FileText, CheckCircle2, Ban, ShieldAlert, AlertOctagon } from 'lucide-react';

interface ReturnsPageProps {
  onClose: () => void;
}

const ReturnsPage: React.FC<ReturnsPageProps> = ({ onClose }) => {
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
             <RefreshCw size={32} className="text-gold-500" strokeWidth={1} />
          </div>
          <h1 className="text-4xl md:text-6xl font-serif text-white tracking-widest mb-6">RETURN POLICY</h1>
          <div className="h-[1px] w-24 bg-gold-500 mx-auto" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="space-y-12"
        >
          {/* Core Policy - Strict No Return */}
          <div className="bg-red-950/10 border border-red-500/20 p-8 md:p-12 text-center relative overflow-hidden group">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.1),transparent_70%)] opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
             <div className="relative z-10">
                <div className="flex justify-center mb-6">
                    <AlertOctagon size={48} className="text-red-500" strokeWidth={1} />
                </div>
                <h2 className="text-2xl font-serif text-white mb-4 tracking-widest">STRICT NO-RETURN POLICY</h2>
                <p className="text-white/70 text-sm font-light leading-relaxed max-w-2xl mx-auto">
                  Due to the exclusive nature of our products, DEUZ & CO maintains a strict no-return policy. Each artifact is singular and final.
                </p>
             </div>
          </div>

          {/* Defective Items Section */}
          <div>
             <div className="flex items-center gap-4 mb-8">
                <div className="h-[1px] flex-1 bg-white/10" />
                <h3 className="text-gold-500 text-xs font-bold uppercase tracking-[0.3em]">Defective Items Exception</h3>
                <div className="h-[1px] flex-1 bg-white/10" />
             </div>
             
             <div className="bg-[#0A0A0A] border border-white/5 p-8 md:p-12">
                <div className="mb-10 text-center">
                    <p className="text-white text-lg font-serif">Returns are accepted <span className="text-gold-500 underline decoration-white/20 underline-offset-4">only</span> in the case of manufacturing defects.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    <div className="p-6 bg-white/5 border border-white/5 hover:border-gold-500/30 transition-colors group">
                        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white/50 mb-4 group-hover:text-gold-500 transition-colors">
                            <span className="font-serif">01</span>
                        </div>
                        <h4 className="text-white text-xs uppercase tracking-widest mb-2 font-bold">Report Immediately</h4>
                        <p className="text-white/50 text-xs leading-relaxed">Contact us within <span className="text-white">48 hours</span> of delivery to initiate a claim.</p>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/5 hover:border-gold-500/30 transition-colors group">
                        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white/50 mb-4 group-hover:text-gold-500 transition-colors">
                            <Camera size={16} />
                        </div>
                        <h4 className="text-white text-xs uppercase tracking-widest mb-2 font-bold">Document Evidence</h4>
                        <p className="text-white/50 text-xs leading-relaxed">Provide clear photographic and video evidence of the defect.</p>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/5 hover:border-gold-500/30 transition-colors group">
                        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white/50 mb-4 group-hover:text-gold-500 transition-colors">
                            <FileText size={16} />
                        </div>
                        <h4 className="text-white text-xs uppercase tracking-widest mb-2 font-bold">Verify Purchase</h4>
                        <p className="text-white/50 text-xs leading-relaxed">Include order confirmation details and reference ID.</p>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h4 className="text-white text-sm font-serif mb-1">Resolution Protocol</h4>
                        <p className="text-white/40 text-xs">If the defect is verified, DEUZ & CO will offer:</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="px-6 py-3 border border-green-500/20 bg-green-500/5 text-green-400 text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                            <RefreshCw size={14} /> Replacement <span className="text-[8px] opacity-60 font-normal normal-case">(If applicable)</span>
                        </div>
                        <div className="px-6 py-3 border border-white/20 bg-white/5 text-white text-xs uppercase tracking-widest font-bold">
                            Refund
                        </div>
                    </div>
                </div>
             </div>
          </div>

          {/* Exclusions & Disclaimers */}
          <div className="grid md:grid-cols-2 gap-8">
             <div className="p-8 border border-white/10 bg-[#0A0A0A] relative group">
                <div className="absolute top-0 right-0 p-4 opacity-20 text-red-500">
                    <ShieldAlert size={40} />
                </div>
                <h4 className="text-white text-xs uppercase tracking-widest mb-4 font-bold flex items-center gap-2">
                    <Ban size={14} className="text-red-500" /> Non-Eligible Conditions
                </h4>
                <p className="text-white/50 text-xs leading-loose">
                    Items damaged due to misuse, improper handling, or normal wear are <span className="text-red-400">not eligible</span> for return. The integrity of the artifact must be compromised upon arrival to qualify.
                </p>
             </div>

             <div className="p-8 border border-white/10 bg-[#0A0A0A] relative group">
                <div className="absolute top-0 right-0 p-4 opacity-20 text-gold-500">
                    <CheckCircle2 size={40} />
                </div>
                <h4 className="text-white text-xs uppercase tracking-widest mb-4 font-bold flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-gold-500" /> Singularity Clause
                </h4>
                <p className="text-white/50 text-xs leading-loose">
                    As each design is exclusive and singular, <span className="text-white">change-of-mind returns are not accepted</span>. We urge clients to review specifications carefully before acquisition.
                </p>
             </div>
          </div>

          <div className="mt-16 pt-16 border-t border-white/10 text-center">
             <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4">Concierge Claims Channel</p>
             <a href="mailto:deuzandco@gmail.com" className="text-xl font-serif text-white hover:text-gold-500 transition-colors border-b border-white/20 pb-1">
                 deuzandco@gmail.com
             </a>
          </div>

        </motion.div>
      </div>
    </motion.div>
  );
};

export default ReturnsPage;