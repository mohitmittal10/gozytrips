import Link from "next/link";
import Logo from "./logo";
import { Button } from "../ui/button";
import { Facebook, Instagram, Twitter } from "lucide-react";
import { SparklesCore } from "@/components/ui/sparkles";

const Footer = () => {
  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/#about" },
    { name: "Testimonials", href: "/#testimonials" },
    { name: "Contact Us", href: "/#contact" },
    { name: "Packages", href: "/#packages" },
    { name: "Gallery", href: "/#gallery" },
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
  ];

  return (
    <footer className="relative mt-auto border-t bg-black overflow-hidden">
      {/* Sparkles background effect */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <SparklesCore
          id="footer-sparkles"
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={30}
          className="w-full h-full"
          particleColor="#FFFFFF"
          speed={0.5}
        />
        {/* Radial Gradient to fade out edges */}
        <div className="absolute inset-0 w-full h-full bg-black/50 [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
      </div>

      <div className="container relative z-20 mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Glow Header Area */}
        <div className="flex flex-col items-center justify-center mb-16 relative">
          <h2 className="md:text-6xl text-3xl lg:text-8xl font-bold text-center text-white relative z-20">
            Odyssey Luxe
          </h2>
          <div className="w-[40rem] max-w-full h-4 relative mt-2">
            <div className="absolute inset-x-10 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
            <div className="absolute inset-x-10 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
            <div className="absolute inset-x-1/4 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
            <div className="absolute inset-x-1/4 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-4">
            <div className="inline-block bg-black/40 p-2 rounded-lg backdrop-blur-sm border border-white/10">
              <Logo />
            </div>
            <p className="text-sm text-neutral-300">
              Curating unforgettable luxury travel experiences around the globe.
            </p>
          </div>

          <div className="md:col-span-1">
            <h3 className="font-headline text-lg font-semibold text-white/90">Explore</h3>
            <ul className="mt-4 space-y-2">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-neutral-400 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="font-headline text-lg font-semibold text-white/90">Legal</h3>
            <ul className="mt-4 space-y-2">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-neutral-400 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="font-headline text-lg font-semibold text-white/90">Connect</h3>
            <div className="flex mt-4 space-x-4">
              <Button variant="ghost" size="icon" className="hover:bg-white/10 text-neutral-400 hover:text-white" asChild>
                <Link href="#" target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-white/10 text-neutral-400 hover:text-white" asChild>
                <Link href="#" target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-white/10 text-neutral-400 hover:text-white" asChild>
                <Link href="#" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-center text-sm text-neutral-500">
          <p>&copy; {new Date().getFullYear()} Odyssey Luxe. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
