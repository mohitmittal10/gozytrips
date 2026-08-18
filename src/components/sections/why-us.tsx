"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Clock,
  X,
  Check,
  Zap,
  Calculator,
  RefreshCw,
  Award,
  TrendingUp,
  Star,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Animated Counter ──────────────────────────────────────────────────────────
function Counter({
  to,
  suffix = "",
  prefix = "",
  duration = 2,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * to));
      if (progress < 1) requestAnimationFrame(step);
      else setValue(to);
    };
    requestAnimationFrame(step);
  }, [inView, to, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}

const PainStats = [
  {
    icon: <Clock className="w-4 h-4 text-orange-400" />,
    stat: "From 4 hours",
    label: "down to 90 seconds per quote",
  },
  {
    icon: <Calculator className="w-4 h-4 text-emerald-400" />,
    stat: "Zero",
    label: "calculation mistakes on markups",
  },
  {
    icon: <Zap className="w-4 h-4 text-indigo-400" />,
    stat: "Clients",
    label: "can view & approve on their phones",
  },
];

const WITHOUT = [
  "15 open browser tabs searching the best routes",
  "Typing day-by-day schedules by hand in Word or Canva",
  "Stressed over Excel math for adult vs. kid markups",
  "Ugly PDFs that make clients bargain over every rupee",
  "2 hours lost every time a client says 'change Day 3'",
];

const WITH = [
  "Type cities & dates — full route appears in 1 click",
  "Live drag-and-drop: swap any day or hotel in 5 seconds",
  "Set markup once — costs auto-split for adult, child, infant",
  "Clean magazine-style proposal with your logo, ready to send",
  "Send updated quote while the client is still on the phone",
];

const PROBLEMS = [
  {
    icon: <Zap className="w-6 h-6 text-orange-400" />,
    tag: "Quote Speed Problem",
    headline: "Be the first agency to reply, every single time.",
    detail:
      "Clients book with whoever sends a solid plan first. While other agents are still typing Day 1, you've already sent a complete trip — hotels, timings, costs, everything.",
    glow: "from-orange-500/10 to-transparent",
    border: "hover:border-orange-500/30",
  },
  {
    icon: <Calculator className="w-6 h-6 text-emerald-400" />,
    tag: "Markup Math Headache",
    headline: "Never lose money from a wrong calculation again.",
    detail:
      "Add your cab, hotel, and flight costs. Set a margin like 15%. WanderLabs splits the exact price for adults, kids, and infants — taxes included — in under a second.",
    glow: "from-emerald-500/10 to-transparent",
    border: "hover:border-emerald-500/30",
  },
  {
    icon: <RefreshCw className="w-6 h-6 text-indigo-400" />,
    tag: "10 Client Changes Problem",
    headline: "Edit the itinerary live without starting from scratch.",
    detail:
      "Client wants an extra day in Bali or a different hotel? Swap it in 2 clicks. The pricing and schedule update instantly — no recalculating, no retyping.",
    glow: "from-indigo-500/10 to-transparent",
    border: "hover:border-indigo-500/30",
  },
  {
    icon: <Award className="w-6 h-6 text-violet-400" />,
    tag: "Amateur Look Problem",
    headline: "Look like a 50-person agency, even if you work alone.",
    detail:
      "Send clean, professional trip proposals that build trust on sight. When your quote looks premium, clients stop asking for discounts and start asking when to pay.",
    glow: "from-violet-500/10 to-transparent",
    border: "hover:border-violet-500/30",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I used to work until 11 PM typing itineraries. Now I make 3 quotes over my morning tea and close them before lunch.",
    name: "Priya Sharma",
    role: "Solo Travel Agent, Jaipur",
    rating: 5,
  },
  {
    quote:
      "My clients literally told me our proposal looked so good they didn't bother checking other agents. That's never happened before.",
    name: "Rahul Nair",
    role: "Boutique Agency Owner, Kochi",
    rating: 5,
  },
  {
    quote:
      "I was spending 3 hours just on the pricing sheet. WanderLabs does it in 10 seconds. I've already gotten two extra bookings this month.",
    name: "Sneha Patel",
    role: "Tour Operator, Ahmedabad",
    rating: 5,
  },
];

