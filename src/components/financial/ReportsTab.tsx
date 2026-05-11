"use client";

import React from "react";

import { cn } from "@/lib/utils";
import type { TripFinancial } from "@/types/financial";
import type { Currency } from "@/types/pricing";

interface ReportsTabProps {
    financials: TripFinancial[];
    stats: {
        netProfit: number;
        totalCommission: number;
    };
    monthlyData: {
        month: string;
        revenue: number;
        expenses: number;
        payments: number;
    }[];
    cs: (currency?: Currency) => string;
    fm: (amount: number | string, currency?: Currency) => string;
}

export function ReportsTab({ financials, stats, monthlyData, cs, fm }: ReportsTabProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-300">Financial Reports</h3>

            {/* KPI Summary Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Net Profit</p>
                    <p className={cn("text-lg font-bold mt-1", stats.netProfit >= 0 ? "text-green-400" : "text-red-400")}>
                        {fm(stats.netProfit)}
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Commissions</p>
                    <p className="text-lg font-bold mt-1 text-purple-400">
                        {fm(stats.totalCommission)}
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Active Trips</p>
                    <p className="text-lg font-bold mt-1 text-white">{financials.length}</p>
                </div>
            </div>

            {/* Monthly Bar Chart */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <h4 className="text-sm font-semibold text-gray-300">
                        Monthly Overview (Last 6 Months)
                    </h4>
                </div>
                <div className="grid grid-cols-6 gap-2 items-end h-[160px]">
                    {monthlyData.map((m) => {
                        const maxVal = Math.max(
                            ...monthlyData.map((d) => Math.max(d.revenue, d.expenses, d.payments)),
                            1,
                        );
                        return (
                            <div
                                key={m.month}
                                className="flex flex-col items-center gap-1 h-full justify-end"
                            >
                                <div className="w-full flex gap-0.5 h-full items-end justify-center">
                                    <div
                                        className="w-3 bg-blue-500/60 rounded-t"
                                        style={{
                                            height: `${(m.revenue / maxVal) * 100}%`,
                                            minHeight: m.revenue > 0 ? "4px" : "0",
                                        }}
                                        title={`Revenue: ${fm(m.revenue)}`}
                                    />
                                    <div
                                        className="w-3 bg-red-500/60 rounded-t"
                                        style={{
                                            height: `${(m.expenses / maxVal) * 100}%`,
                                            minHeight: m.expenses > 0 ? "4px" : "0",
                                        }}
                                        title={`Expenses: ${fm(m.expenses)}`}
                                    />
                                    <div
                                        className="w-3 bg-green-500/60 rounded-t"
                                        style={{
                                            height: `${(m.payments / maxVal) * 100}%`,
                                            minHeight: m.payments > 0 ? "4px" : "0",
                                        }}
                                        title={`Payments: ${fm(m.payments)}`}
                                    />
                                </div>
                                <span className="text-[10px] text-gray-500">{m.month}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="flex items-center gap-4 mt-3 justify-center">
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <span className="w-2 h-2 rounded-sm bg-blue-500/60 inline-block" /> Revenue
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <span className="w-2 h-2 rounded-sm bg-red-500/60 inline-block" /> Expenses
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <span className="w-2 h-2 rounded-sm bg-green-500/60 inline-block" /> Payments
                    </span>
                </div>
            </div>

            {/* Per-Trip Profitability Table */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Trip Profitability</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-gray-500 border-b border-white/10">
                                <th className="text-left p-2 font-medium">Client / Trip</th>
                                <th className="text-right p-2 font-medium">Revenue</th>
                                <th className="text-right p-2 font-medium">Expenses</th>
                                <th className="text-right p-2 font-medium">Profit</th>
                                <th className="text-right p-2 font-medium">Margin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {financials.map((fin) => {
                                const totalExp = fin.expenses.reduce((s, e) => s + e.amount, 0);
                                const profit = fin.clientPrice - totalExp;
                                const margin =
                                    fin.clientPrice > 0
                                        ? (profit / fin.clientPrice) * 100
                                        : 0;
                                return (
                                    <tr key={fin.itineraryId} className="hover:bg-white/5">
                                        <td className="p-2">
                                            <p className="text-gray-300">{fin.clientName}</p>
                                            <p className="text-gray-600">{fin.tripTitle}</p>
                                        </td>
                                        <td className="p-2 text-right text-white">
                                            {fm(fin.clientPrice, fin.currency)}
                                        </td>
                                        <td className="p-2 text-right text-red-400">
                                            {fm(totalExp, fin.currency)}
                                        </td>
                                        <td className={cn("p-2 text-right font-medium", profit >= 0 ? "text-green-400" : "text-red-400")}>
                                            {fm(profit, fin.currency)}
                                        </td>
                                        <td className="p-2 text-right">
                                            <span
                                                className={cn(
                                                    "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                                    margin > 20
                                                        ? "bg-green-500/10 text-green-400"
                                                        : margin > 0
                                                        ? "bg-amber-500/10 text-amber-400"
                                                        : "bg-red-500/10 text-red-400",
                                                )}
                                            >
                                                {margin.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

