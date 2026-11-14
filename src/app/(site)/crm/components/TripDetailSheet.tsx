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
    CreditCard,
    ChevronDown,
    TrendingUp,
    Wallet
} from "lucide-react";
import { isEntryCompleteForExport } from "@/lib/validation/logistics-validation";
import { buildLineItems } from "@/lib/helpers/trip-line-items";
import { useTripFinances } from "@/lib/hooks/use-trip-finances";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { getCurrencySymbol, formatMoney } from "@/lib/utils/currency";
import { DEFAULT_CURRENCY, defaultPricingConfig } from "@/types/pricing";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { calcPricingBreakdown } from "@/services/financial";
import { getStatusBadgeClasses } from "../utils/crm-colors";

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

/** Validates whether a logistics item is fully complete */
function isLogisticsComplete(entry: any, type: "hotel" | "flight" | "cab" | "bus"): boolean {
    if (!entry) return false;
    if (entry.isComplete === false || entry.status === "incomplete" || entry.status === "cancelled") {
        return false;
    }
    if (entry.isComplete === true) {
        return true;
    }
    return isEntryCompleteForExport(entry, type);
}

/** Category badge styling for itemized financial expenses */
function getCategoryBadge(category: string) {
    const cat = (category || "").toLowerCase();
    if (cat.includes("hotel") || cat.includes("stay") || cat.includes("accommodation")) {
        return {
            label: "Hotel",
            icon: Hotel,
            classes: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        };
    }
    if (cat.includes("flight") || cat.includes("air")) {
        return {
            label: "Flight",
            icon: Plane,
            classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        };
    }
    if (cat.includes("cab") || cat.includes("car") || cat.includes("transfer")) {
        return {
            label: "Cab",
            icon: Car,
            classes: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        };
    }
    if (cat.includes("bus")) {
        return {
            label: "Bus",
            icon: Bus,
            classes: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
        };
    }
    if (cat.includes("activity") || cat.includes("tour") || cat.includes("sightseeing")) {
        return {
            label: "Activity",
            icon: Compass,
            classes: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        };
    }
    return {
        label: category || "Expense",
        icon: Receipt,
        classes: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    };
}

