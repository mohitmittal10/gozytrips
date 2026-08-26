"use client";

import React, { useState, useRef, useEffect } from "react";
import { CheckCircle2, XCircle, ScrollText, Ban, CreditCard, Minimize2, Maximize2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useInclusionsSlice } from "@/store/the-lab/selectors";

interface TheLabInclusionsProps {
  inclusions?: string;
  setInclusions?: (val: string) => void;
  exclusions?: string;
  setExclusions?: (val: string) => void;
  termsAndConditions?: string;
  setTermsAndConditions?: (val: string) => void;
  cancellationPolicy?: string;
  setCancellationPolicy?: (val: string) => void;
  paymentMethods?: string;
  setPaymentMethods?: (val: string) => void;
}

const TAB_CONFIG = [
  {
    value: "inclusions",
    label: "Inclusions",
    icon: CheckCircle2,
    description: "Specify what is included in this itinerary.",
    placeholder: "e.g. Daily breakfast, airport transfers, 24/7 support...",
  },
  {
    value: "exclusions",
    label: "Exclusions",
    icon: XCircle,
    description: "Specify what is not included in this itinerary.",
    placeholder: "e.g. International flights, visa fees, personal expenses...",
  },
  {
    value: "terms",
    label: "Terms & Conditions",
    icon: ScrollText,
    description: "Specify any terms and conditions for this itinerary.",
    placeholder: "e.g. 50% advance payment required. Cancellation policy...",
  },
  {
    value: "cancellation",
    label: "Cancellation",
    icon: Ban,
    description: "Specify the cancellation policy for this itinerary.",
    placeholder: "e.g. Full refund up to 30 days before travel...",
  },
  {
    value: "payment",
    label: "Payment",
    icon: CreditCard,
    description: "Specify the accepted payment methods for this itinerary.",
    placeholder: "e.g. Credit/Debit Cards, Bank Transfer, UPI...",
  },
] as const;

type TabValue = typeof TAB_CONFIG[number]["value"];

