"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X, MapPin, Calendar, Users, Zap, Loader2, ExternalLink, Clock,
  DollarSign, MessageSquare, Plane, Train, Bus, Car, Ship,
  Send, AlertCircle, CheckCircle2, Link2, Edit3, Save, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { ClientEnquiryResponse } from "@/types/enquiry";
import { useClientMessages } from "@/hooks/use-client-messages";

const METHOD_ICONS: Record<string, React.ReactNode> = {
  Flight: <Plane className="w-3 h-3" />,
  Train:  <Train className="w-3 h-3" />,
  Bus:    <Bus className="w-3 h-3" />,
  Cab:    <Car className="w-3 h-3" />,
  Ferry:  <Ship className="w-3 h-3" />,
};

const TRIP_TYPE_LABELS: Record<string, string> = {
  adventurous: "🏔 Adventure",
  scenic:      "📷 Scenic",
  relaxed:     "🌴 Relaxed",
  cultural:    "🏛 Cultural",
  romantic:    "❤️ Romantic",
  family:      "👨‍👩‍👧 Family",
  foodie:      "🍜 Foodie",
};

const WORKFLOW_LABELS: Record<string, { label: string; cls: string }> = {
  submitted:        { label: "Submitted",        cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  under_review:     { label: "Under Review",     cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  itinerary_ready:  { label: "Itinerary Ready",  cls: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  booked:           { label: "Booked",           cls: "bg-green-500/10 text-green-400 border-green-500/20" },
};

interface ResponseDetailSheetProps {
  response: ClientEnquiryResponse & {
    agent_note?: string | null;
    itinerary_share_url?: string | null;
    workflow_status?: string;
  };
  formId: string;
  onClose: () => void;
  onConverted?: () => void;
  convertResponse: (formId: string, responseId: string) => Promise<string>;
}

function Field({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <div className="pt-0.5 text-purple-400/70 shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-sm text-gray-200 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── Agent Messaging Panel ────────────────────────────────────────────────────
function AgentMessagesPanel({ response }: { response: ResponseDetailSheetProps["response"] }) {
  const { messages, loading, sending, error, sendMessage, markAsRead } = useClientMessages(response.id, "agent");
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    markAsRead();
  }, [messages.length, markAsRead]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const body = input;
    setInput("");
    await sendMessage(body);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clientInitial = (response.client_name || response.client_email).charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-5 h-5 text-purple-400/60" />
            </div>
            <p className="text-sm text-gray-500 font-medium">No messages yet</p>
            <p className="text-xs text-gray-700 mt-1">Start a conversation with {response.client_name || "the client"}.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isAgent = msg.sender_role === "agent";
          return (
            <div key={msg.id} className={cn("flex", isAgent ? "justify-end" : "justify-start")}>
              {!isAgent && (
                <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 text-xs font-bold shrink-0 mr-2 mt-0.5">
                  {clientInitial}
                </div>
              )}
              <div className={cn(
                "max-w-[78%] rounded-2xl px-3.5 py-2.5",
                isAgent
                  ? "bg-gradient-to-br from-purple-600/80 to-indigo-600/80 text-white rounded-br-sm"
                  : "bg-white/[0.06] border border-white/[0.08] text-gray-200 rounded-bl-sm"
              )}>
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.body}</p>
                <p className={cn("text-[10px] mt-1 opacity-60", isAgent ? "text-white/80 text-right" : "text-gray-500")}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {isAgent ? (
                    <span className="ml-1.5 font-medium">
                      {msg.is_read ? "• Read" : "• Sent"}
                    </span>
                  ) : (
                    !msg.is_read && (
                      <span className="ml-1.5 text-amber-400 font-semibold">● unread</span>
                    )
                  )}
                </p>
              </div>
            </div>
          );
        })}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <div className="flex items-end gap-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-1 pl-3 focus-within:border-purple-500/30 transition-colors">
          <textarea
            id="agent-message-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Reply to client… (Enter to send)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none resize-none py-2 leading-relaxed max-h-24 overflow-y-auto"
            style={{ minHeight: 36 }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            id="send-agent-message-btn"
            className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-gray-700 mt-1 ml-1">Shift+Enter for new line</p>
      </div>
    </div>
  );
}

