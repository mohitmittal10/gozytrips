"use client";

import { Plane } from "lucide-react";
import type { FlightInfo } from "@/components/hotel-flight-editor";

interface FlightBannerProps {
  flight: FlightInfo;
}

export function FlightBanner({ flight }: FlightBannerProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg logistics-flight-banner text-sm">
      <Plane className="w-4 h-4 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-primary">
            {flight.airline} {flight.flightNumber}
          </span>
          {flight.pnr && (
            <span className="text-xs logistics-flight-badge px-1.5 py-0.5 rounded">
              PNR: {flight.pnr}
            </span>
          )}
        </div>
        <div className="text-foreground/70 text-xs mt-0.5">
          {flight.departureAirport} → {flight.arrivalAirport}
          {(flight.departure || flight.arrival) && (
            <span className="ml-2">
              {flight.departure}{flight.departure && flight.arrival ? " – " : ""}{flight.arrival}
            </span>
          )}
          {flight.terminal && <span className="ml-2">Terminal {flight.terminal}</span>}
        </div>
      </div>
    </div>
  );
}

