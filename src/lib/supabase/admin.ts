import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Use this client ONLY in server environments (like API routes or server actions)
// where you need to bypass Row Level Security (RLS).
// Never expose the SERVICE_ROLE_KEY to the client.
export const createAdminClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
