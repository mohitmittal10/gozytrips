"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Wallet, Settings, AlertCircle, Minimize2, Maximize2 } from "lucide-react";
import { type Currency, type PaymentMilestone, type PricingTier, type ManualCostItem, type PricingConfig } from "@/types/pricing";

// Store hooks — replaces all props
import { useItinerary } from "@/hooks/use-itinerary";
import { useItineraryPricing } from "@/hooks/use-itinerary-pricing";
import { debounce } from "@/lib/utils";
import { formatMoney } from "@/lib/utils/currency";
import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

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

// Dynamic options fetched in component

// ── Component (zero props — reads everything from store) ───────────────────────

export default function PricingModule({ onSave, isSaving }: { onSave?: (p?: PricingConfig) => void, isSaving?: boolean }) {
  // Store
  const { pricing, validationErrors, updatePricing } = useItinerary();
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
          category: manualCategories[0] || "Activity"
        }
      ]
    });
  };

  const updateManualOption = (id: string, field: keyof ManualCostItem, value: any) => {
    updatePricing({
      manualOptions: pricing.manualOptions.map((o) => (o.id === id ? { ...o, [field]: value } : o)),
    });
  };

  const removeManualOption = (id: string) => {
    updatePricing({
      manualOptions: pricing.manualOptions.filter((o) => o.id !== id),
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-300">
      <style>{`
        @keyframes slideFromRight { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }
      `}</style>
      {/* Tab bar / Header block */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 mb-6 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-none">Trip Costing Builder</p>
              <p className="text-[11px] text-foreground/40 mt-0.5 leading-none">Configure currency, margins, taxes, and payment schedules.</p>
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
        className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
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
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Itemized Costs Summary</h4>
                  
                  {pricing.manualOptions.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No manual cost items added.</p>
                  ) : (
                    <div className="space-y-3">
                      {pricing.manualOptions.map((opt) => (
                        <div key={opt.id} className="flex justify-between items-center text-sm border-b border-white/[0.02] pb-1.5">
                          <div>
                            <span className="font-medium text-white">{opt.name}</span>
                            <span className="text-[10px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded ml-2 uppercase">{opt.category}</span>
                          </div>
                          <span className="text-gray-300 font-mono">
                            {opt.type === "per-person" ? `${formatMoney(opt.amount, pricing.currency)} × ${(pricing.adultPax + pricing.childPax + pricing.infantPax)}` : formatMoney(opt.amount, pricing.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Milestones schedule */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Payment Milestones</h4>
                  {milestoneAmounts.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No payment milestones defined.</p>
                  ) : (
                    <div className="space-y-3">
                      {milestoneAmounts.map((m) => (
                        <div key={m.id} className="flex justify-between items-center text-sm">
                          <div>
                            <span className="font-semibold text-white">{m.name}</span>
                            <span className="text-xs text-gray-400 ml-2">({m.percentage}%)</span>
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
                  <div className="flex justify-between text-gray-400">
                    <span>Base Cost</span>
                    <span className="font-mono">{formatMoney(baseCost, pricing.currency)}</span>
                  </div>
                  <div className="flex justify-between text-primary">
                    <span>Markup ({pricing.markupValue}%)</span>
                    <span className="font-mono">+{formatMoney(markupAmount, pricing.currency)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Tax ({pricing.taxPercentage}%)</span>
                    <span className="font-mono">+{formatMoney(taxAmount, pricing.currency)}</span>
                  </div>
                  <div className="pt-3 mt-2 border-t border-primary/20 flex justify-between font-extrabold text-white text-xl">
                    <span>Total Quote</span>
                    <span className="text-primary font-mono">{formatMoney(finalTotal, pricing.currency)}</span>
                  </div>
                </div>

                {/* Pax information card */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 text-xs space-y-2 text-gray-400">
                  <div className="font-semibold text-white uppercase text-[10px] tracking-wider mb-2">Pax Composition</div>
                  <div className="flex justify-between">
                    <span>Adults:</span>
                    <span className="text-white font-bold">{pricing.adultPax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Children:</span>
                    <span className="text-white font-bold">{pricing.childPax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Infants:</span>
                    <span className="text-white font-bold">{pricing.infantPax}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Full Edit Form */
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Top Row: Currency & Pax */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={pricing.currency}
                    onValueChange={(v: Currency) => updatePricing({ currency: v })}
                  >
                    <SelectTrigger className="bg-black/20 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Adults</Label>
                  <Input
                    type="number"
                    value={pricing.adultPax}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      updatePricing({ adultPax: val });
                    }}
                    min={1}
                    className="bg-black/20 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Children</Label>
                  <Input
                    type="number"
                    value={pricing.childPax}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      updatePricing({ childPax: val });
                    }}
                    min={0}
                    className="bg-black/20 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Infants</Label>
                  <Input
                    type="number"
                    value={pricing.infantPax}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      updatePricing({ infantPax: val });
                    }}
                    min={0}
                    className="bg-black/20 border-white/10"
                  />
                </div>
              </div>

              {/* Costing Items Builder */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <Settings className="w-4 h-4" />
                      Itemized Trip Costs
                    </div>
                    <Button variant="outline" size="sm" onClick={addManualOption} className="gap-2 h-8 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary">
                      <Plus className="w-4 h-4" /> Add Item
                    </Button>
                  </div>
                  
                  <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                    {pricing.manualOptions.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-white/10 rounded-xl bg-white/5 text-gray-500 text-sm">
                        No cost items added yet. Click "Add Item" to begin.
                      </div>
                    ) : (
                      pricing.manualOptions.map((option, idx) => (
                        <div key={option.id} className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3 relative group">
                          {/* Header row */}
                          <div className="flex items-center justify-between border-b border-white/[0.05] pb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-primary/10 rounded text-primary">
                                <Settings className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-semibold text-white">Item #{idx + 1}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeManualOption(option.id)}
                              className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>

                          {/* Inputs Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="col-span-3 space-y-1.5">
                              <Label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Service Name</Label>
                              <Input 
                                value={option.name} 
                                onChange={(e) => updateManualOption(option.id, "name", e.target.value)}
                                className="bg-black/20 border-white/5 h-9 text-sm text-white"
                                placeholder="e.g. Visa Fee / Tour Guide"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Category</Label>
                              <Select value={option.category} onValueChange={(v) => updateManualOption(option.id, "category", v)}>
                                <SelectTrigger className="bg-black/20 border-white/5 h-9 text-xs text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-obsidian-dark border-white/5 text-zinc-300">
                                  {manualCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Type</Label>
                              <Select value={option.type} onValueChange={(v) => updateManualOption(option.id, "type", v)}>
                                <SelectTrigger className="bg-black/20 border-white/5 h-9 text-xs text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-obsidian-dark border-white/5 text-zinc-300">
                                  <SelectItem value="per-person">Per Person</SelectItem>
                                  <SelectItem value="total">Total Flat</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Amount ({currencySymbol})</Label>
                              <Input 
                                type="number"
                                value={option.amount} 
                                onChange={(e) => updateManualOption(option.id, "amount", Number(e.target.value))}
                                className="bg-black/20 border-white/5 h-9 text-sm text-white font-mono"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4 p-4 rounded-xl border border-white/10 bg-black/20">
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <Wallet className="w-4 h-4" />
                      Adjustments
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400">Markup / Service Fee (%)</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={pricing.markupValue}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updatePricing({ markupValue: val });
                          }}
                          className="pl-8 bg-black/20 border-white/10"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{pricing.markupType === 'percentage' ? '%' : currencySymbol}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400">Final Tax / GST (%)</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={pricing.taxPercentage}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updatePricing({ taxPercentage: val });
                          }}
                          className="pl-8 bg-black/20 border-white/10"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Costing Summary — Primary Orange Theme */}
                  <div className="space-y-2 bg-primary/10 p-4 rounded-xl border border-primary/20 text-sm">
                    <div className="text-primary font-semibold mb-3">
                      <span>Costing Summary</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Base Cost</span>
                      <span>{formatMoney(baseCost, pricing.currency)}</span>
                    </div>
                    <div className="flex justify-between text-primary">
                      <span>Markup</span>
                      <span>+{formatMoney(markupAmount, pricing.currency)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Tax</span>
                      <span>+{formatMoney(taxAmount, pricing.currency)}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-primary/20 flex justify-between font-bold text-white text-lg">
                      <span>Total Client Quote</span>
                      <span>{formatMoney(finalTotal, pricing.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Milestones */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    Payment Schedule
                  </h4>
                  <Button variant="outline" size="sm" onClick={addMilestone} className="gap-2 bg-white/5 border-white/10 hover:bg-white/10">
                    <Plus className="w-4 h-4" /> Add Milestone
                  </Button>
                </div>

                <div className="space-y-3">
                  {milestoneAmounts.map((milestone, idx) => (
                    <div
                      key={milestone.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-black/20"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-gray-500">Name</Label>
                          <Input
                            value={milestone.name}
                            onChange={(e) => updateMilestone(milestone.id, "name", e.target.value)}
                            placeholder="e.g. Booking Advance"
                            className="bg-black/20 border-white/5"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-gray-500">Percentage (%)</Label>
                          <Input
                            type="number"
                            value={milestone.percentage}
                            onChange={(e) => updateMilestone(milestone.id, "percentage", Number(e.target.value))}
                            className="bg-black/20 border-white/5"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-gray-500">Due Date / Timeline</Label>
                          <Input
                            value={milestone.dueDate}
                            onChange={(e) => updateMilestone(milestone.id, "dueDate", e.target.value)}
                            placeholder="e.g. 15 days before"
                            className="bg-black/20 border-white/5"
                          />
                        </div>
                      </div>

                      {/* Milestone amount — reactive from engine */}
                      <div className="pt-5">
                        <div className="text-primary font-bold text-base w-32 text-right">
                          {formatMoney(milestone.amount, pricing.currency)}
                        </div>
                      </div>

                      <div className="pt-5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMilestone(milestone.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
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

