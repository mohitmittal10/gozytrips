"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import AnimatedLogo from "../ui/animated-logo";

const Logo = ({ className, isLoading = false, hideText = false }: { className?: string, isLoading?: boolean, hideText?: boolean }) => {
  return (
    <Link href="/" className={cn("flex items-center gap-3 group", className)}>
      <AnimatedLogo isLoading={isLoading} size="md" className="flex-shrink-0" />
      {!hideText && (
        <span className="font-headline text-xl font-bold tracking-tight transition-all duration-300">
          <span className="text-foreground group-hover:text-purple-400">Wander</span> <span className="text-primary">Labs</span>
        </span>
      )}
    </Link>
  );
};

export default Logo;

