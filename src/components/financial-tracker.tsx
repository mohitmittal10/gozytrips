"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
    type TripFinancial, type Payment, type Expense, type InvoiceData,
    getCurrencySymbol,
} from "@/types/financial";
import type { Currency } from "@/types/pricing";
import { DEFAULT_CURRENCY } from "@/types/pricing";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

// Fallback defaults if DB is not populated
const DEFAULT_PAYMENT_METHODS = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'upi', label: 'UPI' },
    { value: 'card', label: 'Card' },
    { value: 'cash', label: 'Cash' },
    { value: 'other', label: 'Other' },
];

const DEFAULT_PAYMENT_TYPES = [
    { value: 'advance', label: 'Advance' },
    { value: 'partial', label: 'Partial' },
    { value: 'balance', label: 'Balance' },
    { value: 'final', label: 'Final' },
];

const DEFAULT_EXPENSE_CATEGORIES = [
    { value: 'hotel', label: 'Hotel' },
    { value: 'flight', label: 'Flight' },
    { value: 'transport', label: 'Transport' },
    { value: 'activity', label: 'Activity' },
    { value: 'visa', label: 'Visa' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'food', label: 'Food' },
    { value: 'guide', label: 'Guide' },
    { value: 'other', label: 'Other' },
];

// Icons - using simple SVG to avoid lucide-react import issues
const DollarIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PlusIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const TrashIcon = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const PrintIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>;
const BarChartIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;

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

type FinanceTab = 'payments' | 'commissions' | 'invoices' | 'expenses' | 'reports';

