"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { ReactNode, useState } from "react";
import MotionButton from "@/components/ui/motion-button";
import { Check } from "lucide-react";

interface MarqueeProps {
  children: ReactNode;
  pauseOnHover?: boolean;
  reverse?: boolean;
  className?: string;
  speed?: number;
}

export function Marquee({
  children,
  pauseOnHover = false,
  reverse = false,
  className,
  speed = 35,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        "group flex overflow-hidden [--gap:1rem] [gap:var(--gap)]",
        className
      )}
      style={
        {
          "--duration": `${speed}s`,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "flex min-w-full shrink-0 items-center justify-around gap-[var(--gap)] animate-marquee",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          "flex min-w-full shrink-0 items-center justify-around gap-[var(--gap)] animate-marquee",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
        aria-hidden="true"
      >
        {children}
      </div>
    </div>
  );
}

// Itinerary format images from home page & public directory
const itineraryImagesRow1 = [
  { src: "/dark.png", alt: "Dark Theme Itinerary" },
  { src: "/editorial.png", alt: "Editorial Layout Itinerary" },
  { src: "/minimalist.png", alt: "Minimalist Style Itinerary" },
  { src: "/image/home/1.0.1.jpg", alt: "Custom Travel Itinerary" },
  { src: "/image/home/0.0.1.jpg", alt: "Day Timeline View" },
];

const itineraryImagesRow2 = [
  { src: "/image/home/1.0.2.jpg", alt: "Flight & Hotel Breakdown" },
  { src: "/image/home/2.0.1.jpg", alt: "Price Breakdown Table" },
  { src: "/image/home/screen0.3.jpg", alt: "Interactive Web Proposal" },
  { src: "/image/home/screen2.2.png", alt: "Client Proposal View" },
  { src: "/dark.png", alt: "Dark PDF Format" },
];

export function ScrambleButton({
  label = "Create Your First Free Itinerary",
  href = "/auth/register",
}: {
  label?: string;
  href?: string;
}) {
  const [displayText, setDisplayText] = useState(label);
  const [isScrambling, setIsScrambling] = useState(false);
  const originalText = label;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

  const scramble = () => {
    if (isScrambling) return;
    setIsScrambling(true);

    let iteration = 0;
    const maxIterations = originalText.length;

    const interval = setInterval(() => {
      setDisplayText(() =>
        originalText
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return originalText[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iteration >= maxIterations) {
        clearInterval(interval);
        setIsScrambling(false);
      }

      iteration += 1 / 3;
    }, 30);
  };

  return (
    <Link href={href}>
      <button
        onMouseEnter={scramble}
        className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full font-bold text-base shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        {displayText}
      </button>
    </Link>
  );
}

export function HeroWithMarquee() {
  return (
    <div className="w-full bg-[#020205] text-white py-16 lg:py-24 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-400">
              Upgrade Your Travel Agency
            </p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Time to upgrade your agency.{" "}
              <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                Create quotes 10x faster.
              </span>
            </h2>
            <p className="text-zinc-400 text-base md:text-lg max-w-xl">
              Your competitors are already replying faster with AI-powered, beautiful proposal formats that close clients instantly.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/auth/register">
                <MotionButton label="Create Your First Free Itinerary" classes="w-auto sm:w-[22rem]" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                Your client data is 100% private
              </span>
            </div>
          </div>

          {/* Right Marquee Grid showing Mixed Itinerary Photos */}
          <div className="space-y-4 overflow-hidden relative rounded-3xl p-2 bg-transparent">
            <Marquee speed={30} reverse className="[--gap:1rem]">
              {itineraryImagesRow1.map((item, idx) => (
                <div
                  key={idx}
                  className="relative w-52 h-72 sm:w-60 sm:h-80 rounded-2xl overflow-hidden flex-shrink-0 group transition-transform duration-300 hover:scale-[1.03]"
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover object-top"
                  />
                </div>
              ))}
            </Marquee>

            <Marquee speed={30} className="[--gap:1rem]">
              {itineraryImagesRow2.map((item, idx) => (
                <div
                  key={idx}
                  className="relative w-52 h-72 sm:w-60 sm:h-80 rounded-2xl overflow-hidden flex-shrink-0 group transition-transform duration-300 hover:scale-[1.03]"
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover object-top"
                  />
                </div>
              ))}
            </Marquee>

            {/* Gradient edge vignettes */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-[#020205] to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-[#020205] to-transparent z-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroWithMarquee;
