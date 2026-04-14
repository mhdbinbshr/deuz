import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

const About: React.FC = () => {
  const { content } = useSettings();

  return (
    <section id="house-standards" className="relative py-32 bg-transparent px-6 md:px-12 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center relative z-10">
        
        {/* Text Side */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-gold-500 text-sm font-bold tracking-[0.3em] uppercase mb-8 flex items-center gap-4">
              <span className="w-8 h-[1px] bg-gold-500"></span>
              {content.aboutTitle || 'THE HOUSE STANDARD'}
            </h2>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white leading-tight mb-8" dangerouslySetInnerHTML={{ __html: (content.aboutSubtitle || 'DEUZ IS THE <br /> <span className="text-white/30">DESIGN.</span>').replace('\n', '<br />') }} />
            <p className="text-lg text-gray-400 font-light leading-relaxed mb-6">
              {content.aboutDescription || 'DEUZ & CO is anchored in singularity. One design defines the house — structured with discipline, refined with precision, and elevated through measured evolution. We do not multiply form. We perfect it. Each release strengthens the standard.'}
            </p>
          </motion.div>

          {/* Markers */}
          <div className="grid grid-cols-3 gap-2 md:gap-8 mt-12 border-t border-white/10 pt-12">
            {[
              { label: 'I', value: 'ICON' },
              { label: 'II', value: 'PRECISION' },
              { label: 'III', value: 'PERMANENCE' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 * idx, duration: 0.8 }}
                className="flex flex-col justify-between h-full"
              >
                <div className="text-[10px] sm:text-sm md:text-lg lg:text-xl font-serif text-white mb-2 tracking-[0.1em] sm:tracking-widest break-words">{stat.value}</div>
                <div className="text-[8px] sm:text-[10px] uppercase tracking-widest text-gold-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Image Side */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative aspect-[4/5] overflow-hidden rounded-sm"
          >
            <img 
              src={content.aboutImage || "https://ik.imagekit.io/dto1zguat/file_0000000054e071fa80c009a3a2a07326.png"} 
              alt="The House Standard" 
              className="object-cover w-full h-full opacity-80 hover:scale-105 transition-transform duration-[2000ms]"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
            
            {/* Floating Badge */}
            <div className="absolute bottom-8 right-8 w-24 h-24 rounded-full border border-white/20 backdrop-blur-sm flex items-center justify-center animate-spin-slow">
              <div className="text-[8px] uppercase tracking-widest text-white/80 text-center leading-none">
                Since <br/> 2026
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
};

export default About;