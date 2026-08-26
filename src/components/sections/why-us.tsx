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
  ChevronRight,
  Plane,
  Sparkles,
  Timer,
  Layers,
  FileSpreadsheet,
  FileX2,
  History,
  FileCheck,
  Move,
  Send,
  ShieldCheck,
  Percent,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import MotionButton from "@/components/ui/motion-button";
import { ProblemsBento } from "@/components/ui/problems-bento";
import { Skiper31 } from "@/components/ui/text-scroll-animation";
import { HeroWithMarquee } from "@/components/ui/cta-with-marquee";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

// ── Marquee data ──────────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  "no more #REF!",
  "no more 1am PDFs",
  "no more retyping prices",
  "no more five tabs open",
  'no more "final_v3_ACTUAL"',
  "no more copy-paste from emails",
  "no more missed markups",
];

// ── BoardingPass helpers ──────────────────────────────────────────────────────
function useCountUp(target: number, duration = 650) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const startVal = fromRef.current;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(startVal + (target - startVal) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = target;
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);
  return value;
}

function Barcode({ seed = 10 }: { seed: number }) {
  const bars = Array.from({ length: 26 }, (_, i) =>
    (i + seed) % 4 === 0 ? 34 : (i + seed) % 3 === 0 ? 24 : 14
  );
  return (
    <div
      style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 34 }}
      aria-hidden="true"
    >
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: i % 3 === 0 ? 2.5 : 1.5,
            height: h,
            background: "#F6F4EE",
            opacity: 0.7,
          }}
        />
      ))}
    </div>
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

const WITHOUT_ITEMS = [
  {
    text: "15 open browser tabs searching routes & hotels",
    icon: <Layers className="size-3.5 text-zinc-400" />,
  },
  {
    text: "Typing day-by-day schedules manually in Word or Canva",
    icon: <FileX2 className="size-3.5 text-zinc-400" />,
  },
  {
    text: "Stressed over Excel math for adult vs. kid markups",
    icon: <Percent className="size-3.5 text-zinc-400" />,
  },
  {
    text: "Unformatted PDFs that make clients bargain over prices",
    icon: <FileSpreadsheet className="size-3.5 text-zinc-400" />,
  },
  {
    text: "2 hours lost every time a client asks to change a single day",
    icon: <History className="size-3.5 text-zinc-400" />,
  },
];

