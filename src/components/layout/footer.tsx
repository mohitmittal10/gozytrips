import Link from "next/link";
import Logo from "./logo";
import { Button } from "../ui/button";
import { Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "About Us", href: "#about" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Contact Us", href: "#contact" },
    { name: "Packages", href: "#packages" },
    { name: "Gallery", href: "#gallery" },
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
  ];

  return (
    <footer className="glass-card mt-auto border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-4">
            <Logo />
            <p className="text-sm text-foreground/70">
              Curating unforgettable luxury travel experiences around the globe.
            </p>
          </div>

          <div className="md:col-span-1">
            <h3 className="font-headline text-lg font-semibold text-primary">Explore</h3>
            <ul className="mt-4 space-y-2">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-foreground/70 hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="font-headline text-lg font-semibold text-primary">Legal</h3>
            <ul className="mt-4 space-y-2">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-foreground/70 hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="font-headline text-lg font-semibold text-primary">Connect</h3>
            <div className="flex mt-4 space-x-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="#">
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="#">
                  <Facebook className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="#">
                  <Instagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-foreground/50">
          <p>&copy; {new Date().getFullYear()} Odyssey Luxe. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
