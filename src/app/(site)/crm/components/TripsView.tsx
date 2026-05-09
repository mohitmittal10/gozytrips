"use client";

import React, { useMemo } from "react";
import {
    Compass,
    CalendarDays,
    Clock,
    GripVertical,
    Plane,
    Users,
    ArrowRight,
    DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getCurrencySymbol, formatMoney } from "@/lib/utils/currency";
import { DEFAULT_CURRENCY } from "@/types/pricing";
import { useAuth } from "@/contexts/auth-context";
import type { EnrichedClient } from "../utils/metrics-utils";
import type { FlatTrip } from "./TripDetailSheet";

interface TripsListViewProps {
    trips: FlatTrip[];
    loading: boolean;
    onTripClick: (trip: FlatTrip) => void;
}

interface TripsKanbanViewProps {
    trips: FlatTrip[];
    itineraryStatuses: { value: string; label: string; metadata?: any }[];
    onStatusChange: (tripId: string, newStatus: string) => void;
    onTripClick: (trip: FlatTrip) => void;
}

export interface TripsViewProps {
    enrichedClients: EnrichedClient[];
    tripsPipelineFilter: string;
    searchQuery: string;
    viewMode: "table" | "kanban";
    itineraryStatuses: { value: string; label: string; metadata?: any }[];
    loading: boolean;
    onTripClick: (trip: FlatTrip) => void;
    onStatusChange: (tripId: string, newStatus: string) => void;
}

/** Flatten all trips from all enriched clients into a single list */
export function flattenTrips(clients: EnrichedClient[]): FlatTrip[] {
    const result: FlatTrip[] = [];
    clients.forEach((client) => {
        (client.allTrips || []).forEach((trip: any) => {
            // Resolve destination label
            let destinations = trip.destinations || "";
            if (!destinations && trip.title) {
                destinations = trip.title.replace(/^Trip to\s+/i, "");
            }

            // Compute cost — prefer client_price, fall back to budget
            const tripCost =
                typeof trip.client_price === "number" && trip.client_price > 0
                    ? trip.client_price
                    : typeof trip.budget === "number" && trip.budget > 0
                    ? trip.budget
                    : 0;

            result.push({
                id: trip.id,
                title: trip.title || "Untitled Trip",
                status: trip.status || "draft",
                destinations,
                start_date: trip.start_date || "",
                end_date: trip.end_date || "",
                budget: trip.budget ?? null,
                client_price: trip.client_price ?? null,
                currency: trip.currency ?? null,
                adult_pax: trip.adult_pax ?? null,
                child_pax: trip.child_pax ?? null,
                infant_pax: trip.infant_pax ?? null,
                created_at: trip.created_at || "",
                updated_at: trip.updated_at || "",
                client_id: trip.client_id ?? null,
                clientName: client.name,
                clientEmail: client.email ?? null,
                tripCost,
            });
        });
    });
    return result;
}

/** Status pill color resolver */
function statusClasses(status: string): string {
    const s = status.toLowerCase();
    if (s === "booked" || s === "confirmed") return "bg-green-500/10 text-green-400 border-green-500/20";
    if (s === "sent") return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (s === "proposed") return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    if (s === "rejected") return "bg-red-500/10 text-red-400 border-red-500/20";
    if (s === "completed") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    return "bg-purple-500/10 text-purple-400 border-purple-500/20";
}

function formatShortDate(dateStr: string): string {
    if (!dateStr) return "—";
    try {
        return new Date(dateStr).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "2-digit",
        });
    } catch {
        return "—";
    }
}

/** Loading skeleton rows */
function SkeletonRows() {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                    <td className="p-4">
                        <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-white/5 rounded animate-pulse mt-1.5" />
                    </td>
                    <td className="p-4 hidden md:table-cell">
                        <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                        <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                        <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                    </td>
                    <td className="p-4">
                        <div className="h-6 w-20 bg-white/10 rounded-full animate-pulse" />
                    </td>
                    <td className="p-4">
                        <div className="h-8 w-8 bg-white/10 rounded-lg animate-pulse" />
                    </td>
                </tr>
            ))}
        </>
    );
}

