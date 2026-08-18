"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Search, Percent, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripFinancial } from "@/types/financial";
import type { Currency } from "@/types/pricing";

interface CommissionsTabProps {
    financials: TripFinancial[];
    commissionRate: number;
    totalCommission: number;
    cs: (currency?: Currency) => string;
    fm: (amount: number | string, currency?: Currency) => string;
    onRateChange: (rate: number) => void;
    updateFinancial: (itineraryId: string, updates: Partial<TripFinancial>) => Promise<void>;
}

export function CommissionsTab({
    financials,
    commissionRate,
    totalCommission,
    cs,
    fm,
    onRateChange,
    updateFinancial,
}: CommissionsTabProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredFinancials = useMemo(() => {
        return financials.filter(
            (fin) =>
                fin.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fin.tripTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fin.destination.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [financials, searchQuery]);

    const totalVolume = useMemo(() => {
        return financials.reduce((s, f) => s + f.clientPrice, 0);
    }, [financials]);

    const bookedCommission = useMemo(() => {
        return financials
            .filter((f) => f.status === "booked" || f.status === "confirmed")
            .reduce((s, f) => s + f.clientPrice * (f.commissionRate / 100), 0);
    }, [financials]);

    return (
        <div className="space-y-5">
            {/* Header & Agency Default Rate Config */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/[0.02] border border-white/[0.06] p-3 rounded-xl backdrop-blur-sm">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                        placeholder="Search commission by client or trip..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-9 text-xs"
                    />
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 shrink-0">
                    <span className="text-xs text-gray-400">Agency Default Commission:</span>
                    <div className="flex items-center gap-1">
                        <Input
                            type="number"
                            value={commissionRate}
                            onChange={(e) => {
                                const rate = parseFloat(e.target.value) || 0;
                                onRateChange(rate);
                            }}
                            className="w-14 h-7 text-xs bg-white/10 border-white/10 text-white text-center font-bold"
                        />
                        <span className="text-xs text-purple-400 font-bold">%</span>
                    </div>
                </div>
            </div>

            {/* Total KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gradient-to-r from-purple-500/15 via-purple-500/5 to-pink-500/10 border border-purple-500/25 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                    <div>
                        <p className="text-[10px] text-purple-300 uppercase tracking-wider font-semibold">Total Projected Commission</p>
                        <p className="text-2xl font-black text-purple-300 mt-1">{fm(totalCommission)}</p>
                    </div>
                    <div className="p-2.5 bg-purple-500/20 text-purple-300 rounded-xl">
                        <DollarSign className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Confirmed / Booked Commission</p>
                        <p className="text-2xl font-black text-emerald-400 mt-1">{fm(bookedCommission)}</p>
                    </div>
                    <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Total Booking Volume</p>
                        <p className="text-2xl font-black text-white mt-1">{fm(totalVolume)}</p>
                    </div>
                    <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-xl">
                        <Percent className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Per-trip breakdown table */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-gray-400 border-b border-white/10 bg-white/[0.02]">
                                <th className="text-left p-3.5 font-semibold">Client & Trip</th>
                                <th className="text-left p-3.5 font-semibold">Status</th>
                                <th className="text-right p-3.5 font-semibold">Gross Price</th>
                                <th className="text-right p-3.5 font-semibold">Commission Rate</th>
                                <th className="text-right p-3.5 font-semibold">Commission Amount</th>
                                <th className="text-right p-3.5 font-semibold">Net Payout</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredFinancials.map((fin) => {
                                const commissionAmt = fin.clientPrice * (fin.commissionRate / 100);
                                const netPayout = fin.clientPrice - commissionAmt;

                                return (
                                    <tr
                                        key={fin.tripId || fin.itineraryId}
                                        className="hover:bg-white/[0.04] transition-colors"
                                    >
                                        <td className="p-3.5">
                                            <p className="font-semibold text-white">{fin.clientName}</p>
                                            <p className="text-[11px] text-gray-500">
                                                {fin.tripTitle} · {fin.destination}
                                            </p>
                                        </td>
                                        <td className="p-3.5">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[10px] capitalize font-semibold px-2 py-0.5",
                                                    fin.status === "booked" || fin.status === "confirmed"
                                                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                )}
                                            >
                                                {fin.status}
                                            </Badge>
                                        </td>
                                        <td className="p-3.5 text-right font-bold text-gray-200">
                                            {fm(fin.clientPrice, fin.currency)}
                                        </td>
                                        <td className="p-3.5 text-right">
                                            <div className="inline-flex items-center gap-1 justify-end">
                                                <Input
                                                    type="number"
                                                    value={fin.commissionRate}
                                                    onChange={(e) => {
                                                        const rate = parseFloat(e.target.value) || 0;
                                                        updateFinancial(fin.itineraryId, {
                                                            commissionRate: rate,
                                                            commissionAmount: fin.clientPrice * (rate / 100),
                                                        });
                                                    }}
                                                    className="w-14 h-7 text-[11px] bg-white/5 border-white/10 text-white text-center font-semibold"
                                                />
                                                <span className="text-gray-500 font-bold">%</span>
                                            </div>
                                        </td>
                                        <td className="p-3.5 text-right font-bold text-purple-400">
                                            +{fm(commissionAmt, fin.currency)}
                                        </td>
                                        <td className="p-3.5 text-right font-medium text-gray-400">
                                            {fm(netPayout, fin.currency)}
                                        </td>
                                    </tr>
                                );
                            })}

                            {filteredFinancials.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-500">
                                        No trips found. Create itineraries in The Lab to compute commissions.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
