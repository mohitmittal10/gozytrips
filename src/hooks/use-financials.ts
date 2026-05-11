"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { getCurrencySymbol, formatMoney } from "@/lib/utils/currency";
import {
    type TripFinancial,
    type Payment,
    type Expense,
    type InvoiceData,
} from "@/types/financial";
import type { Currency } from "@/types/pricing";
import { DEFAULT_CURRENCY } from "@/types/pricing";

// ── Reference-data fallbacks (used only when the DB has no rows for a scope) ──
export const DEFAULT_PAYMENT_METHODS = [
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "upi", label: "UPI" },
    { value: "card", label: "Card" },
    { value: "cash", label: "Cash" },
    { value: "other", label: "Other" },
];

export const DEFAULT_PAYMENT_TYPES = [
    { value: "advance", label: "Advance" },
    { value: "partial", label: "Partial" },
    { value: "balance", label: "Balance" },
    { value: "final", label: "Final" },
];

export const DEFAULT_EXPENSE_CATEGORIES = [
    { value: "hotel", label: "Hotel" },
    { value: "flight", label: "Flight" },
    { value: "transport", label: "Transport" },
    { value: "activity", label: "Activity" },
    { value: "visa", label: "Visa" },
    { value: "insurance", label: "Insurance" },
    { value: "food", label: "Food" },
    { value: "guide", label: "Guide" },
    { value: "other", label: "Other" },
];

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

export interface UseFinancialsReturn {
    // Data
    financials: TripFinancial[];
    isLoading: boolean;

    // Reference options (DB-sourced, with fallbacks)
    paymentMethods: { value: string; label: string }[];
    paymentTypes: { value: string; label: string }[];
    expenseCategories: { value: string; label: string }[];

    // Aggregated stats (all DB-derived, no hardcodes)
    stats: {
        totalRevenue: number;
        totalExpenses: number;
        totalPaid: number;
        totalPending: number;
        totalCommission: number;
        profitMargin: number;
        netProfit: number;
    };

    // Monthly chart data (last 6 months)
    monthlyData: { month: string; revenue: number; expenses: number; payments: number }[];

    // Commission rate (from agency_settings.default_commission_rate)
    commissionRate: number;
    setCommissionRate: (rate: number) => void;

    // Currency helpers
    cs: (currency?: Currency) => string;
    fm: (amount: number | string, currency?: Currency) => string;

    // Mutations
    fetchFinancials: () => Promise<void>;
    updateFinancial: (itineraryId: string, updates: Partial<TripFinancial>) => Promise<void>;
    addPayment: (itineraryId: string, payment: Omit<Payment, "id">) => Promise<void>;
    deletePayment: (itineraryId: string, paymentId: string) => Promise<void>;
    addExpense: (itineraryId: string, expense: Omit<Expense, "id">) => Promise<void>;
    deleteExpense: (itineraryId: string, expenseId: string) => Promise<void>;
    generateInvoice: (fin: TripFinancial) => InvoiceData;

    // Dialog selection state
    selectedTripFin: TripFinancial | null;
    setSelectedTripFin: (fin: TripFinancial | null) => void;
    showAddPayment: boolean;
    setShowAddPayment: (v: boolean) => void;
    showAddExpense: boolean;
    setShowAddExpense: (v: boolean) => void;
}

