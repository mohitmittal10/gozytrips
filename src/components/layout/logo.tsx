import { cn } from "@/lib/utils";
import Link from "next/link";
import AnimatedLogo from "../ui/animated-logo";

const Logo = ({ className, isLoading = false, hideText = false }: { className?: string, isLoading?: boolean, hideText?: boolean }) => {
  return (
    <Link href="/" className={cn("flex items-center gap-3", className)}>
      <AnimatedLogo isLoading={isLoading} size="sm" className="text-primary" />
      {!hideText && (
        <span className="font-headline text-xl font-bold tracking-tight text-foreground">
          Wander Labs
        </span>
      )}
    </Link>
  );
};

export default Logo;

