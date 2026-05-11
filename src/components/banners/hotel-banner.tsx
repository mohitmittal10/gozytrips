"use client";

import { Hotel, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HotelInfo } from "@/components/hotel-flight-editor";

interface HotelBannerProps {
  hotel: HotelInfo;
}

export function HotelBanner({ hotel }: HotelBannerProps) {
  const hasImages = hotel.imageUrls && hotel.imageUrls.length > 0;
  return (
    <div className="flex flex-col gap-4 px-5 py-4 rounded-xl logistics-hotel-banner text-sm overflow-hidden">
      <div className="flex items-start gap-4">
        <Hotel className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-secondary text-base">{hotel.name || "Hotel"}</span>
            <span className="flex items-center gap-0.5">
              {Array.from({ length: hotel.starRating }, (_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              ))}
            </span>
            {hotel.bookingRef && (
              <span className="text-xs logistics-hotel-badge px-2 py-0.5 rounded-md font-medium">
                Ref: {hotel.bookingRef}
              </span>
            )}
          </div>
          <div className="text-foreground/70 text-xs mt-1">
            {hotel.address && <span>{hotel.address} • </span>}
            Check-in: {hotel.checkIn} • Check-out: {hotel.checkOut}
          </div>
        </div>
      </div>

      {hasImages && (
        <div className={cn(
          "mt-2 grid gap-3",
          hotel.imageUrls!.length === 1 ? "grid-cols-1" : "grid-cols-2"
        )}>
          {hotel.imageUrls!.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Hotel ${idx + 1}`}
              className={cn(
                "w-full object-cover rounded-lg shadow-sm border border-secondary/10",
                hotel.imageUrls!.length === 1 ? "h-64 sm:h-80" : "h-40 sm:h-48"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

