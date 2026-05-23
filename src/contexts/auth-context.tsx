'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { useRouter } from 'next/navigation';
import { logAuditEvent } from '@/lib/audit-logger';
import type { AgencySettings } from '@/types/agency-settings';

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
  google_refresh_token: string | null;
  google_drive_folder_id: string | null;
  backup_frequency: string | null;
  last_backup_date: string | null;
  created_at: string;
  updated_at: string;
}

interface UserPreferences {
  user_id: string;
  default_pdf_theme: string | null;
  my_trips_preferences: any;
  crm_visible_columns: any;
  crm_sort: any;
  crm_filters: any;
  crm_filter_presets: any;
  crm_last_viewed_activity_at: string | null;
  pdf_preview_zoom: number | null;
  backup_prompt_dismissed: boolean | null;
  pending_import_backup: boolean | null;
  updated_at: string | null;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  agencySettings: AgencySettings | null;
  userPreferences: UserPreferences | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [agencySettings, setAgencySettings] = useState<AgencySettings | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
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
        setAgencySettings(null);
        setUserPreferences(null);
        setLoading(false);
      }

      // Log login events (fire-and-forget, outside of the auth lock)
      if (_event === 'SIGNED_IN' && session?.user) {
        setTimeout(() => {
          logAuditEvent(session.user.id, 'LOGIN', 'User signed in', {
            entityType: 'session',
            metadata: { provider: session.user.app_metadata?.provider || 'email' },
          });
        }, 0);
      }
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
  // preventing the "Lock broken by another request" error.
  // Depend on user?.id (a stable primitive) NOT the user object — Supabase
  // recreates the user object reference on every auth event (token refresh,
  // tab focus, SIGNED_IN, etc.) which would fire redundant RPC calls.
  useEffect(() => {
    if (user?.id) {
      bootstrapUserData(user.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const bootstrapUserData = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_bootstrap_data', {
        target_user_id: userId,
      });

      if (error) {
        console.warn('Error bootstrapping user data via RPC, falling back to parallel fetches:', error);
        // Fallback to individual fetches if RPC fails (e.g. migration not yet applied)
        await Promise.all([
          fetchUserProfile(userId),
          fetchAgencySettings(userId),
          fetchUserPreferences(userId),
        ]);
        return;
      }

      if (data) {
        const { profile, settings, preferences } = data as any;
        if (profile) setUserProfile(profile as UserProfile);
        if (settings) setAgencySettings(settings as AgencySettings);
        if (preferences) setUserPreferences(preferences as UserPreferences);
      }
    } catch (error) {
      console.error('Error in bootstrapUserData:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
      } else if (data) {
        setUserProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchAgencySettings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('agency_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching agency settings:', error);
      } else if (data) {
        setAgencySettings(data as AgencySettings);
      }
    } catch (error) {
      console.error('Error fetching agency settings:', error);
    }
  };

  const fetchUserPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user preferences:', error);
      } else if (data) {
        setUserPreferences(data as UserPreferences);
      } else {
        // Create default preferences if they don't exist
        const { data: newData, error: insertError } = await supabase
          .from('user_preferences')
          .insert([{ user_id: userId }])
          .select()
          .maybeSingle();
        
        if (!insertError && newData) {
          setUserPreferences(newData as UserPreferences);
        }
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const refreshSettings = async () => {
    if (user) {
      await fetchAgencySettings(user.id);
    }
  };

  const refreshPreferences = async () => {
    if (user) {
      await fetchUserPreferences(user.id);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          ...updates,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating user preferences:', error);
        throw error;
      } else if (data) {
        setUserPreferences(data as UserPreferences);
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Log logout before clearing the session
      if (user) {
        await logAuditEvent(user.id, 'LOGOUT', 'User signed out', {
          entityType: 'session',
        });
      }
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      setAgencySettings(null);
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      agencySettings, 
      userPreferences, 
      loading, 
      signOut, 
      refreshProfile, 
      refreshSettings, 
      refreshPreferences,
      updatePreferences
    }}>
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

