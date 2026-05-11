'use client';

import { useState, useEffect, useMemo } from 'react';
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

export function useReferenceOptions(scope?: string) {
  const [options, setOptions] = useState<ReferenceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
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
        setOptions(data || []);
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
  }, [supabase, scope]);

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

