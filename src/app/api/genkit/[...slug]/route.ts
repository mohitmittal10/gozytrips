import { NextResponse } from 'next/server';

/**
 * Genkit HTTP exposure is disabled.
 * AI flows are invoked only via authenticated server actions
 * (which enforce getUser + rate limits + subscription checks).
 * Leaving defineNextJsHandler public would bypass those wrappers.
 */
export const maxDuration = 60;

export async function POST() {
  return NextResponse.json(
    { error: 'Genkit HTTP API is disabled. Use authenticated server actions.' },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    { error: 'Genkit HTTP API is disabled.' },
    { status: 410 }
  );
}
