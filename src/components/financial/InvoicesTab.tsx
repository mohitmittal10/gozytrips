"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    FileText, Search, Printer, CheckCircle2,
    Clock, Download, Eye, Building2, User, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripFinancial } from "@/types/financial";
import type { Currency } from "@/types/pricing";
import { ProfessionalInvoice } from "./ProfessionalInvoice";
import { useAuth } from "@/contexts/auth-context";

interface InvoicesTabProps {
    financials: TripFinancial[];
    cs: (currency?: Currency) => string;
    fm: (amount: number | string, currency?: Currency) => string;
}

export function InvoicesTab({ financials, cs, fm }: InvoicesTabProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedInvoiceFin, setSelectedInvoiceFin] = useState<TripFinancial | null>(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const invoiceRef = useRef<HTMLDivElement>(null);
    const { user, agencySettings } = useAuth();

    const companyName = agencySettings?.brand_name ?? "GozyTrips";
    const agentName = (agencySettings as any)?.agent_name ?? user?.email?.split("@")[0] ?? "Travel Agent";
    const agentEmail = user?.email ?? "";

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

    const handleDirectPrint = useCallback((fin: TripFinancial) => {
        const htmlContent = renderToStaticMarkup(
            <ProfessionalInvoice
                fin={fin}
                fm={fm}
                cs={cs}
                companyName={companyName}
                agentName={agentName}
                agentEmail={agentEmail}
            />
        );

        const win = window.open("", "_blank", "width=900,height=700");
        if (!win) return;

        win.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Invoice — ${fin.clientName || "GozyTrips"}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Inter', 'Segoe UI', sans-serif; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: A4; margin: 0; }
      @media print {
        body { margin: 0; }
        #printable-invoice { page-break-inside: avoid; }
      }
    </style>
  </head>
  <body>${htmlContent}</body>
</html>`);
        win.document.close();
        win.focus();
        setTimeout(() => {
            win.print();
            win.close();
        }, 600);
    }, [fm, cs, companyName, agentName, agentEmail]);

    const handlePrintInvoice = useCallback(() => {
        const el = invoiceRef.current;
        if (!el) return;

        const printContent = el.outerHTML;
        const win = window.open("", "_blank", "width=900,height=700");
        if (!win) return;

        win.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Invoice — ${selectedInvoiceFin?.clientName ?? "GozyTrips"}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Inter', 'Segoe UI', sans-serif; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: A4; margin: 0; }
      @media print {
        body { margin: 0; }
        #printable-invoice { page-break-inside: avoid; }
      }
    </style>
  </head>
  <body>${printContent}</body>
</html>`);
        win.document.close();
        win.focus();
        setTimeout(() => {
            win.print();
            win.close();
        }, 600);
    }, [selectedInvoiceFin]);

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
                    <div className="text-xs text-zinc-500 shrink-0 font-medium">
                        {filteredFinancials.length} invoice{filteredFinancials.length !== 1 ? "s" : ""}
                    </div>
                </div>

                {/* Grid of Invoice Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredFinancials.map((fin) => {
                        const totalPaid = fin.payments.reduce((s, p) => s + p.amount, 0);
                        const balance = fin.clientPrice - totalPaid;
                        const isFullyPaid = balance <= 0 && fin.clientPrice > 0;
                        const paidPct = fin.clientPrice > 0 ? Math.min((totalPaid / fin.clientPrice) * 100, 100) : 0;

                        return (
                            <div
                                key={fin.tripId || fin.itineraryId}
                                className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] hover:border-white/[0.15] transition-all rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between"
                            >
                                {/* Card Top accent */}
                                <div className={cn(
                                    "h-1 w-full",
                                    isFullyPaid ? "bg-gradient-to-r from-emerald-500 to-green-400" : "bg-gradient-to-r from-amber-500 to-orange-400"
                                )} />

                                <div className="p-5 space-y-4 flex-1">
                                    {/* Header Row */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-bold text-white">{fin.clientName}</p>
                                            </div>
                                            {fin.clientEmail && (
                                                <p className="text-[11px] text-zinc-500 font-mono">{fin.clientEmail}</p>
                                            )}
                                            <p className="text-xs text-zinc-400 mt-1">
                                                {fin.tripTitle} <span className="text-zinc-500">·</span> <span className="text-zinc-300">{fin.destination}</span>
                                            </p>
                                            {fin.startDate && (
                                                <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(fin.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                    {fin.endDate && ` – ${new Date(fin.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                                                </p>
                                            )}
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "text-[10px] font-bold border shrink-0 uppercase tracking-wider",
                                                isFullyPaid
                                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                                    : totalPaid > 0
                                                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                                    : "bg-red-500/15 text-red-400 border-red-500/30"
                                            )}
                                        >
                                            {isFullyPaid ? "Paid ✓" : totalPaid > 0 ? "Partial" : "Unpaid"}
                                        </Badge>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-zinc-400">Collected: <strong className="text-emerald-400">{fm(totalPaid, fin.currency)}</strong></span>
                                            <span className="text-zinc-400">Total: <strong className="text-white">{fm(fin.clientPrice, fin.currency)}</strong></span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-700", isFullyPaid ? "bg-emerald-500" : "bg-amber-500")}
                                                style={{ width: `${paidPct}%` }}
                                            />
                                        </div>
                                        {!isFullyPaid && balance > 0 && (
                                            <p className="text-[11px] text-amber-400 font-semibold text-right">
                                                {fm(Math.max(0, balance), fin.currency)} outstanding
                                            </p>
                                        )}
                                    </div>

                                    {/* Financial Breakdown */}
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        {[
                                            { label: "Package", value: fm(fin.clientPrice, fin.currency), color: "text-white" },
                                            { label: "Received", value: fm(totalPaid, fin.currency), color: "text-emerald-400" },
                                            { label: "Outstanding", value: fm(Math.max(0, balance), fin.currency), color: balance > 0 ? "text-amber-400" : "text-emerald-400" },
                                        ].map(({ label, value, color }) => (
                                            <div key={label} className="p-2 bg-black/30 border border-white/5 rounded-xl">
                                                <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">{label}</p>
                                                <p className={cn("text-xs font-bold mt-0.5", color)}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 p-5 pt-0">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="h-9 text-xs bg-white/10 hover:bg-white/20 text-white border border-white/15 flex-1 transition-all font-semibold rounded-xl cursor-pointer"
                                        onClick={() => handleOpenInvoicePreview(fin)}
                                    >
                                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                                        <span>Preview Invoice</span>
                                    </Button>

                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="h-9 text-xs bg-indigo-600/20 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/30 transition-all font-semibold rounded-xl cursor-pointer px-3"
                                        onClick={() => handleDirectPrint(fin)}
                                        title="Print / Save as PDF"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}

                    {filteredFinancials.length === 0 && (
                        <div className="col-span-full text-center py-16 bg-white/[0.01] border border-white/5 rounded-2xl space-y-2">
                            <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-400 font-medium">No invoices matched your search.</p>
                            <p className="text-xs text-gray-600">Try adjusting your search or add trips in The Lab.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Professional Invoice Preview Modal */}
            <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
                <DialogContent className="bg-[#0c0c0e]/98 backdrop-blur-2xl border border-white/10 text-white w-full sm:max-w-[860px] max-h-[90vh] overflow-y-auto shadow-2xl p-0">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0c0c0e]/95 backdrop-blur-xl z-10">
                        <div>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-400" />
                                Professional Invoice
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                                {selectedInvoiceFin?.clientName} · {selectedInvoiceFin?.tripTitle}
                            </DialogDescription>
                        </div>
                        <Button
                            className="aurora-gradient text-white text-xs h-9 font-bold rounded-xl border-none hover:brightness-110 cursor-pointer flex items-center gap-2 px-4"
                            onClick={handlePrintInvoice}
                        >
                            <Printer className="w-3.5 h-3.5" />
                            Print / Save as PDF
                        </Button>
                    </div>

                    {/* Invoice Preview */}
                    <div className="p-6">
                        {/* Paper shadow wrapper */}
                        <div style={{
                            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)",
                            borderRadius: "4px",
                            overflow: "hidden",
                        }}>
                            {selectedInvoiceFin && (
                                <ProfessionalInvoice
                                    ref={invoiceRef}
                                    fin={selectedInvoiceFin}
                                    fm={fm}
                                    cs={cs}
                                    companyName={companyName}
                                    agentName={agentName}
                                    agentEmail={agentEmail}
                                />
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
