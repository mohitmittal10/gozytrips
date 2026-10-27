"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { MessageSquare, Building2, Sparkles, Send, Zap, Clock, Globe, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const VendorEnquiry = dynamic(() => import("@/components/vendor-enquiry"), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-slate-400">
      Loading Vendor Enquiry system...
    </div>
  ),
});

export const EnquiryView = () => {
  const [activeSubTab, setActiveSubTab] = useState<"lead_generation" | "vendor">("lead_generation");
  const [vendorPrefill, setVendorPrefill] = useState<{
    destination?: string;
    travelDates?: string;
    adults?: string;
    children?: string;
    infants?: string;
    specialRequests?: string;
  } | undefined>(undefined);

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
          <span className="ml-1 px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
            Coming Soon
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
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl p-8 shadow-sm">
          <div className="max-w-2xl mx-auto text-center space-y-6 py-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              Under Active Development
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Automated Lead Generation
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
                Seamlessly connect your WhatsApp Business and Meta accounts to automatically capture, parse, and convert traveler inquiries into CRM leads.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">WhatsApp Chat to Lead</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                  AI extracts destination, dates, pax, and budget directly from incoming chats.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                  <Globe className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Meta Lead Ads Sync</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                  Direct connection with Instagram & Facebook lead forms without manual webhooks.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">1-Click Lab Itineraries</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                  Turn newly ingested inquiries into customized client itineraries in seconds.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActiveSubTab("vendor")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Go to Vendor Quotations in the meantime
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "vendor" && (
        <VendorEnquiry initialData={vendorPrefill} />
      )}
    </div>
  );
};
