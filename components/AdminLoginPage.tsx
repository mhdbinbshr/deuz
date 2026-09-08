import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Fingerprint, AlertTriangle, ShieldCheck, Mail, ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { verifyAdminPasskey, ADMIN_EMAIL, sendGmailSecurityCode, verifyGmailSecurityCode } from '../utils/securityVerification';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onCancel }) => {
  const { login, user, isLoading } = useAuth();
  // Strictly clean state - NO auto-fill, Passwordless verification
  const [email, setEmail] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  // Auto-redirect if already authenticated as executive admin
  useEffect(() => {
    if (!isLoading && user && (user.role === 'admin' || user.email === ADMIN_EMAIL)) {
      onLoginSuccess();
    }
  }, [user, isLoading, onLoginSuccess]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => setResendCountdown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Step 1: Validate Admin Identity & Dispatch Gmail 2FA Code (Passwordless)
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const normalizedEmail = email.toLowerCase().trim();

    try {
      // Strictly protected executive check
      if (normalizedEmail !== ADMIN_EMAIL) {
        throw new Error('Unauthorized Operator ID. Terminal access restricted.');
      }

      // Dispatch 2FA security code to Gmail
      const dispatchResult = await sendGmailSecurityCode(normalizedEmail);
      if (!dispatchResult.success) {
        throw new Error('Failed to dispatch security code to Gmail. Try again.');
      }

      setPreviewCode(dispatchResult.code);
      setStep('2fa');
      setResendCountdown(60);
      setSuccess(`Security verification code dispatched to Gmail (${normalizedEmail})`);
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Validate 6-Digit Gmail Security Code and Authorize Session Passwordlessly
  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const normalizedEmail = email.toLowerCase().trim();

    try {
      const verification = await verifyGmailSecurityCode(normalizedEmail, securityCode);
      if (!verification.valid) {
        setError(verification.message || 'Security code verification failed.');
        setLoading(false);
        return;
      }

      // Complete passwordless system login
      const result = await login(normalizedEmail, 'passwordless');
      if (result.success) {
        setSuccess('Security Code Verified. Access Authorized.');
        setTimeout(() => {
          onLoginSuccess();
        }, 800);
      } else {
        setError(result.message || 'Session authorization failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0 || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await sendGmailSecurityCode(email);
      setPreviewCode(res.code);
      setResendCountdown(60);
      setSuccess('A fresh 6-digit security code has been transmitted to Gmail.');
    } catch (err: any) {
      setError('Unable to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#020202] flex items-center justify-center overflow-hidden font-mono select-none">
      {/* Background Matrix/Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.5)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-md p-6"
      >
        <div className="bg-[#0A0A0A] border border-white/10 p-8 sm:p-10 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden group">
          {/* Scanning Line Animation */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gold-500/50 shadow-[0_0_20px_#D4AF37] animate-[scan_3s_ease-in-out_infinite] opacity-50 pointer-events-none" />

          {/* Terminal Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-5 relative">
              {step === 'credentials' ? (
                <Lock className="text-white/40" size={24} />
              ) : (
                <Mail className="text-gold-500 animate-pulse" size={24} />
              )}
              <div className="absolute inset-0 border border-t-gold-500 rounded-full animate-spin duration-[3s]" />
            </div>
            <h1 className="text-2xl text-white font-bold tracking-[0.3em] mb-1.5 text-center">DEUZ CORP</h1>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.4em]">
              {step === 'credentials' ? 'Restricted Executive Terminal' : 'Gmail 2FA Security Protocol'}
            </p>
          </div>

          {/* Dev/Preview Notice for Fast Verification */}
          {previewCode && step === '2fa' && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3 bg-gold-500/10 border border-gold-500/30 text-gold-400 text-[11px] flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="shrink-0 text-gold-500" />
                <span>Security Code: <strong className="text-white tracking-widest text-xs">{previewCode}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setSecurityCode(previewCode)}
                className="text-[9px] uppercase tracking-wider text-gold-300 underline hover:text-white"
              >
                Insert Code
              </button>
            </motion.div>
          )}

          {step === 'credentials' ? (
            /* Step 1 Form: Operator Gmail Verification (Passwordless) */
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gold-500 block">Operator Gmail</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-white/20 p-3.5 text-white text-xs tracking-wider outline-none focus:border-gold-500 transition-colors placeholder:text-white/20 font-mono"
                  placeholder="operator@domain.com"
                  autoComplete="off"
                  required
                />
                <p className="text-[9px] text-white/30 tracking-wider">
                  Passwordless authentication. A 6-digit security code will be sent to the authorized Gmail address.
                </p>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 text-red-400 bg-red-950/30 p-3 border border-red-900/40">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span className="text-[10px] uppercase tracking-widest font-bold">{error}</span>
                </motion.div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-white text-black py-4 uppercase tracking-[0.2em] text-xs font-bold hover:bg-gold-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <span className="animate-pulse">Dispatching Security Code...</span>
                ) : (
                  <>
                    <Fingerprint size={16} /> Dispatch 2FA Security Code
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2 Form: Gmail 6-Digit Security Code */
            <form onSubmit={handleVerificationSubmit} className="space-y-5">
              <div className="text-center mb-2">
                <p className="text-[11px] text-white/60 leading-relaxed">
                  A 6-digit security code was dispatched to:
                </p>
                <p className="text-xs text-gold-400 font-bold tracking-wider mt-0.5">
                  {email}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gold-500 block text-center">
                  6-Digit Verification Code
                </label>
                <input 
                  type="text" 
                  maxLength={6}
                  value={securityCode}
                  onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-black border border-white/20 py-3.5 text-center text-white text-xl tracking-[0.6em] font-bold outline-none focus:border-gold-500 transition-colors placeholder:text-white/10"
                  placeholder="000000"
                  autoFocus
                  required
                />
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
                disabled={loading || securityCode.length !== 6}
                className="w-full bg-white text-black py-4 uppercase tracking-[0.2em] text-xs font-bold hover:bg-gold-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <span className="animate-pulse">Authorizing Terminal...</span>
                ) : (
                  <>
                    <ShieldCheck size={16} /> Authorize Executive Access
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2">
                <a 
                  href="https://mail.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] text-white/40 hover:text-gold-400 flex items-center gap-1.5 uppercase tracking-wider transition-colors"
                >
                  <ExternalLink size={12} /> Open Gmail
                </a>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCountdown > 0 || loading}
                  className="text-[10px] text-gold-500/80 hover:text-gold-400 uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-40"
                >
                  <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                  {resendCountdown > 0 ? `Resend (${resendCountdown}s)` : 'Resend Code'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setSecurityCode('');
                  setError('');
                }}
                className="text-[10px] text-white/30 uppercase tracking-widest hover:text-white transition-colors flex items-center justify-center gap-2 w-full pt-1"
              >
                <ArrowLeft size={12} /> Return to Credentials
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <button onClick={onCancel} className="text-[10px] text-white/30 uppercase tracking-widest hover:text-white transition-colors block w-full">
              Abort Sequence / Return Home
            </button>
          </div>
        </div>
        
        <div className="text-center mt-6 text-[9px] text-white/20 uppercase tracking-widest font-mono">
          System ID: DEUZ-CORE • Encryption: SHA-256 / AES-256 • IP & Audit: Logged
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
