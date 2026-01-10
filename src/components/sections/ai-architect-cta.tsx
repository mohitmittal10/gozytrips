import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Card } from '../ui/card';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const AiArchitectCta = () => {
    const ctaImage = PlaceHolderImages.find(img => img.id === 'gallery-4');

    return (
        <section id="ai-cta" className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="relative grid md:grid-cols-2 items-center overflow-hidden">
                <div className="p-8 md:p-12 order-2 md:order-1">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-6 h-6 text-primary" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary">The Future of Travel</h3>
                    </div>
                    <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
                        Craft Your Dream Trip with AI
                    </h2>
                    <p className="mt-4 text-foreground/80 leading-relaxed">
                        Why settle for standard packages? Our revolutionary AI Travel Architect empowers you to design a completely personalized itinerary in seconds. Describe your perfect vacation—your destination, your style, your pace—and watch as it builds a unique, day-by-day plan just for you.
                    </p>
                    <Button size="lg" asChild className="mt-8">
                        <Link href="/ai-architect">
                            Design Your Journey
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
                <div className="relative h-64 md:h-full min-h-[300px] order-1 md:order-2">
                    {ctaImage && (
                        <Image 
                            src={ctaImage.imageUrl}
                            alt="AI Architect generating a travel plan over a map"
                            fill
                            className="object-cover"
                            data-ai-hint="Santorini greece"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-background via-background/50 to-transparent" />
                </div>
            </Card>
        </section>
    );
}

export default AiArchitectCta;
