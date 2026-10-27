"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchJson, FetchHttpError } from "@/lib/fetch-json";
import { useToast } from "@/hooks/use-toast";
import type { WhatsAppMetaIntegration } from "@/types/enquiry";

export function useWhatsAppMetaIntegration(onLeadsUpdated?: () => void) {
  const [integration, setIntegration] = useState<WhatsAppMetaIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const onLeadsUpdatedRef = useRef(onLeadsUpdated);
  useEffect(() => {
    onLeadsUpdatedRef.current = onLeadsUpdated;
  }, [onLeadsUpdated]);

  // 1. Fetch current integration status
  const fetchIntegration = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJson<{
        connected: boolean;
        integration: WhatsAppMetaIntegration | null;
      }>("/api/integrations/whatsapp-meta");

      if (data.connected && data.integration) {
        setIntegration(data.integration);
      } else {
        setIntegration(null);
      }
    } catch (err) {
      console.warn("Could not load WhatsApp & Meta integration status:", err);
      setIntegration(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegration();
  }, [fetchIntegration]);

  // 2. Connect Account (Fast 1-click or Custom Credentials)
  const connectAccount = useCallback(async (params: {
    accountName: string;
    phoneNumber: string;
    provider?: string;
    metaPageName?: string;
    metaAdAccountId?: string;
    metaFormId?: string;
    metaAccessToken?: string;
    wabaId?: string;
    phoneNumberId?: string;
    autoSync?: boolean;
    syncIntervalMinutes?: number;
  }) => {
    setConnecting(true);
    setError(null);
    try {
      const res = await fetchJson<{
        success: boolean;
        message: string;
        integration: WhatsAppMetaIntegration;
      }>("/api/integrations/whatsapp-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      setIntegration(res.integration);
      toast({
        title: "Account Connected Successfully!",
        description: "WhatsApp & Meta are now linked. Inbound leads will be automatically ingested.",
      });

      // Automatically trigger an initial sync to bring in any pending leads right away
      syncLeads();

      return true;
    } catch (err: any) {
      const msg = err instanceof FetchHttpError
        ? (err.body as any)?.error || err.message
        : err.message || "Failed to connect WhatsApp & Meta account";
      setError(msg);
      toast({
        title: "Connection Failed",
        description: msg,
        variant: "destructive",
      });
      return false;
    } finally {
      setConnecting(false);
    }
  }, [toast]);

  // 3. Update Settings (e.g. toggle auto-sync)
  const updateSettings = useCallback(async (updates: Partial<WhatsAppMetaIntegration>) => {
    try {
      await fetchJson("/api/integrations/whatsapp-meta", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      setIntegration(prev => prev ? { ...prev, ...updates } : null);
      toast({
        title: "Settings Saved",
        description: "Your WhatsApp & Meta integration preferences were updated.",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Could not update settings",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // 4. Disconnect Account
  const disconnectAccount = useCallback(async () => {
    try {
      await fetchJson("/api/integrations/whatsapp-meta", {
        method: "DELETE",
      });

      setIntegration(null);
      toast({
        title: "Account Disconnected",
        description: "WhatsApp & Meta integration has been detached.",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Disconnect Failed",
        description: err.message || "Failed to disconnect",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // 5. Dynamic Sync (Fetches actual leads from Meta Graph API without any POST request needed by the user!)
  const syncLeads = useCallback(async () => {
    setSyncing(true);
    try {
      const data = await fetchJson<{
        success: boolean;
        newLeadsCount: number;
        totalMetaLeads: number;
        message: string;
      }>("/api/integrations/whatsapp-meta/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (data.newLeadsCount > 0) {
        toast({
          title: "Actual Meta Leads Ingested!",
          description: data.message,
        });
        setIntegration(prev => prev ? {
          ...prev,
          lastSyncedAt: new Date().toISOString(),
          leadsIngestedCount: (prev.leadsIngestedCount || 0) + data.newLeadsCount,
        } : null);

        // Notify parent to refresh leads list
        onLeadsUpdatedRef.current?.();
      } else {
        toast({
          title: "Sync Up-to-Date",
          description: data.message || "No new unread leads found on your Meta Lead Gen form.",
        });
      }
      return data;
    } catch (err: any) {
      toast({
        title: "Sync Failed",
        description: err.message || "Failed to fetch actual leads from Meta",
        variant: "destructive",
      });
      return null;
    } finally {
      setSyncing(false);
    }
  }, [toast]);

  // 6. Background Auto-Sync Poller
  useEffect(() => {
    if (!integration || !integration.autoSync) return;

    const intervalMinutes = Math.max(1, integration.syncIntervalMinutes || 5);
    const intervalMs = intervalMinutes * 60 * 1000;

    const timer = setInterval(() => {
      // Auto-poll silently
      syncLeads();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [integration, syncLeads]);

  return {
    integration,
    loading,
    connecting,
    syncing,
    error,
    fetchIntegration,
    connectAccount,
    updateSettings,
    disconnectAccount,
    syncLeads,
  };
}
