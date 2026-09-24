"use client";

import React from 'react';

export const AppBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#EFECE5] dark:bg-[#030507] transition-colors duration-300">
      {/* Top Left Glow */}
      <div 
        className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-500/15 dark:bg-purple-500/10 rounded-full blur-[120px]"
        style={{ animationDuration: '8s', willChange: 'opacity', animation: 'pulse 8s ease-in-out infinite' }}
      />
      
      {/* Bottom Right Glow */}
      <div 
        className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/15 dark:bg-primary/10 rounded-full blur-[120px]"
        style={{ animationDuration: '12s', willChange: 'opacity', animation: 'pulse 12s ease-in-out infinite' }}
      />

      {/* Center Subtle Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-500/[0.05] dark:bg-indigo-500/[0.03] rounded-full blur-[150px]"
      />
    </div>
  );
};
