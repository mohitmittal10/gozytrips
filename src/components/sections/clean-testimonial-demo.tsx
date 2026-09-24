import { Testimonial } from "@/components/ui/clean-testimonial"

export function CleanTestimonialDemo() {
    return (
        <section id="testimonials" className="testimonial-theme bg-[#EFECE5] dark:bg-black py-24 overflow-hidden relative transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-neutral-50 mb-2">
                        Hear From Our <span className="text-slate-500 dark:text-[#71717A]">Travelers</span>
                    </h2>
                    <p className="max-w-xl mx-auto text-lg text-slate-600 dark:text-neutral-400">
                        Discover what people are saying about their AI generated travel experiences.
                    </p>
                </div>
                <Testimonial />
            </div>
        </section>
    )
}

