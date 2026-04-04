import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const PremiumBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    window.addEventListener('resize', resize);
    resize();

    // Elegant, sparse gold particles
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    const particleCount = width < 768 ? 20 : 45; // Performance optimized

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15, // Very slow movement
        vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 1.5,
        alpha: Math.random() * 0.4 + 0.1
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around screen
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha})`; // Premium Gold
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020202]">
        {/* Base Gradient Ambience */}
        <motion.div 
            animate={{ 
                opacity: [0.3, 0.5, 0.3],
                scale: [1, 1.1, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-slate-900/20 rounded-full blur-[120px]"
        />
        
        <motion.div 
            animate={{ 
                opacity: [0.1, 0.3, 0.1],
                x: [0, 50, 0],
                y: [0, -50, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-gold-900/10 rounded-full blur-[120px]"
        />

        <motion.div 
            animate={{ 
                opacity: [0.05, 0.15, 0.05],
                scale: [1, 1.2, 1]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-[40%] left-[30%] w-[50vw] h-[50vw] bg-purple-900/5 rounded-full blur-[150px]"
        />

        {/* Particle Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />
        
        {/* Subtle Scanline Texture for 'Screen' Feel */}
        <div 
            className="absolute inset-0 opacity-[0.05]"
            style={{ 
                backgroundImage: 'linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.5) 50%)',
                backgroundSize: '100% 4px' 
            }}
        />
    </div>
  );
};

export default PremiumBackground;