"use client";

import React from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Compass,
    CalendarDays,
    User,
    DollarSign,
    Eye,
    Trash2,
    Copy,
    MapPin,
    Clock,
    Users,
    Plane,
    ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/types/financial";
import { DEFAULT_CURRENCY } from "@/types/pricing";
import { useAuth } from "@/contexts/auth-context";

/** Flat trip shape used in the Trips view — itinerary row augmented with clientName */
export interface FlatTrip {
    id: string;
    title: string;
    status: string;
    destinations: string;
    start_date: string;
    end_date: string;
    budget: number | null;
    client_price: number | null;
    currency: string | null;
    adult_pax: number | null;
    child_pax: number | null;
    infant_pax: number | null;
    created_at: string;
    updated_at: string;
    client_id: string | null;
    clientName: string | null;
    clientEmail: string | null;
    tripCost: number;
}

interface TripDetailSheetProps {
    trip: FlatTrip | null;
    onClose: () => void;
    itineraryStatuses: { value: string; label: string; metadata?: any }[];
    onStatusChange: (tripId: string, newStatus: string) => void;
    onViewItinerary: (trip: FlatTrip) => void;
    onDuplicate: (trip: FlatTrip) => void;
    onDelete: (tripId: string) => void;
    deleting: string | null;
}

/** Returns Tailwind classes for a status badge */
function getStatusClasses(status: string): string {
    const s = status.toLowerCase();
    if (s === "booked" || s === "confirmed") return "bg-green-500/10 text-green-400 border-green-500/20";
    if (s === "sent") return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (s === "proposed") return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    if (s === "rejected") return "bg-red-500/10 text-red-400 border-red-500/20";
    if (s === "completed") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    return "bg-purple-500/10 text-purple-400 border-purple-500/20";
}

/** Compute trip duration string e.g. "7D/6N" */
function formatDuration(start: string, end: string): string {
    try {
        const s = new Date(start);
        const e = new Date(end);
        const days = Math.max(1, Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        return `${days}D/${days - 1}N`;
    } catch {
        return "—";
    }
}

export const TripDetailSheet = ({
    trip,
    onClose,
    itineraryStatuses,
    onStatusChange,
    onViewItinerary,
    onDuplicate,
    onDelete,
    deleting,
}: TripDetailSheetProps) => {
    const { agencySettings } = useAuth();
    const currencySymbol = getCurrencySymbol(
        trip?.currency || agencySettings?.default_currency || DEFAULT_CURRENCY
    );

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "—";
        try {
            return new Date(dateStr).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        } catch {
            return "—";
        }
    };

    const totalPax =
        (trip?.adult_pax ?? 0) + (trip?.child_pax ?? 0) + (trip?.infant_pax ?? 0);

    return (
        <Sheet open={!!trip} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="bg-[#0A0A0A] border-l border-white/10 text-white w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                        Trip Details
                    </SheetTitle>
                    <SheetDescription className="text-gray-400 line-clamp-2">
                        {trip?.title || "Untitled Trip"}
                    </SheetDescription>
                </SheetHeader>

                {trip && (
                    <div className="space-y-5">
                        {/* --- Core Info Card --- */}
                        <div className="p-5 bg-white/[0.03] border border-white/10 rounded-xl space-y-4">
                            {/* Title + Status Row */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-lg font-semibold text-white leading-snug truncate">
                                        {trip.title || "Untitled Trip"}
                                    </p>
                                    {trip.clientName && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <User className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                            <p className="text-sm text-gray-400 truncate">{trip.clientName}</p>
                                            {trip.clientEmail && (
                                                <p className="text-xs text-gray-600 hidden sm:block truncate">
                                                    · {trip.clientEmail}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "shrink-0 capitalize text-xs font-semibold px-2.5 py-0.5",
                                        getStatusClasses(trip.status)
                                    )}
                                >
                                    {trip.status}
                                </Badge>
                            </div>

                            {/* Destination */}
                            {trip.destinations && (
                                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                    <Compass className="w-4 h-4 text-purple-400 shrink-0" />
                                    <p className="text-sm text-gray-200">{trip.destinations}</p>
                                </div>
                            )}
                        </div>

                        {/* --- Stats Grid --- */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Dates */}
                            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <CalendarDays className="w-4 h-4 text-blue-400" />
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Dates</p>
                                </div>
                                <p className="text-sm font-medium text-white">{formatDate(trip.start_date)}</p>
                                {trip.end_date && (
                                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                        <ArrowRight className="w-3 h-3" />
                                        {formatDate(trip.end_date)}
                                    </p>
                                )}
                                {trip.start_date && trip.end_date && (
                                    <p className="text-xs text-purple-400 mt-1 font-semibold">
                                        {formatDuration(trip.start_date, trip.end_date)}
                                    </p>
                                )}
                            </div>

                            {/* Cost */}
                            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="w-4 h-4 text-green-400" />
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Cost</p>
                                </div>
                                <p className="text-lg font-bold text-white">
                                    {trip.tripCost > 0
                                        ? `${currencySymbol}${trip.tripCost.toLocaleString()}`
                                        : "N/A"}
                                </p>
                                {trip.budget && trip.budget > 0 && trip.budget !== trip.tripCost && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Budget: {currencySymbol}{trip.budget.toLocaleString()}
                                    </p>
                                )}
                            </div>

                            {/* Pax */}
                            {totalPax > 0 && (
                                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="w-4 h-4 text-amber-400" />
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Travellers</p>
                                    </div>
                                    <p className="text-sm font-medium text-white">{totalPax} pax</p>
                                    <div className="flex gap-2 mt-1 text-[10px] text-gray-500">
                                        {(trip.adult_pax ?? 0) > 0 && <span>{trip.adult_pax}A</span>}
                                        {(trip.child_pax ?? 0) > 0 && <span>{trip.child_pax}C</span>}
                                        {(trip.infant_pax ?? 0) > 0 && <span>{trip.infant_pax}I</span>}
                                    </div>
                                </div>
                            )}

                            {/* Last Updated */}
                            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Updated</p>
                                </div>
                                <p className="text-sm font-medium text-white">{formatDate(trip.updated_at)}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Created {formatDate(trip.created_at)}
                                </p>
                            </div>
                        </div>

                        {/* --- Status Change --- */}
                        <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
                                <Plane className="w-3.5 h-3.5" />
                                Change Status
                            </p>
                            <Select
                                value={trip.status.toLowerCase()}
                                onValueChange={(val) => onStatusChange(trip.id, val)}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                                    {itineraryStatuses.length > 0 ? (
                                        itineraryStatuses.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="proposed">Proposed</SelectItem>
                                            <SelectItem value="sent">Sent</SelectItem>
                                            <SelectItem value="booked">Booked</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* --- Actions --- */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <Button
                                className="flex-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 h-10"
                                variant="outline"
                                onClick={() => onViewItinerary(trip)}
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                View Itinerary
                            </Button>
                            <Button
                                className="flex-1 border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 h-10"
                                variant="outline"
                                onClick={() => onDuplicate(trip)}
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                            </Button>
                            <Button
                                className="sm:flex-none border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 h-10 px-3"
                                variant="outline"
                                onClick={() => onDelete(trip.id)}
                                disabled={deleting === trip.id}
                            >
                                {deleting === trip.id ? (
                                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};
