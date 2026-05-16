"use client";

import * as React from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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

/**
 * Computes the shortest-path visual offset of itemIdx relative to active,
 * wrapping around so items on the far side appear on the near side.
 * e.g. for count=3, active=0, itemIdx=2 → offset=-1 (show left, not +2 right)
 */
function shortestOffset(itemIdx: number, active: number, count: number): number {
    let offset = itemIdx - active;
    const half = count / 2;
    if (offset > half) offset -= count;
    if (offset < -half) offset += count;
    return offset;
}

export function FocusRail({
    items,
    initialIndex = 0,
    loop = true,
    autoPlay = false,
    interval = 4000,
    className,
}: FocusRailProps) {
    const count = items.length;

    // Clamp to [0, count) immediately so it never drifts.
    const [active, setActive] = React.useState(() =>
        Math.max(0, Math.min(count - 1, initialIndex))
    );
    const [isHovering, setIsHovering] = React.useState(false);
    const lastWheelTime = React.useRef<number>(0);

    const activeItem = items[active];

    // Both callbacks are stable (deps: loop, count — never change at runtime).
    // Using functional setActive so no stale closure over `active`.
    const handlePrev = React.useCallback(() => {
        setActive((p) => {
            if (!loop && p === 0) return p;
            return (p - 1 + count) % count;
        });
    }, [loop, count]);

    const handleNext = React.useCallback(() => {
        setActive((p) => {
            if (!loop && p === count - 1) return p;
            return (p + 1) % count;
        });
    }, [loop, count]);

    // Stable interval — handleNext never changes so this runs once on mount.
    React.useEffect(() => {
        if (!autoPlay || isHovering) return;
        const timer = setInterval(handleNext, interval);
        return () => clearInterval(timer);
    }, [autoPlay, isHovering, handleNext, interval]);

    const onWheel = React.useCallback(
        (e: React.WheelEvent) => {
            const now = Date.now();
            if (now - lastWheelTime.current < 400) return;
            const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
            const delta = isHorizontal ? e.deltaX : e.deltaY;
            if (Math.abs(delta) > 20) {
                delta > 0 ? handleNext() : handlePrev();
                lastWheelTime.current = now;
            }
        },
        [handleNext, handlePrev]
    );

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowLeft") handlePrev();
        if (e.key === "ArrowRight") handleNext();
    };

    const onDragEnd = React.useCallback(
        (_e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
            const swipe = Math.abs(offset.x) * velocity.x;
            if (swipe < -10000) handleNext();
            else if (swipe > 10000) handlePrev();
        },
        [handleNext, handlePrev]
    );

    return (
        <div
            className={cn(
                "group relative flex h-auto py-24 md:py-32 w-full flex-col overflow-hidden bg-black text-white outline-none select-none",
                className
            )}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onWheel={onWheel}
        >
            {/*
             * Background ambience — all items are rendered simultaneously, always.
             * Only opacity is toggled (0 ↔ 0.4). No key changes, no remounts,
             * no image re-requests. Previously this remounted on every slide change.
             */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {items.map((item, i) => (
                    <motion.div
                        key={item.id}
                        className="absolute inset-0 overflow-hidden"
                        animate={{ opacity: i === active ? 0.4 : 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <Image
                            src={item.imageSrc}
                            alt=""
                            fill
                            sizes="100vw"
                            quality={60}
                            className="object-cover blur-[48px] saturate-200 pointer-events-none"
                            priority={i === 0}
                            aria-hidden
                        />
                    </motion.div>
                ))}
                {/* Ambient Gradient Orbs */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-purple-600/[0.05] rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-indigo-600/[0.05] rounded-full blur-[100px]"></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>

            {/* Main Stage */}
            <div className="relative z-10 flex flex-1 flex-col justify-center px-4 md:px-8">
                <motion.div
                    className="relative mx-auto flex h-[360px] w-full max-w-6xl items-center justify-center perspective-[1200px] cursor-grab active:cursor-grabbing"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={onDragEnd}
                >
                    {/*
                     * THE CORE FIX — iterate over items, not visibleIndices.
                     *
                     * Old approach (visibleIndices.map):
                     *   key=offset (-2..+2), src=items[wrap(active+offset)]
                     *   → every slide: ALL 5 slots get a new src prop
                     *   → Next.js Image resets loading state for each
                     *   → commitMutationEffectsOnFiber fires for every card
                     *   → deep React mutation loop in HAR
                     *
                     * New approach (items.map):
                     *   key=item.id (permanent, never changes)
                     *   src=item.imageSrc (permanent, never changes)
                     *   → only animated x/z/rotateY/opacity/scale change
                     *   → Next.js Image never reloads, zero mutation cascade
                     */}
                    {items.map((item, itemIdx) => {
                        const offset = shortestOffset(itemIdx, active, count);
                        const isCenter = offset === 0;
                        const dist = Math.abs(offset);

                        return (
                            <motion.div
                                key={item.id}
                                className={cn(
                                    "absolute w-[260px] md:w-[320px] lg:w-[400px] h-[300px] rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl md:backdrop-blur-3xl shadow-lg md:shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden",
                                    isCenter
                                        ? "z-20 ring-1 ring-white/20 shadow-[0_32px_64px_rgba(0,0,0,0.6)]"
                                        : "z-10"
                                )}
                                initial={false}
                                animate={{
                                    x: offset * 320,
                                    z: -dist * 180,
                                    scale: isCenter ? 1 : 0.85,
                                    rotateY: offset * -20,
                                    opacity: isCenter ? 1 : Math.max(0.1, 1 - dist * 0.5),
                                }}
                                transition={{
                                    x: BASE_SPRING,
                                    z: BASE_SPRING,
                                    rotateY: BASE_SPRING,
                                    opacity: BASE_SPRING,
                                    scale: TAP_SPRING,
                                }}
                                style={{
                                    transformStyle: "preserve-3d",
                                    // filter via CSS transition (browser compositor) instead of
                                    // Framer Motion animate — eliminates JS RAF update loop.
                                    filter: `blur(${isCenter ? 0 : dist * 6}px) brightness(${isCenter ? 1 : 0.5})`,
                                    transition: "filter 0.5s ease",
                                }}
                                onClick={() => {
                                    if (!isCenter) setActive(itemIdx);
                                }}
                            >
                                <div className="absolute inset-2 overflow-hidden rounded-[24px] bg-black/40 border border-white/10">
                                    <Image
                                        src={item.imageSrc}
                                        alt={item.title}
                                        fill
                                        sizes="(max-width: 768px) 260px, (max-width: 1024px) 320px, 400px"
                                        className="object-cover opacity-90 transition-opacity duration-500 hover:opacity-100 pointer-events-none"
                                        priority={itemIdx === 0}
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
                    <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left min-h-[160px] justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeItem.id}
                                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                                transition={{ duration: 0.3 }}
                                className="space-y-3 rounded-3xl bg-white/[0.03] p-6 backdrop-blur-xl md:backdrop-blur-[40px] border border-white/10 shadow-xl md:shadow-[0_16px_32px_rgba(0,0,0,0.4)]"
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
                        <div className="flex items-center gap-1 rounded-full bg-white/[0.03] p-1.5 ring-1 ring-white/10 backdrop-blur-xl md:backdrop-blur-[40px] shadow-lg md:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                            <button
                                onClick={handlePrev}
                                className="rounded-full p-3 text-neutral-400 transition hover:bg-white/10 hover:text-white active:scale-95"
                                aria-label="Previous"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <span className="min-w-[40px] text-center text-xs font-mono text-neutral-500">
                                {active + 1} / {count}
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
                                className="group flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-xl md:backdrop-blur-[40px] px-6 py-3.5 text-sm font-semibold text-white border border-white/10 shadow-lg md:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
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

