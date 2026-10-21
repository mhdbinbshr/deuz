import React from 'react';
import { Instagram, Mail, Phone } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface FooterProps {
  onOpenStore?: () => void;
  onOpenArchive?: () => void;
  onOpenContact?: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenShipping?: () => void;
  onOpenReturns?: () => void;
}

const Footer: React.FC<FooterProps> = ({ 
  onOpenStore, 
  onOpenArchive, 
  onOpenContact, 
  onOpenPrivacy, 
  onOpenTerms, 
  onOpenShipping, 
  onOpenReturns 
}) => {
  const { content, concierge } = useSettings();
  const displayPhone = concierge.phoneNumber || '+91 920 7676 921';
  const cleanTel = displayPhone.replace(/[^\d+]/g, '');

  return (
    <footer className="bg-black border-t border-white/10 pt-14 sm:pt-20 pb-8 sm:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center">
        
        <div className="mb-8 sm:mb-12 text-center">
          <span className="text-2xl xs:text-3xl md:text-5xl font-serif text-white tracking-[0.15em] sm:tracking-[0.2em] opacity-90">
            DEUZ & CO
          </span>
        </div>

        <div className="flex gap-6 sm:gap-8 mb-10 sm:mb-12">
          <a 
            href={`https://instagram.com/${concierge.instagramHandle}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white hover:scale-110 transition-all duration-300 p-2.5 border border-white/10 rounded-full hover:border-white/40"
            aria-label="Instagram"
          >
            <Instagram size={20} />
          </a>
          <a 
            href={`mailto:${concierge.emailAddress}`}
            className="text-white/60 hover:text-white hover:scale-110 transition-all duration-300 p-2.5 border border-white/10 rounded-full hover:border-white/40"
            aria-label="Email"
          >
            <Mail size={20} />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 w-full max-w-5xl border-b border-white/10 pb-10 sm:pb-12 mb-8 sm:mb-12">
           <div className="text-center md:text-left">
              <h3 className="text-gold-500 text-xs uppercase tracking-widest mb-4 sm:mb-6 font-bold">DEUZ & CO</h3>
              <div className="space-y-3 sm:space-y-4 text-white/60 text-xs sm:text-sm">
                 <a href={`mailto:${concierge.emailAddress}`} className="flex items-center justify-center md:justify-start gap-3 break-all hover:text-gold-400 transition-colors cursor-pointer"><Mail size={14} className="shrink-0" /> {concierge.emailAddress}</a>
                 <a href={`tel:${cleanTel}`} className="flex items-center justify-center md:justify-start gap-3 hover:text-gold-400 transition-colors cursor-pointer"><Phone size={14} className="shrink-0" /> {displayPhone}</a>
              </div>
           </div>
           
           <div className="text-center">
              <h3 className="text-gold-500 text-xs uppercase tracking-widest mb-4 sm:mb-6 font-bold">THE HOUSE</h3>
              <div className="space-y-3 flex flex-col text-xs sm:text-sm text-white/40 items-center">
                 <button onClick={onOpenStore} className="hover:text-white transition-colors cursor-pointer">Form 01</button>
                 {onOpenArchive && (
                   <button onClick={onOpenArchive} className="hover:text-white transition-colors cursor-pointer">The Vault Archive</button>
                 )}
                 <a href="#about" className="hover:text-white transition-colors cursor-pointer">Philosophy</a>
                 {onOpenContact && (
                   <button onClick={onOpenContact} className="hover:text-white transition-colors cursor-pointer">Private Concierge</button>
                 )}
              </div>
           </div>

           <div className="text-center md:text-right">
              <h3 className="text-gold-500 text-xs uppercase tracking-widest mb-4 sm:mb-6 font-bold">INFORMATION</h3>
              <div className="space-y-3 flex flex-col text-xs sm:text-sm text-white/40 items-center md:items-end">
                 <button onClick={onOpenPrivacy} className="hover:text-white transition-colors cursor-pointer">Privacy</button>
                 <button onClick={onOpenTerms} className="hover:text-white transition-colors cursor-pointer">Terms</button>
                 <button onClick={onOpenShipping} className="hover:text-white transition-colors cursor-pointer">Shipping</button>
                 <button onClick={onOpenReturns} className="hover:text-white transition-colors cursor-pointer">Returns</button>
              </div>
           </div>
        </div>

        <div className="w-full flex flex-col md:flex-row justify-between items-center text-[10px] text-white/30 uppercase tracking-wider text-center">
          <p>© DEUZ & CO</p>
          <p className="mt-2 md:mt-0">{content.footerText || 'Not for everyone'}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;