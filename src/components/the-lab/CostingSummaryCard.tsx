"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { Users, Info, Printer, Copy, Check, FileText } from "lucide-react";
import { type Currency } from "@/types/pricing";
import { type TripFinancial } from "@/types/financial";
import { formatMoney, getCurrencySymbol } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useLabStore } from "@/store/the-lab/labStore";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProfessionalInvoice } from "@/components/financial/ProfessionalInvoice";

export interface CostingSummaryCardProps {
  quoteId?: string | null;
  currency: Currency;
  currencySymbol: string;
  baseCost: number;
  markupAmount: number;
  markupPercentage?: number;
  taxAmount: number;
  taxPercentage?: number;
  finalTotal: number;
  adultPax: number;
  childPax: number;
  infantPax: number;
  totalAdultCost: number;
  totalChildCost: number;
  totalInfantCost: number;
  onExportPdf?: () => void;
  onOpenInvoice?: () => void;
  onSendToClient?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  tripId?: string | null;
  milestones?: { name: string; percentage: number; dueDate?: string }[];
  className?: string;
}

export function CostingSummaryCard({
  quoteId: _quoteId,
  currency,
  currencySymbol,
  baseCost,
  markupAmount,
  markupPercentage,
  taxAmount,
  taxPercentage,
  finalTotal,
  adultPax = 2,
  childPax = 0,
  infantPax = 0,
  totalAdultCost = 0,
  totalChildCost = 0,
  totalInfantCost = 0,
  onExportPdf: _onExportPdf,
  onOpenInvoice,
  onSendToClient: _onSendToClient,
  onSave: _onSave,
  isSaving: _isSaving = false,
  tripId,
  milestones,
  className,
}: CostingSummaryCardProps) {
  const { toast } = useToast();
  const { user, agencySettings } = useAuth();
  const labMetadata = useLabStore((s) => s.tripMetadata);
  const labStatus = useLabStore((s) => s.selectedStatus);

  const companyName = agencySettings?.brand_name ?? "GozyTrips";
  const agentName = (agencySettings as any)?.agent_name ?? user?.email?.split("@")[0] ?? "Travel Agent";
  const agentEmail = user?.email ?? "";

  const [isCopied, setIsCopied] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const invoiceRef = useRef<HTMLDivElement>(null);

  // Compute effective percentages for pill badges
  const effectiveMarkupPct = useMemo(() => {
    if (typeof markupPercentage === "number" && markupPercentage > 0) return markupPercentage;
    if (baseCost > 0 && markupAmount > 0) return Math.round((markupAmount / baseCost) * 100);
    return 0;
  }, [baseCost, markupAmount, markupPercentage]);

  const effectiveTaxPct = useMemo(() => {
    if (typeof taxPercentage === "number" && taxPercentage > 0) return taxPercentage;
    const taxableBase = baseCost + markupAmount;
    if (taxableBase > 0 && taxAmount > 0) return Math.round((taxAmount / taxableBase) * 100);
    return 0;
  }, [baseCost, markupAmount, taxAmount, taxPercentage]);

  // Fallbacks for PAX calculations if per-category breakdown is flat
  const totalPax = adultPax + childPax + infantPax;
  const displayAdultCost = useMemo(() => {
    if (totalAdultCost > 0) return totalAdultCost;
    if (baseCost > 0 && adultPax > 0 && totalPax > 0) {
      return (baseCost / totalPax) * adultPax;
    }
    return baseCost;
  }, [totalAdultCost, baseCost, adultPax, totalPax]);

  const displayChildCost = useMemo(() => {
    if (totalChildCost > 0) return totalChildCost;
    if (baseCost > 0 && childPax > 0 && totalPax > 0) {
      return (baseCost / totalPax) * childPax;
    }
    return 0;
  }, [totalChildCost, baseCost, childPax, totalPax]);

  const displayInfantCost = useMemo(() => {
    if (totalInfantCost > 0) return totalInfantCost;
    if (baseCost > 0 && infantPax > 0 && totalPax > 0) {
      return (baseCost / totalPax) * infantPax;
    }
    return 0;
  }, [totalInfantCost, baseCost, infantPax, totalPax]);

  // Clean formatted numeric part for prominent hero highlight
  const finalTotalFormatted = useMemo(() => {
    const raw = formatMoney(finalTotal, currency);
    return raw.replace(currencySymbol, "").trim();
  }, [finalTotal, currency, currencySymbol]);

  // Construct TripFinancial object for the actual CRM ProfessionalInvoice
  const invoiceFin: TripFinancial = useMemo(() => {
    const rawDest = labMetadata?.destinations || labMetadata?.startingLocation || "Custom Destination";
    const rawTitle = labMetadata?.destinations ? `Trip to ${labMetadata.destinations}` : "Custom Travel Package";
    const rawStart = labMetadata?.startDate
      ? (labMetadata.startDate instanceof Date ? labMetadata.startDate.toISOString().slice(0, 10) : String(labMetadata.startDate).slice(0, 10))
      : undefined;
    const rawEnd = labMetadata?.endDate
      ? (labMetadata.endDate instanceof Date ? labMetadata.endDate.toISOString().slice(0, 10) : String(labMetadata.endDate).slice(0, 10))
      : undefined;

    return {
      itineraryId: tripId || "draft",
      tripId: tripId ? `GT-${tripId.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase()}` : "GT-DRAFT",
      clientId: "client",
      clientName: "Valued Client",
      clientEmail: "",
      tripTitle: rawTitle,
      destination: rawDest,
      status: labStatus || "draft",
      startDate: rawStart,
      endDate: rawEnd,
      clientPrice: baseCost + markupAmount,
      currency: currency || "INR",
      expenses: [],
      payments: [],
      commissionRate: 0,
      commissionAmount: 0,
      markupValue: markupPercentage || 0,
      markupType: "percentage",
      taxPercentage: taxPercentage || 0,
      adultPax: adultPax || 2,
      childPax: childPax || 0,
      infantPax: infantPax || 0,
      milestones: (milestones || []).map((m: any) => ({
        label: m.name || m.label || "Milestone",
        percentage: Number(m.percentage) || 0,
        dueDate: m.dueDate,
      })),
      suggestedExpenses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [tripId, labMetadata, labStatus, baseCost, markupAmount, currency, markupPercentage, taxPercentage, adultPax, childPax, infantPax, milestones]);

  // Direct print implementation identical to InvoicesTab in CRM
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
    <title>Invoice — ${invoiceFin.clientName || "GozyTrips"}</title>
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
  }, [invoiceFin]);

  // Copy full costing summary to clipboard
  const handleCopySummary = async () => {
    const text = [
      `Costing Summary (${currency})`,
      `Base Cost: ${formatMoney(baseCost, currency)}`,
      `Markup: +${formatMoney(markupAmount, currency)}`,
      `Tax: +${formatMoney(taxAmount, currency)}`,
      `Total Client Quote: ${formatMoney(finalTotal, currency)}`,
    ].join("\n");

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        toast({
          title: "Costing Summary Copied",
          description: "Summary figures copied to your clipboard.",
        });
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch {
      // Ignore clipboard write failures
    }
  };

  return (
    <>
      <div
        className={cn(
          "w-full bg-white dark:bg-[#0c0d12] rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-black/60 border border-slate-200/80 dark:border-white/10 overflow-hidden transition-all duration-200",
          className
        )}
        data-purpose="costing-summary-card"
      >
        {/* ── BEGIN: HeaderSection ── */}
        <header className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.06] bg-gradient-to-b from-white to-slate-50/60 dark:from-white/[0.03] dark:to-transparent">
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Costing Summary
                </h3>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono">
                  {currency} ({currencySymbol})
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Commercial travel &amp; hospitality tier breakdown
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              {/* Exact button requested by user, leading directly to the actual CRM Professional Invoice */}
              <button
                type="button"
                onClick={() => {
                  if (onOpenInvoice) {
                    onOpenInvoice();
                  } else {
                    setShowInvoiceModal(true);
                  }
                }}
                className="inline-flex items-center justify-center whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-3 h-9 text-xs bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-900 dark:text-white border border-slate-200 dark:border-white/15 flex-1 sm:flex-initial transition-all font-semibold rounded-xl cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                <span>Preview Invoice</span>
              </button>

              <button
                aria-label="Copy costing breakdown"
                onClick={handleCopySummary}
                title={isCopied ? "Copied!" : "Copy Summary Breakdown"}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer border border-slate-200 dark:border-white/10 shrink-0"
                type="button"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400 dark:text-zinc-500" />}
              </button>
            </div>
          </div>
        </header>
        {/* ── END: HeaderSection ── */}

        {/* ── BEGIN: PaxBreakdownCard ── */}
        <section aria-labelledby="pax-breakdown-heading" className="p-4 sm:p-5 pb-2">
          <div className="rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] p-3.5 transition-colors hover:border-slate-300 dark:hover:border-white/15">
            {/* Subheader for PAX category */}
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400"
                id="pax-breakdown-heading"
              >
                Pax Cost Breakdown (Base)
              </span>
            </div>

            {/* Occupancy & Rate Detail Row - Adults */}
            {adultPax > 0 && (
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-zinc-300">
                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-zinc-300 shadow-2xs shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 leading-tight">
                      {adultPax} Adult{adultPax > 1 ? "s" : ""}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight font-mono">
                      {formatMoney(displayAdultCost / adultPax, currency)} / pax
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                    {formatMoney(displayAdultCost, currency)}
                  </span>
                </div>
              </div>
            )}

            {/* Occupancy & Rate Detail Row - Children */}
            {childPax > 0 && (
              <div className="flex items-center justify-between py-1 border-t border-slate-200/60 dark:border-white/[0.06] mt-1 pt-1.5">
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-zinc-300">
                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center text-amber-500 shadow-2xs shrink-0">
                    <Users className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 leading-tight">
                      {childPax} Child{childPax > 1 ? "ren" : ""}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight font-mono">
                      {formatMoney(displayChildCost / childPax, currency)} / pax
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                    {formatMoney(displayChildCost, currency)}
                  </span>
                </div>
              </div>
            )}

            {/* Occupancy & Rate Detail Row - Infants */}
            {infantPax > 0 && (
              <div className="flex items-center justify-between py-1 border-t border-slate-200/60 dark:border-white/[0.06] mt-1 pt-1.5">
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-zinc-300">
                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center text-sky-500 shadow-2xs shrink-0">
                    <Users className="w-4 h-4 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 leading-tight">
                      {infantPax} Infant{infantPax > 1 ? "s" : ""}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight font-mono">
                      {formatMoney(displayInfantCost / infantPax, currency)} / pax
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-sky-600 dark:text-sky-400 tabular-nums">
                    {formatMoney(displayInfantCost, currency)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
        {/* ── END: PaxBreakdownCard ── */}

        {/* ── BEGIN: ItemizedCostBreakdown ── */}
        <section aria-label="Detailed Financial Breakdown" className="px-4 sm:px-5 py-2">
          <div className="space-y-3 text-sm pt-1">
            {/* Base Cost Row */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                <span>Base Cost</span>
                <span
                  title="Base tariff calculated across all travel and stay options"
                  className="text-slate-400 hover:text-slate-500 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-help"
                >
                  <Info className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="font-mono font-medium text-slate-800 dark:text-zinc-200 tabular-nums">
                {formatMoney(baseCost, currency)}
              </div>
            </div>

            {/* Markup Row */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                <span className="text-slate-700 dark:text-zinc-300">Total Item Markup</span>
                {effectiveMarkupPct > 0 && (
                  <span className="text-[10px] uppercase font-semibold tracking-wide bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/30 rounded px-1.5 py-0.5">
                    {effectiveMarkupPct}%
                  </span>
                )}
              </div>
              <div className="font-mono font-semibold text-amber-700 dark:text-amber-400 tabular-nums flex items-center gap-0.5">
                <span className="text-xs">{markupAmount >= 0 ? "+" : ""}</span>
                <span>{formatMoney(markupAmount, currency)}</span>
              </div>
            </div>

            {/* Tax Row */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                <span className="text-slate-700 dark:text-zinc-300">Total Item Tax</span>
                {effectiveTaxPct > 0 && (
                  <span className="text-[10px] uppercase font-semibold tracking-wide bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-500/30 rounded px-1.5 py-0.5">
                    GST {effectiveTaxPct}%
                  </span>
                )}
              </div>
              <div className="font-mono font-semibold text-sky-700 dark:text-sky-400 tabular-nums flex items-center gap-0.5">
                <span className="text-xs">+</span>
                <span>{formatMoney(taxAmount, currency)}</span>
              </div>
            </div>
          </div>
        </section>
        {/* ── END: ItemizedCostBreakdown ── */}

        {/* ── BEGIN: TotalClientQuoteHighlight ── */}
        <section aria-label="Total Quote Computation" className="p-4 sm:p-5 pt-3">
          <div className="relative overflow-hidden rounded-xl border border-slate-900 dark:border-white/10 text-white p-4 sm:p-5 shadow-lg shadow-slate-900/10 bg-black">
            {/* Subtle brand decorative glow matching app schema */}
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#ff5c33]/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex items-end justify-between gap-2">
              <div>
                <span className="inline-block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Final Amount
                </span>
                <h4 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight mt-0.5">
                  Total Client Quote
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Inclusive of all duties &amp; municipal taxes
                </p>
              </div>

              {/* Prominent Highlight Value */}
              <div className="text-right">
                <div className="flex items-baseline justify-end font-mono font-extrabold text-2xl sm:text-3xl tracking-tight text-white tabular-nums">
                  <span className="text-lg sm:text-xl font-medium text-slate-300 mr-1">
                    {currencySymbol}
                  </span>
                  <span>{finalTotalFormatted}</span>
                </div>
                <span className="inline-block text-[10px] text-emerald-400 font-medium tracking-wide">
                  Net Payable
                </span>
              </div>
            </div>
          </div>
        </section>
        {/* ── END: TotalClientQuoteHighlight ── */}
      </div>

      {/* ── Professional Invoice Preview Modal (Reusing existing CRM ProfessionalInvoice) ── */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="bg-white dark:bg-[#0c0c0e]/98 backdrop-blur-2xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white w-full sm:max-w-[860px] max-h-[90vh] overflow-y-auto shadow-2xl p-0 rounded-2xl">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 sticky top-0 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl z-10 flex-wrap gap-3">
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <FileText className="w-4 h-4 text-primary" />
                Professional Invoice
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                {invoiceFin.clientName} · {invoiceFin.tripTitle}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                className="aurora-gradient text-slate-900 dark:text-white text-xs h-9 font-bold rounded-xl border-none hover:brightness-110 cursor-pointer flex items-center gap-2 px-4 shadow-md"
                onClick={handlePrintInvoice}
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save as PDF
              </Button>
            </div>
          </div>

          {/* Invoice Preview */}
          <div className="p-4 sm:p-6 bg-slate-100/50 dark:bg-black/30">
            <div
              style={{
                boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <ProfessionalInvoice
                ref={invoiceRef}
                fin={invoiceFin}
                fm={(amount, curr) => formatMoney(amount, curr || currency)}
                cs={(curr) => getCurrencySymbol(curr || currency)}
                companyName={companyName}
                agentName={agentName}
                agentEmail={agentEmail}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
