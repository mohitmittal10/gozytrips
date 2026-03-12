import { FeatureSteps } from "@/components/ui/feature-section";

const features = [
    {
        step: "AI Generation",
        title: "AI Generation",
        content: "Stop spending hours on research. Describe the dream trip — we'll build the full itinerary, day by day, optimized to minimize travel fatigue.",
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop",
    },
    {
        step: "Preference-Driven",
        title: "Preference-Driven",
        content: "Every traveler is different. Budget backpacker or luxury seeker — your itinerary adapts to them, not the other way around.",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop",
    },
    {
        step: "Editing Tools",
        title: "Editing Tools",
        content: "AI writes the first draft. You make it perfect. Drag, reorder, delete — full creative control, zero friction.",
        image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=1000&auto=format&fit=crop",
    },
    {
        step: "Pricing & Markup",
        title: "Pricing & Markup Engine",
        content: "Quote adults, kids, and infants instantly. Set your markup, add your service fee, and send a professional quote.",
        image: "https://images.unsplash.com/photo-1554224155-1696413575b8?q=80&w=1000&auto=format&fit=crop",
    },
    {
        step: "Status Tracking",
        title: "Status Tracking",
        content: "From first idea to confirmed booking — track every quote through its lifecycle. Never lose a lead to disorganized follow-ups again.",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop",
    },
    {
        step: "PDF Export",
        title: "PDF Export",
        content: "Send proposals so beautiful, clients say yes before reading the details. Four premium templates, your brand, one click.",
        image: "https://images.unsplash.com/photo-1586769852044-692d6e3703a0?q=80&w=1000&auto=format&fit=crop",
    },
    {
        step: "Security",
        title: "Security",
        content: "Your client data stays yours. Always. Enterprise-grade security with row-level privacy built in from day one.",
        image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1000&auto=format&fit=crop",
    },
];

export function FeatureStepsDemo() {
    return (
        <section className="py-20 w-full">
            <FeatureSteps
                features={features}
                title="Elevate Your Travel Business"
                autoPlayInterval={2000}
                imageHeight="h-[300px] md:h-[400px]"
            />
        </section>
    );
}
