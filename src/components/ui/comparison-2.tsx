import * as React from "react";
import {
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  Timer,
  Sparkles,
  Layers,
  FileSpreadsheet,
  FileX2,
  History,
  FileCheck,
  Move,
  Send,
  Calculator,
  Percent,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const wanderLabsPoints = [
  {
    text: "Type cities & dates — full route appears in 1 click",
    icon: <Sparkles className="size-3.5 text-emerald-400" />,
  },
  {
    text: "Live drag-and-drop: swap any day or hotel in 5 seconds",
    icon: <Move className="size-3.5 text-emerald-400" />,
  },
  {
    text: "Set markup once — costs auto-split for adult, child, infant",
    icon: <Calculator className="size-3.5 text-emerald-400" />,
  },
  {
    text: "Clean magazine-style proposal with your logo, ready to send",
    icon: <FileCheck className="size-3.5 text-emerald-400" />,
  },
  {
    text: "Send updated quote while the client is still on the phone",
    icon: <Send className="size-3.5 text-emerald-400" />,
  },
];

const manualPoints = [
  {
    text: "15 open browser tabs searching routes & hotels",
    icon: <Layers className="size-3.5 text-red-400" />,
  },
  {
    text: "Typing day-by-day schedules manually in Word or Canva",
    icon: <FileX2 className="size-3.5 text-red-400" />,
  },
  {
    text: "Stressed over Excel math for adult vs. kid markups",
    icon: <Percent className="size-3.5 text-red-400" />,
  },
  {
    text: "Unformatted PDFs that make clients bargain over prices",
    icon: <FileSpreadsheet className="size-3.5 text-red-400" />,
  },
  {
    text: "2 hours lost every time a client asks to change a single day",
    icon: <History className="size-3.5 text-red-400" />,
  },
];

function CheckRow({ text, icon }: { text: string; icon: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
        {icon}
      </span>
      <span className="text-sm text-zinc-100 leading-snug pt-0.5">{text}</span>
    </li>
  );
}

function CrossRow({ text, icon }: { text: string; icon: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
        {icon}
      </span>
      <span className="text-sm text-zinc-400 leading-snug pt-0.5">{text}</span>
    </li>
  );
}

export default function ComparisonBlock() {
  return (
    <section className="flex w-full items-center justify-center bg-transparent px-4 py-12 text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-10 text-center">
          <Badge variant="outline" className="mb-4 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 gap-1.5 py-1 px-3">
            <ShieldCheck className="size-3.5" />
            The Reality Check
          </Badge>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Your day{" "}
            <span className="text-red-400 line-through decoration-red-400/60">without</span>{" "}
            vs.{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">with</span>{" "}
            WanderLabs
          </h2>
          <p className="mt-3 text-sm md:text-base text-zinc-400 max-w-2xl mx-auto">
            See the side-by-side difference in daily workflow, time spent, and client experience.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: Without WanderLabs */}
          <Card className="rounded-3xl border border-red-900/30 bg-red-950/10 backdrop-blur-xl shadow-none overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
            <CardHeader className="p-8 pb-5">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-red-500/15 border border-red-500/30 text-red-400">
                    <X className="size-4" />
                  </span>
                  Without WanderLabs
                </CardTitle>
                <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400 font-medium">
                  A stressful day
                </Badge>
              </div>
              <CardDescription className="text-zinc-400 text-xs mt-2">
                Common friction points travel agents encounter with manual Word, Canva & Excel.
              </CardDescription>
            </CardHeader>

            <div className="px-8">
              <Separator className="bg-red-500/10" />
            </div>

            <CardContent className="p-8 pt-5 pb-6">
              <ul className="flex flex-col gap-3.5">
                {manualPoints.map((item) => (
                  <CrossRow key={item.text} text={item.text} icon={item.icon} />
                ))}
              </ul>
            </CardContent>

            <CardFooter className="p-8 pt-0 border-t border-red-500/10 flex flex-col items-start gap-2 bg-red-500/[0.03]">
              <div className="pt-4 w-full">
                <p className="text-red-300 text-sm font-semibold flex items-center gap-2">
                  <Timer className="size-4 text-red-400 shrink-0" />
                  Time wasted: ~4 hours per quote
                </p>
                <p className="text-red-400/70 text-xs mt-1">
                  If you handle 5 clients a week, that&apos;s 20 hours gone — every single week.
                </p>
              </div>
            </CardFooter>
          </Card>

          {/* Card 2: With WanderLabs */}
          <Card className="rounded-3xl border border-emerald-500/30 bg-emerald-950/15 backdrop-blur-xl ring-1 ring-emerald-500/20 shadow-none overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            <CardHeader className="p-8 pb-5">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                    <Check className="size-4" />
                  </span>
                  With WanderLabs
                </CardTitle>
                <Badge className="border-transparent bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400">
                  Recommended
                </Badge>
              </div>
              <CardDescription className="text-zinc-300 text-xs mt-2">
                Everything your agency needs to quote in seconds, without the chaos.
              </CardDescription>
            </CardHeader>

            <div className="px-8">
              <Separator className="bg-emerald-500/20" />
            </div>

            <CardContent className="p-8 pt-5 pb-6">
              <ul className="flex flex-col gap-3.5">
                {wanderLabsPoints.map((item) => (
                  <CheckRow key={item.text} text={item.text} icon={item.icon} />
                ))}
              </ul>
            </CardContent>

            <CardFooter className="p-8 pt-0 border-t border-emerald-500/20 flex flex-col items-start gap-2 bg-emerald-500/[0.04]">
              <div className="pt-4 w-full">
                <p className="text-emerald-300 text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="size-4 text-emerald-400 shrink-0" />
                  Time saved: 18 hours per week
                </p>
                <p className="text-emerald-400/70 text-xs mt-1">
                  Use that time to call more clients, close more trips, and grow your agency.
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
