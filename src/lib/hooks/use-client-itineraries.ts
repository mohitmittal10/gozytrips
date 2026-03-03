"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import type { TravelItineraryOutput } from "@/ai/flows/generate-travel-itinerary";

// Need to duplicate part of SavedItinerary since it's not exported globally
export interface ClientItinerary {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  starting_location: string;
  ending_location: string | null;
  start_date: string;
  end_date: string;
  budget: number | null;
  client_id: string | null;
  status: string;
  itinerary_data: TravelItineraryOutput;
  created_at: string;
  updated_at: string;
}

export function useClientItineraries(clientId: string) {
  const [itineraries, setItineraries] = useState<ClientItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchClientItineraries = useCallback(async () => {
    if (!user || !clientId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('itineraries')
        .select('*')
        .eq('user_id', user.id)
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      setItineraries(data as ClientItinerary[]);
    } catch (err: any) {
      console.error("Error fetching client itineraries:", err);
      setError(err?.message || "Failed to fetch itineraries");
    } finally {
      setLoading(false);
    }
  }, [user, clientId, supabase]);

  const updateItineraryData = async (
    itineraryId: string, 
    newData: TravelItineraryOutput,
    newStatus?: string
  ) => {
    if (!user) throw new Error("Must be logged in to update");
    
    setError(null);
    try {
      const updates: any = {
        itinerary_data: newData,
        updated_at: new Date().toISOString()
      };
      
      if (newStatus) {
        updates.status = newStatus;
      }
      
      const { data, error } = await supabase
        .from('itineraries')
        .update(updates)
        .eq('id', itineraryId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      const updatedItin = data as ClientItinerary;
      setItineraries(prev => prev.map(i => i.id === itineraryId ? updatedItin : i));
      return updatedItin;
    } catch (err: any) {
      console.error("Error updating itinerary:", err);
      const msg = err?.message || "Failed to update itinerary";
      setError(msg);
      throw new Error(msg);
    }
  };

  return {
    itineraries,
    loading,
    error,
    fetchClientItineraries,
    updateItineraryData
  };
}
