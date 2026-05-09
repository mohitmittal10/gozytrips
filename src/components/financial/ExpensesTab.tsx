"use client";

import React, { useState, useEffect } from "react";
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
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripFinancial, Expense } from "@/types/financial";
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
    deleteExpense,
}: ExpensesTabProps) {
    const [expAmt, setExpAmt] = useState("");
    const [expCat, setExpCat] = useState(expenseCategories[0]?.value ?? "hotel");
    const [expVendor, setExpVendor] = useState("");
    const [expDesc, setExpDesc] = useState("");

    // Keep default category in sync with DB-sourced options
    useEffect(() => {
        if (expenseCategories.length > 0) setExpCat(expenseCategories[0].value);
    }, [expenseCategories]);

    const resetForm = () => {
        setExpAmt("");
        setExpCat(expenseCategories[0]?.value ?? "hotel");
        setExpVendor("");
        setExpDesc("");
    };

    const handleOpen = (fin: TripFinancial) => {
        setSelectedTripFin(fin);
        resetForm();
        setShowAddExpense(true);
    };

    const handleSubmit = () => {
        if (!selectedTripFin || !expAmt) return;
        addExpense(selectedTripFin.itineraryId, {
            itineraryId: selectedTripFin.itineraryId,
            amount: parseFloat(expAmt),
            date: new Date().toISOString(),
            category: expCat,
            vendor: expVendor,
            description: expDesc,
            isPaid: true,
        });
    };

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-300">Expense Tracking</h3>
                    <p className="text-xs text-gray-500">
                        Total: {fm(totalExpenses)}
                    </p>
                </div>

                <div className="space-y-3">
                    {financials.map((fin) => {
                        const totalExp = fin.expenses.reduce((s, e) => s + e.amount, 0);
                        const margin =
                            fin.clientPrice > 0
                                ? ((fin.clientPrice - totalExp) / fin.clientPrice) * 100
                                : 0;

                        return (
                            <div
                                key={fin.tripId}
                                className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            {fin.clientName} — {fin.tripTitle}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Client Price: {fm(fin.clientPrice, fin.currency)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-red-400">
                                            -{fm(totalExp, fin.currency)}
                                        </p>
                                        <p className={cn("text-xs", margin > 20 ? "text-green-400" : margin > 0 ? "text-amber-400" : "text-red-400")}>
                                            {margin.toFixed(0)}% margin
                                        </p>
                                    </div>
                                </div>

                                {fin.expenses.length > 0 && (
                                    <div className="space-y-1.5">
                                        {fin.expenses.map((e) => (
                                            <div
                                                key={e.id}
                                                className="flex items-center justify-between px-3 py-2 bg-white/[0.03] rounded-lg text-xs"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="bg-pink-500/10 text-pink-400 border-0 text-[10px] capitalize">
                                                        {e.category}
                                                    </Badge>
                                                    <span className="text-gray-300">{e.vendor}</span>
                                                    <span className="text-gray-600">{e.description}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-red-400 font-medium">
                                                        {fm(e.amount, fin.currency)}
                                                    </span>
                                                    <button
                                                        onClick={() => deleteExpense(fin.itineraryId, e.id)}
                                                        className="text-gray-600 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs border-white/10 bg-transparent text-gray-400 hover:bg-white/10 w-full"
                                    onClick={() => handleOpen(fin)}
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="ml-1">Add Expense</span>
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add Expense Dialog */}
            <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
                <DialogContent className="bg-[#0A0A0A] border border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Expense</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            {selectedTripFin
                                ? `${selectedTripFin.clientName} — ${selectedTripFin.tripTitle}`
                                : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-gray-400 mb-1">
                                    Amount ({cs(selectedTripFin?.currency)})
                                </Label>
                                <Input
                                    type="number"
                                    value={expAmt}
                                    onChange={(e) => setExpAmt(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-gray-400 mb-1">Category</Label>
                                <Select value={expCat} onValueChange={setExpCat}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {expenseCategories.map((ec) => (
                                            <SelectItem key={ec.value} value={ec.value}>
                                                {ec.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-gray-400 mb-1">Vendor Name</Label>
                            <Input
                                value={expVendor}
                                onChange={(e) => setExpVendor(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="e.g. Taj Hotels"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-gray-400 mb-1">Description</Label>
                            <Input
                                value={expDesc}
                                onChange={(e) => setExpDesc(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="e.g. 3 nights stay"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="border-white/10 text-gray-400 hover:bg-white/10"
                            onClick={() => setShowAddExpense(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={handleSubmit}
                        >
                            Add Expense
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
