import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, DollarSign, Trash2, Eye, Heart } from 'lucide-react';
import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';

export interface SavedItinerary {
    id: string;
    title: string;
    description: string | null;
    starting_location: string;
    ending_location: string | null;
    start_date: string;
    end_date: string;
    budget: number | null;
    client_id: string | null;
    status: string;
    is_favourite: boolean | null;
    itinerary_data: TravelItineraryOutput;
    created_at: string;
    updated_at: string;
}

interface Client {
    id: string;
    name: string;
}

interface TripCardProps {
    trip: SavedItinerary;
    clients?: Client[];
    onToggleFavourite?: (trip: SavedItinerary) => void;
    onDuplicate?: (trip: SavedItinerary) => void;
    onView?: (trip: SavedItinerary) => void;
    onFinances?: (trip: SavedItinerary) => void;
    onDelete?: (id: string) => void;
    deletingId?: string | null;
}

export function TripCard({
    trip,
    clients = [],
    onToggleFavourite,
    onDuplicate,
    onView,
    onFinances,
    onDelete,
    deletingId
}: TripCardProps) {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <Card className="glass-main border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden group">
            <CardHeader className="pb-3 relative">
                <div className="flex justify-between items-start gap-2">
                    <div>
                        <CardTitle className="line-clamp-2">{trip.title}</CardTitle>
                        <CardDescription className="line-clamp-1">{trip.description}</CardDescription>
                    </div>
                    {onToggleFavourite && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onToggleFavourite(trip);
                            }}
                            className="text-pink-500 hover:bg-pink-500/10 -mt-1 -mr-2 rounded-full h-8 w-8 flex-shrink-0"
                        >
                            <Heart className="w-5 h-5" fill={trip.is_favourite ? "currentColor" : "none"} />
                        </Button>
                    )}
                </div>
                {(trip.client_id || trip.status) && (
                    <div className="flex items-center gap-2 mt-2">
                        {trip.client_id && clients.length > 0 && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs shadow-none">
                                {clients.find(c => c.id === trip.client_id)?.name || 'Unknown Client'}
                            </Badge>
                        )}
                        {trip.status && trip.status !== 'draft' && (
                            <Badge variant="secondary" className="text-xs capitalize shadow-none">
                                {trip.status}
                            </Badge>
                        )}
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-4 pb-4">
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-foreground/80">
                        <MapPin className="w-4 h-4 text-purple-400" />
                        <span>{trip.starting_location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground/80">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span>
                            {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                        </span>
                    </div>
                    {trip.budget && (
                        <div className="flex items-center gap-2 text-foreground/80">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            <span>₹{trip.budget} per day</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 pt-2">
                    {onDuplicate && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDuplicate(trip)}
                            className="glass-button border-white/20 flex-1 hover:text-primary transition-colors"
                            title="Duplicate & Customize"
                        >
                            Duplicate
                        </Button>
                    )}
                    {onView && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onView(trip)}
                            className="glass-button border-white/20 flex-1 gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            View
                        </Button>
                    )}
                    {onFinances && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onFinances(trip);
                            }}
                            className="glass-button border-white/20 flex-1 hover:text-green-400 gap-2"
                        >
                            <DollarSign className="w-4 h-4" />
                            Finances
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(trip.id)}
                            disabled={deletingId === trip.id}
                            className="glass-button border-white/20 text-red-400 hover:text-red-500"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
