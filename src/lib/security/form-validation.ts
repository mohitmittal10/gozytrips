import { z } from 'zod';

import type { BookingServiceType } from '@/types/standalone-bookings';

const BOOKING_SERVICE_TYPES: BookingServiceType[] = ['flight', 'cab', 'bus', 'train', 'hotel'];
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const PHONE_DIGIT_COUNT_PATTERN = /^\+?[1-9]\d{6,14}$/;
const TAG_PATTERN = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s-]{0,29}$/u;
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\p{N} .,'’-]{1,99}$/u;
const TITLE_PATTERN = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .,'’:/()#&+-]{2,119}$/u;
const REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 /#_.-]{1,49}$/;
const NOTE_PATTERN = /^[\p{L}\p{M}\p{N}\s.,'’:/()#&!?%+\-@]+$/u;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const SQLI_PATTERN =
  /(?:--|\/\*|\*\/|;\s*(?:select|insert|update|delete|drop|alter|truncate|union|exec(?:ute)?|create)\b|union\s+select|information_schema|xp_cmdshell|'\s*(?:or|and)\s*['"(]?\w+['")\s]*=\s*['"(]?\w+|"\s*(?:or|and)\s*["'(]?\w+["')\s]*=\s*["'(]?\w+)/i;
const NOSQLI_PATTERN =
  /(?:^|[\s{[(,])\$(?:where|gt|gte|lt|lte|ne|eq|in|nin|regex|expr|function|accumulator)\b|["']\$(?:where|gt|gte|lt|lte|ne|regex|expr)["']\s*:/i;
const HTML_PATTERN = /<[^>]+>|on[a-z]+\s*=|javascript:/i;
const PROMPT_INJECTION_PATTERN =
  /ignore\s+(?:all\s+)?(?:previous|prior|above|earlier)\s+instructions?|you\s+are\s+now\b|act\s+as\b|system\s*:|\[\[|\]\]|<\|(?:system|assistant|user|im_start|im_end|endoftext)\|>|jailbreak|developer\s+mode|do\s+anything\s+now|reveal\s+(?:your|the)\s+(?:system\s+)?prompt/i;
const COMMAND_INJECTION_PATTERN =
  /(?:`|\$\(|&&|\|\||\|\s*(?:cat|curl|wget|bash|sh|powershell|cmd|rm|ls)\b|;\s*(?:cat|curl|wget|bash|sh|powershell|cmd|rm|ls)\b)/i;
const PATH_TRAVERSAL_PATTERN = /(?:\.\.(?:\/|\\)|%2e%2e(?:%2f|%5c)|\0|%00)/i;
const PRIVATE_HOST_PATTERN =
  /^(?:localhost|127(?:\.\d{1,3}){3}|0(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|169\.254(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|::1|fc00:|fd00:|fe80:)/i;

const COMMON_EMAIL_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
  'proton.me',
];

const COMMON_EMAIL_TYPOS: Record<string, string> = {
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'outlok.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'hotnail.com': 'hotmail.com',
  'icloud.co': 'icloud.com',
};

const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

type TextFieldOptions = {
  label: string;
  min?: number;
  max: number;
  required?: boolean;
  multiline?: boolean;
  pattern?: RegExp;
  patternMessage?: string;
  allowShellMeta?: boolean;
  allowPathFragments?: boolean;
  promptSensitive?: boolean;
};

export type PasswordStrength = {
  label: 'weak' | 'fair' | 'strong' | 'very strong';
  score: number;
  progress: number;
  feedback: string;
};

function prepareText(value: string, multiline = false): string {
  const normalized = value.normalize('NFC').replace(/\r\n?/g, '\n');
  const withoutUnsafe = normalized
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');

  if (multiline) {
    return withoutUnsafe.replace(/[ \t]{2,}/g, ' ').trim();
  }

  return withoutUnsafe.replace(/\s+/g, ' ').trim();
}

function sanitizeValidatedText(value: string, maxLength: number, multiline = false): string {
  const prepared = prepareText(value, multiline)
    .replace(/[<>]/g, '')
    .replace(/on[a-z]+\s*=/gi, '');

  return prepared.length > maxLength ? prepared.slice(0, maxLength) : prepared;
}

function collectSecurityIssues(
  value: string,
  options: Pick<TextFieldOptions, 'allowShellMeta' | 'allowPathFragments' | 'promptSensitive'>
): string[] {
  const issues: string[] = [];

  if (HTML_PATTERN.test(value)) {
    issues.push('Use plain text only. Do not paste HTML or scripts here.');
  }

  if (SQLI_PATTERN.test(value) || NOSQLI_PATTERN.test(value)) {
    issues.push('Use plain language only. Database-style operators are not allowed here.');
  }

  if (!options.allowShellMeta && COMMAND_INJECTION_PATTERN.test(value)) {
    issues.push('Use plain text only. Command-style characters are not allowed here.');
  }

  if (!options.allowPathFragments && PATH_TRAVERSAL_PATTERN.test(value)) {
    issues.push('Please remove path-like text such as ../ from this field.');
  }

  if (options.promptSensitive && PROMPT_INJECTION_PATTERN.test(value)) {
    issues.push('Please describe your request naturally without AI instructions or role-play text.');
  }

  return issues;
}

function buildTextFieldSchema(options: TextFieldOptions) {
  const {
    label,
    min = 0,
    max,
    required = true,
    multiline = false,
    pattern,
    patternMessage,
    allowShellMeta = true,
    allowPathFragments = true,
    promptSensitive = false,
  } = options;

  return z
    .string()
    .superRefine((rawValue, ctx) => {
      const prepared = prepareText(rawValue, multiline);

      if (!prepared) {
        if (required) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${label} is required.`,
          });
        }
        return;
      }

      if (prepared.length < min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must be at least ${min} characters.`,
        });
      }

      if (prepared.length > max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must be ${max} characters or fewer.`,
        });
      }

      const securityIssues = collectSecurityIssues(prepared, {
        allowShellMeta,
        allowPathFragments,
        promptSensitive,
      });

      if (securityIssues.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: securityIssues[0],
        });
      }

      if (pattern && !pattern.test(prepared)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: patternMessage ?? `Please enter a valid ${label.toLowerCase()}.`,
        });
      }
    })
    .transform((rawValue) => sanitizeValidatedText(rawValue, max, multiline));
}

