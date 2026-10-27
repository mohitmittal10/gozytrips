"use client";

import { useState, useEffect, useCallback } from "react";
import { extractWhatsAppLead } from "@/ai/flows/extract-whatsapp-lead";
import { fetchJson, FetchHttpError } from "@/lib/fetch-json";
import type { ExtractedWhatsAppLead, IngestedWhatsAppLeadRecord } from "@/types/enquiry";
import { useToast } from "@/hooks/use-toast";

export function useWhatsAppIngest() {
  const [leads, setLeads] = useState<IngestedWhatsAppLeadRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedLead, setExtractedLead] = useState<ExtractedWhatsAppLead | null>(null);
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson<{ success: boolean; leads: IngestedWhatsAppLeadRecord[] }>("/api/enquiry/whatsapp-ingest");
      setLeads(data.leads || []);
    } catch (err: unknown) {
      const message =
        err instanceof FetchHttpError
          ? (err.body as { error?: string })?.error || err.message
          : err instanceof Error
            ? err.message
            : "Failed to load WhatsApp leads";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleExtractLead = useCallback(async (
    rawChat: string,
    options?: { defaultPhone?: string; defaultName?: string }
  ) => {
    setExtracting(true);
    setError(null);
    try {
      const res = await extractWhatsAppLead({
        rawChat,
        defaultPhone: options?.defaultPhone,
        defaultName: options?.defaultName,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to extract lead details.");
      }

      const parsed: ExtractedWhatsAppLead = {
        ...res.data,
        rawChat,
      };

      setExtractedLead(parsed);
      toast({
        title: "Lead Extracted Successfully",
        description: `Identified inquiry for ${parsed.destinations} (${parsed.adultPax} adults).`,
      });
      return parsed;
    } catch (err: any) {
      const msg = err.message || "Extraction failed. Please check the chat format and try again.";
      setError(msg);
      toast({
        title: "Extraction Failed",
        description: msg,
        variant: "destructive",
      });
      return null;
    } finally {
      setExtracting(false);
    }
  }, [toast]);

  const handleSaveLead = useCallback(async (
    lead: ExtractedWhatsAppLead,
    options?: { linkExistingClientId?: string; createClient?: boolean }
  ) => {
    setSaving(true);
    setError(null);
    try {
      const data = await fetchJson<{
        success: boolean;
        responseId: string;
        clientId: string | null;
        redirectUrl: string;
        message?: string;
      }>("/api/enquiry/whatsapp-ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead,
          linkExistingClientId: options?.linkExistingClientId,
          createClient: options?.createClient ?? true,
        }),
      });

      toast({
        title: "Lead Saved to CRM",
        description: `${lead.clientName}'s enquiry for ${lead.destinations} is now persisted.`,
      });

      await fetchLeads();
      return data;
    } catch (err: any) {
      const message =
        err instanceof FetchHttpError
          ? (err.body as { error?: string })?.error || err.message
          : err instanceof Error
            ? err.message
            : "Failed to save lead";
      setError(message);
      toast({
        title: "Save Failed",
        description: message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setSaving(false);
    }
  }, [fetchLeads, toast]);

  const handleDeleteLead = useCallback(async (responseId: string) => {
    try {
      await fetchJson(`/api/enquiry/whatsapp-ingest?responseId=${responseId}`, {
        method: "DELETE",
      });
      toast({
        title: "Lead Removed",
        description: "Enquiry has been deleted.",
      });
      await fetchLeads();
      return true;
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message || "Could not delete lead",
        variant: "destructive",
      });
      return false;
    }
  }, [fetchLeads, toast]);

  return {
    leads,
    loading,
    extracting,
    saving,
    error,
    extractedLead,
    setExtractedLead,
    handleExtractLead,
    handleSaveLead,
    handleDeleteLead,
    fetchLeads,
  };
}
