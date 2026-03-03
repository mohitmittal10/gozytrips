"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Wallet, Settings, Calculator } from "lucide-react";
import {
    type PricingConfig,
    type Currency,
    type PaymentMilestone,
    type PricingTier,
    defaultPricingConfig
} from "@/types/pricing";
import { cn } from "@/lib/utils";

interface PricingModuleProps {
    pricing: PricingConfig | undefined;
    onChange: (pricing: PricingConfig) => void;
    baseCost: number; // Calculated from activities, hotels, flights
}

const currencies: { value: Currency; label: string; symbol: string }[] = [
    { value: "INR", label: "Indian Rupee (INR)", symbol: "₹" },
    { value: "USD", label: "US Dollar (USD)", symbol: "$" },
    { value: "EUR", label: "Euro (EUR)", symbol: "€" },
    { value: "GBP", label: "British Pound (GBP)", symbol: "£" },
    { value: "AUD", label: "Australian Dollar (AUD)", symbol: "A$" },
    { value: "CAD", label: "Canadian Dollar (CAD)", symbol: "C$" },
    { value: "SGD", label: "Singapore Dollar (SGD)", symbol: "S$" },
    { value: "AED", label: "UAE Dirham (AED)", symbol: "AED" },
];

export default function PricingModule({ pricing, onChange, baseCost }: PricingModuleProps) {
    const config = pricing || defaultPricingConfig;
    const currencySymbol = currencies.find(c => c.value === config.currency)?.symbol || "₹";

    const updateConfig = (updates: Partial<PricingConfig>) => {
        onChange({ ...config, ...updates });
    };

    const addMilestone = () => {
        updateConfig({
            milestones: [
                ...config.milestones,
                { id: Math.random().toString(), name: "New Milestone", percentage: 0, dueDate: "TBD" }
            ]
        });
    };

    const updateMilestone = (id: string, field: keyof PaymentMilestone, value: string | number) => {
        updateConfig({
            milestones: config.milestones.map(m => m.id === id ? { ...m, [field]: value } : m)
        });
    };

    const removeMilestone = (id: string) => {
        updateConfig({
            milestones: config.milestones.filter(m => m.id !== id)
        });
    };

    // Calculations
    const markupAmount = config.markupType === "percentage"
        ? (baseCost * config.markupValue) / 100
        : config.markupValue;

    const costWithMarkup = baseCost + markupAmount;
    const taxAmount = (costWithMarkup * config.taxPercentage) / 100;
    const finalTotal = costWithMarkup + taxAmount;

    return (
        <Card className="glass-card mt-8 overflow-hidden ai-architect-page-card">
            <CardHeader className="bg-white/5 pb-4">
                <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                    <CardTitle className="text-xl">Costing & Pricing Module</CardTitle>
                </div>
                <CardDescription>
                    Configure currency, margins, taxes, and payment schedules. This information is internal unless explicitly shared with the client.
                </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-8">
                {/* Top Row: Currency & Pax */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select value={config.currency} onValueChange={(v: Currency) => updateConfig({ currency: v })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {currencies.map(c => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Adults</Label>
                        <Input
                            type="number"
                            value={config.adultPax}
                            onChange={e => updateConfig({ adultPax: Number(e.target.value) })}
                            min={1}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Children</Label>
                        <Input
                            type="number"
                            value={config.childPax}
                            onChange={e => updateConfig({ childPax: Number(e.target.value) })}
                            min={0}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Infants</Label>
                        <Input
                            type="number"
                            value={config.infantPax}
                            onChange={e => updateConfig({ infantPax: Number(e.target.value) })}
                            min={0}
                        />
                    </div>
                </div>

                {/* Middle Row: Margins & Tax */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl border border-white/10 bg-black/20">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-medium">
                            <Settings className="w-4 h-4" />
                            Agent Markup
                        </div>
                        <div className="flex items-center gap-3">
                            <Select value={config.markupType} onValueChange={(v: "percentage" | "flat") => updateConfig({ markupType: v })}>
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
                                    value={config.markupValue}
                                    onChange={e => updateConfig({ markupValue: Number(e.target.value) })}
                                    className="pl-8"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                    {config.markupType === 'percentage' ? '%' : currencySymbol}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-medium">
                            <Calculator className="w-4 h-4" />
                            Taxation
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-400">Tax/GST/VAT (%)</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={config.taxPercentage}
                                    onChange={e => updateConfig({ taxPercentage: Number(e.target.value) })}
                                    className="pl-8"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Hidden Margin Calculator */}
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
                        {config.milestones.map((milestone, idx) => (
                            <div key={milestone.id} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase tracking-wider text-gray-500">Name</Label>
                                        <Input
                                            value={milestone.name}
                                            onChange={e => updateMilestone(milestone.id, 'name', e.target.value)}
                                            placeholder="e.g. Booking Advance"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase tracking-wider text-gray-500">Percentage (%)</Label>
                                        <Input
                                            type="number"
                                            value={milestone.percentage}
                                            onChange={e => updateMilestone(milestone.id, 'percentage', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase tracking-wider text-gray-500">Due Date / Timeline</Label>
                                        <Input
                                            value={milestone.dueDate}
                                            onChange={e => updateMilestone(milestone.id, 'dueDate', e.target.value)}
                                            placeholder="e.g. 15 days before"
                                        />
                                    </div>
                                </div>
                                <div className="pt-5">
                                    <div className="text-emerald-400 font-semibold text-sm w-24 text-right">
                                        {currencySymbol}{((finalTotal * milestone.percentage) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="pt-5">
                                    <Button variant="ghost" size="icon" onClick={() => removeMilestone(milestone.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
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