export default function WhyUsPage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#020205] text-white overflow-x-hidden">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none select-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-orange-600/[0.04] rounded-full blur-[160px]" />
        <div className="absolute top-[60%] right-[-100px] w-[600px] h-[600px] bg-indigo-600/[0.04] rounded-full blur-[160px]" />
        <div className="absolute top-[35%] left-[-100px] w-[500px] h-[500px] bg-violet-600/[0.03] rounded-full blur-[140px]" />
      </div>

      {/* ── HERO ── */}
      <section className="relative pt-28 pb-24 px-4 md:px-8 flex flex-col items-center text-center max-w-5xl mx-auto">
        

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight mb-6"
        >
          Stop Losing{" "}
          <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            4 Hours
          </span>{" "}
          on a Quote <br className="hidden md:block" />
          Just to Get{" "}
          <span className="text-zinc-500 italic font-medium">ghosted.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-zinc-400 text-base md:text-xl leading-relaxed max-w-3xl mb-10"
        >
          Built by people who know how hard travel agency life is

        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 mb-16"
        >
          <Link href="/auth/register">
            <button className="group relative px-8 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-xl shadow-orange-500/30 transition-all duration-300 hover:shadow-orange-500/50 hover:scale-105 flex items-center gap-2">
              Start Creating Quotes Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <Link href="#comparison">
            <button className="px-8 py-4 rounded-2xl font-semibold text-base border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-zinc-300 hover:text-white backdrop-blur transition-all duration-300 flex items-center gap-2">
              See How It Works
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </motion.div>

        {/* Pain stat pills */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl"
        >
          {PainStats.map((stat, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur text-left"
            >
              <div className="mt-0.5 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                {stat.icon}
              </div>
              <div>
                <p className="text-white font-bold text-sm">{stat.stat}</p>
                <p className="text-zinc-500 text-xs leading-snug mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── COMPARISON ── */}
      <section id="comparison" className="py-24 px-4 md:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-3">The Reality Check</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Your day{" "}
              <span className="text-red-400 line-through decoration-red-400/60">without</span>{" "}
              vs.{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">with</span>{" "}
              WanderLabs
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* WITHOUT */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative rounded-3xl border border-red-900/30 bg-red-950/10 backdrop-blur-xl p-8 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-40 bg-red-600/10 rounded-full blur-3xl" />
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                  <X className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-red-400/70">Without WanderLabs</p>
                  <p className="text-white font-bold text-lg">A stressful day</p>
                </div>
              </div>
              <ul className="space-y-4">
                {WITHOUT.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3 text-sm text-zinc-400 leading-snug"
                  >
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                      <X className="w-3 h-3 text-red-400" />
                    </span>
                    {item}
                  </motion.li>
                ))}
              </ul>
              <div className="mt-8 p-4 rounded-2xl bg-red-500/[0.06] border border-red-500/10">
                <p className="text-red-300 text-sm font-semibold">
                  ⏱ Time wasted: ~4 hours per quote
                </p>
                <p className="text-red-400/70 text-xs mt-1">
                  If you handle 5 clients a week, that&apos;s 20 hours gone — every single week.
                </p>
              </div>
            </motion.div>

            {/* WITH */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative rounded-3xl border border-emerald-900/30 bg-emerald-950/10 backdrop-blur-xl p-8 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-40 bg-emerald-600/10 rounded-full blur-3xl" />
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-400/70">With WanderLabs</p>
                  <p className="text-white font-bold text-lg">An effortless day</p>
                </div>
              </div>
              <ul className="space-y-4">
                {WITH.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3 text-sm text-zinc-300 leading-snug"
                  >
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </span>
                    {item}
                  </motion.li>
                ))}
              </ul>
              <div className="mt-8 p-4 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/10">
                <p className="text-emerald-300 text-sm font-semibold">
                  ✅ Time saved: 18 hours per week
                </p>
                <p className="text-emerald-400/70 text-xs mt-1">
                  Use that time to call more clients, close more trips, make more money.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 4 PROBLEM CARDS ── */}
      <section className="py-24 px-4 md:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-3">
              4 Problems WanderLabs Kills
            </p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              The things every travel agent{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                loses sleep over
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PROBLEMS.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "group relative p-8 rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden transition-all duration-500 hover:-translate-y-1",
                  p.border
                )}
              >
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                    p.glow
                  )}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
                      {p.icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      {p.tag}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3 leading-snug">
                    {p.headline}
                  </h3>
                  <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-light">
                    {p.detail}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROI MATH ── */}
      <section className="py-24 px-4 md:px-8 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-3">
              The Numbers Don&apos;t Lie
            </p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              What agents actually see{" "}
              <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                after switching
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { value: 85, suffix: "%", label: "Less time spent building a single quote", color: "text-orange-400" },
              { value: 3, suffix: "x", label: "More proposals sent per week", color: "text-indigo-400" },
              { value: 4, suffix: ".9 / 5", label: "Client satisfaction with proposals", color: "text-emerald-400" },
              { value: 0, suffix: " mistakes", label: "Pricing errors since switching", color: "text-violet-400" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl text-center"
              >
                <p className={cn("text-4xl md:text-5xl font-black mb-2", item.color)}>
                  <Counter to={item.value} suffix={item.suffix} duration={1.8} />
                </p>
                <p className="text-zinc-500 text-xs leading-snug">{item.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Big callout */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-xl p-8 md:p-12 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.05] to-indigo-500/[0.05]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />
            <div className="relative z-10 space-y-4">
              <p className="text-zinc-400 text-base md:text-lg">
                If you quote just 5 clients a week, you waste{" "}
                <span className="text-red-400 font-bold">15–20 hours</span>{" "}
                typing itineraries.
              </p>
              <p className="text-zinc-400 text-base md:text-lg">
                With WanderLabs, you get{" "}
                <span className="text-emerald-400 font-bold">18 hours back every week</span>{" "}
                to talk to new clients and close more trips.
              </p>
              <div className="pt-4 border-t border-white/[0.06]">
                <p className="text-2xl md:text-3xl font-black text-white leading-snug">
                  Closing just{" "}
                  <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                    ONE extra booking
                  </span>{" "}
                  with faster quotes
                  <br className="hidden md:block" />
                  pays for an entire year of WanderLabs.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-4 md:px-8 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-3">Real Agents. Real Results.</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              What agents say after{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                their first week
              </span>
            </h2>
          </motion.div>

          <div className="relative min-h-[240px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4 }}
                className="relative p-8 md:p-12 rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl text-center"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                <div className="flex items-center justify-center gap-1 mb-6">
                  {Array.from({ length: TESTIMONIALS[activeTestimonial].rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-xl md:text-2xl text-white font-medium leading-relaxed mb-8">
                  &ldquo;{TESTIMONIALS[activeTestimonial].quote}&rdquo;
                </blockquote>
                <p className="text-white font-bold">{TESTIMONIALS[activeTestimonial].name}</p>
                <p className="text-zinc-500 text-sm">{TESTIMONIALS[activeTestimonial].role}</p>
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center justify-center gap-2 mt-6">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === activeTestimonial ? "w-8 bg-indigo-400" : "w-1.5 bg-white/20 hover:bg-white/40"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setActiveTestimonial(i)}
                className={cn(
                  "p-5 rounded-2xl border cursor-pointer transition-all duration-300",
                  i === activeTestimonial
                    ? "border-indigo-500/40 bg-indigo-500/[0.06]"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/20"
                )}
              >
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed mb-4 line-clamp-3">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="text-white text-xs font-bold">{t.name}</p>
                <p className="text-zinc-600 text-xs">{t.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ── */}
      <section className="py-24 px-4 md:px-8 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-[2rem] overflow-hidden border border-white/[0.08] p-10 md:p-16 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 via-transparent to-indigo-600/10" />
            <div className="absolute inset-0 bg-[#020205]/60 backdrop-blur-xl" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10">
                <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[11px] font-black uppercase tracking-widest text-orange-400">
                  Your competitors are already replying faster
                </span>
              </div>

              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                Time to upgrade your agency.
              </h2>

              <p className="text-zinc-400 text-base md:text-lg max-w-xl mx-auto">
                Try WanderLabs for your very next client enquiry. It takes 60 seconds to set up
                and needs zero training. Just type, generate, and send.
              </p>

              <div className="pt-2">
                <Link href="/auth/register">
                  <button className="group inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-2xl shadow-orange-500/40 transition-all duration-300 hover:shadow-orange-500/60 hover:scale-105">
                    Create Your First Free Itinerary
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  Your client data is 100% private
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  Cancel anytime
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
