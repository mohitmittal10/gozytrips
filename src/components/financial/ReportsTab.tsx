"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight,
    Search, Download, BarChart3, PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripFinancial } from "@/types/financial";
import type { Currency } from "@/types/pricing";

interface ReportsTabProps {
    financials: TripFinancial[];
    stats: {
        totalRevenue: number;
        totalExpenses: number;
        totalPaid: number;
        totalPending: number;
        totalCommission: number;
        profitMargin: number;
        netProfit: number;
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
    const [searchQuery, setSearchQuery] = useState("");

    const filteredFinancials = useMemo(() => {
        return financials.filter(
            (fin) =>
                fin.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fin.tripTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fin.destination.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [financials, searchQuery]);

    const handleExportCSV = () => {
        const headers = ["Client", "Trip", "Destination", "Status", "Client Price", "Expenses", "Net Profit", "Margin %", "Payments Collected", "Balance Due"];
        const rows = financials.map((f) => {
            const totalExp = f.expenses.reduce((s, e) => s + e.amount, 0);
            const totalPaid = f.payments.reduce((s, p) => s + p.amount, 0);
            const profit = f.clientPrice - totalExp;
            const margin = f.clientPrice > 0 ? ((profit / f.clientPrice) * 100).toFixed(1) : "0";
            return [
                `"${f.clientName}"`,
                `"${f.tripTitle}"`,
                `"${f.destination}"`,
                `"${f.status}"`,
                f.clientPrice,
                totalExp,
                profit,
                margin,
                totalPaid,
                Math.max(0, f.clientPrice - totalPaid),
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `financial_report_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-5">
            {/* Header & Export */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] p-3 rounded-xl backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span>Financial Analytics & Profitability</span>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 gap-1.5 cursor-pointer rounded-xl font-semibold"
                    onClick={handleExportCSV}
                >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV Report</span>
                </Button>
            </div>

            {/* KPI Summary Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-2xl p-4 shadow-xl">
                    <p className="text-[10px] text-slate-600 dark:text-gray-400 uppercase tracking-wider font-semibold">Total Revenue</p>
                    <p className="text-xl font-black mt-1 text-slate-900 dark:text-white">{fm(stats.totalRevenue)}</p>
                    <p className="text-[11px] text-slate-500 dark:text-gray-500 mt-0.5">{financials.length} total active itineraries</p>
                </div>

                <div className="bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-2xl p-4 shadow-xl">
                    <p className="text-[10px] text-slate-600 dark:text-gray-400 uppercase tracking-wider font-semibold">Net Profit</p>
                    <p className="text-xl font-black mt-1 text-slate-900 dark:text-white">
                        {fm(stats.netProfit)}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400/80 mt-0.5 font-medium">
                        {stats.profitMargin.toFixed(1)}% average net margin
                    </p>
                </div>

                <div className="bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-2xl p-4 shadow-xl">
                    <p className="text-[10px] text-slate-600 dark:text-gray-400 uppercase tracking-wider font-semibold">Collected Cash</p>
                    <p className="text-xl font-black mt-1 text-slate-900 dark:text-white">{fm(stats.totalPaid)}</p>
                    <p className="text-[11px] text-slate-500 dark:text-gray-500 mt-0.5">
                        {stats.totalRevenue > 0 ? ((stats.totalPaid / stats.totalRevenue) * 100).toFixed(0) : 0}% realization
                    </p>
                </div>

                <div className="bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-2xl p-4 shadow-xl">
                    <p className="text-[10px] text-slate-600 dark:text-gray-400 uppercase tracking-wider font-semibold">Outstanding Receivable</p>
                    <p className="text-xl font-black mt-1 text-slate-900 dark:text-white">{fm(stats.totalPending)}</p>
                    <p className="text-[11px] text-slate-500 dark:text-gray-500 mt-0.5">Pending client payments</p>
                </div>
            </div>

            {/* Monthly Bar Chart */}
            <div className="bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Monthly Revenue & Expense Trends (Last 6 Months)
                    </h4>
                </div>

                <div className="grid grid-cols-6 gap-2 items-end h-[180px] pt-4">
                    {monthlyData.map((m) => {
                        const maxVal = Math.max(
                            ...monthlyData.map((d) => Math.max(d.revenue, d.expenses, d.payments)),
                            1
                        );
                        return (
                            <div
                                key={m.month}
                                className="flex flex-col items-center gap-1.5 h-full justify-end"
                            >
                                <div className="w-full flex gap-1 h-full items-end justify-center px-1">
                                    <div
                                        className="w-2.5 sm:w-4 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t shadow-sm transition-all hover:brightness-125"
                                        style={{
                                            height: `${(m.revenue / maxVal) * 100}%`,
                                            minHeight: m.revenue > 0 ? "6px" : "0",
                                        }}
                                        title={`Revenue: ${fm(m.revenue)}`}
                                    />
                                    <div
                                        className="w-2.5 sm:w-4 bg-gradient-to-t from-rose-600 to-red-500 rounded-t shadow-sm transition-all hover:brightness-125"
                                        style={{
                                            height: `${(m.expenses / maxVal) * 100}%`,
                                            minHeight: m.expenses > 0 ? "6px" : "0",
                                        }}
                                        title={`Expenses: ${fm(m.expenses)}`}
                                    />
                                    <div
                                        className="w-2.5 sm:w-4 bg-gradient-to-t from-emerald-600 to-green-400 rounded-t shadow-sm transition-all hover:brightness-125"
                                        style={{
                                            height: `${(m.payments / maxVal) * 100}%`,
                                            minHeight: m.payments > 0 ? "6px" : "0",
                                        }}
                                        title={`Payments: ${fm(m.payments)}`}
                                    />
                                </div>
                                <span className="text-[11px] text-slate-600 dark:text-gray-400 font-semibold">{m.month}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center gap-6 mt-3 justify-center border-t border-slate-200 dark:border-white/5 pt-3">
                    <span className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-gray-400 font-medium">
                        <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> Revenue
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-gray-400 font-medium">
                        <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Vendor Expenses
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-gray-400 font-medium">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-500 inline-block" /> Collected Cash
                    </span>
                </div>
            </div>

            {/* Per-Trip Profitability Table */}
            <div className="bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-xl space-y-3 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Trip-by-Trip Profitability</h4>
                    <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-600 dark:text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <Input
                            placeholder="Filter trips..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-500 h-8 text-xs rounded-xl"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-slate-700 dark:text-gray-400 border-b border-slate-200 dark:border-white/10 bg-slate-100/60 dark:bg-white/[0.02]">
                                <th className="text-left p-3 font-semibold">Client / Trip</th>
                                <th className="text-left p-3 font-semibold">Status</th>
                                <th className="text-right p-3 font-semibold">Gross Revenue</th>
                                <th className="text-right p-3 font-semibold">Vendor Expenses</th>
                                <th className="text-right p-3 font-semibold">Net Profit</th>
                                <th className="text-right p-3 font-semibold">Margin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {filteredFinancials.map((fin) => {
                                const totalExp = fin.expenses.reduce((s, e) => s + e.amount, 0);
                                const profit = fin.clientPrice - totalExp;
                                const margin = fin.clientPrice > 0 ? (profit / fin.clientPrice) * 100 : 0;

                                return (
                                    <tr key={fin.itineraryId} className="hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-colors">
                                        <td className="p-3">
                                            <p className="font-semibold text-slate-900 dark:text-white">{fin.clientName}</p>
                                            <p className="text-[11px] text-slate-500 dark:text-gray-500">{fin.tripTitle} · {fin.destination}</p>
                                        </td>
                                        <td className="p-3">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[10px] capitalize font-semibold px-2 py-0.5",
                                                    fin.status === "booked" || fin.status === "confirmed"
                                                        ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                                        : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                                                )}
                                            >
                                                {fin.status}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                                            {fm(fin.clientPrice, fin.currency)}
                                        </td>
                                        <td className="p-3 text-right font-semibold text-red-500 dark:text-red-400">
                                            -{fm(totalExp, fin.currency)}
                                        </td>
                                        <td className={cn("p-3 text-right font-bold", profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
                                            {fm(profit, fin.currency)}
                                        </td>
                                        <td className="p-3 text-right">
                                            <span
                                                className={cn(
                                                    "px-2 py-0.5 rounded text-[11px] font-bold inline-block",
                                                    margin >= 25
                                                        ? "bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30"
                                                        : margin > 0
                                                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                                                        : "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30"
                                                )}
                                            >
                                                {margin.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}

                            {filteredFinancials.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-slate-500 dark:text-gray-500">
                                        No trips found.
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
