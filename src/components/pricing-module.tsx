"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Wallet, Settings, AlertCircle, Minimize2, Maximize2, Link, Plane, Hotel, Car, Bus, Percent, Activity, Compass, RefreshCw, Lock, Unlink, Zap, Check, Copy, Info, Users, Tag, ChevronDown } from "lucide-react";
import { type Currency, type PaymentMilestone, type PricingTier, type ManualCostItem, type PricingConfig } from "@/types/pricing";
import { useItinerary } from "@/hooks/use-itinerary";
import { useItineraryPricing } from "@/hooks/use-itinerary-pricing";
import { formatMoney } from "@/lib/utils/currency";
import { getItemBaseCostForPax } from "@/services/financial";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Fallback defaults if DB is not populated
const DEFAULT_CURRENCIES: { value: Currency; label: string }[] = [
  { value: "INR", label: "Indian Rupee (INR)" },
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "AUD", label: "Australian Dollar (AUD)" },
  { value: "CAD", label: "Canadian Dollar (CAD)" },
  { value: "SGD", label: "Singapore Dollar (SGD)" },
  { value: "AED", label: "UAE Dirham (AED)" },
];

const DEFAULT_MANUAL_CATEGORIES: string[] = [
  "Flight", "Hotel", "Transport", "Activity", "Visa", "Insurance", "Other"
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Flight":
      return <Plane className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    case "Hotel":
      return <Hotel className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case "Transport":
      return <Car className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
    case "Activity":
      return <Compass className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    default:
      return <Settings className="w-3.5 h-3.5 text-slate-600 dark:text-gray-400 shrink-0" />;
  }
};

const getCategoryIconLarge = (category: string) => {
  switch (category) {
    case "Hotel":
      return (
        <svg aria-hidden="true" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
        </svg>
      );
    case "Flight":
      return <Plane className="w-5 h-5 text-sky-500 dark:text-sky-400 shrink-0" />;
    case "Transport":
      return <Car className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" />;
    case "Activity":
      return <Compass className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />;
    default:
      return <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
  }
};

