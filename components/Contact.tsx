import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRequestAccess = () => {
    const { name, email, message } = formData;
    const subject = encodeURIComponent(`Access Request: ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
    
    // Using the concierge email address
    const targetEmail = "deuzandco@gmail.com"; 
    
    window.open(`mailto:${targetEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <section id="contact" className="relative py-32 px-6 md:px-12 bg-transparent overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-gold-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-serif text-white mb-6 tracking-widest uppercase"
        >
          BY APPOINTMENT ONLY.
        </motion.h2>
        
        <motion.p
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           transition={{ delay: 0.3, duration: 0.8 }}
           className="text-gray-400 mb-16 text-xs uppercase tracking-[0.3em]"
        >
          Global distribution. Limited release.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="max-w-md mx-auto space-y-8 text-left"
          onSubmit={(e) => { e.preventDefault(); handleRequestAccess(); }}
        >
          <div className="group relative">
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-transparent border-b border-white/20 py-4 text-white focus:outline-none focus:border-gold-500 transition-colors duration-300 peer"
              placeholder=" "
              required
            />
            <label 
              htmlFor="name" 
              className="absolute left-0 top-4 text-white/40 text-sm transition-all duration-300 pointer-events-none -z-10 peer-focus:-top-4 peer-focus:text-gold-500 peer-focus:text-xs peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-xs"
            >
              Name
            </label>
          </div>

          <div className="group relative">
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-transparent border-b border-white/20 py-4 text-white focus:outline-none focus:border-gold-500 transition-colors duration-300 peer"
              placeholder=" "
              required
            />
            <label 
              htmlFor="email" 
              className="absolute left-0 top-4 text-white/40 text-sm transition-all duration-300 pointer-events-none -z-10 peer-focus:-top-4 peer-focus:text-gold-500 peer-focus:text-xs peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-xs"
            >
              Email
            </label>
          </div>

          <div className="group relative">
            <textarea
              id="message"
              value={formData.message}
              onChange={handleChange}
              rows={3}
              className="w-full bg-transparent border-b border-white/20 py-4 text-white focus:outline-none focus:border-gold-500 transition-colors duration-300 peer resize-none"
              placeholder=" "
              required
            />
            <label 
              htmlFor="message" 
              className="absolute left-0 top-4 text-white/40 text-sm transition-all duration-300 pointer-events-none -z-10 peer-focus:-top-4 peer-focus:text-gold-500 peer-focus:text-xs peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-xs"
            >
              Message
            </label>
          </div>

          <div className="pt-8 text-center">
            <button type="submit" className="group relative inline-flex items-center gap-4 px-8 py-4 bg-white/5 border border-white/10 hover:bg-gold-500 hover:border-gold-500 hover:text-black transition-all duration-500 rounded-full overflow-hidden">
              <span className="relative z-10 text-xs uppercase tracking-[0.2em] font-semibold">REQUEST ACCESS</span>
              <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gold-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
            </button>
          </div>
        </motion.form>
      </div>
    </section>
  );
};

export default Contact;