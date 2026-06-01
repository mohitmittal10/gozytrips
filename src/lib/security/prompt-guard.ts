/**
 * @fileOverview Prompt injection guard utilities.
 *
 * Two main exports:
 * - detectInjectionAttempt  → heuristic scorer; blocks request if score is high
 * - wrapUserField            → wraps a user-supplied value in XML delimiters so the
 *                              LLM treats it as data, not instructions
 *
 * This is a server-side module.
 */
import { GENERIC_SERVER_VALIDATION_MESSAGE } from '@/lib/security/form-validation';

// ── Injection heuristics ──────────────────────────────────────────────────────

interface InjectionResult {
  isSuspicious: boolean;
  score: number;          // 0–100
  reasons: string[];
}

/**
 * Patterns that strongly suggest prompt injection attempts.
 * Each entry: [regex, weight (0–30), human-readable reason]
 */
const HIGH_RISK_PATTERNS: [RegExp, number, string][] = [
  // Role-switching
  [/ignore\s+(all\s+)?(previous|prior|above|earlier)\s+instructions?/i, 30, 'Ignore instructions'],
  [/you\s+are\s+now\s+(a\s+)?(?!a\s+travel)/i, 25, 'Role-switch keyword'],
  [/act\s+as\s+(a\s+)?(?!a?\s*travel)/i, 20, 'Act-as keyword'],
  [/forget\s+(everything|all|your|the)\s+(previous|prior|above|instructions)/i, 25, 'Forget instructions'],
  [/disregard\s+(all\s+)?(previous|prior|above)/i, 25, 'Disregard instructions'],

  // System prompt overrides
  [/system\s*:\s*you\s+are/i, 30, 'Fake system prompt'],
  [/\[?system\]?\s*prompt/i, 20, 'System prompt reference'],
  [/<\|?(im_start|endoftext|system|user|assistant)\|?>/i, 30, 'Special tokens'],

  // DAN / jailbreak classics
  [/\bDAN\b/, 20, 'DAN keyword'],
  [/jailbreak/i, 20, 'Jailbreak keyword'],
  [/do\s+anything\s+now/i, 25, 'DAN phrase'],
  [/developer\s+mode/i, 20, 'Developer mode keyword'],
  [/unrestricted\s+mode/i, 20, 'Unrestricted mode keyword'],

  // Output manipulation
  [/print\s+the\s+(entire\s+)?system\s+prompt/i, 25, 'Extract system prompt'],
  [/reveal\s+(your|the)\s+(system\s+)?prompt/i, 25, 'Reveal prompt'],
  [/what\s+(are\s+your|is\s+your)\s+(instructions|system\s+prompt)/i, 15, 'Extract instructions'],
  [/respond\s+only\s+in\s+json/i, 10, 'Output format override'],

  // Command injection patterns
  [/\$\([^)]*\)/, 20, 'Shell command pattern'],
  [/`[^`]{0,100}`/, 10, 'Backtick command'],

  // Excessive special chars (padding/obfuscation)
  [/(\n\s*){8,}/, 15, 'Excessive newlines'],
];

const LOW_RISK_PATTERNS: [RegExp, number, string][] = [
  [/instructions?/i, 2, 'Instruction keyword'],
  [/prompt/i, 2, 'Prompt keyword'],
  [/\bai\b/i, 1, 'AI keyword'],
  [/\bllm\b/i, 2, 'LLM keyword'],
  [/gemini|openai|chatgpt|claude/i, 3, 'LLM model name'],
];

/**
 * Heuristically scores a user-supplied string for prompt injection.
 * Returns `isSuspicious: true` if score >= 25 (configurable threshold).
 */
export function detectInjectionAttempt(
  input: string | undefined | null,
  threshold = 25
): InjectionResult {
  if (!input || input.trim().length === 0) {
    return { isSuspicious: false, score: 0, reasons: [] };
  }

  let score = 0;
  const reasons: string[] = [];

  for (const [pattern, weight, reason] of HIGH_RISK_PATTERNS) {
    if (pattern.test(input)) {
      score += weight;
      reasons.push(reason);
    }
  }

  // Only count low-risk patterns if there are already some high-risk hits
  if (score > 0) {
    for (const [pattern, weight, reason] of LOW_RISK_PATTERNS) {
      if (pattern.test(input)) {
        score += weight;
        reasons.push(reason);
      }
    }
  }

  return {
    isSuspicious: score >= threshold,
    score: Math.min(score, 100),
    reasons,
  };
}

// ── XML delimiter wrapping ────────────────────────────────────────────────────

/**
 * Wraps a user-supplied field value in XML-style delimiters.
 * This is the key architectural defence: the LLM sees user content
 * as clearly separated data, not as additional system instructions.
 *
 * @example
 * wrapUserField('feedback', 'Make it more relaxed')
 * // → '<user_feedback>\nMake it more relaxed\n</user_feedback>'
 */
export function wrapUserField(fieldName: string, value: string | undefined | null): string {
  if (!value || value.trim() === '') return '';
  const tagName = `user_${fieldName.toLowerCase().replace(/\s+/g, '_')}`;
  return `<${tagName}>\n${value.trim()}\n</${tagName}>`;
}

// ── Unified guard for server actions ─────────────────────────────────────────

/**
 * Call this in server actions before passing user input to the LLM.
 * Checks all provided freetext fields for injection attempts.
 * Throws a user-friendly error if any field is suspicious (Option A behaviour).
 *
 * @param fields - Record of { fieldLabel: userValue }
 */
export function assertNoInjection(fields: Record<string, string | undefined | null>): void {
  for (const [label, value] of Object.entries(fields)) {
    if (!value) continue;
    const result = detectInjectionAttempt(value);
    if (result.isSuspicious) {
      console.warn(`[PromptGuard] Injection attempt detected in field "${label}":`, {
        score: result.score,
        reasons: result.reasons,
        preview: value.slice(0, 100),
      });
      throw new Error(GENERIC_SERVER_VALIDATION_MESSAGE);
    }
  }
}
