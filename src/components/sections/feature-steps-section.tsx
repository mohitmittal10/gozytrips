import { FeatureSteps } from "@/components/ui/feature-section";

// NOTE: Image URLs are intentionally left empty — supply your own URLs here.
// Previously these were Unsplash hotlinks which caused recurring network requests
// on every carousel cycle. Replace with self-hosted or CDN URLs.
const features = [
    {
        step: "AI Generation",
        title: "AI Generation",
        content: "Stop spending hours on research. Describe the dream trip — we'll build the full itinerary, day by day, optimized to minimize travel fatigue.",
        image: "",
    },
    {
        step: "Preference-Driven",
        title: "Preference-Driven",
        content: "Every traveler is different. Budget backpacker or luxury seeker — your itinerary adapts to them, not the other way around.",
        image: "",
    },
    {
        step: "Editing Tools",
        title: "Editing Tools",
        content: "AI writes the first draft. You make it perfect. Drag, reorder, delete — full creative control, zero friction.",
        image: "",
    },
    {
        step: "Pricing & Markup",
        title: "Pricing & Markup Engine",
        content: "Quote adults, kids, and infants instantly. Set your markup, add your service fee, and send a professional quote.",
        image: "",
    },
    {
        step: "Status Tracking",
        title: "Status Tracking",
        content: "From first idea to confirmed booking — track every quote through its lifecycle. Never lose a lead to disorganized follow-ups again.",
        image: "",
    },
    {
        step: "PDF Export",
        title: "PDF Export",
        content: "Send proposals so beautiful, clients say yes before reading the details. Four premium templates, your brand, one click.",
        image: "",
    },
    {
        step: "Security",
        title: "Security",
        content: "Your client data stays yours. Always. Enterprise-grade security with row-level privacy built in from day one.",
        image: "",
    },
];

export function FeatureStepsDemo() {
    return (
        <section className="py-10 w-full bg-black">
            <FeatureSteps
                features={features}
                title={(
                    <>
                        Elevate Your <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">Travel Business</span>
                    </>
                )}
                autoPlayInterval={2000}
                imageHeight="h-[300px] md:h-[400px]"
            />
        </section>
    );
}

