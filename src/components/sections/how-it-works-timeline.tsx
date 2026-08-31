"use client";

import Image from "next/image";
import React from "react";
import { Timeline } from "@/components/ui/timeline";
import { TextCursorInput, Workflow, FileStack, Database } from "lucide-react";
import Step1Animation from "./step1-animation";
import Step2Animation from "./step2-animation";
import Step3Animation from "./step3-animation";
import Step4Animation from "./step4-animation";

export default function HowItWorksTimeline() {
    const data = [
        {
            title: "Step 1",
            content: (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-lg shadow-indigo-500/5">
                            <TextCursorInput className="h-5 w-5 text-[#71717A]" />
                        </div>
                        <h4 className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                            Tell us where you want to go
                        </h4>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm md:text-lg font-normal mb-8 leading-relaxed max-w-2xl">
                        Simply describe your dream vacation. Whether it&apos;s a relaxing beach retreat in Bali or an adventurous trek in Patagonia, just let us know your destination, dates, and preferences.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Step1Animation />
                    </div>
                </div>
            ),
        },
        {
            title: "Step 2",
            content: (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-lg shadow-indigo-500/5">
                            <Workflow className="h-5 w-5 text-[#71717A]" />
                        </div>
                        <h4 className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                            AI maps it out
                        </h4>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm md:text-lg font-normal mb-8 leading-relaxed max-w-2xl">
                        Our advanced The Lab takes over, meticulously planning every detail of your trip. From flights and accommodations to daily activities and local hidden gems, we curate a personalized itinerary just for you.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Step2Animation />
                    </div>
                </div>
            ),
        },
        {
            title: "Step 3",
            content: (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-lg shadow-indigo-500/5">
                            <FileStack className="h-5 w-5 text-[#71717A]" />
                        </div>
                        <h4 className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                            We prepare your PDF
                        </h4>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm md:text-lg font-normal mb-8 leading-relaxed max-w-2xl">
                        Once the plan is perfected, we automatically generate a beautifully designed, ready-to-share PDF. Your entire trip is organized, detailed, and optimized for both digital viewing and printing.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Step3Animation />
                    </div>
                </div>
            ),
        },
        {
            title: "Step 4",
            content: (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-lg shadow-indigo-500/5">
                            <Database className="h-5 w-5 text-[#71717A]" />
                        </div>
                        <h4 className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                            Manage with CRM Lite
                        </h4>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm md:text-lg font-normal mb-8 leading-relaxed max-w-2xl">
                        Keep track of your clients, their preferences, and past itineraries using our integrated CRM Lite. A simple and effective way to manage your travel agency business all in one place.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Step4Animation />
                    </div>
                </div>
            ),
        },
    ];

    return (
        <section id="how-it-works" className="w-full py-10 md:py-24 bg-black">
            <Timeline
                data={data}
                title={<>How <span className="text-[#71717A]">it works</span></>}
                description="Booking your next unforgettable journey is as easy as 1, 2, 3, and 4. Our system handles the heavy lifting while you focus on delivering exceptional experiences."
            />
        </section>
    );
}

