import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Hero from '@/components/sections/hero';
import Packages from '@/components/sections/packages';
import Gallery from '@/components/sections/gallery';
import Testimonials from '@/components/sections/testimonials';
import About from '@/components/sections/about';
import Contact from '@/components/sections/contact';
import AiArchitectCta from '@/components/sections/ai-architect-cta';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Hero />
        <About />
        <Packages />
        <AiArchitectCta />
        <Gallery />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
