import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createServerComponentClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/profile?error=NoCode`);
  }

  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/profile?error=Unauthorized`);
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${origin}/api/google/callback`
  );

    try {
      const { tokens } = await oauth2Client.getToken(code);
      console.log('Google OAuth tokens received:', !!tokens.refresh_token);

      if (tokens.refresh_token) {
        const { error: dbError } = await supabase
          .from('user_profiles')
          .update({ google_refresh_token: tokens.refresh_token })
          .eq('id', user.id);
          
        if (dbError) {
          console.error('Failed to save refresh token to DB:', dbError);
        }
      } else {
        console.warn('No refresh token returned by Google (was this previously authorized?)');
      }

      return NextResponse.redirect(`${origin}/profile?google_connected=true`);
    } catch (error) {
    console.error('Error exchanging oauth token', error);
    return NextResponse.redirect(`${origin}/profile?error=OAuthFailed`);
  }
}
