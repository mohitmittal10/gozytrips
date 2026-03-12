"use client";

import * as React from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type FocusRailItem = {
    id: string | number;
    title: string;
    description?: string;
    imageSrc: string;
    href?: string;
    meta?: string;
};

interface FocusRailProps {
    items: FocusRailItem[];
    initialIndex?: number;
    loop?: boolean;
    autoPlay?: boolean;
    interval?: number;
    className?: string;
}

function wrap(min: number, max: number, v: number) {
    const rangeSize = max - min;
    return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
}

const BASE_SPRING = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 1,
} as const;

const TAP_SPRING = {
    type: "spring",
    stiffness: 450,
    damping: 18,
    mass: 1,
} as const;

export function FocusRail({
    items,
    initialIndex = 0,
    loop = true,
    autoPlay = false,
    interval = 4000,
    className,
}: FocusRailProps) {
    const [active, setActive] = React.useState(initialIndex);
    const [isHovering, setIsHovering] = React.useState(false);
    const lastWheelTime = React.useRef<number>(0);

    const count = items.length;
    const activeIndex = wrap(0, count, active);
    const activeItem = items[activeIndex];

    const handlePrev = React.useCallback(() => {
        if (!loop && active === 0) return;
        setActive((p) => p - 1);
    }, [loop, active]);

    const handleNext = React.useCallback(() => {
        if (!loop && active === count - 1) return;
        setActive((p) => p + 1);
    }, [loop, active, count]);

    const onWheel = React.useCallback(
        (e: React.WheelEvent) => {
            const now = Date.now();
            if (now - lastWheelTime.current < 400) return;
            const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
            const delta = isHorizontal ? e.deltaX : e.deltaY;
            if (Math.abs(delta) > 20) {
                if (delta > 0) {
                    handleNext();
                } else {
                    handlePrev();
                }
                lastWheelTime.current = now;
            }
        },
        [handleNext, handlePrev]
    );

    React.useEffect(() => {
        if (!autoPlay || isHovering) return;
        const timer = setInterval(() => handleNext(), interval);
        return () => clearInterval(timer);
    }, [autoPlay, isHovering, handleNext, interval]);

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowLeft") handlePrev();
        if (e.key === "ArrowRight") handleNext();
    };

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity;
    };

    const onDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
        const swipe = swipePower(offset.x, velocity.x);
        if (swipe < -swipeConfidenceThreshold) {
            handleNext();
        } else if (swipe > swipeConfidenceThreshold) {
            handlePrev();
        }
    };

    const visibleIndices = [-2, -1, 0, 1, 2];

    return (
        <div
            className={cn(
                "group relative flex h-[600px] w-full flex-col overflow-hidden bg-neutral-950 text-white outline-none select-none overflow-x-hidden",
                className
            )}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onWheel={onWheel}
        >
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={`bg-${activeItem.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute inset-0"
                    >
                        <img
                            src={activeItem.imageSrc}
                            alt=""
                            className="h-full w-full object-cover blur-3xl saturate-200"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent" />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Main Stage */}
            <div className="relative z-10 flex flex-1 flex-col justify-center px-4 md:px-8">
                {/* DRAGGABLE RAIL CONTAINER */}
                <motion.div
                    className="relative mx-auto flex h-[360px] w-full max-w-6xl items-center justify-center perspective-[1200px] cursor-grab active:cursor-grabbing"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={onDragEnd}
                >
                    {visibleIndices.map((offset) => {
                        const absIndex = active + offset;
                        const index = wrap(0, count, absIndex);
                        const item = items[index];

                        if (!loop && (absIndex < 0 || absIndex >= count)) return null;

                        const isCenter = offset === 0;
                        const dist = Math.abs(offset);

                        const xOffset = offset * 320;
                        const zOffset = -dist * 180;
                        const scale = isCenter ? 1 : 0.85;
                        const rotateY = offset * -20;

                        const opacity = isCenter ? 1 : Math.max(0.1, 1 - dist * 0.5);
                        const blur = isCenter ? 0 : dist * 6;
                        const brightness = isCenter ? 1 : 0.5;

                        return (
                            <motion.div
                                key={absIndex}
                                className={cn(
                                    "absolute w-[260px] md:w-[320px] lg:w-[400px] h-[300px] rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-500 overflow-hidden",
                                    isCenter ? "z-20 ring-1 ring-white/20 shadow-[0_32px_64px_rgba(0,0,0,0.6)]" : "z-10"
                                )}
                                initial={false}
                                animate={{
                                    x: xOffset,
                                    z: zOffset,
                                    scale: scale,
                                    rotateY: rotateY,
                                    opacity: opacity,
                                    filter: `blur(${blur}px) brightness(${brightness})`,
                                }}
                                transition={{
                                    x: BASE_SPRING,
                                    z: BASE_SPRING,
                                    rotateY: BASE_SPRING,
                                    opacity: BASE_SPRING,
                                    filter: BASE_SPRING,
                                    scale: TAP_SPRING,
                                }}
                                style={{
                                    transformStyle: "preserve-3d",
                                }}
                                onClick={() => {
                                    if (offset !== 0) setActive((p) => p + offset);
                                }}
                            >
                                <div className="absolute inset-2 overflow-hidden rounded-[24px] bg-black/40 border border-white/10">
                                    <img
                                        src={item.imageSrc}
                                        alt={item.title}
                                        className="h-full w-full object-cover opacity-90 transition-opacity duration-500 hover:opacity-100 pointer-events-none"
                                    />
                                </div>
                                {/* Apple-style inner highlight */}
                                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/20 via-transparent to-black/40 pointer-events-none mix-blend-overlay" />
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Info & Controls */}
                <div className="mx-auto mt-12 flex w-full max-w-4xl flex-col items-center justify-between gap-6 md:flex-row pointer-events-auto">
                    <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left h-32 justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeItem.id}
                                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                                transition={{ duration: 0.3 }}
                                className="space-y-3 rounded-3xl bg-white/[0.03] p-6 backdrop-blur-[40px] border border-white/10 shadow-[0_16px_32px_rgba(0,0,0,0.4)]"
                            >
                                {activeItem.meta && (
                                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-xs font-semibold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/20">
                                        {activeItem.meta}
                                    </span>
                                )}
                                <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
                                    {activeItem.title}
                                </h2>
                                {activeItem.description && (
                                    <p className="max-w-md text-neutral-400">
                                        {activeItem.description}
                                    </p>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 rounded-full bg-white/[0.03] p-1.5 ring-1 ring-white/10 backdrop-blur-[40px] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                            <button
                                onClick={handlePrev}
                                className="rounded-full p-3 text-neutral-400 transition hover:bg-white/10 hover:text-white active:scale-95"
                                aria-label="Previous"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <span className="min-w-[40px] text-center text-xs font-mono text-neutral-500">
                                {activeIndex + 1} / {count}
                            </span>
                            <button
                                onClick={handleNext}
                                className="rounded-full p-3 text-neutral-400 transition hover:bg-white/10 hover:text-white active:scale-95"
                                aria-label="Next"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>

                        {activeItem.href && (
                            <Link
                                href={activeItem.href}
                                className="group flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-[40px] px-6 py-3.5 text-sm font-semibold text-white border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
                            >
                                Explore
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
