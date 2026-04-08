import { Currency } from './pricing';

// Financial record for a single trip
export interface TripFinancial {
    id?: string;                 // Database primary key (UUID)
    itineraryId: string;         // Link to itinerary
    tripId: string;              // Human readable ID (e.g. GT-1001)
    clientId: string;
    clientName: string;
    tripTitle: string;
    destination: string;

    // Revenue
    clientPrice: number;         // What the client pays (budget or quoted price)
    currency: Currency;

    // Vendor costs / expenses
    expenses: Expense[];

    // Payments received
    payments: Payment[];

    // Commission
    commissionRate: number;      // percentage
    commissionAmount: number;    // calculated

    // Pricing Config (Promoted from JSON blob)
    markupValue: number;
    markupType: 'percentage' | 'flat';
    taxPercentage: number;
    adultPax: number;
    childPax: number;
    infantPax: number;
    costingType: 'automatic' | 'manual';

    // Dates
    createdAt: string;
    updatedAt: string;
}

export interface Payment {
    id: string;
    itineraryId: string;         // Link to itinerary
    amount: number;
    date: string;
    method: 'bank_transfer' | 'cash' | 'upi' | 'card' | 'other';
    type: 'advance' | 'partial' | 'balance' | 'final';
    notes: string;
    reference: string;          // payment reference number
}

export interface Expense {
    id: string;
    itineraryId: string;         // Link to itinerary
    category: 'hotel' | 'flight' | 'transport' | 'activity' | 'visa' | 'insurance' | 'food' | 'guide' | 'other';
    vendor: string;
    description: string;
    amount: number;
    date: string;
    isPaid: boolean;
}

export interface InvoiceData {
    invoiceNumber: string;
    clientName: string;
    clientEmail: string;
    tripTitle: string;
    destination: string;
    items: { description: string; amount: number }[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    amountPaid: number;
    balanceDue: number;
    issuedDate: string;
    dueDate: string;
    currency: Currency;
    agentName: string;
    agentEmail: string;
    companyName: string;
}

// Helper to generate human-readable Trip ID (GT-XXXX)
export function generateTripId(): string {
    const sequence = Math.floor(1000 + Math.random() * 9000);
    return `GT-${sequence}`;
}

// Helper to generate unique IDs
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Helper to get currency symbol
export function getCurrencySymbol(currency: Currency): string {
    const symbols: Record<Currency, string> = {
        INR: '₹', USD: '$', EUR: '€', GBP: '£',
        AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'AED '
    };
    return symbols[currency] || currency;
}

// Local storage helpers for financial data
const STORAGE_KEY = 'crm_financial_data';

export function loadFinancialData(): TripFinancial[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

export function saveFinancialData(data: TripFinancial[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
