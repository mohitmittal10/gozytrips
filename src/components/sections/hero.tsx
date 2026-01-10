import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import { Button } from "../ui/button";
import { ArrowDown } from "lucide-react";

const Hero = () => {
    const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');

    return (
        <section id="home" className="relative h-screen flex items-center justify-center text-center pt-20">
            {heroImage && (
                <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    fill
                    className="object-cover"
                    priority
                    data-ai-hint={heroImage.imageHint}
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="font-headline text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white" style={{textShadow: '0 4px 15px rgba(0,0,0,0.4)'}}>
                    Your World, Reimagined
                </h1>
                <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-white/90" style={{textShadow: '0 2px 8px rgba(0,0,0,0.3)'}}>
                    Experience the pinnacle of luxury travel, with bespoke journeys crafted to perfection.
                </p>
                <div className="mt-10">
                    <Button size="lg" asChild>
                        <a href="#packages">
                            Explore Packages
                            <ArrowDown className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                </div>
            </div>
        </section>
    );
}

export default Hero;
