import { Testimonial } from "@/components/ui/clean-testimonial"

export function CleanTestimonialDemo() {
    return (
        <section className="testimonial-theme bg-black py-2 overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 mb-2">
                        Hear From Our <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">Travelers</span>
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
