"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Plus, Trash2, CheckCircle2, Clock, Calendar, Sparkles,
    Search, Check, ArrowRight, ShieldCheck, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripFinancial, Payment, PaymentMilestone } from "@/types/financial";
import type { Currency } from "@/types/pricing";

interface PaymentsTabProps {
    financials: TripFinancial[];
    paymentMethods: { value: string; label: string }[];
    paymentTypes: { value: string; label: string }[];
    cs: (currency?: Currency) => string;
    fm: (amount: number | string, currency?: Currency) => string;
    selectedTripFin: TripFinancial | null;
    setSelectedTripFin: (fin: TripFinancial | null) => void;
    showAddPayment: boolean;
    setShowAddPayment: (v: boolean) => void;
    addPayment: (itineraryId: string, payment: Omit<Payment, "id">) => Promise<void>;
    deletePayment: (itineraryId: string, paymentId: string) => Promise<void>;
}

export function PaymentsTab({
    financials,
    paymentMethods,
    paymentTypes,
    cs,
    fm,
    selectedTripFin,
    setSelectedTripFin,
    showAddPayment,
    setShowAddPayment,
    addPayment,
    deletePayment,
}: PaymentsTabProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">("all");

    // Modal state
    const [payAmt, setPayAmt] = useState("");
    const [payMethod, setPayMethod] = useState(paymentMethods[0]?.value ?? "bank_transfer");
    const [payType, setPayType] = useState(paymentTypes[0]?.value ?? "advance");
    const [payRef, setPayRef] = useState("");
    const [payNotes, setPayNotes] = useState("");
    const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);

    // Keep defaults in sync with DB-sourced options
    useEffect(() => {
        if (paymentMethods.length > 0) setPayMethod(paymentMethods[0].value);
    }, [paymentMethods]);
    useEffect(() => {
        if (paymentTypes.length > 0) setPayType(paymentTypes[0].value);
    }, [paymentTypes]);

    const resetForm = () => {
        setPayAmt("");
        setPayMethod(paymentMethods[0]?.value ?? "bank_transfer");
        setPayType(paymentTypes[0]?.value ?? "advance");
        setPayRef("");
        setPayNotes("");
        setPayDate(new Date().toISOString().split("T")[0]);
    };

    /**
     * Smart Open: pre-fills amount, milestone details, and type intelligently
     */
    const handleOpen = (
        fin: TripFinancial,
        opts?: {
            prefillAmount?: number;
            prefillType?: string;
            prefillNotes?: string;
        }
    ) => {
        setSelectedTripFin(fin);
        const totalPaid = fin.payments.reduce((s, p) => s + p.amount, 0);
        const balance = Math.max(0, fin.clientPrice - totalPaid);

        // Autofill amount: custom override, or milestone amount, or remaining balance
        const defaultAmt = opts?.prefillAmount !== undefined
            ? opts.prefillAmount
            : (balance > 0 ? balance : fin.clientPrice);

        // Smart payment type deduction if not explicitly provided
        let defaultType = opts?.prefillType;
        if (!defaultType) {
            if (totalPaid === 0) defaultType = "advance";
            else if (balance <= 0 || defaultAmt >= balance) defaultType = "final";
            else defaultType = "partial";
        }

        setPayAmt(defaultAmt > 0 ? defaultAmt.toString() : "");
        setPayType(defaultType);
        setPayNotes(opts?.prefillNotes || (totalPaid === 0 ? "Initial booking advance" : "Balance collection"));
        setPayMethod(paymentMethods[0]?.value ?? "bank_transfer");
        setPayRef("");
        setPayDate(new Date().toISOString().split("T")[0]);
        setShowAddPayment(true);
    };

    const handleRecordMilestone = (fin: TripFinancial, milestone: PaymentMilestone) => {
        const milestoneAmount = Math.round(fin.clientPrice * (milestone.percentage / 100));
        const totalPaid = fin.payments.reduce((s, p) => s + p.amount, 0);
        const balance = Math.max(0, fin.clientPrice - totalPaid);
        const amt = Math.min(milestoneAmount, balance > 0 ? balance : milestoneAmount);

        let mappedType = "partial";
        const lowerLabel = milestone.label.toLowerCase();
        if (lowerLabel.includes("advance") || lowerLabel.includes("initial") || lowerLabel.includes("deposit")) {
            mappedType = "advance";
        } else if (lowerLabel.includes("final") || lowerLabel.includes("last") || lowerLabel.includes("balance")) {
            mappedType = "final";
        }

        handleOpen(fin, {
            prefillAmount: amt,
            prefillType: mappedType,
            prefillNotes: `Milestone payment: ${milestone.label} (${milestone.percentage}%)`,
        });
    };

    const handleSubmit = () => {
        if (!selectedTripFin || !payAmt) return;
        const amountNum = parseFloat(payAmt);
        if (isNaN(amountNum) || amountNum <= 0) return;

        addPayment(selectedTripFin.itineraryId, {
            itineraryId: selectedTripFin.itineraryId,
            amount: amountNum,
            date: payDate || new Date().toISOString(),
            method: payMethod,
            type: payType,
            reference: payRef,
            notes: payNotes,
        });
    };

    // Filtered list of trips
    const filteredFinancials = useMemo(() => {
        return financials.filter((fin) => {
            const matchesSearch =
                fin.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fin.tripTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fin.destination.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            const totalPaid = fin.payments.reduce((s, p) => s + p.amount, 0);
            const isPaid = totalPaid >= fin.clientPrice && fin.clientPrice > 0;

            if (statusFilter === "paid") return isPaid;
            if (statusFilter === "pending") return !isPaid;
            return true;
        });
    }, [financials, searchQuery, statusFilter]);

    return (
        <>
            <div className="space-y-5">
                {/* Header with Search & Quick Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/[0.02] border border-white/[0.06] p-3 rounded-xl backdrop-blur-sm">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                            placeholder="Search by client, trip title, or destination..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-9 text-xs"
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 shrink-0">
                        {(["all", "pending", "paid"] as const).map((st) => (
                            <button
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-md capitalize transition-all",
                                    statusFilter === st
                                        ? "bg-purple-600 text-white shadow-sm"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {st === "all" ? "All Trips" : st}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List of Trip Payment Cards */}
                <div className="space-y-4">
                    {filteredFinancials.map((fin) => {
                        const totalPaid = fin.payments.reduce((s, p) => s + p.amount, 0);
                        const balance = Math.max(0, fin.clientPrice - totalPaid);
                        const paidPct = fin.clientPrice > 0 ? (totalPaid / fin.clientPrice) * 100 : 0;
                        const isFullyPaid = paidPct >= 100 && fin.clientPrice > 0;

                        // Fallback milestone schedule if none configured in the-lab
                        const effectiveMilestones: PaymentMilestone[] = fin.milestones?.length > 0
                            ? fin.milestones
                            : [
                                { label: "Advance Deposit", percentage: 30, daysBeforeTrip: 30 },
                                { label: "Final Balance", percentage: 70, daysBeforeTrip: 10 },
                            ];

                        return (
                            <div
                                key={fin.tripId || fin.itineraryId}
                                className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] hover:border-white/[0.15] transition-all rounded-2xl p-5 space-y-4 shadow-xl"
                            >
                                {/* Trip Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold text-white tracking-wide">
                                                {fin.clientName}
                                            </span>
                                            {fin.clientEmail && (
                                                <span className="text-xs text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                                                    {fin.clientEmail}
                                                </span>
                                            )}
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5",
                                                    fin.status === "booked" || fin.status === "confirmed"
                                                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                )}
                                            >
                                                {fin.status}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            {fin.tripTitle} · <span className="text-gray-300">{fin.destination}</span>
                                            {fin.startDate && (
                                                <span className="ml-2 text-gray-500">
                                                    (Travel: {new Date(fin.startDate).toLocaleDateString()})
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    <div className="text-left sm:text-right flex sm:flex-col items-baseline sm:items-end justify-between gap-1">
                                        <div className="text-base font-bold text-white tracking-tight">
                                            {fm(fin.clientPrice, fin.currency)}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className={cn(
                                                    "text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1",
                                                    isFullyPaid
                                                        ? "bg-green-500/15 text-green-400 border border-green-500/30"
                                                        : paidPct > 0
                                                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                                        : "bg-red-500/15 text-red-400 border border-red-500/30"
                                                )}
                                            >
                                                {isFullyPaid ? (
                                                    <>
                                                        <CheckCircle2 className="w-3 h-3" /> Fully Paid
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock className="w-3 h-3" /> {paidPct.toFixed(0)}% collected ({fm(balance, fin.currency)} due)
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[11px] text-gray-400 font-medium">
                                        <span>Collected: <strong className="text-green-400">{fm(totalPaid, fin.currency)}</strong></span>
                                        <span>Total: <strong className="text-white">{fm(fin.clientPrice, fin.currency)}</strong></span>
                                    </div>
                                    <div className="h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-700",
                                                isFullyPaid ? "bg-gradient-to-r from-emerald-500 to-green-400" : paidPct > 50 ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-gradient-to-r from-amber-500 to-orange-400"
                                            )}
                                            style={{ width: `${Math.min(paidPct, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Milestone Suggestions (Autofill One-Click Action) */}
                                {effectiveMilestones.length > 0 && !isFullyPaid && (
                                    <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-3 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                                                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                                <span>Payment Milestones (from The Lab)</span>
                                            </div>
                                            <span className="text-[10px] text-purple-400/80">Click to record instant payment</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                            {effectiveMilestones.map((m, idx) => {
                                                const milestoneAmt = Math.round(fin.clientPrice * (m.percentage / 100));
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="bg-black/30 border border-purple-500/10 hover:border-purple-500/40 rounded-lg p-2.5 flex flex-col justify-between gap-2 transition-all group"
                                                    >
                                                        <div>
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="font-medium text-gray-200">{m.label}</span>
                                                                <span className="text-purple-400 font-bold text-[11px]">{m.percentage}%</span>
                                                            </div>
                                                            <div className="text-sm font-bold text-white mt-0.5">
                                                                {fm(milestoneAmt, fin.currency)}
                                                            </div>
                                                            {m.dueDate && (
                                                                <p className="text-[10px] text-gray-500 mt-0.5">
                                                                    Due: {new Date(m.dueDate).toLocaleDateString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            className="h-6 text-[11px] bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 transition-all justify-center w-full"
                                                            onClick={() => handleRecordMilestone(fin, m)}
                                                        >
                                                            <span>Record {fm(milestoneAmt, fin.currency)}</span>
                                                            <ArrowRight className="w-3 h-3 ml-1" />
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Recorded Payments List */}
                                {fin.payments.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                            Recorded Transactions ({fin.payments.length})
                                        </p>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {fin.payments.map((p) => (
                                                <div
                                                    key={p.id}
                                                    className="flex items-center justify-between px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl text-xs hover:bg-white/[0.04] transition-colors"
                                                >
                                                    <div className="flex items-center gap-2.5 flex-wrap">
                                                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-300 border-0 text-[10px] capitalize font-medium">
                                                            {p.type}
                                                        </Badge>
                                                        <span className="text-gray-300 font-medium capitalize">
                                                            {p.method.replace("_", " ")}
                                                        </span>
                                                        {p.reference && (
                                                            <span className="text-gray-500 font-mono text-[11px]">
                                                                Ref: #{p.reference}
                                                            </span>
                                                        )}
                                                        {p.notes && (
                                                            <span className="text-gray-400 italic text-[11px]">
                                                                "{p.notes}"
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <span className="text-emerald-400 font-bold">
                                                            +{fm(p.amount, fin.currency)}
                                                        </span>
                                                        <span className="text-gray-500 text-[11px]">
                                                            {new Date(p.date).toLocaleDateString()}
                                                        </span>
                                                        <button
                                                            onClick={() => deletePayment(fin.itineraryId, p.id)}
                                                            className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                                                            title="Delete Payment"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 pt-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white flex-1"
                                        onClick={() => handleOpen(fin)}
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                                        <span>Record Payment</span>
                                    </Button>

                                    {!isFullyPaid && balance > 0 && (
                                        <Button
                                            size="sm"
                                            className="h-8 text-xs bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-all shrink-0"
                                            onClick={() => handleOpen(fin, {
                                                prefillAmount: balance,
                                                prefillType: "final",
                                                prefillNotes: "Full settlement of remaining balance",
                                            })}
                                        >
                                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                                            <span>Collect Balance ({fm(balance, fin.currency)})</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {filteredFinancials.length === 0 && (
                        <div className="text-center py-16 bg-white/[0.01] border border-white/5 rounded-2xl space-y-2">
                            <p className="text-sm text-gray-400 font-medium">No trips matched your search filter.</p>
                            <p className="text-xs text-gray-600">Try adjusting your search or add itineraries in The Lab.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Smart Add Payment Dialog */}
            <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
                <DialogContent className="bg-[#0D0D10] border border-white/15 text-white sm:max-w-[460px] shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold">
                            <CreditCard className="w-4 h-4 text-purple-400" />
                            Record Client Payment
                        </DialogTitle>
                        <DialogDescription className="text-gray-400 text-xs">
                            {selectedTripFin
                                ? `${selectedTripFin.clientName} · ${selectedTripFin.tripTitle}`
                                : "Autofilled from itinerary metadata"}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTripFin && (
                        <div className="space-y-4 py-2">
                            {/* Summary strip */}
                            <div className="grid grid-cols-3 gap-2 bg-white/[0.03] border border-white/10 rounded-xl p-3 text-center text-xs">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase">Package</p>
                                    <p className="font-semibold text-white">{fm(selectedTripFin.clientPrice, selectedTripFin.currency)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase">Collected</p>
                                    <p className="font-semibold text-emerald-400">
                                        {fm(selectedTripFin.payments.reduce((s, p) => s + p.amount, 0), selectedTripFin.currency)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase">Due</p>
                                    <p className="font-semibold text-amber-400">
                                        {fm(
                                            Math.max(
                                                0,
                                                selectedTripFin.clientPrice - selectedTripFin.payments.reduce((s, p) => s + p.amount, 0)
                                            ),
                                            selectedTripFin.currency
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Amount & Type */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs text-gray-300 mb-1.5 block">
                                        Amount ({cs(selectedTripFin.currency)})
                                    </Label>
                                    <Input
                                        type="number"
                                        value={payAmt}
                                        onChange={(e) => setPayAmt(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white h-9 text-sm focus-visible:border-purple-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-300 mb-1.5 block">Payment Type</Label>
                                    <Select value={payType} onValueChange={setPayType}>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#141418] border-white/10 text-white">
                                            {paymentTypes.map((pt) => (
                                                <SelectItem key={pt.value} value={pt.value} className="text-xs">
                                                    {pt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Method & Date */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs text-gray-300 mb-1.5 block">Payment Method</Label>
                                    <Select value={payMethod} onValueChange={setPayMethod}>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#141418] border-white/10 text-white">
                                            {paymentMethods.map((pm) => (
                                                <SelectItem key={pm.value} value={pm.value} className="text-xs">
                                                    {pm.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-300 mb-1.5 block">Payment Date</Label>
                                    <Input
                                        type="date"
                                        value={payDate}
                                        onChange={(e) => setPayDate(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white h-9 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Reference # */}
                            <div>
                                <Label className="text-xs text-gray-300 mb-1.5 block">Reference / Transaction ID</Label>
                                <Input
                                    value={payRef}
                                    onChange={(e) => setPayRef(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white h-9 text-xs"
                                    placeholder="e.g. UPI Ref / Bank UTR / Receipt #"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <Label className="text-xs text-gray-300 mb-1.5 block">Notes / Description</Label>
                                <Input
                                    value={payNotes}
                                    onChange={(e) => setPayNotes(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white h-9 text-xs"
                                    placeholder="Optional notes or milestone description"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            className="border-white/10 text-gray-400 hover:bg-white/10 text-xs h-9"
                            onClick={() => setShowAddPayment(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-9 font-semibold"
                            onClick={handleSubmit}
                        >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Record Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
