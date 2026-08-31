"use client";

import React, { useState, useEffect } from "react";
import { X, Link, Copy, Check, Trash2, RefreshCw, Mail,
  AlertCircle, ExternalLink, Users, Calendar, Zap, ChevronRight,
  FileText, Clock, Plus, Inbox, MapPin, Compass, DollarSign,
  MessageSquare, Heart, Plane, ChevronDown, ChevronUp, Edit3, Loader2
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
interface FormCardProps {
  form: ClientEnquiryForm;
  shareUrl: string;
  isExpired: boolean | null;
  onViewResponses: (form: ClientEnquiryForm) => void;
  onDelete: (formId: string) => void;
  onRename: (formId: string, newTitle: string) => Promise<void>;
}

function FormCard({ form, shareUrl, isExpired, onViewResponses, onDelete, onRename }: FormCardProps) {
  const [showFields, setShowFields] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleVal, setEditTitleVal] = useState(form.title);
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    setEditTitleVal(form.title);
  }, [form.title]);

  const handleRename = async () => {
    if (!editTitleVal.trim() || editTitleVal.trim().length < 2) {
      alert("Title must be at least 2 characters.");
      return;
    }
    if (editTitleVal.trim() === form.title) {
      setIsEditingTitle(false);
      return;
    }
    setRenaming(true);
    try {
      await onRename(form.id, editTitleVal.trim());
      setIsEditingTitle(false);
    } catch (err: any) {
      alert(err.message || "Failed to rename form");
    } finally {
      setRenaming(false);
    }
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.04] hover:border-white/10 transition-all group flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border", isExpired ? STATUS_COLORS.expired : STATUS_COLORS[form.status])}>
                {isExpired ? "Expired" : form.status}
              </span>
              {form.response_count !== undefined && form.response_count > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-zinc-300 border border-white/10">
                  {form.response_count} response{form.response_count !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {isEditingTitle ? (
              <div className="flex items-center gap-1.5 w-full mt-1.5">
                <input
                  type="text"
                  value={editTitleVal}
                  onChange={(e) => setEditTitleVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") {
                      setEditTitleVal(form.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  disabled={renaming}
                  autoFocus
                  className="flex-1 h-8 px-2 rounded-lg bg-black/50 border border-zinc-700 text-xs text-white focus:outline-none focus:border-zinc-500"
                />
                <button
                  onClick={handleRename}
                  disabled={renaming || !editTitleVal.trim() || editTitleVal.trim().length < 2}
                  className="p-1 text-green-400 hover:text-green-300 disabled:opacity-40 transition-colors shrink-0"
                  title="Save Title"
                >
                  {renaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => {
                    setEditTitleVal(form.title);
                    setIsEditingTitle(false);
                  }}
                  disabled={renaming}
                  className="p-1 text-gray-500 hover:text-gray-300 transition-colors shrink-0"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group/title mt-1 w-full">
                <h3 className="text-sm font-semibold text-white truncate max-w-[85%]">{form.title}</h3>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-0 group-hover/title:opacity-100 p-0.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-all shrink-0"
                  title="Rename Form"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

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

        {/* Toggle fields view */}
        <div className="mt-2.5 mb-1">
          <button
            onClick={() => setShowFields(!showFields)}
            className="flex items-center gap-1 text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            {showFields ? (
              <>
                Hide Fields <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                View Fields <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>

          {showFields && (
            <div className="mt-2 p-3 bg-black/40 border border-white/5 rounded-xl space-y-1.5 text-[11px] text-gray-400 animate-in fade-in duration-200">
              <p className="font-medium text-white/80 border-b border-white/5 pb-1 mb-1.5">This form collects:</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-zinc-400 shrink-0" /> <span>Start/End Locations</span></div>
                <div className="flex items-center gap-1.5"><Compass className="w-3 h-3 text-zinc-400 shrink-0" /> <span>Destinations</span></div>
                <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-zinc-400 shrink-0" /> <span>Travel Dates</span></div>
                <div className="flex items-center gap-1.5"><Users className="w-3 h-3 text-zinc-400 shrink-0" /> <span>Passenger Counts</span></div>
                <div className="flex items-center gap-1.5"><Heart className="w-3 h-3 text-zinc-400 shrink-0" /> <span>Trip Style Preference</span></div>
                <div className="flex items-center gap-1.5"><Plane className="w-3 h-3 text-zinc-400 shrink-0" /> <span>Travel Methods</span></div>
                <div className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-zinc-400 shrink-0" /> <span>Timing Preference</span></div>
                <div className="flex items-center gap-1.5"><DollarSign className="w-3 h-3 text-zinc-400 shrink-0" /> <span>Approx. Budget</span></div>
                <div className="flex items-center gap-1.5 col-span-2"><MessageSquare className="w-3 h-3 text-zinc-400 shrink-0" /> <span>Special Requests</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        {/* Footer */}
        <div className="flex items-center gap-2 mt-4">
          <CopiedButton url={shareUrl} />
          <button
            onClick={() => onViewResponses(form)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-all"
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
          <p className="text-[10px] text-gray-500 mt-3 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {isExpired ? "Expired" : "Expires"} {new Date(form.expires_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
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
  onRename,
}: {
  forms: ClientEnquiryForm[];
  formsLoading: boolean;
  formsError: string | null;
  onViewResponses: (form: ClientEnquiryForm) => void;
  onDelete: (formId: string) => void;
  onCreateNew: () => void;
  onRename: (formId: string, newTitle: string) => Promise<void>;
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
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
          <Mail className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">No enquiry forms yet</h3>
        <p className="text-gray-500 text-sm max-w-sm mb-6">
          Create a shareable form to collect travel preferences from your clients before generating itineraries.
        </p>
        <Button
          onClick={onCreateNew}
          className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 h-10"
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
        const isExpired = form.expires_at ? new Date(form.expires_at) < new Date() : null;

        return (
          <FormCard
            key={form.id}
            form={form}
            shareUrl={shareUrl}
            isExpired={isExpired}
            onViewResponses={onViewResponses}
            onDelete={onDelete}
            onRename={onRename}
          />
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
        <Inbox className="w-10 h-10 text-gray-500 mb-3" />
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
              <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-zinc-200 font-bold text-sm">
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
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-zinc-300 font-semibold">
                    <Zap className="w-3 h-3" /> Use
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 ml-12">
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
    forms, formsLoading, formsError, fetchForms, createForm, deleteForm, updateForm,
  } = useEnquiryForms();

  const handleRenameForm = async (formId: string, newTitle: string) => {
    await updateForm(formId, { title: newTitle });
  };

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
                "px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border",
                activeTab === tab
                  ? "bg-zinc-800 text-zinc-100 border-zinc-700 font-semibold shadow-sm"
                  : "border-transparent text-gray-500 hover:text-gray-300"
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
              className="h-9 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-2"
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
          onRename={handleRenameForm}
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
          onUpdated={() => {
            fetchResponses(selectedForm ? selectedForm.id : "all");
            context.data.actions.fetchWorkspaceData();
          }}
          convertResponse={convertResponse}
        />
      )}
    </div>
  );
};
