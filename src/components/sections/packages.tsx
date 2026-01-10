import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { ArrowRight, MapPin } from "lucide-react";

const Packages = () => {
    const packages = [
        {
            id: 'package-paris',
            title: 'Romantic Rhapsody in Paris',
            duration: '7 Days',
            price: '$4,200',
        },
        {
            id: 'package-maldives',
            title: 'Maldivian Paradise Escape',
            duration: '10 Days',
            price: '$7,500',
        },
        {
            id: 'package-kyoto',
            title: 'Serenity of Ancient Kyoto',
            duration: '8 Days',
            price: '$5,800',
        },
    ];

    return (
        <section id="packages" className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary">Signature Journeys</h2>
                <p className="mt-4 max-w-2xl mx-auto text-foreground/80">
                    Explore our curated collection of luxury travel packages, designed to inspire and enchant.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {packages.map((pkg) => {
                    const image = PlaceHolderImages.find(img => img.id === pkg.id);
                    return (
                        <Card key={pkg.id} className="glass-card flex flex-col overflow-hidden">
                            <CardHeader className="p-0">
                                <div className="relative h-60 w-full">
                                    {image && (
                                        <Image
                                            src={image.imageUrl}
                                            alt={image.description}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            data-ai-hint={image.imageHint}
                                        />
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 flex-grow">
                                <CardTitle className="font-headline text-2xl">{pkg.title}</CardTitle>
                                <div className="flex items-center gap-4 mt-2 text-sm text-foreground/70">
                                    <span>{pkg.duration}</span>
                                    <span>&bull;</span>
                                    <span>From {pkg.price}</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="secondary">
                                    View Details <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </section>
    );
}

export default Packages;
