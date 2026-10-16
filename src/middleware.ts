import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Refreshes the auth session cookie and blocks unauthenticated access
 * to admin/debug API surfaces at the edge.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    await supabase.auth.getUser();
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/token-stats')) {
    const hasApiKey = !!request.headers.get('x-api-key');
    const hasSession = request.cookies
      .getAll()
      .some((c) => c.name.includes('auth-token') || c.name.startsWith('sb-'));
    if (!hasApiKey && !hasSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/api/token-stats/:path*',
    '/token-usage',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
