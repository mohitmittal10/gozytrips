"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapPin, Calendar, Users, Compass, ExternalLink, Send, Loader2,
  CheckCircle2, Clock, MessageSquare, Plane, Train, Bus, Car, Ship,
  Mountain, Camera, Palmtree, Heart, Utensils,
  ChevronRight, AlertCircle, RefreshCw, Star, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useClientMessages } from "@/hooks/use-client-messages";
import type { PublicEnquiryFormMeta } from "@/types/enquiry";

// ─── Types ────────────────────────────────────────────────────────────────────
type WorkflowStatus = "submitted" | "under_review" | "itinerary_ready" | "booked";

interface EnquiryResponseData {
  id: string;
  form_id: string;
  client_name: string | null;
  client_email: string;
  starting_location: string | null;
  destinations: string | null;
  ending_location: string | null;
  start_date: string | null;
  end_date: string | null;
  adult_pax: number;
  child_pax: number;
  infant_pax: number;
  trip_type: string | null;
  travel_methods: string[];
  budget: number | null;
  currency: string;
  special_requests: string | null;
  submitted_at: string;
  agent_note: string | null;
  agent_note_updated_at: string | null;
  itinerary_share_url: string | null;
  workflow_status: WorkflowStatus;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TRIP_TYPE_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  adventurous: { label: "Adventure", icon: <Mountain className="w-4 h-4" />, color: "text-orange-400" },
  scenic:      { label: "Scenic",    icon: <Camera className="w-4 h-4" />,   color: "text-blue-400" },
  relaxed:     { label: "Relaxed",   icon: <Palmtree className="w-4 h-4" />, color: "text-green-400" },
  cultural:    { label: "Cultural",  icon: <Compass className="w-4 h-4" />,  color: "text-yellow-400" },
  romantic:    { label: "Romantic",  icon: <Heart className="w-4 h-4" />,    color: "text-pink-400" },
  family:      { label: "Family",    icon: <Users className="w-4 h-4" />,    color: "text-purple-400" },
  foodie:      { label: "Foodie",    icon: <Utensils className="w-4 h-4" />, color: "text-amber-400" },
};

const METHOD_ICONS: Record<string, React.ReactNode> = {
  Flight: <Plane className="w-3.5 h-3.5" />,
  Train:  <Train className="w-3.5 h-3.5" />,
  Bus:    <Bus className="w-3.5 h-3.5" />,
  Cab:    <Car className="w-3.5 h-3.5" />,
  Ferry:  <Ship className="w-3.5 h-3.5" />,
};

