"use client";

import { Car } from "lucide-react";
import type { CabInfo } from "@/components/hotel-flight-editor";

interface CabBannerProps {
  cab: CabInfo;
}

export function CabBanner({ cab }: CabBannerProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg logistics-cab-banner text-sm">
      <Car className="w-4 h-4 text-orange-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-orange-500">
            {cab.vehicleType || "Cab"} {cab.route && `— ${cab.route}`}
          </span>
          {cab.bookingRef && (
            <span className="text-xs logistics-cab-badge px-1.5 py-0.5 rounded">
              Ref: {cab.bookingRef}
            </span>
          )}
        </div>
        <div className="text-foreground/70 text-xs mt-0.5">
          {cab.pickupTime && <span>Pickup: {cab.pickupTime} • </span>}
          {cab.driverName && <span>{cab.driverName} ({cab.driverContact})</span>}
        </div>
      </div>
    </div>
  );
}
