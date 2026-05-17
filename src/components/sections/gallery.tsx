import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import Image from "next/image";

const Gallery = () => {
    const galleryImages = PlaceHolderImages.filter(img => img.id.startsWith('gallery-'));
    
    const spans = [
        'md:col-span-2 md:row-span-2', 'md:col-span-1', 'md:col-span-1',
        'md:col-span-1', 'md:col-span-1', 'md:col-span-2'
    ];

    return (
        <section id="gallery" className="py-24 bg-black relative overflow-hidden">
            {/* Background Decorative Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/[0.02] rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
                        Visual <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">Escapes</span>
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mx-auto text-sm md:text-base font-light">
                        A glimpse into the breathtaking destinations and unforgettable moments we curate.
                    </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[220px] md:auto-rows-[250px] gap-6">
                    {galleryImages.map((image, index) => (
                        <div key={image.id} className={cn("relative rounded-[2rem] overflow-hidden group border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl transition-all duration-500 hover:border-indigo-500/30", spans[index % spans.length])}>
                            <Image
                                src={image.imageUrl}
                                alt={image.description}
                                fill
                                className="object-cover transform group-hover:scale-110 transition-transform duration-500 ease-in-out"
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                                data-ai-hint={image.imageHint}
                            />
                            <div className="absolute inset-0 bg-[#020205]/20 group-hover:bg-[#020205]/40 transition-colors duration-300 pointer-events-none" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Gallery;


