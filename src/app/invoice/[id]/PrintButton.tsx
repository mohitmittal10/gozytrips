"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="gap-2 print:hidden"
    >
      <Printer className="w-4 h-4" />
      Print Invoice
    </Button>
  );
}
