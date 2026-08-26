"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Calculator,
  RefreshCw,
  Award,
  Check,
  Star,
  ChevronRight,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

/* ── 1. Quote Speed — animated itinerary timeline ── */
const itineraryDays = [
  { day: "Day 1", label: "Delhi → Agra" },
  { day: "Day 2", label: "Taj Mahal + Agra Fort" },
  { day: "Day 3", label: "Agra → Jaipur" },
  { day: "Day 4", label: "City Palace & Amer" },
];

function QuoteSpeedDemo() {
  const [revealed, setRevealed] = useState(0);
  const doneRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !doneRef.current) {
          doneRef.current = true;
          let count = 0;
          const tick = setInterval(() => {
            count++;
            setRevealed(count);
            if (count >= itineraryDays.length) clearInterval(tick);
          }, 600);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col justify-end p-6 gap-2">
      <AnimatePresence>
        {itineraryDays.slice(0, revealed).map((d) => (
          <motion.div
            key={d.day}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{d.day}</p>
              <p className="text-xs font-semibold text-zinc-200 truncate">{d.label}</p>
            </div>
            <Check className="size-3.5 text-emerald-400 shrink-0" />
          </motion.div>
        ))}
      </AnimatePresence>
      {revealed === 0 && (
        <p className="text-zinc-600 text-xs text-center py-4">Building itinerary…</p>
      )}
    </div>
  );
}

/* ── 2. Markup Math ── */
function MarkupDemo() {
  const [markup, setMarkup] = useState(15);
  const base = 42000;
  const adult = Math.round((base * (1 + markup / 100)) / 100) * 100;
  const child = Math.round((adult * 0.7) / 100) * 100;
  const infant = Math.round((adult * 0.15) / 100) * 100;

  return (
    <div className="relative w-full h-full flex flex-col justify-end p-5 gap-3">
      <div className="absolute -top-12 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Your markup</span>
        <span className="text-emerald-400 font-black text-sm">{markup}%</span>
      </div>
      <input
        type="range" min={5} max={40} value={markup}
        onChange={(e) => setMarkup(Number(e.target.value))}
        className="w-full accent-emerald-500 h-1 rounded-full"
      />
      <div className="grid grid-cols-3 gap-2 mt-1">
        {[
          { label: "Adult", value: adult },
          { label: "Child", value: child },
          { label: "Infant", value: infant },
        ].map((r) => (
          <div key={r.label} className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-2.5 text-center">
            <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">{r.label}</p>
            <p className="text-xs font-black text-white">₹{r.value.toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-zinc-600 text-center mt-1">Base ₹{base.toLocaleString("en-IN")} · auto-split instant</p>
    </div>
  );
}

/* ── 3. Live Edit ── */
const editDays = [
  { id: 1, label: "Udaipur city tour", hotel: "Taj Lake Palace" },
  { id: 2, label: "Boat ride + markets", hotel: "Leela Palace" },
  { id: 3, label: "Fly to Jodhpur", hotel: "RAAS Jodhpur" },
];

function LiveEditDemo() {
  const [items, setItems] = useState(editDays);
  const [swapping, setSwapping] = useState(false);
  const doneRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !doneRef.current) {
          doneRef.current = true;
          // Single swap after a short delay so user can see the before state
          const t1 = setTimeout(() => {
            setSwapping(true);
            const t2 = setTimeout(() => {
              setItems((prev) => { const n = [...prev]; [n[0], n[1]] = [n[1], n[0]]; return n; });
              setSwapping(false);
            }, 500);
            return () => clearTimeout(t2);
          }, 1200);
          return () => clearTimeout(t1);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col justify-end p-5 gap-2">
      <div className="absolute top-4 right-5 flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1">
        <RefreshCw className="size-3 text-indigo-400" />
        <span className="text-[10px] font-bold text-indigo-300 tracking-wide">2-click swap</span>
      </div>
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 border transition-colors duration-300",
            swapping && i < 2 ? "border-indigo-500/30 bg-indigo-500/[0.06]" : "border-white/[0.07] bg-white/[0.03]"
          )}
        >
          <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-[11px] font-black text-zinc-500">{i + 1}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-200 truncate">{item.label}</p>
            <p className="text-[10px] text-zinc-500 truncate">{item.hotel}</p>
          </div>
          <ChevronRight className="size-3 text-zinc-700" />
        </motion.div>
      ))}
    </div>
  );
}

/* ── 4. Proposal Quality chart ── */
const proposalChartConfig = {
  wanderlabs: { label: "WanderLabs", color: "#a855f7" },
  manual: { label: "Manual", color: "#3f3f46" },
} satisfies ChartConfig;

const proposalChartData = [
  { month: "Jan", wanderlabs: 92, manual: 38 },
  { month: "Feb", wanderlabs: 94, manual: 42 },
  { month: "Mar", wanderlabs: 96, manual: 35 },
  { month: "Apr", wanderlabs: 95, manual: 40 },
  { month: "May", wanderlabs: 98, manual: 36 },
  { month: "Jun", wanderlabs: 97, manual: 44 },
];