const WITH_ITEMS = [
  {
    text: "Type cities & dates — full route appears in 1 click",
    icon: <Sparkles className="size-3.5 text-zinc-400" />,
  },
  {
    text: "Live drag-and-drop: swap any day or hotel in 5 seconds",
    icon: <Move className="size-3.5 text-zinc-400" />,
  },
  {
    text: "Set markup once — costs auto-split for adult, child, infant",
    icon: <Calculator className="size-3.5 text-zinc-400" />,
  },
  {
    text: "Clean magazine-style proposal with your logo, ready to send",
    icon: <FileCheck className="size-3.5 text-zinc-400" />,
  },
  {
    text: "Send updated quote while the client is still on the phone",
    icon: <Send className="size-3.5 text-zinc-400" />,
  },
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

// ── Boarding Pass Calculator ──────────────────────────────────────────────────
function BoardingPassCalculatorSection({
  oldHours = 5,
  newHours = 0.25,
  defaultMonthly = 10,
}: {
  oldHours?: number;
  newHours?: number;
  defaultMonthly?: number;
}) {
  const [monthly, setMonthly] = useState(defaultMonthly);
  
  // Hours calculation
  const manualHoursMonth = monthly * oldHours;
  const wanderlabsHoursMonth = Math.round(monthly * newHours * 10) / 10;
  const hoursSavedMonth = manualHoursMonth - wanderlabsHoursMonth;
  const yearlyHoursSaved = hoursSavedMonth * 12;
  const workdaysSavedYear = yearlyHoursSaved / 8;

  const animatedYearlyHours = useCountUp(Math.round(yearlyHoursSaved));
  const animatedWorkdays = useCountUp(Math.round(workdaysSavedYear));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        .bp-slider { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 999px; background: rgba(255,255,255,0.08); width: 100%; outline: none; transition: background 0.2s; }
        .bp-slider::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:24px; height:24px; border-radius:999px; background:#E8A33D; cursor:pointer; box-shadow:0 0 0 6px rgba(232,163,61,0.2), 0 4px 12px rgba(0,0,0,0.5); transition: transform 0.15s, box-shadow 0.15s; }
        .bp-slider::-webkit-slider-thumb:hover { transform: scale(1.1); box-shadow:0 0 0 9px rgba(232,163,61,0.28), 0 6px 16px rgba(0,0,0,0.6); }
        .bp-slider::-moz-range-thumb { width:24px; height:24px; border-radius:999px; background:#E8A33D; cursor:pointer; border:none; box-shadow:0 0 0 6px rgba(232,163,61,0.2); }
        .bp-slider:focus-visible { outline: 2px solid #E8A33D; outline-offset: 4px; }
        @media (min-width: 768px) {
          .bp-card { flex-direction: row !important; }
          .bp-main-stub { border-radius: 24px 0 0 24px !important; }
          .bp-side-stub { border-radius: 0 24px 24px 0 !important; border-top: none !important; border-left: 2px dashed rgba(232,163,61,0.25) !important; }
        }
      `}</style>

      <div
        className="bp-card"
        style={{
          display: "flex",
          flexDirection: "column",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.08), 0 32px 80px -20px rgba(0,0,0,0.8)",
          borderRadius: 24,
        }}
      >
        {/* ── Main Pass ── */}
        <div
          className="bp-main-stub"
          style={{
            flex: 1,
            background: "linear-gradient(135deg, rgba(20,27,45,0.85) 0%, rgba(10,14,24,0.95) 100%)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#F0EFE9",
            padding: "36px 40px",
            fontFamily: "'Inter', sans-serif",
            borderRadius: "24px 24px 0 0",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top orange accent line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: "linear-gradient(90deg, #E8A33D 0%, rgba(232,163,61,0.2) 100%)",
            }}
          />

          {/* Header Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 32,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <Plane size={16} className="text-amber-400" />
              </div>
              <div>
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#E8A33D",
                    fontWeight: 700,
                  }}
                >
                  Time Reclaimed Pass
                </span>
                <p style={{ fontSize: 12, color: "#8B95B0", margin: 0 }}>Interactive Savings Calculator</p>
              </div>
            </div>
            
            <div className="hidden sm:inline-flex px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
              Save ~95% of quote time
            </div>
          </div>

          {/* Interactive Slider Input */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-8">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div>
                <label
                  htmlFor="bp-monthly-itineraries"
                  style={{ fontSize: 15, fontWeight: 600, color: "#F0EFE9", display: "block" }}
                >
                  Quotes created per month
                </label>
                <span style={{ fontSize: 12, color: "#8B95B0" }}>Adjust to match your monthly client enquiries</span>
              </div>
              <div className="flex items-baseline gap-1 bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 rounded-xl">
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#E8A33D",
                  }}
                >
                  {monthly}
                </span>
                <span style={{ fontSize: 12, color: "#E8A33D", fontWeight: 600 }}>trips</span>
              </div>
            </div>

            <input
              id="bp-monthly-itineraries"
              type="range"
              min={1}
              max={40}
              step={1}
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="bp-slider"
            />
            
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#5E6680" }}>1 quote/mo</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#5E6680" }}>20 quotes/mo</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#5E6680" }}>40 quotes/mo</span>
            </div>
          </div>

          {/* ── Visual Bar Graph Comparison ── */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-8">
            <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: "#8B95B0", fontWeight: 700, marginBottom: 16 }}>
              Monthly Time Spent Comparison
            </h4>
            
            {/* Manual Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-red-300/90 flex items-center gap-2">
                  <Clock className="size-3.5 text-red-400 shrink-0" />
                  Manual / Word / Excel ({oldHours}h per quote)
                </span>
                <span className="font-mono text-red-300 font-bold">{manualHoursMonth} hrs/mo</span>
              </div>
              <div className="w-full bg-white/5 h-3.5 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div 
                  className="bg-gradient-to-r from-red-500/80 to-red-400 h-full rounded-full transition-all duration-500"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* WanderLabs Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-emerald-300/90 flex items-center gap-2">
                  <Zap className="size-3.5 text-emerald-400 shrink-0" />
                  With WanderLabs (15 mins per quote)
                </span>
                <span className="font-mono text-emerald-300 font-bold">{wanderlabsHoursMonth} hrs/mo</span>
              </div>
              <div className="w-full bg-white/5 h-3.5 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(4, (wanderlabsHoursMonth / manualHoursMonth) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div className="p-5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/15">
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 38,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: "#E8A33D",
                  marginBottom: 6,
                }}
              >
                {animatedYearlyHours.toLocaleString()}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#F0EFE9" }}>
                Hours Saved / Year
              </div>
              <div style={{ fontSize: 11, color: "#8B95B0", marginTop: 2 }}>
                Time redirectable to closing deals
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/15">
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 38,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: "#34D399",
                  marginBottom: 6,
                }}
              >
                {animatedWorkdays.toLocaleString()}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#F0EFE9" }}>
                Full Workdays Saved
              </div>
              <div style={{ fontSize: 11, color: "#8B95B0", marginTop: 2 }}>
                Equivalent to ~{Math.round((workdaysSavedYear / 20) * 10) / 10} extra vacation months
              </div>
            </div>
          </div>
        </div>

        {/* ── Side Stub (Ticket Details) ── */}
        <div
          className="bp-side-stub"
          style={{
            width: 260,
            background: "linear-gradient(180deg, rgba(15,20,35,0.9) 0%, rgba(8,12,20,0.95) 100%)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderTop: "2px dashed rgba(232,163,61,0.25)",
            color: "#F0EFE9",
            padding: "36px 30px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 20,
            fontFamily: "'Inter', sans-serif",
            borderRadius: "0 0 24px 24px",
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#E8A33D",
                marginBottom: 16,
                fontWeight: 700,
              }}
            >
              Flight Summary
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <span style={{ fontSize: 11, color: "#6C7693", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Origin</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#F0EFE9" }} className="flex items-center gap-1.5 mt-0.5">
                  <FileSpreadsheet className="size-3.5 text-zinc-400 shrink-0" />
                  Manual Docs & PDFs
                </span>
              </div>
              <div className="h-px bg-white/5 w-full" />
              <div>
                <span style={{ fontSize: 11, color: "#6C7693", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Destination</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#34D399" }} className="flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="size-3.5 text-emerald-400 shrink-0" />
                  Smart Proposals
                </span>
              </div>
              <div className="h-px bg-white/5 w-full" />
              <div>
                <span style={{ fontSize: 11, color: "#6C7693", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Status</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 mt-1">
                  <ShieldCheck className="size-3 text-emerald-400" />
                  100% Automated
                </span>
              </div>
            </div>
          </div>

          <div>
            <Barcode seed={monthly} />
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.2em",
                color: "#6C7693",
                marginTop: 10,
                textAlign: "center",
              }}
            >
              WL-SAVINGS-{String(monthly).padStart(2, "0")}X
            </div>
          </div>
        </div>
      </div>

      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          color: "#6C7693",
          marginTop: 16,
          textAlign: "center",
        }}
      >
        Calculation baseline: ~{oldHours} hours per manual quote vs. ~15 mins on WanderLabs. Adjust the slider to see your exact personal return on investment.
      </p>
    </>
  );
}

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
          className="flex flex-col sm:flex-row items-center gap-4 mb-16"
        >
          <Link href="/auth/register">
            <MotionButton label="Start Creating Quotes Free" classes="w-72" />
          </Link>
          <Link href="#comparison">
            <button className="h-14 px-7 rounded-full font-semibold text-base border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 text-zinc-200 hover:text-white backdrop-blur-sm transition-all duration-300 flex items-center gap-3 shadow-sm hover:shadow-white/5">
              See How It Works
              <ChevronRight className="w-4 h-4 opacity-70" />
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

      {/* ── MARQUEE ── */}
      <div
        style={{
          borderTop: "1px solid rgba(232,163,61,0.12)",
          borderBottom: "1px solid rgba(232,163,61,0.12)",
          overflow: "hidden",
          background: "#020205",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
          @keyframes wl-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          @media (prefers-reduced-motion: reduce) { .wl-marquee-track { animation: none !important; } }
          @keyframes wl-marquee-rev { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        `}</style>
        <div
          className="wl-marquee-track"
          style={{
            display: "flex",
            width: "max-content",
            animation: "wl-marquee 28s linear infinite",
            padding: "13px 0",
          }}
        >
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, i) => (
            <span
              key={i}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 12,
                color: "#5E6680",
                whiteSpace: "nowrap",
                marginRight: 28,
                display: "flex",
                alignItems: "center",
              }}
            >
              {t}
              <span style={{ color: "#E8A33D", marginLeft: 28 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── BOARDING PASS CALCULATOR ── */}
      <section className="py-24 px-4 md:px-8 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-3">
              Do The Math Yourself
            </p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              See how many hours{" "}
              <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                you get back
              </span>
            </h2>
            <p className="text-zinc-500 text-sm md:text-base mt-4 max-w-xl mx-auto">
              Drag the slider to match your workload. Every number is your own — not ours.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <BoardingPassCalculatorSection />
          </motion.div>
        </div>
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
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              Your day{" "}
              <span className="text-red-400 line-through decoration-red-400/60">without</span>{" "}
              vs.{" "}
              <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">with</span>{" "}
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
            >
              <Card className="rounded-3xl border-0 bg-zinc-900/40 backdrop-blur-xl shadow-none overflow-hidden relative h-full flex flex-col justify-between">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/40 to-transparent" />
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-40 bg-zinc-800/10 rounded-full blur-3xl pointer-events-none" />
                
                <div>
                  <CardHeader className="p-8 pb-5">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                        
                        Without WanderLabs
                      </CardTitle>
                      <span className="text-red-500 text-xs font-bold uppercase tracking-wider">
                        STRESSFUL DAY
                      </span>
                    </div>
                    <CardDescription className="text-zinc-400 text-xs mt-2.5">
                      Common friction points travel agents encounter with manual Word, Canva & Excel.
                    </CardDescription>
                  </CardHeader>

                  <div className="px-8">
                    <Separator className="bg-zinc-800" />
                  </div>

                  <CardContent className="p-8 pt-5 pb-6">
                    <ul className="space-y-3.5">
                      {WITHOUT_ITEMS.map((item, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.07 }}
                          className="flex items-start gap-3 text-sm text-zinc-400 leading-snug"
                        >
                          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                            {item.icon}
                          </span>
                          <span className="text-zinc-300 pt-0.5">{item.text}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </div>

                <CardFooter className="p-8 pt-0 border-t border-zinc-800 flex flex-col items-start bg-zinc-900/20">
                  <div className="pt-4 w-full">
                    <p className="text-zinc-300 text-sm font-semibold flex items-center gap-2">
                      <Timer className="size-4 text-zinc-400 shrink-0" />
                      Time wasted: ~4 hours per quote
                    </p>
                    <p className="text-zinc-400 text-xs mt-1">
                      If you handle 5 clients a week, that&apos;s 20 hours gone — every single week.
                    </p>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>

            {/* WITH */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="rounded-3xl border-0 bg-zinc-900/40 backdrop-blur-xl shadow-none overflow-hidden relative h-full flex flex-col justify-between">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/40 to-transparent" />
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-40 bg-zinc-800/10 rounded-full blur-3xl pointer-events-none" />
                
                <div>
                  <CardHeader className="p-8 pb-5">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                        <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                          With WanderLabs
                        </span>
                      </CardTitle>
                      <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent text-xs font-black uppercase tracking-wider">
                        RECOMMENDED
                      </span>
                    </div>
                    <CardDescription className="text-zinc-400 text-xs mt-2.5">
                      Everything your agency needs to create and close quotes in seconds.
                    </CardDescription>
                  </CardHeader>

                  <div className="px-8">
                    <Separator className="bg-zinc-800" />
                  </div>

                  <CardContent className="p-8 pt-5 pb-6">
                    <ul className="space-y-3.5">
                      {WITH_ITEMS.map((item, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: 10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.07 }}
                          className="flex items-start gap-3 text-sm text-zinc-400 leading-snug"
                        >
                          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                            {item.icon}
                          </span>
                          <span className="text-zinc-300 pt-0.5">{item.text}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </div>

                <CardFooter className="p-8 pt-0 border-t border-zinc-800 flex flex-col items-start bg-zinc-900/20">
                  <div className="pt-4 w-full">
                    <p className="text-zinc-300 text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="size-4 text-zinc-400 shrink-0" />
                      Time saved: 18 hours per week
                    </p>
                    <p className="text-zinc-400 text-xs mt-1">
                      Use that time to call more clients, close more trips, and grow your agency.
                    </p>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 4 PROBLEM CARDS ── */}
      <ProblemsBento />

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

          
        
        </div>
        
        {/* ── SEAMLESS TEXT SCROLL ANIMATION ── */}
        <Skiper31
          customText={"JUST ONE CLOSED CLIENT REPAYS\nWANDERLABS"}
        />
      </section>

    
    

      {/* ── CLOSING CTA WITH MARQUEE ITINERARY FORMATS ── */}
      <HeroWithMarquee />
    </div>
  );
}
