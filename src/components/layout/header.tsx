"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Menu, LogOut, User, MapPin, Users, Home, Info, Sparkles, CreditCard, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "./logo";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { useLabStore } from "@/store/the-lab/labStore";
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
  const isEditingInLab = useLabStore((state) => state.isEditing);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Home", url: "/", icon: Home },
    { name: "The Lab", url: "/the-lab", icon: Sparkles },
    { name: "Pricing", url: "/pricing", icon: CreditCard },
    { name: "CRM", url: "/crm", icon: Users },
    { name: "Why Us?", url: "/why-us", icon: Info },
  ];

  const isTheLabPage = pathname === '/the-lab' || (pathname ? pathname.startsWith('/the-lab') : false);
  const shouldBlurNavbar = isTheLabPage && isEditingInLab;

  return (
    <nav className={cn(
      "fixed top-0 w-full z-50 bg-[#020305]/80 backdrop-blur-2xl border-b border-white/5 transition-all duration-500 ease-in-out",
      scrolled ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100",
      shouldBlurNavbar && "blur-[1px] opacity-40 pointer-events-none"
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
                        <button className="text-slate-300 hover:text-white p-2 rounded-xl hover:bg-white/5 active:scale-95 transition-all">
                          <Menu className="h-5 w-5" />
                        </button>
                      </SheetTrigger>
                      <SheetContent side="right" className="bg-[#020305]/95 backdrop-blur-2xl border-l border-white/10 p-0 w-72 flex flex-col">
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <SheetDescription className="sr-only">Main navigation and account options</SheetDescription>
                        <div className="flex flex-col h-full">
                          <div className="p-6 border-b border-white/5">
                            <Logo />
                          </div>
                          <nav className="flex-grow flex flex-col space-y-2 p-4">
                            {navItems.map((item) => {
                              const isActive = pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url));
                              return (
                                <Link 
                                  key={item.name}
                                  href={item.url} 
                                  className={cn(
                                    "group px-4 py-3 rounded-2xl border border-transparent transition-all duration-300 flex items-center justify-between text-[15px] font-semibold",
                                    isActive
                                      ? "bg-primary/10 border-primary/20 text-white shadow-md shadow-primary/5"
                                      : "text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/5"
                                  )}
                                >
                                  <div className="flex items-center gap-3.5">
                                    <item.icon className={cn(
                                      "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                                      isActive ? "text-primary" : "text-slate-400 group-hover:text-primary"
                                    )} />
                                    <span>{item.name}</span>
                                  </div>
                                  <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                                </Link>
                              );
                            })}
                          </nav>
                          <div className="p-5 border-t border-white/5 space-y-4 bg-white/[0.01]">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 border border-primary/20 flex items-center justify-center font-black text-xs text-white shadow-inner">
                                {user?.email ? user.email.slice(0, 2).toUpperCase() : "U"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Signed In</p>
                                <p className="text-xs font-semibold text-white truncate">{user?.email}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Link href="/my-trips" className="w-full">
                                <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-300 border border-white/5 transition-all flex items-center justify-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-primary" /> Trips
                                </button>
                              </Link>
                              <Link href="/clients" className="w-full">
                                <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-300 border border-white/5 transition-all flex items-center justify-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-primary" /> Clients
                                </button>
                              </Link>
                            </div>
                            <button onClick={signOut} className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold border border-red-500/20 transition-all flex items-center justify-center gap-2">
                              <LogOut className="w-3.5 h-3.5" /> Sign Out
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
                        <button className="text-slate-300 hover:text-white p-2 rounded-xl hover:bg-white/5 active:scale-95 transition-all">
                          <Menu className="h-5 w-5" />
                        </button>
                      </SheetTrigger>
                      <SheetContent side="right" className="bg-[#020305]/95 backdrop-blur-2xl border-l border-white/10 p-0 w-72 flex flex-col">
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <SheetDescription className="sr-only">Site navigation links</SheetDescription>
                        <div className="flex flex-col h-full">
                          <div className="p-6 border-b border-white/5">
                            <Logo />
                          </div>
                          <nav className="flex-grow flex flex-col space-y-2 p-4">
                            {navItems.map((item) => {
                              const isActive = pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url));
                              return (
                                <Link 
                                  key={item.name}
                                  href={item.url} 
                                  className={cn(
                                    "group px-4 py-3 rounded-2xl border border-transparent transition-all duration-300 flex items-center justify-between text-[15px] font-semibold",
                                    isActive
                                      ? "bg-primary/10 border-primary/20 text-white shadow-md shadow-primary/5"
                                      : "text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/5"
                                  )}
                                >
                                  <div className="flex items-center gap-3.5">
                                    <item.icon className={cn(
                                      "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                                      isActive ? "text-primary" : "text-slate-400 group-hover:text-primary"
                                    )} />
                                    <span>{item.name}</span>
                                  </div>
                                  <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                                </Link>
                              );
                            })}
                          </nav>
                          <div className="p-5 border-t border-white/5 space-y-3 bg-white/[0.01]">
                            <Link href="/auth/login" className="block w-full">
                              <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white border border-white/10 transition-all flex items-center justify-center gap-2">
                                <User className="w-4 h-4 text-slate-400" /> Sign In
                              </button>
                            </Link>
                            <Link href="/auth/signup" className="block w-full">
                              <button className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-black glow-button transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                                <Sparkles className="w-4 h-4 text-white" /> Sign Up
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
