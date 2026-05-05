import { google } from 'googleapis';

export function getGoogleOAuth2Client(origin: string) {
  return new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${origin}/api/google/callback`
  );
}
