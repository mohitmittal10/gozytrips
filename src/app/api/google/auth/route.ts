import { NextResponse } from 'next/server';

import { createServerComponentClient } from '@/lib/supabase/server';
import { getGoogleOAuth2Client } from '@/lib/google-auth';

export async function GET(request: Request) {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const origin = new URL(request.url).origin;

  try {
    const oauth2Client = getGoogleOAuth2Client(origin);

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required to get a refresh token
      prompt: 'consent', // Forces the consent screen to ensure refresh token is returned
      scope: ['https://www.googleapis.com/auth/drive.file'],
    });

    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Error generating Google OAuth URL:', error);
    return NextResponse.json({ error: 'Failed to initialize OAuth client' }, { status: 500 });
  }
}
