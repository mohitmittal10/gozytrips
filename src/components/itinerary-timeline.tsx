"use client";

import type { TravelItineraryOutput } from "@/ai/flows/generate-travel-itinerary";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Calendar, Star, Clock, Footprints, Wallet, CheckCircle, ShipWheel, Mountain, Sun, Users, Camera, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

const ActivityDetail = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
    <div className="flex items-center gap-2 text-sm text-foreground/80">
        <Icon className="w-4 h-4 text-primary/80" />
        <span className="font-semibold">{label}:</span>
        <span>{value}</span>
    </div>
);

const ItineraryTimeline = ({ itinerary, isLoading }: ItineraryTimelineProps) => {
  if (isLoading) {
    return <ItineraryTimelineSkeleton />;
  }
  
  if (!itinerary || itinerary.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto space-y-16 py-8">
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
                <Calendar className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <Card className="glass-card ai-architect-page-card overflow-hidden">
              <CardHeader className="bg-white/5">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-headline text-lg text-primary/80">Day {day.day} - {day.date}</p>
                        <CardTitle className="font-headline text-3xl text-primary">{day.areaFocus}</CardTitle>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary">Morning: {day.morningRoute}</Badge>
                      <Badge variant="secondary">Afternoon: {day.afternoonRoute}</Badge>
                      <Badge variant="secondary">Evening: {day.eveningRoute}</Badge>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="py-6">
                <div className="space-y-8">
                    {day.timeline.map((step, stepIndex) => (
                        <div key={stepIndex} className="relative pl-8">
                            <div className="absolute left-0 top-1.5 h-full border-l-2 border-dashed border-primary/30"></div>
                            <div className="absolute -left-3 top-0 flex items-center justify-center w-6 h-6 bg-primary rounded-full text-primary-foreground font-bold text-xs">{stepIndex + 1}</div>
                            
                            <p className="font-bold text-primary text-lg">{step.time}</p>
                            <p className="text-foreground/80 mb-4">{step.details}</p>

                            {step.activity && (
                                <Card className="glass-card bg-white/5 my-4">
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-xl font-headline text-primary">{step.activity.name}</CardTitle>
                                            <div className="flex items-center">
                                                {[...Array(3)].map((_, i) => (
                                                    <Star key={i} className={cn("w-5 h-5", i < step.activity.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-500")} />
                                                ))}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <ActivityDetail icon={Clock} label="Duration" value={step.activity.duration} />
                                        <ActivityDetail icon={Wallet} label="Cost" value={step.activity.cost} />
                                        <ActivityDetail icon={Mountain} label="Energy" value={step.activity.energyLevel} />
                                        <ActivityDetail icon={CheckCircle} label="Booking" value={step.activity.bookingInfo} />
                                        <ActivityDetail icon={Camera} label="Instagrammable" value={step.activity.instagramWorthy ? "Yes" : "No"} />
                                        <ActivityDetail icon={Users} label="Kid-Friendly" value={step.activity.kidFriendly ? "Yes" : "No"} />
                                        <ActivityDetail icon={Sun} label="Weather" value={step.activity.weatherDependent ? "Dependent" : "Not Dependent"} />
                                        <div className="md:col-span-2 flex items-start gap-2 text-sm text-foreground/80">
                                            <Info className="w-4 h-4 text-primary/80 mt-1 flex-shrink-0" />
                                            <div><span className="font-semibold">Pro Tip: </span>{step.activity.proTip}</div>
                                        </div>
                                         <div className="md:col-span-2 flex items-start gap-2 text-sm text-foreground/80">
                                            <Info className="w-4 h-4 text-primary/80 mt-1 flex-shrink-0" />
                                            <div><span className="font-semibold">Why now: </span>{step.activity.whyNow}</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    ))}
                </div>
              </CardContent>
              <CardFooter className="bg-white/5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs p-4">
                    <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> <span>{day.dailyStats.attractionsVisited} Attractions</span></div>
                    <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-primary" /> <span>{day.dailyStats.totalCost} Total</span></div>
                    <div className="flex items-center gap-2"><Footprints className="w-4 h-4 text-primary" /> <span>{day.dailyStats.walkingDistance} Walk</span></div>
                    <div className="flex items-center gap-2"><ShipWheel className="w-4 h-4 text-primary" /> <span>{day.dailyStats.transitRides} Rides</span></div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> <span>{day.dailyStats.activeTime} Active</span></div>
                    <div className="flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> <span>{day.dailyStats.restTime} Rest</span></div>
              </CardFooter>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ItineraryTimeline;
