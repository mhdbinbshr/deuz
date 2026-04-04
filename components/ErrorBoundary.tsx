import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Power } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught anomaly:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center text-white overflow-hidden font-sans select-none">
            {/* Ambient Background & Noise */}
            <div 
                className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0505] to-black" />
            
            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[1] bg-[length:100%_2px,3px_100%] opacity-20" />

            <div className="relative z-10 max-w-lg w-full px-8 text-center flex flex-col items-center">
                {/* Icon Animation */}
                <div className="mb-10 relative">
                    <div className="absolute inset-0 bg-red-500/20 blur-[40px] rounded-full animate-pulse" />
                    <div className="w-24 h-24 rounded-full bg-[#050505] border border-red-500/30 flex items-center justify-center relative shadow-[0_0_30px_rgba(220,38,38,0.1)]">
                        <AlertTriangle size={40} className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                        
                        {/* Rotating ring */}
                        <div className="absolute inset-0 border border-t-red-500/50 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin [animation-duration:3s]" />
                    </div>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-serif tracking-[0.2em] mb-4 text-white drop-shadow-lg">
                    SIGNAL LOST
                </h1>
                
                <div className="h-[1px] w-12 bg-red-500 mx-auto mb-8" />
                
                <p className="text-white/50 text-sm mb-10 font-light leading-relaxed max-w-sm font-mono">
                    System integrity compromised. An unexpected anomaly has disrupted the visual feed.
                </p>
                
                {/* Error Details */}
                {this.state.error && (
                    <div className="w-full bg-red-950/10 border border-red-500/10 p-4 mb-10 text-left rounded-sm backdrop-blur-sm group hover:border-red-500/30 transition-colors">
                        <p className="font-mono text-[10px] text-red-500/70 uppercase tracking-widest mb-1">System Diagnostic</p>
                        <p className="font-mono text-[11px] text-red-400 break-all leading-relaxed opacity-80 group-hover:opacity-100">
                           {this.state.error.toString()}
                        </p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <button 
                        onClick={this.handleReload}
                        className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black hover:bg-red-500 hover:text-white transition-all duration-500 uppercase tracking-[0.2em] text-xs font-bold overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
                            Reinitialize
                        </span>
                        <div className="absolute inset-0 bg-red-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    </button>
                    
                    <a 
                        href="/"
                        className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 border border-white/10 text-white/60 hover:text-white hover:border-white transition-all duration-300 uppercase tracking-[0.2em] text-xs font-bold"
                    >
                        <Power size={14} />
                        Hard Reset
                    </a>
                </div>
            </div>
            
            {/* Cinematic Corners */}
            <div className="absolute top-0 left-0 p-8 opacity-50">
                <div className="w-32 h-[1px] bg-gradient-to-r from-red-500/50 to-transparent mb-2" />
                <div className="h-32 w-[1px] bg-gradient-to-b from-red-500/50 to-transparent" />
            </div>
            <div className="absolute bottom-0 right-0 p-8 opacity-50 rotate-180">
                <div className="w-32 h-[1px] bg-gradient-to-r from-red-500/50 to-transparent mb-2" />
                <div className="h-32 w-[1px] bg-gradient-to-b from-red-500/50 to-transparent" />
            </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}