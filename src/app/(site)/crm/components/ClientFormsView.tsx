"use client";

import React, { useState, useEffect } from "react";
import { X, Link, Copy, Check, Trash2, RefreshCw, Mail,
  AlertCircle, ExternalLink, Users, Calendar, Zap, ChevronRight,
  FileText, Clock, Plus, Inbox
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEnquiryForms, useEnquiryResponses } from "@/hooks/use-enquiry-forms";
import { CreateFormModal } from "./enquiry/CreateFormModal";
import { ResponseDetailSheet } from "./enquiry/ResponseDetailSheet";
import { useCrmContext } from "../context/CrmContext";
import type { ClientEnquiryForm, ClientEnquiryResponse } from "@/types/enquiry";

const STATUS_COLORS: Record<string, string> = {
  active:   "bg-green-500/10 text-green-400 border-green-500/20",
  draft:    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  expired:  "bg-gray-500/10 text-gray-400 border-gray-500/20",
  archived: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const RESPONSE_STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  viewed:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  converted: "bg-green-500/10 text-green-400 border-green-500/20",
  archived:  "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

function CopiedButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
        copied
          ? "bg-green-500/10 text-green-400 border-green-500/20"
          : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
      )}
      title="Copy link"
    >
      {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy Link</>}
    </button>
  );
}

