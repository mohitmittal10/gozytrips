/**
 * @fileOverview Centralized input sanitization helpers.
 *
 * Client-side validation should use the Zod schemas in `form-validation.ts`.
 * These helpers remain for shared sanitization, AI flows, and legacy call sites.
 */

import {
  encodeHtmlEntities,
  sanitizePlainText,
  validateAllowedHttpUrl,
  validateEmailAddress,
  validatePhoneNumber,
} from '@/lib/security/form-validation';

/** General-purpose plain-text sanitizer for single-line fields. */
export function sanitizeText(input: string | undefined | null, maxLength = 1000): string {
  return sanitizePlainText(input, maxLength, false);
}

/**
 * Sanitizer for fields that are fed into prompts.
 * We keep newlines, normalize Unicode, remove unsafe control chars,
 * and collapse excessive padding that is commonly used in prompt attacks.
 */
export function sanitizeForPrompt(
  input: string | undefined | null,
  maxLength = 500
): string {
  return sanitizePlainText(input, maxLength, true).replace(/\n{3,}/g, '\n\n');
}

/** Returns true if the email is valid or empty (optional fields). */
export function validateEmail(email: string | undefined | null): boolean {
  return validateEmailAddress(email);
}

/** Returns true if the phone is valid or empty (optional fields). */
export function validatePhone(phone: string | undefined | null): boolean {
  return validatePhoneNumber(phone);
}

/** Returns true if the URL is valid or empty (optional fields). */
export function validateUrl(url: string | undefined | null): boolean {
  return validateAllowedHttpUrl(url);
}

/** Returns true if the value matches Indian GST format, or is empty. */
export function validateGST(gst: string | undefined | null): boolean {
  if (!gst || gst.trim() === '') return true;
  return /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(gst.trim().toUpperCase());
}

/** Returns true if the hex color is valid (e.g. #0066cc). */
export function validateHexColor(color: string | undefined | null): boolean {
  if (!color || color.trim() === '') return true;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color.trim());
}

/**
 * Sanitizes an array of tags.
 * - Letters, numbers, spaces, hyphens only
 * - Max 30 chars each
 * - Max 20 tags total
 */
export function sanitizeTags(tags: string[]): string[] {
  const cleaned = tags
    .map((tag) => sanitizePlainText(tag, 30, false))
    .filter((tag) => /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s-]{0,29}$/u.test(tag));

  const seen = new Set<string>();
  return cleaned
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 20);
}

/** Encode text for non-React HTML sinks such as raw email templates or CMS previews. */
export { encodeHtmlEntities };

/** Zod refinement: validates email format. Pass to `.refine()`. */
export const zodEmail = (val: string | undefined | null) =>
  validateEmail(val) || 'Please enter a valid email address.';

/** Zod refinement: validates phone format. */
export const zodPhone = (val: string | undefined | null) =>
  validatePhone(val) || 'Please enter a valid phone number.';

/** Zod refinement: validates URL. */
export const zodUrl = (val: string | undefined | null) =>
  validateUrl(val) || 'Please enter a valid URL starting with https://.';

/** Zod refinement: validates Indian GST. */
export const zodGST = (val: string | undefined | null) =>
  validateGST(val) || 'Please enter a valid GST number.';
