"use client";

import Image from "next/image";
import React from "react";
import { Timeline } from "@/components/ui/timeline";
import { Sparkles, MapPin, Zap, Users, Info } from "lucide-react";

export default function HowItWorksTimeline() {
    const images = {
        step1: "https://images.unsplash.com/photo-1436450412740-6b988f486c6b?auto=format&fit=crop&w=800&q=80",
        step2: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80",
        step3: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        step4: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    };

    const data = [
        {
            title: "Step 1",
            content: (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                            Tell us where you want to go
                        </h4>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm md:text-lg font-normal mb-8 leading-relaxed max-w-2xl">
                        Simply describe your dream vacation. Whether it&apos;s a relaxing beach retreat in Bali or an adventurous trek in Patagonia, just let us know your destination, dates, and preferences.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Image
                            src={images.step1}
                            alt="Globe and map"
                            width={800}
                            height={500}
                            className="rounded-xl object-cover h-48 md:h-72 lg:h-80 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
                        />
                    </div>
                </div>
            ),
        },
        {
            title: "Step 2",
            content: (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <MapPin className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h4 className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                            AI maps it out
                        </h4>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm md:text-lg font-normal mb-8 leading-relaxed max-w-2xl">
                        Our advanced The Lab takes over, meticulously planning every detail of your trip. From flights and accommodations to daily activities and local hidden gems, we curate a personalized itinerary just for you.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Image
                            src={images.step2}
                            alt="Map and planning"
                            width={800}
                            height={500}
                            className="rounded-xl object-cover h-48 md:h-72 lg:h-80 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
                        />
                    </div>
                </div>
            ),
        },
        {
            title: "Step 3",
            content: (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h4 className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                            We prepare your PDF
                        </h4>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm md:text-lg font-normal mb-8 leading-relaxed max-w-2xl">
                        Once the plan is perfected, we automatically generate a beautifully designed, ready-to-share PDF. Your entire trip is organized, detailed, and optimized for both digital viewing and printing.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Image
                            src={images.step3}
                            alt="PDF Document preview"
                            width={800}
                            height={500}
                            className="rounded-xl object-cover h-48 md:h-72 lg:h-80 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
                        />
                    </div>
                </div>
            ),
        },
        {
            title: "Step 4",
            content: (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h4 className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                            Manage with CRM Lite
                        </h4>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm md:text-lg font-normal mb-8 leading-relaxed max-w-2xl">
                        Keep track of your clients, their preferences, and past itineraries using our integrated CRM Lite. A simple and effective way to manage your travel agency business all in one place.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Image
                            src={images.step4}
                            alt="CRM Dashboard preview"
                            width={800}
                            height={500}
                            className="rounded-xl object-cover h-48 md:h-72 lg:h-80 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
                        />
                    </div>
                </div>
            ),
        },
    ];

    return (
        <section className="w-full py-24 bg-black">
            <Timeline
                data={data}
                title={<>How <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">it works</span></>}
                description="Booking your next unforgettable journey is as easy as 1, 2, 3, and 4. Let our AI handle the heavy lifting while you focus on the excitement of travel."
            />
        </section>
    );
}

