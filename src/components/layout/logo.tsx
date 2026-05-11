import { cn } from "@/lib/utils";
import { Compass } from "lucide-react";
import Link from "next/link";

const Logo = ({ className }: { className?: string }) => {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <Compass className="h-6 w-6 text-primary" />
      <span className="font-headline text-xl font-bold text-foreground">
        Wander Labs
      </span>
    </Link>
  );
};

export default Logo;

