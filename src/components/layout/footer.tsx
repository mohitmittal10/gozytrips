"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./logo";
import { Button } from "../ui/button";
import { Sparkles, Globe, Users, Github, Twitter, Instagram, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const Footer = () => {
  const pathname = usePathname();

  if (pathname === "/the-lab") {
    return null;
  }

  const productLinks = [
    { name: "The Lab", href: "/the-lab" },
    { name: "Pricing Plans", href: "/pricing" },
    { name: "CRM Dashboard", href: "/crm" },
    { name: "Security & Trust", href: "/security" },
  ];

  const featureLinks = [
    { name: "PDF Formats", href: "/#curated" },
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Why Us?", href: "/why-us" },
  ];

  const companyLinks = [
    { name: "Testimonials", href: "/#testimonials" },
    { name: "Feedback & Support", href: "/#contact" },
    { name: "Privacy Policy", href: "/privacy" },
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/privacy#cookie" },
  ];

  const socialLinks = [
    { name: "Twitter", href: "https://x.com/wanderlabs", icon: <Twitter className="w-5 h-5" /> },
    { name: "Instagram", href: "https://instagram.com/wanderlabs", icon: <Instagram className="w-5 h-5" /> },
    { name: "GitHub", href: "https://github.com/wanderlabs", icon: <Github className="w-5 h-5" /> },
  ];

  return (
    <footer className="relative bg-black pt-24 pb-12 overflow-hidden border-t border-white/[0.05]">
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/[0.05] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/[0.05] rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        <div className="grid grid-cols-12 gap-y-12 lg:gap-8 mb-20">
          {/* Brand Section */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <div className="flex items-center gap-2">
              <Logo />
            </div>
            <p className="text-zinc-400 text-base max-w-sm leading-relaxed font-light">
              We empower travel agents with cutting-edge AI tools to craft breathtaking journeys. Experience the future of travel planning.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] hover:border-purple-500/30 transition-all duration-300"
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div className="col-span-4 sm:col-span-4 lg:col-span-2 space-y-6">
            <h3 className="text-white font-bold text-lg tracking-tight">Product</h3>
            <ul className="space-y-4">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-zinc-400 hover:text-purple-400 transition-colors duration-300 text-sm font-light">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-4 sm:col-span-4 lg:col-span-2 space-y-6">
            <h3 className="text-white font-bold text-lg tracking-tight">Features</h3>
            <ul className="space-y-4">
              {featureLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-zinc-400 hover:text-purple-400 transition-colors duration-300 text-sm font-light">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-4 sm:col-span-4 lg:col-span-2 space-y-6">
            <h3 className="text-white font-bold text-lg tracking-tight">Company</h3>
            <ul className="space-y-4">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-zinc-400 hover:text-purple-400 transition-colors duration-300 text-sm font-light">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter/CTA Section */}
          <div className="col-span-12 lg:col-span-3">
            <div className="p-6 sm:p-8 rounded-[2rem] bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-white font-bold text-xl mb-2">Start planning today</h3>
                <p className="text-zinc-400 text-sm mb-6 font-light leading-relaxed">
                  Join 500+ agents already using Wander Labs to elevate their business.
                </p>
                <Button asChild className="w-full bg-white text-black hover:bg-zinc-200 rounded-2xl h-12 font-bold transition-all duration-300 group/btn">
                  <Link href="/the-lab" className="flex items-center justify-center gap-2">
                    Launch The Lab
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/[0.05] flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-zinc-400 text-xs font-medium">
            &copy; {new Date().getFullYear()} Wander Labs. All rights reserved.
          </p>
          <div className="flex gap-8">
            {legalLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-zinc-500 hover:text-zinc-300 transition-colors duration-300 text-xs font-light"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Big Background Text */}
      <div className="absolute bottom-0 left-0 right-0 h-[10vw] overflow-hidden pointer-events-none select-none opacity-[0.05] z-0">
        <h2 className="text-[20vw] font-black tracking-tighter text-white text-center leading-[0.8] whitespace-nowrap m-0 p-0">
          WANDER LABS
        </h2>
      </div>
    </footer>
  );
};

export default Footer;

