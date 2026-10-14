import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Fingerprint, AlertTriangle, ShieldCheck, Mail, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ADMIN_EMAIL } from '../utils/securityVerification';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onCancel }) => {
  const { login, user, isLoading } = useAuth();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already authenticated as executive admin
  useEffect(() => {
    if (!isLoading && user && (user.role === 'admin' || user.email === ADMIN_EMAIL)) {
      onLoginSuccess();
    }
  }, [user, isLoading, onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const normalizedEmail = email.toLowerCase().trim();

    try {
      // 1. Validate operator identity
      if (normalizedEmail !== ADMIN_EMAIL) {
        throw new Error('Unauthorized Operator ID. Terminal access strictly restricted.');
      }

      if (!password) {
        throw new Error('Executive password is required.');
      }

      // 2. Authenticate directly with Firebase Authentication
      const result = await login(normalizedEmail, password);
      
      if (result.success) {
        setSuccess('Executive Clearance Verified. Access Authorized.');
        setTimeout(() => {
          onLoginSuccess();
        }, 600);
      } else {
        setError(result.message || 'Authorization rejected. Invalid credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Terminal connection fault.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#020202] flex items-center justify-center overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-8 font-mono select-none min-h-screen">
      {/* Background Matrix/Grid Effect */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(20,20,20,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.5)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-md my-auto py-4"
      >
        <div className="bg-[#0A0A0A] border border-white/10 p-8 sm:p-10 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden group">
          {/* Scanning Line Animation */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gold-500/50 shadow-[0_0_20px_#D4AF37] animate-[scan_3s_ease-in-out_infinite] opacity-50 pointer-events-none" />

          {/* Terminal Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-5 relative">
              <Lock className="text-gold-500" size={24} />
              <div className="absolute inset-0 border border-t-gold-500 rounded-full animate-spin duration-[3s]" />
            </div>
            <h1 className="text-2xl text-white font-bold tracking-[0.3em] mb-1.5 text-center">DEUZ CORP</h1>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.4em]">
              Restricted Executive Terminal
            </p>
          </div>

          {/* Direct Secured Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-gold-500 block">Operator Gmail</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-white/20 pl-10 pr-3.5 py-3 text-white text-xs tracking-wider outline-none focus:border-gold-500 transition-colors placeholder:text-white/20 font-mono"
                  placeholder="operator@domain.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-gold-500 block">Executive Password</label>
              <div className="relative">
                <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-white/20 pl-10 pr-10 py-3 text-white text-xs tracking-wider outline-none focus:border-gold-500 transition-colors placeholder:text-white/20 font-mono"
                  placeholder="Enter executive password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-[9px] text-white/30 tracking-wider">
                Cryptographic authentication enabled. Authorizes root administrative controls.
              </p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 text-red-400 bg-red-950/30 p-3 border border-red-900/40">
                <AlertTriangle size={14} className="shrink-0" />
                <span className="text-[10px] uppercase tracking-widest font-bold">{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-gold-400 bg-gold-950/30 p-3 border border-gold-900/40 text-[10px] uppercase tracking-wider">
                <ShieldCheck size={14} className="shrink-0 text-gold-500" />
                <span>{success}</span>
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black py-4 uppercase tracking-[0.2em] text-xs font-bold hover:bg-gold-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {loading ? (
                <span className="animate-pulse flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Verifying Authorization...
                </span>
              ) : (
                <>
                  <Fingerprint size={16} /> Authorize Executive Access
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <button onClick={onCancel} className="text-[10px] text-white/30 uppercase tracking-widest hover:text-white transition-colors block w-full cursor-pointer">
              Abort Sequence / Return Home
            </button>
          </div>
        </div>
        
        <div className="text-center mt-6 text-[9px] text-white/20 uppercase tracking-widest font-mono">
          System ID: DEUZ-CORE • Encryption: SHA-256 / SSL 256-BIT • IP & Audit: Logged
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
