import { NextRequest, NextResponse } from 'next/server';
import { getTokenStats, clearTokenLogs } from '@/lib/token-tracker';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const flowName = searchParams.get('flowName') || undefined;
    const model = searchParams.get('model') || undefined;
    const daysBack = Math.min(parseInt(searchParams.get('daysBack') || '30'), 365);

    const stats = await getTokenStats(flowName, model, daysBack);

    return NextResponse.json(stats, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching token stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token statistics' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Add a safety check - ensure this is only called in dev mode or with a secret
    const authToken = request.headers.get('x-api-key');
    const expectedToken = process.env.TOKEN_TRACKER_SECRET;

    if (process.env.NODE_ENV === 'production' && (!authToken || authToken !== expectedToken)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await clearTokenLogs();
    return NextResponse.json({ success: true, message: 'Token logs cleared' });
  } catch (error) {
    console.error('Error clearing token logs:', error);
    return NextResponse.json(
      { error: 'Failed to clear token logs' },
      { status: 500 }
    );
  }
}
