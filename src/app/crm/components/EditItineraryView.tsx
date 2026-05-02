"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Compass,
    Plus,
    Eye,
    Trash2,
    Search,
    RefreshCw,
    Pencil,
    CalendarDays,
    Users,
    Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

/** Minimal itinerary shape returned by the DB query */
interface ItineraryRow {
    id: string;
    title: string | null;
    status: string;
    destinations: string | null;
    start_date: string | null;
    end_date: string | null;
    adult_pax: number | null;
    child_pax: number | null;
    infant_pax: number | null;
    client_id: string | null;
    updated_at: string;
    created_at: string;
    client_name?: string | null; // joined via clients table
}

interface EditItineraryViewProps {
    itineraryStatuses: { value: string; label: string; metadata?: any }[];
    setSelectedTripForModal: (trip: any) => void;
    setShowModal: (show: boolean) => void;
    handleDuplicateTrip: (trip: any) => void;
    handleDeleteTrip: (tripId: string) => void;
    deleting: string | null;
    /** Called when the user clicks the pencil icon to open in AI Architect */
    onEditInArchitect?: (tripId: string) => void;
}

/** Safe duration string e.g. "7D/6N", or null if dates are missing */
function formatDuration(start: string | null, end: string | null): string | null {
    if (!start || !end) return null;
    try {
        const s = new Date(start);
        const e = new Date(end);
        const days = Math.max(1, Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        return `${days}D/${days - 1}N`;
    } catch {
        return null;
    }
}

function formatDate(dateStr: string | null): string {
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

function statusClasses(
    status: string,
    statuses: { value: string; label: string; metadata?: any }[]
): string {
    const s = status.toLowerCase();
    const opt = statuses.find((o) => o.value === s);
    if (opt?.metadata?.bgColor) {
        return `${opt.metadata.bgColor} ${opt.metadata.color ? `text-${opt.metadata.color}-400` : "text-purple-400"}`;
    }
    if (s === "booked" || s === "confirmed") return "bg-green-500/10 text-green-400";
    if (s === "sent") return "bg-blue-500/10 text-blue-400";
    if (s === "proposed") return "bg-cyan-500/10 text-cyan-400";
    if (s === "rejected") return "bg-red-500/10 text-red-400";
    if (s === "completed") return "bg-emerald-500/10 text-emerald-400";
    return "bg-purple-500/10 text-purple-400";
}

export const EditItineraryView = ({
    itineraryStatuses,
    setSelectedTripForModal,
    setShowModal,
    handleDuplicateTrip,
    handleDeleteTrip,
    deleting,
}: EditItineraryViewProps) => {
    const { user } = useAuth();
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    const [itineraries, setItineraries] = useState<ItineraryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isRefreshing, setIsRefreshing] = useState(false);

    /** Fetch all itineraries for this user with their client name via join */
    const fetchItineraries = useCallback(async (showRefreshSpinner = false) => {
        if (!user?.id) return;

        if (showRefreshSpinner) setIsRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from("itineraries")
                .select(
                    "id, title, status, destinations, start_date, end_date, adult_pax, child_pax, infant_pax, client_id, updated_at, created_at, clients(name)"
                )
                .eq("user_id", user.id)
                .order("updated_at", { ascending: false });

            if (fetchError) throw fetchError;

            // Normalise the joined client name
            const rows: ItineraryRow[] = (data || []).map((row: any) => ({
                ...row,
                client_name: row.clients?.name ?? null,
                clients: undefined, // drop the nested object
            }));

            setItineraries(rows);
        } catch (err: any) {
            console.error("[EditItineraryView] fetch error:", err);
            setError(err?.message || "Failed to load itineraries.");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [user?.id, supabase]);

    // Fetch on mount
    useEffect(() => {
        fetchItineraries();
    }, [fetchItineraries]);

    /** Apply local search + status filter */
    const filtered = itineraries.filter((row) => {
        const matchesStatus =
            statusFilter === "all" || row.status.toLowerCase() === statusFilter;

        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
            !q ||
            (row.title ?? "").toLowerCase().includes(q) ||
            (row.destinations ?? "").toLowerCase().includes(q) ||
            (row.client_name ?? "").toLowerCase().includes(q);

        return matchesStatus && matchesSearch;
    });

    // ── Empty state ────────────────────────────────────────────────────────────
    if (!loading && !error && itineraries.length === 0) {
        return (
            <div className="mt-4 bg-white/[0.02] border border-white/10 rounded-xl p-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
                <Compass className="w-12 h-12 text-gray-600 opacity-40" />
                <h3 className="text-xl font-medium text-white">No Itineraries Yet</h3>
                <p className="text-sm">Create a new itinerary in the AI Architect to get started.</p>
                <Link href="/ai-architect">
                    <Button className="mt-2 px-6 py-2.5 aurora-gradient text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2 h-10 border-none">
                        <Plus className="w-4 h-4" /> Create New Itinerary
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="mt-4 space-y-4">
            {/* ── Toolbar ─────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <Input
                        placeholder="Search by title, destination, client…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 bg-black/30 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-purple-500/40 rounded-lg text-sm"
                    />
                </div>

                {/* Status filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[160px] h-10 bg-white/5 border-white/10 text-white rounded-lg text-sm">
                        <Filter className="w-3.5 h-3.5 mr-2 text-gray-500" />
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                        <SelectItem value="all">All Statuses</SelectItem>
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

                {/* Refresh */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchItineraries(true)}
                    disabled={isRefreshing || loading}
                    className="h-10 px-3 border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white rounded-lg shrink-0"
                    title="Refresh list"
                >
                    <RefreshCw className={cn("w-4 h-4", (isRefreshing || loading) && "animate-spin")} />
                </Button>

                {/* New itinerary shortcut */}
                <Link href="/ai-architect">
                    <Button className="h-10 px-4 aurora-gradient text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2 border-none whitespace-nowrap">
                        <Plus className="w-4 h-4" /> New
                    </Button>
                </Link>
            </div>

            {/* Row count */}
            <p className="text-xs text-gray-600">
                {loading ? "Loading…" : `${filtered.length} of ${itineraries.length} itinerar${itineraries.length !== 1 ? "ies" : "y"}`}
            </p>

            {/* ── Error state ─────────────────────────────────────────────────── */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between gap-3">
                    <span>{error}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 h-7 px-2 text-xs"
                        onClick={() => fetchItineraries()}
                    >
                        Retry
                    </Button>
                </div>
            )}

            {/* ── List ────────────────────────────────────────────────────────── */}
            <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
                {loading ? (
                    /* Skeleton */
                    <div className="divide-y divide-white/5">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-4">
                                <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3.5 w-48 bg-white/10 rounded animate-pulse" />
                                    <div className="h-2.5 w-32 bg-white/5 rounded animate-pulse" />
                                </div>
                                <div className="h-5 w-16 bg-white/10 rounded-full animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
                        <Search className="w-8 h-8 opacity-30" />
                        <p className="text-sm">No itineraries match your search.</p>
                        {(searchQuery || statusFilter !== "all") && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-purple-400 text-xs"
                                onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                            >
                                Clear filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-white/5 max-h-[65vh] overflow-y-auto">
                        {filtered.map((trip) => {
                            const title = trip.title?.trim() || "Untitled Trip";
                            const destination = trip.destinations?.trim() || null;
                            const duration = formatDuration(trip.start_date, trip.end_date);
                            const totalPax =
                                (trip.adult_pax ?? 0) +
                                (trip.child_pax ?? 0) +
                                (trip.infant_pax ?? 0);
                            const statusLabel =
                                itineraryStatuses.find((o) => o.value === trip.status.toLowerCase())
                                    ?.label ?? trip.status;

                            return (
                                <div
                                    key={trip.id}
                                    className="flex items-center gap-3 p-4 hover:bg-white/[0.03] transition-colors group"
                                >
                                    {/* Icon */}
                                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                                        <Compass className="w-4 h-4 text-purple-400" />
                                    </div>

                                    {/* Main info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate leading-snug">
                                            {title}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                                            {destination && (
                                                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                                    <Compass className="w-3 h-3 text-purple-400/60 shrink-0" />
                                                    {destination}
                                                </span>
                                            )}
                                            {trip.client_name && (
                                                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                                    <Users className="w-3 h-3 shrink-0" />
                                                    {trip.client_name}
                                                </span>
                                            )}
                                            {trip.start_date && (
                                                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                                    <CalendarDays className="w-3 h-3 shrink-0" />
                                                    {formatDate(trip.start_date)}
                                                    {duration && (
                                                        <span className="text-purple-400/70 font-medium">· {duration}</span>
                                                    )}
                                                </span>
                                            )}
                                            {totalPax > 0 && (
                                                <span className="text-[11px] text-gray-600">{totalPax} pax</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status badge */}
                                    <span
                                        className={cn(
                                            "hidden sm:inline-flex text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full shrink-0",
                                            statusClasses(trip.status, itineraryStatuses)
                                        )}
                                    >
                                        {statusLabel}
                                    </span>

                                    {/* Updated at */}
                                    <span className="hidden lg:block text-[10px] text-gray-600 shrink-0 w-[72px] text-right">
                                        {formatDate(trip.updated_at)}
                                    </span>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                        {/* View itinerary */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                                            title="Preview Itinerary"
                                            onClick={() => {
                                                setSelectedTripForModal(trip);
                                                setShowModal(true);
                                            }}
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </Button>

                                        {/* Edit in AI Architect */}
                                        <Link href={`/ai-architect?itineraryId=${trip.id}`}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg"
                                                title="Edit in AI Architect"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                        </Link>

                                        {/* Delete */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                                            title="Delete Itinerary"
                                            onClick={() => handleDeleteTrip(trip.id)}
                                            disabled={deleting === trip.id}
                                        >
                                            {deleting === trip.id ? (
                                                <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Trash2 className="w-3.5 h-3.5" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
