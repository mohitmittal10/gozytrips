"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { clientFormSchema } from "@/lib/security/form-validation";

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

const supabase = createClient();

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

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
  }, [user?.id]);

  // Fetch once on mount when user is available
  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user?.id]); // Only re-fetch if the user identity changes

  const createClientAction = async (newClient: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error("Must be logged in to create a client");
    
    setError(null);
    try {
      const validatedClient = clientFormSchema.parse({
        name: newClient.name,
        email: newClient.email ?? '',
        phone: newClient.phone ?? '',
        notes: newClient.notes ?? '',
        tags: newClient.tags ?? [],
      });

      // Check for duplicate name locally first for immediate feedback
      const isDuplicate = clients.some(c => c.name.toLowerCase() === validatedClient.name.toLowerCase());
      if (isDuplicate) {
        throw new Error(`A client named "${validatedClient.name}" already exists.`);
      }

      const { data, error } = await supabase
        .from('clients')
        .insert([{
          name: validatedClient.name,
          email: validatedClient.email || null,
          phone: validatedClient.phone || null,
          notes: validatedClient.notes || null,
          tags: validatedClient.tags,
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
      const rawUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) rawUpdates.name = updates.name;
      if (updates.email !== undefined) rawUpdates.email = updates.email ?? '';
      if (updates.phone !== undefined) rawUpdates.phone = updates.phone ?? '';
      if (updates.notes !== undefined) rawUpdates.notes = updates.notes ?? '';
      if (updates.tags !== undefined) rawUpdates.tags = updates.tags;

      const validatedUpdates = clientFormSchema
        .partial()
        .parse(rawUpdates);

      const payload = {
        ...(validatedUpdates.name !== undefined ? { name: validatedUpdates.name } : {}),
        ...(validatedUpdates.email !== undefined ? { email: validatedUpdates.email || null } : {}),
        ...(validatedUpdates.phone !== undefined ? { phone: validatedUpdates.phone || null } : {}),
        ...(validatedUpdates.notes !== undefined ? { notes: validatedUpdates.notes || null } : {}),
        ...(validatedUpdates.tags !== undefined ? { tags: validatedUpdates.tags } : {}),
      };

      const { data, error } = await supabase
        .from('clients')
        .update(payload)
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

