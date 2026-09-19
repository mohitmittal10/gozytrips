'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ReferenceOption {
  id: string;
  scope: string;
  value: string;
  label: string;
  sort_order: number;
  is_active: boolean;
  metadata: any;
}

// Module-level cache: keyed by scope string (or "__all__" for undefined scope).
// Persists across component mounts so tab-switching doesn't trigger a fresh DB
// round-trip and the loading→data transition that causes visible flicker.
const optionsCache = new Map<string, ReferenceOption[]>();

export function useReferenceOptions(scope?: string) {
  const cacheKey = scope ?? '__all__';
  const cached = optionsCache.get(cacheKey);

  const [options, setOptions] = useState<ReferenceOption[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached); // skip loading state if already cached
  const [error, setError] = useState<Error | null>(null);
  const supabase = useMemo(() => createClient(), []);
  // Track whether we already kicked off a fetch for this scope in this session
  const hasFetchedRef = useRef(Boolean(cached));

  useEffect(() => {
    // If we already have cached data, skip the fetch entirely
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    async function fetchOptions() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('Supabase environment variables are missing in the browser');
        setError(new Error('Supabase environment variables are missing'));
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        let query = supabase
          .from('reference_options')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (scope) {
          query = query.eq('scope', scope);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        const result = data || [];
        optionsCache.set(cacheKey, result);
        setOptions(result);
      } catch (err: any) {
        console.error('Error fetching reference options:', {
          message: err.message,
          code: err.code,
          details: err.details,
          hint: err.hint,
          scope
        });
        setError(err instanceof Error ? err : new Error(err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchOptions();
  }, [supabase, scope, cacheKey]);

  const getOptionsByScope = (targetScope: string) => {
    return options.filter(opt => opt.scope === targetScope);
  };

  return {
    options,
    loading,
    error,
    getOptionsByScope
  };
}
