import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { timingSafeEqual } from 'crypto';

/**
 * Mirrors the cron auth helper logic (kept in sync with
 * src/app/api/backup/cron/route.ts) for unit coverage without Next runtime.
 */
function authorizeCron(
  request: { headers: Headers; url: string },
  envSecret: string | undefined
): boolean {
  if (!envSecret) return false;

  const headerSecret =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.headers.get('x-cron-secret');
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret');
  const provided = headerSecret || querySecret;

  if (!provided || provided.length !== envSecret.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(envSecret));
  } catch {
    return false;
  }
}

describe('backup cron auth (fail-closed)', () => {
  it('rejects when CRON_SECRET is unset', () => {
    const req = {
      headers: new Headers({ authorization: 'Bearer anything' }),
      url: 'http://localhost/api/backup/cron',
    };
    expect(authorizeCron(req, undefined)).toBe(false);
  });

  it('accepts matching Authorization Bearer header', () => {
    const secret = 'super-secret-cron';
    const req = {
      headers: new Headers({ authorization: `Bearer ${secret}` }),
      url: 'http://localhost/api/backup/cron',
    };
    expect(authorizeCron(req, secret)).toBe(true);
  });

  it('accepts matching x-cron-secret header', () => {
    const secret = 'super-secret-cron';
    const req = {
      headers: new Headers({ 'x-cron-secret': secret }),
      url: 'http://localhost/api/backup/cron',
    };
    expect(authorizeCron(req, secret)).toBe(true);
  });

  it('rejects wrong secret', () => {
    const req = {
      headers: new Headers({ authorization: 'Bearer wrong-secret-xx' }),
      url: 'http://localhost/api/backup/cron',
    };
    expect(authorizeCron(req, 'super-secret-cron')).toBe(false);
  });

  it('still accepts legacy query secret', () => {
    const secret = 'super-secret-cron';
    const req = {
      headers: new Headers(),
      url: `http://localhost/api/backup/cron?secret=${secret}`,
    };
    expect(authorizeCron(req, secret)).toBe(true);
  });
});
