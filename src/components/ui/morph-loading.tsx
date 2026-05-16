"use client"

import { cn } from "@/lib/utils"
import AnimatedLogo from "./animated-logo"

interface UniqueLoadingProps {
  variant?: "morph"
  size?: "sm" | "md" | "lg"
  className?: string
}

export default function UniqueLoading({
  variant = "morph",
  size = "md",
  className,
}: UniqueLoadingProps) {
  const containerSizes = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  }

  if (variant === "morph") {
    return (
      <div className={cn("relative flex items-center justify-center", containerSizes[size], className)}>
        <AnimatedLogo isLoading={true} size={size === "lg" ? "xl" : size} />
      </div>
    )
  }

  return null
}

