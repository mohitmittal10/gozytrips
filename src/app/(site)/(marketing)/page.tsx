import Hero from '@/components/sections/hero';
import { CleanTestimonialDemo } from '@/components/sections/clean-testimonial-demo';
import { HeroParallax } from '@/components/ui/hero-parallax';
import AnimatedTypography from '@/components/sections/animated-typography';
import CuratedItineraries from '@/components/sections/curated-itineraries';
import HowItWorksTimeline from '@/components/sections/how-it-works-timeline';
import { FeatureStepsDemo } from '@/components/sections/feature-steps-section';
import { PARALLAX_PRODUCTS } from '@/constants/marketing';

export default function Home() {
  return (
    <>
      <Hero />
      <HeroParallax products={PARALLAX_PRODUCTS} />
      <HowItWorksTimeline />
      <FeatureStepsDemo />
      <AnimatedTypography />
      <CuratedItineraries />
      <CleanTestimonialDemo />
    </>
  );
}