function optionalTextFieldSchema(options: TextFieldOptions) {
  return buildTextFieldSchema({ ...options, required: false }).transform((value) =>
    value.length === 0 ? undefined : value
  );
}

function optionalIntegerStringField(
  label: string,
  min: number,
  max: number,
  defaultValue: string
) {
  return z
    .string()
    .superRefine((rawValue, ctx) => {
      const prepared = prepareText(rawValue, false);

      if (!prepared) {
        return;
      }

      if (!/^\d+$/.test(prepared)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must be a whole number.`,
        });
        return;
      }

      const numericValue = Number(prepared);

      if (numericValue < min || numericValue > max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must be between ${min} and ${max}.`,
        });
      }
    })
    .transform((rawValue) => {
      const prepared = prepareText(rawValue, false);
      return prepared.length === 0 ? defaultValue : prepared;
    });
}

function optionalDecimalStringField(
  label: string,
  min: number,
  max: number,
  defaultValue: string
) {
  return z
    .string()
    .superRefine((rawValue, ctx) => {
      const prepared = prepareText(rawValue, false);

      if (!prepared) {
        return;
      }

      if (!/^\d+(?:\.\d{1,2})?$/.test(prepared)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must be a valid amount with up to 2 decimals.`,
        });
        return;
      }

      const numericValue = Number(prepared);

      if (numericValue < min || numericValue > max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must be between ${min} and ${max}.`,
        });
      }
    })
    .transform((rawValue) => {
      const prepared = prepareText(rawValue, false);
      return prepared.length === 0 ? defaultValue : prepared;
    });
}

export function normalizeUnicodeNfc(value: string | undefined | null): string {
  return typeof value === 'string' ? value.normalize('NFC') : '';
}

