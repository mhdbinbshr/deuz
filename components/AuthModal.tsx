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
  RotateCw,
  UserPlus,
  UserX,
  ExternalLink,
  MapPin
} from 'lucide-react';
import { db } from '../utils/db';
import { storage } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import { LoginAtmosphere3D } from './LoginAtmosphere3D';

const AuthModal: React.FC = () => {
  const { 
    user,
    isAuthModalOpen, 
    closeAuthModal, 
    login, 
    signup, 
    loginWithGoogle, 
    forgotPassword,
    verifyResetCode,
    confirmPasswordReset,
    authModalMode,
    authModalCode,
    authBannerNotice,
    clearAuthBannerNotice
  } = useAuth();
  const formScrollRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'resetConfirm'>('login');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [verifiedResetEmail, setVerifiedResetEmail] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  
  const [formData, setFormData] = useState(() => {
    const draft = storage.getRegistrationDraft();
    return {
      fullName: draft?.fullName || '',
      email: draft?.email || '',
      password: '',
      confirmPassword: '',
      mobile: draft?.mobile || '',
      address: draft?.address || '',
      city: draft?.city || '',
      pincode: draft?.pincode || '',
      termsAccepted: draft?.termsAccepted ?? true
    };
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
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'registered' | 'unregistered'>('idle');
  const [isGoogleAccountSelected, setIsGoogleAccountSelected] = useState(false);

  // If an authenticated Google user has an incomplete profile (e.g. after page refresh), prefill their Google details
  useEffect(() => {
    if (isAuthModalOpen && user && user.authProvider === 'google' && user.profileCompleted === false) {
      const draft = storage.getRegistrationDraft();
      setIsGoogleAccountSelected(true);
      setMode('signup');
      setFormData(prev => ({
        ...prev,
        fullName: draft?.fullName || user.fullName || user.displayName || prev.fullName,
        email: user.email || prev.email,
        mobile: draft?.mobile || user.mobile || prev.mobile,
        address: draft?.address || (user.address as any)?.addressLine1 || user.address?.address || prev.address,
        city: draft?.city || user.address?.city || prev.city,
        pincode: draft?.pincode || (user.address as any)?.postalCode || user.address?.pincode || prev.pincode,
        termsAccepted: draft?.termsAccepted ?? true
      }));
    }
  }, [isAuthModalOpen, user]);

  // Persist non-sensitive registration draft so refreshing the page does not lose entered data
  useEffect(() => {
    if (mode === 'signup') {
      storage.setRegistrationDraft({
        fullName: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
        address: formData.address,
        city: formData.city,
        pincode: formData.pincode,
        termsAccepted: formData.termsAccepted
      });
    }
  }, [
    mode,
    formData.fullName,
    formData.email,
    formData.mobile,
    formData.address,
    formData.city,
    formData.pincode,
    formData.termsAccepted
  ]);

  // Cooldown timer for resending password reset email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Validate password reset action code whenever mode is resetConfirm and recoveryCode is provided
  useEffect(() => {
    if (!isAuthModalOpen || mode !== 'resetConfirm') return;
    let cleanCode = recoveryCode.trim();
    if (cleanCode.includes('oobCode=')) {
      const match = cleanCode.match(/[?&]oobCode=([^&#]+)/);
      if (match && match[1]) cleanCode = decodeURIComponent(match[1]);
    }
    if (!cleanCode || cleanCode.length < 12) {
      setVerifiedResetEmail('');
      return;
    }

    let active = true;
    setVerifyingCode(true);
    const timer = setTimeout(async () => {
      const res = await verifyResetCode(cleanCode);
      if (!active) return;
      setVerifyingCode(false);
      if (res.success && res.email) {
        setVerifiedResetEmail(res.email);
        setFormData(prev => ({ ...prev, email: res.email || prev.email }));
        setError('');
      } else if (!res.success && res.message) {
        setVerifiedResetEmail('');
        setError(res.message);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isAuthModalOpen, mode, recoveryCode]);

  // Live debounced Cloud Registry email check
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const trimmed = formData.email.toLowerCase().trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!isValidEmail) {
      setEmailCheckStatus('idle');
      return;
    }

    setEmailCheckStatus('checking');
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const exists = await db.checkUserExists(trimmed);
        if (active) {
          setEmailCheckStatus(exists ? 'registered' : 'unregistered');
        }
      } catch {
        if (active) setEmailCheckStatus('idle');
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [formData.email, isAuthModalOpen]);

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
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
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
    if (authBannerNotice) clearAuthBannerNotice();
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
        setSuccess(`New password reset link dispatched to ${normalizedEmail}. Please check your Inbox and Spam/Junk folder.`);
      } else {
        setError(res.message || 'Unable to re-transmit recovery email.');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to resend recovery email.');
    } finally {
      setLoading(false);
    }
  };

  // Compute password strength for signup and resetConfirm
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-white/10' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;
    if (pwd.length < 6) return { score: 1, label: 'Too Short (Min 6 chars)', color: 'bg-red-500' };
    if (score <= 1) return { score: 2, label: 'Standard Clearance', color: 'bg-amber-400' };
    if (score === 2 || score === 3) return { score: 3, label: 'Strong Encryption', color: 'bg-emerald-400' };
    return { score: 4, label: 'Sovereign 256-Bit Grade', color: 'bg-gold-400' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
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
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          setError('Please enter a valid email address.');
          setLoading(false);
          return;
        }
        if (!formData.password) {
          setError('Please enter your password.');
          setLoading(false);
          return;
        }

        const res = await login(normalizedEmail, formData.password);
        if (res.success) {
          setSuccess('Identity verified & synchronized. Accessing atelier dossier...');
          setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
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
        if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          setError('Please provide a valid email address.');
          setLoading(false);
          return;
        }
        // Validate phone number if provided or when completing Google dossier registration
        const cleanPhone = formData.mobile.trim();
        if (isGoogleAccountSelected && !cleanPhone) {
          setError('Please provide your Direct Telephone number to complete your Client Dossier.');
          setLoading(false);
          return;
        }
        if (cleanPhone && !/^[+\d][\d\s\-()]{6,19}$/.test(cleanPhone)) {
          setError('Please enter a valid telephone number (minimum 7 digits).');
          setLoading(false);
          return;
        }

        // Password is required for email/password registration, and optional for Google users
        const isPasswordRequired = !isGoogleAccountSelected;
        if (isPasswordRequired && (!formData.password || formData.password.length < 6)) {
          setError('Password must contain at least 6 characters.');
          setLoading(false);
          return;
        }
        if (!isPasswordRequired && formData.password && formData.password.length < 6) {
          setError('Optional password must contain at least 6 characters if provided.');
          setLoading(false);
          return;
        }
        if (formData.password && formData.password !== formData.confirmPassword) {
          setError('Passwords do not match. Please re-enter.');
          setLoading(false);
          return;
        }
        if (!formData.termsAccepted) {
          setError('Please accept the Atelier Patron Covenant & Privacy Terms to establish your dossier.');
          setLoading(false);
          return;
        }

        const res = await signup({
          fullName: formData.fullName.trim(),
          email: normalizedEmail,
          password: formData.password || undefined,
          mobile: cleanPhone,
          address: formData.address.trim(),
          city: formData.city.trim(),
          pincode: formData.pincode.trim(),
          termsAccepted: formData.termsAccepted
        });

        if (res.success) {
          setIsExistingUserOnSignup(false);
          setIsGoogleAccountSelected(false);
          storage.clearRegistrationDraft();
          setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
          setSuccess('Dossier established & synchronized. Welcome to Deuz & Co.');
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
        if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          setError('Please provide a valid registered email address.');
          setLoading(false);
          return;
        }

        const res = await forgotPassword(normalizedEmail);
        if (res.success) {
          setIsUnregisteredUser(false);
          setIsResetEmailSent(true);
          setResendCooldown(60);
          setSuccess(res.message || `Password recovery link dispatched to ${normalizedEmail}.`);
        } else {
          setError(res.message || 'Unable to transmit password reset email.');
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
          setError('Please paste the password reset link or code from your email.');
          setLoading(false);
          return;
        }
        if (!formData.password || formData.password.length < 6) {
          setError('New password must contain at least 6 characters.');
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match. Please re-enter.');
          setLoading(false);
          return;
        }

        const res = await confirmPasswordReset(cleanCode, formData.password, verifiedResetEmail || normalizedEmail);
        if (res.success) {
          setSuccess('Your password has been updated and synchronized. Redirecting to Sign In...');
          setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
          setRecoveryCode('');
          setVerifiedResetEmail('');
          setTimeout(() => {
            handleSwitchMode('login');
          }, 1400);
        } else {
          setError(res.message || 'Unable to update password. The reset link may be invalid or expired.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Security network communication fault.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        const googleEmail = (res.user?.email || '').toLowerCase().trim();
        const googleName = res.user?.fullName || res.user?.displayName || '';
        const googleMobile = res.user?.mobile || '';
        const googleAddress: any = res.user?.address || {};

        // Redirect user to Register Dossier with Google profile prefilled
        setFormData(prev => ({
          ...prev,
          fullName: googleName || prev.fullName,
          email: googleEmail || prev.email,
          mobile: googleMobile || prev.mobile,
          address: googleAddress.addressLine1 || googleAddress.address || prev.address,
          city: googleAddress.city || prev.city,
          pincode: googleAddress.postalCode || googleAddress.pincode || prev.pincode,
          password: '',
          confirmPassword: '',
          termsAccepted: true
        }));
        setIsGoogleAccountSelected(true);
        setIsExistingUserOnSignup(false);
        setIsUnregisteredUser(false);

        // If returning Google user already has a completed profile and signed in from Login tab, allow immediate entry or dossier review
        if (!res.isNewUser && res.user?.profileCompleted && mode === 'login') {
          setMode('signup');
          setSuccess(
            `Welcome back, ${googleName || googleEmail}. Your Google account is verified — confirm your Client Dossier details below or close to continue directly.`
          );
        } else {
          setMode('signup');
          setSuccess(
            `Google account (${googleEmail || 'Verified'}) selected. Please complete the registration fields below to establish your Client Dossier.`
          );
        }
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
          className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-black/90 backdrop-blur-2xl gold-scrollbar touch-pan-y"
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
            className="min-h-full w-full flex items-center justify-center p-2.5 xs:p-3 sm:p-5 md:p-6 lg:p-8 py-5 sm:py-8"
          >
            <div 
              className="relative w-full max-w-lg md:max-w-4xl bg-[#070707] border border-white/15 rounded-xl sm:rounded-lg overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.95)] flex flex-col md:flex-row md:max-h-[90dvh] z-10 my-auto shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* User Not Found Pop-up Dialog */}
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
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent animate-pulse" />

                      <button
                        type="button"
                        onClick={() => setShowUserNotFoundPopup(false)}
                        className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                        aria-label="Dismiss pop-up"
                      >
                        <X size={16} />
                      </button>

                      <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)] relative">
                        <UserX size={26} className="text-amber-400" />
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-400/90 font-bold block">
                          IDENTITY CHECK // UNREGISTERED
                        </span>
                        <h3 className="text-lg sm:text-xl font-serif text-white font-bold tracking-wide">
                          User Not Found
                        </h3>
                        <p className="text-xs text-white/70 leading-relaxed pt-1">
                          No registered client profile or atelier dossier matches <span className="text-gold-400 font-mono font-medium underline break-all">{notFoundEmail}</span>.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-left text-[11px] text-white/75 font-sans space-y-1.5 leading-relaxed">
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            Access to Deuz &amp; Co. private salon archives, bespoke vault acquisitions, and supersonic tracking requires an established account. Please register first.
                          </span>
                        </div>
                      </div>

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

              {/* Atmosphere Chamber */}
              <div 
                onWheel={(e) => {
                  if (formScrollRef.current) {
                    formScrollRef.current.scrollTop += e.deltaY;
                  }
                }}
                className="w-full md:w-5/12 h-36 sm:h-44 md:h-auto relative overflow-hidden bg-black select-none border-b md:border-b-0 md:border-r border-white/10 shrink-0"
              >
                <LoginAtmosphere3D intensity={1.3} />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#070707] pointer-events-none hidden md:block" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#070707] pointer-events-none md:hidden" />

                <div className="absolute top-3.5 left-4 sm:left-5 z-20 pointer-events-none flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-gold-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-ping" />
                  <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.25em] text-gold-400 font-bold">
                    ATELIER CHAMBER
                  </span>
                </div>

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
                    <span>CLOUD SYNC</span>
                  </div>
                </div>

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

                  <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3.5 backdrop-blur-md">
                    <div className="flex items-center justify-between text-[9px] font-mono text-gold-400 uppercase tracking-wider font-bold mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-gold-400" /> Cryptographic Integrity
                      </span>
                      <span className="text-emerald-400">256-BIT LIVE</span>
                    </div>
                    <p className="text-[10px] text-white/50 leading-relaxed font-light">
                      Protected under real-time cryptographic authentication &amp; Atelier Cloud verification. Dossier privileges synchronize upon verified authentication.
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
                      CLOUD SYNC
                    </span>
                  </div>
                </div>

                {/* Header Title */}
                <div className="mb-5">
                  <h2 className="text-xl sm:text-2xl font-serif text-white tracking-wide">
                    {mode === 'login' && 'Atelier Client Sign In'}
                    {mode === 'signup' && (isGoogleAccountSelected ? 'Complete Google Client Dossier' : 'Establish Client Dossier')}
                    {mode === 'forgot' && 'Password Recovery Protocol'}
                    {mode === 'resetConfirm' && 'Configure New Dossier Password'}
                  </h2>
                  <p className="text-xs text-white/50 mt-1">
                    {mode === 'login' && 'Authenticate credentials to inspect acquisitions, orders, and tier privileges.'}
                    {mode === 'signup' && (isGoogleAccountSelected
                      ? 'Your Google account is connected. Confirm your patron details below to finalize your Client Dossier.'
                      : 'Establish your confidential account to unlock private capsule drops.')}
                    {mode === 'forgot' && 'Dispatch an official password recovery link to your registered email inbox.'}
                    {mode === 'resetConfirm' && 'Validate your recovery link and configure your new password.'}
                  </p>
                </div>

                {/* Global Auth Banner Notice (e.g. Email Verification Link result) */}
                {authBannerNotice && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-4 p-3.5 rounded text-xs flex items-center justify-between gap-2.5 border ${
                      authBannerNotice.type === 'success'
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-red-950/40 border-red-500/40 text-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {authBannerNotice.type === 'success' ? (
                        <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                      ) : (
                        <AlertTriangle size={15} className="shrink-0 text-red-400" />
                      )}
                      <span>{authBannerNotice.message}</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearAuthBannerNotice}
                      className="text-white/50 hover:text-white p-1 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </motion.div>
                )}

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
                    <div className="p-4 bg-gold-500/10 border border-gold-500/40 rounded-lg text-center space-y-2.5">
                      <div className="w-10 h-10 rounded-full bg-gold-500/20 border border-gold-400/40 flex items-center justify-center mx-auto text-gold-400">
                        <Mail size={20} />
                      </div>
                      <h4 className="text-white font-mono text-sm uppercase tracking-wider font-bold">
                        Password Reset Email Dispatched
                      </h4>
                      <p className="text-white/70 text-xs leading-relaxed">
                        An official password reset link has been transmitted to <span className="text-gold-400 font-mono font-medium">{formData.email}</span>.
                      </p>
                    </div>

                    {/* Inbox & Spam Folder Instructions */}
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded text-xs space-y-2">
                      <div className="flex items-center gap-2 text-amber-300 font-mono uppercase tracking-wider font-semibold text-[11px]">
                        <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                        <span>Important Delivery Instructions</span>
                      </div>
                      <p className="text-white/70 text-[11px] leading-relaxed">
                        1. Check your email inbox and <span className="text-white font-semibold">Spam / Junk folder</span> for an automated security recovery email addressed to <span className="text-gold-400 font-mono">{formData.email}</span>.
                      </p>
                      <p className="text-white/70 text-[11px] leading-relaxed">
                        2. Click the link in that email to set your new password, then return here to Sign In — or copy the link from the email and paste it below.
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsResetEmailSent(false);
                          setSuccess('');
                          setError('');
                          handleSwitchMode('login');
                        }}
                        className="w-full py-3 bg-gradient-to-r from-gold-500 via-gold-400 to-amber-400 text-black hover:from-gold-400 hover:to-amber-300 font-mono text-xs uppercase tracking-[0.2em] font-bold rounded flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.25)] transition-all"
                      >
                        <ArrowRight size={14} />
                        <span>Return to Sign In</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <a
                          href="https://mail.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-gold-500/40 text-gold-300 hover:text-white font-mono text-[11px] uppercase tracking-wider rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <ExternalLink size={12} />
                          <span>Open Gmail Inbox</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleSwitchMode('resetConfirm')}
                          className="flex-1 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-gold-500/40 text-white/80 hover:text-white font-mono text-[11px] uppercase tracking-wider rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <KeyRound size={12} />
                          <span>Paste Link / Code</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={resendCooldown > 0 || loading}
                          onClick={handleResendResetEmail}
                          className="flex-1 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-gold-500/40 text-white/70 hover:text-white font-mono text-[10px] uppercase tracking-wider rounded flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          <RotateCw size={11} className={loading ? "animate-spin" : ""} />
                          <span>{resendCooldown > 0 ? `Resend In ${resendCooldown}s` : 'Resend Reset Email'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsResetEmailSent(false);
                            setSuccess('');
                          }}
                          className="flex-1 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-gold-500/40 text-white/70 hover:text-white font-mono text-[10px] uppercase tracking-wider rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <span>Change Email</span>
                        </button>
                      </div>
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

                    {/* Email Address */}
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
                          required={mode !== 'resetConfirm'}
                          readOnly={mode === 'signup' && isGoogleAccountSelected && Boolean(formData.email)}
                          autoComplete="email"
                          className={`w-full bg-[#0E0E0E] border border-white/10 rounded py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/80 transition-colors ${
                            mode === 'signup' && isGoogleAccountSelected && formData.email ? 'opacity-80 cursor-not-allowed border-emerald-500/30' : ''
                          }`}
                        />
                      </div>
                      {formData.email.trim().length > 0 && (
                        <div className="flex items-center justify-between gap-2 mt-1 text-[10px] font-mono">
                          {!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()) ? (
                            <span className="text-amber-400/80 flex items-center gap-1">
                              Format: name@domain.com
                            </span>
                          ) : emailCheckStatus === 'checking' ? (
                            <span className="text-white/50 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full border border-gold-400 border-t-transparent animate-spin" />
                              Checking Atelier registry...
                            </span>
                          ) : mode === 'signup' ? (
                            isGoogleAccountSelected ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 size={11} /> Google account verified — complete dossier details below
                              </span>
                            ) : emailCheckStatus === 'registered' ? (
                              <span className="text-amber-400 flex items-center gap-1.5">
                                <AlertTriangle size={11} /> Dossier already registered —{' '}
                                <button
                                  type="button"
                                  onClick={() => handleSwitchMode('login')}
                                  className="text-gold-400 underline hover:text-white cursor-pointer"
                                >
                                  Sign In instead
                                </button>
                              </span>
                            ) : (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 size={11} /> Email available for registration
                              </span>
                            )
                          ) : (
                            emailCheckStatus === 'registered' ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 size={11} /> Registered Dossier verified in Atelier Cloud
                              </span>
                            ) : (
                              <span className="text-emerald-400/80 flex items-center gap-1">
                                <CheckCircle2 size={11} /> Valid email format
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    {/* Recovery Link / Code (Reset Confirm only) */}
                    {mode === 'resetConfirm' && (
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono tracking-widest text-white/60 block">
                          Email Recovery Link or Code <span className="text-gold-500">*</span>
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
                            placeholder="Paste the password reset link or code from your email"
                            required
                            className="w-full bg-[#0E0E0E] border border-white/10 rounded py-2.5 pl-10 pr-4 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/80 transition-colors"
                          />
                        </div>
                        {verifyingCode ? (
                          <p className="text-[10px] text-gold-400 font-mono mt-1 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full border border-gold-400 border-t-transparent animate-spin" />
                            Validating recovery action code...
                          </p>
                        ) : verifiedResetEmail ? (
                          <p className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                            <CheckCircle2 size={11} /> Recovery code verified for {verifiedResetEmail}
                          </p>
                        ) : (
                          <p className="text-[10px] text-white/40 font-mono mt-1">
                            Paste the full reset link from the recovery email sent to your inbox.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Mobile / Phone (Sign Up only) */}
                    {mode === 'signup' && (
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono tracking-widest text-white/60 block">
                          Direct Telephone {isGoogleAccountSelected ? <span className="text-gold-500">*</span> : <span className="text-white/30 text-[9px]">(Optional for Courier SMS)</span>}
                        </label>
                        <div className="relative">
                          <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                          <input
                            type="tel"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleChange}
                            required={isGoogleAccountSelected}
                            placeholder="+91 98765 43210"
                            className="w-full bg-[#0E0E0E] border border-white/10 rounded py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/80 transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {/* Optional Salon Delivery Coordinates (Sign Up only) */}
                    {mode === 'signup' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-white/60 block">
                            Primary Residence / Salon Address <span className="text-white/30 text-[9px]">(Optional)</span>
                          </label>
                          <div className="relative">
                            <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                            <input
                              type="text"
                              name="address"
                              value={formData.address}
                              onChange={handleChange}
                              placeholder="Street, Suite or Residence"
                              className="w-full bg-[#0E0E0E] border border-white/10 rounded py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/80 transition-colors"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-white/60 block">
                            City <span className="text-white/30 text-[9px]">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="City"
                            className="w-full bg-[#0E0E0E] border border-white/10 rounded py-2 px-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/80 transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {/* Password Field (Login, Sign Up & Reset Confirm) */}
                    {mode !== 'forgot' && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-white/60 block">
                            {mode === 'resetConfirm' ? 'New Password' : 'Password'}{' '}
                            {mode === 'signup' && isGoogleAccountSelected ? (
                              <span className="text-white/35 text-[9px]">(Optional — Set to enable password login)</span>
                            ) : (
                              <span className="text-gold-500">*</span>
                            )}
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
                            placeholder={
                              mode === 'signup' && isGoogleAccountSelected
                                ? "Leave blank to use Google-only, or enter 6+ chars"
                                : mode === 'signup' || mode === 'resetConfirm'
                                ? "Minimum 6 characters"
                                : "••••••••"
                            }
                            required={!(mode === 'signup' && isGoogleAccountSelected)}
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
                          <div className="space-y-1.5 pt-1">
                            <div className="flex gap-1 h-1 w-full">
                              {[1, 2, 3, 4].map((lvl) => (
                                <div
                                  key={lvl}
                                  className={`h-full flex-1 rounded-full transition-all ${
                                    passwordStrength.score >= lvl ? passwordStrength.color : 'bg-white/10'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className={`flex items-center gap-1 ${formData.password.length >= 6 ? 'text-emerald-400' : 'text-amber-400/80'}`}>
                                {formData.password.length >= 6 ? <CheckCircle2 size={11} /> : <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                                {formData.password.length >= 6 ? 'Length verified (6+ chars)' : `${6 - formData.password.length} more characters needed`}
                              </span>
                              <span className="text-white/50">{passwordStrength.label}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Confirm Password (Sign Up & Reset Confirm) */}
                    {(mode === 'resetConfirm' || (mode === 'signup' && (!isGoogleAccountSelected || formData.password.length > 0))) && (
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
                            required={mode === 'resetConfirm' || !isGoogleAccountSelected || formData.password.length > 0}
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

                    {/* Terms & Covenant Acceptance (Sign Up only) */}
                    {mode === 'signup' && (
                      <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          name="termsAccepted"
                          checked={formData.termsAccepted}
                          onChange={handleChange}
                          className="mt-0.5 accent-gold-500 rounded cursor-pointer"
                        />
                        <span className="text-[11px] text-white/60 leading-relaxed">
                          I accept the <span className="text-gold-400 font-medium">Deuz &amp; Co. Patron Covenant</span>, privacy terms, and encrypted dossier synchronization policy. <span className="text-gold-500">*</span>
                        </span>
                      </label>
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
                          Authenticating &amp; Synchronizing...
                        </span>
                      ) : (
                        <>
                          <span>
                            {mode === 'login' && 'Authorize & Sign In'}
                            {mode === 'signup' && (isGoogleAccountSelected ? 'Complete & Save Dossier' : 'Establish Dossier')}
                            {mode === 'forgot' && 'Send Password Reset Email'}
                            {mode === 'resetConfirm' && 'Update & Synchronize Password'}
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
                      <span>Continue with Google</span>
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
                      Already registered with Deuz &amp; Co?{' '}
                      <button
                        type="button"
                        onClick={() => handleSwitchMode('login')}
                        className="text-gold-400 hover:text-white transition-colors underline cursor-pointer ml-1 font-mono"
                      >
                        Sign In to Dossier
                      </button>
                    </p>
                  )}

                  {mode === 'forgot' && !isResetEmailSent && (
                    <div className="space-y-1.5 text-center">
                      <p className="text-[11px] text-white/50">
                        Already received a recovery link in your email?{' '}
                        <button
                          type="button"
                          onClick={() => handleSwitchMode('resetConfirm')}
                          className="text-gold-400 hover:text-gold-300 transition-colors underline cursor-pointer ml-1 font-mono font-medium"
                        >
                          Paste Link / Code
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
                        Need a new password reset email?{' '}
                        <button
                          type="button"
                          onClick={() => handleSwitchMode('forgot')}
                          className="text-gold-400 hover:text-gold-300 transition-colors underline cursor-pointer ml-1 font-mono font-medium"
                        >
                          Send Reset Email
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

