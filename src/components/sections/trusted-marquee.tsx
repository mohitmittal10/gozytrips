"use client";

import { motion } from "framer-motion";

const PARTNERS = [
  "AMAN",
  "FOUR SEASONS",
  "VIRTUOSO",
  "BELMOND",
  "ROSEWOOD",
  "RELAIS & CHÂTEAUX",
  "THE LEADING HOTELS",
  "SMALL LUXURY HOTELS",
];

export default function TrustedMarquee() {
  return (
    <section className="w-full bg-[#020205] py-12 border-y border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] text-center">
          Trusted by Travel Agents at
        </p>
      </div>
      
      <div className="relative flex overflow-x-hidden">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ 
            duration: 30, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="flex whitespace-nowrap gap-12 items-center"
        >
          {[...PARTNERS, ...PARTNERS].map((partner, idx) => (
            <span 
              key={idx} 
              className="text-xl md:text-2xl font-black text-white/20 hover:text-white/40 transition-colors tracking-tighter"
            >
              {partner}
            </span>
          ))}
        </motion.div>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#020205] to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#020205] to-transparent z-10" />
      </div>
    </section>
  );
}
