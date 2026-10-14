import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Edit3, 
  Save, 
  Crown,
  Plane,
  Copy,
  Lock,
  KeyRound,
  AlertTriangle,
  Radio,
  Compass,
  ArrowUpRight,
  Shield,
  Activity,
  Zap,
  Download,
  Gauge
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { CustomerStageTracker } from './CustomerStageTracker';
import { db } from '../utils/db';
import { CUSTOMER_STAGES } from '../types';

interface CustomerProfileChamberProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConcierge?: () => void;
}

export const CustomerProfileChamber: React.FC<CustomerProfileChamberProps> = ({
  isOpen,
  onClose,
  onOpenConcierge
}) => {
  const { user, updatePassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [mobileInput, setMobileInput] = useState(user?.mobile || '');
  const [fullNameInput, setFullNameInput] = useState(user?.fullName || '');
  const [addressInput, setAddressInput] = useState(user?.address?.address || '');
  const [cityInput, setCityInput] = useState(user?.address?.city || '');
  const [postalInput, setPostalInput] = useState(user?.address?.pincode || '');
  const [countryInput, setCountryInput] = useState(user?.address?.country || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [upgradeRequested, setUpgradeRequested] = useState(false);
  const [copiedHouseCode, setCopiedHouseCode] = useState(false);
  const [copiedDossierId, setCopiedDossierId] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!isOpen || !user) return null;

  const currentStage = user.stage || 'initiative';
  const stageMeta = CUSTOMER_STAGES.find(s => s.id === currentStage) || CUSTOMER_STAGES[0];
  const dossierId = `DEUZ-ARCHIVE-0${stageMeta.level}-${(user.id || '777').slice(0, 6).toUpperCase()}`;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await db.updateUserProfile(user.id, {
        fullName: fullNameInput.trim(),
        mobile: mobileInput.trim(),
        address: {
          addressLine1: addressInput.trim(),
          city: cityInput.trim(),
          postalCode: postalInput.trim(),
          country: countryInput.trim()
        }
      });
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update dossier:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestUpgrade = () => {
    setUpgradeRequested(true);
    if (onOpenConcierge) {
      setTimeout(() => {
        onClose();
        onOpenConcierge();
      }, 1200);
    }
  };

  const handleDownloadDossierPDF = () => {
    setDownloadingPdf(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      // Black background
      doc.setFillColor(8, 8, 8);
      doc.rect(0, 0, 210, 297, 'F');

      // Double Gold border
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.8);
      doc.rect(10, 10, 190, 277);
      doc.setLineWidth(0.2);
      doc.rect(12, 12, 186, 273);

      // Header
      doc.setTextColor(212, 175, 55);
      doc.setFont('times', 'bold');
      doc.setFontSize(22);
      doc.text('DEUZ & CO. HAUTE ARCHIVE', 105, 26, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setFont('courier', 'normal');
      doc.setTextColor(180, 180, 180);
      doc.text('CLASSIFIED PATRON DOSSIER // SOVEREIGN SECURITY PROTOCOL', 105, 33, { align: 'center' });

      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.4);
      doc.line(20, 38, 190, 38);

      // Dossier Identifier
      doc.setFontSize(9.5);
      doc.setTextColor(212, 175, 55);
      doc.text(`DOSSIER ID: ${dossierId}`, 22, 46);
      doc.setTextColor(160, 160, 160);
      doc.text(`ISSUED: ${new Date().toLocaleDateString('en-GB')} • 256-BIT ENCRYPTED`, 188, 46, { align: 'right' });

      // Patron Profile Box
      doc.setFillColor(15, 15, 15);
      doc.rect(20, 52, 170, 52, 'F');
      doc.setDrawColor(60, 50, 25);
      doc.rect(20, 52, 170, 52);

      doc.setFont('times', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text(user.fullName || 'AUTHENTICATED PATRON', 26, 63);

      doc.setFont('courier', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(212, 175, 55);
      doc.text(`ROLE: ${(user.role === 'admin' ? 'ROOT EXECUTIVE ADMINISTRATOR' : 'AUTHENTICATED PATRON').toUpperCase()}`, 26, 71);
      if (user.houseCode || user.houseId) {
        doc.text(`HOUSE AFFILIATION: ${(user.houseCode || user.houseId).toUpperCase()}`, 26, 78);
      }
      doc.setTextColor(180, 180, 180);
      doc.text(`EMAIL: ${user.email}`, 26, 85);
      doc.text(`COMMUNICATION: ${user.mobile || 'SECURE PRIVATE COMM DIRECT LINE'}`, 26, 92);
      doc.text(`MEMBER SINCE: ${user.joinedDate ? new Date(user.joinedDate).toLocaleDateString('en-GB') : '2024'}`, 26, 99);

      // Aeronautical Flight Status HUD Box
      doc.setFillColor(15, 15, 15);
      doc.rect(20, 110, 170, 68, 'F');
      doc.setDrawColor(212, 175, 55);
      doc.rect(20, 110, 170, 68);

      doc.setFont('courier', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(212, 175, 55);
      doc.text('AERONAUTICAL FLIGHT STATUS TELEMETRY', 26, 120);
      doc.setFont('courier', 'normal');
      doc.setTextColor(46, 204, 113);
      doc.text('AIRBORNE // ACTIVE CORRIDOR', 184, 120, { align: 'right' });

      doc.setDrawColor(60, 50, 25);
      doc.line(26, 124, 184, 124);

      doc.setFontSize(9);
      doc.setTextColor(180, 180, 180);
      doc.text(`TIER LEVEL: STAGE 0${stageMeta.level} — ${stageMeta.name.toUpperCase()} (${stageMeta.code})`, 26, 132);
      doc.text(`CALLSIGN: ${stageMeta.callsign}`, 26, 140);
      doc.text(`CRUISE AIRSPEED: ${stageMeta.machSpeed}`, 26, 148);
      doc.text(`OPERATIONAL ALTITUDE: ${stageMeta.altitude}`, 26, 156);
      doc.text(`AERONAUTICAL VECTOR: ${stageMeta.coordinates}`, 26, 164);
      doc.setTextColor(212, 175, 55);
      doc.text(`PRIVILEGES CORRIDOR: ${stageMeta.flightStatus}`, 26, 172);

      // Security Seal & Legal
      doc.setDrawColor(212, 175, 55);
      doc.line(20, 186, 190, 186);

      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(140, 140, 140);
      doc.text('AUTHENTICITY & PRIVILEGES COVENANT:', 22, 194);
      doc.text('This credential certifies sovereign patron membership within DEUZ & CO. Atelier Archive.', 22, 200);
      doc.text('Holders of Stage 01 through 06 maintain access to bespoke allocations, vault acquisitions,', 22, 205);
      doc.text('and private salon viewings. Non-transferable. Validated against official central registry.', 22, 210);

      doc.setFont('courier', 'bold');
      doc.setTextColor(212, 175, 55);
      doc.text('ENCRYPTION: SSL 256-BIT // POST-QUANTUM HARDENED', 105, 224, { align: 'center' });
      doc.text('NOT FOR EVERYONE', 105, 232, { align: 'center' });

      doc.save(`DEUZ-Client-Dossier-${user.fullName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Failed to export dossier PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must contain at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await updatePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordSuccess('Password successfully updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => {
          setIsChangingPassword(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError(res.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Security system connection failure.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/90 backdrop-blur-2xl p-3 sm:p-6 md:p-8 flex items-center justify-center min-h-screen"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 25 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-5xl my-auto bg-[#060606] border border-white/15 rounded-xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.95)] max-h-[92vh] flex flex-col font-sans"
        >
          {/* Top Cinematic Scanning Laser */}
          <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden pointer-events-none z-30">
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              className="w-1/3 h-full bg-gradient-to-r from-transparent via-gold-400 to-transparent shadow-[0_0_20px_#D4AF37]"
            />
          </div>

          {/* Luxury Corner Metallic Accents */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-gold-500/60 pointer-events-none" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-gold-500/60 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-gold-500/60 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-gold-500/60 pointer-events-none" />

          {/* Modal Header */}
          <div className="p-5 sm:p-7 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-white/[0.03] via-transparent to-white/[0.02] shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-gold-500/15 border border-gold-500/40 text-gold-400 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                <Crown size={22} className="text-gold-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-gold-400 font-bold">
                    DEUZ & CO. ATELIER ARCHIVE
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400">
                    CLASSIFIED DOSSIER
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-serif text-white tracking-wide mt-0.5">
                  Client Dossier & Flight Status
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded bg-black/60 border border-white/10 text-[10px] font-mono text-white/60">
                <ShieldCheck size={12} className="text-gold-400" />
                <span>SSL 256-BIT ENCRYPTED</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-colors cursor-pointer"
                aria-label="Close Profile Chamber"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-5 sm:p-7 space-y-7 overflow-y-auto flex-1 gold-scrollbar">
            
            {/* Upgrade Requested Alert */}
            {upgradeRequested && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between text-xs font-mono shadow-[0_0_25px_rgba(16,185,129,0.2)]"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>Dossier elevation inquiry transmitted to Atelier Concierge Desk. Connecting priority channel...</span>
                </div>
              </motion.div>
            )}

            {/* CINEMATIC CLIENT DOSSIER CARD */}
            <div className="relative rounded-xl border border-gold-500/30 bg-gradient-to-b from-[#110e08]/90 via-[#0a0a0a]/95 to-[#050505] p-6 sm:p-7 overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(212,175,55,0.2)]">
              {/* Atmospheric Background Glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 left-1/4 w-60 h-60 bg-amber-600/5 rounded-full blur-2xl pointer-events-none" />
              
              {/* Guilloche/Grid Watermark */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

              {/* Dossier Header Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/10 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-gold-400/90 font-bold">
                    OFFICIAL DOSSIER RECORD //
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(dossierId);
                      setCopiedDossierId(true);
                      setTimeout(() => setCopiedDossierId(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 hover:bg-gold-500/20 text-gold-300 font-mono text-[10px] tracking-wider transition-colors cursor-pointer border border-white/10"
                    title="Click to copy dossier identifier"
                  >
                    <span>{dossierId}</span>
                    <Copy size={10} className="text-gold-400" />
                    {copiedDossierId && <span className="text-[9px] text-emerald-400">Copied</span>}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest bg-gold-500/15 text-gold-400 border border-gold-500/40 font-bold shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                    {user.role === 'admin' ? 'ROOT EXECUTIVE ADMINISTRATOR' : 'AUTHENTICATED PATRON'}
                  </span>
                </div>
              </div>

              {/* Client Identity & Flight Cockpit Telemetry */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5 relative z-10 items-center">
                
                {/* Left: Client Avatar and Bio Details (7 cols) */}
                <div className="lg:col-span-7 flex flex-col sm:flex-row items-start gap-5">
                  {/* Concentric Medal Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-gold-500 via-amber-400 to-yellow-200 p-[2px] shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                      <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
                        <span className="font-serif text-3xl font-bold bg-gradient-to-b from-white via-gold-200 to-gold-400 bg-clip-text text-transparent">
                          {user.fullName.charAt(0).toUpperCase()}
                        </span>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.3),transparent_70%)]" />
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-gold-500 text-black shadow-[0_0_10px_#D4AF37]">
                      <Crown size={12} />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-wide font-normal">
                        {user.fullName}
                      </h2>
                      {(user.houseCode || user.houseId) && (
                        <span className="px-2.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest bg-gradient-to-r from-gold-500/20 to-amber-500/20 text-gold-300 border border-gold-500/50 font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.25)]">
                          <Sparkles size={11} className="text-gold-400" />
                          HOUSE: {user.houseCode || user.houseId}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs text-white/60 mt-3 font-light">
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-gold-400 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-gold-400 shrink-0" />
                        <span>{user.mobile || 'Private Direct Line'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-gold-400 shrink-0" />
                        <span>Member Since {user.joinedDate ? new Date(user.joinedDate).getFullYear() : '2024'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield size={13} className="text-gold-400 shrink-0" />
                        <span>Clearance: Stage 0{stageMeta.level}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Aeronautical Flight Status HUD (5 cols) */}
                <div className="lg:col-span-5 bg-gradient-to-br from-black/90 via-[#0a0805] to-black/95 border border-gold-500/40 rounded-xl p-4 sm:p-5 shadow-[0_0_35px_rgba(212,175,55,0.15)] relative overflow-hidden group">
                  {/* Atmospheric gold blur */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Top HUD Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-gold-500/20 text-gold-400 animate-pulse shadow-[0_0_12px_rgba(212,175,55,0.4)]">
                        <Radio size={14} />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-gold-400 font-bold">
                        AERONAUTICAL FLIGHT TELEMETRY
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-mono uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      AIRBORNE • CORRIDOR ACTIVE
                    </span>
                  </div>

                  {/* Avionics Telemetry Grid & Mini Animated Radar */}
                  <div className="pt-3.5 grid grid-cols-12 gap-3 items-center relative z-10">
                    {/* Left: Stats (8 cols) */}
                    <div className="col-span-8 space-y-2.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8.5px] font-mono uppercase tracking-widest text-white/40">TIER CLEARANCE</span>
                          <span className="text-[8px] font-mono text-gold-400/80 px-1 py-0.2 rounded bg-gold-500/10 border border-gold-500/20">
                            {stageMeta.code}
                          </span>
                        </div>
                        <p className="text-base font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-amber-200 to-yellow-400 tracking-wider mt-0.5">
                          STAGE 0{stageMeta.level} — {stageMeta.name.toUpperCase()}
                        </p>
                        <p className="text-[10px] font-mono text-white/60 flex items-center gap-1.5">
                          <Plane size={10} className="text-gold-400 rotate-45" />
                          <span>{stageMeta.callsign}</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[9.5px] font-mono">
                        <div>
                          <span className="text-white/40 block text-[8px] uppercase tracking-wider">SUPERSONIC MACH</span>
                          <span className="text-gold-300 font-bold tracking-wide">{stageMeta.machSpeed}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[8px] uppercase tracking-wider">FLIGHT CEILING</span>
                          <span className="text-white font-semibold">{stageMeta.altitude}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Sweeping Radar Scope (4 cols) */}
                    <div className="col-span-4 flex flex-col items-center justify-center">
                      <div className="relative w-16 h-16 rounded-full border border-gold-500/40 bg-black/90 p-1 shadow-[0_0_20px_rgba(212,175,55,0.2)] flex items-center justify-center overflow-hidden">
                        {/* Concentric rings */}
                        <div className="absolute inset-1.5 rounded-full border border-gold-500/20" />
                        <div className="absolute inset-3.5 rounded-full border border-gold-500/15" />
                        
                        {/* Crosshairs */}
                        <div className="absolute top-0 bottom-0 left-1/2 w-[0.5px] bg-gold-500/25 -translate-x-1/2" />
                        <div className="absolute left-0 right-0 top-1/2 h-[0.5px] bg-gold-500/25 -translate-y-1/2" />

                        {/* Sweeping Beam */}
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
                          className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,rgba(212,175,55,0.5)_360deg)] pointer-events-none rounded-full"
                        />

                        {/* Center Target Ping */}
                        <div className="relative z-10 w-2 h-2 rounded-full bg-gold-400 shadow-[0_0_8px_#D4AF37] flex items-center justify-center">
                          <span className="w-1 h-1 rounded-full bg-white" />
                        </div>

                        {/* Distant Target Blip */}
                        <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                      <span className="text-[7.5px] font-mono text-gold-400/80 uppercase tracking-widest mt-1.5 font-bold">
                        RADAR SWEEP
                      </span>
                    </div>
                  </div>

                  {/* Satellite Uplink & Coordinates Bar */}
                  <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-white/50 relative z-10">
                    <span className="flex items-center gap-1.5">
                      <Compass size={11} className="text-gold-400 shrink-0" />
                      <span className="text-white/70">{stageMeta.coordinates}</span>
                    </span>
                    <span className="text-gold-400 font-semibold">{stageMeta.flightStatus}</span>
                  </div>
                </div>

              </div>

              {/* Dossier Control Panel: Edit Profile, Password & PDF Export */}
              <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 relative z-10">
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(!isEditing);
                      if (!isEditing) setIsChangingPassword(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all cursor-pointer border ${
                      isEditing 
                        ? 'bg-gold-500/20 text-gold-300 border-gold-500/50' 
                        : 'bg-white/5 text-white/70 hover:text-white border-white/10 hover:border-gold-500/30'
                    }`}
                  >
                    <Edit3 size={13} />
                    <span>{isEditing ? 'Cancel Edit' : 'Modify Coordinates'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(!isChangingPassword);
                      if (!isChangingPassword) setIsEditing(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all cursor-pointer border ${
                      isChangingPassword 
                        ? 'bg-gold-500/20 text-gold-300 border-gold-500/50' 
                        : 'bg-white/5 text-white/70 hover:text-white border-white/10 hover:border-gold-500/30'
                    }`}
                  >
                    <Lock size={13} />
                    <span>{isChangingPassword ? 'Cancel Password Change' : 'Update Password'}</span>
                  </button>

                  {/* Export Classified Dossier PDF */}
                  <button
                    type="button"
                    onClick={handleDownloadDossierPDF}
                    disabled={downloadingPdf}
                    title="Export Sovereign Client Dossier Document"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider bg-gold-500/10 hover:bg-gold-500/20 text-gold-300 border border-gold-500/40 hover:border-gold-400 transition-all cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.15)] disabled:opacity-50"
                  >
                    <Download size={13} className={downloadingPdf ? 'animate-bounce text-gold-400' : 'text-gold-400'} />
                    <span>{downloadingPdf ? 'Generating PDF...' : 'Export Dossier PDF'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {saveSuccess && (
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Coordinates Synchronized
                    </span>
                  )}
                  {passwordSuccess && (
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Password Updated
                    </span>
                  )}
                </div>
              </div>

              {/* SECURE PASSWORD UPDATE FORM */}
              {isChangingPassword && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleUpdatePassword}
                  className="mt-5 pt-5 border-t border-white/10 space-y-4 relative z-10"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gold-400 flex items-center gap-1.5 font-bold">
                      <ShieldCheck size={14} className="text-gold-400" /> SECURE CREDENTIALS CONFIGURATION // 256-BIT ENCRYPTION
                    </span>
                  </div>

                  {passwordError && (
                    <div className="p-3 bg-red-950/40 border border-red-500/40 rounded text-red-300 text-xs font-mono flex items-center gap-2">
                      <AlertTriangle size={14} className="shrink-0 text-red-400" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-mono uppercase tracking-widest text-white/50 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current password"
                        className="w-full bg-black/80 border border-white/15 rounded px-3 py-2 text-xs text-white focus:border-gold-400 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono uppercase tracking-widest text-white/50 mb-1">
                        New Password (6+ chars)
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        required
                        className="w-full bg-black/80 border border-white/15 rounded px-3 py-2 text-xs text-white focus:border-gold-400 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono uppercase tracking-widest text-white/50 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        className="w-full bg-black/80 border border-white/15 rounded px-3 py-2 text-xs text-white focus:border-gold-400 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="px-5 py-2.5 bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-black text-xs font-mono uppercase tracking-widest font-bold rounded flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                    >
                      <KeyRound size={13} />
                      <span>{passwordLoading ? 'Updating Password...' : 'Save New Password'}</span>
                    </button>
                  </div>
                </motion.form>
              )}

              {/* EDITABLE COORDINATES FORM */}
              {isEditing && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleSaveProfile}
                  className="mt-5 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10"
                >
                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-widest text-white/50 mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      className="w-full bg-black/80 border border-white/15 rounded px-3 py-2 text-xs text-white focus:border-gold-400 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-widest text-white/50 mb-1">Mobile Contact</label>
                    <input
                      type="text"
                      value={mobileInput}
                      onChange={(e) => setMobileInput(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-black/80 border border-white/15 rounded px-3 py-2 text-xs text-white focus:border-gold-400 outline-none font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-mono uppercase tracking-widest text-white/50 mb-1">Delivery Address</label>
                    <input
                      type="text"
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      placeholder="Street & Suite"
                      className="w-full bg-black/80 border border-white/15 rounded px-3 py-2 text-xs text-white focus:border-gold-400 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-widest text-white/50 mb-1">City & Postal</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cityInput}
                        onChange={(e) => setCityInput(e.target.value)}
                        placeholder="City"
                        className="w-2/3 bg-black/80 border border-white/15 rounded px-3 py-2 text-xs text-white focus:border-gold-400 outline-none font-mono"
                      />
                      <input
                        type="text"
                        value={postalInput}
                        onChange={(e) => setPostalInput(e.target.value)}
                        placeholder="Postal"
                        className="w-1/3 bg-black/80 border border-white/15 rounded px-3 py-2 text-xs text-white focus:border-gold-400 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-widest text-white/50 mb-1">Country</label>
                    <input
                      type="text"
                      value={countryInput}
                      onChange={(e) => setCountryInput(e.target.value)}
                      placeholder="Country"
                      className="w-full bg-black/80 border border-white/15 rounded px-3 py-2 text-xs text-white focus:border-gold-400 outline-none font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-black text-xs font-mono uppercase tracking-widest font-bold rounded transition-all cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.25)]"
                    >
                      <Save size={13} />
                      <span>{saving ? 'Synchronizing...' : 'Save Dossier Coordinates'}</span>
                    </button>
                  </div>
                </motion.form>
              )}
            </div>

            {/* UNIQUE HOUSE ID ALLOCATION CHAMBER */}
            <div className="bg-gradient-to-r from-amber-950/25 via-black/85 to-zinc-950/60 border border-gold-500/35 rounded-xl p-5 sm:p-6 relative overflow-hidden shadow-[0_6px_35px_rgba(0,0,0,0.7)]">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500/25 to-amber-900/50 border border-gold-500/50 flex items-center justify-center text-gold-300 shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.25)]">
                    <Crown size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-gold-400 font-bold">
                        UNIQUE HOUSE IDENTIFICATION
                      </span>
                      <span className="text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold">
                        Cloud Synchronized
                      </span>
                    </div>

                    {(user.houseCode || user.houseId) ? (
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-2xl sm:text-3xl font-mono font-bold tracking-widest text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                          {user.houseCode || user.houseId}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(user.houseCode || user.houseId || '');
                            setCopiedHouseCode(true);
                            setTimeout(() => setCopiedHouseCode(false), 2000);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1 rounded bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/40 text-gold-300 text-xs font-mono tracking-wider transition-all cursor-pointer shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                        >
                          <Copy size={12} />
                          <span>{copiedHouseCode ? 'Copied to Clipboard' : 'Copy Code'}</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs font-mono text-white/50 mt-1.5 italic">
                        Awaiting House ID allocation. When assigned by the Atelier Administrator, your unique House Code will appear here.
                      </p>
                    )}
                  </div>
                </div>

                <div className="sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-white/40">Credential Status</p>
                  <p className="text-xs font-mono font-semibold text-gold-400 mt-0.5">
                    {(user.houseCode || user.houseId) ? 'AUTHENTICATED HOUSE CODE' : 'PENDING ARCHIVE ALLOCATION'}
                  </p>
                </div>
              </div>
            </div>

            {/* CINEMATIC FLIGHT CORRIDOR & RADAR SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plane size={15} className="rotate-45 text-gold-400" />
                  <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-gold-400 font-bold">
                    AERONAUTICAL FLIGHT CORRIDOR // ALL 6 TIERS
                  </h3>
                </div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">
                  REAL-TIME TELEMETRY
                </span>
              </div>
              
              <CustomerStageTracker 
                currentStage={currentStage} 
                onRequestUpgrade={handleRequestUpgrade}
              />
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
