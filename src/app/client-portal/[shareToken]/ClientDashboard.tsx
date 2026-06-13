"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin, Calendar, Users, Compass, ExternalLink, Send, Loader2,
  CheckCircle2, Clock, MessageSquare, Plane, Train, Bus, Car, Ship,
  Mountain, Camera, Palmtree, Heart, Utensils, Hotel,
  ChevronRight, AlertCircle, RefreshCw, Star, LogOut, FileText, Sparkles,
  X, CreditCard, ScrollText, ShieldAlert, CheckCheck, XCircle
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
  converted_itinerary_id: string | null;
  itinerary_visible_to_client: boolean;
  itinerary_last_pushed_at: string | null;
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

// ─── Itinerary Sub-tabs Component ────────────────────────────────────────────
type ItinSubTab = "days" | "logistics" | "financials" | "inclusions";

function ItinerarySubTabs({
  days, flights, hotels, cabs, buses, itin, pricing,
  clientPrice, baseCost, markupAmount, taxAmount, taxPct, markupType, markupValue,
  totalPax, adultPax, childPax, infantPax, perPerson, milestones,
  currencySymbol, fmt, showTimestamps, dayPhotos, loadingPhotos, shareUrl,
}: any) {
  const [tab, setTab] = useState<ItinSubTab>("days");

  const tabDefs: { key: ItinSubTab; label: string }[] = [
    { key: "days",       label: `Days (${days.length})` },
    { key: "logistics",  label: "Logistics" },
    { key: "financials", label: "Financials" },
    { key: "inclusions", label: "Inclusions" },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tab bar */}
      <div className="flex gap-1 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-1 overflow-x-auto no-scrollbar">
        {tabDefs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 min-w-fit px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
              tab === t.key
                ? "bg-gradient-to-r from-[#FF5C33]/20 to-[#7C3AED]/20 border border-white/10 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-300"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DAYS ── */}
      {tab === "days" && (
        <div className="space-y-4">
          {days.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-center bg-white/[0.02] border border-white/[0.07] rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-[#FF5C33]/10 border border-[#FF5C33]/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#FF5C33]/60" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Day-by-day plan coming soon</p>
                <p className="text-xs text-gray-500 mt-1">Your agent is finalising the itinerary details.</p>
              </div>
            </div>
          ) : (
            days.map((day: any, idx: number) => {
              const timelineItems: any[] = day.timeline || day.activities || [];
              const photo = dayPhotos[idx];
              return (
                <div key={idx} className="rounded-2xl border border-white/[0.07] overflow-hidden bg-[#0a0b12]">
                  <div className="relative h-44 bg-gradient-to-br from-[#FF5C33]/20 to-[#7C3AED]/20">
                    {photo ? (
                      <img src={photo} alt={day.areaFocus || `Day ${idx + 1}`} className="w-full h-full object-cover" />
                    ) : loadingPhotos ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
                      </div>
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b12] via-[#0a0b12]/30 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF5C33] to-[#EC4899] flex items-center justify-center text-white text-sm font-black shadow-lg shadow-[#FF5C33]/30">
                        {idx + 1}
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-4 right-4">
                      <p className="text-base font-bold text-white drop-shadow-lg">
                        Day {idx + 1}{day.date ? ` · ${day.date}` : ""}
                      </p>
                      {day.areaFocus && (
                        <p className="text-[11px] text-[#FF5C33] font-semibold drop-shadow-lg">{day.areaFocus}</p>
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-4 space-y-0">
                    {timelineItems.map((item: any, aIdx: number) => {
                      const title = item.details || item.activityName || item.name || "";
                      const time = item.time || item.startTime || "";
                      const desc = item.description || "";
                      const isLast = aIdx === timelineItems.length - 1;
                      return (
                        <div key={aIdx} className="flex gap-3">
                          <div className="flex flex-col items-center" style={{ minWidth: 36 }}>
                            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#FF5C33] to-[#EC4899] shrink-0 mt-1.5 ring-2 ring-[#FF5C33]/20" />
                            {!isLast && <div className="w-px flex-1 bg-gradient-to-b from-[#FF5C33]/30 to-transparent mt-1" style={{ minHeight: 24 }} />}
                          </div>
                          <div className="flex-1 min-w-0 pb-4">
                            {showTimestamps && time && <p className="text-[10px] text-[#FF5C33] font-bold mb-0.5">{time}</p>}
                            <p className="text-sm font-semibold text-white leading-snug">{title}</p>
                            {desc && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>}
                          </div>
                        </div>
                      );
                    })}
                    {timelineItems.length === 0 && (
                      <p className="text-xs text-gray-600 py-3 text-center">Details for this day coming soon.</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── LOGISTICS ── */}
      {tab === "logistics" && (
        <div className="space-y-4">
          {[
            { icon: <Plane className="w-4 h-4 text-sky-400" />, label: "Flights", accent: "text-sky-400", items: flights, emptyMsg: "No flight details added yet", renderItem: (f: any, i: number) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{f.origin || f.from} → {f.destination || f.to}</p>
                    {f.date && <p className="text-[11px] text-gray-500 mt-0.5">{f.date}</p>}
                    {f.airline && <p className="text-[11px] text-sky-400 mt-0.5">{f.airline}{f.flightNumber ? ` · ${f.flightNumber}` : ""}</p>}
                  </div>
                  {(f.departureTime || f.arrivalTime) && (
                    <div className="text-right shrink-0">
                      {f.departureTime && <p className="text-xs font-bold text-white">{f.departureTime}</p>}
                      {f.arrivalTime && <p className="text-[10px] text-gray-500">{f.arrivalTime}</p>}
                    </div>
                  )}
                </div>
              </div>
            )},
            { icon: <Hotel className="w-4 h-4 text-amber-400" />, label: "Accommodation", accent: "text-amber-400", items: hotels, emptyMsg: "No hotel details added yet", renderItem: (h: any, i: number) => (
              <div key={i} className="px-5 py-4">
                <p className="text-sm font-bold text-white">{h.name || h.hotelName || "Hotel"}</p>
                {h.location && <p className="text-[11px] text-gray-500 mt-0.5"><MapPin className="inline w-3 h-3 mr-0.5" />{h.location}</p>}
                <div className="flex flex-wrap gap-3 mt-1.5">
                  {h.checkIn && <p className="text-[10px] text-amber-400">Check-in: {h.checkIn}</p>}
                  {h.checkOut && <p className="text-[10px] text-amber-400">Check-out: {h.checkOut}</p>}
                  {h.nights && <p className="text-[10px] text-gray-500">{h.nights} night{h.nights !== 1 ? "s" : ""}</p>}
                  {h.roomType && <p className="text-[10px] text-gray-500">{h.roomType}</p>}
                </div>
              </div>
            )},
            { icon: <Car className="w-4 h-4 text-emerald-400" />, label: "Cab / Transfer", accent: "text-emerald-400", items: cabs, emptyMsg: "No cab / transfer details added yet", renderItem: (c: any, i: number) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{c.from} → {c.to}</p>
                    {c.date && <p className="text-[11px] text-gray-500 mt-0.5">{c.date}</p>}
                    {c.serviceType && <p className="text-[11px] text-emerald-400 mt-0.5">{c.serviceType}</p>}
                  </div>
                  {c.duration && <p className="text-xs font-bold text-white shrink-0">{c.duration}</p>}
                </div>
              </div>
            )},
            { icon: <Bus className="w-4 h-4 text-purple-400" />, label: "Bus / Coach", accent: "text-purple-400", items: buses, emptyMsg: "No bus / coach details added yet", renderItem: (b: any, i: number) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{b.from} → {b.to}</p>
                    {b.date && <p className="text-[11px] text-gray-500 mt-0.5">{b.date}</p>}
                    {b.operator && <p className="text-[11px] text-purple-400 mt-0.5">{b.operator}{b.busType ? ` · ${b.busType}` : ""}</p>}
                  </div>
                  {(b.departureTime || b.arrivalTime) && (
                    <div className="text-right shrink-0">
                      {b.departureTime && <p className="text-xs font-bold text-white">{b.departureTime}</p>}
                      {b.arrivalTime && <p className="text-[10px] text-gray-500">{b.arrivalTime}</p>}
                    </div>
                  )}
                </div>
              </div>
            )},
          ].map((section) => (
            <div key={section.label} className="rounded-2xl border border-white/[0.07] overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
                {section.icon}
                <p className={cn("text-xs font-bold uppercase tracking-widest", section.accent)}>{section.label}</p>
                {section.items.length > 0 && (
                  <span className={cn("ml-auto text-[10px] font-semibold", section.accent)}>{section.items.length}</span>
                )}
              </div>
              {section.items.length === 0 ? (
                <div className="px-5 py-8 flex flex-col items-center gap-2 text-center">
                  <p className="text-xs text-gray-600">{section.emptyMsg}</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {section.items.map(section.renderItem)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── FINANCIALS ── */}
      {tab === "financials" && (
        <div className="space-y-4">
          {clientPrice > 0 ? (
            <div className="rounded-2xl border border-[#7C3AED]/25 bg-gradient-to-br from-[#7C3AED]/8 via-transparent to-[#EC4899]/5 overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-1">Total Trip Cost</p>
                <div className="flex items-end justify-between gap-3">
                  <p className="text-3xl font-black text-white">{currencySymbol}{fmt(clientPrice)}</p>
                  {totalPax > 0 && (
                    <p className="text-xs text-gray-400 mb-1">{currencySymbol}{fmt(perPerson)} <span className="text-gray-600">/ person</span></p>
                  )}
                </div>
                <p className="text-[10px] text-gray-600 mt-1">
                  {adultPax > 0 && `${adultPax} adult${adultPax !== 1 ? "s" : ""}`}
                  {childPax > 0 && `, ${childPax} child${childPax !== 1 ? "ren" : ""}`}
                  {infantPax > 0 && `, ${infantPax} infant${infantPax !== 1 ? "s" : ""}`}
                </p>
              </div>
              {baseCost > 0 && (
                <div className="px-5 py-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Base Cost</span>
                    <span className="text-gray-200 font-medium">{currencySymbol}{fmt(baseCost)}</span>
                  </div>
                  {markupAmount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Service Charge{markupType === "percentage" && markupValue > 0 ? ` (${markupValue}%)` : ""}</span>
                      <span className="text-gray-200 font-medium">+ {currencySymbol}{fmt(markupAmount)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">GST / Tax ({taxPct}%)</span>
                      <span className="text-gray-200 font-medium">+ {currencySymbol}{fmt(taxAmount)}</span>
                    </div>
                  )}
                  <div className="border-t border-white/[0.06] pt-2.5 flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Total</span>
                    <span className="text-sm font-black text-[#FF5C33]">{currencySymbol}{fmt(clientPrice)}</span>
                  </div>
                </div>
              )}
              {Array.isArray(pricing.manualOptions) && pricing.manualOptions.length > 0 && (
                <div className="px-5 pb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2.5">Cost Breakdown</p>
                  <div className="space-y-2">
                    {pricing.manualOptions.map((item: any, ii: number) => {
                      const amt = Number(item.amount) || 0;
                      const itemTotal = item.type === "per-person" ? amt * totalPax : amt;
                      return (
                        <div key={ii} className="flex items-center justify-between gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white">{item.name || item.category || "Item"}</p>
                            {item.type === "per-person" && <p className="text-[10px] text-purple-400 mt-0.5">{currencySymbol}{fmt(amt)} × {totalPax} pax</p>}
                          </div>
                          <p className="text-sm font-black text-[#FF5C33] shrink-0">{currencySymbol}{fmt(itemTotal)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {milestones.length > 0 && (
                <div className="px-5 pb-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2.5">Payment Schedule</p>
                  <div className="space-y-2">
                    {milestones.map((m: any, mi: number) => (
                      <div key={mi} className="flex items-center justify-between gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white">{m.name || m.label || `Payment ${mi + 1}`}</p>
                          {m.dueDate && <p className="text-[10px] text-gray-500 mt-0.5">Due: {m.dueDate}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-[#FF5C33]">{currencySymbol}{fmt((clientPrice * (m.percentage || 0)) / 100)}</p>
                          <p className="text-[10px] text-gray-600">{m.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-center bg-gradient-to-br from-[#7C3AED]/5 to-transparent border border-[#7C3AED]/15 rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#7C3AED]/60" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Pricing not yet finalised</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">Your agent is preparing the cost breakdown. It will appear here once ready.</p>
              </div>
            </div>
          )}
          {shareUrl && (
            <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-gradient-to-r from-[#7C3AED]/10 to-[#EC4899]/10 border border-[#7C3AED]/20 rounded-2xl hover:border-[#7C3AED]/40 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-[#7C3AED]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">View Full Invoice & Pricing</p>
                  <p className="text-xs text-gray-500">Detailed cost breakdown</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
            </a>
          )}
        </div>
      )}

      {/* ── INCLUSIONS & POLICIES ── */}
      {tab === "inclusions" && (
        <div className="space-y-4">
          {[
            { icon: <CheckCheck className="w-4 h-4 text-emerald-400" />, title: "What's Included", borderCls: "border-emerald-500/20", bgCls: "bg-emerald-500/5", headerBorderCls: "border-emerald-500/10", content: itin.inclusions, accentCls: "text-emerald-400", emptyMsg: "Inclusions not yet added by your agent", renderLine: (line: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-300 leading-relaxed">{line.replace(/^[-•*]\s*/, "")}</p>
                </div>
              )},
            { icon: <XCircle className="w-4 h-4 text-red-400" />, title: "Not Included", borderCls: "border-red-500/20", bgCls: "bg-red-500/5", headerBorderCls: "border-red-500/10", content: itin.exclusions, accentCls: "text-red-400", emptyMsg: "Exclusions not yet added by your agent", renderLine: (line: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <X className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-300 leading-relaxed">{line.replace(/^[-•*]\s*/, "")}</p>
                </div>
              )},
            { icon: <ScrollText className="w-4 h-4 text-blue-400" />, title: "Terms & Conditions", borderCls: "border-white/[0.07]", bgCls: "bg-white/[0.02]", headerBorderCls: "border-white/[0.06]", content: itin.termsAndConditions, accentCls: "text-gray-400", emptyMsg: "Terms & conditions not yet added", renderLine: null },
            { icon: <ShieldAlert className="w-4 h-4 text-amber-400" />, title: "Cancellation Policy", borderCls: "border-amber-500/20", bgCls: "bg-amber-500/5", headerBorderCls: "border-amber-500/10", content: itin.cancellationPolicy, accentCls: "text-amber-400", emptyMsg: "Cancellation policy not yet added", renderLine: null },
            { icon: <CreditCard className="w-4 h-4 text-purple-400" />, title: "Payment Methods", borderCls: "border-white/[0.07]", bgCls: "bg-white/[0.02]", headerBorderCls: "border-white/[0.06]", content: itin.paymentMethods, accentCls: "text-gray-400", emptyMsg: "Payment methods not yet specified", renderLine: null },
          ].map((section) => (
            <div key={section.title} className={cn("rounded-2xl overflow-hidden border", section.borderCls, section.bgCls)}>
              <div className={cn("flex items-center gap-2.5 px-5 py-3.5 border-b", section.headerBorderCls)}>
                {section.icon}
                <p className={cn("text-xs font-bold uppercase tracking-widest", section.accentCls)}>{section.title}</p>
              </div>
              {section.content ? (
                <div className="px-5 py-4 space-y-2">
                  {section.renderLine
                    ? section.content.split("\n").filter(Boolean).map((line: string, i: number) => section.renderLine!(line, i))
                    : <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{section.content}</p>
                  }
                </div>
              ) : (
                <div className="px-5 py-8 flex flex-col items-center gap-2 text-center">
                  <p className="text-xs text-gray-600">{section.emptyMsg}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


interface ClientDashboardProps {
  formMeta: PublicEnquiryFormMeta;
  shareToken: string;
  responseId: string;
}

type DashboardTab = "overview" | "messages" | "itinerary";

export function ClientDashboard({ formMeta, shareToken, responseId }: ClientDashboardProps) {
  const supabase = createClient();
  const [response, setResponse] = useState<EnquiryResponseData | null>(null);
  const [loadingResponse, setLoadingResponse] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTabState] = useState<DashboardTab>("overview");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get("tab") as DashboardTab | null;
    const storedTab = localStorage.getItem(`client_portal_active_tab_${responseId}`) as DashboardTab | null;
    const validTabs: DashboardTab[] = ["overview", "messages", "itinerary"];
    
    if (urlTab && validTabs.includes(urlTab)) {
      setActiveTabState(urlTab);
    } else if (storedTab && validTabs.includes(storedTab)) {
      setActiveTabState(storedTab);
    }
  }, [responseId]);

  const setActiveTab = (tab: DashboardTab) => {
    setActiveTabState(tab);
    localStorage.setItem(`client_portal_active_tab_${responseId}`, tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  };
  const { unreadCount } = useClientMessages(responseId, "client");

  const [itineraryData, setItineraryData] = useState<any>(null);
  const [loadingItinerary, setLoadingItinerary] = useState(false);
  const [itineraryError, setItineraryError] = useState<string | null>(null);
  const [dayPhotos, setDayPhotos] = useState<string[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  const fetchDayPhotos = useCallback(async (fId: string, rId: string, days: any[]) => {
    if (!days || days.length === 0) return;
    setLoadingPhotos(true);
    try {
      const searchTerms = days.map((d: any) => d.imageSearchTerm || d.areaFocus || "");
      const areaNames = days.map((d: any) => d.areaFocus || "");
      const res = await fetch(
        `/api/enquiry-forms/${fId}/responses/${rId}/itinerary/photos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ searchTerms, areaNames }),
        }
      );
      if (res.ok) {
        const { photos } = await res.json();
        setDayPhotos(photos || []);
      }
    } catch (err) {
      console.warn("Failed to fetch day photos", err);
    } finally {
      setLoadingPhotos(false);
    }
  }, []);

  const fetchItinerary = async (fId: string, rId: string) => {
    setLoadingItinerary(true);
    setItineraryError(null);
    try {
      const res = await fetch(`/api/enquiry-forms/${fId}/responses/${rId}/itinerary`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load itinerary");
      setItineraryData(data);
      // Fetch photos for each day
      const days = data?.itinerary?.itinerary_data?.itinerary || [];
      if (data.available && days.length > 0) {
        fetchDayPhotos(fId, rId, days);
      }
    } catch (err: any) {
      setItineraryError(err.message);
    } finally {
      setLoadingItinerary(false);
    }
  };

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

    // Subscribe to real-time response updates (workflow_status, agent_note, itinerary push)
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

  useEffect(() => {
    if (activeTab === "itinerary" && !itineraryData && !loadingItinerary && response) {
      fetchItinerary(formMeta.id, responseId);
    }
  }, [activeTab, itineraryData, loadingItinerary, response, formMeta.id, responseId]);

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
          {/* Overview tab */}
          <button
            id="dashboard-tab-overview"
            onClick={() => setActiveTab("overview")}
            className={cn(
              "relative px-4 py-2.5 text-xs font-semibold capitalize transition-all border-b-2",
              activeTab === "overview"
                ? "text-white border-[#FF5C33]"
                : "text-gray-500 border-transparent hover:text-gray-300"
            )}
          >
            Overview
          </button>

          {/* Itinerary tab — always shown but gated inside */}
          <button
            id="dashboard-tab-itinerary"
            onClick={() => {
              setActiveTab("itinerary");
              if (response) fetchItinerary(formMeta.id, responseId);
            }}
            className={cn(
              "relative px-4 py-2.5 text-xs font-semibold capitalize transition-all border-b-2 flex items-center gap-1.5",
              activeTab === "itinerary"
                ? "text-white border-[#FF5C33]"
                : "text-gray-500 border-transparent hover:text-gray-300"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            Itinerary
            {response?.itinerary_visible_to_client && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
            )}
          </button>

          {/* Messages tab */}
          <button
            id="dashboard-tab-messages"
            onClick={() => setActiveTab("messages")}
            className={cn(
              "relative px-4 py-2.5 text-xs font-semibold capitalize transition-all border-b-2 flex items-center gap-1",
              activeTab === "messages"
                ? "text-white border-[#FF5C33]"
                : "text-gray-500 border-transparent hover:text-gray-300"
            )}
          >
            <MessageSquare className="inline w-3.5 h-3.5 -mt-0.5" />
            Messages
            {unreadCount > 0 && (
              <span className="ml-1 min-w-[18px] h-[18px] bg-[#FF5C33] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 inline-flex">
                {unreadCount}
              </span>
            )}
          </button>
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

        {/* ══ ITINERARY TAB ══ */}
        {activeTab === "itinerary" && (
          <div className="space-y-5 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#FF5C33]" /> Your Itinerary
                </h2>
                {itineraryData?.itinerary_last_pushed_at && (
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Last updated by {agentName} · {new Date(itineraryData.itinerary_last_pushed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
              <button
                onClick={() => fetchItinerary(formMeta.id, responseId)}
                className="text-gray-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                title="Refresh itinerary"
              >
                <RefreshCw className={cn("w-4 h-4", loadingItinerary && "animate-spin")} />
              </button>
            </div>

            {/* Loading */}
            {loadingItinerary && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-[#FF5C33] animate-spin" />
                <p className="text-xs text-gray-500">Loading your itinerary…</p>
              </div>
            )}

            {/* Error */}
            {!loadingItinerary && itineraryError && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-300">Couldn't load itinerary</p>
                  <p className="text-xs text-red-400/70 mt-0.5">{itineraryError}</p>
                </div>
              </div>
            )}

            {/* Not yet pushed */}
            {!loadingItinerary && !itineraryError && itineraryData && !itineraryData.available && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF5C33]/10 to-[#7C3AED]/10 border border-white/[0.08] flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-[#FF5C33]/60" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">Itinerary Coming Soon</p>
                  <p className="text-sm text-gray-500 mt-1 max-w-xs">
                    Your personalised travel plan is being crafted. {agentName} will share it with you shortly!
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("messages")}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#FF5C33]/10 border border-[#FF5C33]/20 text-[#FF5C33] text-xs font-semibold hover:bg-[#FF5C33]/20 transition-all"
                >
                  Message {agentName}
                </button>
              </div>
            )}

            {/* ── Full Itinerary Content ── */}
            {!loadingItinerary && !itineraryError && itineraryData?.available && itineraryData?.itinerary && (() => {
              const itin = itineraryData.itinerary;
              const days: any[] = itin.itinerary_data?.itinerary || [];
              const showTimestamps = itin.show_timestamps !== false;
              const hotels: any[] = itin.hotels || [];
              const flights: any[] = itin.flights || [];
              const cabs: any[] = itin.cabs || [];
              const buses: any[] = itin.buses || [];
              const currency = itin.currency || "INR";
              const currencySymbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency;
              const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

              // Compute pricing breakdown client-side from stored data
              const pricing = itin.pricing || {};
              const adultPax = itin.adult_pax || pricing.adultPax || 1;
              const childPax = itin.child_pax || pricing.childPax || 0;
              const infantPax = itin.infant_pax || pricing.infantPax || 0;
              const totalPax = adultPax + childPax + infantPax;
              const markupType = itin.markup_type || pricing.markupType || "percentage";
              const markupValue = itin.markup_value ?? pricing.markupValue ?? 0;
              const taxPct = itin.tax_percentage ?? pricing.taxPercentage ?? 0;
              const costingType = pricing.costingType ?? "manual";

              // Compute base cost from manual options if costingType is manual
              let computedBaseCost = 0;
              if (costingType === "manual" && Array.isArray(pricing.manualOptions) && pricing.manualOptions.length > 0) {
                for (const item of pricing.manualOptions) {
                  const amount = Number(item.amount) || 0;
                  computedBaseCost += item.type === "per-person" ? amount * totalPax : amount;
                }
              }

              // Use stored client_price as the authoritative final total (set during save),
              // but fall back to computing from stored pricing data if client_price is 0
              const storedClientPrice = itin.client_price || 0;
              let clientPrice = storedClientPrice;

              if (clientPrice === 0 && computedBaseCost > 0) {
                // Compute from stored pricing data
                const markupAmt = markupType === "percentage"
                  ? (computedBaseCost * markupValue) / 100
                  : markupValue;
                const withMarkup = computedBaseCost + markupAmt;
                clientPrice = withMarkup * (1 + taxPct / 100);
              }

              // Back-calculate base cost from final price if markup/tax known
              const taxFactor = 1 + taxPct / 100;
              const costWithMarkup = clientPrice / taxFactor;
              const taxAmount = clientPrice - costWithMarkup;
              const baseCost = computedBaseCost > 0
                ? computedBaseCost
                : (markupType === "percentage"
                  ? costWithMarkup / (1 + markupValue / 100)
                  : costWithMarkup - markupValue);
              const markupAmount = costWithMarkup - baseCost;
              const perPerson = totalPax > 0 ? clientPrice / totalPax : clientPrice;
              const milestones: any[] = pricing.milestones || [];

              return (
                <div className="space-y-5">

                  {/* ── Trip Hero Banner ── */}
                  <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#FF5C33]/10 via-[#7C3AED]/8 to-[#EC4899]/10">
                    {dayPhotos[0] && (
                      <div className="absolute inset-0">
                        <img src={dayPhotos[0]} alt="" className="w-full h-full object-cover opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/60 to-transparent" />
                      </div>
                    )}
                    <div className="relative z-10 p-5">
                      <p className="text-[10px] text-[#FF5C33] font-bold uppercase tracking-widest mb-1">Your Personalised Plan</p>
                      <h3 className="text-xl font-black text-white leading-tight mb-1">{itin.title || "Your Trip"}</h3>
                      <p className="text-xs text-gray-400 mb-4">{itin.destinations}</p>
                      <div className="flex flex-wrap gap-3">
                        {itin.start_date && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] border border-white/10 rounded-xl text-xs text-gray-300">
                            <Calendar className="w-3.5 h-3.5 text-[#FF5C33]" />
                            {itin.start_date} → {itin.end_date}
                          </div>
                        )}
                        {((itin.adult_pax || 0) + (itin.child_pax || 0)) > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] border border-white/10 rounded-xl text-xs text-gray-300">
                            <Users className="w-3.5 h-3.5 text-[#FF5C33]" />
                            {(itin.adult_pax || 0) + (itin.child_pax || 0)} traveller{(itin.adult_pax || 0) + (itin.child_pax || 0) !== 1 ? "s" : ""}
                          </div>
                        )}
                        {days.length > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] border border-white/10 rounded-xl text-xs text-gray-300">
                            <MapPin className="w-3.5 h-3.5 text-[#FF5C33]" />
                            {days.length} day{days.length !== 1 ? "s" : ""}
                          </div>
                        )}
                        {clientPrice > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7C3AED]/15 border border-[#7C3AED]/25 rounded-xl text-xs text-purple-200 font-semibold">
                            <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                            {currencySymbol}{fmt(clientPrice)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <ItinerarySubTabs
                    days={days}
                    flights={flights}
                    hotels={hotels}
                    cabs={cabs}
                    buses={buses}
                    itin={itin}
                    pricing={pricing}
                    clientPrice={clientPrice}
                    baseCost={baseCost}
                    markupAmount={markupAmount}
                    taxAmount={taxAmount}
                    taxPct={taxPct}
                    markupType={markupType}
                    markupValue={markupValue}
                    totalPax={totalPax}
                    adultPax={adultPax}
                    childPax={childPax}
                    infantPax={infantPax}
                    perPerson={perPerson}
                    milestones={milestones}
                    currencySymbol={currencySymbol}
                    fmt={fmt}
                    showTimestamps={showTimestamps}
                    dayPhotos={dayPhotos}
                    loadingPhotos={loadingPhotos}
                    shareUrl={response.itinerary_share_url}
                  />
                </div>
              );
            })()}
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