export function encodeHtmlEntities(value: string): string {
  return value.replace(/[&<>"']/g, (match) => HTML_ENTITY_MAP[match] ?? match);
}

export function sanitizePlainText(value: string | undefined | null, maxLength: number, multiline = false): string {
  if (!value) {
    return '';
  }

  return sanitizeValidatedText(value, maxLength, multiline);
}

export function validateEmailAddress(value: string | undefined | null): boolean {
  if (!value) {
    return true;
  }

  const prepared = prepareText(value, false).toLowerCase();

  if (!prepared || prepared.length > 254 || HTML_PATTERN.test(prepared)) {
    return false;
  }

  return EMAIL_PATTERN.test(prepared);
}

export function validatePhoneNumber(value: string | undefined | null): boolean {
  if (!value) {
    return true;
  }

  const prepared = prepareText(value, false);
  if (!prepared) {
    return true;
  }

  const digitsOnly = prepared.replace(/[^\d+]/g, '');
  if (!digitsOnly) {
    return false;
  }

  const canonical = digitsOnly.startsWith('+') ? digitsOnly : `+${digitsOnly}`;
  return PHONE_DIGIT_COUNT_PATTERN.test(canonical);
}

export function formatPhoneInput(value: string): string {
  const normalized = normalizeUnicodeNfc(value)
    .replace(/[^\d+()\-\s]/g, '')
    .replace(/(?!^)\+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trimStart();

  if (!normalized) {
    return '';
  }

  const hasPlus = normalized.startsWith('+');
  const digits = normalized.replace(/\D/g, '');

  if (!digits) {
    return hasPlus ? '+' : '';
  }

  if (hasPlus) {
    const countryCodeLength = Math.min(Math.max(digits.length - 10, 1), 3);
    const countryCode = digits.slice(0, countryCodeLength);
    const rest = digits.slice(countryCodeLength, countryCodeLength + 14);
    const grouped = rest.match(/\d{1,4}/g)?.join(' ') ?? rest;
    return `+${countryCode}${grouped ? ` ${grouped}` : ''}`.slice(0, 24);
  }

  return (digits.match(/\d{1,4}/g)?.join(' ') ?? digits).slice(0, 20);
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= b.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

export function getSuggestedEmail(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }

  const prepared = prepareText(value, false).toLowerCase();
  const parts = prepared.split('@');

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  const [localPart, domain] = parts;
  const typoMatch = COMMON_EMAIL_TYPOS[domain];
  if (typoMatch) {
    return `${localPart}@${typoMatch}`;
  }

  const closestDomain = COMMON_EMAIL_DOMAINS.find((candidate) => levenshteinDistance(domain, candidate) <= 2);
  if (!closestDomain || closestDomain === domain) {
    return null;
  }

  return `${localPart}@${closestDomain}`;
}

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;

  if (password.length >= 10) score += 1;
  if (password.length >= 14) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (!/(password|123456|qwerty|letmein|welcome)/i.test(password)) score += 1;

  if (score <= 2) {
    return {
      label: 'weak',
      score,
      progress: 25,
      feedback: 'Add length plus a mix of upper, lower, number, and symbol characters.',
    };
  }

  if (score <= 4) {
    return {
      label: 'fair',
      score,
      progress: 50,
      feedback: 'Good start. Add more length or another character type.',
    };
  }

  if (score === 5) {
    return {
      label: 'strong',
      score,
      progress: 75,
      feedback: 'Strong password. A little more length makes it even better.',
    };
  }

  return {
    label: 'very strong',
    score,
    progress: 100,
    feedback: 'Very strong password.',
  };
}

export function validateAllowedHttpUrl(
  value: string | undefined | null,
  options?: { allowedHosts?: string[] }
): boolean {
  if (!value) {
    return true;
  }

  try {
    const parsed = new URL(prepareText(value, false));
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (PRIVATE_HOST_PATTERN.test(hostname)) {
      return false;
    }

    if (options?.allowedHosts && options.allowedHosts.length > 0) {
      return options.allowedHosts.includes(hostname);
    }

    return true;
  } catch {
    return false;
  }
}

export const loginFormSchema = z.object({
  email: z
    .string()
    .superRefine((rawValue, ctx) => {
      const prepared = prepareText(rawValue, false).toLowerCase();

      if (!prepared) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Email is required.',
        });
        return;
      }

      if (!validateEmailAddress(prepared)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid email address.',
        });
      }
    })
    .transform((rawValue) => prepareText(rawValue, false).toLowerCase()),
  // Passwords are validated as opaque secrets. We never sanitize or normalize them
  // because changing a password client-side can break login or alter user intent.
  password: z
    .string()
    .min(1, 'Password is required.')
    .max(128, 'Password must be 128 characters or fewer.'),
});

export const signupFormSchema = z.object({
  fullName: buildTextFieldSchema({
    label: 'Full name',
    min: 2,
    max: 100,
    pattern: NAME_PATTERN,
    patternMessage: 'Use letters, spaces, apostrophes, periods, or hyphens only.',
  }),
  email: loginFormSchema.shape.email,
  password: z
    .string()
    .min(10, 'Use at least 10 characters.')
    .max(128, 'Password must be 128 characters or fewer.')
    .superRefine((password, ctx) => {
      const strength = getPasswordStrength(password);
      if (strength.label === 'weak') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Use 10+ characters with upper, lower, number, and symbol characters.',
        });
      }
    }),
});

