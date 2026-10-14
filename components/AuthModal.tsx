import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Phone, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  KeyRound,
  Sparkles,
  RotateCw,
  UserPlus,
  UserX
} from 'lucide-react';
import { db } from '../utils/db';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { LoginAtmosphere3D } from './LoginAtmosphere3D';

const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    login, 
    signup, 
    loginWithGoogle, 
    forgotPassword,
    confirmPasswordReset,
    authModalMode,
    authModalCode
  } = useAuth();
  const { content } = useSettings();
  const formScrollRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'resetConfirm'>('login');
  const [recoveryCode, setRecoveryCode] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUnregisteredUser, setIsUnregisteredUser] = useState(false);
  const [isExistingUserOnSignup, setIsExistingUserOnSignup] = useState(false);
  const [isResetEmailSent, setIsResetEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showUserNotFoundPopup, setShowUserNotFoundPopup] = useState(false);
  const [notFoundEmail, setNotFoundEmail] = useState('');

  // Cooldown timer for resending password reset email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Sync mode and recovery code if provided by auth provider or URL
  useEffect(() => {
    if (isAuthModalOpen) {
      if (authModalMode) {
        setMode(authModalMode);
      }
      if (authModalCode) {
        setRecoveryCode(authModalCode);
      }
    }
  }, [isAuthModalOpen, authModalMode, authModalCode]);

  // Lock background scroll when modal is open and bind Escape key
  useEffect(() => {
    if (isAuthModalOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeAuthModal();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      setError('');
      setSuccess('');
      setIsUnregisteredUser(false);
      setIsExistingUserOnSignup(false);
      setIsResetEmailSent(false);
      setShowUserNotFoundPopup(false);
      setNotFoundEmail('');
      setLoading(false);
    }
  }, [isAuthModalOpen, closeAuthModal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setIsUnregisteredUser(false);
    setIsExistingUserOnSignup(false);
    setShowUserNotFoundPopup(false);
  };

  const handleSwitchMode = (newMode: 'login' | 'signup' | 'forgot' | 'resetConfirm') => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setIsUnregisteredUser(false);
    setIsExistingUserOnSignup(false);
    setIsResetEmailSent(false);
    setShowUserNotFoundPopup(false);
  };

  const handleResendResetEmail = async () => {
    if (resendCooldown > 0 || loading) return;
    const normalizedEmail = formData.email.toLowerCase().trim();
    if (!normalizedEmail) return;
    setLoading(true);
    setError('');
    try {
      const res = await forgotPassword(normalizedEmail);
      if (res.success) {
        setResendCooldown(60);
        setSuccess(`New recovery link dispatched to ${normalizedEmail}. Please check your Spam / Junk folder.`);
      } else {
        setError(res.message || 'Unable to re-transmit recovery email.');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to resend recovery email.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const normalizedEmail = formData.email.toLowerCase().trim();

    try {
      if (mode === 'login') {
        if (!normalizedEmail) {
          setError('Please provide your registered email address.');
          setLoading(false);
          return;
        }
        if (!formData.password) {
          setError('Please enter your password.');
          setLoading(false);
          return;
        }

        // Check user in Firebase before signing in
        const userExistsInFirebase = await db.checkUserExists(normalizedEmail);
        if (!userExistsInFirebase) {
          setLoading(false);
          setNotFoundEmail(normalizedEmail);
          setShowUserNotFoundPopup(true);
          return;
        }

        const res = await login(normalizedEmail, formData.password);
        if (res.success) {
          setSuccess('Identity verified. Accessing atelier dossier...');
          setTimeout(() => {
            closeAuthModal();
          }, 600);
        } else {
          if (res.isUserNotFound) {
            setLoading(false);
            setNotFoundEmail(normalizedEmail);
            setShowUserNotFoundPopup(true);
          } else {
            setError(res.message || 'Authentication failed. Please verify credentials.');
          }
        }
      } else if (mode === 'signup') {
        if (!formData.fullName.trim()) {
          setError('Please enter your full legal name.');
          setLoading(false);
          return;
        }
        if (!normalizedEmail) {
          setError('Please provide a valid email address.');
          setLoading(false);
          return;
        }
        if (!formData.password || formData.password.length < 6) {
          setError('Password must contain at least 6 characters.');
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match. Please re-enter.');
          setLoading(false);
          return;
        }

        const res = await signup({
          fullName: formData.fullName.trim(),
          email: normalizedEmail,
          password: formData.password,
          mobile: formData.mobile.trim()
        });

        if (res.success) {
          setIsExistingUserOnSignup(false);
          setSuccess('Dossier established successfully in the Initiative Stage. Welcome to Deuz & Co.');
          setTimeout(() => {
            closeAuthModal();
          }, 800);
        } else {
          setError(res.message || 'Registration protocol failed.');
          if (res.isNewUser === false || (res.message && (res.message.includes('already linked') || res.message.includes('already registered') || res.message.includes('already in use')))) {
            setIsExistingUserOnSignup(true);
          }
        }
      } else if (mode === 'forgot') {
        if (!normalizedEmail) {
          setError('Please provide your email address.');
          setLoading(false);
          return;
        }

        const res = await forgotPassword(normalizedEmail);
        if (res.success) {
          setIsUnregisteredUser(false);
          setIsResetEmailSent(true);
          setResendCooldown(60);
          setSuccess(res.message || 'Password recovery link transmitted to your email.');
        } else {
          setError(res.message || 'Unable to transmit reset instructions.');
          if (res.isNewUser || (res.message && res.message.toLowerCase().includes('register'))) {
            setIsUnregisteredUser(true);
          }
        }
      } else if (mode === 'resetConfirm') {
        let cleanCode = recoveryCode.trim();
        if (cleanCode.includes('oobCode=')) {
          const match = cleanCode.match(/[?&]oobCode=([^&#]+)/);
          if (match && match[1]) cleanCode = decodeURIComponent(match[1]);
        }
        if (!cleanCode) {
          setError('Please provide the recovery security code or link from your email.');
          setLoading(false);
          return;
        }
        if (!formData.password || formData.password.length < 6) {
          setError('Password must contain at least 6 characters.');
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match. Please re-enter.');
          setLoading(false);
          return;
        }

        const res = await confirmPasswordReset(cleanCode, formData.password);
        if (res.success) {
          setSuccess('Your password has been successfully updated. You may now sign in.');
          setTimeout(() => {
            handleSwitchMode('login');
          }, 1500);
        } else {
          setError(res.message || 'Unable to update password. Code may be invalid or expired.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Security network communication fault.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        setSuccess('Google authorization confirmed.');
        setTimeout(() => {
          closeAuthModal();
        }, 600);
      } else {
        setError(res.message || 'Google authorization interrupted.');
      }
    } catch (err: any) {
      setError(err.message || 'Google authentication service fault.');
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
          className="fixed inset-0 z-50 overflow-y-auto overscroll-y-contain bg-black/90 backdrop-blur-2xl gold-scrollbar touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Ambient Stardust Field in Backdrop Across ALL Screens */}
          <div className="fixed inset-0 pointer-events-none z-0 opacity-40 overflow-hidden">
            <LoginAtmosphere3D intensity={0.75} showOrb={false} />
          </div>

          {/* Centering & dynamic scroll container */}
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) closeAuthModal();
            }}
            className="min-h-full w-full flex items-center justify-center p-3 sm:p-5 md:p-6 lg:p-8 py-6 sm:py-8"
          >
            <div 
              className="relative w-full max-w-lg md:max-w-4xl bg-[#070707] border border-white/15 rounded-xl sm:rounded-lg overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.95)] flex flex-col md:flex-row md:max-h-[88vh] z-10 my-auto shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* User Not Found in Firebase Pop-up Dialog */}
              <AnimatePresence>
                {showUserNotFoundPopup && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) setShowUserNotFoundPopup(false);
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 15 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="relative w-full max-w-md bg-gradient-to-b from-[#141009] via-[#0d0d0d] to-[#070707] border-2 border-amber-500/50 rounded-xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(212,175,55,0.25)] text-center space-y-5 overflow-hidden"
                    >
                      {/* Top gold scanning beam */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent animate-pulse" />

                      {/* Close X */}
                      <button
                        type="button"
                        onClick={() => setShowUserNotFoundPopup(false)}
                        className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                        aria-label="Dismiss pop-up"
                      >
                        <X size={16} />
                      </button>

                      {/* Radar Warning Crest */}
                      <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)] relative">
                        <UserX size={26} className="text-amber-400" />
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-400/90 font-bold block">
                          FIREBASE IDENTITY CHECK // UNREGISTERED
                        </span>
                        <h3 className="text-lg sm:text-xl font-serif text-white font-bold tracking-wide">
                          User Not Found in Firebase
                        </h3>
                        <p className="text-xs text-white/70 leading-relaxed pt-1">
                          No registered client profile or atelier dossier matches <span className="text-gold-400 font-mono font-medium underline break-all">{notFoundEmail}</span>.
                        </p>
                      </div>

                      {/* Informative Security Callout */}
                      <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-left text-[11px] text-white/75 font-sans space-y-1.5 leading-relaxed">
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            Access to Deuz &amp; Co. private salon archives, bespoke vault acquisitions, and supersonic tracking requires an established account. Please register first.
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserNotFoundPopup(false);
                            setFormData(prev => ({ ...prev, email: notFoundEmail }));
                            handleSwitchMode('signup');
                          }}
                          className="w-full py-3 px-4 bg-gradient-to-r from-gold-500 via-gold-400 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-black font-mono text-xs uppercase tracking-[0.2em] font-bold rounded flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(212,175,55,0.35)] transition-all transform hover:scale-[1.01]"
                        >
                          <UserPlus size={15} />
                          <span>Register First / Create Dossier</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowUserNotFoundPopup(false)}
                          className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold-500/30 text-white/70 hover:text-white font-mono text-xs uppercase tracking-wider rounded transition-colors cursor-pointer"
                        >
                          Re-check Email / Try Another
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Top Scanning Golden Laser Beam */}
              <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden pointer-events-none z-30">
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                  className="w-1/2 h-full bg-gradient-to-r from-transparent via-gold-400 to-transparent shadow-[0_0_15px_#D4AF37]"
                />
              </div>

              {/* Close Button */}
              <button
                onClick={closeAuthModal}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-40 text-white/70 hover:text-white bg-black/70 hover:bg-black/95 backdrop-blur-md border border-white/20 rounded-full p-2 transition-all cursor-pointer shadow-lg active:scale-95"
                aria-label="Close Modal"
              >
                <X size={18} />
              </button>

              {/* Atmosphere Chamber - Available across ALL screens (Mobile Top Viewport, Desktop Left Column) */}
              <div 
                onWheel={(e) => {
                  if (formScrollRef.current) {
                    formScrollRef.current.scrollTop += e.deltaY;
                  }
                }}
                className="w-full md:w-5/12 h-36 sm:h-44 md:h-auto relative overflow-hidden bg-black select-none border-b md:border-b-0 md:border-r border-white/10 shrink-0"
              >
                {/* WebGL Atmosphere with rotating gold artifact and stardust */}
                <LoginAtmosphere3D intensity={1.3} />

                {/* Atmospheric Vignette Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#070707] pointer-events-none hidden md:block" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#070707] pointer-events-none md:hidden" />

                {/* Top Atelier Status Badge */}
                <div className="absolute top-3.5 left-4 sm:left-5 z-20 pointer-events-none flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-gold-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-ping" />
                  <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.25em] text-gold-400 font-bold">
                    ATELIER CHAMBER
                  </span>
                </div>

                {/* Mobile View Caption Overlay */}
                <div className="absolute bottom-2.5 left-4 right-4 z-20 pointer-events-none md:hidden flex items-end justify-between">
                  <div>
                    <h3 className="font-serif text-base sm:text-lg text-white tracking-wider leading-none">
                      DEUZ &amp; CO.
                    </h3>
                    <p className="text-[10px] text-white/60 font-light mt-0.5">
                      Atelier Client Portal
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[8px] font-mono text-emerald-400 bg-black/75 px-2 py-0.5 rounded border border-emerald-500/30 backdrop-blur-sm">
                    <ShieldCheck size={11} className="text-emerald-400" />
                    <span>256-BIT SSL</span>
                  </div>
                </div>

              {/* Desktop Atelier Information Overlay */}
              <div className="hidden md:block absolute bottom-8 left-8 right-8 z-10 pointer-events-none">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-gold-400 animate-ping" />
                  <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-gold-400 font-bold">
                    ATELIER ACCESS CHAMBER
                  </span>
                </div>
                <h3 className="font-serif text-2xl text-white tracking-wider mb-2">
                  DEUZ &amp; CO.
                </h3>
                <p className="text-xs text-white/60 font-light leading-relaxed mb-4">
                  Secured atelier gateway. Access private allocations, manage bespoke commissions, and review your confidential client dossier.
                </p>

                {/* Atelier Security Clearance Card */}
                <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3.5 backdrop-blur-md">
                  <div className="flex items-center justify-between text-[9px] font-mono text-gold-400 uppercase tracking-wider font-bold mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-gold-400" /> Cryptographic Integrity
                    </span>
                    <span className="text-emerald-400">256-BIT</span>
                  </div>
                  <p className="text-[10px] text-white/50 leading-relaxed font-light">
                    Protected under high-frequency biometric key exchange. Dossier privileges and stage access synchronize upon verified authentication.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Secure Auth Forms */}
            <div 
              ref={formScrollRef}
              className="w-full md:w-7/12 p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col justify-start relative md:overflow-y-auto md:max-h-[88vh] gold-scrollbar overscroll-contain touch-pan-y"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              
              {/* Top Navigation Tabs */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('login')}
                    className={`text-xs uppercase font-mono tracking-[0.25em] pb-1 transition-colors relative cursor-pointer ${
                      mode === 'login' ? 'text-gold-400 font-bold' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Sign In
                    {mode === 'login' && (
                      <motion.div layoutId="authTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold-500 shadow-[0_0_8px_#D4AF37]" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchMode('signup')}
                    className={`text-xs uppercase font-mono tracking-[0.25em] pb-1 transition-colors relative cursor-pointer ${
                      mode === 'signup' ? 'text-gold-400 font-bold' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Register Dossier
                    {mode === 'signup' && (
                      <motion.div layoutId="authTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold-500 shadow-[0_0_8px_#D4AF37]" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">
                    LIVE SSL 256
                  </span>
                </div>
              </div>

              {/* Header Title */}
              <div className="mb-5">
                <h2 className="text-xl sm:text-2xl font-serif text-white tracking-wide">
                  {mode === 'login' && 'Atelier Client Sign In'}
                  {mode === 'signup' && 'Establish Client Dossier'}
                  {mode === 'forgot' && 'Password Recovery Protocol'}
                  {mode === 'resetConfirm' && 'Set New Dossier Password'}
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  {mode === 'login' && 'Authenticate credentials to inspect acquisitions, orders, and tier privileges.'}
                  {mode === 'signup' && 'Establish your confidential account to unlock private capsule drops.'}
                  {mode === 'forgot' && 'Transmit password reset instructions to your registered contact.'}
                  {mode === 'resetConfirm' && 'Enter your verified recovery security code to configure updated credentials.'}
                </p>
              </div>

              {/* Status Notifications */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3.5 bg-red-950/40 border border-red-500/40 rounded text-red-300 text-xs flex items-center gap-2.5"
                >
                  <AlertTriangle size={15} className="shrink-0 text-red-400" />
                  <span>{error}</span>
                </motion.div>
              )}

              {isUnregisteredUser && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-3.5 bg-gold-500/10 border border-gold-500/30 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <UserIcon size={16} className="text-gold-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">New User? Register First</p>
                      <p className="text-white/60 text-[11px] mt-0.5">
                        This email address is not yet registered. Please register first to establish your account.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleSwitchMode('signup');
                      setIsUnregisteredUser(false);
                    }}
                    className="w-full sm:w-auto px-3.5 py-1.5 bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-black text-[10px] font-mono uppercase tracking-widest font-bold rounded flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.25)]"
                  >
                    <span>Register Now</span>
                    <ArrowRight size={12} />
                  </button>
                </motion.div>
              )}

              {isExistingUserOnSignup && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-3.5 bg-gold-500/10 border border-gold-500/30 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <UserIcon size={16} className="text-gold-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">Already Registered?</p>
                      <p className="text-white/60 text-[11px] mt-0.5">
                        This email address is already registered. Sign in with your password or reset your password.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleSwitchMode('login');
                      setIsExistingUserOnSignup(false);
                    }}
                    className="w-full sm:w-auto px-3.5 py-1.5 bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-black text-[10px] font-mono uppercase tracking-widest font-bold rounded flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.25)]"
                  >
                    <span>Sign In Now</span>
                    <ArrowRight size={12} />
                  </button>
                </motion.div>
              )}

              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-3.5 bg-gold-500/10 border border-gold-500/40 rounded text-gold-300 text-xs flex items-center gap-2.5"
                >
                  <CheckCircle2 size={15} className="shrink-0 text-gold-400" />
                  <span>{success}</span>
                </motion.div>
              )}

              {/* If mode is forgot and recovery email was transmitted */}
              {mode === 'forgot' && isResetEmailSent ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gold-500/10 border border-gold-500/40 rounded-lg text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-gold-500/20 border border-gold-400/40 flex items-center justify-center mx-auto text-gold-400">
                      <Mail size={20} />
                    </div>
                    <h4 className="text-white font-mono text-sm uppercase tracking-wider font-bold">
                      Recovery Instructions Dispatched
                    </h4>
                    <p className="text-white/70 text-xs">
                      A password reset link was dispatched to <span className="text-gold-400 font-mono font-medium">{formData.email}</span>.
                    </p>
                  </div>

                  {/* Crucial Spam Folder Notice */}
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-300 font-mono uppercase tracking-wider font-semibold text-[11px]">
                      <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                      <span>Important: Check Your Spam / Junk Folder</span>
                    </div>
                    <p className="text-white/70 text-[11px] leading-relaxed">
                      Automated emails from Firebase Authentication (<span className="text-gold-400 font-mono">noreply@gen-lang-client-0255030909.firebaseapp.com</span>) frequently land in the <span className="text-white font-semibold">Spam</span> or <span className="text-white font-semibold">Junk</span> folder, or under the <span className="text-white font-semibold">Promotions</span> tab.
                    </p>
                    <p className="text-white/50 text-[10px] font-mono">
                      Search your mailbox for <span className="text-gold-400">"firebaseapp.com"</span> or check your Spam filter if not visible in your Primary inbox.
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('resetConfirm')}
                      className="w-full py-3 bg-gradient-to-r from-gold-500 via-gold-400 to-amber-400 text-black hover:from-gold-400 hover:to-amber-300 font-mono text-xs uppercase tracking-[0.2em] font-bold rounded flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.25)] transition-all"
                    >
                      <KeyRound size={14} />
                      <span>Enter Recovery Code Directly</span>
                    </button>

                    {/* Go to Sign Up Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetEmailSent(false);
                        setSuccess('');
                        setError('');
                        handleSwitchMode('signup');
                      }}
                      className="w-full py-2.5 bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/40 hover:border-gold-400 text-gold-300 hover:text-gold-200 font-mono text-xs uppercase tracking-[0.18em] font-semibold rounded flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all"
                    >
                      <UserPlus size={14} className="text-gold-400" />
                      <span>Go to Sign Up / Establish Dossier</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={resendCooldown > 0 || loading}
                        onClick={handleResendResetEmail}
                        className="flex-1 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-gold-500/40 text-white/80 hover:text-white font-mono text-[11px] uppercase tracking-wider rounded flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <RotateCw size={12} className={loading ? "animate-spin" : ""} />
                        <span>{resendCooldown > 0 ? `Resend In ${resendCooldown}s` : 'Resend Email'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsResetEmailSent(false);
                          setSuccess('');
                        }}
                        className="flex-1 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-gold-500/40 text-white/80 hover:text-white font-mono text-[11px] uppercase tracking-wider rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <span>Change Email</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsResetEmailSent(false);
                        setSuccess('');
                        setError('');
                        handleSwitchMode('login');
                      }}
                      className="w-full py-2 bg-transparent hover:bg-white/[0.03] text-white/40 hover:text-white font-mono text-[10px] uppercase tracking-wider rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>Return to Sign In</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Main Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Full Name (Sign Up only) */}
                  {mode === 'signup' && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-white/60 block">
                        Full Legal Name <span className="text-gold-500">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="e.g. Lord Basheer"
                          required
                          className="w-full bg-[#0E0E0E] border border-white/10 rounded py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/80 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {/* Recovery Security Code (Reset Confirm only) */}
                  {mode === 'resetConfirm' && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-white/60 block">
                        Recovery Security Code <span className="text-gold-500">*</span>
                      </label>
                      <div className="relative">
                        <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                          type="text"
                          name="recoveryCode"
                          value={recoveryCode}
                          onChange={(e) => {
                            let val = e.target.value.trim();
                            if (val.includes('oobCode=')) {
                              const match = val.match(/[?&]oobCode=([^&#]+)/);
                              if (match && match[1]) val = decodeURIComponent(match[1]);
                            }
                            setRecoveryCode(val);
                          }}
                          placeholder="Paste code or recovery link from email"
                          required
                          className="w-full bg-[#0E0E0E] border border-white/10 rounded py-2.5 pl-10 pr-4 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/80 transition-colors"
                        />
                      </div>
                      <p className="text-[10px] text-white/40 font-mono mt-1">
                        Check your Spam/Junk or inbox. You can paste the recovery code or the complete link here.
                      </p>
                    </div>
                  )}

                  {/* Email Address */}
                  {mode !== 'resetConfirm' && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-white/60 block">
                        Email Address <span className="text-gold-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="client@deuz.atelier"
                          required
                          autoComplete="email"
                          className="w-full bg-[#0E0E0E] border border-white/10 rounded py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/80 transition-colors"
                        />
                      </div>
                      {formData.email.trim().length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono">
                          {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()) ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 size={11} /> Email verified
                            </span>
                          ) : (
                            <span className="text-amber-400/80 flex items-center gap-1">
                              Checking format: name@domain.com
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mobile / Phone (Sign Up only) */}
                  {mode === 'signup' && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-white/60 block">
                        Direct Telephone <span className="text-white/30 text-[9px]">(Optional for Courier SMS)</span>
                      </label>
                      <div className="relative">
                        <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleChange}
                          placeholder="+91 98765 43210"
                          className="w-full bg-[#0E0E0E] border border-white/10 rounded py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/80 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {/* Password Field (Login, Sign Up & Reset Confirm) */}
                  {mode !== 'forgot' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-mono tracking-widest text-white/60 block">
                          {mode === 'resetConfirm' ? 'New Password' : 'Password'} <span className="text-gold-500">*</span>
                        </label>
                        {mode === 'login' && (
                          <button
                            type="button"
                            onClick={() => handleSwitchMode('forgot')}
                            className="text-[10px] font-mono text-gold-400/80 hover:text-gold-300 transition-colors cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder={mode === 'signup' || mode === 'resetConfirm' ? "Minimum 6 characters" : "••••••••"}
                          required
                          autoComplete={mode === 'signup' || mode === 'resetConfirm' ? "new-password" : "current-password"}
                          className="w-full bg-[#0E0E0E] border border-white/10 rounded py-2.5 pl-10 pr-10 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/80 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors cursor-pointer"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {(mode === 'signup' || mode === 'resetConfirm') && formData.password.length > 0 && (
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono">
                          <span className={`flex items-center gap-1 ${formData.password.length >= 6 ? 'text-emerald-400' : 'text-amber-400/80'}`}>
                            {formData.password.length >= 6 ? <CheckCircle2 size={11} /> : <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                            {formData.password.length >= 6 ? 'Password length verified (6+ chars)' : `${6 - formData.password.length} more characters needed`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Confirm Password (Sign Up & Reset Confirm) */}
                  {(mode === 'signup' || mode === 'resetConfirm') && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-white/60 block">
                        Confirm {mode === 'resetConfirm' ? 'New ' : ''}Password <span className="text-gold-500">*</span>
                      </label>
                      <div className="relative">
                        <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Re-enter password"
                          required
                          autoComplete="new-password"
                          className="w-full bg-[#0E0E0E] border border-white/10 rounded py-2.5 pl-10 pr-10 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/80 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors cursor-pointer"
                          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                          {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {formData.confirmPassword.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono">
                          {formData.password === formData.confirmPassword ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 size={11} /> Passwords match
                            </span>
                          ) : (
                            <span className="text-red-400 flex items-center gap-1">
                              Passwords do not match
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-gradient-to-r from-gold-500 via-gold-400 to-amber-400 text-black hover:from-gold-400 hover:to-amber-300 transition-all duration-300 font-mono text-xs uppercase tracking-[0.2em] font-bold rounded flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_25px_rgba(212,175,55,0.3)]"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Authenticating & Synchronizing...
                      </span>
                    ) : (
                      <>
                        <span>
                          {mode === 'login' && 'Authorize & Sign In'}
                          {mode === 'signup' && 'Establish Dossier (Initiative)'}
                          {mode === 'forgot' && 'Transmit Recovery Link'}
                          {mode === 'resetConfirm' && 'Update & Confirm Password'}
                        </span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Third-Party Divider & Google Sign-In */}
              {mode !== 'forgot' && mode !== 'resetConfirm' && (
                <div className="mt-5 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-center mb-4">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/30 px-2 bg-[#070707]">
                      Or authenticate with
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-gold-500/40 rounded transition-all flex items-center justify-center gap-2.5 text-xs text-white/80 hover:text-white font-mono uppercase tracking-wider cursor-pointer disabled:opacity-50 group"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google Secure Access</span>
                  </button>
                </div>
              )}

              {/* Bottom Alternative Link */}
              <div className="mt-5 text-center">
                {mode === 'login' && (
                  <p className="text-[11px] text-white/40">
                    Don't have a registered dossier?{' '}
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('signup')}
                      className="text-gold-400 hover:text-white transition-colors underline cursor-pointer ml-1 font-mono"
                    >
                      Establish New Dossier
                    </button>
                  </p>
                )}

                {mode === 'signup' && (
                  <p className="text-[11px] text-white/40">
                    Already registered with Deuz & Co?{' '}
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('login')}
                      className="text-gold-400 hover:text-white transition-colors underline cursor-pointer ml-1 font-mono"
                    >
                      Sign In to Dossier
                    </button>
                  </p>
                )}

                {mode === 'forgot' && (
                  <div className="space-y-1.5 text-center">
                    <p className="text-[11px] text-white/50">
                      Already have a recovery security code?{' '}
                      <button
                        type="button"
                        onClick={() => handleSwitchMode('resetConfirm')}
                        className="text-gold-400 hover:text-gold-300 transition-colors underline cursor-pointer ml-1 font-mono font-medium"
                      >
                        Enter Code Directly
                      </button>
                    </p>
                    <p className="text-[11px] text-white/50">
                      New user without an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          handleSwitchMode('signup');
                          setIsUnregisteredUser(false);
                        }}
                        className="text-gold-400 hover:text-gold-300 transition-colors underline cursor-pointer ml-1 font-mono font-medium"
                      >
                        Register First
                      </button>
                    </p>
                    <p className="text-[11px] text-white/40">
                      Remembered your password?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          handleSwitchMode('login');
                          setIsUnregisteredUser(false);
                        }}
                        className="text-white/70 hover:text-white transition-colors underline cursor-pointer ml-1 font-mono"
                      >
                        Return to Sign In
                      </button>
                    </p>
                  </div>
                )}

                {mode === 'resetConfirm' && (
                  <div className="space-y-1.5 text-center">
                    <p className="text-[11px] text-white/50">
                      Need a new recovery link?{' '}
                      <button
                        type="button"
                        onClick={() => handleSwitchMode('forgot')}
                        className="text-gold-400 hover:text-gold-300 transition-colors underline cursor-pointer ml-1 font-mono font-medium"
                      >
                        Request Recovery Email
                      </button>
                    </p>
                    <p className="text-[11px] text-white/40">
                      Remembered your credentials?{' '}
                      <button
                        type="button"
                        onClick={() => handleSwitchMode('login')}
                        className="text-white/70 hover:text-white transition-colors underline cursor-pointer ml-1 font-mono"
                      >
                        Return to Sign In
                      </button>
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
