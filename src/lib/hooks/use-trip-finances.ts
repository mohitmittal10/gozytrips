"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { type Database } from "@/types/supabase";

export type TripLineItem = Database["public"]["Tables"]["trip_line_items"]["Row"];
export type InsertTripLineItem = Omit<Database["public"]["Tables"]["trip_line_items"]["Insert"], "id" | "created_at" | "updated_at">;

export function useTripFinances(itineraryId: string | undefined | null) {
  const [lineItems, setLineItems] = useState<TripLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchLineItems = useCallback(async () => {
    if (!user || !itineraryId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('trip_line_items')
        .select('*')
        .eq('itinerary_id', itineraryId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      
      setLineItems(data as TripLineItem[]);
    } catch (err: any) {
      console.error("Error fetching trip line items:", err);
      setError(err?.message || "Failed to fetch line items");
    } finally {
      setLoading(false);
    }
  }, [user, itineraryId, supabase]);

  useEffect(() => {
    fetchLineItems();
  }, [fetchLineItems]);

  const addLineItem = async (item: Omit<InsertTripLineItem, "itinerary_id">) => {
    if (!user) throw new Error("Must be logged in to update");
    if (!itineraryId) throw new Error("No itinerary ID provided");
    
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from('trip_line_items')
        .insert({
          ...item,
          itinerary_id: itineraryId
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      setLineItems(prev => [...prev, data as TripLineItem]);
      return data as TripLineItem;
    } catch (err: any) {
      console.error("Error adding line item:", err);
      const msg = err?.message || "Failed to add line item";
      setError(msg);
      throw new Error(msg);
    }
  };

  const updateLineItem = async (id: string, updates: Partial<InsertTripLineItem>) => {
    if (!user) throw new Error("Must be logged in to update");
    
    setError(null);
    try {
      const { data, error: updateError } = await supabase
        .from('trip_line_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      setLineItems(prev => prev.map(item => item.id === id ? (data as TripLineItem) : item));
      return data as TripLineItem;
    } catch (err: any) {
      console.error("Error updating line item:", err);
      const msg = err?.message || "Failed to update line item";
      setError(msg);
      throw new Error(msg);
    }
  };

  const deleteLineItem = async (id: string) => {
    if (!user) throw new Error("Must be logged in to delete");
    
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('trip_line_items')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      setLineItems(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (err: any) {
      console.error("Error deleting line item:", err);
      const msg = err?.message || "Failed to delete line item";
      setError(msg);
      throw new Error(msg);
    }
  };

  // Derived metrics
  const metrics = {
    totalNet: lineItems.reduce((sum, item) => sum + Number(item.net_cost), 0),
    totalMarkupAmount: lineItems.reduce((sum, item) => sum + (Number(item.net_cost) * (Number(item.markup_percentage) / 100)), 0),
    totalGross: lineItems.reduce((sum, item) => sum + (Number(item.net_cost) * (1 + Number(item.markup_percentage) / 100)), 0),
  };

  return {
    lineItems,
    loading,
    error,
    metrics,
    fetchLineItems,
    addLineItem,
    updateLineItem,
    deleteLineItem
  };
}

