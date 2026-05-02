import React from "react";
import dynamic from "next/dynamic";
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    MapPin, Compass, History, Eye, Trash2, Clock 
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getAvatarColor, cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/types/financial";
import { DEFAULT_CURRENCY } from "@/types/pricing";
import { EnrichedClient } from "../utils/metrics-utils";

const ClientUpdateSuggestions = dynamic(() => import("@/components/client-update-suggestions"), { ssr: false });

interface ClientProfileSheetProps {
    selectedClient: EnrichedClient | null;
    setSelectedClient: (client: EnrichedClient | null) => void;
    statusHistory: Record<string, any[]>;
    itineraryStatuses: any[];
    handleStatusChange: (clientId: string, tripId: string, status: string) => void;
    handleDuplicateTrip: (trip: any) => void;
    handleDeleteTrip: (tripId: string) => void;
    deleting: string | null;
    setEditingClient: (client: EnrichedClient | null) => void;
    setIsEditDialogOpen: (open: boolean) => void;
    setShowModal: (show: boolean) => void;
    setSelectedTripForModal: (trip: any) => void;
    getAvatarColor: (name: string) => string;
    getTripCost: (trip: any) => number;
}

export const ClientProfileSheet = ({
    selectedClient,
    setSelectedClient,
    statusHistory,
    itineraryStatuses = [],
    handleStatusChange,
    handleDuplicateTrip,
    handleDeleteTrip,
    deleting,
    setEditingClient,
    setIsEditDialogOpen,
    setShowModal,
    setSelectedTripForModal,
    getAvatarColor,
    getTripCost
}: ClientProfileSheetProps) => {
    return (
        <Sheet open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
            <SheetContent className="bg-[#0A0A0A] border-l border-white/10 text-white w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">Client Profile</SheetTitle>
                    <SheetDescription className="text-gray-400">
                        Deep profile and trip history for {selectedClient?.name}.
                    </SheetDescription>
                </SheetHeader>

                {selectedClient && (
                    <div className="space-y-6">
                        <div className="p-5 glass-main border border-white/10 rounded-xl space-y-4">
                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white bg-gradient-to-br", getAvatarColor(selectedClient.name))}>
                                        {selectedClient.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">{selectedClient.name}</p>
                                        <p className="text-sm text-gray-400">Client since {new Date(selectedClient.created_at).getFullYear()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-8 border-white/10 bg-transparent text-gray-300 hover:bg-white/10 hover:text-white"
                                        onClick={() => {
                                            setEditingClient(selectedClient);
                                            setIsEditDialogOpen(true);
                                        }}>Edit Info</Button>
                                    <Button variant="outline" size="sm" className="h-8 border-purple-500/30 bg-purple-500/5 text-purple-400 hover:bg-purple-500/10"
                                        onClick={() => {
                                            window.open(`/architect?clientId=${selectedClient.id}`, '_blank');
                                        }}>New Itinerary</Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                                    <p className="font-medium text-sm text-gray-200 break-all">{selectedClient.email || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                                    <p className="font-medium text-sm text-gray-200">{selectedClient.phone || "N/A"}</p>
                                </div>
                            </div>
                            {selectedClient.notes && (
                                <div className="pt-2 border-t border-white/10">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                                    <p className="font-medium text-sm text-gray-200 whitespace-pre-wrap">{selectedClient.notes}</p>
                                </div>
                            )}
                            {selectedClient.tags && selectedClient.tags.length > 0 && (
                                <div className="pt-2 border-t border-white/10">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Tags</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedClient.tags.map((tag: string, idx: number) => (
                                            <Badge key={idx} variant="secondary" className="bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 font-normal px-2 py-0.5 text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Status Audit Trail */}
                        {selectedClient.latestTripId && (statusHistory[selectedClient.latestTripId]?.length ?? 0) > 0 && (
                            <div className="p-5 glass-main border border-white/10 rounded-xl">
                                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                    <History className="w-4 h-4 text-blue-400" /> Status History (Latest Trip)
                                </h3>
                                <div className="space-y-4 relative before:absolute before:left-1 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                                    {statusHistory[selectedClient.latestTripId!]?.map((entry, idx) => (
                                        <div key={idx} className="flex items-start gap-4 relative">
                                            <div className="w-2 h-2 rounded-full bg-purple-500 ring-4 ring-purple-500/10 mt-1.5 shrink-0 z-10" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs text-white">
                                                        Status → <span className="font-bold text-purple-400 capitalize">{entry.status}</span>
                                                    </p>
                                                    <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded italic">
                                                        {new Date(entry.timestamp).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-gray-500 mt-0.5">
                                                    by {entry.by} · {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-purple-400" /> Trip History
                                </h3>
                                <Badge variant="outline" className="text-[10px] border-white/10 text-gray-500">
                                    {selectedClient.allTrips?.length || 0} Trips
                                </Badge>
                            </div>
                            {selectedClient.allTrips && selectedClient.allTrips.length > 0 ? (
                                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[600px]">
                                            <thead>
                                                <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-gray-500 font-bold bg-white/[0.02]">
                                                    <th className="p-4">Status</th>
                                                    <th className="p-4">Destination</th>
                                                    <th className="p-4">Dates</th>
                                                    <th className="p-4">Cost</th>
                                                    <th className="p-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {selectedClient.allTrips.map((trip) => {
                                                    const tripCost = getTripCost(trip);
                                                    return (
                                                        <tr key={trip.id} className="hover:bg-white/[0.04] transition-colors group">
                                                            <td className="p-4">
                                                                <Select
                                                                    value={trip.status.toLowerCase()}
                                                                    onValueChange={(val) => handleStatusChange(selectedClient.id, trip.id, val)}
                                                                >
                                                                    <SelectTrigger className={cn(
                                                                        "h-7 border-0 shadow-none focus:ring-0 w-[110px] inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight",
                                                                        (() => {
                                                                            const s = trip.status.toLowerCase();
                                                                            const opt = itineraryStatuses.find(o => o.value === s);
                                                                            if (opt?.metadata?.bgColor) return `${opt.metadata.bgColor} ${opt.metadata.color ? `text-${opt.metadata.color}-400` : 'text-purple-400'}`;
                                                                            
                                                                            // Fallback styling
                                                                            if (s === 'booked' || s === 'confirmed') return 'bg-green-500/10 text-green-400';
                                                                            if (s === 'proposed' || s === 'sent') return 'bg-blue-500/10 text-blue-400';
                                                                            return 'bg-purple-500/10 text-purple-400';
                                                                        })()
                                                                    )}>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                                                                        {itineraryStatuses.length > 0 ? (
                                                                            itineraryStatuses.map(opt => (
                                                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                                            ))
                                                                        ) : (
                                                                            <>
                                                                                <SelectItem value="draft">Draft</SelectItem>
                                                                                <SelectItem value="proposed">Proposed</SelectItem>
                                                                                <SelectItem value="sent">Sent</SelectItem>
                                                                                <SelectItem value="booked">Booked</SelectItem>
                                                                                <SelectItem value="rejected">Rejected</SelectItem>
                                                                            </>
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <Compass className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                                                    {(() => {
                                                                        let label = trip.destinations && trip.destinations !== "" ? trip.destinations : "";
                                                                        if (!label && trip.title) {
                                                                            label = trip.title.replace(/^Trip to\s+/i, "");
                                                                        }
                                                                        if (!label && trip.itinerary_data?.itinerary) {
                                                                            const cities = trip.itinerary_data.itinerary
                                                                                .map((day: any) => day.areaFocus?.split(',')[0]?.trim())
                                                                                .filter(Boolean);
                                                                            const uniqueCities = Array.from(new Set(cities));
                                                                            if (uniqueCities.length > 0) {
                                                                                label = uniqueCities.join(", ");
                                                                            }
                                                                        }
                                                                        if (!label) {
                                                                            label = trip.starting_location;
                                                                        }
                                                                        return <p className="text-[13px] font-medium text-gray-100 line-clamp-1">{label}</p>;
                                                                    })()}
                                                                </div>
                                                                <p className="text-[11px] text-gray-500 line-clamp-1 ml-[21px]">
                                                                    {trip.starting_location}{trip.ending_location && trip.ending_location !== trip.starting_location ? ` \u2192 ${trip.ending_location}` : ''}
                                                                </p>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex flex-col text-[11px]">
                                                                    <span className="text-gray-200 font-medium">{new Date(trip.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                                                                    <span className="text-[10px] text-gray-500">
                                                                        {(() => {
                                                                            const start = new Date(trip.start_date);
                                                                            const end = new Date(trip.end_date);
                                                                            const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                                                            return `${diffDays}D/${diffDays - 1}N`;
                                                                        })()}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-sm font-semibold text-purple-400">
                                                                {tripCost > 0 ? `${getCurrencySymbol(agencySettings?.default_currency || DEFAULT_CURRENCY)}${tripCost.toLocaleString()}` : "N/A"}
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                                                                        onClick={() => {
                                                                            setSelectedTripForModal(trip);
                                                                            setShowModal(true);
                                                                        }}
                                                                        title="View Itinerary"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-full"
                                                                        onClick={() => handleDeleteTrip(trip.id)}
                                                                        disabled={deleting === trip.id}
                                                                        title="Delete Trip"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-xl space-y-3">
                                    <MapPin className="w-8 h-8 text-gray-700 mx-auto opacity-20" />
                                    <p className="text-gray-500 italic text-sm">No trip history found for this client.</p>
                                    <Button variant="ghost" className="text-purple-400 text-xs hover:bg-purple-500/5">Create first itinerary</Button>
                                </div>
                            )}
                        </div>

                        {/* AI Client Update Suggestions */}
                        {selectedClient.allTrips && selectedClient.allTrips.length > 0 && (() => {
                            const latestTrip = selectedClient.allTrips[0];
                            const tripCost = getTripCost(latestTrip);
                            const startDate = new Date(latestTrip.start_date);
                            const endDate = new Date(latestTrip.end_date);
                            const now = new Date();
                            const daysUntilTrip = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                            let destLabel = latestTrip.destinations || "";
                            if (!destLabel && latestTrip.title) destLabel = latestTrip.title.replace(/^Trip to\s+/i, "");
                            if (!destLabel) destLabel = latestTrip.starting_location || "Unknown";

                            const hotelNamesList = (latestTrip.itinerary_data?.hotels || [])
                                .map((h: any) => h.name).filter(Boolean).join(", ");

                            return (
                                <div className="pt-4 border-t border-white/5">
                                    <ClientUpdateSuggestions
                                        clientName={selectedClient.name}
                                        clientEmail={selectedClient.email}
                                        tripStatus={latestTrip.status || "draft"}
                                        destination={destLabel}
                                        travelDates={`${startDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                                        tripDuration={`${diffDays}D/${diffDays - 1}N`}
                                        totalCost={tripCost > 0 ? `${getCurrencySymbol(agencySettings?.default_currency || DEFAULT_CURRENCY)}${tripCost.toLocaleString()}` : undefined}
                                        daysUntilTrip={daysUntilTrip}
                                        hotelNames={hotelNamesList || undefined}
                                        hasFlights={(latestTrip.itinerary_data?.flights || []).length > 0}
                                    />
                                </div>
                            );
                        })()}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};
