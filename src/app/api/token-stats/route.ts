import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getTokenStats, clearTokenLogs } from '@/lib/token-tracker';
import { createServerComponentClient } from '@/lib/supabase/server';

function secretMatches(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function authorizeTokenStats(request: NextRequest): Promise<boolean> {
  const apiKey = request.headers.get('x-api-key');
  if (secretMatches(apiKey, process.env.TOKEN_TRACKER_SECRET)) {
    return true;
  }

  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!(await authorizeTokenStats(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const flowName = searchParams.get('flowName') || undefined;
    const model = searchParams.get('model') || undefined;
    const daysBack = Math.min(parseInt(searchParams.get('daysBack') || '30', 10) || 30, 365);

    const stats = await getTokenStats(flowName, model, daysBack);

    return NextResponse.json(stats, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching token stats');
    return NextResponse.json(
      { error: 'Failed to fetch token statistics' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (!secretMatches(apiKey, process.env.TOKEN_TRACKER_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await clearTokenLogs();
    return NextResponse.json({ success: true, message: 'Token logs cleared' });
  } catch (error) {
    console.error('Error clearing token logs');
    return NextResponse.json(
      { error: 'Failed to clear token logs' },
      { status: 500 }
    );
  }
}
