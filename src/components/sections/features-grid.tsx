"use client";

import { motion } from "framer-motion";
import { 
  Cpu, 
  Fingerprint, 
  BoxSelect, 
  Coins, 
  Workflow, 
  FileText, 
  LockKeyhole,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "AI Generation",
    description: "Stop spending hours on research. Describe the dream trip — we'll build the full itinerary, day by day, optimized to minimize travel fatigue.",
    icon: <Cpu className="w-6 h-6 text-indigo-400" />,
    className: "col-span-12 md:col-span-6 lg:col-span-4",
  },
  {
    title: "Preference-Driven",
    description: "Every traveler is different. Budget backpacker or luxury seeker — your itinerary adapts to them, not the other way around.",
    icon: <Fingerprint className="w-6 h-6 text-indigo-400" />,
    className: "col-span-12 md:col-span-6 lg:col-span-4",
  },
  {
    title: "Editing Tools",
    description: "AI writes the first draft. You make it perfect. Drag, reorder, delete — full creative control, zero friction.",
    icon: <BoxSelect className="w-6 h-6 text-indigo-400" />,
    className: "col-span-12 md:col-span-6 lg:col-span-4",
  },
  {
    title: "Pricing & Markup Engine",
    description: "Quote adults, kids, and infants instantly. Set your markup, add your service fee, and send a professional quote in seconds.",
    icon: <Coins className="w-6 h-6 text-indigo-400" />,
    className: "col-span-12 md:col-span-6 lg:col-span-6",
  },
  {
    title: "Status Tracking",
    description: "From first idea to confirmed booking — track every quote through its lifecycle. Never lose a lead to disorganized follow-ups again.",
    icon: <Workflow className="w-6 h-6 text-indigo-400" />,
    className: "col-span-12 md:col-span-6 lg:col-span-6",
  },
  {
    title: "PDF Export",
    description: "Send proposals so beautiful, clients say yes before reading the details. Four premium templates, your brand, one click. Professional, polished, and persuasive.",
    icon: <FileText className="w-6 h-6 text-indigo-400" />,
    className: "col-span-12 md:col-span-12 lg:col-span-8",
  },
  {
    title: "Security",
    description: "Your client data stays yours. Always. Enterprise-grade security with row-level privacy built in from day one.",
    icon: <LockKeyhole className="w-6 h-6 text-indigo-400" />,
    className: "col-span-12 md:col-span-12 lg:col-span-4",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function FeaturesGrid() {
  return (
    <section className="py-24 bg-black relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4"
          >
            Elevate Your <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-500 bg-clip-text text-transparent">Travel Business</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 max-w-2xl mx-auto text-sm md:text-base font-light"
          >
            Sophisticated tools designed for the modern travel architect. 
            From synthesis to export, every detail is engineered for precision.
          </motion.p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-12 gap-4"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className={cn(
                "group relative p-8 rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden hover:border-indigo-500/30",
                feature.className
              )}
            >
              {/* Feature Background Glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-indigo-500/[0.02]" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-white/[0.08] transition-colors duration-500 bg-white/[0.03] group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20">
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-light group-hover:text-zinc-300 transition-colors duration-300 flex-grow">
                  {feature.description}
                </p>

                <div className="mt-6 flex items-center text-xs font-bold uppercase tracking-widest text-indigo-400/0 group-hover:text-indigo-400 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0">
                  Learn More <ArrowRight className="ml-2 w-3 h-3" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