export const clientFormSchema = z.object({
  name: buildTextFieldSchema({
    label: 'Client name',
    min: 2,
    max: 100,
    pattern: NAME_PATTERN,
    patternMessage: 'Use letters, spaces, apostrophes, periods, or hyphens only.',
  }),
  email: z
    .string()
    .superRefine((rawValue, ctx) => {
      const prepared = prepareText(rawValue, false).toLowerCase();
      if (!prepared) {
        return;
      }

      if (!validateEmailAddress(prepared)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid email address.',
        });
      }
    })
    .transform((rawValue) => {
      const prepared = prepareText(rawValue, false).toLowerCase();
      return prepared.length === 0 ? '' : prepared;
    }),
  phone: z
    .string()
    .superRefine((rawValue, ctx) => {
      const prepared = prepareText(rawValue, false);
      if (!prepared) {
        return;
      }

      if (!validatePhoneNumber(prepared)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid phone number with country code if needed.',
        });
      }
    })
    .transform((rawValue) => formatPhoneInput(rawValue)),
  notes: optionalTextFieldSchema({
    label: 'Notes',
    max: 1000,
    multiline: true,
    promptSensitive: true,
    pattern: NOTE_PATTERN,
    patternMessage: 'Use letters, numbers, and standard punctuation only.',
  }).transform((value) => value ?? ''),
  tags: z
    .array(
      z
        .string()
        .transform((rawValue) => prepareText(rawValue, false))
        .refine((value) => TAG_PATTERN.test(value), {
          message: 'Tags can use letters, numbers, spaces, and hyphens only.',
        })
    )
    .max(20, 'Use 20 tags or fewer.')
    .transform((tags) => {
      const seen = new Set<string>();
      return tags
        .map((tag) => tag.slice(0, 30))
        .filter((tag) => {
          const key = tag.toLowerCase();
          if (seen.has(key)) {
            return false;
          }

          seen.add(key);
          return true;
        });
    }),
});

export const standaloneBookingFormSchema = z.object({
  serviceType: z.enum(BOOKING_SERVICE_TYPES as [BookingServiceType, ...BookingServiceType[]]),
  title: buildTextFieldSchema({
    label: 'Title',
    min: 3,
    max: 120,
    pattern: TITLE_PATTERN,
    patternMessage: 'Use plain text with letters, numbers, and normal punctuation.',
  }),
  clientId: z
    .string()
    .refine((value) => value === 'none' || UUID_PATTERN.test(value), {
      message: 'Select a valid client.',
    }),
  passengers: optionalIntegerStringField('Passengers', 1, 20, '1'),
  provider: optionalTextFieldSchema({
    label: 'Provider / operator',
    max: 100,
    pattern: TITLE_PATTERN,
    patternMessage: 'Use plain text with letters, numbers, and normal punctuation.',
  }).transform((value) => value ?? ''),
  pnr: optionalTextFieldSchema({
    label: 'PNR / confirmation',
    max: 50,
    pattern: REFERENCE_PATTERN,
    patternMessage: 'Use letters, numbers, spaces, slashes, dots, underscores, or hyphens only.',
    allowShellMeta: false,
    allowPathFragments: false,
  }).transform((value) => value ?? ''),
  netCost: optionalDecimalStringField('Net cost', 0, 1_000_000_000, '0'),
  markupPercentage: optionalDecimalStringField('Markup', 0, 1000, '0'),
  notes: optionalTextFieldSchema({
    label: 'Additional notes',
    max: 1000,
    multiline: true,
    promptSensitive: true,
    pattern: NOTE_PATTERN,
    patternMessage: 'Use letters, numbers, and standard punctuation only.',
  }).transform((value) => value ?? ''),
  currency: z
    .string()
    .transform((value) => prepareText(value, false).toUpperCase())
    .refine((value) => CURRENCY_PATTERN.test(value), {
      message: 'Currency must be a 3-letter code such as USD or INR.',
    }),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type SignupFormValues = z.infer<typeof signupFormSchema>;
export type ClientFormValues = z.infer<typeof clientFormSchema>;
export type StandaloneBookingFormValues = z.infer<typeof standaloneBookingFormSchema>;

export const GENERIC_SERVER_VALIDATION_MESSAGE = 'Invalid input.';
