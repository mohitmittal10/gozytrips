import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

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
        <section id="packages" className="py-24 bg-black relative overflow-hidden">
            {/* Background Decorative Glow */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/[0.02] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/[0.02] rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
                        Signature <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">Journeys</span>
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mx-auto text-sm md:text-base font-light">
                        Explore our curated collection of luxury travel packages, designed to inspire and enchant.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {packages.map((pkg) => {
                        const image = PlaceHolderImages.find(img => img.id === pkg.id);
                        return (
                            <Card key={pkg.id} className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl flex flex-col overflow-hidden rounded-[2rem] transition-all duration-300 hover:border-indigo-500/30 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(124,58,237,0.1)] group">
                                <CardHeader className="p-0">
                                    <div className="relative h-60 w-full overflow-hidden">
                                        {image && (
                                            <Image
                                                src={image.imageUrl}
                                                alt={image.description}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                data-ai-hint={image.imageHint}
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#020205]/80 via-transparent to-transparent opacity-60" />
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 flex-grow">
                                    <CardTitle className="text-xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors duration-300">{pkg.title}</CardTitle>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
                                        <span className="font-light">{pkg.duration}</span>
                                        <span className="text-zinc-600">&bull;</span>
                                        <span className="font-medium text-indigo-400">From {pkg.price}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="pb-6">
                                    <Button className="w-full bg-white text-black hover:bg-zinc-200 rounded-xl h-10 font-bold transition-all duration-300 group/btn" asChild>
                                        <Link href="#contact">
                                            View Details <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default Packages;


