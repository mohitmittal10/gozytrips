/**
 * @fileOverview Custom hook for managing agent's enquiry forms and responses.
 * Follows the existing hook patterns in the codebase (use-reference-options, etc.)
 */
import { useState, useEffect, useCallback } from "react";
import { fetchJson, FetchHttpError } from "@/lib/fetch-json";
import type { ClientEnquiryForm, ClientEnquiryResponse, CreateEnquiryFormPayload } from "@/types/enquiry";

export function useEnquiryForms() {
  const [forms, setForms] = useState<ClientEnquiryForm[]>([]);
  const [formsLoading, setFormsLoading] = useState(true);
  const [formsError, setFormsError] = useState<string | null>(null);

  const fetchForms = useCallback(async () => {
    setFormsLoading(true);
    setFormsError(null);
    try {
      const data = await fetchJson<{ forms?: ClientEnquiryForm[]; error?: string }>("/api/enquiry-forms");
      setForms(data.forms || []);
    } catch (err: unknown) {
      const message =
        err instanceof FetchHttpError
          ? (err.body as { error?: string })?.error || err.message
          : err instanceof Error
            ? err.message
            : "Failed to load forms";
      setFormsError(message);
    } finally {
      setFormsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const createForm = useCallback(async (payload: CreateEnquiryFormPayload) => {
    const data = await fetchJson<{ form: ClientEnquiryForm }>("/api/enquiry-forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await fetchForms();
    return data.form;
  }, [fetchForms]);

  const updateForm = useCallback(async (formId: string, updates: Partial<CreateEnquiryFormPayload & { status: string }>) => {
    const data = await fetchJson<{ form: ClientEnquiryForm }>(`/api/enquiry-forms/${formId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    await fetchForms();
    return data.form;
  }, [fetchForms]);

  const deleteForm = useCallback(async (formId: string) => {
    await fetchJson(`/api/enquiry-forms/${formId}`, { method: "DELETE" });
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
      const data = await fetchJson<{ responses?: ClientEnquiryResponse[]; error?: string }>(
        `/api/enquiry-forms/${id}/responses`
      );
      setResponses(data.responses || []);
    } catch (err: unknown) {
      const message =
        err instanceof FetchHttpError
          ? (err.body as { error?: string })?.error || err.message
          : err instanceof Error
            ? err.message
            : "Failed to load responses";
      setResponsesError(message);
    } finally {
      setResponsesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResponses(formId || "all");
  }, [formId, fetchResponses]);

  const convertResponse = useCallback(async (fId: string, responseId: string) => {
    const data = await fetchJson<{ redirect_url: string }>(
      `/api/enquiry-forms/${fId}/responses/${responseId}/convert`,
      { method: "POST" }
    );
    return data.redirect_url;
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
