import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { BackupService } from '@/services/backup';

export const dynamic = 'force-dynamic';

const BACKUP_CONCURRENCY_LIMIT = Number(process.env.BACKUP_CRON_CONCURRENCY || 5);

function authorizeCron(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error('[BackupCron] CRON_SECRET is not configured — refusing request');
    return false;
  }

  const headerSecret =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.headers.get('x-cron-secret');
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret');
  const provided = headerSecret || querySecret;

  if (!provided || provided.length !== expected.length) {
    return false;
  }

  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const supabaseAdmin = createClient<Database>(supabaseUrl, serviceKey);

  try {
    const { data: users, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, backup_frequency, last_backup_date, google_refresh_token')
      .neq('backup_frequency', 'none')
      .not('google_refresh_token', 'is', null);

    if (fetchError) throw fetchError;

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as { userId: string; error: string }[],
    };

    const usersToProcess = users || [];
    const concurrencyLimit = Number.isFinite(BACKUP_CONCURRENCY_LIMIT) && BACKUP_CONCURRENCY_LIMIT > 0
      ? BACKUP_CONCURRENCY_LIMIT
      : 5;
    let i = 0;

    const processUser = async (user: (typeof usersToProcess)[number]) => {
      results.processed++;

      if (BackupService.shouldRunBackup(user as any)) {
        try {
          console.log(`[BackupCron] Running backup for user: ${user.id}`);
          await BackupService.performBackup(supabaseAdmin, user.id);
          results.successful++;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`[BackupCron] Backup failed for user ${user.id}:`, message);
          results.failed++;
          results.errors.push({ userId: user.id, error: message });
        }
      } else {
        results.skipped++;
      }
    };

    const execWorker = async (): Promise<void> => {
      while (i < usersToProcess.length) {
        const index = i++;
        await processUser(usersToProcess[index]);
      }
    };

    const workers = Array.from({
      length: Math.min(concurrencyLimit, usersToProcess.length),
    }).map(execWorker);
    await Promise.all(workers);

    return NextResponse.json(results);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[BackupCron] Critical error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
