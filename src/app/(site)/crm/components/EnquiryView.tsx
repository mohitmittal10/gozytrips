"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Building2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { WhatsAppLeadIngestion } from "./enquiry/WhatsAppLeadIngestion";

const VendorEnquiry = dynamic(() => import("@/components/vendor-enquiry"), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-slate-400">
      Loading Vendor Enquiry system...
    </div>
  ),
});

export interface EnquiryViewProps {
  initialSubTab?: "lead_generation" | "vendor";
}

export const EnquiryView = ({ initialSubTab = "lead_generation" }: EnquiryViewProps) => {
  const [activeSubTab, setActiveSubTab] = useState<"lead_generation" | "vendor">(initialSubTab);
  const [vendorPrefill, setVendorPrefill] = useState<{
    destination?: string;
    travelDates?: string;
    adults?: string;
    children?: string;
    infants?: string;
    specialRequests?: string;
  } | undefined>(undefined);

  const handleSwitchToVendor = (prefillData: {
    destination: string;
    travelDates: string;
    adults: string;
    children: string;
    infants: string;
    specialRequests: string;
  }) => {
    setVendorPrefill(prefillData);
    setActiveSubTab("vendor");
  };

  return (
    <div className="mt-2 space-y-4">
      {/* ── Sub-navigation for Enquiry View ─────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
        <button
          onClick={() => setActiveSubTab("lead_generation")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border cursor-pointer",
            activeSubTab === "lead_generation"
              ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 font-bold shadow-sm"
              : "bg-white/60 dark:bg-white/[0.03] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <Zap className={cn("w-4 h-4", activeSubTab === "lead_generation" ? "text-emerald-500" : "text-slate-400")} />
          Lead Generation
          <span className="ml-1 px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
            Live
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("vendor")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border cursor-pointer",
            activeSubTab === "vendor"
              ? "bg-primary/10 text-slate-900 dark:text-white border-primary/30 font-bold shadow-sm"
              : "bg-white/60 dark:bg-white/[0.03] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <Building2 className={cn("w-4 h-4", activeSubTab === "vendor" ? "text-primary" : "text-slate-400")} />
          Vendor Quotations
        </button>
      </div>

      {/* ── Tab Views ───────────────────────────────────────────────────── */}
      {activeSubTab === "lead_generation" && (
        <WhatsAppLeadIngestion onSwitchToVendorEnquiry={handleSwitchToVendor} />
      )}

      {activeSubTab === "vendor" && (
        <VendorEnquiry initialData={vendorPrefill} />
      )}
    </div>
  );
};
