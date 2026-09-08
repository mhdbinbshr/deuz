import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Sparkles, 
  Mail, 
  Check, 
  Copy, 
  ShieldCheck, 
  Compass, 
  Clock, 
  Globe 
} from 'lucide-react';

interface ContactProps {
  onOpenConcierge?: () => void;
}

const ATELIER_CITIES = [
  { city: 'Paris', label: 'Place Vendôme' },
  { city: 'London', label: 'Mayfair' },
  { city: 'New York', label: 'Madison Ave' },
  { city: 'Tokyo', label: 'Ginza' }
];

export const Contact: React.FC<ContactProps> = ({ onOpenConcierge }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText('deuzandco@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <section 
      id="contact" 
      className="relative z-10 py-16 sm:py-24 px-4 sm:px-8 border-t border-white/[0.06] bg-[#030303] overflow-hidden"
    >
      {/* Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06)_0%,transparent_70%)] pointer-events-none blur-[90px]" />

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Compact Cinematic Concierge Frame */}
        <div className="relative rounded-sm border border-gold-500/30 bg-gradient-to-b from-[#0c0a06] via-[#080808] to-[#040404] p-8 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden">
          
          {/* Classical Corner Filigree Markers */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-gold-500/60" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-gold-500/60" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-gold-500/60" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-gold-500/60" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            
            {/* Left Narrative */}
            <div className="text-center md:text-left space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-400 text-[8px] sm:text-[9px] uppercase tracking-[0.3em] font-mono">
                <Sparkles size={11} className="text-gold-400 animate-pulse" />
                <span>Private Salon & Atelier Services</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-serif text-white tracking-[0.1em] uppercase leading-tight">
                The Private Concierge
              </h2>

              <p className="text-xs sm:text-sm text-white/60 font-light leading-relaxed">
                Experience bespoke tailoring, singular archive acquisitions, and private salon viewings. Tailored exclusively by appointment across our worldwide ateliers.
              </p>

              {/* Atelier Cities Pill Row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-[9px] font-mono tracking-widest text-gold-400/80">
                {ATELIER_CITIES.map((c, idx) => (
                  <span key={c.city} className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.06]">
                    <span className="w-1 h-1 rounded-full bg-gold-400" />
                    <span>{c.city} — {c.label}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Right Action Block */}
            <div className="flex flex-col items-center md:items-end gap-4 w-full md:w-auto shrink-0">
              
              {/* Primary Cinematic Redirect CTA */}
              <button
                onClick={onOpenConcierge}
                className="w-full sm:w-auto px-8 py-4 bg-gold-500 hover:bg-white text-black font-mono font-bold text-xs uppercase tracking-[0.25em] transition-all duration-300 shadow-[0_0_25px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 cursor-pointer group"
              >
                <span>Enter Private Concierge</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Direct Confidential Desk Email */}
              <div className="flex items-center gap-2 text-xs font-mono text-white/60 bg-black/60 border border-white/10 px-3.5 py-2 rounded-sm">
                <Mail size={13} className="text-gold-400" />
                <span className="text-white/80">deuzandco@gmail.com</span>
                <button
                  onClick={handleCopyEmail}
                  className="ml-1 text-gold-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Concierge Email"
                >
                  {copiedEmail ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>

              <div className="flex items-center gap-2 text-[9px] font-mono text-white/40">
                <ShieldCheck size={11} className="text-gold-400" />
                <span>Strict Non-Disclosure Protocol</span>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default Contact;
