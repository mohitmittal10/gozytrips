import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent } from "../ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel";
import { Star } from "lucide-react";

const testimonials = [
    {
        name: "Alexandra Chen",
        avatar: "AC",
        image: "https://picsum.photos/seed/101/100/100",
        title: "CEO, TechCorp",
        rating: 5,
        review: "Odyssey Luxe planned our corporate retreat to Tuscany, and it was flawless. Every detail was meticulously handled, allowing our team to relax and connect. Truly a five-star experience from start to finish."
    },
    {
        name: "David & Emily Carter",
        avatar: "DC",
        image: "https://picsum.photos/seed/102/100/100",
        title: "Honeymooners",
        rating: 5,
        review: "Our honeymoon in the Maldives was a dream come true, all thanks to Odyssey Luxe. The private villa, the sunset cruises, the impeccable service—it was pure magic. We couldn't have asked for more."
    },
    {
        name: "Sofia Rodriguez",
        avatar: "SR",
        image: "https://picsum.photos/seed/103/100/100",
        title: "Solo Traveler",
        rating: 5,
        review: "As a solo female traveler, safety and experience are paramount. The team crafted a cultural journey through Japan that was both enlightening and incredibly well-organized. I felt supported every step of the way."
    },
];

const Testimonials = () => {
    return (
        <section id="testimonials" className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary">Voices of Our Travelers</h2>
                <p className="mt-4 max-w-2xl mx-auto text-foreground/80">
                    Hear from those who have journeyed with us and experienced the Odyssey Luxe difference.
                </p>
            </div>
            <Carousel opts={{ loop: true }} className="w-full max-w-4xl mx-auto">
                <CarouselContent>
                    {testimonials.map((testimonial, index) => (
                        <CarouselItem key={index}>
                            <div className="p-1">
                                <Card className="glass-card">
                                    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                                        <div className="flex mb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-5 h-5 ${i < testimonial.rating ? 'text-primary fill-current' : 'text-primary/50'}`} />
                                            ))}
                                        </div>
                                        <p className="italic text-lg text-foreground mb-6">"{testimonial.review}"</p>
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                <AvatarImage src={testimonial.image} alt={testimonial.name} />
                                                <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-foreground/90">{testimonial.name}</p>
                                                <p className="text-sm text-foreground/70">{testimonial.title}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
            </Carousel>
        </section>
    );
};

export default Testimonials;
