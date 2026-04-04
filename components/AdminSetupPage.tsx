import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, Crown, ChevronRight, CheckCircle2, AlertTriangle, Fingerprint } from 'lucide-react';
import { db, setAuthToken } from '../utils/db';
import { storage } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';

interface AdminSetupPageProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AdminSetupPage: React.FC<AdminSetupPageProps> = ({ onSuccess, onCancel }) => {
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    setupKey: '',
    fullName: '',
    email: '',
    password: ''
  });
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('processing');
    setErrorMessage('');

    try {
      const response = await db.bootstrapSystem(formData);
      
      // Auto-Login if token is returned
      if (response && response.token) {
          storage.setToken(response.token);
          
          // Map response to User type
          const userToSave: User = {
              id: response.id,
              fullName: response.fullName,
              email: response.email,
              mobile: response.mobile,
              role: response.role as any,
              joinedDate: new Date().toISOString(), // Use current time as fallback for serverTimestamp
              orders: [],
              address: undefined
          };
          
          storage.setUser(userToSave);
          setAuthToken(response.token);
          refreshUser();
      }

      setStatus('success');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Initialization protocol failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#020202] flex items-center justify-center overflow-hidden font-sans">
      {/* Cinematic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold-900/10 via-black to-black opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="bg-[#0A0A0A] border border-white/10 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden group">
            {/* Top Shine */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />

            <div className="flex flex-col items-center mb-10">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-16 h-16 bg-gradient-to-tr from-gold-900/20 to-black rounded-full flex items-center justify-center border border-gold-500/20 mb-6 shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                >
                    <Crown className="text-gold-500" size={24} />
                </motion.div>
                <h1 className="text-2xl text-white font-serif tracking-[0.2em] mb-2 text-center">SYSTEM BOOTSTRAP</h1>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-light">Root Administration Setup</p>
            </div>

            {status === 'success' ? (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8"
                >
                    <div className="inline-flex mb-6 p-4 rounded-full bg-green-500/10 border border-green-500/50 relative">
                        <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                        <CheckCircle2 size={40} className="text-green-500 relative z-10" />
                    </div>
                    <h2 className="text-xl text-white font-serif tracking-widest mb-2">ACCESS GRANTED</h2>
                    <p className="text-white/40 text-xs mb-6 uppercase tracking-widest">Redirecting to Command Center...</p>
                    <div className="h-[2px] w-24 bg-white/10 mx-auto overflow-hidden rounded-full">
                        <motion.div 
                            initial={{ x: '-100%' }}
                            animate={{ x: '0%' }}
                            transition={{ duration: 1 }}
                            className="h-full bg-gold-500"
                        />
                    </div>
                </motion.div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative group">
                            <label className="text-[9px] uppercase tracking-widest text-gold-500/70 mb-2 block flex items-center gap-2">
                                <Key size={10} /> Installation Key
                            </label>
                            <input 
                                type="password" 
                                value={formData.setupKey}
                                onChange={(e) => setFormData({...formData, setupKey: e.target.value})}
                                className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors placeholder:text-white/10 font-mono tracking-widest"
                                placeholder="Enter Key (Default: deuz_setup_2024)"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative group">
                                <label className="text-[9px] uppercase tracking-widest text-gold-500/70 mb-2 block">Admin Identity</label>
                                <input 
                                    type="text" 
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                    className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors placeholder:text-white/10"
                                    placeholder="System Admin"
                                    required
                                />
                            </div>
                            <div className="relative group">
                                <label className="text-[9px] uppercase tracking-widest text-gold-500/70 mb-2 block">Root Email</label>
                                <input 
                                    type="email" 
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors placeholder:text-white/10"
                                    placeholder="root@deuz.co"
                                    required
                                />
                            </div>
                        </div>

                        <div className="relative group">
                            <label className="text-[9px] uppercase tracking-widest text-gold-500/70 mb-2 block flex items-center gap-2">
                                <Shield size={10} /> Secure Passcode
                            </label>
                            <input 
                                type="password" 
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-gold-500 transition-colors placeholder:text-white/10"
                                placeholder="••••••••••••"
                                required
                            />
                        </div>
                    </div>

                    {status === 'error' && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-900/20 border border-red-500/30 flex items-center gap-3 text-red-300 text-xs">
                            <AlertTriangle size={14} className="shrink-0" />
                            {errorMessage}
                        </motion.div>
                    )}

                    <div className="pt-6 flex gap-4">
                        <button 
                            type="button" 
                            onClick={onCancel}
                            className="flex-1 py-3 border border-white/10 text-white/40 hover:text-white hover:border-white text-[10px] uppercase tracking-widest transition-all"
                        >
                            Abort
                        </button>
                        <button 
                            type="submit" 
                            disabled={status === 'processing'}
                            className="flex-[2] py-3 bg-white text-black hover:bg-gold-500 hover:text-white transition-all text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {status === 'processing' ? 'Initializing...' : 'Execute Protocol'}
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </form>
            )}
        </div>
        
        <div className="text-center mt-6 flex flex-col gap-1">
            <span className="text-[9px] text-white/20 uppercase tracking-widest">DEUZ & CO. SYSTEM CORE V1.0</span>
            <div className="flex justify-center gap-2">
               <div className="w-1 h-1 bg-white/20 rounded-full animate-pulse" />
               <div className="w-1 h-1 bg-white/20 rounded-full animate-pulse delay-75" />
               <div className="w-1 h-1 bg-white/20 rounded-full animate-pulse delay-150" />
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminSetupPage;