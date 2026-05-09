"use client";

import React, { useState, useCallback } from "react";
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
    Plane,
    Car,
    Bus,
    Hotel,
    FileText,
    DollarSign,
    Clock,
    Info,
    Users,
    Trash2,
    Calendar,
    Receipt,
    ExternalLink,
    Copy,
    Check,
    LoaderCircle,
    User,
    Mail,
    PhoneCall,
    Percent,
    AlertCircle,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrencySymbol, formatMoney } from "@/lib/utils/currency";
import { DEFAULT_CURRENCY } from "@/types/pricing";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

interface Client {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
}

interface BookingDetailSheetProps {
    booking: any | null;
    onClose: () => void;
    onDelete: (id: string) => void;
    deleting: string | null;
    client?: Client | null;
}

export const BookingDetailSheet = ({
    booking,
    onClose,
    onDelete,
    deleting,
    client,
}: BookingDetailSheetProps) => {
    const { agencySettings } = useAuth();
    const { toast } = useToast();

    const [isGenerating, setIsGenerating] = useState(false);
    const [invoiceUrl, setInvoiceUrl] = useState<string | null>(
        // Pre-populate if already generated
        booking?.share_token && booking?.share_enabled
            ? `${window?.location?.origin || ""}/invoice/booking/${booking.share_token}`
            : null
    );
    const [copied, setCopied] = useState(false);

    const getIcon = (type: string) => {
        switch (type) {
            case "flight": return <Plane className="w-5 h-5 text-blue-400" />;
            case "cab": return <Car className="w-5 h-5 text-yellow-400" />;
            case "bus": return <Bus className="w-5 h-5 text-green-400" />;
            case "train": return <Bus className="w-5 h-5 text-orange-400" />;
            case "hotel": return <Hotel className="w-5 h-5 text-purple-400" />;
            default: return <FileText className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStatusClasses = (status: string) => {
        const s = (status || "").toLowerCase();
        if (s === "confirmed") return "bg-green-500/10 text-green-400 border-green-500/20";
        if (s === "draft") return "bg-gray-500/10 text-gray-400 border-gray-500/20";
        if (s === "cancelled") return "bg-red-500/10 text-red-400 border-red-500/20";
        if (s === "quoted") return "bg-blue-500/10 text-blue-400 border-blue-500/20";
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const currencySymbol = getCurrencySymbol(booking?.currency || agencySettings?.default_currency || DEFAULT_CURRENCY);
    const netCost = Number(booking?.net_cost) || 0;
    const markup = Number(booking?.markup_percentage) || 0;
    const grossCost = netCost * (1 + markup / 100);

    const handleGenerateInvoice = useCallback(async () => {
        if (!booking?.id) return;
        setIsGenerating(true);
        try {
            const res = await fetch("/api/bookings/generate-invoice-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId: booking.id }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to generate invoice");
            }

            const fullUrl = `${window.location.origin}/invoice/booking/${data.share_token}`;
            setInvoiceUrl(fullUrl);

            toast({
                title: data.already_existed ? "Invoice Already Exists" : "Invoice Generated!",
                description: data.already_existed
                    ? "An invoice link for this booking already exists."
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
    }, [booking?.id, toast]);

    const handleCopyLink = useCallback(async () => {
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

    const handleViewInvoice = useCallback(() => {
        if (!invoiceUrl) return;
        window.open(invoiceUrl, "_blank", "noopener,noreferrer");
    }, [invoiceUrl]);

    // Sync invoice URL when booking prop changes (e.g. after refresh)
    React.useEffect(() => {
        if (booking?.share_token && booking?.share_enabled) {
            setInvoiceUrl(`${window.location.origin}/invoice/booking/${booking.share_token}`);
        } else {
            setInvoiceUrl(null);
        }
    }, [booking?.share_token, booking?.share_enabled]);

    return (
        <Sheet open={!!booking} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="bg-[#0A0A0A] border-l border-white/10 text-white w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                        Booking Details
                    </SheetTitle>
                    <SheetDescription className="text-gray-400">
                        Full details, invoice, and sharing options.
                    </SheetDescription>
                </SheetHeader>

                {booking && (
                    <div className="space-y-5">

                        {/* ── Header Info ── */}
                        <div className="p-5 bg-white/[0.03] border border-white/10 rounded-xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/5 rounded-lg">
                                        {getIcon(booking.service_type)}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-white leading-tight">{booking.title}</h4>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{booking.service_type}</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className={cn("capitalize px-2.5 py-0.5 text-xs", getStatusClasses(booking.status))}>
                                    {booking.status || "Draft"}
                                </Badge>
                            </div>
                        </div>

                        {/* ── Client Details ── */}
                        <div className="p-5 bg-white/[0.03] border border-white/10 rounded-xl">
                            <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
                                <User className="w-3.5 h-3.5" /> Client
                            </h5>
                            {client ? (
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                                            {client.name.charAt(0).toUpperCase()}
                                        </div>
                                        <p className="font-semibold text-white">{client.name}</p>
                                    </div>
                                    {client.email && (
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                            <span className="truncate">{client.email}</span>
                                        </div>
                                    )}
                                    {client.phone && (
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <PhoneCall className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                            <span>{client.phone}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No client assigned to this booking.</p>
                            )}
                        </div>

                        {/* ── Financials ── */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <DollarSign className="w-4 h-4 text-green-400" />
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Net Cost</p>
                                </div>
                                <p className="text-lg font-bold text-white">{formatMoney(netCost, booking?.currency || agencySettings?.default_currency || DEFAULT_CURRENCY)}</p>
                            </div>
                            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <Percent className="w-4 h-4 text-blue-400" />
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Markup</p>
                                </div>
                                <p className="text-lg font-bold text-white">{markup}%</p>
                            </div>
                        </div>

                        <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-purple-300">Total Gross Amount</p>
                                <p className="text-xl font-black text-white">{formatMoney(grossCost, booking?.currency || agencySettings?.default_currency || DEFAULT_CURRENCY)}</p>
                            </div>
                        </div>

                        {/* ── Technical Details ── */}
                        <div className="p-5 bg-white/[0.03] border border-white/10 rounded-xl space-y-4">
                            <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2">Technical Details</h5>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-start gap-3">
                                    <Hotel className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase">Provider / Vendor</p>
                                        <p className="text-sm font-medium text-gray-200">{booking.booking_details?.provider || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Info className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase">PNR / Confirmation</p>
                                        <p className="text-sm font-medium text-gray-200">{booking.booking_details?.pnr_or_confirmation || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Users className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase">Passengers / Pax</p>
                                        <p className="text-sm font-medium text-gray-200">{booking.booking_details?.passengers || 1} Person(s)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Notes ── */}
                        {booking.booking_details?.notes && (
                            <div className="p-5 bg-white/[0.03] border border-white/10 rounded-xl">
                                <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2 mb-3">Notes</h5>
                                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{booking.booking_details.notes}</p>
                            </div>
                        )}

                        {/* ── Invoice Section ── */}
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

                        {/* ── Metadata ── */}
                        <div className="px-1 flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-[10px] text-gray-600">
                                <Clock className="w-3 h-3" />
                                <span>Created: {formatDate(booking.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-600">
                                <Calendar className="w-3 h-3" />
                                <span>Last Updated: {formatDate(booking.updated_at)}</span>
                            </div>
                        </div>

                        {/* ── Danger Zone ── */}
                        <div className="pt-2 flex gap-2 border-t border-white/5">
                            <Button
                                variant="destructive"
                                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                onClick={() => onDelete(booking.id)}
                                disabled={deleting === booking.id}
                            >
                                {deleting === booking.id ? (
                                    <LoaderCircle className="w-4 h-4 animate-spin" />
                                ) : (
                                    <><Trash2 className="w-4 h-4 mr-2" /> Delete Booking</>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                                onClick={onClose}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};
