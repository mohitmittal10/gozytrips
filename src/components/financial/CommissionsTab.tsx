"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { DollarSign } from "lucide-react";
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
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300">Commission Calculator</h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Default Rate:</span>
                    <Input
                        type="number"
                        value={commissionRate}
                        onChange={(e) => {
                            const rate = parseFloat(e.target.value) || 0;
                            onRateChange(rate);
                        }}
                        className="w-16 h-7 text-xs bg-white/5 border-white/10 text-white text-center"
                    />
                    <span className="text-xs text-gray-500">%</span>
                </div>
            </div>

            {/* Total commission card */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-400">Total Commission Earned</p>
                    <p className="text-2xl font-bold text-purple-400">
                        {fm(totalCommission)}
                    </p>
                </div>
                <DollarSign className="w-4 h-4 text-purple-400" />
            </div>

            {/* Per-trip breakdown table */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="text-gray-500 border-b border-white/10">
                            <th className="text-left p-3 font-medium">Client</th>
                            <th className="text-left p-3 font-medium">Trip</th>
                            <th className="text-right p-3 font-medium">Trip Value</th>
                            <th className="text-right p-3 font-medium">Rate</th>
                            <th className="text-right p-3 font-medium">Commission</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {financials.map((fin) => (
                            <tr
                                key={fin.tripId}
                                className="hover:bg-white/5 transition-colors"
                            >
                                <td className="p-3 text-gray-300">{fin.clientName}</td>
                                <td className="p-3 text-gray-500">{fin.tripTitle}</td>
                                <td className="p-3 text-right text-gray-300">
                                    {fm(fin.clientPrice, fin.currency)}
                                </td>
                                <td className="p-3 text-right">
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
                                        className="w-14 h-6 text-[11px] bg-white/5 border-white/10 text-white text-center inline-block"
                                    />
                                    <span className="text-gray-600 ml-0.5">%</span>
                                </td>
                                <td className="p-3 text-right text-green-400 font-medium">
                                    {fm(fin.clientPrice * (fin.commissionRate / 100), fin.currency)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
