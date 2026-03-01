'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  company_name: string | null;
  business_email: string | null;
  business_phone: string | null;
  website: string | null;
  brand_color: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Set up auth state listener — only update user state synchronously.
    // Do NOT perform any async Supabase calls (like fetching profile) inside
    // this callback, as it holds the auth lock and will cause contention.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        setUserProfile(null);
      }
      setLoading(false);
    });

    // Fallback timeout in case onAuthStateChange doesn't fire
    const timeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn('[Auth] Fallback: resolving loading state after timeout');
        }
        return false;
      });
    }, 5000);

    return () => {
      subscription?.unsubscribe();
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user profile separately — this runs AFTER the auth lock is released,
  // preventing the "Lock broken by another request" error
  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id);
    }
  }, [user]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found
        console.error('Error fetching user profile:', error);
      } else if (data) {
        setUserProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
