"use client" 

import * as React from "react"
import { motion } from "motion/react";
 
export function ShiningText({text}: {text: string}) {
  return (
    <h1 className="text-base font-regular text-white/80">
      {text}
    </h1>
  );
}

