export type Currency = string; // e.g. 'USD' | 'EUR' | 'GBP' | 'INR' | 'AUD' | 'CAD' | 'SGD' | 'AED'
export const DEFAULT_CURRENCY: Currency = 'INR';
export type PricingTier = string; // e.g. 'Standard' | 'Premium' | 'Luxury'

export type PaymentMilestone = {
  id: string;
  name: string; // e.g., "Advance Deposit", "Final Payment"
  percentage: number;
  dueDate: string; // e.g., "At booking", "15 days before departure"
};

export type ManualCostItem = {
  id: string;
  name: string;
  amount: number;
  type: "per-person" | "total";
  category: string; // e.g. "Flight" | "Hotel" | "Transport" | "Activity" | "Visa" | "Insurance" | "Other";
};

export type PricingConfig = {
  currency: Currency;
  markupType: 'percentage' | 'flat';
  markupValue: number;
  taxPercentage: number;
  
  // Base Pax Counts for calculations
  adultPax: number;
  childPax: number;
  infantPax: number;

  tiersEnabled: boolean;
  selectedTier: PricingTier;
  tiers: {
    [key in PricingTier]?: {
      markupValue: number; // Override markup per tier
      isActive: boolean;
    }
  };

  milestones: PaymentMilestone[];

  // Costing Mode
  costingType: 'automatic' | 'manual';
  manualOptions: ManualCostItem[];
};

export const defaultPricingConfig: PricingConfig = {
  currency: DEFAULT_CURRENCY,
  markupType: 'percentage',
  markupValue: 15,
  taxPercentage: 0,
  adultPax: 2,
  childPax: 0,
  infantPax: 0,
  tiersEnabled: false,
  selectedTier: 'Standard',
  tiers: {
    Standard: { markupValue: 10, isActive: true },
    Premium: { markupValue: 15, isActive: false },
    Luxury: { markupValue: 20, isActive: false },
  },
  milestones: [
    { id: '1', name: 'Advance', percentage: 30, dueDate: 'At booking' },
    { id: '2', name: 'Final Payment', percentage: 70, dueDate: '15 days before departure' },
  ],
  costingType: 'automatic',
  manualOptions: [],
};