export function useFinancials(
    enrichedClients: EnrichedClient[],
    userEmail: string,
    userName: string,
): UseFinancialsReturn {
    const supabase = createClient();
    const { toast } = useToast();
    const { agencySettings } = useAuth();

    // ── State ──────────────────────────────────────────────────────────────
    const [financials, setFinancials] = useState<TripFinancial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [referenceOptions, setReferenceOptions] = useState<any[]>([]);
    const [commissionRate, setCommissionRate] = useState(0);
    const [selectedTripFin, setSelectedTripFin] = useState<TripFinancial | null>(null);
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [showAddExpense, setShowAddExpense] = useState(false);

    // ── Seed commission rate from DB (agency_settings) ─────────────────────
    useEffect(() => {
        if (agencySettings?.default_commission_rate != null) {
            setCommissionRate(Number(agencySettings.default_commission_rate));
        }
    }, [agencySettings?.default_commission_rate]);

    // ── Fetch reference_options from DB ────────────────────────────────────
    useEffect(() => {
        const fetchOptions = async () => {
            const { data } = await supabase
                .from("reference_options")
                .select("*")
                .eq("is_active", true)
                .order("sort_order");
            if (data) setReferenceOptions(data);
        };
        fetchOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Derive lookup lists — DB rows win, static fallbacks are last resort ─
    const paymentMethods = useMemo(() => {
        const opts = referenceOptions.filter((o) => o.scope === "payment_method");
        return opts.length > 0
            ? opts.map((o) => ({ value: o.value, label: o.label }))
            : DEFAULT_PAYMENT_METHODS;
    }, [referenceOptions]);

    const paymentTypes = useMemo(() => {
        const opts = referenceOptions.filter((o) => o.scope === "payment_type");
        return opts.length > 0
            ? opts.map((o) => ({ value: o.value, label: o.label }))
            : DEFAULT_PAYMENT_TYPES;
    }, [referenceOptions]);

    const expenseCategories = useMemo(() => {
        const opts = referenceOptions.filter((o) => o.scope === "expense_category");
        return opts.length > 0
            ? opts.map((o) => ({ value: o.value, label: o.label }))
            : DEFAULT_EXPENSE_CATEGORIES;
    }, [referenceOptions]);

    // ── Currency helper — reads default_currency from DB via agencySettings ─
    const cs = useCallback(
        (currency?: Currency): string =>
            getCurrencySymbol(
                (currency ??
                    (agencySettings?.default_currency as Currency) ??
                    DEFAULT_CURRENCY) as Currency,
            ),
        [agencySettings?.default_currency],
    );

    const fm = useCallback(
        (amount: number | string, currency?: Currency): string =>
            formatMoney(
                amount,
                (currency ??
                    (agencySettings?.default_currency as Currency) ??
                    DEFAULT_CURRENCY) as Currency,
            ),
        [agencySettings?.default_currency],
    );

    // ── Data loading ───────────────────────────────────────────────────────
    const fetchFinancials = useCallback(async () => {
        setIsLoading(true);
        try {
            const [
                { data: itineraries, error: itError },
                { data: payments, error: pError },
                { data: expenses, error: eError },
            ] = await Promise.all([
                supabase
                    .from("itineraries")
                    .select("*")
                    .order("created_at", { ascending: false }),
                supabase.from("trip_payments").select("*"),
                supabase.from("trip_expenses").select("*"),
            ]);

            if (itError) throw itError;
            if (pError) throw pError;
            if (eError) throw eError;

            const mapped: TripFinancial[] = (itineraries ?? []).map((it) => {
                const itPayments: Payment[] = (payments ?? [])
                    .filter((p) => p.itinerary_id === it.id)
                    .map((p) => ({
                        id: p.id,
                        itineraryId: p.itinerary_id,
                        amount: p.amount,
                        date: p.date,
                        method: p.method as any,
                        type: p.type as any,
                        reference: p.reference ?? "",
                        notes: p.notes ?? "",
                    }));

                const itExpenses: Expense[] = (expenses ?? [])
                    .filter((e) => e.itinerary_id === it.id)
                    .map((e) => ({
                        id: e.id,
                        itineraryId: e.itinerary_id,
                        category: e.category as any,
                        vendor: e.vendor ?? "",
                        description: e.description ?? "",
                        amount: e.amount,
                        date: e.date,
                        isPaid: e.is_paid,
                    }));

                return {
                    id: it.id,
                    itineraryId: it.id,
                    tripId: it.trip_id ?? "GT-PENDING",
                    clientId: it.client_id ?? "",
                    clientName:
                        enrichedClients.find((c) => c.id === it.client_id)?.name ??
                        "Unknown Client",
                    tripTitle: it.title,
                    destination: it.destinations ?? "",
                    // clientPrice from DB column — no hardcoded fallback
                    clientPrice: it.client_price ?? 0,
                    // currency from DB column → fall back to agency default → system default
                    currency:
                        (it.currency as Currency) ??
                        (agencySettings?.default_currency as Currency) ??
                        DEFAULT_CURRENCY,
                    expenses: itExpenses,
                    payments: itPayments,
                    // commission fields — always from DB columns
                    commissionRate: it.commission_rate ?? agencySettings?.default_commission_rate ?? 0,
                    commissionAmount: it.commission_amount ?? 0,
                    // markup / tax — from DB columns, not hardcoded
                    markupValue: it.markup_value ?? agencySettings?.default_markup_value ?? 0,
                    markupType:
                        (it.markup_type as TripFinancial["markupType"]) ??
                        agencySettings?.default_markup_type ??
                        "percentage",
                    taxPercentage:
                        it.tax_percentage ?? agencySettings?.default_tax_percentage ?? 0,
                    adultPax: it.adult_pax ?? 2,
                    childPax: it.child_pax ?? 0,
                    infantPax: it.infant_pax ?? 0,
                    costingType:
                        (it.costing_type as TripFinancial["costingType"]) ?? "automatic",
                    createdAt: it.created_at ?? new Date().toISOString(),
                    updatedAt: it.updated_at ?? new Date().toISOString(),
                };
            });

            setFinancials(mapped);
        } catch (error) {
            console.error("Error fetching financials:", error);
            toast({
                title: "Error",
                description: "Failed to load financial records.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enrichedClients, agencySettings]);

    useEffect(() => {
        fetchFinancials();
    }, [fetchFinancials]);

    // ── Mutations ──────────────────────────────────────────────────────────
    const updateFinancial = async (
        itineraryId: string,
        updates: Partial<TripFinancial>,
    ) => {
        try {
            const dbUpdates: Record<string, unknown> = {};
            if (updates.commissionRate !== undefined)
                dbUpdates.commission_rate = updates.commissionRate;
            if (updates.commissionAmount !== undefined)
                dbUpdates.commission_amount = updates.commissionAmount;
            if (updates.clientPrice !== undefined)
                dbUpdates.client_price = updates.clientPrice;
            if (updates.tripId !== undefined) dbUpdates.trip_id = updates.tripId;

            if (Object.keys(dbUpdates).length > 0) {
                const { error } = await supabase
                    .from("itineraries")
                    .update(dbUpdates)
                    .eq("id", itineraryId);
                if (error) throw error;
            }

            setFinancials((prev) =>
                prev.map((f) =>
                    f.itineraryId === itineraryId
                        ? { ...f, ...updates, updatedAt: new Date().toISOString() }
                        : f,
                ),
            );
            setSelectedTripFin((prev) =>
                prev?.itineraryId === itineraryId ? { ...prev, ...updates } : prev,
            );
        } catch (error) {
            console.error("Error updating financial:", error);
            toast({
                title: "Error",
                description: "Failed to update record.",
                variant: "destructive",
            });
        }
    };

    const addPayment = async (
        itineraryId: string,
        payment: Omit<Payment, "id">,
    ) => {
        try {
            const { error } = await supabase.from("trip_payments").insert([
                {
                    itinerary_id: itineraryId,
                    amount: payment.amount,
                    date: payment.date,
                    method: payment.method,
                    type: payment.type,
                    reference: payment.reference,
                    notes: payment.notes,
                },
            ]);
            if (error) throw error;

            toast({
                title: "Payment Recorded",
                description: `Recorded payment of ${fm(payment.amount)}.`,
            });
            setShowAddPayment(false);
            await fetchFinancials();
        } catch (error) {
            console.error("Error adding payment:", error);
            toast({
                title: "Error",
                description: "Failed to record payment.",
                variant: "destructive",
            });
        }
    };

    const deletePayment = async (itineraryId: string, paymentId: string) => {
        try {
            const { error } = await supabase
                .from("trip_payments")
                .delete()
                .eq("id", paymentId);
            if (error) throw error;
            await fetchFinancials();
        } catch (error) {
            console.error("Error deleting payment:", error);
            toast({
                title: "Error",
                description: "Failed to delete payment.",
                variant: "destructive",
            });
        }
    };

    const addExpense = async (
        itineraryId: string,
        expense: Omit<Expense, "id">,
    ) => {
        try {
            const { error } = await supabase.from("trip_expenses").insert([
                {
                    itinerary_id: itineraryId,
                    category: expense.category,
                    vendor: expense.vendor,
                    description: expense.description,
                    amount: expense.amount,
                    date: expense.date,
                    is_paid: expense.isPaid,
                },
            ]);
            if (error) throw error;

            toast({
                title: "Expense Added",
                description: `Recorded expense of ${fm(expense.amount)}.`,
            });
            setShowAddExpense(false);
            await fetchFinancials();
        } catch (error) {
            console.error("Error adding expense:", error);
            toast({
                title: "Error",
                description: "Failed to record expense.",
                variant: "destructive",
            });
        }
    };

    const deleteExpense = async (itineraryId: string, expenseId: string) => {
        try {
            const { error } = await supabase
                .from("trip_expenses")
                .delete()
                .eq("id", expenseId);
            if (error) throw error;
            await fetchFinancials();
        } catch (error) {
            console.error("Error deleting expense:", error);
            toast({
                title: "Error",
                description: "Failed to delete expense.",
                variant: "destructive",
            });
        }
    };

    /**
     * Generates invoice data — all rates come from the DB:
     *  - taxRate  → itinerary.tax_percentage (already in TripFinancial)
     *  - companyName → agency_settings.brand_name
     */
    const generateInvoice = (fin: TripFinancial): InvoiceData => {
        const totalPaid = fin.payments.reduce((s, p) => s + p.amount, 0);
        // Tax rate from the itinerary row, NOT hardcoded
        const taxRate = fin.taxPercentage;
        const taxAmount = fin.clientPrice * (taxRate / 100);

        return {
            invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
            clientName: fin.clientName,
            clientEmail: "",
            tripTitle: fin.tripTitle,
            destination: fin.destination,
            items: [
                {
                    description: `Trip Package: ${fin.tripTitle}`,
                    amount: fin.clientPrice,
                },
                ...fin.expenses
                    .filter((e) => !e.isPaid)
                    .map((e) => ({
                        description: `${e.category}: ${e.description}`,
                        amount: 0,
                    })),
            ],
            subtotal: fin.clientPrice,
            taxRate,
            taxAmount,
            total: fin.clientPrice + taxAmount,
            amountPaid: totalPaid,
            balanceDue: fin.clientPrice + taxAmount - totalPaid,
            issuedDate: new Date().toISOString().split("T")[0],
            dueDate: new Date(Date.now() + 15 * 86_400_000)
                .toISOString()
                .split("T")[0],
            currency: fin.currency,
            agentName: userName || agencySettings?.brand_name || "Travel Agent",
            agentEmail: userEmail,
            // company name from DB (brand_name), not a hardcoded string
            companyName: agencySettings?.brand_name ?? "Wander Labs",
        };
    };

    // ── Aggregated stats ───────────────────────────────────────────────────
    const stats = useMemo(() => {
        let totalRevenue = 0,
            totalExpenses = 0,
            totalPaid = 0,
            totalPending = 0,
            totalCommission = 0;

        for (const f of financials) {
            totalRevenue += f.clientPrice;
            totalExpenses += f.expenses.reduce((s, e) => s + e.amount, 0);
            const paid = f.payments.reduce((s, p) => s + p.amount, 0);
            totalPaid += paid;
            totalPending += f.clientPrice - paid;
            totalCommission += f.clientPrice * (f.commissionRate / 100);
        }

        return {
            totalRevenue,
            totalExpenses,
            totalPaid,
            totalPending: Math.max(0, totalPending),
            totalCommission,
            profitMargin:
                totalRevenue > 0
                    ? ((totalRevenue - totalExpenses) / totalRevenue) * 100
                    : 0,
            netProfit: totalRevenue - totalExpenses,
        };
    }, [financials]);

    // ── Monthly chart data ─────────────────────────────────────────────────
    const monthlyData = useMemo(() => {
        const months: Record<
            string,
            { revenue: number; expenses: number; payments: number }
        > = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            months[key] = { revenue: 0, expenses: 0, payments: 0 };
        }
        for (const f of financials) {
            const created = new Date(f.createdAt);
            const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
            if (months[key]) {
                months[key].revenue += f.clientPrice;
                months[key].expenses += f.expenses.reduce((s, e) => s + e.amount, 0);
                months[key].payments += f.payments.reduce((s, p) => s + p.amount, 0);
            }
        }
        return Object.entries(months).map(([key, data]) => {
            const [y, m] = key.split("-");
            return {
                month: new Date(parseInt(y), parseInt(m) - 1).toLocaleString("default", {
                    month: "short",
                }),
                ...data,
            };
        });
    }, [financials]);

    return {
        financials,
        isLoading,
        paymentMethods,
        paymentTypes,
        expenseCategories,
        stats,
        monthlyData,
        commissionRate,
        setCommissionRate,
        cs,
        fm,
        fetchFinancials,
        updateFinancial,
        addPayment,
        deletePayment,
        addExpense,
        deleteExpense,
        generateInvoice,
        selectedTripFin,
        setSelectedTripFin,
        showAddPayment,
        setShowAddPayment,
        showAddExpense,
        setShowAddExpense,
    };
}

