import React, { useState } from 'react';
import { Instagram, Mail, Phone } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface FooterProps {
  onOpenStore?: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenShipping?: () => void;
  onOpenReturns?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenStore, onOpenPrivacy, onOpenTerms, onOpenShipping, onOpenReturns }) => {
  const { content, concierge } = useSettings();

  return (
    <footer className="bg-black border-t border-white/10 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
        
        <div className="mb-12">
          <span className="text-3xl md:text-5xl font-serif text-white tracking-[0.2em] opacity-90">
            DEUZ & CO
          </span>
        </div>

        <div className="flex gap-8 mb-12">
          <a 
            href={`https://instagram.com/${concierge.instagramHandle}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white hover:scale-110 transition-all duration-300 p-2 border border-white/10 rounded-full hover:border-white/40"
          >
            <Instagram size={20} />
          </a>
          <a 
            href={`mailto:${concierge.emailAddress}`}
            className="text-white/60 hover:text-white hover:scale-110 transition-all duration-300 p-2 border border-white/10 rounded-full hover:border-white/40"
          >
            <Mail size={20} />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-5xl border-b border-white/10 pb-12 mb-12">
           <div className="text-center md:text-left">
              <h3 className="text-gold-500 text-xs uppercase tracking-widest mb-6 font-bold">DEUZ & CO</h3>
              <div className="space-y-4 text-white/60 text-sm">
                 <p className="flex items-center justify-center md:justify-start gap-3"><Mail size={14} /> {concierge.emailAddress}</p>
                 <p className="flex items-center justify-center md:justify-start gap-3"><Phone size={14} /> +91 8848918633</p>
              </div>
           </div>
           
           <div className="text-center">
              <h3 className="text-gold-500 text-xs uppercase tracking-widest mb-6 font-bold">THE HOUSE</h3>
              <div className="space-y-3 flex flex-col text-sm text-white/40 items-center">
                 <button onClick={onOpenStore} className="hover:text-white transition-colors">Form 01</button>
                 <a href="#house-standards" className="hover:text-white transition-colors">Philosophy</a>
              </div>
           </div>

           <div className="text-center md:text-right">
              <h3 className="text-gold-500 text-xs uppercase tracking-widest mb-6 font-bold">INFORMATION</h3>
              <div className="space-y-3 flex flex-col text-sm text-white/40">
                 <button onClick={onOpenPrivacy} className="hover:text-white transition-colors">Privacy</button>
                 <button onClick={onOpenTerms} className="hover:text-white transition-colors">Terms</button>
                 <button onClick={onOpenShipping} className="hover:text-white transition-colors">Shipping</button>
                 <button onClick={onOpenReturns} className="hover:text-white transition-colors">Returns</button>
              </div>
           </div>
        </div>

        <div className="w-full flex flex-col md:flex-row justify-between items-center text-[10px] text-white/30 uppercase tracking-wider">
          <p>© 2026 DEUZ & CO</p>
          <p className="mt-2 md:mt-0">SINGULAR BY DESIGN.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;