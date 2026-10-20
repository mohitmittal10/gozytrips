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
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const prefix = isNegative ? "\u2011" : "";
  
  if (currency === 'INR' || locale === 'en-IN') {
    if (absVal >= 10000000) return `${prefix}${symbol}${(absVal / 10000000).toFixed(2)}Cr`;
    if (absVal >= 100000) return `${prefix}${symbol}${(absVal / 100000).toFixed(2)}L`;
  } else {
    if (absVal >= 1000000) return `${prefix}${symbol}${(absVal / 1000000).toFixed(1)}M`;
    if (absVal >= 1000) return `${prefix}${symbol}${(absVal / 1000).toFixed(1)}k`;
  }
  
  return `${prefix}${symbol}${Math.round(absVal).toLocaleString(locale)}`;
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

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

  // Use non-breaking hyphen (\u2011) for negative sign so browser word-breaking
  // never splits the negative sign from the currency symbol and amount onto its own line
  return formatted.replace(/^-/, '\u2011').replace(/-\s*/, '\u2011');
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
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return formatted.replace(/^-/, '\u2011').replace(/-\s*/, '\u2011');
}

