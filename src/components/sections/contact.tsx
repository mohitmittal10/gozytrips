import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const Contact = () => {
    return (
        <section id="contact" className="glass-main">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary">
                    Ready for an Unforgettable Adventure?
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-foreground/80">
                    Our travel experts are eager to help you design the trip of a lifetime. Get in touch with us today to start planning your bespoke journey.
                </p>
                <div className="mt-8">
                    <Button size="lg" asChild>
                        <Link href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer">
                            Contact Our Experts
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}

export default Contact;
