import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { BackupService } from '@/services/backup';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Basic security check
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use service role to bypass RLS and fetch all users
  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Fetch users who have automated backups enabled
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
      errors: [] as any[]
    };

    const usersToProcess = users || [];
    
    // Process backups in parallel with a concurrency limit
    const concurrencyLimit = 5;
    let i = 0;
    
    const processUser = async (user: any) => {
      results.processed++;
      
      if (BackupService.shouldRunBackup(user as any)) {
        try {
          console.log(`[BackupCron] Running backup for user: ${user.id}`);
          await BackupService.performBackup(supabaseAdmin, user.id);
          results.successful++;
        } catch (err: any) {
          console.error(`[BackupCron] Backup failed for user ${user.id}:`, err);
          results.failed++;
          results.errors.push({ userId: user.id, error: err.message });
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

    const workers = Array.from({ length: Math.min(concurrencyLimit, usersToProcess.length) }).map(execWorker);
    await Promise.all(workers);

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('[BackupCron] Critical error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
