import React from "react";
import { Compass, Plus, Eye, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EditItineraryViewProps {
    enrichedClients: any[];
    itineraryStatuses: any[];
    setSelectedTripForModal: (trip: any) => void;
    setShowModal: (show: boolean) => void;
    handleDuplicateTrip: (trip: any) => void;
    handleDeleteTrip: (tripId: string) => void;
    deleting: string | null;
}

export const EditItineraryView = ({
    enrichedClients,
    itineraryStatuses = [],
    setSelectedTripForModal,
    setShowModal,
    handleDuplicateTrip,
    handleDeleteTrip,
    deleting
}: EditItineraryViewProps) => {
    const hasAnyTrips = enrichedClients.some(c => c.allTrips.length > 0);

    if (!hasAnyTrips) {
        return (
            <div className="mt-4 glass-main border border-white/10 rounded-xl p-16 text-center text-gray-400 flex flex-col items-center justify-center">
                <Compass className="w-12 h-12 text-gray-600 mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No Itineraries to Edit</h3>
                <p className="mb-4">Create a new itinerary in the AI Architect to get started.</p>
                <Link href="/ai-architect">
                    <Button className="px-6 py-2.5 aurora-gradient text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2 h-10 border-none">
                        <Plus className="w-4 h-4" /> Create New Itinerary
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="mt-4 space-y-6">
            <div className="space-y-4">
                <div className="glass-main border border-white/10 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                        <Compass className="w-4 h-4 text-purple-400" /> Select a Trip to Edit
                    </h3>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                        {enrichedClients.filter(c => c.allTrips.length > 0).map(client => (
                            <div key={client.id} className="space-y-1">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider px-2 pt-2">{client.name}</p>
                                {client.allTrips.map((trip: any) => {
                                    let label = trip.destinations || trip.title?.replace(/^Trip to\s+/i, '') || trip.starting_location || 'Untitled Trip';
                                    const start = new Date(trip.start_date);
                                    const end = new Date(trip.end_date);
                                    const diffTime = Math.abs(end.getTime() - start.getTime());
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                    
                                    return (
                                        <div key={trip.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all group">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Compass className="w-4 h-4 text-purple-400 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-white truncate">{label}</p>
                                                    <p className="text-[10px] text-gray-500">
                                                        {start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {diffDays}D/{diffDays - 1}N
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 font-bold">
                                                <span className={cn(
                                                    "text-[10px] uppercase px-2 py-0.5 rounded-full",
                                                    (() => {
                                                        const s = trip.status.toLowerCase();
                                                        const opt = itineraryStatuses.find(o => o.value === s);
                                                        if (opt?.metadata?.bgColor) return `${opt.metadata.bgColor} ${opt.metadata.color ? `text-${opt.metadata.color}-400` : 'text-purple-400'}`;
                                                        
                                                        if (s === 'booked' || s === 'confirmed') return 'bg-green-500/10 text-green-400';
                                                        if (s === 'proposed' || s === 'sent') return 'bg-blue-500/10 text-blue-400';
                                                        return 'bg-purple-500/10 text-purple-400';
                                                    })()
                                                )}>
                                                    {itineraryStatuses.find(opt => opt.value === trip.status.toLowerCase())?.label || trip.status}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-gray-400 hover:text-white hover:bg-white/10"
                                                    onClick={() => { setSelectedTripForModal(trip); setShowModal(true); }}
                                                    title="View Itinerary"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10"
                                                    onClick={() => handleDuplicateTrip(trip)}
                                                    title="Open in AI Architect"
                                                >
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-gray-500 hover:text-red-400 hover:bg-red-400/10"
                                                    onClick={() => handleDeleteTrip(trip.id)}
                                                    disabled={deleting === trip.id}
                                                    title="Delete Trip"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
