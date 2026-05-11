"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Menu, LogOut, User, MapPin, Users, Home, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "./logo";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
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
    { name: "The Lab", url: "/the-lab", icon: Sparkles },
    { name: "CRM", url: "/crm", icon: Users },
    { name: "Why Us?", url: "/#about", icon: Info },
  ];

  const isTheLabPage = pathname === '/the-lab';

  return (
    <nav className={cn(
      "fixed top-0 w-full z-50 bg-[#020305]/60 backdrop-blur-2xl border-b border-white/5 transition-all duration-500 ease-in-out",
      scrolled ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
    )}>
      <div className="flex justify-between items-center px-4 sm:px-8 py-3 sm:py-4 max-w-7xl mx-auto">
        <Logo />
        
        <div className="hidden md:flex space-x-10 items-center">
          {navItems.map((item) => (
            <Link 
              key={item.name}
              className={cn(
                "text-sm tracking-tight transition-colors font-medium",
                pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url))
                  ? "text-primary font-bold"
                  : "text-slate-400 hover:text-white"
              )} 
              href={item.url}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-4 sm:space-x-6">
          {!loading && (
            <>
              {user ? (
                <>
                  <div className="hidden sm:block">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-slate-300 text-sm font-medium hover:text-white transition-colors flex items-center gap-2">
                          <User className="w-4 h-4" /> Account
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0A0A0B] border-white/10 w-56">
                        <div className="px-2 py-1.5">
                          <p className="text-sm font-medium text-white">{user.email}</p>
                          <p className="text-xs text-slate-400">Logged in</p>
                        </div>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem asChild>
                          <Link href="/my-trips" className="cursor-pointer text-slate-300 hover:text-white hover:bg-white/5">
                            <MapPin className="w-4 h-4 mr-2" /> My Trips
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/clients" className="cursor-pointer text-slate-300 hover:text-white hover:bg-white/5">
                            <Users className="w-4 h-4 mr-2" /> Clients
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/profile" className="cursor-pointer text-slate-300 hover:text-white hover:bg-white/5">
                            <User className="w-4 h-4 mr-2" /> Profile Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400">
                          <LogOut className="w-4 h-4 mr-2" /> Sign Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {/* Mobile Menu */}
                  <div className="md:hidden">
                    <Sheet>
                      <SheetTrigger asChild>
                        <button className="text-slate-300 hover:text-white p-2">
                          <Menu className="h-5 w-5" />
                        </button>
                      </SheetTrigger>
                      <SheetContent side="right" className="bg-[#020305] border-l border-white/10 p-0 w-72">
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <SheetDescription className="sr-only">Main navigation and account options</SheetDescription>
                        <div className="flex flex-col h-full">
                          <div className="p-6 border-b border-white/10">
                            <Logo />
                          </div>
                          <nav className="flex-grow flex flex-col space-y-6 p-6">
                            {navItems.map((item) => (
                              <Link 
                                key={item.name}
                                href={item.url} 
                                className="text-lg font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-3"
                              >
                                <item.icon className="w-5 h-5 text-primary" /> {item.name}
                              </Link>
                            ))}
                          </nav>
                          <div className="p-6 border-t border-white/10 space-y-4">
                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                            <div className="grid grid-cols-2 gap-2">
                              <Link href="/my-trips">
                                <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-slate-300 flex justify-center border border-white/5">
                                  Trips
                                </button>
                              </Link>
                              <Link href="/clients" className="col-span-2">
                                <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-slate-300 flex justify-center border border-white/5">
                                  Clients
                                </button>
                              </Link>
                            </div>
                            <button onClick={signOut} className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium border border-red-500/20 transition-colors flex items-center justify-center gap-2">
                              <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="hidden sm:block">
                    <button className="text-slate-300 text-sm font-medium hover:text-white transition-colors">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/auth/signup">
                    <button className="bg-primary text-white px-5 sm:px-7 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-extrabold glow-button transform hover:scale-105 active:scale-95 transition-all">
                      Sign Up
                    </button>
                  </Link>
                  {/* Mobile Menu */}
                  <div className="md:hidden">
                    <Sheet>
                      <SheetTrigger asChild>
                        <button className="text-slate-300 hover:text-white p-2">
                          <Menu className="h-5 w-5" />
                        </button>
                      </SheetTrigger>
                      <SheetContent side="right" className="bg-[#020305] border-l border-white/10 p-0 w-72">
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <SheetDescription className="sr-only">Site navigation links</SheetDescription>
                        <div className="flex flex-col h-full">
                          <div className="p-6 border-b border-white/10">
                            <Logo />
                          </div>
                          <nav className="flex-grow flex flex-col space-y-6 p-6">
                            {navItems.map((item) => (
                              <Link 
                                key={item.name}
                                href={item.url} 
                                className="text-lg font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-3"
                              >
                                <item.icon className="w-5 h-5 text-primary" /> {item.name}
                              </Link>
                            ))}
                          </nav>
                          <div className="p-6 border-t border-white/10 space-y-3">
                            <Link href="/auth/login" className="block w-full">
                              <button className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white font-medium border border-white/10 transition-colors">
                                Sign In
                              </button>
                            </Link>
                            <Link href="/auth/signup" className="block w-full">
                              <button className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-bold glow-button transition-colors">
                                Sign Up
                              </button>
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
      </div>
    </nav>
  );
};

export default Header;

