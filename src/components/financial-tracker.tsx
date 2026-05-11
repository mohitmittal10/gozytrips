"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useFinancials } from "@/hooks/use-financials";
import { PaymentsTab } from "@/components/financial/PaymentsTab";
import { ExpensesTab } from "@/components/financial/ExpensesTab";
import { CommissionsTab } from "@/components/financial/CommissionsTab";
import { InvoicesTab } from "@/components/financial/InvoicesTab";
import { ReportsTab } from "@/components/financial/ReportsTab";

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

type FinanceTab = "payments" | "commissions" | "invoices" | "expenses" | "reports";

const TABS: { key: FinanceTab; label: string }[] = [
    { key: "payments", label: "Payments" },
    { key: "expenses", label: "Expenses" },
    { key: "commissions", label: "Commissions" },
    { key: "invoices", label: "Invoices" },
    { key: "reports", label: "Reports" },
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
            {/* Summary Cards — all values from DB via useFinancials */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    {
                        label: "Total Revenue",
                        value: fin.fm(fin.stats.totalRevenue),
                        color: "text-green-400",
                        bg: "bg-green-500/10 border-green-500/20",
                    },
                    {
                        label: "Payments Received",
                        value: fin.fm(fin.stats.totalPaid),
                        color: "text-blue-400",
                        bg: "bg-blue-500/10 border-blue-500/20",
                    },
                    {
                        label: "Pending Amount",
                        value: fin.fm(fin.stats.totalPending),
                        color: "text-amber-400",
                        bg: "bg-amber-500/10 border-amber-500/20",
                    },
                    {
                        label: "Profit Margin",
                        value: `${fin.stats.profitMargin.toFixed(1)}%`,
                        color: "text-purple-400",
                        bg: "bg-purple-500/10 border-purple-500/20",
                    },
                ].map((card) => (
                    <div key={card.label} className={`p-4 rounded-xl border ${card.bg}`}>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                            {card.label}
                        </p>
                        <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveFinTab(tab.key)}
                        className={cn(
                            "flex-1 text-xs font-medium py-2 px-3 rounded-md transition-all",
                            activeFinTab === tab.key
                                ? "bg-purple-500/20 text-purple-400"
                                : "text-gray-500 hover:text-gray-300 hover:bg-white/5",
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Active Tab */}
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
                        // Propagate new default rate to all trips locally
                        fin.financials.forEach((f) =>
                            fin.updateFinancial(f.itineraryId, {
                                commissionRate: rate,
                                commissionAmount: f.clientPrice * (rate / 100),
                            }),
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

