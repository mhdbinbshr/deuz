import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, Play, Shield, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CardGamePageProps {
  onBack: () => void;
}

const CardGamePage: React.FC<CardGamePageProps> = ({ onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const { addToCart } = useCart();

  const titleY = useTransform(scrollYProgress, [0, 0.2], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const cards = [
    { id: 1, name: 'The Void', power: 98, def: 45, img: 'https://images.unsplash.com/photo-1634926878768-2a5b3c426d49?q=80&w=1000&auto=format&fit=crop' },
    { id: 2, name: 'Solar Flare', power: 88, def: 60, img: 'https://images.unsplash.com/photo-1614728853913-1e2221eb8364?q=80&w=1000&auto=format&fit=crop' },
    { id: 3, name: 'Nebula', power: 75, def: 90, img: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#050505] overflow-y-auto overflow-x-hidden"
      ref={containerRef}
    >
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-8 flex justify-between items-center mix-blend-difference">
        <button onClick={onBack} className="flex items-center gap-2 text-white hover:text-gold-500 transition-colors">
          <ArrowLeft size={20} />
          <span className="uppercase tracking-widest text-xs">Exit Game World</span>
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* ... (Existing Hero Content preserved) ... */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519608487953-e999c9cdc748?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-[#050505]" />
        
        <div className="absolute inset-0 pointer-events-none">
           {[...Array(20)].map((_, i) => (
             <motion.div
               key={i}
               className="absolute w-1 h-1 bg-gold-500/50 rounded-full"
               initial={{ x: Math.random() * 100 + "%", y: Math.random() * 100 + "%" }}
               animate={{ y: [0, -100], opacity: [0, 1, 0] }}
               transition={{ duration: Math.random() * 5 + 5, repeat: Infinity, ease: "linear" }}
             />
           ))}
        </div>

        <motion.div style={{ y: titleY, opacity }} className="relative z-10 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
            className="mb-4 inline-block border border-gold-500/30 px-4 py-1 rounded-full bg-gold-500/5 backdrop-blur-md"
          >
            <span className="text-gold-500 text-[10px] uppercase tracking-[0.3em]">Strategy Card Game</span>
          </motion.div>
          <h1 className="text-6xl md:text-9xl font-serif text-white tracking-widest mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">
            AETHER
          </h1>
          <p className="text-white/60 max-w-lg mx-auto font-light leading-relaxed">
            Enter a dimension where light is currency and shadow is your weapon. Collect, trade, and conquer.
          </p>
        </motion.div>

        {/* 3D Card Display */}
        <div className="absolute bottom-[-10vh] md:bottom-[-20vh] w-full flex justify-center gap-8 md:gap-16 perspective-[1000px]">
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ y: 200, rotateX: 20 }}
              animate={{ y: 0, rotateX: 10 }}
              transition={{ delay: 0.5 + i * 0.2, duration: 1, type: "spring" }}
              whileHover={{ y: -50, rotateX: 0, scale: 1.1, zIndex: 10 }}
              className="relative w-48 h-72 md:w-64 md:h-96 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group bg-black"
            >
              <img src={card.img} alt={card.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
              <div className="absolute bottom-0 left-0 w-full p-6">
                 <h3 className="text-xl font-serif text-white mb-2">{card.name}</h3>
                 <div className="flex gap-4 text-xs font-mono text-gold-500">
                    <span className="flex items-center gap-1"><Zap size={10} /> {card.power}</span>
                    <span className="flex items-center gap-1"><Shield size={10} /> {card.def}</span>
                 </div>
              </div>
              <div className="absolute inset-0 border-2 border-gold-500/0 group-hover:border-gold-500/50 transition-all duration-300 rounded-xl pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Rules Section (Simplified for brevity in update, keep existing content in real app) */}
      <section className="py-32 px-6 bg-[#080808] relative z-20">
         {/* ... (Existing Rules UI) ... */}
         <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-gold-500 text-sm font-bold tracking-[0.3em] uppercase mb-8">How to Play</h2>
            <h3 className="text-4xl font-serif text-white mb-8 leading-tight">Master the <br/> Elements</h3>
            <div className="space-y-8">
              {[
                { title: "Build Your Deck", desc: "Select 30 cards from your collection to form your arsenal." },
                { title: "Gather Energy", desc: "Use light sources to power your attacks and defenses." },
                { title: "Strike Shadows", desc: "Deplete your opponent's light to banish them to the void." }
              ].map((rule, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="flex gap-6 border-b border-white/5 pb-6 last:border-0"
                >
                  <span className="text-gold-500 font-serif text-2xl">0{i+1}</span>
                  <div>
                    <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-2">{rule.title}</h4>
                    <p className="text-white/50 text-sm leading-relaxed">{rule.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="relative h-[500px] border border-white/10 rounded-sm overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-tr from-gold-900/20 to-transparent mix-blend-overlay z-10" />
             <img src="https://images.unsplash.com/photo-1642430330689-53e304f5674c?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-[2s]" alt="Game Table" />
             <div className="absolute inset-0 flex items-center justify-center z-20">
                <button className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-gold-500 hover:border-gold-500 hover:text-black transition-all duration-300">
                   <Play size={24} fill="currentColor" className="ml-1" />
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* Buy Section */}
      <section className="py-32 bg-black text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold-600/10 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
           <h2 className="text-5xl font-serif text-white mb-16">Start Your Journey</h2>
           
           <div className="flex flex-wrap justify-center gap-8">
              {/* Product Card 1 */}
              <div className="w-80 bg-[#0A0A0A] border border-white/10 p-8 group hover:border-gold-500/30 transition-colors duration-500">
                 <div className="w-full h-48 bg-black mb-8 relative overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover opacity-80" alt="Starter" />
                    <div className="absolute top-2 right-2 bg-gold-500 text-black text-[10px] font-bold px-2 py-1 uppercase tracking-widest">Best Value</div>
                 </div>
                 <h3 className="text-2xl font-serif text-white mb-2">Starter Deck</h3>
                 <p className="text-white/40 text-xs mb-6 h-10">Essential cards to begin your adventure. Contains 60 cards.</p>
                 <div className="text-3xl text-gold-500 font-serif mb-8">₹29.99</div>
                 <button 
                   onClick={() => addToCart({
                     id: 'starter-deck',
                     title: 'Aether Starter Deck',
                     price: 29.99,
                     image: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=1000&auto=format&fit=crop',
                     category: 'card'
                   })}
                   className="w-full py-4 bg-white/5 border border-white/20 text-white hover:bg-gold-500 hover:border-gold-500 hover:text-black transition-all duration-300 uppercase tracking-widest text-xs font-bold"
                 >
                   Add to Cart
                 </button>
              </div>

              {/* Product Card 2 */}
              <div className="w-80 bg-[#0A0A0A] border border-white/10 p-8 group hover:border-purple-500/30 transition-colors duration-500">
                 <div className="w-full h-48 bg-black mb-8 relative overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1607968565043-36af90dde238?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover opacity-80" alt="Booster" />
                 </div>
                 <h3 className="text-2xl font-serif text-white mb-2">Void Booster</h3>
                 <p className="text-white/40 text-xs mb-6 h-10">Expand your strategy with 15 random premium cards.</p>
                 <div className="text-3xl text-purple-400 font-serif mb-8">₹12.99</div>
                 <button 
                   onClick={() => addToCart({
                     id: 'void-booster',
                     title: 'Void Booster Pack',
                     price: 12.99,
                     image: 'https://images.unsplash.com/photo-1607968565043-36af90dde238?q=80&w=1000&auto=format&fit=crop',
                     category: 'card'
                   })}
                   className="w-full py-4 bg-white/5 border border-white/20 text-white hover:bg-purple-500 hover:border-purple-500 hover:text-black transition-all duration-300 uppercase tracking-widest text-xs font-bold"
                 >
                   Add to Cart
                 </button>
              </div>
           </div>
        </div>
      </section>

    </motion.div>
  );
};

export default CardGamePage;