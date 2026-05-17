"use client";

import React, { useState, MouseEvent } from 'react';
import { Search } from 'lucide-react';
import { RippleButton } from './multi-type-ripple-buttons';
import { cn } from '@/lib/utils';

interface AnimatedGlassySearchBarProps {
  placeholder?: string;
  buttonText?: string;
  onSearch?: (value: string) => void;
  className?: string;
}

const AnimatedGlassySearchBar: React.FC<AnimatedGlassySearchBarProps> = ({
  placeholder = "Enter coordinates... (e.g. Delhi)",
  buttonText = "Initiate Plan",
  onSearch,
  className
}) => {
  const [value, setValue] = useState("");

  const handleSearch = (e?: React.FormEvent | MouseEvent) => {
    if (e) e.preventDefault();
    if (onSearch) onSearch(value);
  };

  return (
    <div className={cn("w-full max-w-xl sm:max-w-2xl relative group", className)}>
      <div className="absolute -inset-1 bg-indigo-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
      
      <form 
        onSubmit={handleSearch}
        className="relative p-[1px] rounded-2xl bg-white/10 group-hover:bg-indigo-500/30 transition-all duration-500"
      >
        <div className="relative flex flex-col xs:flex-row sm:flex-row gap-2 p-2 rounded-[15px] bg-[#05050a]/90 backdrop-blur-3xl">
          <div className="flex-grow flex items-center px-4 gap-3">
            <Search className="w-5 h-5 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="bg-transparent border-none focus:ring-0 text-white placeholder-zinc-700 text-sm sm:text-base w-full py-2 sm:py-2.5 font-medium outline-none"
            />
          </div>
          
          <div className="flex items-center gap-2 p-1">
            <RippleButton 
              type="submit"
              variant="hoverborder"
              hoverBorderEffectColor="#818cf8"
              onClick={handleSearch}
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-indigo-600 text-white font-black text-sm tracking-tight shadow-xl shadow-indigo-500/20"
            >
              {buttonText}
            </RippleButton>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AnimatedGlassySearchBar;
