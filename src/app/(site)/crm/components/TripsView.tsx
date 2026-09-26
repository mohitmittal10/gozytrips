import React, { useState, useMemo } from "react";
import {
    Compass,
    CalendarDays,
    Clock,
    GripVertical,
    Plane,
    Users,
    ArrowRight,
    DollarSign,
    Download,
    Columns3,
    ChevronLeft,
    ChevronRight,
    X,
    User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getCurrencySymbol, formatMoney } from "@/lib/utils/currency";
import { DEFAULT_CURRENCY } from "@/types/pricing";
import { useAuth } from "@/contexts/auth-context";
import { getStatusBadgeClasses, CRM_AVATAR_CLASS } from "../utils/crm-colors";
import type { EnrichedClient } from "../utils/metrics-utils";
import type { FlatTrip } from "./TripDetailSheet";

interface TripsListViewProps {
    trips: FlatTrip[];
    loading: boolean;
    onTripClick: (trip: FlatTrip) => void;
    itineraryStatuses?: { value: string; label: string; metadata?: any }[];
    onStatusChange?: (tripId: string, newStatus: string) => void;
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
    dateFrom: string;
    dateTo: string;
    budgetMin: string;
    budgetMax: string;
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
                share_token: trip.share_token,
                share_enabled: trip.share_enabled,
                itinerary_data: trip.itinerary_data,
            });
        });
    });
    return result;
}

/** Status pill color resolver */
function statusClasses(status: string): string {
    return getStatusBadgeClasses(status);
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
                    <td className="p-4 w-10">
                        <div className="h-4 w-4 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                    </td>
                    <td className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse" />
                            <div>
                                <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                                <div className="h-3 w-40 bg-slate-100 dark:bg-white/5 rounded animate-pulse mt-1.5" />
                            </div>
                        </div>
                    </td>
                    <td className="p-4">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                    </td>
                    <td className="p-4">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                    </td>
                    <td className="p-4">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                    </td>
                    <td className="p-4">
                        <div className="h-6 w-20 bg-slate-200 dark:bg-white/10 rounded-full animate-pulse" />
                    </td>
                    <td className="p-4">
                        <div className="h-4 w-16 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                    </td>
                    <td className="p-4">
                        <div className="h-4 w-4 bg-slate-200 dark:bg-white/10 rounded animate-pulse ml-auto" />
                    </td>
                </tr>
            ))}
        </>
    );
}

