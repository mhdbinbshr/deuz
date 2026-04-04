import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Lock, EyeOff, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLoginPage from './AdminLoginPage';

interface AdminRouteProps {
  children: React.ReactNode;
  onExit: () => void;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children, onExit }) => {
  const { user, isLoading } = useAuth();
  const [status, setStatus] = useState<'checking' | 'login_required' | 'authorized' | 'unauthorized'>('checking');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Not logged in -> Show Admin Login Screen
      setStatus('login_required');
    } else if (user.role === 'admin' || user.role === 'concierge') {
      // Logged in + Correct Role -> Show Dashboard
      setStatus('authorized');
    } else {
      // Logged in + Wrong Role (Customer) -> Access Denied
      setStatus('unauthorized');
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onExit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [user, isLoading, onExit]);

  if (status === 'checking') {
    return (
        <div className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-white/20 border-t-gold-500 rounded-full animate-spin" />
                <span className="text-white/40 text-[10px] uppercase tracking-[0.3em] animate-pulse">Establishing Secure Connection</span>
            </div>
        </div>
    );
  }

  if (status === 'login_required') {
    return (
      <AdminLoginPage 
        onLoginSuccess={() => setStatus('checking')} // Re-run check after login
        onCancel={onExit}
      />
    );
  }

  if (status === 'unauthorized') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#020202] flex items-center justify-center overflow-hidden font-mono select-none">
        {/* Background Glitch & Scanlines */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
             <div className="absolute top-0 w-full h-1 bg-red-500/50 shadow-[0_0_20px_#ef4444] animate-[scan_2s_linear_infinite]" />
        </div>
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#000_3px)] opacity-50" />

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 text-center px-6 max-w-lg w-full"
        >
          {/* Hexagon Lock Icon */}
          <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 10, ease: "linear", repeat: Infinity }}
               className="absolute inset-0 border-2 border-dashed border-red-500/20 rounded-full"
             />
             <motion.div 
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
               className="w-16 h-16 bg-red-900/20 border border-red-500 rounded-lg flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)] relative overflow-hidden"
             >
                <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
                <Lock size={32} className="text-red-500 relative z-10" />
             </motion.div>
          </div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold text-red-500 tracking-[0.2em] mb-4 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"
          >
            ACCESS DENIED
          </motion.h1>
          
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: "100%" }} 
            transition={{ delay: 0.5, duration: 0.8 }}
            className="h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent mx-auto mb-8" 
          />
          
          <div className="bg-black/80 border border-red-500/20 p-6 rounded-sm mb-8 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-50"><ShieldAlert size={16} className="text-red-500"/></div>
            <p className="text-red-400 text-sm leading-relaxed mb-4">
              <span className="block text-[10px] uppercase tracking-widest text-red-500/50 mb-2">Security Violation: 0xAD403</span>
              This area is restricted to Tier 1 & 2 Personnel only. Your identity ({user?.email}) does not have clearance.
            </p>
            <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
               <EyeOff size={12} />
               <span>Incident Logged</span>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="text-white/30 text-[10px] uppercase tracking-widest">
              Redirecting to public sector in <span className="text-red-500 font-bold">{countdown}</span> seconds...
            </div>
            
            <button 
              onClick={onExit}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500 text-red-500 text-xs uppercase tracking-widest transition-all rounded-sm group"
            >
              <X size={14} className="group-hover:rotate-90 transition-transform" />
              Return Immediately
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Only render children if strictly authorized
  return <>{children}</>;
};