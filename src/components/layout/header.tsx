"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "./logo";
import { usePathname } from "next/navigation";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/#about" },
    { name: "Packages", href: "/#packages" },
    { name: "AI Architect", href: "/ai-architect" },
    { name: "Gallery", href: "/#gallery" },
    { name: "Testimonials", href: "/#testimonials" },
    { name: "Contact", href: "/#contact" },
  ];
  
  const isAiArchitectPage = pathname === '/ai-architect';

  return (
    <header
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full transition-all duration-300",
        scrolled || isAiArchitectPage ? "max-w-5xl" : "max-w-full"
      )}
    >
      <div className={cn(
        "container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-300",
        scrolled || isAiArchitectPage ? "py-2 glass-main rounded-lg" : "py-4"
        )}>
        <Logo />
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="glass-main">
              <div className="flex flex-col h-full">
                <div className="p-4">
                  <Logo />
                </div>
                <nav className="flex-grow flex flex-col space-y-4 p-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="text-lg font-medium hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
