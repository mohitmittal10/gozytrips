"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Plus, Trash2, Sparkles, Check, ArrowDownToLine, Hotel,
    Plane, Car, Search, TrendingUp, AlertTriangle, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripFinancial, Expense, SuggestedExpense } from "@/types/financial";
import type { Currency } from "@/types/pricing";

interface ExpensesTabProps {
    financials: TripFinancial[];
    expenseCategories: { value: string; label: string }[];
    totalExpenses: number;
    cs: (currency?: Currency) => string;
    fm: (amount: number | string, currency?: Currency) => string;
    selectedTripFin: TripFinancial | null;
    setSelectedTripFin: (fin: TripFinancial | null) => void;
    showAddExpense: boolean;
    setShowAddExpense: (v: boolean) => void;
    addExpense: (itineraryId: string, expense: Omit<Expense, "id">) => Promise<void>;
    addExpensesBatch?: (itineraryId: string, expenses: Omit<Expense, "id">[]) => Promise<void>;
    deleteExpense: (itineraryId: string, expenseId: string) => Promise<void>;
}

export function ExpensesTab({
    financials,
    expenseCategories,
    totalExpenses,
    cs,
    fm,
    selectedTripFin,
    setSelectedTripFin,
    showAddExpense,
    setShowAddExpense,
    addExpense,
    addExpensesBatch,
    deleteExpense,
}: ExpensesTabProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [expAmt, setExpAmt] = useState("");
    const [expCat, setExpCat] = useState(expenseCategories[0]?.value ?? "hotel");
    const [expVendor, setExpVendor] = useState("");
    const [expDesc, setExpDesc] = useState("");
    const [expDate, setExpDate] = useState(new Date().toISOString().split("T")[0]);
    const [expIsPaid, setExpIsPaid] = useState(true);

    // Keep default category in sync with DB-sourced options
    useEffect(() => {
        if (expenseCategories.length > 0) setExpCat(expenseCategories[0].value);
    }, [expenseCategories]);

    const resetForm = () => {
        setExpAmt("");
        setExpCat(expenseCategories[0]?.value ?? "hotel");
        setExpVendor("");
        setExpDesc("");
        setExpDate(new Date().toISOString().split("T")[0]);
        setExpIsPaid(true);
    };

    const handleOpen = (fin: TripFinancial) => {
        setSelectedTripFin(fin);
        resetForm();
        setShowAddExpense(true);
    };

    const handleSubmit = () => {
        if (!selectedTripFin || !expAmt) return;
        const amountNum = parseFloat(expAmt);
        if (isNaN(amountNum) || amountNum <= 0) return;

        addExpense(selectedTripFin.itineraryId, {
            itineraryId: selectedTripFin.itineraryId,
            amount: amountNum,
            date: expDate || new Date().toISOString(),
            category: expCat,
            vendor: expVendor || "Vendor",
            description: expDesc || "Trip cost item",
            isPaid: expIsPaid,
        });
        setShowAddExpense(false);
    };

    // Filter trips by search
    const filteredFinancials = useMemo(() => {
        return financials.filter((fin) => {
            return (
                fin.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fin.tripTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fin.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fin.expenses.some((e) => e.vendor.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        });
    }, [financials, searchQuery]);

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case "hotel": return <Hotel className="w-3.5 h-3.5" />;
            case "flight": return <Plane className="w-3.5 h-3.5" />;
            case "transport": return <Car className="w-3.5 h-3.5" />;
            default: return <TrendingUp className="w-3.5 h-3.5" />;
        }
    };

    return (
        <>
            <div className="space-y-5">
                {/* Header & Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] p-3 rounded-xl backdrop-blur-sm shadow-sm">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-600 dark:text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                            placeholder="Search by client, trip, or vendor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-500 h-9 text-xs"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-gray-400 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 shrink-0">
                        <span>Total Tracked Expenses:</span>
                        <strong className="text-red-500 dark:text-red-400 font-bold">{fm(totalExpenses)}</strong>
                    </div>
                </div>

                {/* List of Trip Expense Cards */}
                <div className="space-y-4">
                    {filteredFinancials.map((fin) => {
                        const totalExp = fin.expenses.reduce((s, e) => s + e.amount, 0);
                        const netProfit = fin.clientPrice - totalExp;
                        const margin = fin.clientPrice > 0 ? (netProfit / fin.clientPrice) * 100 : 0;

                        return (
                            <div
                                key={fin.tripId || fin.itineraryId}
                                className="bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] hover:border-primary/40 dark:hover:border-white/[0.15] transition-all rounded-2xl p-5 space-y-4 shadow-xl"
                            >
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-white/[0.06] pb-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-wide">
                                                {fin.clientName}
                                            </span>
                                            <span className="text-xs text-slate-600 dark:text-gray-400">· {fin.tripTitle}</span>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5",
                                                    fin.status === "booked" || fin.status === "confirmed"
                                                        ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                                        : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                                                )}
                                            >
                                                {fin.status}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-gray-500">
                                            Destination: <span className="text-slate-700 dark:text-gray-300 font-medium">{fin.destination}</span>
                                            {fin.startDate && (
                                                <span className="ml-2">({new Date(fin.startDate).toLocaleDateString()})</span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Financial Summary Strip */}
                                    <div className="flex items-center gap-4 text-xs text-right">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Client Price</p>
                                            <p className="font-bold text-slate-900 dark:text-white">{fm(fin.clientPrice, fin.currency)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Vendor Costs</p>
                                            <p className="font-bold text-red-500 dark:text-red-400">-{fm(totalExp, fin.currency)}</p>
                                        </div>
                                        <div className="border-l border-slate-200 dark:border-white/10 pl-4">
                                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Net Margin</p>
                                            <p className={cn("font-bold", margin >= 20 ? "text-emerald-600 dark:text-emerald-400" : margin > 0 ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400")}>
                                                {margin.toFixed(0)}% ({fm(netProfit, fin.currency)})
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Vendor & Custom Expenses List */}
                                {fin.expenses.length > 0 ? (
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                                            Vendor & Trip Expenses ({fin.expenses.length})
                                        </p>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {fin.expenses.map((e) => (
                                                <div
                                                    key={e.id}
                                                    className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
                                                >
                                                    <div className="flex items-center gap-2.5 flex-wrap">
                                                        <Badge variant="secondary" className="bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/10 text-[10px] capitalize font-medium flex items-center gap-1">
                                                            {getCategoryIcon(e.category)}
                                                            <span>{e.category}</span>
                                                        </Badge>
                                                        <span className="text-slate-800 dark:text-zinc-200 font-semibold">{e.vendor}</span>
                                                        {e.description && (
                                                            <span className="text-slate-600 dark:text-gray-400">· {e.description}</span>
                                                        )}
                                                        {e.isAuto ? (
                                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 text-[9px] font-semibold">
                                                                Auto-synced
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 text-[9px] font-semibold">
                                                                Custom
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <span className="text-red-500 dark:text-red-400 font-bold">
                                                            -{fm(e.amount, fin.currency)}
                                                        </span>
                                                        <span className="text-slate-500 dark:text-gray-500 text-[11px]">
                                                            {new Date(e.date).toLocaleDateString()}
                                                        </span>
                                                        {!e.isAuto && (
                                                            <button
                                                                onClick={() => deleteExpense(fin.itineraryId, e.id)}
                                                                className="text-slate-500 hover:text-red-500 p-1 transition-colors cursor-pointer"
                                                                title="Delete Expense"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-500 dark:text-gray-500 italic py-1">
                                        No expenses recorded yet. Click &quot;Add Custom Expense&quot; below to add one manually.
                                    </div>
                                )}

                                {/* Add Custom Expense Button */}
                                <div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white w-full cursor-pointer rounded-xl font-semibold"
                                        onClick={() => handleOpen(fin)}
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                                        <span>Add Custom Expense</span>
                                    </Button>
                                </div>
                            </div>
                        );
                    })}

                    {filteredFinancials.length === 0 && (
                        <div className="text-center py-16 bg-white/60 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 rounded-2xl space-y-2">
                            <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">No trips matched your search filter.</p>
                            <p className="text-xs text-slate-500 dark:text-gray-600">Try searching a different client or itinerary name.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Smart Add Expense Dialog */}
            <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
                <DialogContent className="bg-white dark:bg-[#0c0c0e]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white sm:max-w-[440px] shadow-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">Add Custom Expense</DialogTitle>
                        <DialogDescription className="text-slate-600 dark:text-gray-400 text-xs">
                            {selectedTripFin
                                ? `${selectedTripFin.clientName} · ${selectedTripFin.tripTitle}`
                                : "Add an additional expense for this trip"}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTripFin && (
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs text-slate-700 dark:text-gray-300 font-semibold mb-1.5 block">
                                        Amount ({cs(selectedTripFin.currency)})
                                    </Label>
                                    <Input
                                        type="number"
                                        value={expAmt}
                                        onChange={(e) => setExpAmt(e.target.value)}
                                        className="bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white h-9 text-sm focus-visible:ring-primary/50 rounded-xl"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-700 dark:text-gray-300 font-semibold mb-1.5 block">Category</Label>
                                    <Select value={expCat} onValueChange={setExpCat}>
                                        <SelectTrigger className="bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white h-9 text-xs rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#0c0c0e]/95 backdrop-blur-2xl border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-xl">
                                            {expenseCategories.map((ec) => (
                                                <SelectItem key={ec.value} value={ec.value} className="text-xs">
                                                    {ec.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs text-slate-700 dark:text-gray-300 font-semibold mb-1.5 block">Vendor / Supplier Name</Label>
                                <Input
                                    value={expVendor}
                                    onChange={(e) => setExpVendor(e.target.value)}
                                    className="bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white h-9 text-xs rounded-xl"
                                    placeholder="e.g. Tour Guide, Local Driver, Activity Vendor"
                                />
                            </div>

                            <div>
                                <Label className="text-xs text-slate-700 dark:text-gray-300 font-semibold mb-1.5 block">Description / Details</Label>
                                <Input
                                    value={expDesc}
                                    onChange={(e) => setExpDesc(e.target.value)}
                                    className="bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white h-9 text-xs rounded-xl"
                                    placeholder="e.g. Full day guide allowance, Extra permits, Tips"
                                />
                            </div>

                            <div>
                                <Label className="text-xs text-slate-700 dark:text-gray-300 font-semibold mb-1.5 block">Expense Date</Label>
                                <Input
                                    type="date"
                                    value={expDate}
                                    onChange={(e) => setExpDate(e.target.value)}
                                    className="bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white h-9 text-xs rounded-xl"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            className="border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 text-xs h-9 rounded-xl cursor-pointer"
                            onClick={() => setShowAddExpense(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="aurora-gradient text-slate-900 dark:text-white text-xs h-9 font-bold rounded-xl border-none shadow-md hover:brightness-110 cursor-pointer"
                            onClick={handleSubmit}
                        >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Add Custom Expense
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
