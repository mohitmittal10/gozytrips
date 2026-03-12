"use client"

import { Hero as NewHero } from "@/components/ui/hero";
import { LayoutGroup, motion } from "motion/react";
import { TextRotate } from "@/components/ui/text-rotate";

const Hero = () => {
    return (
        <section id="home">
            <NewHero
                title={
                    <LayoutGroup>
                        <motion.div className="flex whitespace-pre flex-wrap justify-center items-center" layout>
                            <motion.span
                                className="pt-0.5 sm:pt-1 md:pt-2"
                                layout
                                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                            >
                                Your Trip,{" "}
                            </motion.span>
                            <TextRotate
                                texts={[
                                    "Reimagined",
                                    "Simplified",
                                    "Automated",
                                    "Explored",
                                    "Elevated",
                                ]}
                                mainClassName="text-foreground px-2 sm:px-2 md:px-4 bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-xl"
                                staggerFrom={"last"}
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "-120%" }}
                                staggerDuration={0.025}
                                splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                                rotationInterval={2000}
                            />
                        </motion.div>
                    </LayoutGroup>
                }
                subtitle="Experience the pinnacle of AI-driven travel planning. Effortless itineraries, bespoke routes, and unforgettable journeys crafted in seconds."
                actions={[
                    {
                        label: "Start Planning",
                        href: "#packages",
                        variant: "default"
                    }
                ]}
                titleClassName="text-4xl sm:text-5xl md:text-6xl font-extrabold w-full flex justify-center"
                subtitleClassName="text-lg md:text-xl max-w-[600px] mt-4"
                actionsClassName="mt-8"
            />
        </section>
    );
}

export default Hero;
