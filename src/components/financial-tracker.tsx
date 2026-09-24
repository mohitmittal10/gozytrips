"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useFinancials } from "@/hooks/use-financials";
import { PaymentsTab } from "@/components/financial/PaymentsTab";
import { ExpensesTab } from "@/components/financial/ExpensesTab";
import { InvoicesTab } from "@/components/financial/InvoicesTab";
import { ReportsTab } from "@/components/financial/ReportsTab";
import {
    CreditCard, Receipt, FileText, BarChart3,
    Sparkles, RefreshCw, DollarSign, Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface EnrichedClient {
    id: string;
    name: string;
    email: string | null;
    latestTripId?: string;
    latestBudget: string;
    latestRawBudget: number;
    latestDestination: string;
    allTrips: any[];
}

interface FinancialTrackerProps {
    enrichedClients: EnrichedClient[];
    userEmail: string;
    userName: string;
    onOpenFinances?: (tripId: string) => void;
}

type FinanceTab = "payments" | "expenses" | "invoices" | "reports";

const TABS: { key: FinanceTab; label: string; icon: React.ElementType }[] = [
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "expenses", label: "Vendor Expenses", icon: Receipt },
    { key: "invoices", label: "Invoices", icon: FileText },
    { key: "reports", label: "P&L Reports", icon: BarChart3 },
];

export default function FinancialTracker({
    enrichedClients,
    userEmail,
    userName,
    onOpenFinances,
}: FinancialTrackerProps) {
    const [activeFinTab, setActiveFinTab] = useState<FinanceTab>("payments");

    const fin = useFinancials(enrichedClients, userEmail, userName);

    return (
        <div className="space-y-6">
            {/* Top Stat Cards — all live computed from DB */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                {[
                    {
                        label: "Total Gross Revenue",
                        value: fin.fm(fin.stats.totalRevenue),
                        subtext: `${fin.financials.length} itineraries tracked`,
                        color: "text-white",
                        badge: "bg-white/10 text-zinc-300",
                        bg: "from-white/[0.06] to-white/[0.01] border-white/10",
                    },
                    {
                        label: "Collected Cash",
                        value: fin.fm(fin.stats.totalPaid),
                        subtext: `${fin.stats.totalRevenue > 0 ? ((fin.stats.totalPaid / fin.stats.totalRevenue) * 100).toFixed(0) : 0}% realization`,
                        color: "text-emerald-600 dark:text-emerald-400",
                        badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
                        bg: "from-emerald-950/30 to-emerald-900/10 border-emerald-500/20",
                    },
                    {
                        label: "Outstanding Due",
                        value: fin.fm(fin.stats.totalPending),
                        subtext: "Pending client collections",
                        color: "text-amber-400",
                        badge: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
                        bg: "from-amber-950/30 to-amber-900/10 border-amber-500/20",
                    },
                    {
                        label: "Net Profit Margin",
                        value: `${fin.stats.profitMargin.toFixed(1)}%`,
                        subtext: `${fin.fm(fin.stats.netProfit)} net profit`,
                        color: "text-primary",
                        badge: "bg-primary/20 text-primary border border-primary/30",
                        bg: "from-primary/15 to-white/[0.01] border-primary/20",
                    },
                ].map((card, idx) => (
                    <div
                        key={idx}
                        className={`p-4 rounded-2xl border bg-gradient-to-b ${card.bg} shadow-xl flex flex-col justify-between space-y-2`}
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] text-slate-600 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                                {card.label}
                            </p>
                        </div>
                        <div>
                            <p className={`text-2xl font-black tracking-tight ${card.color}`}>{card.value}</p>
                            <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-semibold mt-0.5">{card.subtext}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1.5 bg-white/[0.03] border border-white/[0.08] p-1.5 rounded-2xl backdrop-blur-xl shadow-lg overflow-x-auto">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeFinTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveFinTab(tab.key)}
                            className={cn(
                                "flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all whitespace-nowrap flex-1 shrink-0 border cursor-pointer",
                                isActive
                                    ? "bg-primary/20 text-white border-primary/40 font-bold"
                                    : "border-transparent text-slate-600 dark:text-zinc-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Icon className={cn("w-3.5 h-3.5", isActive ? "text-primary" : "text-slate-600 dark:text-zinc-400")} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Active Tab Content */}
            {activeFinTab === "payments" && (
                <PaymentsTab
                    financials={fin.financials}
                    paymentMethods={fin.paymentMethods}
                    paymentTypes={fin.paymentTypes}
                    cs={fin.cs}
                    fm={fin.fm}
                    selectedTripFin={fin.selectedTripFin}
                    setSelectedTripFin={fin.setSelectedTripFin}
                    showAddPayment={fin.showAddPayment}
                    setShowAddPayment={fin.setShowAddPayment}
                    addPayment={fin.addPayment}
                    deletePayment={fin.deletePayment}
                />
            )}

            {activeFinTab === "expenses" && (
                <ExpensesTab
                    financials={fin.financials}
                    expenseCategories={fin.expenseCategories}
                    totalExpenses={fin.stats.totalExpenses}
                    cs={fin.cs}
                    fm={fin.fm}
                    selectedTripFin={fin.selectedTripFin}
                    setSelectedTripFin={fin.setSelectedTripFin}
                    showAddExpense={fin.showAddExpense}
                    setShowAddExpense={fin.setShowAddExpense}
                    addExpense={fin.addExpense}
                    addExpensesBatch={fin.addExpensesBatch}
                    deleteExpense={fin.deleteExpense}
                />
            )}

            {activeFinTab === "invoices" && (
                <InvoicesTab
                    financials={fin.financials}
                    cs={fin.cs}
                    fm={fin.fm}
                />
            )}

            {activeFinTab === "reports" && (
                <ReportsTab
                    financials={fin.financials}
                    stats={fin.stats}
                    monthlyData={fin.monthlyData}
                    cs={fin.cs}
                    fm={fin.fm}
                />
            )}
        </div>
    );
}
