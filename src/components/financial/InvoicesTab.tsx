"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripFinancial } from "@/types/financial";
import type { Currency } from "@/types/pricing";

interface InvoicesTabProps {
    financials: TripFinancial[];
    cs: (currency?: Currency) => string;
    fm: (amount: number | string, currency?: Currency) => string;
    onOpenFinances?: (itineraryId: string) => void;
}

export function InvoicesTab({ financials, cs, fm, onOpenFinances }: InvoicesTabProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-300">Invoice Generation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {financials.map((fin) => {
                    const totalPaid = fin.payments.reduce((s, p) => s + p.amount, 0);
                    const balance = fin.clientPrice - totalPaid;

                    return (
                        <div
                            key={fin.tripId}
                            className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white">{fin.clientName}</p>
                                    <p className="text-xs text-gray-500">{fin.tripTitle}</p>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        "text-[10px] border-0",
                                        balance <= 0
                                            ? "bg-green-500/10 text-green-400"
                                            : "bg-amber-500/10 text-amber-400",
                                    )}
                                >
                                    {balance <= 0
                                        ? "Paid"
                                        : `${fm(balance, fin.currency)} due`}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-2 bg-white/[0.03] rounded-lg">
                                    <p className="text-[10px] text-gray-500">Total</p>
                                    <p className="text-xs font-bold text-white">
                                        {fm(fin.clientPrice, fin.currency)}
                                    </p>
                                </div>
                                <div className="p-2 bg-white/[0.03] rounded-lg">
                                    <p className="text-[10px] text-gray-500">Paid</p>
                                    <p className="text-xs font-bold text-green-400">
                                        {fm(totalPaid, fin.currency)}
                                    </p>
                                </div>
                                <div className="p-2 bg-white/[0.03] rounded-lg">
                                    <p className="text-[10px] text-gray-500">Balance</p>
                                    <p className={cn("text-xs font-bold", balance > 0 ? "text-amber-400" : "text-green-400")}>
                                        {fm(Math.max(0, balance), fin.currency)}
                                    </p>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs border-white/10 bg-transparent text-gray-400 hover:bg-white/10 w-full"
                                onClick={() => onOpenFinances?.(fin.itineraryId)}
                            >
                                <FileText className="w-4 h-4" />
                                <span className="ml-1">Manage Finances & Invoice</span>
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

