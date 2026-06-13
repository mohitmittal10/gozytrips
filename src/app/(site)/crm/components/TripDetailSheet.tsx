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
    Receipt,
    ExternalLink,
    Check,
    LoaderCircle,
    AlertCircle,
    ChevronRight,
    Star,
    CheckCircle2,
    XCircle,
    ScrollText,
    Hotel,
    Car,
    Bus,
    ShieldCheck,
    Layers,
    CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrencySymbol, formatMoney } from "@/lib/utils/currency";
import { DEFAULT_CURRENCY, defaultPricingConfig } from "@/types/pricing";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { calcPricingBreakdown } from "@/services/financial";

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
    share_token?: string | null;
    share_enabled?: boolean;
    itinerary_data?: any;
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
    const { toast } = useToast();

    const [isGenerating, setIsGenerating] = React.useState(false);
    const [invoiceUrl, setInvoiceUrl] = React.useState<string | null>(
        trip?.share_token && trip?.share_enabled
            ? `${window?.location?.origin || ""}/invoice/${trip.share_token}`
            : null
    );
    const [copied, setCopied] = React.useState(false);

    // Sync invoice URL when trip prop changes
    React.useEffect(() => {
        if (trip?.share_token && trip?.share_enabled) {
            setInvoiceUrl(`${window.location.origin}/invoice/${trip.share_token}`);
        } else {
            setInvoiceUrl(null);
        }
    }, [trip?.id, trip?.share_token, trip?.share_enabled]);

    const handleGenerateInvoice = React.useCallback(async () => {
        if (!trip?.id) return;
        setIsGenerating(true);
        try {
            const res = await fetch("/api/itineraries/generate-invoice-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itineraryId: trip.id }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to generate invoice");
            }

            const fullUrl = `${window.location.origin}/invoice/${data.share_token}`;
            setInvoiceUrl(fullUrl);

            toast({
                title: data.already_existed ? "Invoice Already Exists" : "Invoice Generated!",
                description: data.already_existed
                    ? "An invoice link for this trip already exists."
                    : "Your invoice has been created with a secure shareable link.",
            });
        } catch (err: any) {
            console.error("Invoice generation error:", err);
            toast({
                title: "Failed to Generate Invoice",
                description: err.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    }, [trip?.id, toast]);

    const handleCopyLink = React.useCallback(async () => {
        if (!invoiceUrl) return;
        try {
            await navigator.clipboard.writeText(invoiceUrl);
            setCopied(true);
            toast({
                title: "Link Copied!",
                description: "The invoice URL has been copied to your clipboard.",
            });
            setTimeout(() => setCopied(false), 2500);
        } catch {
            toast({
                title: "Copy Failed",
                description: "Could not copy to clipboard. Please copy the link manually.",
                variant: "destructive",
            });
        }
    }, [invoiceUrl, toast]);

    const handleViewInvoice = React.useCallback(() => {
        if (!invoiceUrl) return;
        window.open(invoiceUrl, "_blank", "noopener,noreferrer");
    }, [invoiceUrl]);
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

    const pricingConfig = trip?.itinerary_data?.pricing || defaultPricingConfig;
    const pricingBreakdown = React.useMemo(() => {
        if (!trip?.itinerary_data) return null;
        try {
            return calcPricingBreakdown({
                itinerary: trip.itinerary_data.itinerary || trip.itinerary_data.days || [],
                hotels: trip.itinerary_data.hotels || [],
                flights: trip.itinerary_data.flights || [],
                cabs: trip.itinerary_data.cabs || [],
                buses: trip.itinerary_data.buses || [],
                pricing: pricingConfig,
            });
        } catch (e) {
            console.error("Error calculating breakdown in details:", e);
            return null;
        }
    }, [trip?.itinerary_data, pricingConfig]);

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
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-5 bg-white/5 border border-white/10 rounded-xl p-1 mb-6">
                            <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white">Overview</TabsTrigger>
                            <TabsTrigger value="itinerary" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white">Days</TabsTrigger>
                            <TabsTrigger value="logistics" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white">Logistics</TabsTrigger>
                            <TabsTrigger value="finances" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white">Finances</TabsTrigger>
                            <TabsTrigger value="inclusions" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white">Policies</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-5 focus-visible:outline-none">
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
                                            ? formatMoney(trip.tripCost, trip.currency || agencySettings?.default_currency || DEFAULT_CURRENCY)
                                            : "N/A"}
                                    </p>
                                    {trip.budget && trip.budget > 0 && trip.budget !== trip.tripCost && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Budget: {formatMoney(trip.budget, trip.currency || agencySettings?.default_currency || DEFAULT_CURRENCY)}
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

                            {/* --- Invoice Section --- */}
                            <div className="p-5 bg-white/[0.03] border border-white/10 rounded-xl space-y-3">
                                <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Receipt className="w-3.5 h-3.5" /> Invoice
                                </h5>

                                {invoiceUrl ? (
                                    <>
                                        {/* Invoice URL Display */}
                                        <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg p-2.5">
                                            <p className="text-xs text-gray-400 truncate flex-1 font-mono">{invoiceUrl}</p>
                                        </div>

                                        {/* Invoice Actions */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-purple-500/30 bg-purple-500/5 text-purple-400 hover:bg-purple-500/10 h-9"
                                                onClick={handleViewInvoice}
                                            >
                                                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                                View Invoice
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 h-9 transition-all",
                                                    copied && "border-green-500/30 bg-green-500/5 text-green-400"
                                                )}
                                                onClick={handleCopyLink}
                                            >
                                                {copied ? (
                                                    <><Check className="w-3.5 h-3.5 mr-1.5" /> Copied!</>
                                                ) : (
                                                    <><Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Link</>
                                                )}
                                            </Button>
                                        </div>

                                        <p className="text-[10px] text-gray-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            This link is accessible to you and the assigned client.
                                        </p>

                                        {/* Regenerate option */}
                                        <button
                                            onClick={handleGenerateInvoice}
                                            disabled={isGenerating}
                                            className="text-[11px] text-gray-600 hover:text-purple-400 transition-colors flex items-center gap-1"
                                        >
                                            <ChevronRight className="w-3 h-3" />
                                            {isGenerating ? "Regenerating..." : "Regenerate Invoice Link"}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xs text-gray-500">Generate a secure invoice link to share with your client.</p>
                                        <Button
                                            className="w-full aurora-gradient text-white border-none hover:brightness-110 h-10"
                                            onClick={handleGenerateInvoice}
                                            disabled={isGenerating}
                                        >
                                            {isGenerating ? (
                                                <><LoaderCircle className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                                            ) : (
                                                <><Receipt className="w-4 h-4 mr-2" /> Generate Invoice</>
                                            )}
                                        </Button>
                                    </>
                                )}
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
                        </TabsContent>

                        <TabsContent value="itinerary" className="space-y-4 focus-visible:outline-none">
                            {(() => {
                                const days = trip.itinerary_data?.itinerary || trip.itinerary_data?.days || [];
                                if (days.length === 0) {
                                    return (
                                        <div className="text-center py-12 text-gray-500 bg-white/[0.02] border border-dashed border-white/10 rounded-xl space-y-3">
                                            <Compass className="w-8 h-8 mx-auto text-gray-600 opacity-20" />
                                            <p className="text-sm">No day-by-day itinerary data found.</p>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-white/10 pl-7 py-2">
                                        {days.map((day: any, idx: number) => (
                                            <div key={idx} className="relative space-y-1.5">
                                                <div className="absolute -left-[24px] top-1.5 w-2 h-2 rounded-full bg-purple-500 ring-4 ring-purple-500/20" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Day {idx + 1}</p>
                                                <h4 className="text-sm font-semibold text-white leading-tight">
                                                    {day.title || day.areaFocus || `Day ${idx + 1}`}
                                                </h4>
                                                {day.description && (
                                                    <p className="text-xs text-gray-400 leading-relaxed pt-1">
                                                        {day.description}
                                                    </p>
                                                )}
                                                {day.activities && day.activities.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 pt-2">
                                                        {day.activities.map((act: any, actIdx: number) => (
                                                            <Badge key={actIdx} variant="outline" className="text-[10px] bg-white/5 border-white/5 text-gray-300 font-normal px-2 py-0.5">
                                                                {typeof act === 'string' ? act : act.title}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </TabsContent>

                        <TabsContent value="logistics" className="space-y-4 focus-visible:outline-none">
                            {(() => {
                                const hotels = trip.itinerary_data?.hotels || [];
                                const flights = trip.itinerary_data?.flights || [];
                                const cabs = trip.itinerary_data?.cabs || [];
                                const buses = trip.itinerary_data?.buses || [];
                                const hasLogistics = hotels.length > 0 || flights.length > 0 || cabs.length > 0 || buses.length > 0;

                                if (!hasLogistics) {
                                    return (
                                        <div className="text-center py-12 text-gray-500 bg-white/[0.02] border border-dashed border-white/10 rounded-xl space-y-3">
                                            <Hotel className="w-8 h-8 mx-auto text-gray-600 opacity-20" />
                                            <p className="text-sm">No logistics added to this trip.</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-6">
                                        {/* Hotels */}
                                        {hotels.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                                                    <Hotel className="w-3.5 h-3.5" /> Accommodation ({hotels.length})
                                                </h4>
                                                {hotels.map((h: any) => (
                                                    <div key={h.id} className="p-3.5 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <p className="text-sm font-semibold text-white">{h.name || "Unnamed Hotel"}</p>
                                                                {h.address && <p className="text-xs text-gray-500 mt-0.5">{h.address}</p>}
                                                            </div>
                                                            {h.starRating && (
                                                                <div className="flex gap-0.5 shrink-0 pt-1">
                                                                    {Array.from({ length: h.starRating }).map((_, i) => (
                                                                        <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 border-t border-white/5 pt-2 mt-1">
                                                            <p>Check-in: <span className="text-gray-200">{h.checkIn || "—"}</span></p>
                                                            <p>Check-out: <span className="text-gray-200">{h.checkOut || "—"}</span></p>
                                                            {h.nights && <p>Nights: <span className="text-gray-200">{h.nights}</span></p>}
                                                            {h.bookingRef && <p>Booking Ref: <span className="text-gray-200">{h.bookingRef}</span></p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Flights */}
                                        {flights.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                                    <Plane className="w-3.5 h-3.5" /> Flights ({flights.length})
                                                </h4>
                                                {flights.map((f: any) => (
                                                    <div key={f.id} className="p-3.5 bg-white/[0.02] border border-white/10 rounded-xl space-y-2.5">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-semibold text-white">{f.airline || "Airline"} {f.flightNumber || ""}</p>
                                                            {f.pnr && <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{f.pnr}</Badge>}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-gray-400 border-t border-white/5 pt-2.5 mt-1">
                                                            <div className="flex-1">
                                                                <p className="text-[9px] text-gray-500 uppercase font-semibold">Departure</p>
                                                                <p className="text-xs text-gray-200 font-semibold">{f.departureAirport || "—"}</p>
                                                                <p className="text-[11px] text-gray-400">{f.departure || "—"}</p>
                                                            </div>
                                                            <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
                                                            <div className="flex-1 text-right">
                                                                <p className="text-[9px] text-gray-500 uppercase font-semibold">Arrival</p>
                                                                <p className="text-xs text-gray-200 font-semibold">{f.arrivalAirport || "—"}</p>
                                                                <p className="text-[11px] text-gray-400">{f.arrival || "—"}</p>
                                                            </div>
                                                        </div>
                                                        {f.terminal && <p className="text-[10px] text-gray-500 mt-1">Terminal: <span className="text-gray-300">{f.terminal}</span></p>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Cabs */}
                                        {cabs.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                                                    <Car className="w-3.5 h-3.5" /> Cabs ({cabs.length})
                                                </h4>
                                                {cabs.map((c: any) => (
                                                    <div key={c.id} className="p-3.5 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-semibold text-white">{c.vehicleType || "Cab"}</p>
                                                            {c.pickupTime && <span className="text-xs text-gray-400">{c.pickupTime}</span>}
                                                        </div>
                                                        {c.route && <p className="text-xs text-gray-300">{c.route}</p>}
                                                        {(c.driverName || c.driverContact) && (
                                                            <div className="text-[11px] text-gray-500 border-t border-white/5 pt-2 flex justify-between">
                                                                <span>Driver: <span className="text-gray-300">{c.driverName || "TBD"}</span></span>
                                                                {c.driverContact && <span>Contact: <span className="text-gray-300">{c.driverContact}</span></span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Buses */}
                                        {buses.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                                                    <Bus className="w-3.5 h-3.5" /> Buses ({buses.length})
                                                </h4>
                                                {buses.map((b: any) => (
                                                    <div key={b.id} className="p-3.5 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-semibold text-white">{b.busType || "Bus"}</p>
                                                            {b.pnr && <Badge variant="outline" className="text-[10px] border-white/10 text-gray-400">{b.pnr}</Badge>}
                                                        </div>
                                                        {b.route && <p className="text-xs text-gray-300">{b.route}</p>}
                                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 border-t border-white/5 pt-2">
                                                            <p>Report: <span className="text-gray-200">{b.reportingTime || "—"}</span></p>
                                                            <p>Depart: <span className="text-gray-200">{b.departureTime || "—"}</span></p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </TabsContent>

                        <TabsContent value="finances" className="space-y-4 focus-visible:outline-none">
                            {pricingBreakdown ? (
                                <div className="space-y-5">
                                    <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 border-b border-white/5 pb-2">
                                            <Receipt className="w-3.5 h-3.5 text-purple-400" /> Cost Summary
                                        </h4>
                                        <div className="space-y-2.5 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Costing Mode</span>
                                                <span className="capitalize text-white font-medium">{pricingConfig.costingType || "automated"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Base Cost</span>
                                                <span className="text-white font-semibold">
                                                    {formatMoney(pricingBreakdown.baseCost, trip.currency || agencySettings?.default_currency || DEFAULT_CURRENCY)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Markup ({pricingConfig.markupType === 'percentage' ? `${pricingConfig.markupValue}%` : 'Flat'})</span>
                                                <span className="text-gray-300">
                                                    + {formatMoney(pricingBreakdown.markupAmount, trip.currency || agencySettings?.default_currency || DEFAULT_CURRENCY)}
                                                </span>
                                            </div>
                                            {pricingBreakdown.taxAmount > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Taxes ({pricingConfig.taxPercentage || 0}%)</span>
                                                    <span className="text-gray-300">
                                                        + {formatMoney(pricingBreakdown.taxAmount, trip.currency || agencySettings?.default_currency || DEFAULT_CURRENCY)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between border-t border-white/5 pt-2.5 text-base">
                                                <span className="font-bold text-white">Client Price</span>
                                                <span className="font-bold text-purple-400">
                                                    {formatMoney(pricingBreakdown.finalTotal, trip.currency || agencySettings?.default_currency || DEFAULT_CURRENCY)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {pricingBreakdown.milestoneAmounts && pricingBreakdown.milestoneAmounts.length > 0 && (
                                        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-3">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 border-b border-white/5 pb-2">
                                                <CreditCard className="w-3.5 h-3.5 text-blue-400" /> Payment Milestones
                                            </h4>
                                            <div className="space-y-3">
                                                {pricingBreakdown.milestoneAmounts.map((m: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-start text-xs">
                                                        <div>
                                                            <p className="font-semibold text-gray-200">{m.title || `Milestone ${idx + 1}`}</p>
                                                            <p className="text-[10px] text-gray-500">{m.percentage}% due</p>
                                                        </div>
                                                        <span className="font-bold text-white">
                                                            {formatMoney(m.amount, trip.currency || agencySettings?.default_currency || DEFAULT_CURRENCY)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500 bg-white/[0.02] border border-dashed border-white/10 rounded-xl space-y-3">
                                    <Receipt className="w-8 h-8 mx-auto text-gray-600 opacity-20" />
                                    <p className="text-sm">No finance details configured.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="inclusions" className="space-y-4 focus-visible:outline-none">
                            {(() => {
                                const inclusions = trip.itinerary_data?.inclusions || "";
                                const exclusions = trip.itinerary_data?.exclusions || "";
                                const terms = trip.itinerary_data?.termsAndConditions || "";
                                const cancellation = trip.itinerary_data?.cancellationPolicy || "";
                                const payment = trip.itinerary_data?.paymentMethods || "";
                                const hasPolicies = inclusions || exclusions || terms || cancellation || payment;

                                if (!hasPolicies) {
                                    return (
                                        <div className="text-center py-12 text-gray-500 bg-white/[0.02] border border-dashed border-white/10 rounded-xl space-y-3">
                                            <ScrollText className="w-8 h-8 mx-auto text-gray-600 opacity-20" />
                                            <p className="text-sm">No inclusions or policy details configured.</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-5">
                                        {inclusions && (
                                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1.5">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Inclusions
                                                </h4>
                                                <p className="text-xs text-emerald-200/95 whitespace-pre-wrap leading-relaxed">{inclusions}</p>
                                            </div>
                                        )}
                                        {exclusions && (
                                            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-1.5">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                                                    <XCircle className="w-3.5 h-3.5" /> Exclusions
                                                </h4>
                                                <p className="text-xs text-rose-200/95 whitespace-pre-wrap leading-relaxed">{exclusions}</p>
                                            </div>
                                        )}
                                        {cancellation && (
                                            <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl space-y-1.5">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                                                    <AlertCircle className="w-3.5 h-3.5" /> Cancellation Policy
                                                </h4>
                                                <p className="text-xs text-orange-200/95 whitespace-pre-wrap leading-relaxed">{cancellation}</p>
                                            </div>
                                        )}
                                        {payment && (
                                            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-1.5">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                                                    <CreditCard className="w-3.5 h-3.5" /> Payment Methods
                                                </h4>
                                                <p className="text-xs text-indigo-200/95 whitespace-pre-wrap leading-relaxed">{payment}</p>
                                            </div>
                                        )}
                                        {terms && (
                                            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-1.5">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                                                    <ScrollText className="w-3.5 h-3.5" /> Terms & Conditions
                                                </h4>
                                                <p className="text-xs text-blue-200/95 whitespace-pre-wrap leading-relaxed">{terms}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </TabsContent>
                    </Tabs>
                )}
            </SheetContent>
        </Sheet>
    );
};

