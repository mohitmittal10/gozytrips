"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useFinancials } from "@/hooks/use-financials";
import { PaymentsTab } from "@/components/financial/PaymentsTab";
import { ExpensesTab } from "@/components/financial/ExpensesTab";
import { CommissionsTab } from "@/components/financial/CommissionsTab";
import { InvoicesTab } from "@/components/financial/InvoicesTab";
import { ReportsTab } from "@/components/financial/ReportsTab";
import {
    CreditCard, Receipt, Percent, FileText, BarChart3,
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

type FinanceTab = "payments" | "expenses" | "commissions" | "invoices" | "reports";

const TABS: { key: FinanceTab; label: string; icon: React.ElementType }[] = [
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "expenses", label: "Vendor Expenses", icon: Receipt },
    { key: "commissions", label: "Commissions", icon: Percent },
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
                        badge: "bg-white/10 text-gray-300",
                        bg: "from-white/[0.06] to-white/[0.01] border-white/10",
                    },
                    {
                        label: "Collected Cash",
                        value: fin.fm(fin.stats.totalPaid),
                        subtext: `${fin.stats.totalRevenue > 0 ? ((fin.stats.totalPaid / fin.stats.totalRevenue) * 100).toFixed(0) : 0}% realization`,
                        color: "text-emerald-400",
                        badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                        bg: "from-emerald-950/20 to-emerald-900/5 border-emerald-500/20",
                    },
                    {
                        label: "Outstanding Due",
                        value: fin.fm(fin.stats.totalPending),
                        subtext: "Pending client collections",
                        color: "text-amber-400",
                        badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                        bg: "from-amber-950/20 to-amber-900/5 border-amber-500/20",
                    },
                    {
                        label: "Net Profit Margin",
                        value: `${fin.stats.profitMargin.toFixed(1)}%`,
                        subtext: `${fin.fm(fin.stats.netProfit)} net profit`,
                        color: "text-purple-300",
                        badge: "bg-purple-500/10 text-purple-300 border border-purple-500/20",
                        bg: "from-purple-950/25 to-purple-900/5 border-purple-500/25",
                    },
                ].map((card, idx) => (
                    <div
                        key={idx}
                        className={`p-4 rounded-2xl border bg-gradient-to-b ${card.bg} shadow-xl flex flex-col justify-between space-y-2`}
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                                {card.label}
                            </p>
                        </div>
                        <div>
                            <p className={`text-2xl font-black tracking-tight ${card.color}`}>{card.value}</p>
                            <p className="text-[11px] text-gray-500 font-medium mt-0.5">{card.subtext}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1.5 bg-black/40 border border-white/[0.08] p-1.5 rounded-2xl backdrop-blur-xl shadow-lg overflow-x-auto">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeFinTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveFinTab(tab.key)}
                            className={cn(
                                "flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all whitespace-nowrap flex-1 shrink-0",
                                isActive
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Icon className="w-3.5 h-3.5" />
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

            {activeFinTab === "commissions" && (
                <CommissionsTab
                    financials={fin.financials}
                    commissionRate={fin.commissionRate}
                    totalCommission={fin.stats.totalCommission}
                    cs={fin.cs}
                    fm={fin.fm}
                    onRateChange={(rate) => {
                        fin.setCommissionRate(rate);
                        fin.financials.forEach((f) =>
                            fin.updateFinancial(f.itineraryId, {
                                commissionRate: rate,
                                commissionAmount: f.clientPrice * (rate / 100),
                            })
                        );
                    }}
                    updateFinancial={fin.updateFinancial}
                />
            )}

            {activeFinTab === "invoices" && (
                <InvoicesTab
                    financials={fin.financials}
                    cs={fin.cs}
                    fm={fin.fm}
                    onOpenFinances={onOpenFinances}
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
