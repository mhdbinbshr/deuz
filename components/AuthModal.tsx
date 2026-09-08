import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Fingerprint, ArrowRight, ShieldCheck, CheckCircle2, Mail, ExternalLink, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { sendGmailSecurityCode, verifyGmailSecurityCode } from '../utils/securityVerification';

const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login, signup, loginWithGoogle } = useAuth();
  const { content } = useSettings();
  const [mode, setMode] = useState<'login' | 'signup' | 'verify2fa'>('login');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: ''
  });
  const [securityCode, setSecurityCode] = useState('');
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const images = content.scrollImages && content.scrollImages.length > 0 
    ? content.scrollImages 
    : [
        'https://images.unsplash.com/photo-1478720568477-152d9b164e63?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1495554605298-8d361208bd48?q=80&w=1000&auto=format&fit=crop'
      ];

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAuthModalOpen, images.length]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => setResendCountdown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0 || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await sendGmailSecurityCode(formData.email);
      setPreviewCode(res.code);
      setResendCountdown(60);
      setSuccess('A fresh security code has been transmitted to your Gmail.');
    } catch {
      setError('Unable to dispatch security code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const normalizedEmail = formData.email.toLowerCase().trim();

      // Step 1 of Login (Passwordless)
      if (mode === 'login') {
        if (!normalizedEmail) {
          setError('Please provide your Gmail address.');
          setLoading(false);
          return;
        }

        // Dispatch 2FA Security Code to user's Gmail
        const dispatch = await sendGmailSecurityCode(normalizedEmail);
        if (!dispatch.success) {
          setError('Failed to dispatch security code to Gmail. Please try again.');
          setLoading(false);
          return;
        }

        setPreviewCode(dispatch.code);
        setMode('verify2fa');
        setSecurityCode('');
        setResendCountdown(60);
        setSuccess(`A 6-digit security code has been sent to Gmail: ${normalizedEmail}`);
        setLoading(false);
        return;
      }

      // Step 1 of Signup (Passwordless)
      if (mode === 'signup') {
        if (!formData.fullName.trim() || !normalizedEmail) {
          setError('Legal name and Gmail address are required.');
          setLoading(false);
          return;
        }

        const dispatch = await sendGmailSecurityCode(normalizedEmail);
        if (!dispatch.success) {
          setError('Failed to dispatch security code to Gmail. Please try again.');
          setLoading(false);
          return;
        }

        setPreviewCode(dispatch.code);
        setMode('verify2fa');
        setSecurityCode('');
        setResendCountdown(60);
        setSuccess(`A 6-digit security verification code has been dispatched to: ${normalizedEmail}`);
        setLoading(false);
        return;
      }

      // Step 2: Verify 6-digit code and finalize authentication passwordlessly
      if (mode === 'verify2fa') {
        const verification = await verifyGmailSecurityCode(normalizedEmail, securityCode);

        if (!verification.valid) {
          setError(verification.message || 'Invalid security code. Please verify the 6-digit code.');
          setLoading(false);
          return;
        }

        // If signing up with full name, register dossier
        if (formData.fullName.trim()) {
          const result = await signup({
            fullName: formData.fullName,
            email: normalizedEmail,
            mobile: formData.mobile
          });

          if (result.success) {
            setSuccess('Security Code Verified. Dossier Initialized.');
            setTimeout(() => {
              closeAuthModal();
              setFormData({ fullName: '', email: '', mobile: '' });
              setSecurityCode('');
              setMode('login');
            }, 1000);
          } else {
            setError(result.message || 'Failed to establish identity.');
          }
        } else {
          // Standard login
          const result = await login(normalizedEmail, 'passwordless');
          if (result.success) {
            setSuccess('Security Code Verified. Access Granted.');
            setTimeout(() => {
              closeAuthModal();
              setFormData({ fullName: '', email: '', mobile: '' });
              setSecurityCode('');
              setMode('login');
            }, 1000);
          } else {
            setError(result.message || 'Access Denied. Verification failed.');
          }
        }
        setLoading(false);
        return;
      }
    } catch (err: any) {
      setError(err.message || 'System connection refused.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex bg-[#020202] text-white overflow-hidden select-none"
        >
          {/* Left Side - Cinematic Imagery */}
          <div className="hidden lg:block relative w-1/2 h-full overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                src={images[activeImage]}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 0.4, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute inset-0 w-full h-full object-cover grayscale"
                alt="Atmosphere"
              />
            </AnimatePresence>

            {/* Ambient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-transparent opacity-80" />
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#020202]/40 to-[#020202]" />

            <div className="absolute top-12 left-12">
              <span className="font-serif text-xl tracking-[0.25em] text-white">DEUZ & CO.</span>
              <p className="text-[9px] uppercase tracking-[0.4em] text-gold-500/80 mt-1">Passwordless Security Protocol</p>
            </div>

            <div className="absolute bottom-20 left-20 right-20">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <ShieldCheck className="text-gold-500 mb-6" size={32} />
                <h2 className="text-4xl font-serif tracking-wide mb-4">
                  {mode === 'login' && 'DOSSIER ACCESS'}
                  {mode === 'verify2fa' && 'GMAIL 2FA VERIFICATION'}
                  {mode === 'signup' && 'ESTABLISH IDENTITY'}
                </h2>
                <p className="text-white/50 text-sm font-light leading-relaxed max-w-md">
                  {mode === 'login' && 'Passwordless authentication. Simply enter your Gmail address and a one-time 6-digit verification code will be dispatched to authenticate your session.'}
                  {mode === 'verify2fa' && 'Input the 6-digit security code dispatched to your registered Gmail address to confirm your identity.'}
                  {mode === 'signup' && 'Register your confidential dossier. No passwords required—access is securely authorized via Gmail security dispatch.'}
                </p>
              </motion.div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full lg:w-1/2 h-full flex flex-col relative">
            <button 
              onClick={() => {
                closeAuthModal();
                setMode('login');
                setError('');
                setSuccess('');
              }} 
              className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors z-10 p-2"
              aria-label="Close"
            >
              <X size={24} />
            </button>

            <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-20 overflow-y-auto">
              <div className="w-full max-w-md">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-[1px] bg-gold-500" />
                      <span className="text-gold-500 text-[10px] uppercase tracking-[0.3em]">
                        {mode === 'login' && 'Client Verification // Step 1'}
                        {mode === 'verify2fa' && 'Gmail Security Verification // Step 2'}
                        {mode === 'signup' && 'Dossier Registration'}
                      </span>
                    </div>
                  </div>

                  {/* Testing / Preview Code Banner */}
                  {mode === 'verify2fa' && previewCode && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-3.5 bg-gold-500/10 border border-gold-500/30 text-[11px] text-gold-400 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gold-500 shrink-0" />
                        <span>Security Code: <strong className="text-white tracking-widest text-xs font-mono">{previewCode}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSecurityCode(previewCode)}
                        className="text-[9px] uppercase tracking-wider text-gold-300 underline hover:text-white"
                      >
                        Auto-Insert
                      </button>
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {mode === 'verify2fa' ? (
                      /* 2FA Security Code Verification View */
                      <div className="space-y-6">
                        <div className="p-4 bg-white/5 border border-white/10 text-center">
                          <p className="text-xs text-white/70">
                            A 6-digit security code was dispatched to:
                          </p>
                          <p className="text-sm text-gold-400 font-mono font-bold tracking-wider mt-1">
                            {formData.email}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-gold-500 block text-center">
                            Enter 6-Digit Code
                          </label>
                          <input 
                            type="text" 
                            maxLength={6}
                            value={securityCode}
                            onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-transparent border-b-2 border-gold-500/50 py-3 text-center text-white text-2xl tracking-[0.5em] font-mono font-bold outline-none focus:border-gold-500 transition-colors placeholder:text-white/10"
                            placeholder="••••••"
                            autoFocus
                            required
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <a 
                            href="https://mail.google.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-white/50 hover:text-gold-400 flex items-center gap-1.5 uppercase tracking-wider transition-colors"
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
                            {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Passwordless Login / Registration Form */
                      <>
                        <AnimatePresence mode="popLayout">
                          {mode === 'signup' && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0, y: -10 }} 
                              animate={{ opacity: 1, height: 'auto', y: 0 }} 
                              exit={{ opacity: 0, height: 0, y: -10 }} 
                              transition={{ duration: 0.3 }}
                              className="space-y-6 overflow-hidden"
                            >
                              <div className="relative group">
                                <input 
                                  name="fullName" 
                                  type="text" 
                                  required={mode === 'signup'}
                                  value={formData.fullName} 
                                  onChange={handleChange} 
                                  className="w-full bg-transparent border-b border-white/20 py-3 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors peer" 
                                  placeholder=" "
                                />
                                <label className="absolute left-0 top-3 text-white/40 text-sm transition-all peer-focus:-top-3 peer-focus:text-[10px] peer-focus:text-gold-500 peer-focus:uppercase peer-focus:tracking-widest peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-white/60 peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest pointer-events-none">
                                  Full Legal Name
                                </label>
                              </div>
                              <div className="relative group">
                                <input 
                                  name="mobile" 
                                  type="tel" 
                                  value={formData.mobile} 
                                  onChange={handleChange} 
                                  className="w-full bg-transparent border-b border-white/20 py-3 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors peer" 
                                  placeholder=" "
                                />
                                <label className="absolute left-0 top-3 text-white/40 text-sm transition-all peer-focus:-top-3 peer-focus:text-[10px] peer-focus:text-gold-500 peer-focus:uppercase peer-focus:tracking-widest peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-white/60 peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest pointer-events-none">
                                  Secure Contact Line (Optional)
                                </label>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="relative group">
                          <input 
                            name="email" 
                            type="email" 
                            required
                            value={formData.email} 
                            onChange={handleChange} 
                            className="w-full bg-transparent border-b border-white/20 py-3 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors peer" 
                            placeholder=" "
                            autoComplete="off"
                          />
                          <label className="absolute left-0 top-3 text-white/40 text-sm transition-all peer-focus:-top-3 peer-focus:text-[10px] peer-focus:text-gold-500 peer-focus:uppercase peer-focus:tracking-widest peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-white/60 peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest pointer-events-none">
                            Gmail Address
                          </label>
                        </div>

                        <div className="p-3 bg-white/5 border border-white/10 rounded-sm">
                          <p className="text-[10px] text-white/50 leading-relaxed">
                            <span className="text-gold-400 font-semibold uppercase tracking-wider block mb-0.5">Passwordless Access</span>
                            A secure 6-digit verification code will be sent to your Gmail inbox to authorize this session. No password needed.
                          </p>
                        </div>
                      </>
                    )}
                    
                    <AnimatePresence>
                      {error && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-[11px] text-red-400 uppercase tracking-widest py-1"
                        >
                          {error}
                        </motion.p>
                      )}
                      {success && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 text-[11px] text-gold-500 uppercase tracking-widest py-1"
                        >
                          <CheckCircle2 size={14} />
                          <span>{success}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="pt-4 space-y-3">
                      <button 
                        type="submit" 
                        disabled={loading || (mode === 'verify2fa' && securityCode.length !== 6)} 
                        className="w-full py-4 bg-white text-black hover:bg-gold-500 hover:text-white transition-all duration-300 uppercase tracking-[0.2em] text-[10px] font-bold flex items-center justify-center gap-3 disabled:opacity-50 group"
                      >
                        {loading ? (
                          <span className="animate-pulse">Processing Verification...</span>
                        ) : (
                          <>
                            <Fingerprint size={16} className="group-hover:scale-110 transition-transform" />
                            {mode === 'login' && 'Request 6-Digit Code'}
                            {mode === 'verify2fa' && 'Authorize Session'}
                            {mode === 'signup' && 'Request Verification Code'}
                          </>
                        )}
                      </button>

                      {mode === 'verify2fa' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('login');
                            setSecurityCode('');
                            setError('');
                          }}
                          className="w-full py-2.5 text-white/40 hover:text-white uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-colors"
                        >
                          <ArrowLeft size={13} /> Back to Email Input
                        </button>
                      )}

                      {(mode === 'login' || mode === 'signup') && (
                        <button 
                          type="button"
                          onClick={async () => {
                            setLoading(true);
                            setError('');
                            try {
                              const result = await loginWithGoogle();
                              if (result.success) {
                                setSuccess('Identity Verified. Access Granted.');
                                setTimeout(() => {
                                  closeAuthModal();
                                }, 1200);
                              } else {
                                setError(result.message || 'Google Authentication Failed.');
                              }
                            } catch (err: any) {
                              setError(err.message || 'Google service unavailable.');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading}
                          className="w-full py-3.5 bg-transparent border border-white/20 text-white hover:border-gold-500 hover:text-gold-500 transition-all duration-300 uppercase tracking-[0.2em] text-[10px] font-bold flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          {mode === 'login' ? 'Authenticate with Google' : 'Continue with Google'}
                        </button>
                      )}
                    </div>

                    <div className="text-center pt-6 border-t border-white/10 mt-6 space-y-2">
                      {mode === 'login' ? (
                        <>
                          <p className="text-white/40 text-xs">Don't have a registered dossier yet?</p>
                          <button 
                            type="button" 
                            onClick={() => { 
                              setMode('signup'); 
                              setError(''); 
                              setSuccess(''); 
                            }} 
                            className="text-[10px] uppercase tracking-[0.2em] text-white hover:text-gold-500 transition-colors flex items-center justify-center gap-2 mx-auto group"
                          >
                            Establish New Dossier
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                        </>
                      ) : mode === 'signup' ? (
                        <>
                          <p className="text-white/40 text-xs">Already registered?</p>
                          <button 
                            type="button" 
                            onClick={() => { 
                              setMode('login'); 
                              setError(''); 
                              setSuccess(''); 
                            }} 
                            className="text-[10px] uppercase tracking-[0.2em] text-white hover:text-gold-500 transition-colors flex items-center justify-center gap-2 mx-auto group"
                          >
                            Return to Access
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                        </>
                      ) : null}
                    </div>

                    <div className="text-center pt-4">
                      <span className="text-[9px] text-white/30 uppercase tracking-[0.25em] flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold-500/60" />
                        Passwordless Security via Gmail 2FA Verification
                      </span>
                    </div>
                  </form>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
