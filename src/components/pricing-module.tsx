"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Wallet, Settings, AlertCircle, Minimize2, Maximize2, Link, Sparkles, Plane, Hotel, Car, Bus, Percent, Activity, Compass, RefreshCw, Lock, Unlink, Zap } from "lucide-react";
import { type Currency, type PaymentMilestone, type PricingTier, type ManualCostItem, type PricingConfig } from "@/types/pricing";

// Store hooks — replaces all props
import { useItinerary } from "@/hooks/use-itinerary";
import { useItineraryPricing } from "@/hooks/use-itinerary-pricing";
import { formatMoney } from "@/lib/utils/currency";
import { getItemBaseCostForPax } from "@/services/financial";
import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

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

export default function PricingModule({ onSave, isSaving }: { onSave?: (p?: PricingConfig) => void, isSaving?: boolean }) {
  // Store
  const { pricing, validationErrors, updatePricing, flights, hotels, cabs, buses, itinerary } = useItinerary();
  const supabase = useMemo(() => createClient(), []);
  const [referenceOptions, setReferenceOptions] = useState<any[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  // ── Automatic Cost Sync for all Linked Items across all Categories ──────────

  useEffect(() => {
    if (!pricing?.manualOptions || pricing.manualOptions.length === 0) return;

    const adultPax = pricing?.adultPax ?? 2;
    const childPax = pricing?.childPax ?? 0;
    const infantPax = pricing?.infantPax ?? 0;
    const totalPax = adultPax + childPax + infantPax;

    let hasChanges = false;
    const updatedOptions = pricing.manualOptions.map((item) => {
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

    if (hasChanges) {
      updatePricing({ manualOptions: updatedOptions });
    }
  }, [flights, hotels, cabs, buses, availableActivities, pricing?.manualOptions, pricing?.adultPax, pricing?.childPax, pricing?.infantPax, updatePricing]);

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
    updatePricing({
      manualOptions: pricing.manualOptions.map((o) => {
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
      updatePricing({
        manualOptions: pricing.manualOptions.map((o) => (o.id === optionId ? { ...o, linkedItemId: undefined } : o)),
      });
      return;
    }

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
      manualOptions: pricing.manualOptions.map((o) => {
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

  const autoSyncItineraryItems = () => {
    const adultPax = pricing?.adultPax ?? 2;
    const childPax = pricing?.childPax ?? 0;
    const infantPax = pricing?.infantPax ?? 0;
    const totalPax = adultPax + childPax + infantPax;

    const existingLinkedIds = new Set(pricing.manualOptions.map((o) => o.linkedItemId).filter(Boolean));
    const newItems: ManualCostItem[] = [];

    // Add Flights
    (flights || []).forEach((f) => {
      if (!existingLinkedIds.has(f.id)) {
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
          markupValue: pricing.markupValue ?? 15,
          taxPercentage: 0,
        });
      }
    });

    // Add Hotels
    (hotels || []).forEach((h) => {
      if (!existingLinkedIds.has(h.id)) {
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
          markupValue: pricing.markupValue ?? 15,
          taxPercentage: 0,
        });
      }
    });

    // Add Cabs
    (cabs || []).forEach((c) => {
      if (!existingLinkedIds.has(c.id)) {
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
          markupValue: pricing.markupValue ?? 15,
          taxPercentage: 0,
        });
      }
    });

    // Add Buses
    (buses || []).forEach((b) => {
      if (!existingLinkedIds.has(b.id)) {
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
          markupValue: pricing.markupValue ?? 15,
          taxPercentage: 0,
        });
      }
    });

    // Add Activities
    availableActivities.forEach((act) => {
      if (!existingLinkedIds.has(act.id) && act.cost > 0) {
        newItems.push({
          id: Math.random().toString(36).slice(2),
          name: act.name,
          amount: act.cost,
          type: "per-person",
          category: "Activity",
          linkedItemId: act.id,
          markupType: "percentage",
          markupValue: pricing.markupValue ?? 15,
          taxPercentage: 0,
        });
      }
    });

    if (newItems.length > 0) {
      updatePricing({
        manualOptions: [...pricing.manualOptions, ...newItems],
      });
    }
  };

  const removeManualOption = (id: string) => {
    updatePricing({
      manualOptions: pricing.manualOptions.filter((o) => o.id !== id),
    });
  };

  const availableItineraryItemsCount = useMemo(() => {
    const existingLinkedIds = new Set(pricing.manualOptions.map((o) => o.linkedItemId).filter(Boolean));
    let count = 0;
    (flights || []).forEach((f) => { if (!existingLinkedIds.has(f.id)) count++; });
    (hotels || []).forEach((h) => { if (!existingLinkedIds.has(h.id)) count++; });
    (cabs || []).forEach((c) => { if (!existingLinkedIds.has(c.id)) count++; });
    (buses || []).forEach((b) => { if (!existingLinkedIds.has(b.id)) count++; });
    availableActivities.forEach((a) => { if (!existingLinkedIds.has(a.id) && a.cost > 0) count++; });
    return count;
  }, [pricing.manualOptions, flights, hotels, cabs, buses, availableActivities]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-300">
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
        className="bg-[#EFECE5]/95 dark:bg-[#0A0A0B]/95 backdrop-blur-xl border border-slate-300/60 dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: `slideFromRight 0.22s cubic-bezier(0.4,0,0.2,1) both` }}
      >
        {/* Warnings list if not collapsed */}
        {!isCollapsed && validationErrors.length > 0 && (
          <div className="mx-6 lg:mx-8 mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 space-y-1">
            {validationErrors.map((err, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}

        <div className="p-6 lg:p-8">
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <Settings className="w-4 h-4" />
                      Itemized Cost & Category Sync Builder
                    </div>
                    <div className="flex items-center gap-2">
                      {availableItineraryItemsCount > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={autoSyncItineraryItems} 
                          className="gap-1.5 h-8 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Import All Categories ({availableItineraryItemsCount})
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={addManualOption} className="gap-1.5 h-8 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold cursor-pointer">
                        <Plus className="w-4 h-4" /> Add Item
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
                    {pricing.manualOptions.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-slate-300/60 dark:border-white/10 rounded-xl bg-[#EFECE5]/60 dark:bg-white/5 text-gray-500 text-sm space-y-3">
                        <p>No cost items added yet.</p>
                        {availableItineraryItemsCount > 0 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={autoSyncItineraryItems} 
                            className="gap-2 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            Auto-Import {availableItineraryItemsCount} Category Item(s)
                          </Button>
                        )}
                      </div>
                    ) : (
                      pricing.manualOptions.map((option, idx) => {
                        const isLinked = Boolean(option.linkedItemId);
                        const itemTitle = option.name && option.name.trim() 
                          ? option.name 
                          : `${option.category || "Item"} #${idx + 1}`;

                        return (
                          <div 
                            key={option.id} 
                            className={`p-4 rounded-xl border transition-all space-y-3.5 relative group ${
                              isLinked 
                                ? "border-emerald-500/40 bg-[#EFECE5] dark:bg-emerald-950/20 shadow-md hover:border-emerald-500/60" 
                                : "border-slate-300/60 dark:border-white/10 bg-[#EFECE5] dark:bg-white/5 hover:border-white/20"
                            }`}
                          >
                            {/* Header row */}
                            <div className={`flex items-center justify-between border-b pb-2.5 ${isLinked ? "border-emerald-500/20" : "border-white/[0.05]"}`}>
                              <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1 mr-2">
                                <div className={`p-1.5 rounded-lg shrink-0 ${isLinked ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-primary/10 text-primary"}`}>
                                  {getCategoryIcon(option.category)}
                                </div>
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-[300px]" title={itemTitle}>
                                  {itemTitle}
                                </span>
                                {isLinked ? (
                                  <span className="flex items-center gap-1.5 text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold tracking-wide uppercase shadow-sm shrink-0">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-600 dark:bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-emerald-500"></span>
                                    </span>
                                    Live Synced ({option.category})
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-white/5 text-slate-600 dark:text-gray-400 border border-slate-300/60 dark:border-white/5 px-2 py-0.5 rounded-full font-medium shrink-0">
                                    Manual Entry
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {isLinked && (
                                  <button
                                    type="button"
                                    onClick={() => handleLinkItem(option.id, option.category, "unlinked")}
                                    className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-slate-900 dark:hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2 py-1 rounded-lg transition-colors cursor-pointer select-none"
                                    title="Unlink this item to make it a standalone manual entry"
                                  >
                                    <Unlink className="w-3 h-3" />
                                    <span>Unlink to Edit</span>
                                  </button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removeManualOption(option.id)}
                                  className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>

                            {/* Inputs Row 1: Category & Linked Item Picker */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-wider text-slate-600 dark:text-gray-400 font-semibold">Category</Label>
                                <Select value={option.category} onValueChange={(v) => handleCategoryChange(option.id, v)}>
                                  <SelectTrigger className="bg-white dark:bg-black/30 border-slate-300/60 dark:border-white/10 h-9 text-xs text-slate-900 dark:text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-obsidian-dark border-slate-300/60 dark:border-white/10 text-zinc-300">
                                    {manualCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Linked Item Dropdown for Flight, Hotel, Transport, Activity */}
                              {["Flight", "Hotel", "Transport", "Activity"].includes(option.category) && (
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] uppercase tracking-wider text-primary font-semibold flex items-center gap-1">
                                    <Link className="w-3 h-3" /> Select Added {option.category}
                                  </Label>
                                  <Select
                                    value={option.linkedItemId || "unlinked"}
                                    onValueChange={(v) => handleLinkItem(option.id, option.category, v)}
                                  >
                                    <SelectTrigger className={`h-9 text-xs text-slate-900 dark:text-white ${isLinked ? "bg-white dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 font-medium" : "bg-white dark:bg-black/20 border-slate-300/60 dark:border-white/10"}`}>
                                      <SelectValue placeholder={`Choose ${option.category}...`} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-obsidian-dark border-slate-300/60 dark:border-white/10 text-zinc-200 max-h-56">
                                      <SelectItem value="unlinked">
                                        <span className="text-slate-600 dark:text-gray-400 italic">Manual Entry (Unlinked)</span>
                                      </SelectItem>

                                      {option.category === "Flight" && (flights || []).map((f) => (
                                        <SelectItem key={f.id} value={f.id}>
                                          ✈️ {f.airline || "Flight"} {f.flightNumber || ""} ({f.departureAirport || "DEP"} → {f.arrivalAirport || "ARR"})
                                        </SelectItem>
                                      ))}

                                      {option.category === "Hotel" && (hotels || []).map((h) => (
                                        <SelectItem key={h.id} value={h.id}>
                                          🏨 {h.name || "Hotel"}{h.nights ? ` (${h.nights} Nights)` : ""}
                                        </SelectItem>
                                      ))}

                                      {option.category === "Transport" && (
                                        <>
                                          {(cabs || []).map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                              🚕 Cab: {c.vehicleType || "Vehicle"}{c.route ? ` (${c.route})` : ""}
                                            </SelectItem>
                                          ))}
                                          {(buses || []).map((b) => (
                                            <SelectItem key={b.id} value={b.id}>
                                              🚌 Bus: {b.busType || "Bus"}{b.route ? ` (${b.route})` : ""}
                                            </SelectItem>
                                          ))}
                                        </>
                                      )}

                                      {option.category === "Activity" && (availableActivities || []).map((act) => (
                                        <SelectItem key={act.id} value={act.id}>
                                          🎯 {act.name} {act.cost > 0 ? `(${currencySymbol}${act.cost})` : ''}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>

                            {/* Row 2: Service Name, Pricing Type, Base Amount */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {/* Service Name */}
                              <div className="sm:col-span-1 space-y-1.5">
                                <Label className={`text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1 ${isLinked ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-gray-400"}`}>
                                  {isLinked && <Lock className="w-2.5 h-2.5" />}
                                  Service Name {isLinked ? "(Derived)" : ""}
                                </Label>
                                {isLinked ? (
                                  <div className="h-9 px-3 bg-white dark:bg-slate-950/70 border border-emerald-500/30 rounded-md flex items-center justify-between text-xs text-emerald-950 dark:text-emerald-100 shadow-sm font-medium truncate select-none">
                                    <span className="truncate flex items-center gap-1.5">
                                      {getCategoryIcon(option.category)}
                                      <span className="text-slate-900 dark:text-white font-semibold">{option.name}</span>
                                    </span>
                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0 ml-1">
                                      Synced
                                    </span>
                                  </div>
                                ) : (
                                  <Input 
                                    value={option.name} 
                                    onChange={(e) => updateManualOption(option.id, "name", e.target.value)}
                                    className="bg-white dark:bg-black/20 border-slate-300/60 dark:border-white/5 h-9 text-xs text-slate-900 dark:text-white"
                                    placeholder="e.g. Visa Fee / Flight Ticket"
                                  />
                                )}
                              </div>

                              {/* Pricing Type */}
                              <div className="space-y-1.5">
                                <Label className={`text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1 ${isLinked ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-gray-400"}`}>
                                  {isLinked && <Lock className="w-2.5 h-2.5" />}
                                  Pricing Type
                                </Label>
                                {isLinked ? (
                                  <div className="h-9 px-3 bg-white dark:bg-slate-950/70 border border-emerald-500/30 rounded-md flex items-center justify-between text-xs text-emerald-950 dark:text-emerald-100 shadow-sm font-medium select-none">
                                    <span className="capitalize text-slate-900 dark:text-white font-semibold">
                                      {option.type === "per-person" ? "Per Person" : "Total Flat"}
                                    </span>
                                    <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400/60 shrink-0" />
                                  </div>
                                ) : (
                                  <Select value={option.type} onValueChange={(v) => updateManualOption(option.id, "type", v)}>
                                    <SelectTrigger className="bg-white dark:bg-black/20 border-slate-300/60 dark:border-white/5 h-9 text-xs text-slate-900 dark:text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-obsidian-dark border-slate-300/60 dark:border-white/5 text-zinc-300">
                                      <SelectItem value="per-person">Per Person</SelectItem>
                                      <SelectItem value="total">Total Flat</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>

                              {/* Base Cost */}
                              <div className="space-y-1.5">
                                <Label className={`text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1 ${isLinked ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-gray-400"}`}>
                                  {isLinked && <Lock className="w-2.5 h-2.5" />}
                                  Base Cost ({currencySymbol}) {isLinked ? "(Derived)" : ""}
                                </Label>
                                {isLinked ? (
                                  <div className="h-9 px-3 bg-white dark:bg-emerald-950/50 border border-emerald-500/30 rounded-md flex items-center justify-between text-xs font-mono font-bold text-emerald-900 dark:text-emerald-300 shadow-sm select-none">
                                    <span>{formatMoney(option.amount, pricing.currency)}</span>
                                    <div className="flex items-center gap-1 text-[9px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded uppercase font-sans font-semibold">
                                      <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" /> Auto
                                    </div>
                                  </div>
                                ) : (
                                  <Input 
                                    type="number"
                                    value={option.amount} 
                                    onChange={(e) => updateManualOption(option.id, "amount", Number(e.target.value))}
                                    className="bg-white dark:bg-black/20 border-slate-300/60 dark:border-white/5 h-9 text-xs text-slate-900 dark:text-white font-mono"
                                    placeholder="0"
                                  />
                                )}
                              </div>
                            </div>

                            {/* Row 3: Per-Item Markup & Tax Controls */}
                            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t ${isLinked ? "border-emerald-500/15" : "border-white/[0.04]"}`}>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-wider text-primary font-semibold">Item Markup Type</Label>
                                <Select 
                                  value={option.markupType || "percentage"} 
                                  onValueChange={(v) => updateManualOption(option.id, "markupType", v)}
                                >
                                  <SelectTrigger className="bg-white dark:bg-black/20 border-slate-300/60 dark:border-white/5 h-9 text-xs text-slate-900 dark:text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-obsidian-dark border-slate-300/60 dark:border-white/5 text-zinc-300">
                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                    <SelectItem value="flat">Flat Amount ({currencySymbol})</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                                  Markup Value ({option.markupType === "flat" ? currencySymbol : "%"})
                                </Label>
                                <Input 
                                  type="number"
                                  value={typeof option.markupValue === "number" ? option.markupValue : (pricing.markupValue ?? 15)} 
                                  onChange={(e) => updateManualOption(option.id, "markupValue", Number(e.target.value))}
                                  className="bg-white dark:bg-black/20 border-slate-300/60 dark:border-white/5 h-9 text-xs text-slate-900 dark:text-white font-mono"
                                  placeholder="15"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-wider text-sky-400 font-semibold">
                                  Item Tax / GST (%)
                                </Label>
                                <Input 
                                  type="number"
                                  value={typeof option.taxPercentage === "number" ? option.taxPercentage : 0} 
                                  onChange={(e) => updateManualOption(option.id, "taxPercentage", Number(e.target.value))}
                                  className="bg-white dark:bg-black/20 border-slate-300/60 dark:border-white/5 h-9 text-xs text-slate-900 dark:text-white font-mono"
                                  placeholder="0"
                                />
                              </div>
                            </div>

                            {/* Row 4: Live Item Cost & Subtotal calculation breakdown */}
                            {(() => {
                              const adultPax = pricing.adultPax || 1;
                              const childPax = pricing.childPax || 0;
                              const infantPax = pricing.infantPax || 0;
                              const totalPax = adultPax + childPax + infantPax;

                              // For linked items, resolve the actual linked item for precise cost calculation
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

                              // Build per-pax breakdown label for linked per-person items
                              const showPaxBreakdown = linkedItem && linkedItem.costType !== "flat";
                              const nights = linkedItem?.nights || 1;
                              const adultCostEach = linkedItem ? (linkedItem.costAdult || 0) * nights : 0;
                              const childCostEach = linkedItem ? (linkedItem.costChild || 0) * nights : 0;
                              const infantCostEach = linkedItem ? (linkedItem.costInfant || 0) * nights : 0;

                              return (
                                <div className={`space-y-1.5 rounded-lg border font-mono text-[11px] overflow-hidden ${
                                  isLinked ? "border-emerald-500/30" : "border-slate-300/60 dark:border-white/5"
                                }`}>
                                  {showPaxBreakdown && (
                                    <div className={`px-3 py-2 space-y-1 ${ isLinked ? "bg-white/80 dark:bg-emerald-950/20" : "bg-white dark:bg-black/30" }`}>
                                      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-sans font-semibold mb-1">Pax Cost Breakdown</div>
                                      {adultPax > 0 && (
                                        <div className="flex justify-between text-gray-300">
                                          <span className="text-slate-600 dark:text-gray-400">Adults: <span className="text-slate-900 dark:text-white">{adultPax}</span> × {formatMoney(adultCostEach, pricing.currency)}</span>
                                          <span className="text-emerald-700 dark:text-emerald-300 font-bold">{formatMoney(adultCostEach * adultPax, pricing.currency)}</span>
                                        </div>
                                      )}
                                      {childPax > 0 && (
                                        <div className="flex justify-between text-gray-300">
                                          <span className="text-slate-600 dark:text-gray-400">Children: <span className="text-slate-900 dark:text-white">{childPax}</span> × {formatMoney(childCostEach, pricing.currency)}</span>
                                          <span className="text-amber-300 font-bold">{formatMoney(childCostEach * childPax, pricing.currency)}</span>
                                        </div>
                                      )}
                                      {infantPax > 0 && (
                                        <div className="flex justify-between text-gray-300">
                                          <span className="text-slate-600 dark:text-gray-400">Infants: <span className="text-slate-900 dark:text-white">{infantPax}</span> × {formatMoney(infantCostEach, pricing.currency)}</span>
                                          <span className="text-sky-300 font-bold">{formatMoney(infantCostEach * infantPax, pricing.currency)}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <div className={`flex flex-wrap items-center justify-between px-3 py-2 gap-2 ${
                                    isLinked ? "bg-emerald-100/60 dark:bg-emerald-950/40 text-slate-900 dark:text-zinc-200" : "bg-slate-200/50 dark:bg-black/40 text-slate-900 dark:text-zinc-200"
                                  }`}>
                                    <span className="text-slate-600 dark:text-gray-400">
                                      Base: <strong className={isLinked ? "text-emerald-700 dark:text-emerald-300" : "text-slate-900 dark:text-white"}>{formatMoney(baseVal, pricing.currency)}</strong>
                                    </span>
                                    <span className="text-primary font-medium">
                                      + Markup ({mType === "percentage" ? `${mVal}%` : formatMoney(mVal, pricing.currency)}): +{formatMoney(markupVal, pricing.currency)}
                                    </span>
                                    <span className="text-sky-400 font-medium">
                                      + Tax ({taxPct}%): +{formatMoney(taxVal, pricing.currency)}
                                    </span>
                                    <span className="text-slate-900 dark:text-white font-bold bg-primary/20 border border-primary/30 px-2 py-0.5 rounded text-xs">
                                      Subtotal: {formatMoney(subtotal, pricing.currency)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="space-y-6">
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
                              <span className="text-slate-600 dark:text-gray-400">👤 {adultPax} Adult{adultPax > 1 ? "s" : ""}</span>
                              <span className="font-mono text-slate-900 dark:text-white font-semibold">{formatMoney(totalAdultCost, pricing.currency)}</span>
                            </div>
                          )}
                          {childPax > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 dark:text-gray-400">🧒 {childPax} Child{childPax > 1 ? "ren" : ""}</span>
                              <span className="font-mono text-amber-300 font-semibold">{formatMoney(totalChildCost, pricing.currency)}</span>
                            </div>
                          )}
                          {infantPax > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 dark:text-gray-400">👶 {infantPax} Infant{infantPax > 1 ? "s" : ""}</span>
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
