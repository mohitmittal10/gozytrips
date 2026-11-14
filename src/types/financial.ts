import { Currency } from './pricing';

// A single milestone from The Lab's pricing config
export interface PaymentMilestone {
    label: string;        // e.g. "Advance Payment"
    percentage: number;   // e.g. 30
    dueDate?: string;     // ISO date string, optional
    daysBeforeTrip?: number; // alternative to absolute date
}

// A line item seeded from itinerary_data (hotel, flight, cab, bus)
export interface SuggestedExpense {
    category: 'hotel' | 'flight' | 'transport' | 'activity' | 'other';
    vendor: string;
    description: string;
    amount: number;
    currency?: string;
    alreadySeeded?: boolean; // true if already exists in trip_expenses
}

// Detailed itemized line item for professional client invoices (Net base cost + tax, NO markup)
export interface InvoiceLineItem {
    id: string;
    category: 'hotel' | 'flight' | 'transport' | 'activity' | 'service' | 'package' | 'other' | string;
    title: string;
    details?: string;
    pax?: string;
    qty?: number | string;
    rate: number;         // net base cost before tax (NO markup)
    taxRate?: number;     // tax percentage (e.g. 5, 12, 18)
    taxAmount?: number;   // rate * (taxRate / 100)
    totalAmount?: number; // rate + taxAmount (NO markup)
}

// Financial record for a single trip
export interface TripFinancial {
    id?: string;                 // Database primary key (UUID)
    itineraryId: string;         // Link to itinerary
    tripId: string;              // Human readable ID (e.g. GT-1001)
    clientId: string;
    clientName: string;
    clientEmail: string;         // Auto-filled from clients table
    tripTitle: string;
    destination: string;
    status: string;              // draft | sent | proposed | booked | cancelled
    startDate?: string;          // yyyy-MM-dd
    endDate?: string;            // yyyy-MM-dd

    // Revenue
    clientPrice: number;         // What the client pays (budget or quoted price)
    baseCost?: number;           // Net base cost before markup
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

    // Payment milestones from The Lab pricing config
    milestones: PaymentMilestone[];

    // Suggested expenses from itinerary line items (hotels, flights, etc.)
    suggestedExpenses: SuggestedExpense[];

    // Detailed itemized invoice line items
    lineItems?: InvoiceLineItem[];

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
    isAuto?: boolean;            // True if automatically synced from itinerary vendor items
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
