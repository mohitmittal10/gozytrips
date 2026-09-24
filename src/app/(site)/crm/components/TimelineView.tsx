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
import { getMergedPdfThemeOptions } from "@/components/pdf/theme-config";
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
    const pdfThemeOptions = getMergedPdfThemeOptions(themeOptions);
    const supabase = createClient();
    if (!hasTrips) {
        return (
            <div className="mt-4 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-16 text-center text-zinc-300 flex flex-col items-center justify-center">
                <Calendar className="w-12 h-12 text-slate-600 dark:text-zinc-400 mb-4 opacity-60" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Trips Yet</h3>
                <p className="text-slate-600 dark:text-zinc-400 text-sm">Create an itinerary in The Lab to see the timeline here.</p>
            </div>
        );
    }

    return (
        <div className="mt-4 space-y-6">
            {!selectedTripForModal ? (
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-xl rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                        Select a Client Trip to View Timeline
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-[50vh] overflow-y-auto pr-1">
                        {enrichedClients.filter(c => c.allTrips.length > 0).map(client => (
                            <div key={client.id} className="space-y-2">
                                <p className="text-[10px] text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider px-1">{client.name}</p>
                                {client.allTrips.map((trip: any) => (
                                    <button
                                        key={trip.id}
                                        onClick={() => setSelectedTripForModal(trip)}
                                        className="w-full flex flex-col p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-slate-200 dark:hover:bg-white/10 text-left transition-all group"
                                    >
                                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary">
                                            {trip.destinations || trip.title || 'Untitled Trip'}
                                        </p>
                                        <p className="text-[10px] text-slate-600 dark:text-zinc-400 mt-1">
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
                                className="h-8 text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl"
                                onClick={() => setSelectedTripForModal(null)}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Trips
                            </Button>
                            <p className="text-sm text-slate-600 dark:text-zinc-400">
                                Viewing: <span className="text-slate-900 dark:text-white font-semibold">{selectedTripForModal?.title || selectedTripForModal?.destinations || 'Trip Timeline'}</span>
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
                                <SelectTrigger className="w-[150px] bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white h-9 rounded-xl">
                                    <SelectValue placeholder="Format" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0c0c0e]/95 backdrop-blur-2xl border-slate-300 dark:border-white/10 text-slate-900 dark:text-white">
                                    {pdfThemeOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleDownloadPdf} className="px-4 py-2 aurora-gradient text-slate-900 dark:text-white border-none rounded-xl text-xs font-bold h-9 flex items-center gap-2 hover:brightness-110">
                                <Eye className="h-3.5 w-3.5" /> Export
                            </Button>
                        </div>
                    </div>
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-xl rounded-2xl p-6">
                        <ItineraryTimeline
                            itinerary={selectedTripForModal?.itinerary_data?.itinerary || []}
                            showDecorations={false}
                            destinations={selectedTripForModal?.destinations}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
