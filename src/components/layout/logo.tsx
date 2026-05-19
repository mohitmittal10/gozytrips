"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import AnimatedLogo from "../ui/animated-logo";

const Logo = ({ className, isLoading = false, hideText = false }: { className?: string, isLoading?: boolean, hideText?: boolean }) => {
  return (
    <Link href="/" className={cn("flex items-center gap-3 group", className)}>
      {isLoading ? (
        <AnimatedLogo isLoading={true} size="sm" className="text-primary" />
      ) : (
        <motion.div 
          className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10 shadow-[0_0_15px_rgba(124,58,237,0.15)] flex-shrink-0 bg-[#080810]"
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 0 20px rgba(124,58,237,0.4)"
          }}
          whileTap={{ scale: 0.95 }}
          animate={{ 
            y: [0, -2, 0]
          }}
          transition={{ 
            y: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          <motion.div
            className="w-full h-full relative"
            animate={{ 
              scale: [1, 1.08, 1],
              opacity: [0.85, 1, 0.85]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <Image
              src="/logo.png"
              alt="Wander Labs Logo"
              fill
              sizes="32px"
              className="object-cover"
              priority
            />
          </motion.div>
        </motion.div>
      )}
      {!hideText && (
        <span className="font-headline text-xl font-bold tracking-tight transition-all duration-300">
          <span className="text-foreground group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-500">Wander</span> <span className="text-primary">Labs</span>
        </span>
      )}
    </Link>
  );
};

export default Logo;

