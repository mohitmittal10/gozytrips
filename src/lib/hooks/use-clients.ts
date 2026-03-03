"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchClients = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Ensure tags is always an array
      const processedData = (data || []).map(client => ({
        ...client,
        tags: client.tags || []
      })) as Client[];
      
      setClients(processedData);
    } catch (err: any) {
      console.error("Error fetching clients:", err);
      setError(err?.message || "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const createClientAction = async (newClient: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error("Must be logged in to create a client");
    
    setError(null);
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          ...newClient,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      const addedClient = { ...data, tags: data.tags || [] } as Client;
      setClients(prev => [addedClient, ...prev]);
      return addedClient;
    } catch (err: any) {
      console.error("Error creating client:", err);
      const msg = err?.message || "Failed to create client";
      setError(msg);
      throw new Error(msg);
    }
  };

  const updateClientAction = async (id: string, updates: Partial<Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const updatedClient = { ...data, tags: data.tags || [] } as Client;
      setClients(prev => prev.map(c => c.id === id ? updatedClient : c));
      return updatedClient;
    } catch (err: any) {
      console.error("Error updating client:", err);
      const msg = err?.message || "Failed to update client";
      setError(msg);
      throw new Error(msg);
    }
  };

  const deleteClientAction = async (id: string) => {
    setError(null);
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      console.error("Error deleting client:", err);
      const msg = err?.message || "Failed to delete client";
      setError(msg);
      throw new Error(msg);
    }
  };

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient: createClientAction,
    updateClient: updateClientAction,
    deleteClient: deleteClientAction
  };
}