export default function FinancialTracker({ enrichedClients, userEmail, userName, onOpenFinances }: FinancialTrackerProps) {
    const [activeFinTab, setActiveFinTab] = useState<FinanceTab>('payments');
    const [financials, setFinancials] = useState<TripFinancial[]>([]);
    const [selectedTripFin, setSelectedTripFin] = useState<TripFinancial | null>(null);
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [commissionRate, setCommissionRate] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const { agencySettings } = useAuth();
    const supabase = createClient();
    const [referenceOptions, setReferenceOptions] = useState<any[]>([]);

    useEffect(() => {
        const fetchOptions = async () => {
            const { data } = await supabase
                .from('reference_options')
                .select('*')
                .eq('is_active', true)
                .order('sort_order');
            if (data) setReferenceOptions(data);
        };
        fetchOptions();
    }, []);

    useEffect(() => {
        if (agencySettings?.default_commission_rate !== undefined && agencySettings?.default_commission_rate !== null) {
            setCommissionRate(Number(agencySettings.default_commission_rate));
        }
    }, [agencySettings]);

    const paymentMethods = useMemo(() => {
        const opts = referenceOptions.filter(o => o.scope === 'payment_method');
        return opts.length > 0 ? opts.map(o => ({ value: o.value, label: o.label })) : DEFAULT_PAYMENT_METHODS;
    }, [referenceOptions]);

    const paymentTypes = useMemo(() => {
        const opts = referenceOptions.filter(o => o.scope === 'payment_type');
        return opts.length > 0 ? opts.map(o => ({ value: o.value, label: o.label })) : DEFAULT_PAYMENT_TYPES;
    }, [referenceOptions]);

    const expenseCategories = useMemo(() => {
        const opts = referenceOptions.filter(o => o.scope === 'expense_category');
        return opts.length > 0 ? opts.map(o => ({ value: o.value, label: o.label })) : DEFAULT_EXPENSE_CATEGORIES;
    }, [referenceOptions]);

    // ── Data Loading & Migration ──────────────────────────────────────────
    const fetchFinancials = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch all relevant itineraries for the user
            const { data: itineraries, error: itError } = await supabase
                .from("itineraries")
                .select("*")
                .order('created_at', { ascending: false });

            if (itError) throw itError;

            // 2. Fetch all payments and expenses
            const { data: payments, error: pError } = await supabase.from("trip_payments").select("*");
            const { data: expenses, error: eError } = await supabase.from("trip_expenses").select("*");

            if (pError) throw pError;
            if (eError) throw eError;

            // 3. Map to TripFinancial interface
            const mappedFinancials: TripFinancial[] = (itineraries || []).map(it => {
                const itPayments: Payment[] = (payments || [])
                    .filter(p => p.itinerary_id === it.id)
                    .map(p => ({
                        id: p.id,
                        itineraryId: p.itinerary_id,
                        amount: p.amount,
                        date: p.date,
                        method: p.method as any,
                        type: p.type as any,
                        reference: p.reference || "",
                        notes: p.notes || "",
                    }));

                const itExpenses: Expense[] = (expenses || [])
                    .filter(e => e.itinerary_id === it.id)
                    .map(e => ({
                        id: e.id,
                        itineraryId: e.itinerary_id,
                        category: e.category as any,
                        vendor: e.vendor || "",
                        description: e.description || "",
                        amount: e.amount,
                        date: e.date,
                        isPaid: e.is_paid,
                    }));

                return {
                    id: it.id,
                    itineraryId: it.id,
                    tripId: it.trip_id || `GT-PENDING`,
                    clientId: it.client_id || "",
                    clientName: enrichedClients.find(c => c.id === it.client_id)?.name || "Unknown Client",
                    tripTitle: it.title,
                    destination: it.destinations,
                    clientPrice: it.client_price || 0,
                    currency: (it.currency as Currency) || (agencySettings as any)?.default_currency || DEFAULT_CURRENCY,
                    expenses: itExpenses,
                    payments: itPayments,
                    commissionRate: it.commission_rate || 0,
                    commissionAmount: it.commission_amount || 0,
                    markupValue: it.markup_value || 0,
                    markupType: it.markup_type || 'percentage',
                    taxPercentage: it.tax_percentage || 0,
                    adultPax: it.adult_pax || 2,
                    childPax: it.child_pax || 0,
                    infantPax: it.infant_pax || 0,
                    costingType: it.costing_type || 'automatic',
                    createdAt: it.created_at,
                    updatedAt: it.updated_at,
                };
            });

            setFinancials(mappedFinancials);

        } catch (error) {
            console.error("Error fetching financials:", error);
            toast({ title: "Error", description: "Failed to load financial records.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        fetchFinancials();
    }, [enrichedClients]);

    // ── Helper: extract real cost from itinerary_data ──────────────────────
    const extractTripCost = (trip: any): number => {
        if (!trip) return 0;
        let totalBaseCost = 0;
        const data = trip.itinerary_data || {};

        // Activity costs
        const days = data.itinerary || data.days || [];
        if (Array.isArray(days)) {
            days.forEach((day: any) => {
                if (Array.isArray(day.timeline)) {
                    day.timeline.forEach((item: any) => {
                        if (typeof item.cost === 'number') totalBaseCost += item.cost;
                    });
                }
            });
        }

        // Pax counts
        const pax = {
            adult: data.pricing?.adultPax || 2,
            child: data.pricing?.childPax || 0,
            infant: data.pricing?.infantPax || 0,
        };

        // Hotel costs
        if (Array.isArray(data.hotels)) {
            data.hotels.forEach((h: any) => {
                if (h.costAdult) totalBaseCost += h.costAdult * pax.adult;
                if (h.costChild) totalBaseCost += h.costChild * pax.child;
                if (h.costInfant) totalBaseCost += h.costInfant * pax.infant;
            });
        }

        // Flight costs
        if (Array.isArray(data.flights)) {
            data.flights.forEach((f: any) => {
                if (f.costAdult) totalBaseCost += f.costAdult * pax.adult;
                if (f.costChild) totalBaseCost += f.costChild * pax.child;
                if (f.costInfant) totalBaseCost += f.costInfant * pax.infant;
            });
        }

        // Markup & Tax
        const pricing = data.pricing || {};
        const markupValue = pricing.markupValue || 0;
        const markupType = pricing.markupType || 'percentage';
        const taxPct = pricing.taxPercentage || 0;

        const markupAmount = markupType === 'percentage'
            ? (totalBaseCost * markupValue) / 100
            : markupValue;
        const costWithMarkup = totalBaseCost + markupAmount;
        const taxAmount = (costWithMarkup * taxPct) / 100;
        const finalTotal = costWithMarkup + taxAmount;

        return finalTotal > 0 ? finalTotal : (trip.budget || 0);
    };

    const updateFinancial = async (itineraryId: string, updates: Partial<TripFinancial>) => {
        try {
            // Map camelCase to snake_case for DB
            const dbUpdates: any = {};
            if (updates.commissionRate !== undefined) dbUpdates.commission_rate = updates.commissionRate;
            if (updates.commissionAmount !== undefined) dbUpdates.commission_amount = updates.commissionAmount;
            if (updates.clientPrice !== undefined) dbUpdates.client_price = updates.clientPrice;
            if (updates.tripId !== undefined) dbUpdates.trip_id = updates.tripId;

            if (Object.keys(dbUpdates).length > 0) {
                const { error } = await supabase.from("itineraries").update(dbUpdates).eq("id", itineraryId);
                if (error) throw error;
            }

            // Sync local state
            const updated = financials.map(f => f.itineraryId === itineraryId ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f);
            setFinancials(updated);
            
            if (selectedTripFin?.itineraryId === itineraryId) {
                setSelectedTripFin(prev => prev ? { ...prev, ...updates } : null);
            }
        } catch (error) {
            console.error("Error updating financial:", error);
            toast({ title: "Error", description: "Failed to update record.", variant: "destructive" });
        }
    };

    // Aggregated stats
    const stats = useMemo(() => {
        let totalRevenue = 0, totalExpenses = 0, totalPaid = 0, totalPending = 0, totalCommission = 0;
        financials.forEach(f => {
            totalRevenue += f.clientPrice;
            totalExpenses += f.expenses.reduce((s, e) => s + e.amount, 0);
            const paid = f.payments.reduce((s, p) => s + p.amount, 0);
            totalPaid += paid;
            totalPending += f.clientPrice - paid;
            totalCommission += f.clientPrice * (f.commissionRate / 100);
        });
        return {
            totalRevenue, totalExpenses, totalPaid, totalPending: Math.max(0, totalPending),
            totalCommission, profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100) : 0,
            netProfit: totalRevenue - totalExpenses,
        };
    }, [financials]);

    // Monthly revenue for reports
    const monthlyData = useMemo(() => {
        const months: Record<string, { revenue: number; expenses: number; payments: number }> = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            months[key] = { revenue: 0, expenses: 0, payments: 0 };
        }
        financials.forEach(f => {
            const created = new Date(f.createdAt);
            const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
            if (months[key]) {
                months[key].revenue += f.clientPrice;
                months[key].expenses += f.expenses.reduce((s, e) => s + e.amount, 0);
                months[key].payments += f.payments.reduce((s, p) => s + p.amount, 0);
            }
        });
        return Object.entries(months).map(([key, data]) => {
            const [y, m] = key.split('-');
            return { month: new Date(parseInt(y), parseInt(m) - 1).toLocaleString('default', { month: 'short' }), ...data };
        });
    }, [financials]);

    const addPayment = async (itineraryId: string, payment: Omit<Payment, 'id'>) => {
        try {
            const { data, error } = await supabase.from("trip_payments").insert([{
                itinerary_id: itineraryId,
                amount: payment.amount,
                date: payment.date,
                method: payment.method,
                type: payment.type,
                reference: payment.reference,
                notes: payment.notes
            }]).select();

            if (error) throw error;

            toast({ title: 'Payment Recorded', description: `Recorded payment of ${cs()} ${payment.amount.toLocaleString()}.` });
            setShowAddPayment(false);
            fetchFinancials(); // Refresh all to keep stats synced
        } catch (error) {
            console.error("Error adding payment:", error);
            toast({ title: "Error", description: "Failed to record payment.", variant: "destructive" });
        }
    };

    const deletePayment = async (itineraryId: string, paymentId: string) => {
        try {
            const { error } = await supabase.from("trip_payments").delete().eq("id", paymentId);
            if (error) throw error;
            fetchFinancials();
        } catch (error) {
            console.error("Error deleting payment:", error);
            toast({ title: "Error", description: "Failed to delete payment.", variant: "destructive" });
        }
    };

    const addExpense = async (itineraryId: string, expense: Omit<Expense, 'id'>) => {
        try {
            const { data, error } = await supabase.from("trip_expenses").insert([{
                itinerary_id: itineraryId,
                category: expense.category,
                vendor: expense.vendor,
                description: expense.description,
                amount: expense.amount,
                date: expense.date,
                is_paid: expense.isPaid
            }]).select();

            if (error) throw error;

            toast({ title: 'Expense Added', description: `Recorded expense of ${cs()} ${expense.amount.toLocaleString()}.` });
            setShowAddExpense(false);
            fetchFinancials();
        } catch (error) {
            console.error("Error adding expense:", error);
            toast({ title: "Error", description: "Failed to record expense.", variant: "destructive" });
        }
    };

    const deleteExpense = async (itineraryId: string, expenseId: string) => {
        try {
            const { error } = await supabase.from("trip_expenses").delete().eq("id", expenseId);
            if (error) throw error;
            fetchFinancials();
        } catch (error) {
            console.error("Error deleting expense:", error);
            toast({ title: "Error", description: "Failed to delete expense.", variant: "destructive" });
        }
    };

    const generateInvoice = (fin: TripFinancial): InvoiceData => {
        const totalPaid = fin.payments.reduce((s, p) => s + p.amount, 0);
        const taxRate = 18;
        const taxAmount = fin.clientPrice * (taxRate / 100);
        return {
            invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
            clientName: fin.clientName,
            clientEmail: '',
            tripTitle: fin.tripTitle,
            destination: fin.destination,
            items: [
                { description: `Trip Package: ${fin.tripTitle}`, amount: fin.clientPrice },
                ...fin.expenses.filter(e => !e.isPaid).map(e => ({ description: `${e.category}: ${e.description}`, amount: 0 })),
            ],
            subtotal: fin.clientPrice,
            taxRate,
            taxAmount,
            total: fin.clientPrice + taxAmount,
            amountPaid: totalPaid,
            balanceDue: fin.clientPrice + taxAmount - totalPaid,
            issuedDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
            currency: fin.currency,
            agentName: userName || 'Travel Agent',
            agentEmail: userEmail,
            companyName: 'Odyssey Luxe',
        };
    };

    const tabs: { key: FinanceTab; label: string }[] = [
        { key: 'payments', label: 'Payments' },
        { key: 'expenses', label: 'Expenses' },
        { key: 'commissions', label: 'Commissions' },
        { key: 'invoices', label: 'Invoices' },
        { key: 'reports', label: 'Reports' },
    ];

    // Payment form state
    const [payAmt, setPayAmt] = useState('');
    const [payMethod, setPayMethod] = useState<string>('bank_transfer');
    const [payType, setPayType] = useState<string>('advance');
    const [payRef, setPayRef] = useState('');
    const [payNotes, setPayNotes] = useState('');

    // Expense form state
    const [expAmt, setExpAmt] = useState('');
    const [expCat, setExpCat] = useState<string>('hotel');
    const [expVendor, setExpVendor] = useState('');
    const [expDesc, setExpDesc] = useState('');

    const resetPaymentForm = () => { setPayAmt(''); setPayMethod('bank_transfer'); setPayType('advance'); setPayRef(''); setPayNotes(''); };
    const resetExpenseForm = () => { setExpAmt(''); setExpCat('hotel'); setExpVendor(''); setExpDesc(''); };

    useEffect(() => {
        if (paymentMethods.length > 0 && !payMethod) setPayMethod(paymentMethods[0].value);
        if (paymentTypes.length > 0 && !payType) setPayType(paymentTypes[0].value);
        if (expenseCategories.length > 0 && !expCat) setExpCat(expenseCategories[0].value);
    }, [paymentMethods, paymentTypes, expenseCategories, payMethod, payType, expCat]);

    const cs = (currency?: Currency) => getCurrencySymbol(currency || (agencySettings as any)?.default_currency || DEFAULT_CURRENCY);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Revenue', value: `${cs()} ${stats.totalRevenue.toLocaleString()}`, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
                    { label: 'Payments Received', value: `${cs()} ${stats.totalPaid.toLocaleString()}`, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                    { label: 'Pending Amount', value: `${cs()} ${stats.totalPending.toLocaleString()}`, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                    { label: 'Profit Margin', value: `${stats.profitMargin.toFixed(1)}%`, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                ].map(card => (
                    <div key={card.label} className={`p-4 rounded-xl border ${card.bg}`}>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{card.label}</p>
                        <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveFinTab(tab.key)}
                        className={cn(
                            "flex-1 text-xs font-medium py-2 px-3 rounded-md transition-all",
                            activeFinTab === tab.key
                                ? "bg-purple-500/20 text-purple-400"
                                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Payments Tab */}
            {activeFinTab === 'payments' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-300">Payment Tracking</h3>
                    </div>
                    <div className="space-y-3">
                        {financials.map(fin => {
                            const totalPaid = fin.payments.reduce((s, p) => s + p.amount, 0);
                            const paidPct = fin.clientPrice > 0 ? (totalPaid / fin.clientPrice * 100) : 0;
                            return (
                                <div key={fin.tripId} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-white">{fin.clientName}</p>
                                            <p className="text-xs text-gray-500">{fin.tripTitle} · {fin.destination}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-white">{cs(fin.currency)}{fin.clientPrice.toLocaleString()}</p>
                                            <p className={cn("text-xs", paidPct >= 100 ? "text-green-400" : paidPct > 0 ? "text-amber-400" : "text-gray-500")}>
                                                {paidPct >= 100 ? "Fully Paid" : `${paidPct.toFixed(0)}% collected`}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-500", paidPct >= 100 ? "bg-green-500" : paidPct > 50 ? "bg-blue-500" : "bg-amber-500")}
                                            style={{ width: `${Math.min(paidPct, 100)}%` }}
                                        />
                                    </div>
                                    {/* Payment list */}
                                    {fin.payments.length > 0 && (
                                        <div className="space-y-1.5">
                                            {fin.payments.map(p => (
                                                <div key={p.id} className="flex items-center justify-between px-3 py-2 bg-white/[0.03] rounded-lg text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-0 text-[10px] capitalize">{p.type}</Badge>
                                                        <span className="text-gray-400">{p.method.replace('_', ' ')}</span>
                                                        {p.reference && <span className="text-gray-600">#{p.reference}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-green-400 font-medium">{cs(fin.currency)}{p.amount.toLocaleString()}</span>
                                                        <span className="text-gray-600">{new Date(p.date).toLocaleDateString()}</span>
                                                        <button onClick={() => deletePayment(fin.itineraryId, p.id)} className="text-gray-600 hover:text-red-400 transition-colors"><TrashIcon /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs border-white/10 bg-transparent text-gray-400 hover:bg-white/10 w-full"
                                        onClick={() => { setSelectedTripFin(fin); setShowAddPayment(true); resetPaymentForm(); }}
                                    >
                                        <PlusIcon /> <span className="ml-1">Record Payment</span>
                                    </Button>
                                </div>
                            );
                        })}
                        {financials.length === 0 && (
                            <div className="text-center py-12 text-gray-500 text-sm">No active trips found. Start organizing a trip to track payments.</div>
                        )}
                    </div>
                </div>
            )}

            {/* Expenses Tab */}
            {activeFinTab === 'expenses' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-300">Expense Tracking</h3>
                        <p className="text-xs text-gray-500">Total: {cs()} {stats.totalExpenses.toLocaleString()}</p>
                    </div>
                    <div className="space-y-3">
                        {financials.map(fin => {
                            const totalExp = fin.expenses.reduce((s, e) => s + e.amount, 0);
                            const margin = fin.clientPrice > 0 ? ((fin.clientPrice - totalExp) / fin.clientPrice * 100) : 0;
                            return (
                                <div key={fin.tripId} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-white">{fin.clientName} — {fin.tripTitle}</p>
                                            <p className="text-xs text-gray-500">Client Price: {cs(fin.currency)}{fin.clientPrice.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-red-400">-{cs(fin.currency)}{totalExp.toLocaleString()}</p>
                                            <p className={cn("text-xs", margin > 20 ? "text-green-400" : margin > 0 ? "text-amber-400" : "text-red-400")}>
                                                {margin.toFixed(0)}% margin
                                            </p>
                                        </div>
                                    </div>
                                    {fin.expenses.length > 0 && (
                                        <div className="space-y-1.5">
                                            {fin.expenses.map(e => (
                                                <div key={e.id} className="flex items-center justify-between px-3 py-2 bg-white/[0.03] rounded-lg text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="bg-pink-500/10 text-pink-400 border-0 text-[10px] capitalize">{e.category}</Badge>
                                                        <span className="text-gray-300">{e.vendor}</span>
                                                        <span className="text-gray-600">{e.description}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-red-400 font-medium">{cs(fin.currency)}{e.amount.toLocaleString()}</span>
                                                        <button onClick={() => deleteExpense(fin.itineraryId, e.id)} className="text-gray-600 hover:text-red-400 transition-colors"><TrashIcon /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs border-white/10 bg-transparent text-gray-400 hover:bg-white/10 w-full"
                                        onClick={() => { setSelectedTripFin(fin); setShowAddExpense(true); resetExpenseForm(); }}
                                    >
                                        <PlusIcon /> <span className="ml-1">Add Expense</span>
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Commissions Tab */}
            {activeFinTab === 'commissions' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-300">Commission Calculator</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Default Rate:</span>
                            <Input
                                type="number"
                                value={commissionRate}
                                onChange={e => {
                                    const rate = parseFloat(e.target.value) || 0;
                                    setCommissionRate(rate);
                                    // Update all trip commission rates
                                    const updated = financials.map(f => ({ ...f, commissionRate: rate, commissionAmount: f.clientPrice * (rate / 100) }));
                                    setFinancials(updated);
                                }}
                                className="w-16 h-7 text-xs bg-white/5 border-white/10 text-white text-center"
                            />
                            <span className="text-xs text-gray-500">%</span>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Total Commission Earned</p>
                            <p className="text-2xl font-bold text-purple-400">{cs()} {stats.totalCommission.toLocaleString()}</p>
                        </div>
                        <DollarIcon />
                    </div>
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
                                {financials.map(fin => (
                                    <tr key={fin.tripId} className="hover:bg-white/5 transition-colors">
                                        <td className="p-3 text-gray-300">{fin.clientName}</td>
                                        <td className="p-3 text-gray-500">{fin.tripTitle}</td>
                                        <td className="p-3 text-right text-gray-300">{cs(fin.currency)}{fin.clientPrice.toLocaleString()}</td>
                                        <td className="p-3 text-right">
                                            <Input
                                                type="number"
                                                value={fin.commissionRate}
                                                onChange={e => {
                                                    const rate = parseFloat(e.target.value) || 0;
                                                    updateFinancial(fin.itineraryId, { commissionRate: rate, commissionAmount: fin.clientPrice * (rate / 100) });
                                                }}
                                                className="w-14 h-6 text-[11px] bg-white/5 border-white/10 text-white text-center inline-block"
                                            />
                                            <span className="text-gray-600 ml-0.5">%</span>
                                        </td>
                                        <td className="p-3 text-right text-green-400 font-medium">{cs(fin.currency)}{(fin.clientPrice * (fin.commissionRate / 100)).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Invoices Tab */}
            {activeFinTab === 'invoices' && (
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-300">Invoice Generation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {financials.map(fin => {
                            const totalPaid = fin.payments.reduce((s, p) => s + p.amount, 0);
                            const balance = fin.clientPrice - totalPaid;
                            return (
                                <div key={fin.tripId} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-white">{fin.clientName}</p>
                                            <p className="text-xs text-gray-500">{fin.tripTitle}</p>
                                        </div>
                                        <Badge variant="secondary" className={cn("text-[10px] border-0", balance <= 0 ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400")}>
                                            {balance <= 0 ? "Paid" : `${cs()} ${balance.toLocaleString()} due`}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="p-2 bg-white/[0.03] rounded-lg">
                                            <p className="text-[10px] text-gray-500">Total</p>
                                            <p className="text-xs font-bold text-white">{cs(fin.currency)}{fin.clientPrice.toLocaleString()}</p>
                                        </div>
                                        <div className="p-2 bg-white/[0.03] rounded-lg">
                                            <p className="text-[10px] text-gray-500">Paid</p>
                                            <p className="text-xs font-bold text-green-400">{cs(fin.currency)}{totalPaid.toLocaleString()}</p>
                                        </div>
                                        <div className="p-2 bg-white/[0.03] rounded-lg">
                                            <p className="text-[10px] text-gray-500">Balance</p>
                                            <p className={cn("text-xs font-bold", balance > 0 ? "text-amber-400" : "text-green-400")}>{cs(fin.currency)}{Math.max(0, balance).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs border-white/10 bg-transparent text-gray-400 hover:bg-white/10 w-full"
                                        onClick={() => {
                                            if (onOpenFinances) onOpenFinances(fin.itineraryId);
                                        }}
                                    >
                                        <PrintIcon /> <span className="ml-1">Manage Finances & Invoice</span>
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Reports Tab */}
            {activeFinTab === 'reports' && (
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-300">Financial Reports</h3>
                    {/* KPI Summary Row */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Net Profit</p>
                            <p className={cn("text-lg font-bold mt-1", stats.netProfit >= 0 ? "text-green-400" : "text-red-400")}>
                                {cs()} {stats.netProfit.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Commissions</p>
                            <p className="text-lg font-bold mt-1 text-purple-400">{cs()} {stats.totalCommission.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Active Trips</p>
                            <p className="text-lg font-bold mt-1 text-white">{financials.length}</p>
                        </div>
                    </div>
                    {/* Monthly Chart (Bar Style) */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChartIcon />
                            <h4 className="text-sm font-semibold text-gray-300">Monthly Overview (Last 6 Months)</h4>
                        </div>
                        <div className="grid grid-cols-6 gap-2 items-end h-[160px]">
                            {monthlyData.map(m => {
                                const maxVal = Math.max(...monthlyData.map(d => Math.max(d.revenue, d.expenses, d.payments)), 1);
                                return (
                                    <div key={m.month} className="flex flex-col items-center gap-1 h-full justify-end">
                                        <div className="w-full flex gap-0.5 h-full items-end justify-center">
                                            <div className="w-3 bg-blue-500/60 rounded-t" style={{ height: `${(m.revenue / maxVal * 100)}%`, minHeight: m.revenue > 0 ? '4px' : '0' }} title={`Revenue: ${cs()} ${m.revenue.toLocaleString()}`} />
                                            <div className="w-3 bg-red-500/60 rounded-t" style={{ height: `${(m.expenses / maxVal * 100)}%`, minHeight: m.expenses > 0 ? '4px' : '0' }} title={`Expenses: ${cs()} ${m.expenses.toLocaleString()}`} />
                                            <div className="w-3 bg-green-500/60 rounded-t" style={{ height: `${(m.payments / maxVal * 100)}%`, minHeight: m.payments > 0 ? '4px' : '0' }} title={`Payments: ${cs()} ${m.payments.toLocaleString()}`} />
                                        </div>
                                        <span className="text-[10px] text-gray-500">{m.month}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-4 mt-3 justify-center">
                            <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-sm bg-blue-500/60 inline-block" /> Revenue</span>
                            <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-sm bg-red-500/60 inline-block" /> Expenses</span>
                            <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-sm bg-green-500/60 inline-block" /> Payments</span>
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
                                    {financials.map(fin => {
                                        const totalExp = fin.expenses.reduce((s, e) => s + e.amount, 0);
                                        const profit = fin.clientPrice - totalExp;
                                        const margin = fin.clientPrice > 0 ? (profit / fin.clientPrice * 100) : 0;
                                        return (
                                            <tr key={fin.itineraryId} className="hover:bg-white/5">
                                                <td className="p-2">
                                                    <p className="text-gray-300">{fin.clientName}</p>
                                                    <p className="text-gray-600">{fin.tripTitle}</p>
                                                </td>
                                                <td className="p-2 text-right text-white">{cs(fin.currency)}{fin.clientPrice.toLocaleString()}</td>
                                                <td className="p-2 text-right text-red-400">{cs(fin.currency)}{totalExp.toLocaleString()}</td>
                                                <td className={cn("p-2 text-right font-medium", profit >= 0 ? "text-green-400" : "text-red-400")}>{cs(fin.currency)}{profit.toLocaleString()}</td>
                                                <td className="p-2 text-right">
                                                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", margin > 20 ? "bg-green-500/10 text-green-400" : margin > 0 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400")}>
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
            )}

            {/* Add Payment Dialog */}
            <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
                <DialogContent className="bg-[#0A0A0A] border border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            {selectedTripFin ? `${selectedTripFin.clientName} — ${selectedTripFin.tripTitle}` : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-gray-400 mb-1">Amount ({cs(selectedTripFin?.currency)})</Label>
                                <Input type="number" value={payAmt} onChange={e => setPayAmt(e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder="0" />
                            </div>
                            <div>
                                <Label className="text-xs text-gray-400 mb-1">Type</Label>
                                <Select value={payType} onValueChange={(v: string) => setPayType(v)}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {paymentTypes.map(pt => (
                                            <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-gray-400 mb-1">Payment Method</Label>
                            <Select value={payMethod} onValueChange={(v: string) => setPayMethod(v)}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {paymentMethods.map(pm => (
                                        <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs text-gray-400 mb-1">Reference #</Label>
                            <Input value={payRef} onChange={e => setPayRef(e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder="Transaction ID" />
                        </div>
                        <div>
                            <Label className="text-xs text-gray-400 mb-1">Notes</Label>
                            <Input value={payNotes} onChange={e => setPayNotes(e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder="Optional notes" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="border-white/10 text-gray-400 hover:bg-white/10" onClick={() => setShowAddPayment(false)}>Cancel</Button>
                        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => {
                            if (!selectedTripFin || !payAmt) return;
                            addPayment(selectedTripFin.itineraryId, {
                                itineraryId: selectedTripFin.itineraryId,
                                amount: parseFloat(payAmt),
                                date: new Date().toISOString(),
                                method: payMethod as any,
                                type: payType as any,
                                reference: payRef,
                                notes: payNotes,
                            });
                        }}>Record Payment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Expense Dialog */}
            <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
                <DialogContent className="bg-[#0A0A0A] border border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Expense</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            {selectedTripFin ? `${selectedTripFin.clientName} — ${selectedTripFin.tripTitle}` : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-gray-400 mb-1">Amount ({cs(selectedTripFin?.currency)})</Label>
                                <Input type="number" value={expAmt} onChange={e => setExpAmt(e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder="0" />
                            </div>
                            <div>
                                <Label className="text-xs text-gray-400 mb-1">Category</Label>
                                <Select value={expCat} onValueChange={(v: string) => setExpCat(v)}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {expenseCategories.map(ec => (
                                            <SelectItem key={ec.value} value={ec.value}>{ec.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-gray-400 mb-1">Vendor Name</Label>
                            <Input value={expVendor} onChange={e => setExpVendor(e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder="e.g. Taj Hotels" />
                        </div>
                        <div>
                            <Label className="text-xs text-gray-400 mb-1">Description</Label>
                            <Input value={expDesc} onChange={e => setExpDesc(e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder="e.g. 3 nights stay" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="border-white/10 text-gray-400 hover:bg-white/10" onClick={() => setShowAddExpense(false)}>Cancel</Button>
                        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => {
                            if (!selectedTripFin || !expAmt) return;
                            addExpense(selectedTripFin.itineraryId, {
                                itineraryId: selectedTripFin.itineraryId,
                                amount: parseFloat(expAmt),
                                date: new Date().toISOString(),
                                category: expCat as any,
                                vendor: expVendor,
                                description: expDesc,
                                isPaid: true,
                            });
                        }}>Add Expense</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
