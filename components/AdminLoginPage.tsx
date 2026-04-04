import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Fingerprint, ChevronRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onCancel }) => {
  const { login, user, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in as admin
  useEffect(() => {
    if (!isLoading && user && (user.role === 'admin' || user.role === 'concierge')) {
      onLoginSuccess();
    }
  }, [user, isLoading, onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.message || 'Credentials Invalid. Access Denied.');
      }
    } catch (err) {
      setError('Connection refused.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#020202] flex items-center justify-center overflow-hidden font-mono">
      {/* Background Matrix/Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.5)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-md p-8"
      >
        <div className="bg-[#0A0A0A] border border-white/10 p-10 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden group">
          {/* Scanning Line Animation */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gold-500/50 shadow-[0_0_20px_#D4AF37] animate-[scan_3s_ease-in-out_infinite] opacity-50 pointer-events-none" />

          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-6 relative">
               <Lock className="text-white/40" size={24} />
               <div className="absolute inset-0 border border-t-gold-500 rounded-full animate-spin duration-[3s]" />
            </div>
            <h1 className="text-2xl text-white font-bold tracking-[0.3em] mb-2 text-center">DEUZ CORP</h1>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.4em]">Restricted Access Area</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gold-500 block">Operator ID</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-white/20 p-4 text-white text-xs tracking-wider outline-none focus:border-gold-500 transition-colors placeholder:text-white/10"
                placeholder="system@deuz.co"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gold-500 block">Passkey</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-white/20 p-4 text-white text-xs tracking-wider outline-none focus:border-gold-500 transition-colors placeholder:text-white/10"
                placeholder="••••••••••••"
              />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 text-red-500 bg-red-950/20 p-3 border border-red-900/30">
                <AlertTriangle size={14} />
                <span className="text-[10px] uppercase tracking-widest font-bold">{error}</span>
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black py-4 uppercase tracking-[0.2em] text-xs font-bold hover:bg-gold-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <span className="animate-pulse">Authenticating...</span>
              ) : (
                <>
                  <Fingerprint size={16} /> Authenticate
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center space-y-4">
            <button onClick={onCancel} className="text-[10px] text-white/30 uppercase tracking-widest hover:text-white transition-colors block w-full">
              Abort Sequence / Return Home
            </button>
            <a href="/admin/setup" className="text-[8px] text-white/10 uppercase tracking-widest hover:text-gold-500 transition-colors inline-block font-sans">
              // Initialize Core
            </a>
          </div>
        </div>
        
        <div className="text-center mt-6 text-[9px] text-white/20 uppercase tracking-widest font-mono">
          System ID: 0x8F2A • Encryption: AES-256 • IP: Logged
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;