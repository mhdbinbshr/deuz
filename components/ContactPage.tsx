import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Globe, ShieldCheck, Activity } from 'lucide-react';

interface ContactPageProps {
  onClose: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onClose }) => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    inquiryType: 'Acquisition',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
        setTime(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const inquiryTypes = ['Acquisition', 'Press & Media', 'General Inquiry', 'Partnership'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate secure transmission
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    setIsSubmitting(false);
    setIsSent(true);
    
    setTimeout(() => {
        const subject = encodeURIComponent(`[${formState.inquiryType}] Inquiry from ${formState.name}`);
        const body = encodeURIComponent(formState.message);
        window.open(`mailto:deuzandco@gmail.com?subject=${subject}&body=${body}`, '_blank');
        setTimeout(onClose, 2000);
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] bg-[#020202] overflow-hidden flex flex-col md:flex-row"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gold-900/5 to-transparent pointer-events-none" />

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 z-50 text-white/50 hover:text-white transition-colors group flex items-center gap-4 mix-blend-difference"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-500">Terminate Session</span>
        <div className="w-12 h-12 border border-white/10 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500">
            <X size={16} />
        </div>
      </button>

      {/* LEFT: Visual Atmosphere & Data */}
      <div className="w-full md:w-5/12 relative bg-[#050505] flex flex-col justify-between p-6 md:p-12 border-b md:border-b-0 md:border-r border-white/5 overflow-hidden shrink-0">
         {/* Top Meta */}
         <div className="relative z-10 flex flex-row justify-between items-start gap-6">
            <div className="space-y-2 md:space-y-4">
                <h1 className="text-xl md:text-2xl font-serif text-white tracking-[0.2em] leading-none">DEUZ & CO.</h1>
                
                <div className="flex items-center gap-2 text-gold-500/80">
                    <Activity size={12} className="animate-pulse" />
                    <p className="text-[9px] uppercase tracking-[0.3em] font-medium">System Active</p>
                </div>
            </div>
            
            <div className="text-right">
                <p className="text-white/40 font-mono text-xs">{time} UTC</p>
                <p className="text-[9px] text-white/20 uppercase tracking-widest mt-1 hidden md:block">Secure Channel</p>
            </div>
         </div>

         {/* Center Abstract Visualization */}
         <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[60%] pointer-events-none opacity-30 items-center justify-center">
            {/* Spinning Rings */}
            <motion.div 
               animate={{ rotateX: 360, rotateY: 180 }}
               transition={{ duration: 20, ease: "linear", repeat: Infinity }}
               className="w-[400px] h-[400px] border border-white/10 rounded-full absolute"
               style={{ transformStyle: 'preserve-3d' }}
            />
            <motion.div 
               animate={{ rotateX: -360, rotateY: 90 }}
               transition={{ duration: 15, ease: "linear", repeat: Infinity }}
               className="w-[300px] h-[300px] border border-gold-500/20 rounded-full absolute"
               style={{ transformStyle: 'preserve-3d' }}
            />
            <div className="absolute w-[200px] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="absolute h-[200px] w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent" />
         </div>

         {/* Bottom Contact Info - Simplified */}
         <div className="relative z-10 hidden md:flex justify-between items-end">
            <div>
                <p className="text-[9px] text-white/20 uppercase tracking-widest mb-1">Avg. Response Time</p>
                <p className="text-xs text-white/60 font-mono">~ 24 Hours</p>
            </div>
            <Globe size={32} className="text-white/5" strokeWidth={1} />
         </div>
      </div>

      {/* RIGHT: Form Interaction */}
      <div className="w-full md:w-7/12 relative bg-[#020202] overflow-y-auto flex flex-col justify-start md:justify-center p-6 md:p-24 flex-1">
         <div className="max-w-xl w-full mx-auto relative z-10 py-8 md:py-0">
            
            {!isSent && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-16"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-[1px] w-12 bg-gold-500" />
                        <span className="text-gold-500 text-[10px] uppercase tracking-[0.4em]">Concierge Uplink</span>
                    </div>
                    <h2 className="text-5xl md:text-6xl font-serif text-white mb-6 tracking-wide">
                        INITIATE DIALOGUE
                    </h2>
                    <p className="text-white/40 text-sm font-light max-w-md leading-relaxed">
                        All acquisitions and official correspondence are conducted through our secured email protocol. Each request is reviewed directly by the House.
                    </p>
                </motion.div>
            )}

            <AnimatePresence mode="wait">
            {isSent ? (
                <motion.div 
                    key="success"
                    initial={{ scale: 0.95, opacity: 0, filter: 'blur(10px)' }}
                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="border border-white/10 bg-white/[0.02] p-12 md:p-16 text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_20px_#22c55e]" />
                    <motion.div 
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", duration: 1.5 }}
                        className="w-20 h-20 bg-green-900/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-8"
                    >
                        <ShieldCheck size={40} className="text-green-500" strokeWidth={1} />
                    </motion.div>
                    <h3 className="text-3xl font-serif text-white mb-4 tracking-widest">TRANSMISSION SECURED</h3>
                    <p className="text-white/50 text-sm mb-12 font-light leading-relaxed max-w-sm mx-auto">
                        Your dossier has been encrypted and forwarded to our concierge team. A curator will review your request shortly.
                    </p>
                    <div className="inline-flex flex-col items-center gap-2">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-white/30">Redirecting to Mail Client...</span>
                        <div className="w-32 h-[1px] bg-white/10 overflow-hidden">
                            <motion.div 
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="w-full h-full bg-white/50" 
                            />
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.form 
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, filter: 'blur(10px)' }}
                    onSubmit={handleSubmit} 
                    className="space-y-12"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="group relative">
                            <input 
                                type="text" 
                                required
                                value={formState.name}
                                onChange={e => setFormState({...formState, name: e.target.value})}
                                className="w-full bg-transparent border-b border-white/10 py-4 text-white text-lg font-serif outline-none focus:border-gold-500 transition-all placeholder:text-transparent peer"
                                placeholder="Full Name"
                                id="name"
                            />
                            <label 
                                htmlFor="name"
                                className={`absolute left-0 transition-all duration-300 pointer-events-none text-[10px] uppercase tracking-[0.2em] ${formState.name ? '-top-4 text-gold-500' : 'top-4 text-white/30 peer-focus:-top-4 peer-focus:text-gold-500'}`}
                            >
                                Identity
                            </label>
                        </div>
                        <div className="group relative">
                            <input 
                                type="email" 
                                required
                                value={formState.email}
                                onChange={e => setFormState({...formState, email: e.target.value})}
                                className="w-full bg-transparent border-b border-white/10 py-4 text-white text-lg font-serif outline-none focus:border-gold-500 transition-all placeholder:text-transparent peer"
                                placeholder="Email Address"
                                id="email"
                            />
                            <label 
                                htmlFor="email"
                                className={`absolute left-0 transition-all duration-300 pointer-events-none text-[10px] uppercase tracking-[0.2em] ${formState.email ? '-top-4 text-gold-500' : 'top-4 text-white/30 peer-focus:-top-4 peer-focus:text-gold-500'}`}
                            >
                                Contact Protocol
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-white/30 mb-6">Subject Matter</label>
                        <div className="flex flex-wrap gap-4">
                            {inquiryTypes.map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormState({...formState, inquiryType: type})}
                                    className={`relative px-6 py-3 text-[10px] uppercase tracking-[0.2em] border transition-all duration-500 overflow-hidden group ${
                                        formState.inquiryType === type 
                                        ? 'border-gold-500 text-gold-500' 
                                        : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white'
                                    }`}
                                >
                                    <span className="relative z-10">{type}</span>
                                    {formState.inquiryType === type && (
                                        <motion.div layoutId="activeTab" className="absolute inset-0 bg-gold-500/10 z-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="group relative">
                        <textarea 
                            rows={1}
                            required
                            value={formState.message}
                            onChange={e => setFormState({...formState, message: e.target.value})}
                            className="w-full bg-transparent border-b border-white/10 py-4 text-white text-lg font-light outline-none focus:border-gold-500 transition-all placeholder:text-transparent peer resize-none min-h-[60px]"
                            placeholder="Message"
                            id="message"
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                            }}
                        />
                        <label 
                            htmlFor="message"
                            className={`absolute left-0 transition-all duration-300 pointer-events-none text-[10px] uppercase tracking-[0.2em] ${formState.message ? '-top-4 text-gold-500' : 'top-4 text-white/30 peer-focus:-top-4 peer-focus:text-gold-500'}`}
                        >
                            Details
                        </label>
                    </div>

                    <div className="pt-12">
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative w-full md:w-auto px-16 py-6 bg-white/[0.02] border border-white/10 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.22,1,0.36,1]" />
                            <div className="relative z-10 flex items-center justify-center gap-6">
                                <span className={`text-xs uppercase tracking-[0.3em] font-bold transition-colors duration-500 ${isSubmitting ? 'text-white/50' : 'text-white group-hover:text-black'}`}>
                                    {isSubmitting ? 'Encrypting Data...' : 'Transmit Request'}
                                </span>
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <ArrowRight size={16} className="text-white group-hover:text-black transition-colors duration-500 group-hover:translate-x-1" />
                                )}
                            </div>
                        </button>
                    </div>
                </motion.form>
            )}
            </AnimatePresence>
         </div>
      </div>
    </motion.div>
  );
};

export default ContactPage;