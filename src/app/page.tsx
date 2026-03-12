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
    title: "Santorini, Greece",
    link: "/destinations/santorini",
    thumbnail: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5f1?q=80&w=1000&auto=format&fit=crop",
  },
  {
    title: "Kyoto, Japan",
    link: "/destinations/kyoto",
    thumbnail: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c08?q=80&w=1000&auto=format&fit=crop",
  },
  {
    title: "Amalfi Coast, Italy",
    link: "/destinations/amalfi",
    thumbnail: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?q=80&w=1000&auto=format&fit=crop",
  },
  {
    title: "Bali, Indonesia",
    link: "/destinations/bali",
    thumbnail: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1000&auto=format&fit=crop",
  },
  {
    title: "Swiss Alps, Switzerland",
    link: "/destinations/swiss-alps",
    thumbnail: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=1000&auto=format&fit=crop",
  },
  {
    title: "Machu Picchu, Peru",
    link: "/destinations/machu-picchu",
    thumbnail: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=1000&auto=format&fit=crop",
  },
  {
    title: "Banff National Park, Canada",
    link: "/destinations/banff",
    thumbnail: "https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?q=80&w=1000&auto=format&fit=crop",
  },
  {
    title: "Maldives",
    link: "/destinations/maldives",
    thumbnail: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=1000&auto=format&fit=crop",
  },
  {
    title: "Bora Bora, French Polynesia",
    link: "/destinations/bora-bora",
    thumbnail: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1000&auto=format&fit=crop",
  },
  {
    title: "Patagonia, Chile",
    link: "/destinations/patagonia",
    thumbnail: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?q=80&w=1000&auto=format&fit=crop",
  },
  {
    title: "Cappadocia, Turkey",
    link: "/destinations/cappadocia",
    thumbnail: "https://images.unsplash.com/photo-1641128324972-af3212f0f624?q=80&w=1000&auto=format&fit=crop",
  },
  {
    title: "Petra, Jordan",
    link: "/destinations/petra",
    thumbnail: "https://images.unsplash.com/photo-1579606032851-073bc24e16ff?q=80&w=1000&auto=format&fit=crop",
  },
  {
    title: "Serengeti, Tanzania",
    link: "/destinations/serengeti",
    thumbnail: "https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=1000&auto=format&fit=crop",
  },
  {
    title: "Victoria Falls, Zambia",
    link: "/destinations/victoria-falls",
    thumbnail: "https://images.unsplash.com/photo-1603984362497-0a866f5fcbc3?q=80&w=1000&auto=format&fit=crop",
  },
  {
    title: "Great Barrier Reef, Australia",
    link: "/destinations/great-barrier-reef",
    thumbnail: "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?q=80&w=1000&auto=format&fit=crop",
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
