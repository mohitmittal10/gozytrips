import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createServerComponentClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const origin = new URL(request.url).origin;

  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${origin}/api/google/callback`
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required to get a refresh token
    prompt: 'consent', // Forces the consent screen to ensure refresh token is returned
    scope: ['https://www.googleapis.com/auth/drive.file'],
  });

  return NextResponse.redirect(url);
}
