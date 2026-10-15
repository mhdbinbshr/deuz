import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, 
  Check, 
  Lock, 
  ChevronRight, 
  Navigation, 
  Radio, 
  ShieldCheck, 
  Compass, 
  Sparkles,
  Globe2,
  Layers,
  ArrowUpRight,
  Activity,
  Zap,
  Gauge
} from 'lucide-react';
import { CustomerStage, CUSTOMER_STAGES, StageDefinition } from '../types';
import { StageFlightRadar3D } from './StageFlightRadar3D';

interface CustomerStageTrackerProps {
  currentStage?: CustomerStage;
  onRequestUpgrade?: () => void;
  show3DRadar?: boolean;
  isAdmin?: boolean;
  onAdminUpgradeStage?: (stageId: CustomerStage) => Promise<void> | void;
  hasPlacedFirstOrder?: boolean;
}

export const CustomerStageTracker: React.FC<CustomerStageTrackerProps> = ({
  currentStage = 'applicant',
  onRequestUpgrade,
  show3DRadar = true,
  isAdmin = false,
  onAdminUpgradeStage,
  hasPlacedFirstOrder = false
}) => {
  const [selectedStage, setSelectedStage] = useState<CustomerStage>(currentStage);
  const [activeTab, setActiveTab] = useState<'trajectory' | 'radar3d'>('trajectory');
  const [elevatingStage, setElevatingStage] = useState<CustomerStage | null>(null);

  const currentIndex = CUSTOMER_STAGES.findIndex(s => s.id === currentStage);
  const safeCurrentIdx = currentIndex >= 0 ? currentIndex : 0;
  const currentStageData = CUSTOMER_STAGES[safeCurrentIdx];
  const selectedStageData = CUSTOMER_STAGES.find(s => s.id === selectedStage) || currentStageData;

  const isCurrent = (stageId: CustomerStage) => stageId === currentStage;
  const isCompleted = (index: number) => index < safeCurrentIdx;
  const isUpcoming = (index: number) => index > safeCurrentIdx;

  const handleAdminElevation = async (stageId: CustomerStage) => {
    if (!onAdminUpgradeStage) return;
    setElevatingStage(stageId);
    try {
      await onAdminUpgradeStage(stageId);
      setSelectedStage(stageId);
    } finally {
      setElevatingStage(null);
    }
  };

  return (
    <div className="w-full bg-[#080808] border border-white/15 rounded-xl p-5 sm:p-7 relative overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
      {/* Cinematic Radar Ambient Sweep Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      {/* Scanning Horizontal Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold-400/50 to-transparent pointer-events-none" />

      {/* Top Header: Flight Clearance Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-lg bg-gold-500/15 border border-gold-500/40 text-gold-400 shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.25)]">
            <Radio size={22} className="animate-pulse text-gold-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/50 font-bold">
                CLIENT FLIGHT CORRIDOR // CLEARANCE STATUS
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ACTIVE FLIGHT CORRIDOR
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-serif text-white tracking-wide mt-1.5 flex items-center gap-3">
              <span>Stage 0{currentStageData.level}: <span className="text-gold-400 font-bold">{currentStageData.name}</span></span>
              <span className="text-xs font-mono text-gold-300 tracking-widest border border-gold-500/30 px-2 py-0.5 rounded bg-gold-500/10">
                {currentStageData.code}
              </span>
            </h2>

            <p className="text-xs text-white/70 font-light mt-1 flex items-center gap-2">
              <Compass size={13} className="text-gold-400" />
              <span className="text-gold-300/90 font-medium">{currentStageData.flightStatus}</span>
              <span className="text-white/30">•</span>
              <span className="text-white/50 font-mono text-[11px]">{currentStageData.callsign}</span>
            </p>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-1.5 bg-black/80 p-1.5 rounded-lg border border-white/15 self-start sm:self-center shadow-lg">
          <button
            type="button"
            onClick={() => setActiveTab('trajectory')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'trajectory'
                ? 'bg-gradient-to-r from-gold-500/25 to-amber-500/20 text-gold-300 border border-gold-500/50 font-bold shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Layers size={13} /> Trajectory Vector
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('radar3d')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'radar3d'
                ? 'bg-gradient-to-r from-gold-500/25 to-amber-500/20 text-gold-300 border border-gold-500/50 font-bold shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Globe2 size={13} /> Radar Globe
          </button>
        </div>
      </div>

      {/* Aeronautical Telemetry Dashboard HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 relative z-10">
        <div className="bg-black/60 border border-gold-500/20 rounded-lg p-3.5 relative overflow-hidden group hover:border-gold-500/40 transition-colors">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[9px] font-mono uppercase tracking-widest">CALLSIGN</span>
            <Plane size={11} className="rotate-45 text-gold-400" />
          </div>
          <p className="text-xs sm:text-sm font-mono text-gold-400 font-bold truncate">{currentStageData.callsign}</p>
        </div>

        <div className="bg-black/60 border border-white/10 rounded-lg p-3.5 relative overflow-hidden group hover:border-gold-500/40 transition-colors">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[9px] font-mono uppercase tracking-widest">ALTITUDE // CEILING</span>
            <Gauge size={11} className="text-gold-400" />
          </div>
          <p className="text-xs sm:text-sm font-mono text-white font-semibold">{currentStageData.altitude}</p>
        </div>

        <div className="bg-black/60 border border-white/10 rounded-lg p-3.5 relative overflow-hidden group hover:border-gold-500/40 transition-colors">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[9px] font-mono uppercase tracking-widest">SUPERSONIC VELOCITY</span>
            <Zap size={11} className="text-gold-400" />
          </div>
          <p className="text-xs sm:text-sm font-mono text-white font-semibold">{currentStageData.machSpeed}</p>
        </div>

        <div className="bg-black/60 border border-white/10 rounded-lg p-3.5 relative overflow-hidden group hover:border-gold-500/40 transition-colors">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[9px] font-mono uppercase tracking-widest">VECTOR COORDINATES</span>
            <Compass size={11} className="text-gold-400" />
          </div>
          <p className="text-xs sm:text-sm font-mono text-white font-semibold truncate">{currentStageData.coordinates}</p>
        </div>
      </div>

      {/* Radar View Tab */}
      {activeTab === 'radar3d' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <StageFlightRadar3D currentStage={currentStage} />
          <p className="text-center text-[10px] font-mono text-gold-400/80 mt-2 tracking-wider flex items-center justify-center gap-2">
            <Radio size={11} className="animate-pulse" />
            <span>DRAG TO ROTATE AERONAUTICAL GLOBE • LIVE 3D TELEMETRY MATRIX</span>
          </p>
        </motion.div>
      )}

      {/* Main Flight Trajectory Stages Pipeline */}
      {activeTab === 'trajectory' && (
        <div className="relative mb-8 pt-6 pb-2">
          {/* Connecting Flight Corridor Baseline */}
          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-[2px] bg-white/10 hidden md:block" />

          {/* Active Flight Corridor Plasma Glow (Completed + Current) */}
          <div 
            className="absolute top-1/2 left-4 -translate-y-1/2 h-[3px] bg-gradient-to-r from-gold-500 via-gold-400 to-amber-300 shadow-[0_0_20px_#D4AF37] hidden md:block transition-all duration-700"
            style={{
              width: `calc(${(safeCurrentIdx / (CUSTOMER_STAGES.length - 1)) * 100}% - 2rem)`
            }}
          />

          {/* The 7 Stages Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 sm:gap-3 relative z-10">
            {CUSTOMER_STAGES.map((stage, idx) => {
              const active = isCurrent(stage.id);
              const completed = isCompleted(idx);
              const upcoming = isUpcoming(idx);

              return (
                <div
                  key={stage.id}
                  onClick={() => setSelectedStage(stage.id)}
                  className={`group relative p-3.5 rounded-xl border transition-all duration-500 cursor-pointer flex flex-col justify-between min-h-[165px] ${
                    active
                      ? 'bg-gradient-to-b from-gold-500/25 via-gold-500/10 to-black/95 border-gold-400 shadow-[0_0_40px_rgba(212,175,55,0.4)] ring-1 ring-gold-400/70 scale-[1.02]'
                      : completed
                      ? 'bg-black/80 border-gold-500/40 hover:border-gold-500/80 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                      : 'bg-black/60 border-white/10 filter blur-[1.5px] opacity-40 hover:blur-none hover:opacity-100 hover:scale-[1.02] transition-all duration-500'
                  } ${selectedStage === stage.id && !active ? 'ring-1 ring-white/60 border-white/40' : ''}`}
                >
                  {/* Flight Jet Animated Marker on the ACTIVE Stage */}
                  {active && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30">
                      <motion.div
                        animate={{ 
                          y: [-3, 3, -3],
                          rotate: [-4, 4, -4]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2.8, 
                          ease: "easeInOut" 
                        }}
                        className="relative flex items-center justify-center p-2 rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-amber-500 text-black shadow-[0_0_25px_#D4AF37]"
                      >
                        <Plane size={16} className="rotate-45 fill-black" />
                        
                        {/* Jet Engine Supersonic Shockwave Ring 1 */}
                        <motion.div
                          animate={{ scale: [1, 2.5], opacity: [0.9, 0] }}
                          transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
                          className="absolute inset-0 rounded-full border border-gold-300 -z-10"
                        />

                        {/* Jet Engine Supersonic Shockwave Ring 2 */}
                        <motion.div
                          animate={{ scale: [1, 3.4], opacity: [0.6, 0] }}
                          transition={{ repeat: Infinity, duration: 1.6, delay: 0.5, ease: "easeOut" }}
                          className="absolute inset-0 rounded-full bg-gold-400/30 -z-20"
                        />

                        {/* Trailing Jetstream Contrail Dots */}
                        <motion.div
                          animate={{ y: [6, 20], opacity: [0.8, 0], scale: [1, 0.4] }}
                          transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                          className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-gold-200"
                        />
                      </motion.div>
                    </div>
                  )}

                  {/* Stage Top Bar Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gold-400/80 font-bold">
                      0{stage.level}
                    </span>

                    {completed && (
                      <span className="flex items-center gap-1 text-[9px] font-mono text-gold-400 uppercase tracking-widest font-bold">
                        <Check size={11} className="text-gold-400" /> CLEARED
                      </span>
                    )}

                    {active && (
                      <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        IN FLIGHT
                      </span>
                    )}

                    {upcoming && (
                      <span className="flex items-center gap-1 text-[9px] font-mono text-white/40 uppercase tracking-widest">
                        <Lock size={10} /> LOCKED
                      </span>
                    )}
                  </div>

                  {/* Stage Name & Tagline */}
                  <div className="my-2">
                    <h3 className={`font-serif text-base tracking-wide ${active ? 'text-gold-300 font-bold' : completed ? 'text-white' : 'text-white/70'}`}>
                      {stage.name}
                    </h3>
                    <p className="text-[10px] font-mono text-white/50 truncate mt-0.5">
                      {stage.tagline}
                    </p>
                  </div>

                  {/* Upcoming Locked Indicator Badge */}
                  {upcoming && (
                    <div className="text-[8px] font-mono text-gold-400/80 uppercase tracking-wider py-0.5 px-1.5 rounded bg-white/[0.04] border border-white/5 flex items-center justify-between mb-1.5">
                      <span>RESTRICTED</span>
                      <ChevronRight size={10} />
                    </div>
                  )}

                  {/* Stage Altitude/Velocity Micro-HUD */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-white/50">
                    <span className="truncate">{stage.machSpeed}</span>
                    <span className={active ? 'text-gold-400 font-bold' : 'text-white/30'}>STAGE 0{stage.level}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Stage Privileges Breakdown Drawer */}
      <div className="bg-gradient-to-b from-black/80 via-black/95 to-[#060606] border border-gold-500/30 rounded-xl p-5 sm:p-6 relative z-10 shadow-[0_15px_40px_rgba(0,0,0,0.8)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-gold-400 font-bold">
                STAGE SPECIFICATION // {selectedStageData.code}
              </span>
              {selectedStage === currentStage && (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                  Your Current Level
                </span>
              )}
            </div>
            
            <h4 className="font-serif text-lg sm:text-xl text-white mt-1.5">
              Stage 0{selectedStageData.level}: {selectedStageData.name} — <span className="text-gold-400/90 font-light text-sm">{selectedStageData.tagline}</span>
            </h4>
            <p className="text-xs text-white/70 mt-1 max-w-2xl leading-relaxed">
              {selectedStageData.description}
            </p>
          </div>

          {/* Action: Request Stage Upgrade / Elevate */}
          {selectedStage !== currentStage && (
            <div className="shrink-0 flex items-center gap-2">
              {isAdmin && onAdminUpgradeStage ? (
                <button
                  type="button"
                  onClick={() => handleAdminElevation(selectedStage)}
                  disabled={elevatingStage === selectedStage}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 hover:from-emerald-400 hover:to-teal-200 text-black text-xs font-mono uppercase tracking-widest font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck size={14} />
                  <span>
                    {elevatingStage === selectedStage 
                      ? 'Elevating Customer...' 
                      : `Admin: Elevate to ${selectedStageData.name}`}
                  </span>
                </button>
              ) : selectedStage === 'initiative' && currentStage === 'applicant' ? (
                hasPlacedFirstOrder ? (
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <Sparkles size={13} className="text-amber-400 shrink-0" />
                    <span>1st Order Placed • Awaiting Admin Decision</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onRequestUpgrade}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-black text-xs font-mono uppercase tracking-widest font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(212,175,55,0.35)] cursor-pointer"
                  >
                    <Sparkles size={13} />
                    <span>Place 1st Order for Initiative</span>
                    <ArrowUpRight size={13} />
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={onRequestUpgrade}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-black text-xs font-mono uppercase tracking-widest font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(212,175,55,0.35)] cursor-pointer"
                >
                  <Sparkles size={13} />
                  <span>Request {selectedStageData.name} Upgrade</span>
                  <ArrowUpRight size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Privileges Matrix */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gold-400/80 mb-3 font-bold">
            ACCREDITED ATELIER PRIVILEGES & FLIGHT PROTOCOLS
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedStageData.privileges.map((privilege, pIdx) => {
              const isUnlocked = CUSTOMER_STAGES.findIndex(s => s.id === selectedStage) <= safeCurrentIdx;

              return (
                <div 
                  key={pIdx}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isUnlocked
                      ? 'bg-gradient-to-r from-gold-500/10 via-transparent to-transparent border-gold-500/30 text-white shadow-[0_0_15px_rgba(212,175,55,0.08)]'
                      : 'bg-black/50 border-white/5 text-white/40 filter blur-[0.4px]'
                  }`}
                >
                  <div className={`p-1.5 rounded-full shrink-0 ${isUnlocked ? 'bg-gold-500/25 text-gold-400' : 'bg-white/5 text-white/30'}`}>
                    {isUnlocked ? <Check size={12} className="text-gold-400" /> : <Lock size={12} />}
                  </div>
                  <span className="text-xs font-light tracking-wide">{privilege}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
