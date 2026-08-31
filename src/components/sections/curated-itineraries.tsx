"use client";

import { FocusRail, type FocusRailItem } from "@/components/ui/focus-rail";

const ITINERARY_ITEMS: FocusRailItem[] = [
    {
        id: 1,
        title: "Dark",
        description: "Sleek and sophisticated night-mode design perfect for showcasing high-end evening tours, nightlife experiences, and premium stays.",
        meta: "Format • PDF",
        imageSrc: "/dark.png",
        href: "/the-lab",
    },
    {
        id: 2,
        title: "Editorial",
        description: "A magazine-style layout featuring bold typography and expansive imagery for the ultimate visual storytelling experience.",
        meta: "Format • PDF",
        imageSrc: "/editorial.png",
        href: "/the-lab",
    },
    {
        id: 3,
        title: "Minimalist",
        description: "Clean lines, ample white space, and a refined focus on trip details. The essential choice for modern, clutter-free itineraries.",
        meta: "Format • PDF",
        imageSrc: "/minimalist.png",
        href: "/the-lab",
    },
];

export default function CuratedItineraries() {
    return (
        <section id="curated" className="w-full bg-black">
            <div className="mx-auto max-w-7xl px-4 md:px-8 pt-24 pb-12 text-center">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#71717A] mb-1">
                    Curated by Wander Labs
                </p>
                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                    <span className="text-[#71717A]">PDF</span> Itinerary Formats
                </h2>
                
            </div>
            <FocusRail
                items={ITINERARY_ITEMS}
                autoPlay={true}
                interval={5000}
                loop={true}
            />
        </section>
    );
}