// ─── Forms list ───────────────────────────────────────────────────────────────
function FormsList({
  forms,
  formsLoading,
  formsError,
  onViewResponses,
  onDelete,
  onCreateNew,
}: {
  forms: ClientEnquiryForm[];
  formsLoading: boolean;
  formsError: string | null;
  onViewResponses: (form: ClientEnquiryForm) => void;
  onDelete: (formId: string) => void;
  onCreateNew: () => void;
}) {
  const portalBase = typeof window !== "undefined" ? window.location.origin : "";

  if (formsLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 animate-pulse">
            <div className="h-4 w-48 bg-white/10 rounded mb-3" />
            <div className="h-3 w-32 bg-white/5 rounded mb-4" />
            <div className="h-8 w-full bg-white/5 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (formsError) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" />
        {formsError}
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-5">
          <Mail className="w-7 h-7 text-purple-400" />
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">No enquiry forms yet</h3>
        <p className="text-gray-500 text-sm max-w-sm mb-6">
          Create a shareable form to collect travel preferences from your clients before generating itineraries.
        </p>
        <Button
          onClick={onCreateNew}
          className="px-6 py-2.5 aurora-gradient text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2 h-10 border-none"
        >
          <Plus className="w-4 h-4" /> Create First Form
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {forms.map((form) => {
        const shareUrl = `${portalBase}/client-portal/${form.share_token}`;
        const isExpired = form.expires_at && new Date(form.expires_at) < new Date();

        return (
          <div
            key={form.id}
            className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.04] hover:border-white/10 transition-all group"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border", isExpired ? STATUS_COLORS.expired : STATUS_COLORS[form.status])}>
                    {isExpired ? "Expired" : form.status}
                  </span>
                  {form.response_count !== undefined && form.response_count > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {form.response_count} response{form.response_count !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-white truncate">{form.title}</h3>
                {form.client_name && (
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {form.client_name}
                  </p>
                )}
                {form.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{form.description}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 mt-4">
              <CopiedButton url={shareUrl} />
              <button
                onClick={() => onViewResponses(form)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-purple-500/20 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all"
              >
                <Inbox className="w-3 h-3" /> Responses {form.response_count ? `(${form.response_count})` : ""}
              </button>
              <button
                onClick={() => onDelete(form.id)}
                className="ml-auto p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                title="Archive form"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {form.expires_at && (
              <p className="text-[10px] text-gray-700 mt-3 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {isExpired ? "Expired" : "Expires"} {new Date(form.expires_at).toLocaleDateString()}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Responses list ───────────────────────────────────────────────────────────
function ResponsesList({
  responses,
  responsesLoading,
  responsesError,
  onViewResponse,
}: {
  responses: ClientEnquiryResponse[];
  responsesLoading: boolean;
  responsesError: string | null;
  onViewResponse: (r: ClientEnquiryResponse) => void;
}) {
  if (responsesLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 animate-pulse">
            <div className="h-4 w-40 bg-white/10 rounded mb-2" />
            <div className="h-3 w-60 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (responsesError) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" /> {responsesError}
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Inbox className="w-10 h-10 text-gray-700 mb-3" />
        <p className="text-gray-500 text-sm">No responses yet for this form.</p>
        <p className="text-gray-600 text-xs mt-1">Share the form link with your client to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {responses.map((r) => {
        const totalPax = r.adult_pax + r.child_pax + r.infant_pax;
        return (
          <div
            key={r.id}
            onClick={() => onViewResponse(r)}
            className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 text-purple-400 font-bold text-sm">
                {(r.client_name || r.client_email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-white">
                    {r.client_name || r.client_email}
                  </p>
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border", RESPONSE_STATUS_COLORS[r.status])}>
                    {r.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                  {r.destinations && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> {r.destinations}
                    </span>
                  )}
                  {r.start_date && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {r.start_date}
                    </span>
                  )}
                  {totalPax > 0 && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {totalPax} pax
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.status !== "converted" && (
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-purple-400 font-semibold">
                    <Zap className="w-3 h-3" /> Use
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors" />
              </div>
            </div>
            <p className="text-[10px] text-gray-700 mt-2 ml-12">
              Submitted {new Date(r.submitted_at).toLocaleString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ClientFormsView ─────────────────────────────────────────────────────
export const ClientFormsView = () => {
  const context = useCrmContext();
  const clients = (context.data?.data?.clients || []).map((c: any) => ({ id: c.id, name: c.name }));

  const [activeTab, setActiveTab] = useState<"forms" | "responses">("forms");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState<ClientEnquiryForm | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<ClientEnquiryResponse | null>(null);

  const {
    forms, formsLoading, formsError, fetchForms, createForm, deleteForm,
  } = useEnquiryForms();

  const { responses, responsesLoading, responsesError, fetchResponses, convertResponse } =
    useEnquiryResponses(selectedForm?.id || "all");

  const handleViewResponses = (form: ClientEnquiryForm) => {
    setSelectedForm(form);
    setActiveTab("responses");
  };

  const handleDelete = async (formId: string) => {
    if (!confirm("Archive this form? Clients won't be able to access it anymore.")) return;
    try {
      await deleteForm(formId);
    } catch {}
  };

  return (
    <div className="mt-4 space-y-5">
      {/* Tab bar */}
      <div className="flex items-center gap-2">
        <div className="flex bg-white/[0.03] border border-white/[0.07] rounded-xl p-1 gap-1">
          {(["forms", "responses"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                activeTab === tab
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              {tab === "forms" ? (
                <><FileText className="inline w-3 h-3 mr-1.5" />My Forms ({forms.length})</>
              ) : (
                <><Inbox className="inline w-3 h-3 mr-1.5" />
                {selectedForm ? `${selectedForm.title} — Responses` : "All Responses"}
                </>
              )}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchForms}
            className="border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 h-9 px-3 rounded-xl"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          {activeTab === "forms" && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="h-9 px-4 aurora-gradient text-white rounded-xl text-xs font-semibold hover:brightness-110 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2 border-none"
            >
              <Plus className="w-3.5 h-3.5" /> New Form
            </Button>
          )}
          {activeTab === "responses" && selectedForm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSelectedForm(null); setActiveTab("forms"); }}
              className="text-gray-500 hover:text-white h-9 text-xs"
            >
              ← Back to Forms
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === "forms" && (
        <FormsList
          forms={forms}
          formsLoading={formsLoading}
          formsError={formsError}
          onViewResponses={handleViewResponses}
          onDelete={handleDelete}
          onCreateNew={() => setShowCreateModal(true)}
        />
      )}

      {activeTab === "responses" && (
        <ResponsesList
          responses={responses}
          responsesLoading={responsesLoading}
          responsesError={responsesError}
          onViewResponse={setSelectedResponse}
        />
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateFormModal
          clients={clients}
          onClose={() => setShowCreateModal(false)}
          onCreated={(form) => { fetchForms(); }}
          createForm={createForm}
        />
      )}

      {selectedResponse && (
        <ResponseDetailSheet
          response={selectedResponse}
          formId={selectedResponse.form_id}
          onClose={() => setSelectedResponse(null)}
          onConverted={() => {
            setSelectedResponse(null);
            fetchResponses(selectedForm ? selectedForm.id : "all");
          }}
          convertResponse={convertResponse}
        />
      )}
    </div>
  );
};
