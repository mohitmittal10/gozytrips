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



