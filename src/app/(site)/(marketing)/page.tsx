import Hero from '@/components/sections/hero';
import TrustedMarquee from '@/components/sections/trusted-marquee';
import { CleanTestimonialDemo } from '@/components/sections/clean-testimonial-demo';
import { HeroParallax } from '@/components/ui/hero-parallax';
import AnimatedTypography from '@/components/sections/animated-typography';
import CuratedItineraries from '@/components/sections/curated-itineraries';
import HowItWorksTimeline from '@/components/sections/how-it-works-timeline';
import FeaturesGrid from '@/components/sections/features-grid';
import Contact from '@/components/sections/contact';
import { PARALLAX_PRODUCTS } from '@/constants/marketing';

export const dynamic = 'force-static';

export default function Home() {
  return (
    <>
      <Hero />
      <TrustedMarquee />
      <HeroParallax products={PARALLAX_PRODUCTS} />
      <HowItWorksTimeline />
      <FeaturesGrid />
      <AnimatedTypography />
      <CuratedItineraries />
      <CleanTestimonialDemo />
      <Contact />
    </>
  );
}