/** Returns Tailwind classes for a status badge */
function getStatusClasses(status: string): string {
    return getStatusBadgeClasses(status);
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

    const [isFinancesExpanded, setIsFinancesExpanded] = React.useState(false);
    const { lineItems } = useTripFinances(trip?.id);
    const [payments, setPayments] = React.useState<any[]>([]);

    // Reset expand state when trip selection changes
    React.useEffect(() => {
        setIsFinancesExpanded(false);
    }, [trip?.id]);

    // Fetch payments for current trip
    React.useEffect(() => {
        if (!trip?.id) {
            setPayments([]);
            return;
        }
        const supabase = createClient();
        let isMounted = true;
        supabase
            .from("trip_payments")
            .select("*")
            .eq("itinerary_id", trip.id)
            .order("date", { ascending: false })
            .then(({ data, error }) => {
                if (isMounted && !error && data) {
                    setPayments(data);
                }
            });
        return () => {
            isMounted = false;
        };
    }, [trip?.id]);

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

    const allLineItems = React.useMemo(() => {
        const tripCurrency = trip?.currency || agencySettings?.default_currency || DEFAULT_CURRENCY;

        // 1. Database-persisted line items
        if (lineItems && lineItems.length > 0) {
            return lineItems.map((item) => ({
                id: item.id,
                title: item.title,
                category: item.category,
                netCost: Number(item.net_cost) || 0,
                markupPct: Number(item.markup_percentage) || 0,
                grossCost: (Number(item.net_cost) || 0) * (1 + (Number(item.markup_percentage) || 0) / 100),
                currency: item.currency || tripCurrency,
            }));
        }

        // 2. Pricing config manualOptions
        const manualOptions = (pricingConfig?.manualOptions || []) as any[];
        if (manualOptions.length > 0) {
            const totalPaxCount = (pricingConfig?.adultPax || trip?.adult_pax || 2) +
                (pricingConfig?.childPax || trip?.child_pax || 0) +
                (pricingConfig?.infantPax || trip?.infant_pax || 0);

            return manualOptions.map((opt: any) => {
                const qty = opt.type === "per-person" ? (totalPaxCount || 1) : 1;
                const net = (Number(opt.amount) || 0) * qty;
                const markupVal = typeof opt.markupValue === "number" ? opt.markupValue : (pricingConfig.markupValue || 0);
                const markupPct = opt.markupType === "flat" ? (net > 0 ? (markupVal / net) * 100 : 0) : markupVal;
                const gross = opt.markupType === "flat" ? net + markupVal : net * (1 + markupVal / 100);
                return {
                    id: opt.id || Math.random().toString(),
                    title: opt.name || "Custom Line Item",
                    category: (opt.category || "Other").toLowerCase(),
                    netCost: net,
                    markupPct: Math.round(markupPct),
                    grossCost: gross,
                    currency: tripCurrency,
                };
            });
        }

        // 3. Auto-derived line items from hotels, flights, cabs, buses, and day activities
        if (trip?.itinerary_data) {
            try {
                const paxInfo = {
                    adult: trip.adult_pax || pricingConfig.adultPax || 2,
                    child: trip.child_pax || pricingConfig.childPax || 0,
                    infant: trip.infant_pax || pricingConfig.infantPax || 0,
                };
                const generated = buildLineItems({
                    activeTripId: trip.id,
                    itinerary: trip.itinerary_data,
                    hotels: trip.itinerary_data.hotels || [],
                    flights: trip.itinerary_data.flights || [],
                    cabs: trip.itinerary_data.cabs || [],
                    buses: trip.itinerary_data.buses || [],
                    paxInfo,
                    pricingCfg: pricingConfig,
                });
                if (generated.length > 0) {
                    return generated.map((item, idx) => ({
                        id: `gen-${idx}`,
                        title: item.title,
                        category: item.category,
                        netCost: Number(item.net_cost) || 0,
                        markupPct: Number(item.markup_percentage) || 0,
                        grossCost: (Number(item.net_cost) || 0) * (1 + (Number(item.markup_percentage) || 0) / 100),
                        currency: item.currency || tripCurrency,
                    }));
                }
            } catch (e) {
                console.error("Error building line items in TripDetailSheet:", e);
            }
        }

        return [];
    }, [lineItems, pricingConfig, trip?.itinerary_data, trip?.id, trip?.adult_pax, trip?.child_pax, trip?.infant_pax, trip?.currency, agencySettings?.default_currency]);

    const tripCurrency = trip?.currency || agencySettings?.default_currency || DEFAULT_CURRENCY;
    const totalClientPrice = pricingBreakdown?.finalTotal ?? (trip?.client_price || trip?.tripCost || 0);
    const totalBaseCost = pricingBreakdown?.baseCost ?? (
        allLineItems.length > 0
            ? allLineItems.reduce((acc, item) => acc + item.netCost, 0)
            : (pricingConfig.markupType === "percentage" && pricingConfig.markupValue > 0
                ? totalClientPrice / (1 + pricingConfig.markupValue / 100)
                : totalClientPrice)
    );
    const totalMarkupAmount = pricingBreakdown?.markupAmount ?? Math.max(0, totalClientPrice - totalBaseCost);
    const totalTaxAmount = pricingBreakdown?.taxAmount ?? 0;
    const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const balanceDue = Math.max(0, totalClientPrice - totalPaid);
    const hasFinances = totalClientPrice > 0 || totalBaseCost > 0 || allLineItems.length > 0;

    return (
        <Sheet open={!!trip} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="bg-[#EFECE5]/95 dark:bg-[#0c0c0e]/95 backdrop-blur-2xl border-l border-slate-200 dark:border-white/10 text-slate-900 dark:text-white w-full sm:max-w-xl overflow-y-auto shadow-2xl">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Trip Details
                    </SheetTitle>
                    <SheetDescription className="text-slate-600 dark:text-zinc-400 line-clamp-2">
                        {trip?.title || "Untitled Trip"}
                    </SheetDescription>
                </SheetHeader>

                {trip && (
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-5 bg-white/60 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl p-1 mb-6">
                            <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-slate-900 dark:text-white text-slate-600 dark:text-zinc-400 font-semibold rounded-xl">Overview</TabsTrigger>
                            <TabsTrigger value="itinerary" className="text-xs data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-slate-900 dark:text-white text-slate-600 dark:text-zinc-400 font-semibold rounded-xl">Days</TabsTrigger>
                            <TabsTrigger value="logistics" className="text-xs data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-slate-900 dark:text-white text-slate-600 dark:text-zinc-400 font-semibold rounded-xl">Logistics</TabsTrigger>
                            <TabsTrigger value="finances" className="text-xs data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-slate-900 dark:text-white text-slate-600 dark:text-zinc-400 font-semibold rounded-xl">Finances</TabsTrigger>
                            <TabsTrigger value="inclusions" className="text-xs data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-slate-900 dark:text-white text-slate-600 dark:text-zinc-400 font-semibold rounded-xl">Policies</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-5 focus-visible:outline-none">
                            {/* --- Core Info Card --- */}
                            <div className="p-5 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl rounded-2xl space-y-4">
                                {/* Title + Status Row */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-lg font-bold text-slate-900 dark:text-white leading-snug truncate">
                                            {trip.title || "Untitled Trip"}
                                        </p>
                                        {trip.clientName && (
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <User className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400 shrink-0" />
                                                <p className="text-sm text-slate-700 dark:text-zinc-300 font-medium truncate">{trip.clientName}</p>
                                                {trip.clientEmail && (
                                                    <p className="text-xs text-slate-600 dark:text-zinc-400 hidden sm:block truncate">
                                                        · {trip.clientEmail}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "shrink-0 capitalize text-xs font-bold px-2.5 py-0.5 rounded-full",
                                            getStatusClasses(trip.status)
                                        )}
                                    >
                                        {trip.status}
                                    </Badge>
                                </div>

                                {/* Destination */}
                                {trip.destinations && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-white/5">
                                        <Compass className="w-4 h-4 text-primary shrink-0" />
                                        <p className="text-sm font-medium text-slate-700 dark:text-zinc-200">{trip.destinations}</p>
                                    </div>
                                )}
                            </div>

                            {/* --- Stats Grid --- */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Dates */}
                                <div className="p-4 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl rounded-2xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CalendarDays className="w-4 h-4 text-blue-400" />
                                        <p className="text-xs text-slate-600 dark:text-zinc-400 uppercase tracking-wider font-semibold">Dates</p>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatDate(trip.start_date)}</p>
                                    {trip.end_date && (
                                        <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
                                            <ArrowRight className="w-3 h-3" />
                                            {formatDate(trip.end_date)}
                                        </p>
                                    )}
                                    {trip.start_date && trip.end_date && (
                                        <p className="text-xs text-primary mt-1 font-bold">
                                            {formatDuration(trip.start_date, trip.end_date)}
                                        </p>
                                    )}
                                </div>

                                {/* Cost */}
                                <div className="p-4 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl rounded-2xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        <p className="text-xs text-slate-600 dark:text-zinc-400 uppercase tracking-wider font-semibold">Cost</p>
                                    </div>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                        {trip.tripCost > 0
                                            ? formatMoney(trip.tripCost, trip.currency || agencySettings?.default_currency || DEFAULT_CURRENCY)
                                            : "N/A"}
                                    </p>
                                    {trip.budget && trip.budget > 0 && trip.budget !== trip.tripCost && (
                                        <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5 font-medium">
                                            Budget: {formatMoney(trip.budget, trip.currency || agencySettings?.default_currency || DEFAULT_CURRENCY)}
                                        </p>
                                    )}
                                </div>

                                {/* Pax */}
                                {totalPax > 0 && (
                                    <div className="p-4 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl rounded-2xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="w-4 h-4 text-amber-400" />
                                            <p className="text-xs text-slate-600 dark:text-zinc-400 uppercase tracking-wider font-semibold">Travellers</p>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{totalPax} pax</p>
                                        <div className="flex gap-2 mt-1 text-[10px] text-slate-600 dark:text-zinc-400 font-medium">
                                            {(trip.adult_pax ?? 0) > 0 && <span>{trip.adult_pax}A</span>}
                                            {(trip.child_pax ?? 0) > 0 && <span>{trip.child_pax}C</span>}
                                            {(trip.infant_pax ?? 0) > 0 && <span>{trip.infant_pax}I</span>}
                                        </div>
                                    </div>
                                )}

                                {/* Last Updated */}
                                <div className="p-4 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl rounded-2xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
                                        <p className="text-xs text-slate-600 dark:text-zinc-400 uppercase tracking-wider font-semibold">Updated</p>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatDate(trip.updated_at)}</p>
                                    <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                                        Created {formatDate(trip.created_at)}
                                    </p>
                                </div>
                            </div>

                            {/* --- Status Change --- */}
                            <div className="p-4 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl rounded-2xl">
                                <p className="text-xs text-slate-600 dark:text-zinc-400 uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5">
                                    <Plane className="w-3.5 h-3.5 text-primary" />
                                    Change Status
                                </p>
                                <Select
                                    value={trip.status.toLowerCase()}
                                    onValueChange={(val) => onStatusChange(trip.id, val)}
                                >
                                    <SelectTrigger className="bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white h-10 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-2xl border-slate-300 dark:border-white/10 text-slate-900 dark:text-white">
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
                            <div className="p-5 bg-white/60 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl space-y-3">
                                <h5 className="text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-widest border-b border-slate-200 dark:border-white/5 pb-2 flex items-center gap-2">
                                    <Receipt className="w-3.5 h-3.5" /> Invoice
                                </h5>

                                {invoiceUrl ? (
                                    <>
                                        {/* Invoice URL Display */}
                                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-lg p-2.5">
                                            <p className="text-xs text-slate-600 dark:text-gray-400 truncate flex-1 font-mono">{invoiceUrl}</p>
                                        </div>

                                        {/* Invoice Actions */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-purple-500/30 bg-purple-500/5 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 h-9"
                                                onClick={handleViewInvoice}
                                            >
                                                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                                View Invoice
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    "border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white h-9 transition-all",
                                                    copied && "border-green-500/30 bg-green-500/5 text-green-600 dark:text-green-400"
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

                                        <p className="text-[10px] text-slate-500 dark:text-gray-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            This link is accessible to you and the assigned client.
                                        </p>

                                        {/* Regenerate option */}
                                        <button
                                            onClick={handleGenerateInvoice}
                                            disabled={isGenerating}
                                            className="text-[11px] text-slate-500 dark:text-gray-600 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1"
                                        >
                                            <ChevronRight className="w-3 h-3" />
                                            {isGenerating ? "Regenerating..." : "Regenerate Invoice Link"}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xs text-slate-500 dark:text-gray-500">Generate a secure invoice link to share with your client.</p>
                                        <Button
                                            className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 border border-slate-300 dark:border-zinc-700/80 font-semibold h-10 rounded-lg"
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
                                    className="flex-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 h-10"
                                    variant="outline"
                                    onClick={() => onViewItinerary(trip)}
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Itinerary
                                </Button>
                                <Button
                                    className="flex-1 border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white h-10"
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
                                        <div className="text-center py-12 text-slate-500 dark:text-gray-500 bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-300 dark:border-white/10 rounded-xl space-y-3">
                                            <Compass className="w-8 h-8 mx-auto text-slate-400 dark:text-gray-600 opacity-40" />
                                            <p className="text-sm">No day-by-day itinerary data found.</p>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-300 dark:before:bg-white/10 pl-7 py-2">
                                        {days.map((day: any, idx: number) => (
                                            <div key={idx} className="relative space-y-1.5">
                                                <div className="absolute -left-[24px] top-1.5 w-2 h-2 rounded-full bg-purple-500 ring-4 ring-purple-500/20" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Day {idx + 1}</p>
                                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                                                    {day.title || day.areaFocus || `Day ${idx + 1}`}
                                                </h4>
                                                {day.description && (
                                                    <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed pt-1">
                                                        {day.description}
                                                    </p>
                                                )}
                                                {day.activities && day.activities.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 pt-2">
                                                        {day.activities.map((act: any, actIdx: number) => (
                                                            <Badge key={actIdx} variant="outline" className="text-[10px] bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-gray-300 font-normal px-2 py-0.5">
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
                                const rawHotels = trip.itinerary_data?.hotels || [];
                                const rawFlights = trip.itinerary_data?.flights || [];
                                const rawCabs = trip.itinerary_data?.cabs || [];
                                const rawBuses = trip.itinerary_data?.buses || [];

                                // Only keep verified, complete logistics entries
                                const hotels = rawHotels.filter((h: any) => isLogisticsComplete(h, "hotel"));
                                const flights = rawFlights.filter((f: any) => isLogisticsComplete(f, "flight"));
                                const cabs = rawCabs.filter((c: any) => isLogisticsComplete(c, "cab"));
                                const buses = rawBuses.filter((b: any) => isLogisticsComplete(b, "bus"));
                                const hasLogistics = hotels.length > 0 || flights.length > 0 || cabs.length > 0 || buses.length > 0;

                                if (!hasLogistics) {
                                    return (
                                        <div className="text-center py-12 text-slate-500 dark:text-gray-500 bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-300 dark:border-white/10 rounded-xl space-y-3">
                                            <Hotel className="w-8 h-8 mx-auto text-slate-400 dark:text-gray-600 opacity-40" />
                                            <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">No completed logistics found</p>
                                            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
                                                Only verified and complete accommodation, flight, and transport bookings are displayed here.
                                            </p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-6">
                                        {/* Hotels */}
                                        {hotels.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 flex items-center gap-1.5">
                                                        <Hotel className="w-3.5 h-3.5" /> Accommodation ({hotels.length})
                                                    </h4>
                                                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> All Complete
                                                    </span>
                                                </div>
                                                {hotels.map((h: any) => (
                                                    <div key={h.id} className="p-3.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-300 dark:border-white/10 rounded-xl space-y-2">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{h.name || "Unnamed Hotel"}</p>
                                                                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-1.5 py-0 font-medium">
                                                                        Complete
                                                                    </Badge>
                                                                </div>
                                                                {h.address && <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">{h.address}</p>}
                                                            </div>
                                                            {h.starRating && (
                                                                <div className="flex gap-0.5 shrink-0 pt-1">
                                                                    {Array.from({ length: h.starRating }).map((_, i) => (
                                                                        <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-gray-400 border-t border-slate-200 dark:border-white/5 pt-2 mt-1">
                                                            <p>Check-in: <span className="text-slate-800 dark:text-zinc-200">{h.checkIn || "—"}</span></p>
                                                            <p>Check-out: <span className="text-slate-800 dark:text-zinc-200">{h.checkOut || "—"}</span></p>
                                                            {h.nights && <p>Nights: <span className="text-slate-800 dark:text-zinc-200">{h.nights}</span></p>}
                                                            {h.bookingRef && <p>Booking Ref: <span className="text-slate-800 dark:text-zinc-200">{h.bookingRef}</span></p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Flights */}
                                        {flights.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                                        <Plane className="w-3.5 h-3.5" /> Flights ({flights.length})
                                                    </h4>
                                                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> All Complete
                                                    </span>
                                                </div>
                                                {flights.map((f: any) => (
                                                    <div key={f.id} className="p-3.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-300 dark:border-white/10 rounded-xl space-y-2.5">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{f.airline || "Airline"} {f.flightNumber || ""}</p>
                                                                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-1.5 py-0 font-medium">
                                                                    Complete
                                                                </Badge>
                                                            </div>
                                                            {f.pnr && <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">{f.pnr}</Badge>}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-gray-400 border-t border-slate-200 dark:border-white/5 pt-2.5 mt-1">
                                                            <div className="flex-1">
                                                                <p className="text-[9px] text-slate-400 dark:text-gray-500 uppercase font-semibold">Departure</p>
                                                                <p className="text-xs text-slate-800 dark:text-zinc-200 font-semibold">{f.departureAirport || "—"}</p>
                                                                <p className="text-[11px] text-slate-600 dark:text-gray-400">{f.departure || "—"}</p>
                                                            </div>
                                                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-gray-600" />
                                                            <div className="flex-1 text-right">
                                                                <p className="text-[9px] text-slate-400 dark:text-gray-500 uppercase font-semibold">Arrival</p>
                                                                <p className="text-xs text-slate-800 dark:text-zinc-200 font-semibold">{f.arrivalAirport || "—"}</p>
                                                                <p className="text-[11px] text-slate-600 dark:text-gray-400">{f.arrival || "—"}</p>
                                                            </div>
                                                        </div>
                                                        {f.terminal && <p className="text-[10px] text-slate-500 dark:text-gray-500 mt-1">Terminal: <span className="text-slate-800 dark:text-gray-300">{f.terminal}</span></p>}
                                                        {f.flightType === "connecting" && f.connectingFlightNumber && (
                                                            <div className="mt-2 p-2 rounded-lg bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-[11px] text-slate-600 dark:text-gray-400 space-y-1">
                                                                <p className="font-semibold text-slate-800 dark:text-zinc-200">Connecting: {f.connectingAirline} {f.connectingFlightNumber}</p>
                                                                <p>{f.connectingDepartureAirport} ({f.connectingDeparture}) → {f.connectingArrivalAirport} ({f.connectingArrival})</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Cabs */}
                                        {cabs.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300 flex items-center gap-1.5">
                                                        <Car className="w-3.5 h-3.5" /> Cabs ({cabs.length})
                                                    </h4>
                                                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> All Complete
                                                    </span>
                                                </div>
                                                {cabs.map((c: any) => (
                                                    <div key={c.id} className="p-3.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-300 dark:border-white/10 rounded-xl space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.vehicleType || "Cab"}</p>
                                                                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-1.5 py-0 font-medium">
                                                                    Complete
                                                                </Badge>
                                                            </div>
                                                            {c.pickupTime && <span className="text-xs text-slate-600 dark:text-gray-400">{c.pickupTime}</span>}
                                                        </div>
                                                        {c.route && <p className="text-xs text-slate-700 dark:text-gray-300">{c.route}</p>}
                                                        {(c.driverName || c.driverContact) && (
                                                            <div className="text-[11px] text-slate-500 dark:text-gray-500 border-t border-slate-200 dark:border-white/5 pt-2 flex justify-between">
                                                                <span>Driver: <span className="text-slate-800 dark:text-gray-300">{c.driverName || "TBD"}</span></span>
                                                                {c.driverContact && <span>Contact: <span className="text-slate-800 dark:text-gray-300">{c.driverContact}</span></span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Buses */}
                                        {buses.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-500 dark:text-yellow-400 flex items-center gap-1.5">
                                                        <Bus className="w-3.5 h-3.5" /> Buses ({buses.length})
                                                    </h4>
                                                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> All Complete
                                                    </span>
                                                </div>
                                                {buses.map((b: any) => (
                                                    <div key={b.id} className="p-3.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-300 dark:border-white/10 rounded-xl space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{b.busType || "Bus"}</p>
                                                                <Badge variant="outline" className="text-[10px] border-slate-300 dark:border-white/10 text-slate-600 dark:text-gray-400 font-medium">
                                                                    Complete
                                                                </Badge>
                                                            </div>
                                                            {b.pnr && <Badge variant="outline" className="text-[10px] border-slate-300 dark:border-white/10 text-slate-600 dark:text-gray-400">{b.pnr}</Badge>}
                                                        </div>
                                                        {b.route && <p className="text-xs text-slate-700 dark:text-gray-300">{b.route}</p>}
                                                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-gray-400 border-t border-slate-200 dark:border-white/5 pt-2">
                                                            <p>Report: <span className="text-slate-800 dark:text-zinc-200">{b.reportingTime || "—"}</span></p>
                                                            <p>Depart: <span className="text-slate-800 dark:text-zinc-200">{b.departureTime || "—"}</span></p>
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
                            {!hasFinances ? (
                                <div className="text-center py-12 text-slate-500 dark:text-gray-500 bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-300 dark:border-white/10 rounded-xl space-y-3">
                                    <Receipt className="w-8 h-8 mx-auto text-slate-400 dark:text-gray-600 opacity-40" />
                                    <p className="text-sm font-semibold">No finance details configured.</p>
                                </div>
                            ) : !isFinancesExpanded ? (
                                /* --- SUMMARY FORM (when NOT expanded) --- */
                                <div className="space-y-4">
                                    {/* Main Summary Card */}
                                    <div className="p-5 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl rounded-2xl space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2.5">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                                                <Receipt className="w-3.5 h-3.5 text-primary" /> Financial Summary
                                            </span>
                                            <Badge variant="outline" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20">
                                                {pricingConfig.tiersEnabled && pricingConfig.tiers?.[pricingConfig.selectedTier]?.isActive
                                                    ? `${pricingConfig.selectedTier} Tier`
                                                    : "Standard Quoting"}
                                            </Badge>
                                        </div>

                                        <div className="flex items-baseline justify-between pt-1">
                                            <div>
                                                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Total Client Price</p>
                                                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                                    {formatMoney(totalClientPrice, tripCurrency)}
                                                </p>
                                            </div>
                                            {totalPax > 0 && (
                                                <div className="text-right">
                                                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Per Adult</p>
                                                    <p className="text-sm font-bold text-primary">
                                                        {formatMoney(pricingBreakdown?.perAdult ?? (trip.adult_pax ? totalClientPrice / trip.adult_pax : totalClientPrice), tripCurrency)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-white/5 text-center">
                                            <div className="p-2.5 rounded-xl bg-slate-100/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                                                <p className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold">Net Cost</p>
                                                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-0.5">
                                                    {formatMoney(totalBaseCost, tripCurrency)}
                                                </p>
                                            </div>
                                            <div className="p-2.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20">
                                                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-semibold">Est. Profit</p>
                                                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                                                    +{formatMoney(totalMarkupAmount, tripCurrency)}
                                                </p>
                                            </div>
                                            <div className="p-2.5 rounded-xl bg-slate-100/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                                                <p className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold">Taxes</p>
                                                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-0.5">
                                                    {totalTaxAmount > 0 ? formatMoney(totalTaxAmount, tripCurrency) : "₹0"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600 dark:text-zinc-400">
                                            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                                                <Users className="w-3 h-3 text-slate-500" />
                                                {totalPax > 0 ? `${totalPax} Travelers` : "2 Adults (Default)"}
                                            </span>
                                            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                                                <Layers className="w-3 h-3 text-slate-500" />
                                                {allLineItems.length} Cost Items
                                            </span>
                                            {pricingBreakdown?.milestoneAmounts && pricingBreakdown.milestoneAmounts.length > 0 && (
                                                <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                                                    <CreditCard className="w-3 h-3 text-slate-500" />
                                                    {pricingBreakdown.milestoneAmounts.length} Milestones
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expand Button with Downward Facing Arrow */}
                                    <button
                                        type="button"
                                        onClick={() => setIsFinancesExpanded(true)}
                                        className="w-full flex items-center justify-between p-3.5 bg-white/70 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 rounded-2xl transition-all shadow-sm group cursor-pointer text-left"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                <Receipt className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                    Show All Finance Details
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                                                    Expand itemized cost breakdown, markup, taxes & milestones
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-primary text-xs font-bold shrink-0">
                                            <span>Expand</span>
                                            <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                        </div>
                                    </button>
                                </div>
                            ) : (
                                /* --- EXPANDED FORM (each and every finance detail) --- */
                                <div className="space-y-4">
                                    {/* Collapse Button with Downward Facing Arrow (rotated) */}
                                    <button
                                        type="button"
                                        onClick={() => setIsFinancesExpanded(false)}
                                        className="w-full flex items-center justify-between p-3.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-2xl transition-all shadow-sm group cursor-pointer text-left"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                                <Receipt className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                    All Financial Details
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                                                    Showing every cost item, margin, tax, and milestone calculation
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-primary text-xs font-bold shrink-0">
                                            <span>Collapse</span>
                                            <ChevronDown className="w-4 h-4 rotate-180 group-hover:-translate-y-0.5 transition-transform" />
                                        </div>
                                    </button>

                                    {/* 1. Core Financial Calculation Breakdown */}
                                    <div className="p-4 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl rounded-2xl space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-white/5 pb-2">
                                            <TrendingUp className="w-3.5 h-3.5 text-primary" /> Pricing Calculation & Margins
                                        </h4>
                                        <div className="space-y-2.5 text-xs">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600 dark:text-zinc-400">Costing Mode</span>
                                                <span className="capitalize text-slate-900 dark:text-white font-semibold">
                                                    {pricingConfig.tiersEnabled && pricingConfig.tiers?.[pricingConfig.selectedTier]?.isActive
                                                        ? `${pricingConfig.selectedTier} Tier`
                                                        : "Manual / Itemized"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600 dark:text-zinc-400">Trip Currency</span>
                                                <span className="text-slate-900 dark:text-white font-semibold">
                                                    {tripCurrency} ({currencySymbol})
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600 dark:text-zinc-400">Base Net Cost (Total Vendor Expense)</span>
                                                <span className="text-slate-900 dark:text-white font-semibold">
                                                    {formatMoney(totalBaseCost, tripCurrency)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600 dark:text-zinc-400">
                                                    Markup ({pricingConfig.markupType === "percentage" ? `${pricingConfig.markupValue}%` : "Flat"})
                                                </span>
                                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                                    + {formatMoney(totalMarkupAmount, tripCurrency)}
                                                </span>
                                            </div>
                                            {totalTaxAmount > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-600 dark:text-zinc-400">
                                                        Taxes ({pricingConfig.taxPercentage || 0}%)
                                                    </span>
                                                    <span className="text-slate-700 dark:text-zinc-300 font-semibold">
                                                        + {formatMoney(totalTaxAmount, tripCurrency)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center border-t border-slate-200 dark:border-white/5 pt-2.5 text-sm">
                                                <span className="font-bold text-slate-900 dark:text-white">Quoted Client Gross Price</span>
                                                <span className="font-black text-primary text-base">
                                                    {formatMoney(totalClientPrice, tripCurrency)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Pax Breakdown if pax > 0 */}
                                        {totalPax > 0 && (
                                            <div className="mt-3 p-3 rounded-xl bg-slate-100/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 text-xs space-y-1.5">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                                                    Per-Person Rates ({totalPax} Total Pax)
                                                </p>
                                                <div className="grid grid-cols-2 gap-2 pt-1">
                                                    <div>
                                                        <span className="text-slate-500 dark:text-zinc-400">Adult ({trip.adult_pax || pricingConfig.adultPax || 2}): </span>
                                                        <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                                            {formatMoney(pricingBreakdown?.perAdult ?? (trip.adult_pax ? totalClientPrice / trip.adult_pax : totalClientPrice), tripCurrency)} / pax
                                                        </span>
                                                    </div>
                                                    {(trip.child_pax ?? 0) > 0 && (
                                                        <div>
                                                            <span className="text-slate-500 dark:text-zinc-400">Child ({trip.child_pax}): </span>
                                                            <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                                                {formatMoney(pricingBreakdown?.perChild ?? 0, tripCurrency)} / pax
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 2. Each and Every Itemized Expense Detail */}
                                    <div className="p-4 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl rounded-2xl space-y-3">
                                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                                                <Layers className="w-3.5 h-3.5 text-primary" /> Itemized Line Items ({allLineItems.length})
                                            </h4>
                                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                                                Detailed Cost Breakdown
                                            </span>
                                        </div>

                                        {allLineItems.length > 0 ? (
                                            <div className="space-y-2.5">
                                                {allLineItems.map((item, idx) => {
                                                    const badge = getCategoryBadge(item.category);
                                                    const CategoryIcon = badge.icon;
                                                    return (
                                                        <div
                                                            key={item.id || idx}
                                                            className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-xl space-y-2 hover:border-slate-300 dark:hover:border-white/10 transition-colors"
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={cn("text-[9px] px-1.5 py-0 flex items-center gap-1 font-semibold", badge.classes)}
                                                                        >
                                                                            <CategoryIcon className="w-2.5 h-2.5" />
                                                                            {badge.label}
                                                                        </Badge>
                                                                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                                                            {item.title}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-900 dark:text-white shrink-0">
                                                                    {formatMoney(item.grossCost, item.currency || tripCurrency)}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 pt-1 border-t border-slate-200/60 dark:border-white/5">
                                                                <span>
                                                                    Net Base: <strong className="text-slate-700 dark:text-zinc-300">{formatMoney(item.netCost, item.currency || tripCurrency)}</strong>
                                                                </span>
                                                                <span>
                                                                    Markup: <strong className="text-emerald-600 dark:text-emerald-400">+{item.markupPct}%</strong> ({formatMoney(item.grossCost - item.netCost, item.currency || tripCurrency)})
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Line items totals footer */}
                                                <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-xs flex justify-between items-center font-bold">
                                                    <span className="text-slate-700 dark:text-zinc-300">Total of {allLineItems.length} Items</span>
                                                    <span className="text-primary font-black text-sm">
                                                        {formatMoney(allLineItems.reduce((acc, it) => acc + it.grossCost, 0), tripCurrency)}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 text-slate-500 dark:text-zinc-400 text-xs">
                                                Package-level cost quoted without itemized item breakdown.
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. Payment Milestones Schedule */}
                                    {pricingBreakdown?.milestoneAmounts && pricingBreakdown.milestoneAmounts.length > 0 && (
                                        <div className="p-4 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl rounded-2xl space-y-3">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-white/5 pb-2">
                                                <CreditCard className="w-3.5 h-3.5 text-primary" /> Payment Milestones Schedule ({pricingBreakdown.milestoneAmounts.length})
                                            </h4>
                                            <div className="space-y-2.5">
                                                {pricingBreakdown.milestoneAmounts.map((m: any, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 flex justify-between items-center text-xs"
                                                    >
                                                        <div>
                                                            <p className="font-semibold text-slate-900 dark:text-white">
                                                                {m.name || m.title || `Milestone ${idx + 1}`}
                                                            </p>
                                                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                                                                {m.percentage}% due {m.dueDate ? `· ${m.dueDate}` : ""}
                                                            </p>
                                                        </div>
                                                        <span className="font-bold text-primary text-sm">
                                                            {formatMoney(m.amount, tripCurrency)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 4. Payment Collection & Tracking */}
                                    <div className="p-4 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl rounded-2xl space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-white/5 pb-2">
                                            <Wallet className="w-3.5 h-3.5 text-primary" /> Payment Collection & Balance
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                            <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20">
                                                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-semibold">Total Paid</p>
                                                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                                                    {formatMoney(totalPaid, tripCurrency)}
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                                                <p className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold">Balance Due</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                                                    {formatMoney(balanceDue, tripCurrency)}
                                                </p>
                                            </div>
                                        </div>

                                        {payments.length > 0 && (
                                            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-white/5">
                                                <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-zinc-400">Payment Transactions</p>
                                                {payments.map((p: any) => (
                                                    <div key={p.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-100/50 dark:bg-white/[0.02]">
                                                        <div>
                                                            <span className="font-semibold text-slate-800 dark:text-zinc-200 capitalize">{p.method?.replace('_', ' ') || 'Payment'}</span>
                                                            {p.reference && <span className="text-[10px] text-slate-400 ml-1.5">Ref: {p.reference}</span>}
                                                            {p.date && <p className="text-[10px] text-slate-400">{formatDate(p.date)}</p>}
                                                        </div>
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                            +{formatMoney(Number(p.amount) || 0, tripCurrency)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
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
                                        <div className="text-center py-12 text-slate-500 dark:text-gray-500 bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-300 dark:border-white/10 rounded-xl space-y-3">
                                            <ScrollText className="w-8 h-8 mx-auto text-slate-400 dark:text-gray-600 opacity-40" />
                                            <p className="text-sm">No inclusions or policy details configured.</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-5">
                                        {inclusions && (
                                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1.5">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Inclusions
                                                </h4>
                                                <p className="text-xs text-emerald-900 dark:text-emerald-200/95 whitespace-pre-wrap leading-relaxed">{inclusions}</p>
                                            </div>
                                        )}
                                        {exclusions && (
                                            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-1.5">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                                                    <XCircle className="w-3.5 h-3.5" /> Exclusions
                                                </h4>
                                                <p className="text-xs text-rose-900 dark:text-rose-200/95 whitespace-pre-wrap leading-relaxed">{exclusions}</p>
                                            </div>
                                        )}
                                        {cancellation && (
                                            <div className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl space-y-1.5">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300 flex items-center gap-1.5">
                                                    <AlertCircle className="w-3.5 h-3.5" /> Cancellation Policy
                                                </h4>
                                                <p className="text-xs text-slate-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{cancellation}</p>
                                            </div>
                                        )}
                                        {payment && (
                                            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-1.5">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                                                    <CreditCard className="w-3.5 h-3.5" /> Payment Methods
                                                </h4>
                                                <p className="text-xs text-indigo-900 dark:text-indigo-200/95 whitespace-pre-wrap leading-relaxed">{payment}</p>
                                            </div>
                                        )}
                                        {terms && (
                                            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-1.5">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                                                    <ScrollText className="w-3.5 h-3.5" /> Terms & Conditions
                                                </h4>
                                                <p className="text-xs text-blue-900 dark:text-blue-200/95 whitespace-pre-wrap leading-relaxed">{terms}</p>
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

