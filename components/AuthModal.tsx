import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Fingerprint, ArrowRight, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login, signup, loginWithGoogle, forgotPassword } = useAuth();
  const { content } = useSettings();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleQuickFillAdmin = () => {
    setMode('login');
    setFormData({
      ...formData,
      email: 'unk410066@gmail.com',
      password: 'Admin@12345'
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'forgot') {
        if (!formData.email) {
          setError('Please provide your encrypted email address.');
          setLoading(false);
          return;
        }
        const res = await forgotPassword(formData.email);
        if (res.success) {
          setSuccess(res.message || 'Passcode recovery instructions sent.');
          setTimeout(() => {
            setMode('login');
            setSuccess('');
          }, 2500);
        } else {
          setError(res.message || 'Unable to process recovery.');
        }
        setLoading(false);
        return;
      }

      if (mode === 'login') {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          setSuccess('Identity Verified. Access Granted.');
          setTimeout(() => {
            closeAuthModal();
            setFormData({ fullName: '', email: '', mobile: '', password: '', confirmPassword: '' });
          }, 1200);
        } else {
          let errorMsg = result.message || 'Access Denied. Credentials Invalid.';
          try {
            const parsed = JSON.parse(errorMsg);
            if (parsed.error) errorMsg = parsed.error;
          } catch (e) {}
          if (errorMsg.includes('auth/invalid-credential') || errorMsg.includes('auth/wrong-password')) {
             errorMsg = 'Invalid passkey. Please check your credentials.';
          } else if (errorMsg.includes('auth/user-not-found')) {
             errorMsg = 'No dossier found for this email address.';
          } else if (errorMsg.includes('auth/too-many-requests')) {
             errorMsg = 'Too many attempts. Please wait a moment.';
          }
          setError(errorMsg);
        }
      } else {
        if (!formData.fullName || !formData.email || !formData.password) {
          setError('Legal name, email, and access passkey are required.');
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Passcode must be at least 6 characters in length.');
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passcode confirmation does not match.');
          setLoading(false);
          return;
        }

        const result = await signup({
          fullName: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password
        });

        if (result.success) {
          setSuccess('Dossier initialized. Welcome to Deuz & Co.');
          setTimeout(() => {
            closeAuthModal();
            setFormData({ fullName: '', email: '', mobile: '', password: '', confirmPassword: '' });
          }, 1200);
        } else {
          let errorMsg = result.message || 'Identity creation failed.';
          try {
            const parsed = JSON.parse(errorMsg);
            if (parsed.error) errorMsg = parsed.error;
          } catch (e) {}
          if (errorMsg.includes('auth/email-already-in-use')) {
             errorMsg = 'An existing dossier is already linked to this email.';
          } else if (errorMsg.includes('auth/weak-password')) {
             errorMsg = 'Passcode is too weak.';
          }
          setError(errorMsg);
        }
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
          className="fixed inset-0 z-[100] flex bg-[#020202] text-white overflow-hidden"
        >
          {/* Left Side - Cinematic Imagery */}
          <div className="hidden lg:block relative w-1/2 h-full overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                src={images[activeImage]}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 0.6, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover"
                alt="Cinematic Background"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-[#020202]" />
            
            <div className="absolute bottom-20 left-20 right-20">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <ShieldCheck className="text-gold-500 mb-6" size={32} />
                <h2 className="text-4xl font-serif tracking-wide mb-4">
                  {mode === 'login' && 'RESTRICTED ACCESS'}
                  {mode === 'signup' && 'JOIN THE SYNDICATE'}
                  {mode === 'forgot' && 'KEY RECOVERY'}
                </h2>
                <p className="text-white/50 text-sm font-light leading-relaxed max-w-md">
                  {mode === 'login' && 'Authenticate your identity to access your private dossier, track acquisitions, and manage your secure vault.'}
                  {mode === 'signup' && 'Establish your identity within our network. Gain exclusive access to classified artifacts and bespoke services.'}
                  {mode === 'forgot' && 'Request an encrypted authorization key reset dispatched to your registered address.'}
                </p>
              </motion.div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full lg:w-1/2 h-full flex flex-col relative">
            <button 
              onClick={closeAuthModal} 
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
                        {mode === 'login' && 'Authentication'}
                        {mode === 'signup' && 'Registration'}
                        {mode === 'forgot' && 'Passcode Recovery'}
                      </span>
                    </div>

                    {/* Operator quick fill shortcut */}
                    <button
                      type="button"
                      onClick={handleQuickFillAdmin}
                      className="text-[9px] text-white/30 hover:text-gold-500 uppercase tracking-widest transition-colors"
                      title="Load Executive Account"
                    >
                      Admin Auto-Fill
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
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
                      />
                      <label className="absolute left-0 top-3 text-white/40 text-sm transition-all peer-focus:-top-3 peer-focus:text-[10px] peer-focus:text-gold-500 peer-focus:uppercase peer-focus:tracking-widest peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-white/60 peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest pointer-events-none">
                        Encrypted Email Address
                      </label>
                    </div>

                    {mode !== 'forgot' && (
                      <div className="relative group">
                        <input 
                          name="password" 
                          type="password" 
                          required
                          value={formData.password} 
                          onChange={handleChange} 
                          className="w-full bg-transparent border-b border-white/20 py-3 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors peer" 
                          placeholder=" "
                        />
                        <label className="absolute left-0 top-3 text-white/40 text-sm transition-all peer-focus:-top-3 peer-focus:text-[10px] peer-focus:text-gold-500 peer-focus:uppercase peer-focus:tracking-widest peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-white/60 peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest pointer-events-none">
                          Access Passcode
                        </label>
                      </div>
                    )}

                    <AnimatePresence mode="popLayout">
                      {mode === 'signup' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, y: -10 }} 
                          animate={{ opacity: 1, height: 'auto', y: 0 }} 
                          exit={{ opacity: 0, height: 0, y: -10 }} 
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden pt-2"
                        >
                          <div className="relative group">
                            <input 
                              name="confirmPassword" 
                              type="password" 
                              required={mode === 'signup'}
                              value={formData.confirmPassword} 
                              onChange={handleChange} 
                              className="w-full bg-transparent border-b border-white/20 py-3 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors peer" 
                              placeholder=" "
                            />
                            <label className="absolute left-0 top-3 text-white/40 text-sm transition-all peer-focus:-top-3 peer-focus:text-[10px] peer-focus:text-gold-500 peer-focus:uppercase peer-focus:tracking-widest peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-white/60 peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest pointer-events-none">
                              Verify Passcode
                            </label>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {mode === 'login' && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                          className="text-[10px] uppercase tracking-widest text-white/40 hover:text-gold-500 transition-colors"
                        >
                          Forgot Passcode?
                        </button>
                      </div>
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
                        disabled={loading} 
                        className="w-full py-4 bg-white text-black hover:bg-gold-500 hover:text-white transition-all duration-300 uppercase tracking-[0.2em] text-[10px] font-bold flex items-center justify-center gap-3 disabled:opacity-50 group"
                      >
                        {loading ? (
                          <span className="animate-pulse">Authenticating Session...</span>
                        ) : (
                          <>
                            <Fingerprint size={16} className="group-hover:scale-110 transition-transform" />
                            {mode === 'login' && 'Initialize Session'}
                            {mode === 'signup' && 'Establish Identity'}
                            {mode === 'forgot' && 'Transmit Recovery Key'}
                          </>
                        )}
                      </button>

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
                          <p className="text-white/40 text-xs">Don't have a dossier yet?</p>
                          <button 
                            type="button" 
                            onClick={() => { 
                              setMode('signup'); 
                              setError(''); 
                              setSuccess(''); 
                            }} 
                            className="text-[10px] uppercase tracking-[0.2em] text-white hover:text-gold-500 transition-colors flex items-center justify-center gap-2 mx-auto group"
                          >
                            Request New Dossier
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-white/40 text-xs">Already have an active identity?</p>
                          <button 
                            type="button" 
                            onClick={() => { 
                              setMode('login'); 
                              setError(''); 
                              setSuccess(''); 
                            }} 
                            className="text-[10px] uppercase tracking-[0.2em] text-white hover:text-gold-500 transition-colors flex items-center justify-center gap-2 mx-auto group"
                          >
                            Return to Login
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="text-center pt-4">
                      <span className="text-[9px] text-white/30 uppercase tracking-[0.25em] flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold-500/60" />
                        Secured via Firebase Authentication
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
