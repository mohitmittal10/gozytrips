"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Wallet, Settings, AlertCircle, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { type Currency, type PaymentMilestone, type PricingTier, type ManualCostItem, type PricingConfig } from "@/types/pricing";

// Store hooks — replaces all props
import { useItinerary } from "@/hooks/use-itinerary";
import { useItineraryPricing } from "@/hooks/use-itinerary-pricing";
import { debounce } from "@/lib/utils";
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

// Dynamic options fetched in component

// ── Component (zero props — reads everything from store) ───────────────────────

export default function PricingModule({ onSave, isSaving }: { onSave?: (p?: PricingConfig) => void, isSaving?: boolean }) {
  // Store
  const { pricing, validationErrors, updatePricing } = useItinerary();
  const supabase = useMemo(() => createClient(), []);
  const [referenceOptions, setReferenceOptions] = useState<any[]>([]);

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

  // ── Debounced Updates ──────────────────────────────────────────────────────
  
  const debouncedUpdatePricing = React.useMemo(
    () => debounce((updates: Partial<PricingConfig>) => updatePricing(updates), 500),
    [updatePricing]
  );

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
    <Card className="glass-card overflow-hidden ai-architect-page-card">
      <CardHeader className="bg-white/5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <CardTitle className="text-xl">Costing &amp; Pricing Module</CardTitle>
          </div>
          <Tabs 
            value={pricing.costingType} 
            onValueChange={(v: any) => updatePricing({ costingType: v })}
            className="w-[300px]"
          >
            <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/10 h-9 p-0.5">
              <TabsTrigger value="automatic" className="text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">Automatic AI</TabsTrigger>
              <TabsTrigger value="manual" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">Manual Agent</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardDescription>
          Configure currency, margins, taxes, and payment schedules. This information is internal unless explicitly shared with the client.
        </CardDescription>

        {/* Validation warnings */}
        {validationErrors.length > 0 && (
          <div className="mt-3 flex items-start gap-2 text-xs text-amber-400 bg-amber-400/10 rounded-lg px-3 py-2 border border-amber-400/20">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <div>
              {validationErrors.map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-6 space-y-8">
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
                debouncedUpdatePricing({ adultPax: val });
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
                debouncedUpdatePricing({ childPax: val });
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
                debouncedUpdatePricing({ infantPax: val });
              }}
              min={0}
              className="bg-black/20 border-white/10"
            />
          </div>
        </div>

        {/* Middle Row: Logic Switch */}
        {pricing.costingType === 'automatic' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl border border-white/10 bg-black/20">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-medium">
                <Settings className="w-4 h-4" />
                Agent Markup
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={pricing.markupType}
                  onValueChange={(v: "percentage" | "flat") => updatePricing({ markupType: v })}
                >
                  <SelectTrigger className="w-[120px] bg-black/20 border-white/10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="flat">Flat Fee</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={pricing.markupValue}
                    onChange={(e) => updatePricing({ markupValue: Number(e.target.value) })}
                    className="pl-8 bg-black/20 border-white/10"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    {pricing.markupType === "percentage" ? "%" : currencySymbol}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-medium">
                <Wallet className="w-4 h-4" />
                Taxation
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-gray-400">Tax / GST / VAT (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={pricing.taxPercentage}
                    onChange={(e) => updatePricing({ taxPercentage: Number(e.target.value) })}
                    className="pl-8 bg-black/20 border-white/10"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                </div>
              </div>
            </div>

            {/* Live Costing Summary — all values from calculation engine */}
            <div className="space-y-2 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 text-sm">
              <div className="text-emerald-400 font-semibold mb-2">Live Costing Summary</div>
              <div className="flex justify-between text-gray-400">
                <span>Base Cost (Automatic)</span>
                <span>{currencySymbol}{baseCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Your Profit Margin</span>
                <span>+{currencySymbol}{markupAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Tax</span>
                <span>+{currencySymbol}{taxAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-emerald-500/20 flex justify-between font-bold text-white text-base mb-4">
                <span>Total Client Quote</span>
                <span>{currencySymbol}{finalTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              
              {onSave && (
                <Button 
                  onClick={() => onSave?.(pricing)} 
                  disabled={isSaving}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] h-12"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Updating Global Costing..." : "Update & Save Global Costing"}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-amber-400 font-medium">
                   <Settings className="w-4 h-4" />
                   Manual Costing Options
                 </div>
                 <Button variant="outline" size="sm" onClick={addManualOption} className="gap-2 h-8 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400">
                    <Plus className="w-4 h-4" /> Add Item
                 </Button>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {pricing.manualOptions.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-white/10 rounded-xl bg-white/5 text-gray-500 text-sm">
                    No manual cost items added yet. Click "Add Item" to begin.
                  </div>
                ) : (
                  pricing.manualOptions.map((option) => (
                    <div key={option.id} className="grid grid-cols-12 gap-3 p-3 rounded-xl border border-white/10 bg-white/5 items-end">
                      <div className="col-span-4 space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-wider text-gray-500">Service Name</Label>
                        <Input 
                          value={option.name} 
                          onChange={(e) => updateManualOption(option.id, "name", e.target.value)}
                          className="bg-black/20 border-white/5 h-9"
                          placeholder="e.g. Visa Fee"
                        />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-wider text-gray-500">Category</Label>
                        <Select value={option.category} onValueChange={(v) => updateManualOption(option.id, "category", v)}>
                           <SelectTrigger className="bg-black/20 border-white/5 h-9 text-xs">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              {manualCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                           </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-wider text-gray-500">Type</Label>
                        <Select value={option.type} onValueChange={(v) => updateManualOption(option.id, "type", v)}>
                           <SelectTrigger className="bg-black/20 border-white/5 h-9 text-xs">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="per-person">Per Person</SelectItem>
                              <SelectItem value="total">Total Flat</SelectItem>
                           </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3 space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-wider text-gray-500">Amount ({currencySymbol})</Label>
                        <Input 
                          type="number"
                          value={option.amount} 
                          onChange={(e) => updateManualOption(option.id, "amount", Number(e.target.value))}
                          className="bg-black/20 border-white/5 h-9"
                        />
                      </div>
                      <div className="col-span-1 pb-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeManualOption(option.id)}
                          className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-4 p-4 rounded-xl border border-white/10 bg-black/20">
                  <div className="flex items-center gap-2 text-amber-400 font-medium">
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
                       debouncedUpdatePricing({ markupValue: val });
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
                       debouncedUpdatePricing({ taxPercentage: val });
                     }}
                        className="pl-8 bg-black/20 border-white/10"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                    </div>
                  </div>
               </div>

               {/* Live Costing Summary — Manual Mode */}
               <div className="space-y-2 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 text-sm">
                  <div className="text-amber-400 font-semibold mb-3 flex items-center justify-between">
                    <span>Manual Summary</span>
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">Agent Override</Badge>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Manual Base Cost</span>
                    <span>{currencySymbol}{baseCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-amber-400">
                    <span>Total Markup</span>
                    <span>+{currencySymbol}{markupAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Final Tax</span>
                    <span>+{currencySymbol}{taxAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-amber-500/20 flex justify-between font-bold text-white text-lg mb-4">
                    <span>Quote Total</span>
                    <span>{currencySymbol}{finalTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>

                  {onSave && (
                    <Button 
                      onClick={() => onSave?.(pricing)} 
                      disabled={isSaving}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] h-12"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? "Updating Global Costing..." : "Update & Save Global Costing"}
                    </Button>
                  )}
               </div>
            </div>
          </div>
        )}

        {/* Payment Milestones */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
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
                  <div className="text-emerald-400 font-bold text-base w-32 text-right">
                    {currencySymbol}{milestone.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
      </CardContent>
    </Card>
  );
}
