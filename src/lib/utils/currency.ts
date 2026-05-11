import { Currency, DEFAULT_CURRENCY } from "@/types/pricing";

/**
 * Authoritative map of currency symbols.
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
  AED: "AED ",
};

/**
 * Returns the symbol for a given currency code.
 * Fallback to DEFAULT_CURRENCY if not provided.
 */
export function getCurrencySymbol(currency?: string | null): string {
  const code = currency || DEFAULT_CURRENCY;
  return CURRENCY_SYMBOLS[code] ?? code;
}

/**
 * Formats a number as a compact currency string (e.g. 1.2L, 5M, 10Cr).
 */
export function formatCurrencyCompact(
  val: number,
  currency: Currency = DEFAULT_CURRENCY,
  locale = "en-IN"
): string {
  const symbol = getCurrencySymbol(currency);
  
  if (currency === 'INR' || locale === 'en-IN') {
    if (val >= 10000000) return `${symbol}${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `${symbol}${(val / 100000).toFixed(2)}L`;
  } else {
    if (val >= 1000000) return `${symbol}${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${symbol}${(val / 1000).toFixed(1)}k`;
  }
  
  return `${symbol}${Math.round(val).toLocaleString(locale)}`;
}

/**
 * Primary utility for formatting a number as a currency string.
 */
export function formatMoney(
  amount: number | string,
  currency: Currency = DEFAULT_CURRENCY,
  locale = "en-IN"
): string {
  const val = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/,/g, ''));
  if (isNaN(val)) return "0";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

/**
 * Alias for formatMoney for backward compatibility.
 */
export const formatCurrency = formatMoney;

/**
 * Formats a number as a currency string with decimals.
 */
export function formatMoneyWithDecimals(
  amount: number,
  currency: Currency = DEFAULT_CURRENCY,
  locale = "en-IN"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