export default function PricingModule({ onSave, isSaving }: { onSave?: (p?: PricingConfig) => void, isSaving?: boolean }) {
  // Store
  const { state, pricing, validationErrors, updatePricing, flights, hotels, cabs, buses, itinerary } = useItinerary();
  const supabase = useMemo(() => createClient(), []);
  const [referenceOptions, setReferenceOptions] = useState<any[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copySubtotal = (id: string, amount: number) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(Math.round(amount).toString());
    }
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 1500);
  };

  // Track linked item IDs that the user has intentionally removed or unlinked in this session,
  // so auto-import does not immediately re-add them.
  const dismissedLinkedIdsRef = useRef<Set<string>>(new Set());
  const lastTripIdRef = useRef<string | null | undefined>(state.tripId);

  // Reset dismissed IDs if the trip changes
  useEffect(() => {
    if (lastTripIdRef.current !== state.tripId) {
      lastTripIdRef.current = state.tripId;
      dismissedLinkedIdsRef.current.clear();
    }
  }, [state.tripId]);

  useEffect(() => {
    const fetchOptions = async () => {
      const { data } = await supabase
        .from('reference_options')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (data) setReferenceOptions(data);
    };
    fetchOptions();
  }, [supabase]);

  const currencies = useMemo(() => {
    const opts = referenceOptions.filter(opt => opt.scope === 'currency');
    return opts.length > 0 ? opts.map(opt => ({ value: opt.value as Currency, label: opt.label })) : DEFAULT_CURRENCIES;
  }, [referenceOptions]);

  const manualCategories = useMemo(() => {
    const opts = referenceOptions.filter(opt => opt.scope === 'manual_cost_category');
    return opts.length > 0 ? opts.map(opt => opt.value) : DEFAULT_MANUAL_CATEGORIES;
  }, [referenceOptions]);

  // Extract all timeline activities from itinerary days
  const availableActivities = useMemo(() => {
    const list: { id: string; name: string; cost: number; dayNum: number }[] = [];
    if (itinerary && Array.isArray(itinerary)) {
      itinerary.forEach((day: any, dayIdx: number) => {
        if (Array.isArray(day.timeline)) {
          day.timeline.forEach((step: any, stepIdx: number) => {
            const actName = step.details || step.title || step.heading || `Day ${dayIdx + 1} Activity`;
            const actId = `act-${dayIdx}-${stepIdx}`;
            list.push({
              id: actId,
              name: `[Day ${day.day || dayIdx + 1}] ${actName.slice(0, 45)}`,
              cost: typeof step.cost === 'number' ? step.cost : 0,
              dayNum: day.day || dayIdx + 1,
            });
          });
        }
      });
    }
    return list;
  }, [itinerary]);

  // ── Automatic Cost Sync & Auto-Import across all Categories ──────────

  useEffect(() => {
    const adultPax = pricing?.adultPax ?? 2;
    const childPax = pricing?.childPax ?? 0;
    const infantPax = pricing?.infantPax ?? 0;
    const totalPax = adultPax + childPax + infantPax;

    const currentOptions = pricing?.manualOptions || [];
    let hasChanges = false;

    // 1. Update any existing linked items whose cost or type might have changed
    const updatedOptions = currentOptions.map((item) => {
      if (!item.linkedItemId) return item;

      let latestCost: number | null = null;
      let latestType: "per-person" | "total" | null = null;

      if (item.category === "Flight") {
        const f = (flights || []).find((fl) => fl.id === item.linkedItemId);
        if (f) {
          const isFlat = f.costType === "flat";
          latestType = isFlat ? "total" : "per-person";
          const flightCostTotal = (f.costAdult || 0) * adultPax + (f.costChild || 0) * childPax + (f.costInfant || 0) * infantPax;
          latestCost = isFlat ? (f.flatCost ?? 0) : (totalPax > 0 ? flightCostTotal / totalPax : (f.costAdult ?? 0));
        }
      } else if (item.category === "Hotel") {
        const h = (hotels || []).find((ho) => ho.id === item.linkedItemId);
        if (h) {
          const isFlat = h.costType === "flat";
          latestType = isFlat ? "total" : "per-person";
          const nights = h.nights || 1;
          const hotelCostTotal = ((h.costAdult || 0) * adultPax + (h.costChild || 0) * childPax + (h.costInfant || 0) * infantPax) * nights;
          latestCost = isFlat ? (h.flatCost ?? 0) * nights : (totalPax > 0 ? hotelCostTotal / totalPax : (h.costAdult ?? 0) * nights);
        }
      } else if (item.category === "Transport") {
        const c = (cabs || []).find((ca) => ca.id === item.linkedItemId);
        if (c) {
          const isFlat = (c.costType || "flat") === "flat";
          latestType = isFlat ? "total" : "per-person";
          const cabCostTotal = (c.costAdult || 0) * adultPax + (c.costChild || 0) * childPax + (c.costInfant || 0) * infantPax;
          latestCost = isFlat ? (c.totalCost ?? c.flatCost ?? 0) : (totalPax > 0 ? cabCostTotal / totalPax : (c.costAdult ?? 0));
        } else {
          const b = (buses || []).find((bu) => bu.id === item.linkedItemId);
          if (b) {
            const isFlat = b.costType === "flat";
            latestType = isFlat ? "total" : "per-person";
            const busCostTotal = (b.costAdult || 0) * adultPax + (b.costChild || 0) * childPax + (b.costInfant || 0) * infantPax;
            latestCost = isFlat ? (b.flatCost ?? 0) : (totalPax > 0 ? busCostTotal / totalPax : (b.costAdult ?? 0));
          }
        }
      } else if (item.category === "Activity") {
        const act = availableActivities.find((a) => a.id === item.linkedItemId);
        if (act && typeof act.cost === "number" && act.cost > 0) {
          latestCost = act.cost;
          latestType = "per-person";
        }
      }

      if (latestCost !== null && (Math.abs(latestCost - item.amount) > 0.001 || (latestType && latestType !== item.type))) {
        hasChanges = true;
        return { ...item, amount: latestCost, type: latestType || item.type };
      }

      return item;
    });

    // 2. Automatically import unlinked items without requiring button click
    const existingLinkedIds = new Set(currentOptions.map((o) => o.linkedItemId).filter(Boolean));
    const newItems: ManualCostItem[] = [];

    // Add Flights
    (flights || []).forEach((f) => {
      if (f.id && !existingLinkedIds.has(f.id) && !dismissedLinkedIdsRef.current.has(f.id)) {
        const isFlat = f.costType === "flat";
        const flightCostTotal = (f.costAdult || 0) * adultPax + (f.costChild || 0) * childPax + (f.costInfant || 0) * infantPax;
        const amount = isFlat ? (f.flatCost || 0) : (totalPax > 0 ? flightCostTotal / totalPax : (f.costAdult || 0));
        newItems.push({
          id: Math.random().toString(36).slice(2),
          name: `${f.airline || "Flight"} ${f.flightNumber || ""} (${f.departureAirport || "DEP"} → ${f.arrivalAirport || "ARR"})`.trim(),
          amount,
          type: isFlat ? "total" : "per-person",
          category: "Flight",
          linkedItemId: f.id,
          markupType: "percentage",
          markupValue: pricing?.markupValue ?? 15,
          taxPercentage: 0,
        });
      }
    });

    // Add Hotels
    (hotels || []).forEach((h) => {
      if (h.id && !existingLinkedIds.has(h.id) && !dismissedLinkedIdsRef.current.has(h.id)) {
        const isFlat = h.costType === "flat";
        const nights = h.nights || 1;
        const hotelCostTotal = ((h.costAdult || 0) * adultPax + (h.costChild || 0) * childPax + (h.costInfant || 0) * infantPax) * nights;
        const amount = isFlat ? (h.flatCost || 0) * nights : (totalPax > 0 ? hotelCostTotal / totalPax : (h.costAdult || 0) * nights);
        newItems.push({
          id: Math.random().toString(36).slice(2),
          name: `${h.name || "Hotel"}${h.nights ? ` (${h.nights} Nights)` : ""}`,
          amount,
          type: isFlat ? "total" : "per-person",
          category: "Hotel",
          linkedItemId: h.id,
          markupType: "percentage",
          markupValue: pricing?.markupValue ?? 15,
          taxPercentage: 0,
        });
      }
    });

    // Add Cabs
    (cabs || []).forEach((c) => {
      if (c.id && !existingLinkedIds.has(c.id) && !dismissedLinkedIdsRef.current.has(c.id)) {
        const isFlat = (c.costType || "flat") === "flat";
        const cabCostTotal = (c.costAdult || 0) * adultPax + (c.costChild || 0) * childPax + (c.costInfant || 0) * infantPax;
        const amount = isFlat ? (c.totalCost ?? c.flatCost ?? 0) : (totalPax > 0 ? cabCostTotal / totalPax : (c.costAdult || 0));
        newItems.push({
          id: Math.random().toString(36).slice(2),
          name: `Cab: ${c.vehicleType || "Cab"}${c.route ? ` (${c.route})` : ""}`,
          amount,
          type: isFlat ? "total" : "per-person",
          category: "Transport",
          linkedItemId: c.id,
          markupType: "percentage",
          markupValue: pricing?.markupValue ?? 15,
          taxPercentage: 0,
        });
      }
    });

    // Add Buses
    (buses || []).forEach((b) => {
      if (b.id && !existingLinkedIds.has(b.id) && !dismissedLinkedIdsRef.current.has(b.id)) {
        const isFlat = b.costType === "flat";
        const busCostTotal = (b.costAdult || 0) * adultPax + (b.costChild || 0) * childPax + (b.costInfant || 0) * infantPax;
        const amount = isFlat ? (b.flatCost || 0) : (totalPax > 0 ? busCostTotal / totalPax : (b.costAdult || 0));
        newItems.push({
          id: Math.random().toString(36).slice(2),
          name: `Bus: ${b.busType || "Bus"}${b.route ? ` (${b.route})` : ""}`,
          amount,
          type: isFlat ? "total" : "per-person",
          category: "Transport",
          linkedItemId: b.id,
          markupType: "percentage",
          markupValue: pricing?.markupValue ?? 15,
          taxPercentage: 0,
        });
      }
    });

    // Add Activities
    availableActivities.forEach((act) => {
      if (act.id && !existingLinkedIds.has(act.id) && !dismissedLinkedIdsRef.current.has(act.id) && act.cost > 0) {
        newItems.push({
          id: Math.random().toString(36).slice(2),
          name: act.name,
          amount: act.cost,
          type: "per-person",
          category: "Activity",
          linkedItemId: act.id,
          markupType: "percentage",
          markupValue: pricing?.markupValue ?? 15,
          taxPercentage: 0,
        });
      }
    });

    if (hasChanges || newItems.length > 0) {
      updatePricing({
        manualOptions: [...updatedOptions, ...newItems],
      });
    }
  }, [
    flights,
    hotels,
    cabs,
    buses,
    availableActivities,
    pricing?.manualOptions,
    pricing?.adultPax,
    pricing?.childPax,
    pricing?.infantPax,
    pricing?.markupValue,
    updatePricing,
  ]);

  // All derived monetary values come from the calculation engine
  const {
    baseCost,
    markupAmount,
    taxAmount,
    finalTotal,
    currencySymbol,
    milestoneAmounts,
  } = useItineraryPricing();

  // ── Milestone helpers ──────────────────────────────────────────────────────

  const addMilestone = () => {
    updatePricing({
      milestones: [
        ...pricing.milestones,
        { id: Math.random().toString(36).slice(2), name: "New Milestone", percentage: 0, dueDate: "TBD" },
      ],
    });
  };

  const updateMilestone = (id: string, field: keyof PaymentMilestone, value: string | number) => {
    updatePricing({
      milestones: pricing.milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    });
  };

  const removeMilestone = (id: string) => {
    updatePricing({
      milestones: pricing.milestones.filter((m) => m.id !== id),
    });
  };

  // ── Manual Cost helpers ────────────────────────────────────────────────────

  const addManualOption = () => {
    updatePricing({
      manualOptions: [
        ...pricing.manualOptions,
        {
          id: Math.random().toString(36).slice(2),
          name: "Custom Service",
          amount: 0,
          type: "per-person",
          category: manualCategories[0] || "Flight",
          markupType: "percentage",
          markupValue: pricing.markupValue ?? 15,
          taxPercentage: 0,
        }
      ]
    });
  };

  const updateManualOption = (id: string, field: keyof ManualCostItem, value: any) => {
    updatePricing({
      manualOptions: pricing.manualOptions.map((o) => (o.id === id ? { ...o, [field]: value } : o)),
    });
  };

  const handleCategoryChange = (optionId: string, newCategory: string) => {
    const currentOpt = (pricing?.manualOptions || []).find((o) => o.id === optionId);
    if (currentOpt?.linkedItemId) {
      dismissedLinkedIdsRef.current.add(currentOpt.linkedItemId);
    }
    updatePricing({
      manualOptions: (pricing?.manualOptions || []).map((o) => {
        if (o.id === optionId) {
          return {
            ...o,
            category: newCategory,
            linkedItemId: undefined,
          };
        }
        return o;
      }),
    });
  };

  const handleLinkItem = (optionId: string, category: string, linkedId: string) => {
    if (linkedId === "unlinked") {
      const currentOpt = (pricing?.manualOptions || []).find((o) => o.id === optionId);
      if (currentOpt?.linkedItemId) {
        dismissedLinkedIdsRef.current.add(currentOpt.linkedItemId);
      }
      updatePricing({
        manualOptions: (pricing?.manualOptions || []).map((o) => (o.id === optionId ? { ...o, linkedItemId: undefined } : o)),
      });
      return;
    }

    dismissedLinkedIdsRef.current.delete(linkedId);

    const adultPax = pricing?.adultPax ?? 2;
    const childPax = pricing?.childPax ?? 0;
    const infantPax = pricing?.infantPax ?? 0;
    const totalPax = adultPax + childPax + infantPax;

    let autoName = "";
    let autoAmount = 0;
    let autoType: "per-person" | "total" = "per-person";

    if (category === "Flight") {
      const flight = (flights || []).find((f) => f.id === linkedId);
      if (flight) {
        autoName = `${flight.airline || "Flight"} ${flight.flightNumber || ""} (${flight.departureAirport || "DEP"} → ${flight.arrivalAirport || "ARR"})`.trim();
        const isFlat = flight.costType === "flat";
        autoType = isFlat ? "total" : "per-person";
        const flightCostTotal = (flight.costAdult || 0) * adultPax + (flight.costChild || 0) * childPax + (flight.costInfant || 0) * infantPax;
        autoAmount = isFlat ? (flight.flatCost || 0) : (totalPax > 0 ? flightCostTotal / totalPax : (flight.costAdult || 0));
      }
    } else if (category === "Hotel") {
      const hotel = (hotels || []).find((h) => h.id === linkedId);
      if (hotel) {
        autoName = `${hotel.name || "Hotel"}${hotel.nights ? ` (${hotel.nights} Nights)` : ""}`;
        const isFlat = hotel.costType === "flat";
        autoType = isFlat ? "total" : "per-person";
        const nights = hotel.nights || 1;
        const hotelCostTotal = ((hotel.costAdult || 0) * adultPax + (hotel.costChild || 0) * childPax + (hotel.costInfant || 0) * infantPax) * nights;
        autoAmount = isFlat ? (hotel.flatCost || 0) * nights : (totalPax > 0 ? hotelCostTotal / totalPax : (hotel.costAdult || 0) * nights);
      }
    } else if (category === "Transport") {
      const cab = (cabs || []).find((c) => c.id === linkedId);
      if (cab) {
        autoName = `Cab: ${cab.vehicleType || "Cab"}${cab.route ? ` (${cab.route})` : ""}`;
        const isFlat = (cab.costType || "flat") === "flat";
        autoType = isFlat ? "total" : "per-person";
        const cabCostTotal = (cab.costAdult || 0) * adultPax + (cab.costChild || 0) * childPax + (cab.costInfant || 0) * infantPax;
        autoAmount = isFlat ? (cab.totalCost ?? cab.flatCost ?? 0) : (totalPax > 0 ? cabCostTotal / totalPax : (cab.costAdult || 0));
      } else {
        const bus = (buses || []).find((b) => b.id === linkedId);
        if (bus) {
          autoName = `Bus: ${bus.busType || "Bus"}${bus.route ? ` (${bus.route})` : ""}`;
          const isFlat = bus.costType === "flat";
          autoType = isFlat ? "total" : "per-person";
          const busCostTotal = (bus.costAdult || 0) * adultPax + (bus.costChild || 0) * childPax + (bus.costInfant || 0) * infantPax;
          autoAmount = isFlat ? (bus.flatCost || 0) : (totalPax > 0 ? busCostTotal / totalPax : (bus.costAdult || 0));
        }
      }
    } else if (category === "Activity") {
      const act = availableActivities.find((a) => a.id === linkedId);
      if (act) {
        autoName = act.name;
        autoAmount = act.cost || 0;
        autoType = "per-person";
      }
    }

    updatePricing({
      manualOptions: (pricing?.manualOptions || []).map((o) => {
        if (o.id === optionId) {
          return {
            ...o,
            linkedItemId: linkedId,
            name: autoName || o.name,
            amount: autoAmount > 0 ? autoAmount : o.amount,
            type: autoType,
          };
        }
        return o;
      }),
    });
  };

  const removeManualOption = (id: string) => {
    const itemToRemove = (pricing?.manualOptions || []).find((o) => o.id === id);
    if (itemToRemove?.linkedItemId) {
      dismissedLinkedIdsRef.current.add(itemToRemove.linkedItemId);
    }
    updatePricing({
      manualOptions: (pricing?.manualOptions || []).filter((o) => o.id !== id),
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      <style>{`
        @keyframes slideFromRight { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }
      `}</style>
      {/* Tab bar / Header block */}
      <div className="bg-[#EFECE5]/95 dark:bg-obsidian-dark/95 backdrop-blur-xl border border-primary/20 rounded-2xl p-4 mb-6 shadow-[0_0_25px_rgba(255,92,51,0.12)]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/20">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">Trip Costing Builder</p>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 leading-none">Live synced costing across all categories with per-item markups and payment schedules.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {validationErrors.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider select-none">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{validationErrors.length} Warnings</span>
              </div>
            )}

            <div className="h-6 w-[1px] bg-white/[0.08] hidden sm:block" />

            {/* Collapse/Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 text-primary hover:bg-primary/10 text-xs font-semibold transition-all cursor-pointer select-none animate-in fade-in duration-200"
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
        className="bg-[#EFECE5]/95 dark:bg-[#0A0A0B]/95 backdrop-blur-xl border border-slate-300/60 dark:border-white/[0.08] rounded-2xl shadow-2xl"
      >
        {/* Warnings list if not collapsed */}
        {!isCollapsed && validationErrors.length > 0 && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 space-y-1">
            {validationErrors.map((err, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}

        <div className="p-3.5 sm:p-6 lg:p-8">
          {isCollapsed ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
              {/* Summary block */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-[#EFECE5] dark:bg-white/[0.02] border border-slate-300/60 dark:border-white/[0.05] rounded-xl p-5 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-300/60 dark:border-white/5 pb-2">Itemized Costs Summary</h4>
                  
                  {pricing.manualOptions.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No manual cost items added.</p>
                  ) : (
                    <div className="space-y-3">
                      {pricing.manualOptions.map((opt) => {
                        const totalPax = (pricing.adultPax || 1) + (pricing.childPax || 0) + (pricing.infantPax || 0);
                        const itemBase = opt.type === "per-person" ? (Number(opt.amount) || 0) * totalPax : (Number(opt.amount) || 0);
                        const mType = opt.markupType || "percentage";
                        const mVal = typeof opt.markupValue === "number" ? opt.markupValue : (pricing.markupValue ?? 15);
                        const itemMarkup = mType === "percentage" ? (itemBase * mVal) / 100 : (opt.type === "per-person" ? mVal * totalPax : mVal);
                        const itemTaxPct = Number(opt.taxPercentage) || 0;
                        const itemTax = ((itemBase + itemMarkup) * itemTaxPct) / 100;
                        const itemTotal = itemBase + itemMarkup + itemTax;

                        return (
                          <div key={opt.id} className="flex justify-between items-center text-sm border-b border-white/[0.02] pb-1.5">
                            <div>
                              <span className="font-medium text-slate-900 dark:text-white">{opt.name}</span>
                              <span className="text-[10px] bg-white/5 text-slate-600 dark:text-gray-400 px-1.5 py-0.5 rounded ml-2 uppercase">{opt.category}</span>
                              {opt.linkedItemId && (
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded ml-1 font-medium">
                                  Synced
                                </span>
                              )}
                              {mVal > 0 && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1 font-mono">
                                  +{mType === 'percentage' ? `${mVal}%` : formatMoney(mVal, pricing.currency)}
                                </span>
                              )}
                              {itemTaxPct > 0 && (
                                <span className="text-[10px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded ml-1 font-mono">
                                  Tax {itemTaxPct}%
                                </span>
                              )}
                            </div>
                            <span className="text-gray-300 font-mono">
                              {formatMoney(itemTotal, pricing.currency)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Milestones schedule */}
                <div className="bg-[#EFECE5] dark:bg-white/[0.02] border border-slate-300/60 dark:border-white/[0.05] rounded-xl p-5 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-300/60 dark:border-white/5 pb-2">Payment Milestones</h4>
                  {milestoneAmounts.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No payment milestones defined.</p>
                  ) : (
                    <div className="space-y-3">
                      {milestoneAmounts.map((m) => (
                        <div key={m.id} className="flex justify-between items-center text-sm">
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">{m.name}</span>
                            <span className="text-xs text-slate-600 dark:text-gray-400 ml-2">({m.percentage}%)</span>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-primary font-bold">{formatMoney(m.amount, pricing.currency)}</span>
                            <p className="text-[10px] text-gray-500 leading-none mt-0.5">{m.dueDate}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Total quote block */}
              <div className="space-y-4">
                <div className="space-y-4 bg-primary/10 p-5 rounded-xl border border-primary/20 text-sm">
                  <div className="text-primary font-bold text-base uppercase tracking-wider border-b border-primary/20 pb-2">Costing Summary</div>
                  <div className="flex justify-between text-slate-600 dark:text-gray-400">
                    <span>Base Cost</span>
                    <span className="font-mono">{formatMoney(baseCost, pricing.currency)}</span>
                  </div>
                  <div className="flex justify-between text-primary font-medium">
                    <span>Total Item Markup</span>
                    <span className="font-mono">+{formatMoney(markupAmount, pricing.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sky-400 font-medium">
                    <span>Total Item Tax</span>
                    <span className="font-mono">+{formatMoney(taxAmount, pricing.currency)}</span>
                  </div>
                  <div className="pt-3 mt-2 border-t border-primary/20 flex justify-between font-extrabold text-slate-900 dark:text-white text-xl">
                    <span>Total Quote</span>
                    <span className="text-primary font-mono">{formatMoney(finalTotal, pricing.currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Full Edit Form */}
              {/* Top Row: Currency */}
              <div className="max-w-xs">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={pricing.currency}
                    onValueChange={(v: Currency) => updatePricing({ currency: v })}
                  >
                    <SelectTrigger className="bg-white dark:bg-black/20 border-slate-300/60 dark:border-white/10 text-slate-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Costing Items Builder */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-7 xl:col-span-8 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-primary font-medium text-xs sm:text-sm">
                      <Settings className="w-4 h-4" />
                      <span>Itemized Cost &amp; Category Sync Builder</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={addManualOption} className="gap-1.5 h-8 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold cursor-pointer">
                        <Plus className="w-4 h-4" /> Add Item
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-3.5">
                    {pricing.manualOptions.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-slate-300/60 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-500 text-sm space-y-3">
                        <p>No cost items added yet.</p>
                      </div>
                    ) : (
                      pricing.manualOptions.map((option, idx) => {
                        const isLinked = Boolean(option.linkedItemId);
                        const itemTitle = option.name && option.name.trim() 
                          ? option.name 
                          : `${option.category || "Item"} #${idx + 1}`;

                        // Determine duration / nights badge
                        let durationBadge: string | null = null;
                        if (option.category === "Hotel") {
                          const h = (hotels || []).find((ho) => ho.id === option.linkedItemId);
                          if (h?.nights) {
                            durationBadge = `${h.nights} Night${h.nights > 1 ? 's' : ''}`;
                          } else {
                            const m = option.name?.match(/\((\d+)\s*Nights?\)/i);
                            durationBadge = m ? `${m[1]} Night${Number(m[1]) > 1 ? 's' : ''}` : "1 Night";
                          }
                        } else if (option.category === "Flight") {
                          const f = (flights || []).find((fl) => fl.id === option.linkedItemId);
                          durationBadge = f?.flightType ? `${f.flightType.charAt(0).toUpperCase() + f.flightType.slice(1)} Flight` : "Flight Transfer";
                        } else if (option.category === "Transport") {
                          durationBadge = "Ground Transfer";
                        } else if (option.category === "Activity") {
                          durationBadge = "Guided Tour";
                        }

                        // Calculations for this card
                        const adultPax = pricing.adultPax || 1;
                        const childPax = pricing.childPax || 0;
                        const infantPax = pricing.infantPax || 0;
                        const totalPax = adultPax + childPax + infantPax;

                        let linkedItem: any = null;
                        if (option.linkedItemId) {
                          if (option.category === "Flight") linkedItem = (flights || []).find((f) => f.id === option.linkedItemId);
                          else if (option.category === "Hotel") linkedItem = (hotels || []).find((h) => h.id === option.linkedItemId);
                          else if (option.category === "Transport") {
                            linkedItem = (cabs || []).find((c) => c.id === option.linkedItemId) || (buses || []).find((b) => b.id === option.linkedItemId);
                          }
                        }

                        const paxObj = { adultPax, childPax, infantPax };
                        const baseVal = linkedItem
                          ? getItemBaseCostForPax(linkedItem, paxObj)
                          : option.type === "per-person" ? (Number(option.amount) || 0) * totalPax : (Number(option.amount) || 0);

                        const mType = option.markupType || "percentage";
                        const mVal = typeof option.markupValue === "number" ? option.markupValue : (pricing.markupValue ?? 15);
                        const markupVal = mType === "percentage" ? (baseVal * mVal) / 100 : (option.type === "per-person" ? mVal * totalPax : mVal);
                        const taxPct = Number(option.taxPercentage) || 0;
                        const taxVal = ((baseVal + markupVal) * taxPct) / 100;
                        const subtotal = baseVal + markupVal + taxVal;

                        const showPaxBreakdown = linkedItem && linkedItem.costType !== "flat" && (childPax > 0 || infantPax > 0);
                        const nights = linkedItem?.nights || 1;
                        const adultCostEach = linkedItem ? (linkedItem.costAdult || 0) * nights : 0;
                        const childCostEach = linkedItem ? (linkedItem.costChild || 0) * nights : 0;
                        const infantCostEach = linkedItem ? (linkedItem.costInfant || 0) * nights : 0;

                        return (
                          <article 
                            key={option.id} 
                            className="bg-white dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-md shadow-slate-200/40 dark:shadow-none transition-shadow overflow-hidden w-full" 
                            data-purpose="hotel-pricing-card"
                          >
                            {/* BEGIN: CardHeader */}
                            <header className="px-3 py-1.5 sm:px-3.5 sm:py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              {/* Left: Identity & Live Sync Pill */}
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {/* Category Icon Stamp */}
                                <div className="w-7.5 h-7.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs shrink-0">
                                  {getCategoryIconLarge(option.category)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h2 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white tracking-tight truncate max-w-[200px] xs:max-w-[260px] sm:max-w-xs md:max-w-md" title={itemTitle}>
                                      {itemTitle}
                                    </h2>
                                    {durationBadge && (
                                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                                        {durationBadge}
                                      </span>
                                    )}
                                  </div>
                                  {/* Live Inventory Sync Indicator */}
                                  {isLinked ? (
                                    <div className="relative inline-block group/tooltip mt-0.5">
                                      <div className="flex items-center gap-1.5 cursor-pointer text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                        <span className="relative flex h-2 w-2 shrink-0">
                                          <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400/60"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <span className="shrink-0">Live Synced</span>
                                        <span className="text-slate-500 dark:text-slate-400 text-[10px] font-normal truncate">
                                          ({option.category === "Hotel" ? "Hotel Inventory" : `${option.category} Feed`})
                                        </span>
                                        <Info className="w-3 h-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors ml-0.5 shrink-0" />
                                      </div>
                                      {/* Tooltip on Sync Status */}
                                      <div className="invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 transition-opacity duration-150 absolute z-30 bottom-full left-0 mb-1.5 w-60 p-2 rounded-lg bg-slate-900 border border-slate-800 shadow-xl text-[10px] text-slate-200 pointer-events-none leading-relaxed">
                                        <p className="font-semibold text-emerald-400 mb-0.5">Automated Inventory Feed</p>
                                        Base pricing and availability are continuously fetched in real-time from the {option.category} inventory feed.
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                                      <span>Manual Entry</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* Right: Actions (Unlink + Delete) */}
                              <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                {isLinked && (
                                  <button 
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 shadow-xs transition-colors cursor-pointer" 
                                    title="Unlink from dynamic inventory feed" 
                                    type="button"
                                    onClick={() => handleLinkItem(option.id, option.category, "unlinked")}
                                  >
                                    <Unlink className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                    <span className="hidden sm:inline">Unlink</span>
                                  </button>
                                )}
                                <button 
                                  aria-label="Remove item" 
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/50 transition-colors cursor-pointer" 
                                  title="Remove item" 
                                  type="button"
                                  onClick={() => removeManualOption(option.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </header>
                            {/* END: CardHeader */}

                            {/* BEGIN: CardBodyForm */}
                            <div className="p-2.5 sm:p-3 space-y-2">
                              {/* Form Controls Group: Zero extra padding or borders between rows */}
                              <div className="space-y-1.5">
                                {/* ROW 1: Service Category & Inventory Link */}
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2" data-purpose="mapping-section">
                                  {/* Category Selector */}
                                  <div className="sm:col-span-4 space-y-0.5">
                                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                      Category
                                    </label>
                                    <Select 
                                      value={option.category} 
                                      onValueChange={(v) => handleCategoryChange(option.id, v)}
                                    >
                                      <SelectTrigger className="w-full h-8 bg-white dark:bg-black/20 border-slate-300/60 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white font-medium focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs px-2.5">
                                        <SelectValue placeholder="Category" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-white dark:bg-obsidian-dark border-slate-300/60 dark:border-white/10 text-slate-900 dark:text-zinc-200 shadow-xl text-xs">
                                        <SelectItem value="Hotel">Hotel &amp; Stay</SelectItem>
                                        <SelectItem value="Flight">Flight Transfer</SelectItem>
                                        <SelectItem value="Activity">Guided Tour / Activity</SelectItem>
                                        <SelectItem value="Transport">Ground Transfer</SelectItem>
                                        <SelectItem value="Visa">Visa Fee</SelectItem>
                                        <SelectItem value="Insurance">Travel Insurance</SelectItem>
                                        <SelectItem value="Other">Other Service</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Linked Property / Inventory Record */}
                                  <div className="sm:col-span-8 space-y-0.5">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 truncate">
                                        <Link className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <span className="truncate">
                                          {option.category === "Hotel" 
                                            ? "Connected Hotel Property" 
                                            : option.category === "Flight" 
                                            ? "Connected Flight Route" 
                                            : option.category === "Transport" 
                                            ? "Connected Ground Transfer" 
                                            : option.category === "Activity" 
                                            ? "Connected Activity / Tour" 
                                            : `Connected ${option.category} Item`}
                                        </span>
                                      </label>
                                      {isLinked ? (
                                        <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 px-1.5 py-0.2 rounded shrink-0 ml-1">
                                          Feed Active
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-medium text-slate-400 shrink-0 ml-1">
                                          Standalone
                                        </span>
                                      )}
                                    </div>

                                    <Select
                                      value={option.linkedItemId || "unlinked"}
                                      onValueChange={(v) => handleLinkItem(option.id, option.category, v)}
                                    >
                                      <SelectTrigger className={cn(
                                        "w-full h-8 rounded-lg text-xs font-medium shadow-xs transition-colors text-left px-2.5",
                                        isLinked
                                          ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500/40 text-emerald-950 dark:text-emerald-100 font-medium"
                                          : "bg-white dark:bg-black/20 border-slate-300/60 dark:border-white/10 text-slate-900 dark:text-white"
                                      )}>
                                        <SelectValue placeholder={`Select ${option.category}...`} />
                                      </SelectTrigger>
                                      <SelectContent className="bg-white dark:bg-obsidian-dark border-slate-300/60 dark:border-white/10 text-slate-900 dark:text-zinc-200 max-h-64 shadow-xl text-xs">
                                        <SelectItem value="unlinked">
                                          <span className="text-slate-500 dark:text-gray-400 italic">Manual Entry (Unlinked)</span>
                                        </SelectItem>
                                        {option.category === "Hotel" && (hotels || []).map((h) => (
                                          <SelectItem key={h.id} value={h.id}>
                                            <span className="flex items-center gap-1.5">
                                              <Hotel className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                              <span>{h.name || "Hotel"}{h.nights ? ` • ${h.nights} Night${h.nights > 1 ? 's' : ''}` : ""}</span>
                                            </span>
                                          </SelectItem>
                                        ))}
                                        {option.category === "Flight" && (flights || []).map((f) => (
                                          <SelectItem key={f.id} value={f.id}>
                                            <span className="flex items-center gap-1.5">
                                              <Plane className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                              <span>{f.airline || "Flight"} {f.flightNumber || ""} ({f.departureAirport || "DEP"} → {f.arrivalAirport || "ARR"})</span>
                                            </span>
                                          </SelectItem>
                                        ))}
                                        {option.category === "Transport" && (
                                          <>
                                            {(cabs || []).map((c) => (
                                              <SelectItem key={c.id} value={c.id}>
                                                <span className="flex items-center gap-1.5">
                                                  <Car className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                  <span>Cab: {c.vehicleType || "Cab"}{c.route ? ` (${c.route})` : ""}</span>
                                                </span>
                                              </SelectItem>
                                            ))}
                                            {(buses || []).map((b) => (
                                              <SelectItem key={b.id} value={b.id}>
                                                <span className="flex items-center gap-1.5">
                                                  <Bus className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                                  <span>Bus: {b.busType || "Bus"}{b.route ? ` (${b.route})` : ""}</span>
                                                </span>
                                              </SelectItem>
                                            ))}
                                          </>
                                        )}
                                        {option.category === "Activity" && (availableActivities || []).map((act) => (
                                          <SelectItem key={act.id} value={act.id}>
                                            <span className="flex items-center gap-1.5">
                                              <Activity className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                              <span>{act.name} {act.cost > 0 ? `(${currencySymbol}${act.cost})` : ''}</span>
                                            </span>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* ROW 2: Derived Specs & Base Cost */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" data-purpose="derived-specs-grid">
                                  {/* Field 1: Service Name (Derived & Locked) */}
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                                        Service Label
                                      </label>
                                      <span className="text-[9px] font-medium text-slate-400 flex items-center gap-0.5 shrink-0 ml-1">
                                        {isLinked ? (
                                          <>
                                            <Lock className="w-2.5 h-2.5 text-slate-400" />
                                            Derived
                                          </>
                                        ) : (
                                          "Custom"
                                        )}
                                      </span>
                                    </div>
                                    {isLinked ? (
                                      <div className="h-8 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2.5">
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate mr-1.5" title={option.name}>
                                          {option.name || "Service Item"}
                                        </span>
                                        <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 px-1 py-0.2 rounded shrink-0">
                                          Synced
                                        </span>
                                      </div>
                                    ) : (
                                      <input 
                                        type="text"
                                        value={option.name} 
                                        onChange={(e) => updateManualOption(option.id, "name", e.target.value)}
                                        placeholder="e.g. Service Name"
                                        className="h-8 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg px-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-xs"
                                      />
                                    )}
                                  </div>

                                  {/* Field 2: Pricing Type */}
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                                        Pricing Model
                                      </label>
                                      <span className="text-[9px] font-medium text-slate-400 flex items-center gap-0.5 shrink-0 ml-1">
                                        {isLinked ? (
                                          <>
                                            <Lock className="w-2.5 h-2.5 text-slate-400" />
                                            Locked
                                          </>
                                        ) : (
                                          "Editable"
                                        )}
                                      </span>
                                    </div>
                                    {isLinked ? (
                                      <div className="h-8 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2.5">
                                        <div className="flex items-center gap-1.5 truncate mr-1">
                                          {option.type === "per-person" ? (
                                            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                          ) : (
                                            <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                          )}
                                          <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                                            {option.type === "per-person" ? "Per Person (Pax)" : "Total Flat"}
                                          </span>
                                        </div>
                                        <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                                      </div>
                                    ) : (
                                      <Select
                                        value={option.type}
                                        onValueChange={(v: "per-person" | "total") => updateManualOption(option.id, "type", v)}
                                      >
                                        <SelectTrigger className="w-full h-8 bg-white dark:bg-black/20 border-slate-300/60 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white font-medium shadow-xs px-2.5">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-obsidian-dark border-slate-300/60 dark:border-white/10 text-slate-900 dark:text-zinc-200 shadow-xl text-xs">
                                          <SelectItem value="per-person">Per Person (Pax)</SelectItem>
                                          <SelectItem value="total">Total Flat</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>

                                  {/* Field 3: Base Unit Cost */}
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                                        Base Unit Cost
                                      </label>
                                      {isLinked ? (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0 ml-1">
                                          <RefreshCw className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                          Auto-rate
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-medium text-slate-400 shrink-0 ml-1">Manual</span>
                                      )}
                                    </div>
                                    {isLinked ? (
                                      <div className="h-8 flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg px-2.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/20 shadow-xs">
                                        <div className="flex items-center gap-1 font-mono font-semibold text-slate-900 dark:text-white text-xs truncate mr-1">
                                          <span className="text-[11px] text-slate-500 font-sans">{currencySymbol}</span>
                                          <span className="truncate">{Number(option.amount || 0).toLocaleString()}</span>
                                          <span className="text-[10px] font-sans text-slate-500 font-normal ml-0.5 shrink-0">
                                            {option.category === "Hotel" ? "/ nt" : option.type === "per-person" ? "/ pax" : "/ tot"}
                                          </span>
                                        </div>
                                        <span className="text-[9px] font-mono font-medium uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                                          {option.category === "Hotel" ? "GDS Rate" : "Synced Rate"}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="relative rounded-lg shadow-xs">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                                          <span className="text-slate-500 text-[11px] font-sans font-bold">{currencySymbol}</span>
                                        </div>
                                        <input 
                                          type="number"
                                          value={option.amount} 
                                          onChange={(e) => updateManualOption(option.id, "amount", Number(e.target.value))}
                                          placeholder="0"
                                          className="h-8 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg pl-7 pr-2.5 py-1 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-xs"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* ROW 3: Markup & Tax Rules */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end" data-purpose="markup-tax-controls">
                                  {/* Markup Type */}
                                  <div className="space-y-0.5 min-w-0">
                                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                                      Markup Type
                                    </label>
                                    <div className="grid grid-cols-2 bg-slate-200/70 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 h-8 items-center">
                                      <button 
                                        type="button"
                                        onClick={() => updateManualOption(option.id, "markupType", "percentage")}
                                        className={cn(
                                          "h-6.5 rounded-md text-center transition-colors cursor-pointer font-medium text-[10px] sm:text-[11px] px-1 truncate",
                                          (option.markupType || "percentage") === "percentage"
                                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs border border-slate-200/60 dark:border-slate-600"
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                        )}
                                      >
                                        Percent (%)
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => updateManualOption(option.id, "markupType", "flat")}
                                        className={cn(
                                          "h-6.5 rounded-md text-center transition-colors cursor-pointer font-medium text-[10px] sm:text-[11px] px-1 truncate",
                                          option.markupType === "flat"
                                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs border border-slate-200/60 dark:border-slate-600"
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                        )}
                                      >
                                        Flat ({currencySymbol})
                                      </button>
                                    </div>
                                  </div>

                                  {/* Markup Value Input */}
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                                        Margin Markup
                                      </label>
                                      <span className="text-[9px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded font-medium font-mono border border-emerald-200/70 dark:border-emerald-800/60 shrink-0 ml-1">
                                        +{formatMoney(markupVal, pricing.currency)}
                                      </span>
                                    </div>
                                    <div className="relative rounded-lg shadow-xs">
                                      <input 
                                        type="number"
                                        step="0.5" 
                                        value={typeof option.markupValue === "number" ? option.markupValue : (pricing.markupValue ?? 15)} 
                                        onChange={(e) => updateManualOption(option.id, "markupValue", Number(e.target.value))}
                                        className="h-8 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg pl-2.5 pr-7 py-1 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                                      />
                                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                                        <span className="text-slate-400 font-semibold text-[10px]">{option.markupType === "flat" ? currencySymbol : "%"}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Item Tax / GST (App Select Dropdown) */}
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                                        Applicable GST / Tax
                                      </label>
                                      <span className="text-[9px] text-slate-500 shrink-0 ml-1">
                                        {taxPct === 0 ? "Exempt" : `+${formatMoney(taxVal, pricing.currency)}`}
                                      </span>
                                    </div>
                                    <Select 
                                      value={taxPct.toString()}
                                      onValueChange={(v) => updateManualOption(option.id, "taxPercentage", Number(v))}
                                    >
                                      <SelectTrigger className="w-full h-8 bg-white dark:bg-black/20 border-slate-300/60 dark:border-white/10 rounded-lg text-xs font-medium text-slate-900 dark:text-white shadow-xs px-2.5">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-white dark:bg-obsidian-dark border-slate-300/60 dark:border-white/10 text-slate-900 dark:text-zinc-200 shadow-xl text-xs">
                                        <SelectItem value="0">0% (Nil / Exempt)</SelectItem>
                                        <SelectItem value="5">5% Standard GST</SelectItem>
                                        <SelectItem value="12">12% Hospitality GST</SelectItem>
                                        <SelectItem value="18">18% Integrated IGST</SelectItem>
                                        <SelectItem value="28">28% Luxury GST</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>

                              {/* SECTION 4: Calculation Breakdown & Grand Subtotal */}
                              <section className="rounded-lg bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/90 dark:border-slate-800 p-2 sm:p-2.5" data-purpose="calculation-summary">
                                {/* Pax breakdown header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800 gap-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Guests:</span>
                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs">
                                      {adultPax} Adult{adultPax > 1 ? 's' : ''}{childPax > 0 ? `, ${childPax} Child${childPax > 1 ? 'ren' : ''}` : ''}{infantPax > 0 ? `, ${infantPax} Infant${infantPax > 1 ? 's' : ''}` : ''}
                                    </span>
                                    {option.type === "per-person" && (
                                      <span className="text-slate-500 text-[10px] font-mono">
                                        × {formatMoney(option.amount, pricing.currency)} / pax
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-mono text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300">
                                    Gross Base: <span className="text-slate-900 dark:text-white font-bold">{formatMoney(baseVal, pricing.currency)}</span>
                                  </div>
                                </div>

                                {showPaxBreakdown && (
                                  <div className="py-1 px-2 my-1.5 rounded-md bg-white/60 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                                    <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Pax Breakdown</div>
                                    {adultPax > 0 && (
                                      <div className="flex justify-between text-[10px] sm:text-[11px] font-mono">
                                        <span className="text-slate-600 dark:text-slate-400">Adults: {adultPax} × {formatMoney(adultCostEach, pricing.currency)}</span>
                                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{formatMoney(adultCostEach * adultPax, pricing.currency)}</span>
                                      </div>
                                    )}
                                    {childPax > 0 && (
                                      <div className="flex justify-between text-[10px] sm:text-[11px] font-mono">
                                        <span className="text-slate-600 dark:text-slate-400">Children: {childPax} × {formatMoney(childCostEach, pricing.currency)}</span>
                                        <span className="text-amber-600 dark:text-amber-400 font-semibold">{formatMoney(childCostEach * childPax, pricing.currency)}</span>
                                      </div>
                                    )}
                                    {infantPax > 0 && (
                                      <div className="flex justify-between text-[10px] sm:text-[11px] font-mono">
                                        <span className="text-slate-600 dark:text-slate-400">Infants: {infantPax} × {formatMoney(infantCostEach, pricing.currency)}</span>
                                        <span className="text-sky-600 dark:text-sky-400 font-semibold">{formatMoney(infantCostEach * infantPax, pricing.currency)}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Formula strip & final total output */}
                                <div className="pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  {/* Step-by-step audit trail */}
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                                    <div className="flex items-center gap-1">
                                      <span className="text-slate-500 font-sans">Base:</span>
                                      <span className="text-slate-800 dark:text-slate-200 font-semibold">{formatMoney(baseVal, pricing.currency)}</span>
                                    </div>
                                    <span className="text-slate-400">+</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-slate-500 font-sans">Markup ({mType === "percentage" ? `${mVal}%` : formatMoney(mVal, pricing.currency)}):</span>
                                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">+{formatMoney(markupVal, pricing.currency)}</span>
                                    </div>
                                    <span className="text-slate-400">+</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-slate-500 font-sans">Tax ({taxPct}%):</span>
                                      <span className="text-slate-600 dark:text-slate-400">{formatMoney(taxVal, pricing.currency)}</span>
                                    </div>
                                  </div>

                                  {/* Grand Subtotal Highlight (High-Contrast Modern SaaS card) */}
                                  <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 bg-slate-900 text-white border border-slate-800 px-2.5 py-1 sm:py-1.5 rounded-lg shadow-xs">
                                    <div className="text-left sm:text-right">
                                      <div className="text-[9px] font-bold tracking-wider uppercase text-slate-400">Line Subtotal</div>
                                      <div className="text-sm sm:text-base font-bold font-mono text-emerald-400 tracking-tight">{formatMoney(subtotal, pricing.currency)}</div>
                                    </div>
                                    <button 
                                      aria-label="Copy subtotal" 
                                      className="p-1 rounded text-slate-400 hover:text-emerald-300 hover:bg-slate-800 border border-transparent transition-colors cursor-pointer shrink-0" 
                                      data-purpose="copy-subtotal" 
                                      title="Copy calculated subtotal" 
                                      type="button"
                                      onClick={() => copySubtotal(option.id, subtotal)}
                                    >
                                      {copiedId === option.id ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </section>
                            </div>
                            {/* END: CardBodyForm */}

                            {/* BEGIN: CardFooterMeta */}
                            <footer className="px-3 py-1 sm:px-3.5 sm:py-1.5 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                <span>{isLinked ? "Live price sync confirmed (Inventory Feed Active)" : "Manual itemized cost entry"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 dark:text-slate-500 text-[9px] sm:text-[10px]">Pricing Policies • Inventory Feed Verified</span>
                              </div>
                            </footer>
                            {/* END: CardFooterMeta */}
                          </article>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-24 self-start">
                  {/* Live Costing Summary — Primary Orange Theme */}
                  <div className="space-y-3 bg-primary/10 p-5 rounded-xl border border-primary/20 text-sm">
                    <div className="text-primary font-bold text-base uppercase tracking-wider border-b border-primary/20 pb-2">
                      Costing Summary
                    </div>

                    {/* PAX Composition Breakdown */}
                    {(() => {
                      const adultPax = pricing.adultPax || 0;
                      const childPax = pricing.childPax || 0;
                      const infantPax = pricing.infantPax || 0;
                      const totalPax = adultPax + childPax + infantPax;
                      if (totalPax === 0) return null;

                      // Calculate per-pax costs across all items
                      let totalAdultCost = 0;
                      let totalChildCost = 0;
                      let totalInfantCost = 0;

                      for (const item of (pricing.manualOptions || [])) {
                        let linkedItem: any = null;
                        if (item.linkedItemId) {
                          if (item.category === "Flight") linkedItem = (flights || []).find((f) => f.id === item.linkedItemId);
                          else if (item.category === "Hotel") linkedItem = (hotels || []).find((h) => h.id === item.linkedItemId);
                          else if (item.category === "Transport") {
                            linkedItem = (cabs || []).find((c) => c.id === item.linkedItemId) || (buses || []).find((b) => b.id === item.linkedItemId);
                          }
                        }

                        if (linkedItem && linkedItem.costType !== "flat") {
                          const nights = linkedItem.nights || 1;
                          totalAdultCost += (linkedItem.costAdult || 0) * adultPax * nights;
                          totalChildCost += (linkedItem.costChild || 0) * childPax * nights;
                          totalInfantCost += (linkedItem.costInfant || 0) * infantPax * nights;
                        } else if (linkedItem && linkedItem.costType === "flat") {
                          // flat cost — split proportionally for display
                          const nights = linkedItem.nights || 1;
                          const flatTotal = (linkedItem.flatCost ?? linkedItem.totalCost ?? 0) * nights;
                          const share = totalPax > 0 ? flatTotal / totalPax : 0;
                          totalAdultCost += share * adultPax;
                          totalChildCost += share * childPax;
                          totalInfantCost += share * infantPax;
                        } else {
                          // Manual (unlinked) per-person or total item — split proportionally
                          const itemBase = item.type === "per-person" ? (Number(item.amount) || 0) * totalPax : (Number(item.amount) || 0);
                          const share = totalPax > 0 ? itemBase / totalPax : 0;
                          totalAdultCost += share * adultPax;
                          totalChildCost += share * childPax;
                          totalInfantCost += share * infantPax;
                        }
                      }

                      return (
                        <div className="space-y-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 text-xs">
                          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Pax Cost Breakdown (Base)</div>
                          {adultPax > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 dark:text-gray-400 inline-flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                <span>{adultPax} Adult{adultPax > 1 ? "s" : ""}</span>
                              </span>
                              <span className="font-mono text-slate-900 dark:text-white font-semibold">{formatMoney(totalAdultCost, pricing.currency)}</span>
                            </div>
                          )}
                          {childPax > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 dark:text-gray-400 inline-flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-amber-400" />
                                <span>{childPax} Child{childPax > 1 ? "ren" : ""}</span>
                              </span>
                              <span className="font-mono text-amber-300 font-semibold">{formatMoney(totalChildCost, pricing.currency)}</span>
                            </div>
                          )}
                          {infantPax > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 dark:text-gray-400 inline-flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-sky-400" />
                                <span>{infantPax} Infant{infantPax > 1 ? "s" : ""}</span>
                              </span>
                              <span className="font-mono text-sky-300 font-semibold">{formatMoney(totalInfantCost, pricing.currency)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="flex justify-between text-slate-600 dark:text-gray-400">
                      <span>Base Cost</span>
                      <span className="font-mono">{formatMoney(baseCost, pricing.currency)}</span>
                    </div>
                    <div className="flex justify-between text-primary font-medium">
                      <span>Total Item Markup</span>
                      <span className="font-mono">+{formatMoney(markupAmount, pricing.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sky-400 font-medium">
                      <span>Total Item Tax</span>
                      <span className="font-mono">+{formatMoney(taxAmount, pricing.currency)}</span>
                    </div>
                    <div className="pt-3 mt-2 border-t border-primary/20 flex justify-between font-extrabold text-slate-900 dark:text-white text-xl">
                      <span>Total Client Quote</span>
                      <span className="text-primary font-mono">{formatMoney(finalTotal, pricing.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Milestones */}
              <div className="space-y-4 pt-4 border-t border-slate-300/60 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    Payment Schedule
                  </h4>
                  <Button variant="outline" size="sm" onClick={addMilestone} className="gap-2 bg-white/5 border-slate-300/60 dark:border-white/10 hover:bg-white/10">
                    <Plus className="w-4 h-4" /> Add Milestone
                  </Button>
                </div>

                <div className="space-y-3">
                  {milestoneAmounts.map((milestone, idx) => (
                    <div
                      key={milestone.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-300/60 dark:border-white/10 bg-slate-50 dark:bg-black/20"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-gray-500">Name</Label>
                          <Input
                            value={milestone.name}
                            onChange={(e) => updateMilestone(milestone.id, "name", e.target.value)}
                            placeholder="e.g. Booking Advance"
                            className="bg-white dark:bg-black/20 border-slate-300/60 dark:border-white/5 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-gray-500">Percentage (%)</Label>
                          <Input
                            type="number"
                            value={milestone.percentage}
                            onChange={(e) => updateMilestone(milestone.id, "percentage", Number(e.target.value))}
                            className="bg-white dark:bg-black/20 border-slate-300/60 dark:border-white/5 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-gray-500">Due Date / Timeline</Label>
                          <Input
                            value={milestone.dueDate}
                            onChange={(e) => updateMilestone(milestone.id, "dueDate", e.target.value)}
                            placeholder="e.g. 15 days before"
                            className="bg-white dark:bg-black/20 border-slate-300/60 dark:border-white/5 text-xs"
                          />
                        </div>
                      </div>

                      {/* Milestone amount — reactive from engine */}
                      <div className="pt-5">
                        <div className="text-primary font-bold text-base w-32 text-right font-mono">
                          {formatMoney(milestone.amount, pricing.currency)}
                        </div>
                      </div>

                      <div className="pt-5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMilestone(milestone.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