/** List/table view for trips */
const TripsListView = ({ trips, loading, onTripClick }: TripsListViewProps) => {
    const { agencySettings } = useAuth();

    // We'll handle empty states inside the table body now to keep the header visible.

    return (
        <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
            <div className="crm-table-wrapper">
                <table className="w-full text-left border-collapse min-w-[640px]">
                    <thead>
                        <tr className="border-b border-white/10 text-gray-500 font-semibold">
                            <th className="p-4">Trip</th>
                            <th className="p-4 hidden md:table-cell">Destination</th>
                            <th className="p-4 hidden lg:table-cell">Dates</th>
                            <th className="p-4 hidden lg:table-cell">Client</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Cost</th>
                            <th className="p-4" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {!loading && trips.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <Plane className="w-10 h-10 opacity-20" />
                                        <p className="text-sm">No trips found matching your filters.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : loading ? (
                            <SkeletonRows />
                        ) : (
                            trips.map((trip) => {
                                const currencySymbol = getCurrencySymbol(
                                    trip.currency || agencySettings?.default_currency || DEFAULT_CURRENCY
                                );
                                return (
                                    <tr
                                        key={trip.id}
                                        className="hover:bg-white/[0.04] transition-colors group cursor-pointer"
                                        onClick={() => onTripClick(trip)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === "Enter" && onTripClick(trip)}
                                    >
                                        {/* Trip Name */}
                                        <td className="p-4">
                                            <p className="font-medium text-white text-sm group-hover:text-purple-300 transition-colors line-clamp-1">
                                                {trip.title}
                                            </p>
                                            {/* Show destination on mobile where separate column is hidden */}
                                            {trip.destinations && (
                                                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5 md:hidden">
                                                    {trip.destinations}
                                                </p>
                                            )}
                                        </td>

                                        {/* Destination */}
                                        <td className="p-4 hidden md:table-cell">
                                            {trip.destinations ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Compass className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                                    <span className="text-sm text-gray-300 line-clamp-1">
                                                        {trip.destinations}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-600">—</span>
                                            )}
                                        </td>

                                        {/* Dates */}
                                        <td className="p-4 hidden lg:table-cell">
                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                                                <span>{formatShortDate(trip.start_date)}</span>
                                                {trip.end_date && (
                                                    <>
                                                        <ArrowRight className="w-3 h-3 text-gray-600" />
                                                        <span>{formatShortDate(trip.end_date)}</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>

                                        {/* Client */}
                                        <td className="p-4 hidden lg:table-cell">
                                            {trip.clientName ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                                    <span className="text-xs text-gray-400 line-clamp-1">
                                                        {trip.clientName}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-600">—</span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="p-4">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "capitalize text-[10px] font-semibold px-2 py-0.5",
                                                    statusClasses(trip.status)
                                                )}
                                            >
                                                {trip.status}
                                            </Badge>
                                        </td>

                                        <td className="p-4 text-right">
                                            <span className="text-sm font-semibold text-purple-300">
                                                {trip.tripCost > 0
                                                    ? formatMoney(trip.tripCost, trip.currency || agencySettings?.default_currency || DEFAULT_CURRENCY)
                                                    : "—"}
                                            </span>
                                        </td>

                                        {/* Arrow */}
                                        <td className="p-4">
                                            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors" />
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

/** Kanban board grouped by status — each card is a trip */
const TripsKanbanView = ({
    trips,
    itineraryStatuses,
    onStatusChange,
    onTripClick,
}: TripsKanbanViewProps) => {
    const { agencySettings } = useAuth();

    const columns = useMemo(() => {
        const baseStatuses =
            itineraryStatuses.length > 0
                ? itineraryStatuses
                      .filter((opt) =>
                          ["draft", "proposed", "sent", "booked"].includes(opt.value)
                      )
                      .map((opt) => ({
                          key: opt.value,
                          label: opt.label,
                          borderColor: opt.metadata?.borderColor || "border-white/10",
                          dotColor: "bg-purple-400",
                      }))
                : [
                      { key: "draft", label: "Draft", borderColor: "border-purple-500/30", dotColor: "bg-purple-400" },
                      { key: "proposed", label: "Proposed", borderColor: "border-pink-500/30", dotColor: "bg-pink-400" },
                      { key: "sent", label: "Sent", borderColor: "border-blue-500/30", dotColor: "bg-blue-400" },
                      { key: "booked", label: "Booked", borderColor: "border-green-500/30", dotColor: "bg-green-400" },
                  ];

        // Map each column to its trips
        return baseStatuses.map((col) => ({
            ...col,
            trips: trips.filter(
                (t) =>
                    t.status.toLowerCase() === col.key ||
                    (col.key === "booked" && t.status.toLowerCase() === "confirmed")
            ),
        }));
    }, [trips, itineraryStatuses]);

    return (
        <div className="crm-kanban-grid">
            {columns.map((col) => (
                <div
                    key={col.key}
                    className={cn(
                        "bg-white/[0.02] border rounded-xl p-4 min-h-[300px] flex flex-col gap-3",
                        col.borderColor
                    )}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const tripId = e.dataTransfer.getData("text/plain");
                        if (tripId) onStatusChange(tripId, col.key);
                    }}
                >
                    {/* Column Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full", col.dotColor)} />
                            <h3 className="text-sm font-semibold text-gray-300">{col.label}</h3>
                        </div>
                        <span className="text-xs bg-white/5 text-gray-500 px-2 py-0.5 rounded-full">
                            {col.trips.length}
                        </span>
                    </div>

                    {/* Trip Cards */}
                    <div className="flex flex-col gap-2">
                        {col.trips.map((trip) => {
                            const currencySymbol = getCurrencySymbol(
                                trip.currency || agencySettings?.default_currency || DEFAULT_CURRENCY
                            );
                            return (
                                <div
                                    key={trip.id}
                                    draggable
                                    onDragStart={(e) => e.dataTransfer.setData("text/plain", trip.id)}
                                    onClick={() => onTripClick(trip)}
                                    className="p-3 bg-white/[0.04] border border-white/5 rounded-lg hover:border-white/20 hover:bg-white/[0.07] transition-all cursor-pointer group"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === "Enter" && onTripClick(trip)}
                                >
                                    <div className="flex items-start gap-1.5 mb-1.5">
                                        <GripVertical className="w-3 h-3 text-gray-700 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                        <p className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-purple-300 transition-colors">
                                            {trip.title}
                                        </p>
                                    </div>
                                    {trip.destinations && (
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1">
                                            <Compass className="w-3 h-3 text-purple-400 shrink-0" />
                                            <span className="truncate">{trip.destinations}</span>
                                        </div>
                                    )}
                                    {trip.clientName && (
                                        <div className="flex items-center gap-1 text-[10px] text-gray-600">
                                            <Users className="w-3 h-3 shrink-0" />
                                            <span className="truncate">{trip.clientName}</span>
                                        </div>
                                    )}
                                        <p className="text-[10px] text-purple-400 font-semibold mt-1.5">
                                            {formatMoney(trip.tripCost, trip.currency || agencySettings?.default_currency || DEFAULT_CURRENCY)}
                                        </p>
                                    {trip.start_date && (
                                        <p className="text-[10px] text-gray-600 mt-0.5">
                                            {formatShortDate(trip.start_date)}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                        {col.trips.length === 0 && (
                            <div className="flex items-center justify-center h-20 border-2 border-dashed border-white/5 rounded-lg">
                                <p className="text-[10px] text-gray-700">Drop here</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

/** Top-level TripsView: filters, flattens and delegates to list/kanban */
export const TripsView = ({
    enrichedClients,
    tripsPipelineFilter,
    searchQuery,
    viewMode,
    itineraryStatuses,
    loading,
    onTripClick,
    onStatusChange,
}: TripsViewProps) => {
    /** Flatten all trips and apply filters */
    const filteredTrips = useMemo(() => {
        let trips = flattenTrips(enrichedClients);

        // Exclude completed/rejected from the active trips view
        trips = trips.filter((t) => {
            const s = t.status.toLowerCase();
            return s !== "completed" && s !== "rejected";
        });

        // Pipeline stage filter
        if (tripsPipelineFilter !== "all") {
            trips = trips.filter(
                (t) =>
                    t.status.toLowerCase() === tripsPipelineFilter ||
                    (tripsPipelineFilter === "booked" && t.status.toLowerCase() === "confirmed")
            );
        }

        // Search filter (title, destination, client name)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            trips = trips.filter(
                (t) =>
                    t.title.toLowerCase().includes(q) ||
                    (t.destinations && t.destinations.toLowerCase().includes(q)) ||
                    (t.clientName && t.clientName.toLowerCase().includes(q))
            );
        }

        // Sort: most recently updated first
        trips.sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );

        return trips;
    }, [enrichedClients, tripsPipelineFilter, searchQuery]);

    return (
        <div className="space-y-4">
            {/* Row count */}
            <p className="text-xs text-gray-500">
                {filteredTrips.length} trip{filteredTrips.length !== 1 ? "s" : ""}
            </p>

            {viewMode === "kanban" ? (
                <TripsKanbanView
                    trips={filteredTrips}
                    itineraryStatuses={itineraryStatuses}
                    onStatusChange={onStatusChange}
                    onTripClick={onTripClick}
                />
            ) : (
                <TripsListView
                    trips={filteredTrips}
                    loading={loading}
                    onTripClick={onTripClick}
                />
            )}
        </div>
    );
};