const WORKFLOW_STEPS: { key: WorkflowStatus; label: string; desc: string }[] = [
  { key: "submitted",       label: "Enquiry Submitted",  desc: "We've received your travel preferences" },
  { key: "under_review",   label: "Under Review",        desc: "Your agent is crafting your perfect trip" },
  { key: "itinerary_ready", label: "Itinerary Ready",    desc: "Your personalised plan is here!" },
  { key: "booked",          label: "Booked & Confirmed", desc: "Your adventure is locked in 🎉" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WorkflowStatus }) {
  const map: Record<WorkflowStatus, { label: string; cls: string }> = {
    submitted:        { label: "Submitted",        cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    under_review:     { label: "Under Review",     cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    itinerary_ready:  { label: "Itinerary Ready",  cls: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    booked:           { label: "Booked",           cls: "bg-green-500/10 text-green-400 border-green-500/20" },
  };
  const s = map[status] || map.submitted;
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border", s.cls)}>
      {s.label}
    </span>
  );
}

function WorkflowTimeline({ status }: { status: WorkflowStatus }) {
  const currentIdx = WORKFLOW_STEPS.findIndex((s) => s.key === status);
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-4 bottom-4 w-px bg-white/5" />
      <div className="space-y-5">
        {WORKFLOW_STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step.key} className="flex items-start gap-5 relative">
              <div className={cn(
                "w-8 h-8 rounded-full shrink-0 flex items-center justify-center z-10 transition-all duration-500",
                done
                  ? active
                    ? "bg-gradient-to-br from-[#FF5C33] to-[#EC4899] shadow-[0_0_20px_rgba(255,92,51,0.35)] ring-4 ring-[#FF5C33]/15"
                    : "bg-gradient-to-br from-[#FF5C33]/70 to-[#7C3AED]/70"
                  : "bg-white/[0.05] border border-white/10"
              )}>
                {done && !active && <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.5} />}
                {active && <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />}
                {!done && <div className="w-2 h-2 bg-white/20 rounded-full" />}
              </div>
              <div className={cn("flex-1 pt-1.5", !done && "opacity-40")}>
                <p className={cn("text-sm font-semibold", done ? "text-white" : "text-gray-500")}>
                  {step.label}
                  {active && (
                    <span className="ml-2 text-[10px] font-normal bg-[#FF5C33]/10 text-[#FF5C33] px-2 py-0.5 rounded-full border border-[#FF5C33]/20 uppercase tracking-wider">
                      Current
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TripSnapshot({ response }: { response: EnquiryResponseData }) {
  const tripType = response.trip_type ? TRIP_TYPE_MAP[response.trip_type] : null;
  const totalPax = response.adult_pax + response.child_pax + response.infant_pax;

  const items = [
    { icon: <MapPin className="w-4 h-4" />, label: "From", value: response.starting_location },
    { icon: <Compass className="w-4 h-4" />, label: "To", value: response.destinations },
    response.ending_location ? { icon: <MapPin className="w-4 h-4" />, label: "Return", value: response.ending_location } : null,
    { icon: <Calendar className="w-4 h-4" />, label: "Dates", value: response.start_date && response.end_date ? `${response.start_date} → ${response.end_date}` : null },
    { icon: <Users className="w-4 h-4" />, label: "Travellers", value: `${totalPax} traveller${totalPax !== 1 ? "s" : ""}` },
    tripType ? { icon: tripType.icon, label: "Style", value: tripType.label } : null,
    response.budget ? { icon: <Star className="w-4 h-4" />, label: "Budget", value: `${response.currency} ${response.budget.toLocaleString()}` } : null,
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string | null }[];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item, i) =>
        item.value ? (
          <div key={i} className="flex items-start gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
            <div className="p-1.5 bg-[#FF5C33]/10 rounded-lg text-[#FF5C33] shrink-0 mt-0.5">
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">{item.label}</p>
              <p className="text-sm text-gray-200 mt-0.5 font-medium break-words">{item.value}</p>
            </div>
          </div>
        ) : null
      )}
      {response.travel_methods && response.travel_methods.length > 0 && (
        <div className="sm:col-span-2 flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
          <div className="p-1.5 bg-[#FF5C33]/10 rounded-lg text-[#FF5C33] shrink-0">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold mb-1.5">Travel Methods</p>
            <div className="flex flex-wrap gap-1.5">
              {response.travel_methods.map((m) => (
                <span key={m} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300">
                  {METHOD_ICONS[m]} {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Chat Widget ──────────────────────────────────────────────────────────────
function ChatWidget({ responseId, agentName }: { responseId: string; agentName: string }) {
  const { messages, loading, sending, error, sendMessage, markAsRead } = useClientMessages(responseId, "client");
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 400 }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF5C33]/10 to-[#7C3AED]/10 border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-[#FF5C33]/60" />
            </div>
            <p className="text-sm text-gray-500 font-medium">No messages yet</p>
            <p className="text-xs text-gray-700 mt-1 max-w-xs">
              Start a conversation with {agentName}. Ask questions or share any additional details about your trip.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_role === "client";
          return (
            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
              {!isMe && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF5C33] to-[#EC4899] flex items-center justify-center text-white text-xs font-bold shrink-0 mr-2 mt-0.5">
                  {agentName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm",
                isMe
                  ? "bg-gradient-to-br from-[#FF5C33] to-[#EC4899] text-white rounded-br-sm"
                  : "bg-white/[0.07] border border-white/[0.08] text-gray-200 rounded-bl-sm"
              )}>
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.body}</p>
                <p className={cn("text-[10px] mt-1 opacity-60", isMe ? "text-white/80 text-right" : "text-gray-500")}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {isMe && (
                    <span className="ml-1.5 font-medium">
                      {msg.is_read ? "• Read" : "• Sent"}
                    </span>
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

      {/* Input bar */}
      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <div className="flex items-end gap-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-1 pl-3 focus-within:border-[#FF5C33]/30 transition-colors">
          <textarea
            id="client-message-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${agentName}… (Enter to send)`}
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none resize-none py-2 leading-relaxed max-h-28 overflow-y-auto"
            style={{ minHeight: 36 }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            id="send-client-message-btn"
            className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF5C33] to-[#EC4899] text-white flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#FF5C33]/20"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-gray-700 mt-1.5 ml-1">Shift+Enter for new line · Enter to send</p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
interface ClientDashboardProps {
  formMeta: PublicEnquiryFormMeta;
  shareToken: string;
  responseId: string;
}

type DashboardTab = "overview" | "messages";

export function ClientDashboard({ formMeta, shareToken, responseId }: ClientDashboardProps) {
  const supabase = createClient();
  const [response, setResponse] = useState<EnquiryResponseData | null>(null);
  const [loadingResponse, setLoadingResponse] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const { unreadCount } = useClientMessages(responseId, "client");

  useEffect(() => {
    async function load() {
      setLoadingResponse(true);
      try {
        const res = await fetch(`/api/enquiry-forms/${formMeta.id}/responses/${responseId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load your enquiry.");
        setResponse(data.response);
      } catch (err: any) {
        setLoadError(err.message);
      } finally {
        setLoadingResponse(false);
      }
    }
    load();

    // Subscribe to real-time response updates (workflow_status, agent_note, itinerary_share_url)
    const channel = supabase
      .channel(`response:${responseId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "client_enquiry_responses", filter: `id=eq.${responseId}` },
        (payload) => setResponse((prev) => prev ? { ...prev, ...payload.new } : prev)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [responseId, formMeta.id]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const agentName = formMeta.agent_brand_name || "Your Agent";

  if (loadingResponse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF5C33] animate-spin" />
      </div>
    );
  }

  if (loadError || !response) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-white font-semibold">Couldn't load your dashboard</p>
          <p className="text-gray-500 text-sm mt-1">{loadError}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-xs text-[#FF5C33] hover:underline flex items-center gap-1 mx-auto">
            <RefreshCw className="w-3 h-3" /> Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-20 bg-[#05070A]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {formMeta.agent_avatar_url ? (
              <img src={formMeta.agent_avatar_url} alt={agentName} className="w-8 h-8 rounded-full border border-white/10 object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF5C33] to-[#EC4899] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {agentName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] text-[#FF5C33] font-bold uppercase tracking-widest truncate">{agentName}</p>
              <p className="text-xs text-gray-400 truncate">{formMeta.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={response.workflow_status || "submitted"} />
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="p-2 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/5"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-3xl mx-auto px-4 pb-0 flex gap-1">
          {(["overview", "messages"] as const).map((tab) => (
            <button
              key={tab}
              id={`dashboard-tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "relative px-4 py-2.5 text-xs font-semibold capitalize transition-all border-b-2",
                activeTab === tab
                  ? "text-white border-[#FF5C33]"
                  : "text-gray-500 border-transparent hover:text-gray-300"
              )}
            >
              {tab === "messages" && (
                <MessageSquare className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
              )}
              {tab}
              {tab === "messages" && unreadCount > 0 && (
                <span className="ml-1.5 min-w-[18px] h-[18px] bg-[#FF5C33] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 inline-flex">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">

        {/* ══ OVERVIEW TAB ══ */}
        {activeTab === "overview" && (
          <div className="space-y-5">

            {/* Hero greeting */}
            <div className="relative bg-gradient-to-br from-[#FF5C33]/8 via-[#EC4899]/5 to-[#7C3AED]/8 border border-white/[0.06] rounded-2xl p-6 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF5C33]/3 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <p className="text-xs text-[#FF5C33] font-bold uppercase tracking-widest mb-2">Welcome back</p>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {response.client_name ? `Hi, ${response.client_name.split(" ")[0]}! 👋` : "Your Trip Dashboard"}
                </h1>
                <p className="text-gray-400 text-sm mt-2 max-w-lg">
                  Track your enquiry status, view your trip details, and chat directly with {agentName}.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  Submitted {new Date(response.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
            </div>

            {/* Agent Note (if set) */}
            {response.agent_note && (
              <div className="bg-[#FF5C33]/5 border border-[#FF5C33]/15 rounded-2xl p-4 flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF5C33] to-[#EC4899] flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                  {agentName.charAt(0)}
                </div>
                <div>
                  <p className="text-[11px] text-[#FF5C33] font-bold uppercase tracking-widest mb-1">Message from {agentName}</p>
                  <p className="text-sm text-gray-200 leading-relaxed">{response.agent_note}</p>
                  {response.agent_note_updated_at && (
                    <p className="text-[10px] text-gray-600 mt-1.5">
                      {new Date(response.agent_note_updated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Itinerary CTA (if shared) */}
            {response.itinerary_share_url && (
              <a
                href={response.itinerary_share_url}
                target="_blank"
                rel="noopener noreferrer"
                id="view-itinerary-btn"
                className="group flex items-center justify-between p-5 bg-gradient-to-r from-[#7C3AED]/10 to-[#EC4899]/10 border border-[#7C3AED]/20 rounded-2xl hover:border-[#7C3AED]/40 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#EC4899] flex items-center justify-center shadow-lg shadow-[#7C3AED]/25">
                    <ExternalLink className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">View Your Itinerary</p>
                    <p className="text-xs text-gray-500 mt-0.5">Your personalised travel plan is ready</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </a>
            )}

            {/* Status Timeline */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-5 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#FF5C33]" /> Enquiry Status
              </p>
              <WorkflowTimeline status={response.workflow_status || "submitted"} />
            </div>

            {/* Trip Snapshot */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#FF5C33]" /> Your Trip Details
              </p>
              <TripSnapshot response={response} />

              {response.special_requests && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold mb-1.5">Special Requests</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{response.special_requests}</p>
                </div>
              )}
            </div>

            {/* Message CTA */}
            <button
              onClick={() => setActiveTab("messages")}
              id="open-messages-btn"
              className="w-full flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:bg-white/[0.04] hover:border-[#FF5C33]/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FF5C33]/10 border border-[#FF5C33]/15 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-[#FF5C33]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Chat with {agentName}</p>
                  <p className="text-xs text-gray-500">Ask questions or share additional details</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#FF5C33] text-white text-[10px] font-bold rounded-full">
                    {unreadCount} new
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
            </button>
          </div>
        )}

        {/* ══ MESSAGES TAB ══ */}
        {activeTab === "messages" && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden" style={{ height: "calc(100vh - 160px)" }}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF5C33] to-[#EC4899] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {agentName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{agentName}</p>
                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Active
                </p>
              </div>
            </div>
            <div className="flex flex-col" style={{ height: "calc(100% - 65px)" }}>
              <ChatWidget responseId={responseId} agentName={agentName} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
