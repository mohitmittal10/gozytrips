"use client";

import type { TravelItineraryOutput } from "@/ai/flows/generate-travel-itinerary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Calendar, CheckCircle2 } from "lucide-react";

type ItineraryTimelineProps = {
  itinerary: TravelItineraryOutput["itinerary"];
  isLoading?: boolean;
};

const ItineraryTimelineSkeleton = () => {
    return (
        <div className="relative space-y-8">
            <div className="absolute left-3 top-2 h-full w-0.5 bg-primary/20" />
            {[...Array(3)].map((_, index) => (
                <div key={index} className="relative flex items-start space-x-6">
                    <div className="flex-shrink-0">
                        <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                    <div className="flex-grow">
                        <Card className="glass-card animate-pulse">
                            <CardHeader>
                                <Skeleton className="h-6 w-1/4" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ))}
        </div>
    )
}

const ItineraryTimeline = ({ itinerary, isLoading }: ItineraryTimelineProps) => {
  if (isLoading) {
    return <ItineraryTimelineSkeleton />;
  }
  
  if (!itinerary || itinerary.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto space-y-12 py-8">
      <div className="absolute left-5 sm:left-1/2 top-4 h-[calc(100%-2rem)] w-1 bg-primary/20 transform sm:-translate-x-1/2" />

      {itinerary.map((day, index) => (
        <div
          key={day.day}
          className={cn(
            "relative flex items-start gap-6 sm:gap-12",
            index % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
          )}
        >
          <div className="relative flex-shrink-0">
            <div className="bg-background ring-4 ring-primary rounded-full p-2 absolute -left-1.5 top-0 z-10 sm:left-1/2 sm:-translate-x-1/2">
                <Calendar className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <Card className="glass-card">
              <CardHeader>
                <p className="font-headline text-lg text-primary/80">Day {day.day}</p>
                <CardTitle className="font-headline text-3xl text-primary">{day.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-8">
                  {day.activities.map((activity, i) => (
                    <li key={i} className="flex flex-col gap-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary/80 mt-1 flex-shrink-0" />
                        <p className="text-foreground/90 font-body text-base" dangerouslySetInnerHTML={{ __html: activity.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }}></p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ItineraryTimeline;
