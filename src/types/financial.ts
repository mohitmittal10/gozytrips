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
    method: string; // 'bank_transfer' | 'cash' | 'upi' | 'card' | 'other'
    type: string;   // 'advance' | 'partial' | 'balance' | 'final'
    notes: string;
    reference: string;          // payment reference number
}

export interface Expense {
    id: string;
    itineraryId: string;         // Link to itinerary
    category: string; // 'hotel' | 'flight' | 'transport' | 'activity' | 'visa' | 'insurance' | 'food' | 'guide' | 'other'
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

// Helper to get currency symbol
export function getCurrencySymbol(currency: Currency): string {
    try {
        const format = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        });
        return format.formatToParts(0).find(p => p.type === 'currency')?.value || currency;
    } catch (e) {
        return currency;
    }
}

