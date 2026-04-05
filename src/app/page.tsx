import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Hero from '@/components/sections/hero';
import { CleanTestimonialDemo } from '@/components/sections/clean-testimonial-demo';
import { HeroParallax } from '@/components/ui/hero-parallax';
import AnimatedTypography from '@/components/sections/animated-typography';
import CuratedItineraries from '@/components/sections/curated-itineraries';
import HowItWorksTimeline from '@/components/sections/how-it-works-timeline';
import { FeatureStepsDemo } from '@/components/sections/feature-steps-section';

const parallaxProducts = [
  {
    title: "Eco Retreat",
    link: "#",
    thumbnail: "/image/home/screen0.1.jpeg",
  },
  {
    title: "AI Itinerary Planner",
    link: "#",
    thumbnail: "/image/home/screen0.2.png",
  },
  {
    title: "Dashboard Overview",
    link: "#",
    thumbnail: "/image/home/Screenshot 2026-03-30 231051.jpg",
  },
  {
    title: "Premium Travel Suite",
    link: "#",
    thumbnail: "/image/home/Screenshot 2026-03-30 231201.jpg",
  },
  {
    title: "Lush Greenery",
    link: "#",
    thumbnail: "/image/home/algivari-rizchy-Bg93ltNBTDQ-unsplash.jpg",
  },

////////////////////--row 2--//////////////////////////////
  {
    title: "Eco Retreat",
    link: "#",
    thumbnail: "/image/home/screen1.2.jpg",
  },
  {
    title: "AI Itinerary Planner",
    link: "#",
    thumbnail: "/image/home/screen1.1.jpg",
  },
  {
    title: "Dashboard Overview",
    link: "#",
    thumbnail: "/image/home/screen1.png",
  },
  {
    title: "Premium Travel Suite",
    link: "#",
    thumbnail: "/image/home/screen1.1.jpg",
  },
  {
    title: "Lush Greenery",
    link: "#",
    thumbnail: "/image/home/screen0.3.jpg",
  },

  ///////////row 3//////////////

  {
    title: "Eco Retreat",
    link: "#",
    thumbnail: "/image/home/screen2.1.jpg",
  },
  {
    title: "AI Itinerary Planner",
    link: "#",
    thumbnail: "/image/home/screen2.2.png",
  },
  {
    title: "Dashboard Overview",
    link: "#",
    thumbnail: "/image/home/screen2.3.jpg",
  },
  {
    title: "Premium Travel Suite",
    link: "#",
    thumbnail: "/image/home/Screenshot 2026-03-30 231201.jpg",
  },
  {
    title: "Lush Greenery",
    link: "#",
    thumbnail: "/image/home/algivari-rizchy-Bg93ltNBTDQ-unsplash.jpg",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Hero />
        <HeroParallax products={parallaxProducts} />
        <HowItWorksTimeline />
        <FeatureStepsDemo />
        <AnimatedTypography />
        <CuratedItineraries />
        <CleanTestimonialDemo />
      </main>
      <Footer />
    </div>
  );
}
