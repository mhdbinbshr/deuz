
import React from 'react';
import { motion } from 'framer-motion';
import { X, Clapperboard, Aperture, Wand2, MonitorPlay, Mic2, Layers } from 'lucide-react';

interface ServicesPageProps {
  onClose: () => void;
  onContact: () => void;
}

const ServicesPage: React.FC<ServicesPageProps> = ({ onClose, onContact }) => {
  const services = [
    {
      id: '01',
      title: 'Direction & Concept',
      description: 'From narrative architecture to visual storyboarding. We architect the soul of the film before the first frame is captured.',
      icon: Clapperboard,
      tags: ['Screenwriting', 'Storyboarding', 'Art Direction']
    },
    {
      id: '02',
      title: 'Cinematography',
      description: 'Mastery of light and shadow. We utilize large-format cinema cameras and anamorphic optics to craft a distinct visual signature.',
      icon: Aperture,
      tags: ['Anamorphic', 'Lighting Design', 'Camera Movement']
    },
    {
      id: '03',
      title: 'VFX & CGI',
      description: 'Invisible integration of the impossible. Photorealistic 3D assets, environment extensions, and particle simulations.',
      icon: Wand2,
      tags: ['Houdini', 'Unreal Engine', 'Compositing']
    },
    {
      id: '04',
      title: 'Post-Production',
      description: 'The final rewrite. Precision editing, rhythm control, and narrative refinement in our offline suites.',
      icon: Layers,
      tags: ['Editorial', 'Montage', 'Workflow']
    },
    {
      id: '05',
      title: 'Color Grading',
      description: 'Defining the mood. Reference-grade DI theater workflows to establish the perfect palette and tonal depth.',
      icon: MonitorPlay,
      tags: ['DaVinci Resolve', 'HDR Mastering', 'Look Dev']
    },
    {
      id: '06',
      title: 'Sound Design',
      description: 'Immersive sonic landscapes. Dolby Atmos mixing, foley recording, and original score composition.',
      icon: Mic2,
      tags: ['Dolby Atmos', 'Score', 'Foley']
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#020202] overflow-y-auto"
    >
      {/* Background Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
      <div className="fixed top-0 right-0 w-[50vw] h-full bg-gradient-to-l from-blue-900/10 to-transparent pointer-events-none" />

      {/* Navigation */}
      <nav className="sticky top-0 left-0 right-0 z-50 p-8 flex justify-between items-center bg-[#050505]/90 backdrop-blur-md border-b border-white/5">
        <div className="text-xl font-serif text-white tracking-[0.2em]">DEUZ & CO</div>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors group flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest hidden md:block group-hover:mr-1 transition-all">Close</span>
          <X size={24} strokeWidth={1} />
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-center mb-24"
        >
          <span className="text-gold-500 text-[10px] uppercase tracking-[0.4em] block mb-4">Production Capabilities</span>
          <h1 className="text-5xl md:text-7xl font-serif text-white tracking-widest mb-6">
            THE STUDIO
          </h1>
          <p className="text-white/40 text-sm max-w-xl mx-auto leading-relaxed">
            A full-service production house bridging the gap between cinema and digital culture. We execute with military precision and artistic fluidity.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              className="bg-[#050505] p-10 group hover:bg-[#080808] transition-colors relative overflow-hidden"
            >
              {/* Hover Accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gold-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              
              <div className="flex justify-between items-start mb-8">
                <span className="text-white/20 font-serif text-xl">{service.id}</span>
                <service.icon className="text-white/40 group-hover:text-gold-500 transition-colors" size={24} strokeWidth={1} />
              </div>
              
              <h3 className="text-2xl font-serif text-white mb-4">{service.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-8 min-h-[80px]">
                {service.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {service.tags.map(tag => (
                  <span key={tag} className="text-[9px] uppercase tracking-widest border border-white/10 px-3 py-1 text-white/40">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
           <button 
             onClick={() => { onClose(); onContact(); }}
             className="group relative inline-flex items-center gap-4 px-12 py-5 bg-white text-black hover:bg-gold-500 hover:text-white transition-all duration-500"
           >
              <span className="text-xs uppercase tracking-[0.3em] font-bold relative z-10">Commission Project</span>
              <div className="absolute inset-0 bg-gold-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
           </button>
        </div>

      </div>
    </motion.div>
  );
};

export default ServicesPage;
