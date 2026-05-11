"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface Feature {
    step: string
    title?: string
    content: string
    image: string
}

interface FeatureStepsProps {
    features: Feature[]
    className?: string
    title?: React.ReactNode
    autoPlayInterval?: number
    imageHeight?: string
}

export function FeatureSteps({
    features,
    className,
    title = "How to get Started",
    autoPlayInterval = 3000,
    imageHeight = "h-[300px] md:h-[400px]",
}: FeatureStepsProps) {
    const [currentFeature, setCurrentFeature] = useState(0)
    const [progress, setProgress] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const featuresContainerRef = useRef<HTMLDivElement>(null)

    // Create an extended array for infinite scrolling effect (triple length for safety window)
    const extendedFeatures = [...features, ...features, ...features];
    const originalLength = features.length;

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (!isHovered) {
            timer = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        setCurrentFeature((prevIndex) => prevIndex + 1)
                        return 0;
                    }
                    return prev + (100 / (autoPlayInterval / 100))
                })
            }, 100)
        }

        return () => {
            if (timer) clearInterval(timer)
        }
    }, [isHovered, autoPlayInterval])

    // Handle global scroll to resume autoplay
    useEffect(() => {
        const handleScroll = () => {
            if (isHovered) {
                setIsHovered(false);
            }
        };
        // Listen to window scroll (if user uses mouse wheel outside component)
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [isHovered]);

    // Auto-scroll the active feature into view and handle infinite loop reset
    useEffect(() => {
        if (featuresContainerRef.current) {
            const container = featuresContainerRef.current;
            const activeItem = document.getElementById(`feature-item-${currentFeature}`);

            if (activeItem) {
                const containerHeight = container.clientHeight;
                const itemTop = activeItem.offsetTop;
                const itemHeight = activeItem.clientHeight;
                const scrollTo = itemTop - (containerHeight / 2) + (itemHeight / 2);

                container.scrollTo({ top: scrollTo, behavior: "smooth" });
            }

            // Silent reset when reaching the third set
            if (currentFeature >= originalLength * 2) {
                setTimeout(() => {
                    setCurrentFeature(currentFeature - originalLength);
                    const resetItem = document.getElementById(`feature-item-${currentFeature - originalLength}`);
                    if (resetItem && container) {
                        const scrollTo = resetItem.offsetTop - (container.clientHeight / 2) + (resetItem.clientHeight / 2);
                        container.scrollTo({ top: scrollTo, behavior: "instant" });
                    }
                }, 400); // Wait for scroll animation to finish
            }
        }
    }, [currentFeature, originalLength])

    return (
        <div className={cn("p-4 md:p-8", className)}>
            <div className="max-w-7xl mx-auto w-full">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-400">
                    {title}
                </h2>

                <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-10">
                    <div
                        ref={featuresContainerRef}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => { setIsHovered(false); setProgress(0); }}
                        className="order-2 md:order-1 relative flex flex-col space-y-4 overflow-y-auto pr-4 h-[350px] md:h-[400px] scroll-smooth [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        id="features-scroll-container"
                    >
                        {/* Empty spacing for top padding to allow first item to center */}
                        <div className="h-[calc(50%-4rem)] shrink-0" />

                        {extendedFeatures.map((feature, index) => {
                            const actualIndex = index % originalLength;
                            const isCurrent = index === currentFeature;

                            return (
                                <motion.div
                                    key={index}
                                    id={`feature-item-${index}`}
                                    className="flex flex-col items-center cursor-pointer group py-4 shrink-0 transition-opacity duration-500"
                                    style={{ opacity: isCurrent ? 1 : 0.35 }}
                                    initial={{ scale: 0.95 }}
                                    animate={{ scale: isCurrent ? 1.05 : 0.95 }}
                                    transition={{ duration: 0.4 }}
                                    onClick={() => {
                                        setCurrentFeature(index)
                                        setProgress(0)
                                        setIsHovered(true)
                                    }}
                                >
                                    <div className="flex-1 flex flex-col items-center text-center">
                                        <h3 className={cn(
                                            "text-xl md:text-2xl font-bold transition-colors duration-300 pb-2",
                                            isCurrent ? "text-primary" : "text-muted-foreground group-hover:text-neutral-900 dark:group-hover:text-neutral-100"
                                        )}>
                                            {feature.title || feature.step}
                                        </h3>
                                        <p className="text-sm md:text-base text-muted-foreground transition-all duration-300">
                                            {feature.content}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Empty spacing for bottom padding to allow last item to center */}
                        <div className="h-[calc(50%-4rem)] shrink-0" />
                    </div>

                    <div
                        className={cn(
                            "order-1 md:order-2 relative overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-2xl mx-auto w-full max-w-[500px]",
                            imageHeight
                        )}
                    >
                        <AnimatePresence mode="wait">
                            {extendedFeatures.map(
                                (feature, index) =>
                                    index === currentFeature && (
                                        <motion.div
                                            key={index}
                                            className="absolute inset-0 rounded-2xl overflow-hidden"
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -20, opacity: 0 }}
                                            transition={{ duration: 0.4, ease: "easeOut" }}
                                        >
                                            {feature.image ? (
                                                <Image
                                                    src={feature.image}
                                                    alt={feature.step}
                                                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                                    width={1000}
                                                    height={500}
                                                    priority
                                                />
                                            ) : (
                                                // Placeholder shown when no image URL is provided yet
                                                <div className="w-full h-full bg-gradient-to-br from-purple-900/40 via-violet-900/30 to-indigo-900/40 flex items-center justify-center">
                                                    <span className="text-white/20 text-xs font-medium uppercase tracking-widest">Image coming soon</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                                        </motion.div>
                                    ),
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    )
}

