import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const About = () => {
    const aboutImage = PlaceHolderImages.find(img => img.id === 'about-us');

    return (
        <section id="about" className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary">Discover the World, Redefined</h2>
                    <p className="text-foreground/80 leading-relaxed">
                        At Odyssey Luxe, we believe travel is more than just visiting a new place; it's about creating lasting memories and experiencing the soul of a destination. Our mission is to craft bespoke, luxurious journeys that cater to your every desire, blending iconic sights with hidden gems for an adventure that is uniquely yours.
                    </p>
                    <p className="text-foreground/80 leading-relaxed">
                        With years of expertise and a passion for exploration, our team of travel connoisseurs meticulously designs each itinerary, ensuring unparalleled comfort, exclusivity, and authenticity. From serene beach escapes to vibrant cultural immersions, we unlock the doors to the world's most extraordinary experiences.
                    </p>
                    <Button asChild>
                        <Link href="#contact">
                            Start Your Journey <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
                <div className="relative h-80 md:h-[500px] rounded-lg overflow-hidden shadow-2xl glass-main">
                    {aboutImage && (
                        <Image
                            src={aboutImage.imageUrl}
                            alt={aboutImage.description}
                            fill
                            className="object-cover transition-transform duration-500 hover:scale-110"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            data-ai-hint={aboutImage.imageHint}
                        />
                    )}
                </div>
            </div>
        </section>
    );
}

export default About;
