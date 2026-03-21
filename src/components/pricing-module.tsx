"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Wallet, Settings, AlertCircle } from "lucide-react";
import { type Currency, type PaymentMilestone, type PricingTier } from "@/types/pricing";

// Store hooks — replaces all props
import { useItinerary } from "@/hooks/use-itinerary";
import { useItineraryPricing } from "@/hooks/use-itinerary-pricing";

// ── Currency list ──────────────────────────────────────────────────────────────

const currencies: { value: Currency; label: string }[] = [
  { value: "INR", label: "Indian Rupee (INR)" },
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "AUD", label: "Australian Dollar (AUD)" },
  { value: "CAD", label: "Canadian Dollar (CAD)" },
  { value: "SGD", label: "Singapore Dollar (SGD)" },
  { value: "AED", label: "UAE Dirham (AED)" },
];

// ── Component (zero props — reads everything from store) ───────────────────────

export default function PricingModule() {
  // Store
  const { pricing, validationErrors, updatePricing } = useItinerary();

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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Card className="glass-card overflow-hidden ai-architect-page-card">
      <CardHeader className="bg-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-400" />
          <CardTitle className="text-xl">Costing &amp; Pricing Module</CardTitle>
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
              <SelectTrigger>
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
              onChange={(e) => updatePricing({ adultPax: Number(e.target.value) })}
              min={1}
            />
          </div>
          <div className="space-y-2">
            <Label>Children</Label>
            <Input
              type="number"
              value={pricing.childPax}
              onChange={(e) => updatePricing({ childPax: Number(e.target.value) })}
              min={0}
            />
          </div>
          <div className="space-y-2">
            <Label>Infants</Label>
            <Input
              type="number"
              value={pricing.infantPax}
              onChange={(e) => updatePricing({ infantPax: Number(e.target.value) })}
              min={0}
            />
          </div>
        </div>

        {/* Middle Row: Margins & Tax + Live Summary */}
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
                <SelectTrigger className="w-[120px]">
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
                  className="pl-8"
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
                  className="pl-8"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
              </div>
            </div>
          </div>

          {/* Live Costing Summary — all values from calculation engine */}
          <div className="space-y-2 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 text-sm">
            <div className="text-emerald-400 font-semibold mb-2">Live Costing Summary</div>
            <div className="flex justify-between text-gray-400">
              <span>Base Cost (Activities + Hotels + Flights)</span>
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
            <div className="pt-2 mt-2 border-t border-emerald-500/20 flex justify-between font-bold text-white text-base">
              <span>Total Client Quote</span>
              <span>{currencySymbol}{finalTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Payment Milestones */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-lg">Payment Schedule</h4>
            <Button variant="outline" size="sm" onClick={addMilestone} className="gap-2">
              <Plus className="w-4 h-4" /> Add Milestone
            </Button>
          </div>

          <div className="space-y-3">
            {milestoneAmounts.map((milestone, idx) => (
              <div
                key={milestone.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-gray-500">Name</Label>
                    <Input
                      value={milestone.name}
                      onChange={(e) => updateMilestone(milestone.id, "name", e.target.value)}
                      placeholder="e.g. Booking Advance"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-gray-500">Percentage (%)</Label>
                    <Input
                      type="number"
                      value={milestone.percentage}
                      onChange={(e) => updateMilestone(milestone.id, "percentage", Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-gray-500">Due Date / Timeline</Label>
                    <Input
                      value={milestone.dueDate}
                      onChange={(e) => updateMilestone(milestone.id, "dueDate", e.target.value)}
                      placeholder="e.g. 15 days before"
                    />
                  </div>
                </div>

                {/* Milestone amount — reactive from engine */}
                <div className="pt-5">
                  <div className="text-emerald-400 font-semibold text-sm w-24 text-right">
                    {currencySymbol}{milestone.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
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
