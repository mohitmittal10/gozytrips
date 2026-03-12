import { Testimonial } from "@/components/ui/clean-testimonial"

export function CleanTestimonialDemo() {
    return (
        <section className="testimonial-theme bg-transparent py-4 overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 mb-4">
                        Hear From Our Travelers
                    </h2>
                    <p className="max-w-xl mx-auto text-lg text-neutral-600 dark:text-neutral-400">
                        Discover what people are saying about their AI generated travel experiences.
                    </p>
                </div>
                <Testimonial />
            </div>
        </section>
    )
}