export function TheLabInclusions(props: TheLabInclusionsProps) {
  const storeInclusions = useInclusionsSlice();

  const inclusions = props.inclusions ?? storeInclusions.inclusions;
  const setInclusions = props.setInclusions ?? storeInclusions.setInclusionsText;

  const exclusions = props.exclusions ?? storeInclusions.exclusions;
  const setExclusions = props.setExclusions ?? storeInclusions.setExclusionsText;

  const termsAndConditions = props.termsAndConditions ?? storeInclusions.termsAndConditions;
  const setTermsAndConditions = props.setTermsAndConditions ?? storeInclusions.setTermsAndConditionsText;

  const cancellationPolicy = props.cancellationPolicy ?? storeInclusions.cancellationPolicy;
  const setCancellationPolicy = props.setCancellationPolicy ?? storeInclusions.setCancellationPolicyText;

  const paymentMethods = props.paymentMethods ?? storeInclusions.paymentMethods;
  const setPaymentMethods = props.setPaymentMethods ?? storeInclusions.setPaymentMethodsText;

  const [activeTab, setActiveTab] = useState<TabValue>("inclusions");
  const [slideDir, setSlideDir] = useState<"left" | "right">("right");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const firstRender = useRef(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ── Local draft state to avoid per-keystroke store writes ────────────────────
  // We buffer text in local React state and only flush to the Zustand store
  // (which triggers hash recompute + autosave) on blur or after a 500 ms debounce.
  // This keeps rapid typing off the store's hot path entirely.
  const [localDraft, setLocalDraft] = useState("");
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeFlushRef = useRef<((val: string) => void) | null>(null);

  // When the active tab changes, sync the draft to the current committed value.
  useEffect(() => {
    const { value } = getContent(activeTab);
    const strVal = typeof value === "string" ? value : Array.isArray(value) ? (value as string[]).join("\n") : value ? String(value) : "";
    setLocalDraft(strVal);
    activeFlushRef.current = getFlushFn(activeTab);
    // Cancel any pending flush from the previous tab
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, inclusions, exclusions, termsAndConditions, cancellationPolicy, paymentMethods]);

  useEffect(() => {
    const idx = TAB_CONFIG.findIndex(t => t.value === activeTab);
    const el = tabRefs.current[idx];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    firstRender.current = false;
  }, [activeTab]);

  // Returns the committed store value (used for collapsed read-only view)
  const getContent = (tab: TabValue) => {
    switch (tab) {
      case "inclusions":    return { value: inclusions,          onChange: setInclusions };
      case "exclusions":    return { value: exclusions,          onChange: setExclusions };
      case "terms":         return { value: termsAndConditions,  onChange: setTermsAndConditions };
      case "cancellation":  return { value: cancellationPolicy,  onChange: setCancellationPolicy };
      case "payment":       return { value: paymentMethods,      onChange: setPaymentMethods };
    }
  };

  // Returns just the flush function for a tab (used by the debounce logic)
  const getFlushFn = (tab: TabValue): ((val: string) => void) => {
    switch (tab) {
      case "inclusions":    return setInclusions;
      case "exclusions":    return setExclusions;
      case "terms":         return setTermsAndConditions;
      case "cancellation":  return setCancellationPolicy;
      case "payment":       return setPaymentMethods;
    }
  };

  // Flush the current local draft to the store immediately (called on blur / tab switch)
  const flushDraftNow = () => {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    activeFlushRef.current?.(localDraft);
  };

  const handleTabSelect = (value: TabValue) => {
    // Flush any pending draft for the current tab before switching
    flushDraftNow();
    const oldIdx = TAB_CONFIG.findIndex(t => t.value === activeTab);
    const newIdx = TAB_CONFIG.findIndex(t => t.value === value);
    setSlideDir(newIdx > oldIdx ? "right" : "left");
    setActiveTab(value);
  };

  const active = TAB_CONFIG.find(t => t.value === activeTab)!;
  const content = getContent(activeTab);
  const Icon = active.icon;

  return (
    <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-300">
      <style>{`
        @keyframes inclSlideFromRight { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }
        @keyframes inclSlideFromLeft  { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
      `}</style>

      {/* Tab bar */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 mb-6 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="relative flex gap-1 pb-[1px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {TAB_CONFIG.map((tab, i) => {
              const isSelected = activeTab === tab.value;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.value}
                  ref={el => { tabRefs.current[i] = el; }}
                  onClick={() => handleTabSelect(tab.value)}
                  type="button"
                  className={`flex items-center gap-1.5 px-3 pb-[8px] pt-1 cursor-pointer font-sans text-sm font-semibold transition-colors duration-200 select-none rounded-t-sm ${
                    isSelected
                      ? "text-primary"
                      : "text-foreground/40 hover:text-foreground/70"
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
            {/* Sliding underline */}
            <div
              className="absolute bottom-0 h-[2px] rounded-full bg-primary shadow-[0_0_8px_rgba(255,92,51,0.5)]"
              style={{
                left: indicator.left,
                width: indicator.width,
                transition: firstRender.current
                  ? 'none'
                  : 'left 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </div>

          {/* Active section label & Collapse toggle */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-none">{active.label}</p>
                <p className="text-[11px] text-foreground/40 mt-0.5 leading-none">{active.description}</p>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-white/[0.08] hidden sm:block" />

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/80 hover:text-white text-xs font-semibold hover:bg-white/5 transition-all cursor-pointer select-none animate-in fade-in duration-200"
            >
              {isCollapsed ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Edit Mode</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Collapse View</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content pane */}
      <div
        key={activeTab}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
        style={{
          animation: `${slideDir === 'right' ? 'inclSlideFromRight' : 'inclSlideFromLeft'} 0.22s cubic-bezier(0.4,0,0.2,1) both`,
        }}
      >
        {isCollapsed ? (
          <div className="p-6 lg:p-8">
            {(() => {
              const getLines = (text: any): string[] => {
                if (!text) return [];
                if (Array.isArray(text)) {
                  return text
                    .map(line => String(line).trim().replace(/^[-•*]\s*/, ''))
                    .filter(line => line.length > 0);
                }
                const str = typeof text === "string" ? text : String(text);
                return str
                  .split(/\n+/)
                  .map(line => line.trim().replace(/^[-•*]\s*/, ''))
                  .filter(line => line.length > 0);
              };
              const lines = getLines(content.value);
              if (lines.length === 0) {
                return (
                  <div className="text-foreground/30 text-center py-12 text-sm italic">
                    No {active.label.toLowerCase()} added yet.
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
                  {lines.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl border border-white/[0.05] bg-white/[0.01]">
                      <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground/80 leading-normal">{line}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        ) : (
          /* Textarea — local draft buffering to avoid per-keystroke store writes */
          <div className="p-6 lg:p-8">
            <Textarea
              value={localDraft}
              onChange={(e) => {
                const val = e.target.value;
                setLocalDraft(val);
                // Debounce flush to store: cancel previous timer, schedule new one
                if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
                flushTimerRef.current = setTimeout(() => {
                  activeFlushRef.current?.(val);
                }, 500);
              }}
              onBlur={() => flushDraftNow()}
              placeholder={active.placeholder}
              className="min-h-[320px] bg-black/30 border-white/[0.08] text-white placeholder:text-foreground/20 rounded-xl resize-y text-sm p-4 focus-visible:ring-primary/30 focus-visible:border-primary/40 transition-colors"
            />
            <p className="mt-3 text-[11px] text-foreground/25 text-right">
              {localDraft.length} characters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
