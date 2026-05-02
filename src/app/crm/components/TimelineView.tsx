import React from "react";
import { ChevronLeft, Eye, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useReferenceOptions } from "@/hooks/use-reference-options";
import { createClient } from "@/lib/supabase/client";
import ItineraryTimeline from "@/components/itinerary-timeline";

interface TimelineViewProps {
    hasTrips: boolean;
    selectedTripForModal: any;
    setSelectedTripForModal: (trip: any) => void;
    setSelectedTheme: (theme: any) => void;
    handleDownloadPdf: () => void;
    enrichedClients: any[];
}

export const TimelineView = ({
    hasTrips,
    selectedTripForModal,
    setSelectedTripForModal,
    setSelectedTheme,
    handleDownloadPdf,
    enrichedClients
}: TimelineViewProps) => {
    const { options: themeOptions } = useReferenceOptions("pdf_theme");
    const supabase = createClient();
    if (!hasTrips) {
        return (
            <div className="mt-4 glass-main border border-white/10 rounded-xl p-16 text-center text-gray-400 flex flex-col items-center justify-center">
                <Calendar className="w-12 h-12 text-gray-600 mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No Trips Yet</h3>
                <p>Create an itinerary in the AI Architect to see the timeline here.</p>
            </div>
        );
    }

    return (
        <div className="mt-4 space-y-6">
            {!selectedTripForModal ? (
                <div className="glass-main border border-white/10 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                        Select a Client Trip to View Timeline
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-[50vh] overflow-y-auto pr-1">
                        {enrichedClients.filter(c => c.allTrips.length > 0).map(client => (
                            <div key={client.id} className="space-y-2">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider px-1">{client.name}</p>
                                {client.allTrips.map((trip: any) => (
                                    <button
                                        key={trip.id}
                                        onClick={() => setSelectedTripForModal(trip)}
                                        className="w-full flex flex-col p-3 rounded-lg bg-white/5 border border-white/5 hover:border-purple-500/30 text-left transition-all group"
                                    >
                                        <p className="text-xs font-medium text-white truncate group-hover:text-purple-300">
                                            {trip.destinations || trip.title || 'Untitled Trip'}
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            {new Date(trip.start_date).toLocaleDateString()} – {new Date(trip.end_date).toLocaleDateString()}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-gray-400 hover:text-white hover:bg-white/10"
                                onClick={() => setSelectedTripForModal(null)}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Trips
                            </Button>
                            <p className="text-sm text-gray-400">
                                Viewing: <span className="text-white font-medium">{selectedTripForModal?.title || selectedTripForModal?.destinations || 'Trip Timeline'}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Select 
                                defaultValue="classic" 
                                onValueChange={async (value) => {
                                    setSelectedTheme(value);
                                    if (selectedTripForModal) {
                                        await supabase
                                            .from('itineraries')
                                            .update({ selected_theme: value })
                                            .eq('id', selectedTripForModal.id);
                                    }
                                }}
                            >
                                <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white h-9">
                                    <SelectValue placeholder="Format" />
                                </SelectTrigger>
                                <SelectContent>
                                    {themeOptions.length > 0 ? (
                                        themeOptions.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))
                                    ) : (
                                        <>
                                            <SelectItem value="classic">Classic</SelectItem>
                                            <SelectItem value="editorial">Editorial</SelectItem>
                                            <SelectItem value="minimalist">Minimalist</SelectItem>
                                            <SelectItem value="dark">Dark Mode</SelectItem>
                                            <SelectItem value="corporate">Corporate</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleDownloadPdf} className="px-4 py-2 aurora-gradient text-white rounded-lg text-xs font-semibold h-9 flex items-center gap-2 border-none">
                                <Eye className="h-3.5 w-3.5" /> Export
                            </Button>
                        </div>
                    </div>
                    <div className="glass-main border border-white/10 rounded-xl p-6">
                        <ItineraryTimeline
                            itinerary={selectedTripForModal?.itinerary_data?.itinerary || []}
                            showDecorations={false}
                            hotels={(selectedTripForModal?.itinerary_data as any)?.hotels || []}
                            flights={(selectedTripForModal?.itinerary_data as any)?.flights || []}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