/** List/table view for trips matching ClientsView layout */
const TripsListView = ({ trips, loading, onTripClick, itineraryStatuses = [], onStatusChange }: TripsListViewProps) => {
    const { agencySettings } = useAuth();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [visibleColumns, setVisibleColumns] = useState({
        destination: true,
        dates: true,
        client: true,
        status: true,
        cost: true,
    });

    const toggleColumn = (col: keyof typeof visibleColumns) => {
        setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
    };

    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current?.key === key) {
                return current.direction === 'asc' ? { key, direction: 'desc' } : null;
            }
            return { key, direction: 'asc' };
        });
    };

    const SortIcon = ({ col }: { col: string }) => {
        if (sortConfig?.key !== col) return null;
        return <span className="ml-1 text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    };

    const sortedTrips = useMemo(() => {
        let items = [...trips];
        if (sortConfig) {
            items.sort((a, b) => {
                let aVal: any = a[sortConfig.key as keyof FlatTrip] ?? "";
                let bVal: any = b[sortConfig.key as keyof FlatTrip] ?? "";
                if (sortConfig.key === 'dates') {
                    aVal = a.start_date || "";
                    bVal = b.start_date || "";
                }
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = (bVal as string).toLowerCase();
                }
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [trips, sortConfig]);

    const ITEMS_PER_PAGE = 10;
    const totalPages = Math.ceil(sortedTrips.length / ITEMS_PER_PAGE) || 1;
    const paginatedTrips = useMemo(() => {
        return sortedTrips.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [sortedTrips, currentPage]);

    const toggleSelectAll = () => {
        if (paginatedTrips.length > 0 && selectedIds.size === paginatedTrips.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginatedTrips.map(t => t.id)));
        }
    };

    const toggleSelectOne = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleBulkStatusChange = (status: string) => {
        if (onStatusChange) {
            selectedIds.forEach(id => onStatusChange(id, status));
        }
        setSelectedIds(new Set());
    };

    const handleExportCSV = () => {
        const exportItems = selectedIds.size > 0 
            ? sortedTrips.filter(t => selectedIds.has(t.id))
            : sortedTrips;
        if (!exportItems.length) return;
        const headers = ["Trip Title", "Client Name", "Client Email", "Destination", "Start Date", "End Date", "Status", "Cost", "Currency"];
        const rows = exportItems.map(t => [
            `"${(t.title || "").replace(/"/g, '""')}"`,
            `"${(t.clientName || "").replace(/"/g, '""')}"`,
            `"${(t.clientEmail || "").replace(/"/g, '""')}"`,
            `"${(t.destinations || "").replace(/"/g, '""')}"`,
            `"${t.start_date || ""}"`,
            `"${t.end_date || ""}"`,
            `"${t.status || ""}"`,
            t.tripCost || 0,
            `"${t.currency || ""}"`
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `crm_trips_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="mt-4 space-y-4">
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 shadow-sm">
                    <span className="text-sm text-purple-700 dark:text-purple-300 font-semibold">{selectedIds.size} selected</span>
                    <div className="h-4 w-px bg-purple-500/30" />
                    <Select onValueChange={(val) => handleBulkStatusChange(val)}>
                        <SelectTrigger className="h-8 w-[140px] bg-white dark:bg-white/5 border-purple-500/30 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium">
                            <SelectValue placeholder="Set Status..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#0c0c0e] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-xl">
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
                                </>
                            )}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="h-8 border-purple-500/30 dark:border-white/10 bg-purple-500/10 dark:bg-white/5 text-purple-900 dark:text-purple-200 hover:bg-purple-500/20 dark:hover:bg-white/10 text-xs font-medium" onClick={handleExportCSV}>
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium ml-auto" onClick={() => setSelectedIds(new Set())}>
                        Clear
                    </Button>
                </div>
            )}

            {/* Table Toolbar */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 dark:text-gray-400 font-medium">{sortedTrips.length} trip{sortedTrips.length !== 1 ? 's' : ''}</p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 border-slate-300/80 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-800 dark:text-gray-200 hover:bg-slate-200/80 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white text-xs font-medium" onClick={handleExportCSV}>
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 border-slate-300/80 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-800 dark:text-gray-200 hover:bg-slate-200/80 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white text-xs font-medium">
                                <Columns3 className="w-3.5 h-3.5 mr-1.5" /> Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-[#0c0c0e] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-xl">
                            <DropdownMenuLabel className="text-xs text-slate-600 dark:text-gray-400">Toggle Columns</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-200 dark:bg-white/10" />
                            <DropdownMenuCheckboxItem checked={visibleColumns.destination} onCheckedChange={() => toggleColumn('destination')} className="text-xs">Destination</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleColumns.dates} onCheckedChange={() => toggleColumn('dates')} className="text-xs">Dates</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleColumns.client} onCheckedChange={() => toggleColumn('client')} className="text-xs">Client</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleColumns.status} onCheckedChange={() => toggleColumn('status')} className="text-xs">Status</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleColumns.cost} onCheckedChange={() => toggleColumn('cost')} className="text-xs">Cost</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-300/60 dark:border-white/[0.08] shadow-xl rounded-2xl overflow-hidden">
                <div className="crm-table-wrapper">
                    <table className="w-full text-left border-collapse min-w-[640px]">
                        <thead>
                            <tr className="border-b border-slate-300 dark:border-white/10 text-[11px] uppercase tracking-wider text-gray-500 font-semibold bg-white/[0.02]">
                                <th className="p-4 w-10">
                                    <Checkbox
                                        checked={paginatedTrips.length > 0 && selectedIds.size === paginatedTrips.length}
                                        onCheckedChange={toggleSelectAll}
                                        className="border-slate-300 dark:border-white/20 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                                    />
                                </th>
                                <th className="p-4 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => handleSort('title')}>
                                    <span className="inline-flex items-center">Trip Info <SortIcon col="title" /></span>
                                </th>
                                {visibleColumns.destination && (
                                    <th className="p-4 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => handleSort('destinations')}>
                                        <span className="inline-flex items-center">Destination <SortIcon col="destinations" /></span>
                                    </th>
                                )}
                                {visibleColumns.dates && (
                                    <th className="p-4 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => handleSort('dates')}>
                                        <span className="inline-flex items-center">Dates <SortIcon col="dates" /></span>
                                    </th>
                                )}
                                {visibleColumns.client && (
                                    <th className="p-4 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => handleSort('clientName')}>
                                        <span className="inline-flex items-center">Client <SortIcon col="clientName" /></span>
                                    </th>
                                )}
                                {visibleColumns.status && (
                                    <th className="p-4 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => handleSort('status')}>
                                        <span className="inline-flex items-center">Status <SortIcon col="status" /></span>
                                    </th>
                                )}
                                {visibleColumns.cost && (
                                    <th className="p-4 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => handleSort('tripCost')}>
                                        <span className="inline-flex items-center">Cost <SortIcon col="tripCost" /></span>
                                    </th>
                                )}
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <SkeletonRows />
                            ) : paginatedTrips.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500 bg-slate-100 dark:bg-white/5">
                                        <div className="flex flex-col items-center justify-center py-6">
                                            <Plane className="w-12 h-12 text-gray-600 mb-3 opacity-40" />
                                            <p>No trips found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedTrips.map((trip) => (
                                    <tr 
                                        key={trip.id} 
                                        className={cn(
                                            "border-b border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer group",
                                            selectedIds.has(trip.id) && "bg-slate-100 dark:bg-white/5"
                                        )}
                                        onClick={() => onTripClick(trip)}
                                    >
                                        <td className="p-4 w-10" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedIds.has(trip.id)}
                                                onCheckedChange={() => toggleSelectOne(trip.id)}
                                                className="border-slate-300 dark:border-white/20 data-[state=checked]:bg-zinc-700 data-[state=checked]:text-slate-900 dark:text-white data-[state=checked]:border-zinc-600"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("inline-flex w-8 h-8 rounded-full items-center justify-center text-xs shrink-0", CRM_AVATAR_CLASS)}>
                                                    <Plane className="w-4 h-4 text-slate-800 dark:text-zinc-200" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white text-sm group-hover:text-slate-900 dark:hover:text-white transition-colors">
                                                        {trip.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{trip.destinations || 'No destination'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {visibleColumns.destination && (
                                            <td className="p-4 text-slate-600 dark:text-gray-300">
                                                <div className="flex items-center gap-2 group/dest">
                                                    <Compass className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400 group-hover/dest:text-slate-900 dark:hover:text-white transition-colors shrink-0" />
                                                    <span className="truncate max-w-[180px] text-xs font-medium text-slate-800 dark:text-zinc-200 group-hover/dest:text-slate-900 dark:hover:text-white transition-colors">
                                                        {trip.destinations || "—"}
                                                    </span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.dates && (
                                            <td className="p-4 text-xs text-gray-500">
                                                <div className="flex items-center gap-1.5">
                                                    <CalendarDays className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                                                    <span>{formatShortDate(trip.start_date)}</span>
                                                    {trip.end_date && (
                                                        <>
                                                            <ArrowRight className="w-3 h-3 text-slate-500 dark:text-zinc-500" />
                                                            <span>{formatShortDate(trip.end_date)}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.client && (
                                            <td className="p-4 text-xs text-slate-600 dark:text-gray-300">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                                                    <span className="font-medium text-slate-800 dark:text-zinc-200">
                                                        {trip.clientName || "—"}
                                                    </span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.status && (
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
                                        )}
                                        {visibleColumns.cost && (
                                            <td className="p-4 text-xs font-bold text-slate-900 dark:text-white">
                                                {trip.tripCost > 0
                                                    ? formatMoney(trip.tripCost, trip.currency || agencySettings?.default_currency || DEFAULT_CURRENCY)
                                                    : "—"}
                                            </td>
                                        )}
                                        <td className="p-4">
                                            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-slate-900 dark:hover:text-white transition-colors ml-auto" />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-slate-300 dark:border-white/10">
                        <p className="text-xs text-gray-500">
                            Page {currentPage} of {totalPages} ({sortedTrips.length} total)
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let page: number;
                                if (totalPages <= 5) {
                                    page = i + 1;
                                } else if (currentPage <= 3) {
                                    page = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    page = totalPages - 4 + i;
                                } else {
                                    page = currentPage - 2 + i;
                                }
                                return (
                                    <Button
                                        key={page}
                                        variant="ghost"
                                        size="icon"
                                        className={cn("h-8 w-8 text-xs", page === currentPage ? "bg-purple-500/20 text-purple-400" : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white")}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </Button>
                                );
                            })}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
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
                          borderColor: opt.metadata?.borderColor || "border-slate-200 dark:border-white/10",
                          dotColor: "bg-purple-400",
                      }))
                : [
                      { key: "draft", label: "Draft", borderColor: "border-purple-500/30", dotColor: "bg-purple-400" },
                      { key: "proposed", label: "Proposed", borderColor: "border-zinc-500/30", dotColor: "bg-zinc-400" },
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
                        "bg-white/60 dark:bg-white/[0.02] border rounded-xl p-4 min-h-[300px] flex flex-col gap-3",
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
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-gray-300">{col.label}</h3>
                        </div>
                        <span className="text-xs bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-500 px-2 py-0.5 rounded-full">
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
                                    className="p-3 bg-white/80 dark:bg-white/[0.04] border border-slate-200 dark:border-white/5 rounded-lg hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-all cursor-pointer group shadow-sm dark:shadow-none"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === "Enter" && onTripClick(trip)}
                                >
                                    <div className="flex items-start gap-1.5 mb-1.5">
                                        <GripVertical className="w-3 h-3 text-slate-600 dark:text-slate-400 dark:text-zinc-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                        <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-slate-700 dark:group-hover:text-zinc-200 transition-colors">
                                            {trip.title}
                                        </p>
                                    </div>
                                    {trip.destinations && (
                                        <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-gray-400 mb-1">
                                            <Compass className="w-3 h-3 text-slate-600 dark:text-slate-400 dark:text-zinc-400 shrink-0" />
                                            <span className="truncate">{trip.destinations}</span>
                                        </div>
                                    )}
                                    {trip.clientName && (
                                        <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-gray-400">
                                            <Users className="w-3 h-3 shrink-0" />
                                            <span className="truncate">{trip.clientName}</span>
                                        </div>
                                    )}
                                        <p className="text-[10px] text-slate-700 dark:text-zinc-200 font-semibold mt-1.5">
                                            {formatMoney(trip.tripCost, trip.currency || agencySettings?.default_currency || DEFAULT_CURRENCY)}
                                        </p>
                                    {trip.start_date && (
                                        <p className="text-[10px] text-slate-500 dark:text-gray-500 mt-0.5">
                                            {formatShortDate(trip.start_date)}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                        {col.trips.length === 0 && (
                            <div className="flex items-center justify-center h-20 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-lg">
                                <p className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-zinc-500">Drop here</p>
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
    dateFrom,
    dateTo,
    budgetMin,
    budgetMax,
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

        // Date Filters
        if (dateFrom) {
            const from = new Date(dateFrom);
            trips = trips.filter(t => t.start_date && new Date(t.start_date) >= from);
        }
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59);
            trips = trips.filter(t => t.start_date && new Date(t.start_date) <= to);
        }

        // Budget Filters
        if (budgetMin) {
            const min = parseFloat(budgetMin);
            trips = trips.filter(t => (t.tripCost || 0) >= min);
        }
        if (budgetMax) {
            const max = parseFloat(budgetMax);
            trips = trips.filter(t => (t.tripCost || 0) <= max);
        }

        // Sort: most recently updated first
        trips.sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );

        return trips;
    }, [enrichedClients, tripsPipelineFilter, searchQuery, dateFrom, dateTo, budgetMin, budgetMax]);

    return (
        <div className="space-y-4">
            {viewMode === "kanban" ? (
                <>
                    <p className="text-xs text-slate-500 dark:text-gray-500">
                        {filteredTrips.length} trip{filteredTrips.length !== 1 ? "s" : ""}
                    </p>
                    <TripsKanbanView
                        trips={filteredTrips}
                        itineraryStatuses={itineraryStatuses}
                        onStatusChange={onStatusChange}
                        onTripClick={onTripClick}
                    />
                </>
            ) : (
                <TripsListView
                    trips={filteredTrips}
                    loading={loading}
                    onTripClick={onTripClick}
                    itineraryStatuses={itineraryStatuses}
                    onStatusChange={onStatusChange}
                />
            )}
        </div>
    );
};

