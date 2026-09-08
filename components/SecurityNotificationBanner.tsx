import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ShieldCheck, Copy, Check, ExternalLink, X } from 'lucide-react';

interface SecurityDispatchDetail {
  email: string;
  code: string;
  expiresInMinutes: number;
}

export const SecurityNotificationBanner: React.FC = () => {
  const [dispatchInfo, setDispatchInfo] = useState<SecurityDispatchDetail | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleSecurityCode = (e: Event) => {
      const customEvent = e as CustomEvent<SecurityDispatchDetail>;
      if (customEvent.detail) {
        setDispatchInfo(customEvent.detail);
        setCopied(false);
      }
    };

    window.addEventListener('deuz:security_code_sent', handleSecurityCode);
    return () => window.removeEventListener('deuz:security_code_sent', handleSecurityCode);
  }, []);

  const handleCopy = () => {
    if (!dispatchInfo) return;
    navigator.clipboard.writeText(dispatchInfo.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!dispatchInfo) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] max-w-sm w-full pointer-events-auto select-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-[#0c0c0c]/95 border border-gold-500/40 p-4 rounded-sm shadow-[0_10px_40px_rgba(0,0,0,0.9)] backdrop-blur-md text-white font-mono relative overflow-hidden"
        >
          {/* Subtle scanning accent line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold-500 to-transparent animate-pulse" />

          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center">
                <Mail size={13} className="text-gold-400" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white">
                  Gmail 2FA Dispatched
                </h4>
                <p className="text-[9px] text-white/40 truncate max-w-[200px]">
                  {dispatchInfo.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => setDispatchInfo(null)}
              className="text-white/40 hover:text-white p-1 transition-colors"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>

          <div className="my-3 p-2.5 bg-black/80 border border-white/10 rounded flex items-center justify-between">
            <div>
              <span className="text-[8px] uppercase tracking-widest text-gold-500/70 block">Security Passcode</span>
              <span className="text-base font-bold tracking-[0.3em] text-gold-400 font-mono">
                {dispatchInfo.code}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-gold-500 hover:text-black transition-all text-[9px] uppercase tracking-wider rounded-sm text-white"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 text-[9px] text-white/50 border-t border-white/5">
            <span className="flex items-center gap-1">
              <ShieldCheck size={11} className="text-gold-500" />
              Valid for {dispatchInfo.expiresInMinutes}m
            </span>
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-400 hover:text-white flex items-center gap-1 uppercase tracking-wider transition-colors"
            >
              Open Gmail <ExternalLink size={10} />
            </a>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