// ─── Agent Controls Panel (note, status, itinerary link) ──────────────────────
function AgentControlsPanel({ response, formId }: { response: ResponseDetailSheetProps["response"]; formId: string }) {
  const [note, setNote] = useState(response.agent_note || "");
  const [shareUrl, setShareUrl] = useState(response.itinerary_share_url || "");
  const [workflowStatus, setWorkflowStatus] = useState(response.workflow_status || "submitted");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/enquiry-forms/${formId}/responses/${response.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_note: note || null,
          itinerary_share_url: shareUrl || null,
          workflow_status: workflowStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 px-5 py-4">
      {/* Workflow status selector */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">
          Client Dashboard Status
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["submitted", "under_review", "itinerary_ready", "booked"] as const).map((s) => {
            const info = WORKFLOW_LABELS[s];
            return (
              <button
                key={s}
                onClick={() => setWorkflowStatus(s)}
                className={cn(
                  "py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all text-left",
                  workflowStatus === s
                    ? info.cls + " ring-1 ring-current/30"
                    : "bg-white/[0.03] border-white/[0.07] text-gray-500 hover:text-gray-300"
                )}
              >
                {info.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Agent note for client */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5 flex items-center gap-1.5">
          <Edit3 className="w-3 h-3" /> Note for Client (shown on their dashboard)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. We're working on your itinerary! Will share within 24 hours."
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/40 text-sm transition-colors resize-none"
        />
      </div>

      {/* Itinerary share URL */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5 flex items-center gap-1.5">
          <Link2 className="w-3 h-3" /> Itinerary Link (share with client)
        </label>
        <input
          type="url"
          value={shareUrl}
          onChange={(e) => setShareUrl(e.target.value)}
          placeholder="https://… or leave blank"
          className="w-full h-10 px-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/40 text-sm transition-colors"
        />
      </div>

      {saveError && (
        <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {saveError}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        id="save-agent-controls-btn"
        className="w-full h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
        ) : saved ? (
          <><CheckCircle2 className="w-4 h-4" /> Saved!</>
        ) : (
          <><Save className="w-4 h-4" /> Save Changes</>
        )}
      </button>
    </div>
  );
}

// ─── Main Sheet ───────────────────────────────────────────────────────────────
type SheetTab = "details" | "messages" | "controls";

export function ResponseDetailSheet({ response, formId, onClose, onConverted, convertResponse }: ResponseDetailSheetProps) {
  const router = useRouter();
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SheetTab>("details");
  const { unreadCount } = useClientMessages(response.id, "agent");

  const handleConvert = async () => {
    setConverting(true);
    setError(null);
    try {
      const redirectUrl = await convertResponse(formId, response.id);
      onConverted?.();
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || "Conversion failed.");
      setConverting(false);
    }
  };

  const totalPax = response.adult_pax + response.child_pax + response.infant_pax;
  const paxStr = [
    response.adult_pax ? `${response.adult_pax} adult${response.adult_pax !== 1 ? "s" : ""}` : "",
    response.child_pax ? `${response.child_pax} child${response.child_pax !== 1 ? "ren" : ""}` : "",
    response.infant_pax ? `${response.infant_pax} infant${response.infant_pax !== 1 ? "s" : ""}` : "",
  ].filter(Boolean).join(", ");

  const statusColors: Record<string, string> = {
    pending:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
    viewed:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
    converted: "bg-green-500/10 text-green-400 border-green-500/20",
    archived:  "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  const tabs: { key: SheetTab; label: string; badge?: number }[] = [
    { key: "details",  label: "Details" },
    { key: "messages", label: "Messages", badge: unreadCount },
    { key: "controls", label: "Client View" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full sm:w-[480px] max-h-[92vh] h-full sm:h-auto bg-[#13131A] border-l border-white/[0.08] sm:border sm:rounded-2xl sm:mr-4 shadow-2xl flex flex-col animate-in slide-in-from-right-4 sm:slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/[0.07] shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border", statusColors[response.status] || statusColors.pending)}>
                {response.status}
              </span>
              {(response as any).workflow_status && (
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border", WORKFLOW_LABELS[(response as any).workflow_status]?.cls)}>
                  {WORKFLOW_LABELS[(response as any).workflow_status]?.label}
                </span>
              )}
            </div>
            <h2 className="text-base font-semibold text-white truncate">
              {response.client_name || response.client_email}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{response.client_email}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-white/[0.06] px-5 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              id={`response-sheet-tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative py-2.5 mr-4 text-xs font-semibold capitalize transition-all border-b-2 -mb-px",
                activeTab === tab.key
                  ? "text-white border-purple-500"
                  : "text-gray-500 border-transparent hover:text-gray-300"
              )}
            >
              {tab.label}
              {tab.badge && tab.badge > 0 ? (
                <span className="ml-1.5 min-w-[16px] h-[16px] bg-[#FF5C33] text-white text-[9px] font-bold rounded-full inline-flex items-center justify-center px-1">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* ── DETAILS TAB ── */}
          {activeTab === "details" && (
            <div className="p-5 space-y-5">
              {/* Trip basics */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Trip Details</p>
                <Field label="Starting From" value={response.starting_location} icon={<MapPin className="w-3.5 h-3.5" />} />
                <Field label="Destinations" value={response.destinations} icon={<MapPin className="w-3.5 h-3.5" />} />
                {response.ending_location && (
                  <Field label="Ending At" value={response.ending_location} icon={<MapPin className="w-3.5 h-3.5" />} />
                )}
                {(response.start_date || response.end_date) && (
                  <Field
                    label="Travel Dates"
                    value={[response.start_date, response.end_date].filter(Boolean).join(" → ")}
                    icon={<Calendar className="w-3.5 h-3.5" />}
                  />
                )}
                <Field label="Travellers" value={paxStr || String(totalPax)} icon={<Users className="w-3.5 h-3.5" />} />
              </div>

              {/* Preferences */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Preferences</p>
                {response.trip_type && (
                  <div className="flex gap-3">
                    <div className="pt-0.5 text-purple-400/70 shrink-0">🎯</div>
                    <div>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">Trip Style</p>
                      <p className="text-sm text-gray-200 mt-0.5">{TRIP_TYPE_LABELS[response.trip_type] || response.trip_type}</p>
                    </div>
                  </div>
                )}
                {response.travel_methods && response.travel_methods.length > 0 && (
                  <div className="flex gap-3">
                    <div className="pt-0.5 text-purple-400/70 shrink-0"><Plane className="w-3.5 h-3.5" /></div>
                    <div>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">Travel Methods</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {response.travel_methods.map((m) => (
                          <span key={m} className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-xs">
                            {METHOD_ICONS[m]} {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <Field label="Must Include" value={response.must_include} icon={<span className="text-xs">✅</span>} />
                <Field label="Things to Avoid" value={response.avoid} icon={<span className="text-xs">🚫</span>} />
                {response.travel_time_preference && response.travel_time_preference !== "no_preference" && (
                  <Field label="Timing Preference" value={response.travel_time_preference.replace(/_/g, " ")} icon={<Clock className="w-3.5 h-3.5" />} />
                )}
                {response.leisure_time && (
                  <Field label="Leisure Time" value="Requested a free day" icon={<span className="text-xs">🏖</span>} />
                )}
              </div>

              {/* Budget & notes */}
              {(response.budget || response.special_requests) && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Budget & Notes</p>
                  {response.budget && (
                    <Field
                      label="Budget"
                      value={`${response.currency} ${response.budget.toLocaleString()}`}
                      icon={<DollarSign className="w-3.5 h-3.5" />}
                    />
                  )}
                  <Field label="Special Requests" value={response.special_requests} icon={<MessageSquare className="w-3.5 h-3.5" />} />
                </div>
              )}

              {/* Timeline */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> Enquiry Timeline
                </p>
                <div className="space-y-4 relative before:absolute before:left-1 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                  {[
                    { label: "Submitted",  ts: response.submitted_at,  done: true,                    desc: "Enquiry form submitted by client" },
                    { label: "Viewed",     ts: response.viewed_at,     done: !!response.viewed_at,     desc: "Opened in agent dashboard" },
                    { label: "Converted",  ts: response.converted_at,  done: !!response.converted_at,  desc: "Converted to itinerary in The Lab" },
                  ].map((e, idx) => (
                    <div key={idx} className="flex items-start gap-4 relative">
                      <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0 z-10", e.done ? "bg-purple-500 ring-4 ring-purple-500/10" : "bg-white/10 ring-4 ring-white/[0.02]")} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn("text-xs font-semibold", e.done ? "text-white" : "text-gray-600")}>
                            {e.label} <span className={cn("text-[10px] font-normal italic ml-1", e.done ? "text-gray-400" : "text-gray-700")}>— {e.desc}</span>
                          </p>
                          {e.done && e.ts && (
                            <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded italic whitespace-nowrap">
                              {new Date(e.ts).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <span className="text-xs text-red-400">{error}</span>
                </div>
              )}
            </div>
          )}

          {/* ── MESSAGES TAB ── */}
          {activeTab === "messages" && (
            <div className="h-full flex flex-col" style={{ minHeight: 400 }}>
              <AgentMessagesPanel response={response} />
            </div>
          )}

          {/* ── CONTROLS TAB ── */}
          {activeTab === "controls" && (
            <AgentControlsPanel response={response} formId={formId} />
          )}
        </div>

        {/* CTA Footer — only on details tab */}
        {activeTab === "details" && (
          <>
            {response.status !== "converted" && (
              <div className="shrink-0 p-5 border-t border-white/[0.07]">
                <button
                  onClick={handleConvert}
                  disabled={converting}
                  id="convert-to-itinerary-btn"
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                >
                  {converting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Loading The Lab…</>
                  ) : (
                    <><Zap className="w-4 h-4" /> Generate Itinerary from This →</>
                  )}
                </button>
                <p className="text-center text-xs text-gray-600 mt-2">Opens The Lab with all fields pre-filled</p>
              </div>
            )}
            {response.status === "converted" && response.converted_itinerary_id && (
              <div className="shrink-0 p-5 border-t border-white/[0.07]">
                <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-medium">
                  <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">✓</span>
                  Already converted to an itinerary
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
