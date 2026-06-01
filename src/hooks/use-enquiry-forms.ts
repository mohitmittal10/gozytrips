/**
 * @fileOverview Custom hook for managing agent's enquiry forms and responses.
 * Follows the existing hook patterns in the codebase (use-reference-options, etc.)
 */
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ClientEnquiryForm, ClientEnquiryResponse, CreateEnquiryFormPayload } from "@/types/enquiry";

export function useEnquiryForms() {
  const [forms, setForms] = useState<ClientEnquiryForm[]>([]);
  const [formsLoading, setFormsLoading] = useState(true);
  const [formsError, setFormsError] = useState<string | null>(null);

  const fetchForms = useCallback(async () => {
    setFormsLoading(true);
    setFormsError(null);
    try {
      const res = await fetch("/api/enquiry-forms");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load forms");
      setForms(data.forms || []);
    } catch (err: any) {
      setFormsError(err.message);
    } finally {
      setFormsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const createForm = useCallback(async (payload: CreateEnquiryFormPayload) => {
    const res = await fetch("/api/enquiry-forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create form");
    await fetchForms();
    return data.form as ClientEnquiryForm;
  }, [fetchForms]);

  const updateForm = useCallback(async (formId: string, updates: Partial<CreateEnquiryFormPayload & { status: string }>) => {
    const res = await fetch(`/api/enquiry-forms/${formId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update form");
    await fetchForms();
    return data.form as ClientEnquiryForm;
  }, [fetchForms]);

  const deleteForm = useCallback(async (formId: string) => {
    const res = await fetch(`/api/enquiry-forms/${formId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to archive form");
    await fetchForms();
  }, [fetchForms]);

  return {
    forms,
    formsLoading,
    formsError,
    fetchForms,
    createForm,
    updateForm,
    deleteForm,
  };
}

export function useEnquiryResponses(formId: string | null) {
  const [responses, setResponses] = useState<ClientEnquiryResponse[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [responsesError, setResponsesError] = useState<string | null>(null);

  const fetchResponses = useCallback(async (id: string) => {
    setResponsesLoading(true);
    setResponsesError(null);
    try {
      const res = await fetch(`/api/enquiry-forms/${id}/responses`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load responses");
      setResponses(data.responses || []);
    } catch (err: any) {
      setResponsesError(err.message);
    } finally {
      setResponsesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResponses(formId || "all");
  }, [formId, fetchResponses]);

  const convertResponse = useCallback(async (fId: string, responseId: string) => {
    const res = await fetch(`/api/enquiry-forms/${fId}/responses/${responseId}/convert`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Conversion failed");
    return data.redirect_url as string;
  }, []);

  return {
    responses,
    responsesLoading,
    responsesError,
    fetchResponses,
    convertResponse,
    refetch: () => fetchResponses(formId || "all"),
  };
}
