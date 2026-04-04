import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Fingerprint, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login, signup, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
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

  const images = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop", // Luxury interior
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop", // Cinematic architecture
    "https://images.unsplash.com/photo-1507676184212-d0330a15233c?q=80&w=2069&auto=format&fit=crop"  // Abstract dark luxury
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          setSuccess('Identity Verified. Access Granted.');
          setTimeout(() => {
            closeAuthModal();
            setFormData({ fullName: '', email: '', mobile: '', password: '', confirmPassword: '' });
          }, 1500);
        } else {
          setError(result.message || 'Access Denied. Credentials Invalid.');
        }
      } else {
        if (!formData.fullName || !formData.email || !formData.password) {
          setError('Identity details required.');
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passcode verification failed.');
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
          }, 1500);
        } else {
          setError(result.message || 'Identity creation failed.');
        }
      }
    } catch (err) {
      setError('System unavailable.');
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
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
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
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <ShieldCheck className="text-gold-500 mb-6" size={32} />
                <h2 className="text-4xl font-serif tracking-wide mb-4">
                  {mode === 'login' ? 'RESTRICTED ACCESS' : 'JOIN THE SYNDICATE'}
                </h2>
                <p className="text-white/50 text-sm font-light leading-relaxed max-w-md">
                  {mode === 'login' 
                    ? 'Authenticate your identity to access your private dossier, track acquisitions, and manage your secure vault.' 
                    : 'Establish your identity within our network. Gain exclusive access to classified artifacts and bespoke services.'}
                </p>
              </motion.div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full lg:w-1/2 h-full flex flex-col relative">
            <button 
              onClick={closeAuthModal} 
              className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors z-10 p-2"
            >
              <X size={24} />
            </button>

            <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-20 overflow-y-auto">
              <div className="w-full max-w-md">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                >
                  <div className="flex items-center gap-3 mb-12">
                    <div className="w-8 h-[1px] bg-gold-500" />
                    <span className="text-gold-500 text-[10px] uppercase tracking-[0.3em]">
                      {mode === 'login' ? 'Authentication' : 'Registration'}
                    </span>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    <AnimatePresence mode="popLayout">
                      {mode === 'signup' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, y: -10 }} 
                          animate={{ opacity: 1, height: 'auto', y: 0 }} 
                          exit={{ opacity: 0, height: 0, y: -10 }} 
                          transition={{ duration: 0.4 }}
                          className="space-y-8 overflow-hidden"
                        >
                          <div className="relative group">
                            <input 
                              name="fullName" 
                              type="text" 
                              required={mode === 'signup'}
                              value={formData.fullName} 
                              onChange={handleChange} 
                              className="w-full bg-transparent border-b border-white/20 py-4 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors peer" 
                              placeholder=" "
                            />
                            <label className="absolute left-0 top-4 text-white/40 text-sm transition-all peer-focus:-top-3 peer-focus:text-[10px] peer-focus:text-gold-500 peer-focus:uppercase peer-focus:tracking-widest peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-white/60 peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest pointer-events-none">
                              Full Legal Name
                            </label>
                          </div>
                          <div className="relative group">
                            <input 
                              name="mobile" 
                              type="tel" 
                              value={formData.mobile} 
                              onChange={handleChange} 
                              className="w-full bg-transparent border-b border-white/20 py-4 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors peer" 
                              placeholder=" "
                            />
                            <label className="absolute left-0 top-4 text-white/40 text-sm transition-all peer-focus:-top-3 peer-focus:text-[10px] peer-focus:text-gold-500 peer-focus:uppercase peer-focus:tracking-widest peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-white/60 peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest pointer-events-none">
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
                        className="w-full bg-transparent border-b border-white/20 py-4 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors peer" 
                        placeholder=" "
                      />
                      <label className="absolute left-0 top-4 text-white/40 text-sm transition-all peer-focus:-top-3 peer-focus:text-[10px] peer-focus:text-gold-500 peer-focus:uppercase peer-focus:tracking-widest peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-white/60 peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest pointer-events-none">
                        Encrypted Email Address
                      </label>
                    </div>

                    <div className="relative group">
                      <input 
                        name="password" 
                        type="password" 
                        required
                        value={formData.password} 
                        onChange={handleChange} 
                        className="w-full bg-transparent border-b border-white/20 py-4 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors peer" 
                        placeholder=" "
                      />
                      <label className="absolute left-0 top-4 text-white/40 text-sm transition-all peer-focus:-top-3 peer-focus:text-[10px] peer-focus:text-gold-500 peer-focus:uppercase peer-focus:tracking-widest peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-white/60 peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest pointer-events-none">
                        Access Passcode
                      </label>
                    </div>

                    <AnimatePresence mode="popLayout">
                      {mode === 'signup' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, y: -10 }} 
                          animate={{ opacity: 1, height: 'auto', y: 0 }} 
                          exit={{ opacity: 0, height: 0, y: -10 }} 
                          transition={{ duration: 0.4 }}
                          className="overflow-hidden pt-8"
                        >
                          <div className="relative group">
                            <input 
                              name="confirmPassword" 
                              type="password" 
                              required={mode === 'signup'}
                              value={formData.confirmPassword} 
                              onChange={handleChange} 
                              className="w-full bg-transparent border-b border-white/20 py-4 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors peer" 
                              placeholder=" "
                            />
                            <label className="absolute left-0 top-4 text-white/40 text-sm transition-all peer-focus:-top-3 peer-focus:text-[10px] peer-focus:text-gold-500 peer-focus:uppercase peer-focus:tracking-widest peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-white/60 peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest pointer-events-none">
                              Verify Passcode
                            </label>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <AnimatePresence>
                      {error && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-[10px] text-red-500 uppercase tracking-widest"
                        >
                          {error}
                        </motion.p>
                      )}
                      {success && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-[10px] text-gold-500 uppercase tracking-widest"
                        >
                          {success}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <div className="pt-8 space-y-4">
                      <button 
                        disabled={loading} 
                        className="w-full py-5 bg-white text-black hover:bg-gold-500 transition-all duration-500 uppercase tracking-[0.2em] text-[10px] font-bold flex items-center justify-center gap-3 disabled:opacity-50 group"
                      >
                        {loading ? (
                          <span className="animate-pulse">Establishing Connection...</span>
                        ) : (
                          <>
                            <Fingerprint size={16} className="group-hover:scale-110 transition-transform" />
                            {mode === 'login' ? 'Initialize Session' : 'Establish Identity'}
                          </>
                        )}
                      </button>

                      {mode === 'login' && (
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
                                }, 1500);
                              } else {
                                setError(result.message || 'Google Authentication Failed.');
                              }
                            } catch (err) {
                              setError('System unavailable.');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading}
                          className="w-full py-4 bg-transparent border border-white/20 text-white hover:border-gold-500 hover:text-gold-500 transition-all duration-300 uppercase tracking-[0.2em] text-[10px] font-bold flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          Continue with Google
                        </button>
                      )}
                    </div>

                    <div className="text-center pt-6 border-t border-white/10 mt-8">
                      <p className="text-white/40 text-xs mb-4">
                        {mode === 'login' ? "Don't have a dossier?" : "Already established?"}
                      </p>
                      <button 
                        type="button" 
                        onClick={() => { 
                          setMode(mode === 'login' ? 'signup' : 'login'); 
                          setError(''); 
                          setSuccess(''); 
                          setFormData({ fullName: '', email: '', mobile: '', password: '', confirmPassword: '' });
                        }} 
                        className="text-[10px] uppercase tracking-[0.2em] text-white hover:text-gold-500 transition-colors flex items-center justify-center gap-2 mx-auto group"
                      >
                        {mode === 'login' ? 'Request New Dossier' : 'Return to Login'}
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </button>
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