"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    FileText, Search, Printer, Download, CheckCircle2,
    Clock, Mail, Building2, User, Sparkles, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripFinancial, InvoiceData } from "@/types/financial";
import type { Currency } from "@/types/pricing";

interface InvoicesTabProps {
    financials: TripFinancial[];
    cs: (currency?: Currency) => string;
    fm: (amount: number | string, currency?: Currency) => string;
    onOpenFinances?: (itineraryId: string) => void;
}

export function InvoicesTab({ financials, cs, fm, onOpenFinances }: InvoicesTabProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedInvoiceFin, setSelectedInvoiceFin] = useState<TripFinancial | null>(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    const filteredFinancials = useMemo(() => {
        return financials.filter(
            (fin) =>
                fin.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fin.tripTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fin.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (fin.clientEmail && fin.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [financials, searchQuery]);

    const handleOpenInvoicePreview = (fin: TripFinancial) => {
        setSelectedInvoiceFin(fin);
        setShowInvoiceModal(true);
    };

    const handlePrintInvoice = () => {
        window.print();
    };

    return (
        <>
            <div className="space-y-5">
                {/* Search & Header */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/[0.02] border border-white/[0.06] p-3 rounded-xl backdrop-blur-sm">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                            placeholder="Search invoices by client, email, or trip..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-9 text-xs"
                        />
                    </div>
                </div>

                {/* Grid of Invoice Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredFinancials.map((fin) => {
                        const totalPaid = fin.payments.reduce((s, p) => s + p.amount, 0);
                        const balance = fin.clientPrice - totalPaid;
                        const isFullyPaid = balance <= 0 && fin.clientPrice > 0;

                        return (
                            <div
                                key={fin.tripId || fin.itineraryId}
                                className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] hover:border-white/[0.15] transition-all rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-semibold text-white">{fin.clientName}</p>
                                                {fin.clientEmail && (
                                                    <span className="text-[11px] text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                                                        {fin.clientEmail}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {fin.tripTitle} · <span className="text-gray-300">{fin.destination}</span>
                                            </p>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "text-[10px] font-semibold border-0 shrink-0 capitalize",
                                                isFullyPaid
                                                    ? "bg-green-500/15 text-green-400 border border-green-500/30"
                                                    : totalPaid > 0
                                                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                                    : "bg-red-500/15 text-red-400 border border-red-500/30"
                                            )}
                                        >
                                            {isFullyPaid ? "Paid in Full" : `${fm(Math.max(0, balance), fin.currency)} due`}
                                        </Badge>
                                    </div>

                                    {/* Breakdown Bar */}
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="p-2.5 bg-black/30 border border-white/5 rounded-xl">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Total Price</p>
                                            <p className="text-xs font-bold text-white mt-0.5">
                                                {fm(fin.clientPrice, fin.currency)}
                                            </p>
                                        </div>
                                        <div className="p-2.5 bg-black/30 border border-white/5 rounded-xl">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Received</p>
                                            <p className="text-xs font-bold text-green-400 mt-0.5">
                                                {fm(totalPaid, fin.currency)}
                                            </p>
                                        </div>
                                        <div className="p-2.5 bg-black/30 border border-white/5 rounded-xl">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Outstanding</p>
                                            <p className={cn("text-xs font-bold mt-0.5", balance > 0 ? "text-amber-400" : "text-green-400")}>
                                                {fm(Math.max(0, balance), fin.currency)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="h-8 text-xs bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 flex-1 transition-all"
                                        onClick={() => handleOpenInvoicePreview(fin)}
                                    >
                                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                                        <span>View & Print Invoice</span>
                                    </Button>

                                    {onOpenFinances && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                                            onClick={() => onOpenFinances(fin.itineraryId)}
                                            title="Manage in Full Finance Sheet"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {filteredFinancials.length === 0 && (
                        <div className="col-span-full text-center py-16 bg-white/[0.01] border border-white/5 rounded-2xl">
                            <p className="text-sm text-gray-400">No invoices matched your search filter.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Invoice Printable Preview Modal */}
            <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
                <DialogContent className="bg-[#0A0A0E] border border-white/15 text-white sm:max-w-[620px] max-h-[85vh] overflow-y-auto shadow-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span className="text-base font-bold flex items-center gap-2">
                                <FileText className="w-4 h-4 text-purple-400" />
                                Tax Invoice Preview
                            </span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-400">
                            Auto-generated from itinerary metadata and payment records
                        </DialogDescription>
                    </DialogHeader>

                    {selectedInvoiceFin && (
                        <div className="space-y-5 py-3 text-xs">
                            {/* Invoice Header */}
                            <div className="flex justify-between border-b border-white/10 pb-4">
                                <div>
                                    <h4 className="text-sm font-bold text-white">TAX INVOICE</h4>
                                    <p className="text-[11px] text-gray-400 font-mono">
                                        INV-{selectedInvoiceFin.tripId || selectedInvoiceFin.itineraryId.slice(0, 8).toUpperCase()}
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        Date: {new Date().toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-white">BILL TO:</p>
                                    <p className="text-sm font-semibold text-purple-300">{selectedInvoiceFin.clientName}</p>
                                    {selectedInvoiceFin.clientEmail && (
                                        <p className="text-[11px] text-gray-400 font-mono">{selectedInvoiceFin.clientEmail}</p>
                                    )}
                                </div>
                            </div>

                            {/* Trip Info */}
                            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl space-y-1">
                                <p className="font-semibold text-white text-xs">{selectedInvoiceFin.tripTitle}</p>
                                <p className="text-[11px] text-gray-400">
                                    Destination: {selectedInvoiceFin.destination}
                                    {selectedInvoiceFin.adultPax && (
                                        <span className="ml-2">· Guests: {selectedInvoiceFin.adultPax} Adult(s), {selectedInvoiceFin.childPax || 0} Child(ren)</span>
                                    )}
                                </p>
                            </div>

                            {/* Itemized Table */}
                            <div className="border border-white/10 rounded-xl overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-white/5 border-b border-white/10 text-gray-400 text-[11px]">
                                            <th className="text-left p-2.5 font-semibold">Description</th>
                                            <th className="text-right p-2.5 font-semibold">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        <tr>
                                            <td className="p-2.5 text-gray-200">
                                                Complete Travel Package & Itinerary Arrangements ({selectedInvoiceFin.tripTitle})
                                            </td>
                                            <td className="p-2.5 text-right font-bold text-white">
                                                {fm(selectedInvoiceFin.clientPrice, selectedInvoiceFin.currency)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Math */}
                            {(() => {
                                const totalPaid = selectedInvoiceFin.payments.reduce((s, p) => s + p.amount, 0);
                                const balance = selectedInvoiceFin.clientPrice - totalPaid;

                                return (
                                    <div className="space-y-1.5 border-t border-white/10 pt-3 text-xs max-w-[280px] ml-auto">
                                        <div className="flex justify-between text-gray-400">
                                            <span>Subtotal:</span>
                                            <span>{fm(selectedInvoiceFin.clientPrice, selectedInvoiceFin.currency)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400">
                                            <span>Tax / GST ({selectedInvoiceFin.taxPercentage}%):</span>
                                            <span>{fm(selectedInvoiceFin.clientPrice * (selectedInvoiceFin.taxPercentage / 100), selectedInvoiceFin.currency)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-white border-t border-white/5 pt-1.5">
                                            <span>Total Package Price:</span>
                                            <span>{fm(selectedInvoiceFin.clientPrice, selectedInvoiceFin.currency)}</span>
                                        </div>
                                        <div className="flex justify-between text-emerald-400 font-semibold">
                                            <span>Total Payments Received:</span>
                                            <span>-{fm(totalPaid, selectedInvoiceFin.currency)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-amber-400 border-t border-white/10 pt-1.5 text-sm">
                                            <span>Balance Due:</span>
                                            <span>{fm(Math.max(0, balance), selectedInvoiceFin.currency)}</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            className="border-white/10 text-gray-400 hover:bg-white/10 text-xs h-9"
                            onClick={() => setShowInvoiceModal(false)}
                        >
                            Close
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-9 font-semibold gap-1.5"
                            onClick={handlePrintInvoice}
                        >
                            <Printer className="w-3.5 h-3.5" />
                            Print / Save as PDF
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