function ProposalQualityDemo() {
  return (
    <div className="w-full h-full flex flex-col justify-end p-5 gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Client trust score</p>
          <p className="text-2xl font-black text-white">4.9 <span className="text-sm font-normal text-zinc-500">/ 5.0</span></p>
        </div>
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map((s) => (
            <Star key={s} className="size-4 fill-violet-400 text-violet-400" />
          ))}
        </div>
      </div>
      <ChartContainer config={proposalChartConfig} className="h-28 w-full">
        <AreaChart data={proposalChartData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="fillWL" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-wanderlabs)" stopOpacity={0.5} />
              <stop offset="70%" stopColor="var(--color-wanderlabs)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillM" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-manual)" stopOpacity={0.4} />
              <stop offset="70%" stopColor="var(--color-manual)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
          <ChartTooltip cursor={false} content={<ChartTooltipContent className="bg-zinc-900 border-zinc-800 text-zinc-300" />} />
          <Area dataKey="manual" type="monotone" fill="url(#fillM)" stroke="var(--color-manual)" strokeWidth={1.5} stackId="b" />
          <Area dataKey="wanderlabs" type="monotone" fill="url(#fillWL)" stroke="var(--color-wanderlabs)" strokeWidth={2} stackId="a" />
        </AreaChart>
      </ChartContainer>
      <div className="flex items-center justify-between text-[10px] text-zinc-500">
        <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-violet-400 inline-block" />WanderLabs</span>
        <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-zinc-500 inline-block" />Manual</span>
      </div>
    </div>
  );
}

export function ProblemsBento() {
  const cards = [
    {
      tag: "Quote Speed Problem", headline: "Be first to reply, every single time.",
      detail: "Clients book whoever replies first. While others type Day 1 in Word, you've already sent a complete trip — hotels, timings, costs, everything.",
      accent: "orange", demo: <QuoteSpeedDemo />,
      colSpan: "md:col-span-3", rowHeight: "min-h-[22rem]", demoHeight: "h-48",
    },
    {
      tag: "Markup Math Headache", headline: "Never lose money from a wrong calculation again.",
      detail: "Set a margin once. WanderLabs auto-splits the exact price for adults, kids, and infants — taxes included — in under a second.",
      accent: "emerald", demo: <MarkupDemo />,
      colSpan: "md:col-span-3", rowHeight: "min-h-[22rem]", demoHeight: "h-56",
    },
    {
      tag: "10 Client Changes Problem", headline: "Edit the itinerary live without starting over.",
      detail: "Client wants an extra day in Udaipur? Swap it in 2 clicks. Pricing and schedule update instantly.",
      accent: "indigo", demo: <LiveEditDemo />,
      colSpan: "md:col-span-3", rowHeight: "min-h-[22rem]", demoHeight: "h-44",
    },
    {
      tag: "Amateur Look Problem", headline: "Look like a 50-person agency, even solo.",
      detail: "Send clean, magazine-style proposals. When your quote looks premium, clients stop bargaining and start asking when to pay.",
      accent: "violet", demo: <ProposalQualityDemo />,
      colSpan: "md:col-span-3", rowHeight: "min-h-[22rem]", demoHeight: "h-52",
    },
  ];

  const accentBorder: Record<string, string> = {
    orange: "hover:border-orange-500/30",
    emerald: "hover:border-emerald-500/30",
    indigo: "hover:border-indigo-500/30",
    violet: "hover:border-violet-500/30",
  };
  const accentGlow: Record<string, string> = {
    orange: "from-orange-500/[0.07]",
    emerald: "from-emerald-500/[0.07]",
    indigo: "from-indigo-500/[0.07]",
    violet: "from-violet-500/[0.07]",
  };
  const accentTopLine: Record<string, string> = {
    orange: "via-orange-500/40",
    emerald: "via-emerald-500/40",
    indigo: "via-indigo-500/40",
    violet: "via-violet-500/40",
  };

  return (
    <section className="py-24 px-4 md:px-8 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="text-center mb-14"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-3">4 Problems WanderLabs Kills</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">
            The things every travel agent{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">loses sleep over</span>
          </h2>
          <p className="text-zinc-500 text-sm md:text-base mt-4 max-w-xl mx-auto">
            Not just promises — each card shows exactly how WanderLabs fixes it live.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.45 }}
              className={cn(
                "group relative rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden",
                "transition-all duration-500 hover:-translate-y-1 flex flex-col",
                card.colSpan, card.rowHeight, accentBorder[card.accent]
              )}
            >
              <div className={cn("absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500", accentTopLine[card.accent])} />
              <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500", accentGlow[card.accent])} />

              <div className="relative z-10 p-7 pb-3 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{card.tag}</span>
                </div>
                <h3 className="text-xl font-bold text-white leading-snug">{card.headline}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed font-light">{card.detail}</p>
              </div>

              <div className={cn("relative flex-1 overflow-hidden", card.demoHeight)}>
                {card.demo}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
