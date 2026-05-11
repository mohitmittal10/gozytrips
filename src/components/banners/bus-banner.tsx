"use client";

import { Bus } from "lucide-react";
import type { BusInfo } from "@/components/hotel-flight-editor";

interface BusBannerProps {
  bus: BusInfo;
}

export function BusBanner({ bus }: BusBannerProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg logistics-bus-banner text-sm">
      <Bus className="w-4 h-4 text-yellow-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-yellow-500">
            {bus.busType || "Tourist Bus"} {bus.route && `— ${bus.route}`}
          </span>
          {bus.pnr && (
            <span className="text-xs logistics-bus-badge px-1.5 py-0.5 rounded">
              PNR: {bus.pnr}
            </span>
          )}
        </div>
        <div className="text-foreground/70 text-xs mt-0.5">
          {bus.reportingTime && <span>Reporting: {bus.reportingTime} • </span>}
          {bus.departureTime && <span>Departure: {bus.departureTime}</span>}
        </div>
      </div>
    </div>
  );
}

