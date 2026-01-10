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
        <section id="gallery" className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary">Visual Escapes</h2>
                <p className="mt-4 max-w-2xl mx-auto text-foreground/80">
                    A glimpse into the breathtaking destinations and unforgettable moments we curate.
                </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[250px] gap-4">
                {galleryImages.map((image, index) => (
                    <div key={image.id} className={cn("relative rounded-lg overflow-hidden group shadow-lg glass-main", spans[index % spans.length])}>
                        <Image
                            src={image.imageUrl}
                            alt={image.description}
                            fill
                            className="object-cover transform group-hover:scale-110 transition-transform duration-500 ease-in-out"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                            data-ai-hint={image.imageHint}
                        />
                         <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Gallery;
