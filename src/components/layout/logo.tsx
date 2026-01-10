import { cn } from "@/lib/utils";
import { Sailboat } from "lucide-react";
import Link from "next/link";

const Logo = ({ className }: { className?: string }) => {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <Sailboat className="h-6 w-6 text-primary" />
      <span className="font-headline text-xl font-bold text-foreground">
        Odyssey Luxe
      </span>
    </Link>
  );
};

export default Logo;
