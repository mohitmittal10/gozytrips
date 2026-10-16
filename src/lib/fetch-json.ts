/**
 * Shared fetch helper with timeout and typed errors.
 * Prefer this over bare fetch('/api/...') in client hooks.
 */

export class FetchTimeoutError extends Error {
  constructor(url: string, ms: number) {
    super(`Request timed out after ${ms}ms: ${url}`);
    this.name = 'FetchTimeoutError';
  }
}

export class FetchHttpError extends Error {
  status: number;
  body: unknown;
  constructor(url: string, status: number, body: unknown) {
    super(`HTTP ${status} for ${url}`);
    this.name = 'FetchHttpError';
    this.status = status;
    this.body = body;
  }
}

export interface FetchJsonOptions extends Omit<RequestInit, 'signal'> {
  /** Timeout in milliseconds (default 30_000) */
  timeoutMs?: number;
  /** If true, throw FetchHttpError on non-2xx (default true) */
  throwOnHttpError?: boolean;
}

export async function fetchJson<T = unknown>(
  input: string | URL,
  options: FetchJsonOptions = {}
): Promise<T> {
  const { timeoutMs = 30_000, throwOnHttpError = true, ...init } = options;
  const url = typeof input === 'string' ? input : input.toString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => null);

    if (!response.ok && throwOnHttpError) {
      throw new FetchHttpError(url, response.status, body);
    }

    return body as T;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new FetchTimeoutError(url, timeoutMs);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** AbortSignal with timeout for server-side fetch (Node 18+ / undici). */
export function timeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof (AbortSignal as any).timeout === 'function') {
    return (AbortSignal as any).timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}
