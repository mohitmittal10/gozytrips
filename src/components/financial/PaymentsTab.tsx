"use client";

import React, { useState, useEffect } from "react";
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
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripFinancial, Payment } from "@/types/financial";
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
    const [payAmt, setPayAmt] = useState("");
    const [payMethod, setPayMethod] = useState(paymentMethods[0]?.value ?? "bank_transfer");
    const [payType, setPayType] = useState(paymentTypes[0]?.value ?? "advance");
    const [payRef, setPayRef] = useState("");
    const [payNotes, setPayNotes] = useState("");

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
    };

    const handleOpen = (fin: TripFinancial) => {
        setSelectedTripFin(fin);
        resetForm();
        setShowAddPayment(true);
    };

    const handleSubmit = () => {
        if (!selectedTripFin || !payAmt) return;
        addPayment(selectedTripFin.itineraryId, {
            itineraryId: selectedTripFin.itineraryId,
            amount: parseFloat(payAmt),
            date: new Date().toISOString(),
            method: payMethod,
            type: payType,
            reference: payRef,
            notes: payNotes,
        });
    };

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-300">Payment Tracking</h3>
                </div>

                <div className="space-y-3">
                    {financials.map((fin) => {
                        const totalPaid = fin.payments.reduce((s, p) => s + p.amount, 0);
                        const paidPct = fin.clientPrice > 0 ? (totalPaid / fin.clientPrice) * 100 : 0;

                        return (
                            <div
                                key={fin.tripId}
                                className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-white">{fin.clientName}</p>
                                        <p className="text-xs text-gray-500">
                                            {fin.tripTitle} · {fin.destination}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-white">
                                            {fm(fin.clientPrice, fin.currency)}
                                        </p>
                                        <p className={cn("text-xs", paidPct >= 100 ? "text-green-400" : paidPct > 0 ? "text-amber-400" : "text-gray-500")}>
                                            {paidPct >= 100 ? "Fully Paid" : `${paidPct.toFixed(0)}% collected`}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            paidPct >= 100 ? "bg-green-500" : paidPct > 50 ? "bg-blue-500" : "bg-amber-500",
                                        )}
                                        style={{ width: `${Math.min(paidPct, 100)}%` }}
                                    />
                                </div>

                                {/* Payment list */}
                                {fin.payments.length > 0 && (
                                    <div className="space-y-1.5">
                                        {fin.payments.map((p) => (
                                            <div
                                                key={p.id}
                                                className="flex items-center justify-between px-3 py-2 bg-white/[0.03] rounded-lg text-xs"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-0 text-[10px] capitalize">
                                                        {p.type}
                                                    </Badge>
                                                    <span className="text-gray-400">{p.method.replace("_", " ")}</span>
                                                    {p.reference && <span className="text-gray-600">#{p.reference}</span>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-green-400 font-medium">
                                                        {fm(p.amount, fin.currency)}
                                                    </span>
                                                    <span className="text-gray-600">
                                                        {new Date(p.date).toLocaleDateString()}
                                                    </span>
                                                    <button
                                                        onClick={() => deletePayment(fin.itineraryId, p.id)}
                                                        className="text-gray-600 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs border-white/10 bg-transparent text-gray-400 hover:bg-white/10 w-full"
                                    onClick={() => handleOpen(fin)}
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="ml-1">Record Payment</span>
                                </Button>
                            </div>
                        );
                    })}

                    {financials.length === 0 && (
                        <div className="text-center py-12 text-gray-500 text-sm">
                            No active trips found. Start organizing a trip to track payments.
                        </div>
                    )}
                </div>
            </div>

            {/* Add Payment Dialog */}
            <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
                <DialogContent className="bg-[#0A0A0A] border border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            {selectedTripFin
                                ? `${selectedTripFin.clientName} — ${selectedTripFin.tripTitle}`
                                : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-gray-400 mb-1">
                                    Amount ({cs(selectedTripFin?.currency)})
                                </Label>
                                <Input
                                    type="number"
                                    value={payAmt}
                                    onChange={(e) => setPayAmt(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-gray-400 mb-1">Type</Label>
                                <Select value={payType} onValueChange={setPayType}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentTypes.map((pt) => (
                                            <SelectItem key={pt.value} value={pt.value}>
                                                {pt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-gray-400 mb-1">Payment Method</Label>
                            <Select value={payMethod} onValueChange={setPayMethod}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {paymentMethods.map((pm) => (
                                        <SelectItem key={pm.value} value={pm.value}>
                                            {pm.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs text-gray-400 mb-1">Reference #</Label>
                            <Input
                                value={payRef}
                                onChange={(e) => setPayRef(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Transaction ID"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-gray-400 mb-1">Notes</Label>
                            <Input
                                value={payNotes}
                                onChange={(e) => setPayNotes(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Optional notes"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="border-white/10 text-gray-400 hover:bg-white/10"
                            onClick={() => setShowAddPayment(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={handleSubmit}
                        >
                            Record Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
