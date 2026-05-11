import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createServerComponentClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('google_refresh_token')
    .eq('id', user.id)
    .single();

  if (!profile?.google_refresh_token) {
    return NextResponse.json({ error: 'No Google integration' }, { status: 404 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: profile.google_refresh_token,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    return NextResponse.json({ access_token: credentials.access_token });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
  }
}

