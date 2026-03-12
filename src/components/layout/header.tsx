"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, User, MapPin, Users, Home, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "./logo";
import { usePathname } from "next/navigation";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { useAuth } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Home", url: "/", icon: Home },
    { name: "AI Architect", url: "/ai-architect", icon: Sparkles },
    { name: "CRM", url: "/crm", icon: Users },
    { name: "Why Us?", url: "/#about", icon: Info },
  ];

  const isAiArchitectPage = pathname === '/ai-architect';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full pointer-events-none p-4 sm:p-6 lg:p-8 flex items-start justify-between">
      {/* Top Left Logo */}
      <div className="pointer-events-auto">
        <Logo />
      </div>

      {/* Floating Center Tubelight Navbar */}
      <NavBar items={navItems} />

      {/* Top Right Auth Section */}
      <div className="flex items-center gap-4 pointer-events-auto">
        {!loading && (
          <>
            {user ? (
              <>
                {/* Desktop Menu */}
                <div className="hidden sm:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="glass-button border-white/20">
                        <User className="w-4 h-4 mr-2" />
                        Account
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-main border-white/10 w-56">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium text-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">Logged in</p>
                      </div>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem asChild>
                        <Link href="/my-trips" className="cursor-pointer">
                          <MapPin className="w-4 h-4 mr-2" />
                          My Trips
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/clients" className="cursor-pointer">
                          <Users className="w-4 h-4 mr-2" />
                          Clients
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer">
                          <User className="w-4 h-4 mr-2" />
                          Profile Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-400 focus:text-red-400">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mobile Menu */}
                <div className="sm:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="glass-main">
                      <div className="flex flex-col h-full">
                        <div className="p-4 border-b border-white/10">
                          <Logo />
                        </div>
                        <nav className="flex-grow flex flex-col space-y-4 p-4">
                          {/* Standard Mobile Links */}
                          <Link href="/" className="text-lg font-medium hover:text-primary transition-colors flex items-center gap-2">
                            <Home className="w-5 h-5" /> Home
                          </Link>
                          <Link href="/ai-architect" className="text-lg font-medium hover:text-primary transition-colors flex items-center gap-2">
                            <Sparkles className="w-5 h-5" /> AI Architect
                          </Link>
                          <Link href="/crm" className="text-lg font-medium hover:text-primary transition-colors flex items-center gap-2">
                            <Users className="w-5 h-5" /> CRM
                          </Link>
                          <Link href="/#about" className="text-lg font-medium hover:text-primary transition-colors flex items-center gap-2">
                            <Info className="w-5 h-5" /> Why Us?
                          </Link>
                        </nav>
                        <div className="p-4 border-t border-white/10 space-y-2">
                          <p className="text-sm text-foreground/80">{user.email}</p>
                          <Link href="/my-trips">
                            <Button variant="outline" className="w-full glass-button border-white/20 justify-start">
                              <MapPin className="w-4 h-4 mr-2" />
                              My Trips
                            </Button>
                          </Link>
                          <Link href="/clients">
                            <Button variant="outline" className="w-full glass-button border-white/20 justify-start">
                              <Users className="w-4 h-4 mr-2" />
                              Clients
                            </Button>
                          </Link>
                          <Link href="/profile">
                            <Button variant="outline" className="w-full glass-button border-white/20 justify-start">
                              <User className="w-4 h-4 mr-2" />
                              Profile
                            </Button>
                          </Link>
                          <Button onClick={signOut} variant="destructive" className="w-full justify-start">
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            ) : (
              <>
                {/* Not Logged In - Desktop */}
                <div className="hidden sm:flex gap-3">
                  <Link href="/auth/login">
                    <Button variant="outline" size="sm" className="glass-button border-white/20">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="glass-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0">
                      Sign Up
                    </Button>
                  </Link>
                </div>

                {/* Not Logged In - Mobile */}
                <div className="sm:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="glass-main">
                      <div className="flex flex-col h-full">
                        <div className="p-4 border-b border-white/10">
                          <Logo />
                        </div>
                        <nav className="flex-grow flex flex-col space-y-4 p-4">
                          {/* Standard Mobile Links */}
                          <Link href="/" className="text-lg font-medium hover:text-primary transition-colors flex items-center gap-2">
                            <Home className="w-5 h-5" /> Home
                          </Link>
                          <Link href="/ai-architect" className="text-lg font-medium hover:text-primary transition-colors flex items-center gap-2">
                            <Sparkles className="w-5 h-5" /> AI Architect
                          </Link>
                          <Link href="/crm" className="text-lg font-medium hover:text-primary transition-colors flex items-center gap-2">
                            <Users className="w-5 h-5" /> CRM
                          </Link>
                          <Link href="/#about" className="text-lg font-medium hover:text-primary transition-colors flex items-center gap-2">
                            <Info className="w-5 h-5" /> Why Us?
                          </Link>
                        </nav>
                        <div className="p-4 border-t border-white/10 space-y-2">
                          <Link href="/auth/login">
                            <Button variant="outline" className="w-full glass-button border-white/20">
                              Sign In
                            </Button>
                          </Link>
                          <Link href="/auth/signup">
                            <Button className="w-full glass-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0">
                              Sign Up
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
