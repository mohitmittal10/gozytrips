"use client";

import { motion } from "framer-motion";
import { 
  Sparkles, 
  Users, 
  MousePointer2, 
  BarChart3, 
  Activity, 
  FileDown, 
  ShieldCheck,
  Zap,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "AI Generation",
    description: "Stop spending hours on research. Describe the dream trip — we'll build the full itinerary, day by day, optimized to minimize travel fatigue.",
    icon: <Sparkles className="w-6 h-6 text-purple-400" />,
    className: "col-span-12 md:col-span-6 lg:col-span-4",
    bg: "bg-purple-500/5",
    border: "border-purple-500/20",
    glow: "group-hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)]"
  },
  {
    title: "Preference-Driven",
    description: "Every traveler is different. Budget backpacker or luxury seeker — your itinerary adapts to them, not the other way around.",
    icon: <Users className="w-6 h-6 text-blue-400" />,
    className: "col-span-12 md:col-span-6 lg:col-span-4",
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    glow: "group-hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]"
  },
  {
    title: "Editing Tools",
    description: "AI writes the first draft. You make it perfect. Drag, reorder, delete — full creative control, zero friction.",
    icon: <MousePointer2 className="w-6 h-6 text-pink-400" />,
    className: "col-span-12 md:col-span-6 lg:col-span-4",
    bg: "bg-pink-500/5",
    border: "border-pink-500/20",
    glow: "group-hover:shadow-[0_0_40px_-10px_rgba(236,72,153,0.3)]"
  },
  {
    title: "Pricing & Markup Engine",
    description: "Quote adults, kids, and infants instantly. Set your markup, add your service fee, and send a professional quote in seconds.",
    icon: <BarChart3 className="w-6 h-6 text-emerald-400" />,
    className: "col-span-12 md:col-span-6 lg:col-span-6",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    glow: "group-hover:shadow-[0_0_50px_-15px_rgba(16,185,129,0.3)]"
  },
  {
    title: "Status Tracking",
    description: "From first idea to confirmed booking — track every quote through its lifecycle. Never lose a lead to disorganized follow-ups again.",
    icon: <Activity className="w-6 h-6 text-orange-400" />,
    className: "col-span-12 md:col-span-6 lg:col-span-6",
    bg: "bg-orange-500/5",
    border: "border-orange-500/20",
    glow: "group-hover:shadow-[0_0_50px_-15px_rgba(249,115,22,0.3)]"
  },
  {
    title: "PDF Export",
    description: "Send proposals so beautiful, clients say yes before reading the details. Four premium templates, your brand, one click. Professional, polished, and persuasive.",
    icon: <FileDown className="w-6 h-6 text-indigo-400" />,
    className: "col-span-12 md:col-span-12 lg:col-span-8",
    bg: "bg-indigo-500/5",
    border: "border-indigo-500/20",
    glow: "group-hover:shadow-[0_0_60px_-20px_rgba(99,102,241,0.3)]"
  },
  {
    title: "Security",
    description: "Your client data stays yours. Always. Enterprise-grade security with row-level privacy built in from day one.",
    icon: <ShieldCheck className="w-6 h-6 text-cyan-400" />,
    className: "col-span-12 md:col-span-12 lg:col-span-4",
    bg: "bg-cyan-500/5",
    border: "border-cyan-500/20",
    glow: "group-hover:shadow-[0_0_40px_-10px_rgba(6,182,212,0.3)]"
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
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4"
          >
            Elevate Your <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">Travel Business</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 max-w-2xl mx-auto text-sm md:text-base font-light"
          >
            Powerful tools designed to streamline your workflow and wow your clients.
            From AI-driven planning to professional exports, we've got you covered.
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
                "group relative p-8 rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden",
                feature.className,
                feature.glow
              )}
            >
              {/* Feature Background Glow */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                feature.bg
              )} />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border transition-colors duration-500",
                  feature.border,
                  "bg-white/[0.03] group-hover:bg-white/[0.08]"
                )}>
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-light group-hover:text-zinc-300 transition-colors duration-300 flex-grow">
                  {feature.description}
                </p>

                <div className="mt-6 flex items-center text-xs font-bold uppercase tracking-widest text-purple-400/0 group-hover:text-purple-400 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0">
                  Learn More <ArrowRight className="ml-2 w-3 h-3" />
                </div>
              </div>

              {/* Subtle Corner Accent */}
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <Zap className="w-4 h-4 text-white/10" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

