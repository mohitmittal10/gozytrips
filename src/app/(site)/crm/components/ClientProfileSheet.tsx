"use client";

import React from "react";
import dynamic from "next/dynamic";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Compass, Eye, Trash2, Clock, Mail,
  ChevronDown, ChevronUp, StickyNote, Plane,
  CalendarDays, DollarSign, ArrowRight, User,
  Phone, AtSign, Tag, TrendingUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAvatarColor, cn } from "@/lib/utils";
import { getCurrencySymbol, formatMoney } from "@/lib/utils/currency";
import { DEFAULT_CURRENCY } from "@/types/pricing";
import { EnrichedClient } from "../utils/metrics-utils";
import { useAuth } from "@/contexts/auth-context";

const ClientUpdateSuggestions = dynamic(
  () => import("@/components/client-update-suggestions"),
  { ssr: false }
);

// ── Notes Parser ───────────────────────────────────────────────────────────────

interface NoteLog {
  id: string;
  type: "manual" | "email";
  title: string;
  date?: string;   // DD/MM/YYYY
  time?: string;   // HH:MM
  subject?: string;
  body: string;
}

function parseClientNotes(notes: string): NoteLog[] {
  if (!notes) return [];
  const logs: NoteLog[] = [];

  // ── New format: @@EMAIL:DD/MM/YYYY HH:MM@@ (survives sanitization)
  const newDivider = /(@@EMAIL:\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}@@)/g;
  const newParts = notes.split(newDivider);

  const manualBefore = newParts[0]?.trim();
  if (manualBefore) {
    logs.push({ id: "manual-initial", type: "manual", title: "General Note", body: manualBefore });
  }

  for (let i = 1; i < newParts.length; i += 2) {
    const token   = newParts[i];   // e.g. @@EMAIL:04/06/2026 23:15@@
    const content = newParts[i + 1] || "";

    const match = token.match(/@@EMAIL:(\d{2}\/\d{2}\/\d{4}) (\d{2}:\d{2})@@/);
    const date = match ? match[1] : undefined;
    const time = match ? match[2] : undefined;

    let subject = "Email Sent";
    let body = content.trim();
    const subjectMatch = content.match(/^Subject:\s*(.*)$/m);
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
      body = content.replace(/^Subject:\s*.*$/m, "").trim();
    }

    logs.push({ id: `email-${i}`, type: "email", title: "Email Sent", date, time, subject, body });
  }

  return logs.reverse();
}

// ── Note Log Card ──────────────────────────────────────────────────────────────

const NoteLogCard = ({ log }: { log: NoteLog }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isEmail = log.type === "email";

  // Format "DD/MM/YYYY" → "04 Jun"
  function fmtDate(d?: string) {
    if (!d) return null;
    const [dd, mm] = d.split("/");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${dd} ${months[parseInt(mm,10)-1]}`;
  }

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className={cn(
        "rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden",
        isExpanded
          ? isEmail
            ? "border-purple-500/30 bg-purple-500/[0.06]"
            : "border-white/10 bg-white/[0.04]"
          : isEmail
          ? "border-purple-500/15 bg-purple-500/[0.03] hover:border-purple-500/25 hover:bg-purple-500/[0.06]"
          : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
          isEmail ? "bg-purple-500/15 text-purple-400" : "bg-zinc-500/10 text-zinc-400"
        )}>
          {isEmail ? <Mail className="w-3.5 h-3.5" /> : <StickyNote className="w-3.5 h-3.5" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">
            {isEmail ? log.subject : log.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={cn(
              "text-[10px] font-medium",
              isEmail ? "text-purple-400/70" : "text-zinc-500"
            )}>
              {isEmail ? "AI email" : "Internal note"}
            </span>
            {(log.date || log.time) && (
              <>
                <span className="w-0.5 h-0.5 rounded-full bg-gray-700 shrink-0" />
                <span className="text-[10px] text-gray-600 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 shrink-0" />
                  {fmtDate(log.date)}
                  {log.time && <span className="text-zinc-500">· {log.time}</span>}
                </span>
              </>
            )}
          </div>
        </div>

        <div className={cn(
          "shrink-0 transition-colors",
          isExpanded ? "text-gray-300" : "text-gray-600"
        )}>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </div>

      {/* Expanded body */}
      {isExpanded && (
        <div className={cn(
          "px-4 pb-4 border-t space-y-2",
          isEmail ? "border-purple-500/10" : "border-white/5"
        )}>
          {isEmail && log.subject && (
            <div className="pt-3 pb-2 border-b border-white/[0.04]">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold mb-0.5">Subject</p>
              <p className="text-xs text-gray-200 font-medium">{log.subject}</p>
            </div>
          )}
          <p className="text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap font-light pt-1">
            {log.body}
          </p>
        </div>
      )}

      {/* Preview line when collapsed */}
      {!isExpanded && (
        <div className="px-4 pb-3 -mt-1">
          <p className="text-[11px] text-gray-600 truncate">{log.body}</p>
        </div>
      )}
    </div>
  );
};

// ── Section Heading ────────────────────────────────────────────────────────────

const SectionHeading = ({
  icon: Icon,
  label,
  sub,
  iconColor = "text-purple-400",
  badge,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
  iconColor?: string;
  badge?: string | number;
}) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2.5">
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 border border-white/5", iconColor)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
    {badge !== undefined && (
      <Badge variant="outline" className="text-[10px] border-white/10 text-gray-500 font-normal">
        {badge}
      </Badge>
    )}
  </div>
);

import { getStatusStyle, CRM_AVATAR_CLASS } from "../utils/crm-colors";

// ── Trip Status Badge ──────────────────────────────────────────────────────────

const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
  booked:    { color: "text-emerald-400", bg: "bg-emerald-500/10", dot: "bg-emerald-400" },
  confirmed: { color: "text-emerald-400", bg: "bg-emerald-500/10", dot: "bg-emerald-400" },
  sent:      { color: "text-blue-400",    bg: "bg-blue-500/10",    dot: "bg-blue-400" },
  proposed:  { color: "text-amber-400",   bg: "bg-amber-500/10",   dot: "bg-amber-400" },
  draft:     { color: "text-zinc-300",    bg: "bg-zinc-500/10",    dot: "bg-zinc-400" },
  rejected:  { color: "text-rose-400",    bg: "bg-rose-500/10",    dot: "bg-rose-400" },
  completed: { color: "text-teal-400",    bg: "bg-teal-500/10",    dot: "bg-teal-400" },
};

// ── Props ──────────────────────────────────────────────────────────────────────

interface ClientProfileSheetProps {
  selectedClient: EnrichedClient | null;
  setSelectedClient: (client: EnrichedClient | null) => void;
  statusHistory: Record<string, any[]>;
  itineraryStatuses: any[];
  handleStatusChange: (clientId: string, tripId: string, status: string) => void;
  handleDuplicateTrip: (trip: any) => void;
  handleDeleteTrip: (tripId: string) => void;
  deleting: string | null;
  setEditingClient: (client: EnrichedClient | null) => void;
  setIsEditDialogOpen: (open: boolean) => void;
  setShowModal: (show: boolean) => void;
  setSelectedTripForModal: (trip: any) => void;
  getTripCost: (trip: any) => number;
  onClientNotesUpdate?: (clientId: string, newNotes: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export const ClientProfileSheet = ({
  selectedClient,
  setSelectedClient,
  statusHistory,
  itineraryStatuses = [],
  handleStatusChange,
  handleDuplicateTrip,
  handleDeleteTrip,
  deleting,
  setEditingClient,
  setIsEditDialogOpen,
  setShowModal,
  setSelectedTripForModal,
  getTripCost,
  onClientNotesUpdate,
}: ClientProfileSheetProps) => {
  const { agencySettings } = useAuth();

  return (
    <Sheet open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
      <SheetContent className="bg-[#080808] border-l border-white/[0.06] text-white w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto p-0">

        {/* ── Sticky Header ── */}
        <div className="sticky top-0 z-10 bg-[#080808]/95 backdrop-blur-sm border-b border-white/[0.06] px-6 pt-6 pb-4">
          <SheetHeader>
            <SheetTitle className="sr-only">Client Profile</SheetTitle>
            <SheetDescription className="sr-only">Client details and trip history</SheetDescription>
          </SheetHeader>
          {selectedClient && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold shrink-0",
                  CRM_AVATAR_CLASS
                )}>
                  {selectedClient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{selectedClient.name}</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Client since {new Date(selectedClient.created_at).getFullYear()}
                    {selectedClient.allTrips?.length ? ` · ${selectedClient.allTrips.length} trip${selectedClient.allTrips.length > 1 ? "s" : ""}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-gray-400 hover:text-white hover:bg-white/10 border border-white/10"
                  onClick={() => { setEditingClient(selectedClient); setIsEditDialogOpen(true); }}
                >
                  Edit Info
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-purple-600/80 hover:bg-purple-600 text-white border-0"
                  onClick={() => window.open(`/the-lab?clientId=${selectedClient.id}`, "_blank")}
                >
                  + New Itinerary
                </Button>
              </div>
            </div>
          )}
        </div>

        {selectedClient && (
          <div className="px-6 py-5 space-y-5">

            {/* ── Contact Details ── */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: AtSign, label: "Email", value: selectedClient.email },
                { icon: Phone, label: "Phone", value: selectedClient.phone },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">{label}</p>
                    <p className="text-xs text-gray-200 font-medium truncate mt-0.5">{value || "—"}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tags */}
            {selectedClient.tags && selectedClient.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-3 h-3 text-gray-600 shrink-0" />
                {selectedClient.tags.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="secondary"
                    className="bg-purple-500/10 text-purple-400 border border-purple-500/15 font-normal px-2 py-0.5 text-[11px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* ── Communication History ── */}
            {selectedClient.notes && (() => {
              const logs = parseClientNotes(selectedClient.notes);
              if (logs.length === 0) return null;
              return (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
                  <div className="px-5 pt-5 pb-3">
                    <SectionHeading
                      icon={Mail}
                      label="Communication History"
                      sub="Emails sent & notes added for this client"
                      iconColor="text-purple-400"
                      badge={`${logs.length} record${logs.length > 1 ? "s" : ""}`}
                    />
                    <div className="space-y-2">
                      {logs.map((log) => (
                        <NoteLogCard key={log.id} log={log} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Status Audit Trail ── */}
            {selectedClient.latestTripId && (statusHistory[selectedClient.latestTripId]?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
                <div className="px-5 pt-5 pb-4">
                  <SectionHeading
                    icon={TrendingUp}
                    label="Trip Progress"
                    sub="How this client's latest trip has moved through stages"
                    iconColor="text-blue-400"
                  />
                  <div className="space-y-0 relative">
                    {/* vertical line */}
                    <div className="absolute left-[11px] top-3 bottom-3 w-px bg-white/[0.06]" />
                    {statusHistory[selectedClient.latestTripId!]?.map((entry, idx) => {
                      const cfg = statusConfig[entry.status?.toLowerCase()] || statusConfig.draft;
                      return (
                        <div key={idx} className="flex items-start gap-4 relative py-2.5">
                          <div className={cn("w-5 h-5 rounded-full border-2 border-[#080808] flex items-center justify-center shrink-0 z-10 mt-0.5", cfg.bg)}>
                            <div className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                          </div>
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-xs text-white">
                                Moved to{" "}
                                <span className={cn("font-bold capitalize", cfg.color)}>{entry.status}</span>
                              </p>
                              <p className="text-[10px] text-gray-600 mt-0.5">by {entry.by}</p>
                            </div>
                            <span className="text-[10px] text-gray-600 shrink-0">
                              {new Date(entry.timestamp).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Trip History ── */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
              <div className="px-5 pt-5 pb-2">
                <SectionHeading
                  icon={Plane}
                  label="Trip History"
                  sub="All itineraries created for this client"
                  iconColor="text-sky-400"
                  badge={selectedClient.allTrips?.length || 0}
                />
              </div>

              {selectedClient.allTrips && selectedClient.allTrips.length > 0 ? (
                <div className="divide-y divide-white/[0.04]">
                  {selectedClient.allTrips.map((trip) => {
                    const tripCost = getTripCost(trip);
                    const start = new Date(trip.start_date);
                    const end = new Date(trip.end_date);
                    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    const now = new Date();
                    const daysLeft = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                    let destLabel = trip.destinations || "";
                    if (!destLabel && trip.title) destLabel = trip.title.replace(/^Trip to\s+/i, "");
                    if (!destLabel && trip.itinerary_data?.itinerary) {
                      const cities = trip.itinerary_data.itinerary
                        .map((d: any) => d.areaFocus?.split(",")[0]?.trim())
                        .filter(Boolean);
                      destLabel = Array.from(new Set(cities)).join(", ");
                    }
                    if (!destLabel) destLabel = trip.starting_location || "Unknown";

                    const statusKey = trip.status?.toLowerCase() || "draft";
                    const cfg = statusConfig[statusKey] || statusConfig.draft;

                    return (
                      <div key={trip.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                        <div className="flex items-start gap-3">
                          {/* Destination + status */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                <p className="text-sm font-semibold text-white">{destLabel}</p>
                              </div>
                              {/* Status pill inline */}
                              <Select
                                value={statusKey}
                                onValueChange={(val) => handleStatusChange(selectedClient.id, trip.id, val)}
                              >
                                <SelectTrigger className={cn(
                                  "h-5 border-0 shadow-none focus:ring-0 w-auto inline-flex items-center gap-1 px-2 py-0 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                  cfg.bg, cfg.color
                                )}>
                                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                                  {itineraryStatuses.length > 0
                                    ? itineraryStatuses.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                      ))
                                    : (["draft", "proposed", "sent", "booked", "rejected"].map(v => (
                                        <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>
                                      )))
                                  }
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Route */}
                            {trip.starting_location && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <p className="text-[11px] text-zinc-500">
                                  {trip.starting_location}
                                  {trip.ending_location && trip.ending_location !== trip.starting_location && (
                                    <span className="inline-flex items-center gap-1">
                                      <ArrowRight className="w-2.5 h-2.5 mx-0.5 inline" />
                                      {trip.ending_location}
                                    </span>
                                  )}
                                </p>
                              </div>
                            )}

                            {/* Meta chips */}
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                                <CalendarDays className="w-3 h-3 shrink-0" />
                                <span>{start.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                                <span className="text-zinc-700">·</span>
                                <span className="text-zinc-600">{diffDays}D/{diffDays - 1}N</span>
                              </div>
                              {tripCost > 0 && (
                                <div className="flex items-center gap-1 text-[11px] text-zinc-300 font-semibold">
                                  <DollarSign className="w-3 h-3 shrink-0" />
                                  {formatMoney(tripCost, (agencySettings?.default_currency as any) || DEFAULT_CURRENCY)}
                                </div>
                              )}
                              {daysLeft > 0 && (
                                <div className="text-[10px] text-amber-500/80 font-medium">
                                  in {daysLeft}d
                                </div>
                              )}
                              {daysLeft < 0 && (
                                <div className="text-[10px] text-zinc-600">
                                  completed
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg"
                              onClick={() => { setSelectedTripForModal(trip); setShowModal(true); }}
                              title="View itinerary"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                              onClick={() => handleDeleteTrip(trip.id)}
                              disabled={deleting === trip.id}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-5 pb-5">
                  <div className="text-center py-10 border border-dashed border-white/[0.06] rounded-xl">
                    <Plane className="w-7 h-7 text-zinc-700 mx-auto mb-2 opacity-40" />
                    <p className="text-zinc-600 text-sm">No trips yet</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-purple-400 text-xs hover:bg-purple-500/5 mt-2"
                      onClick={() => window.open(`/the-lab?clientId=${selectedClient.id}`, "_blank")}
                    >
                      Create first itinerary
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* ── AI Email Suggestions ── */}
            {selectedClient.allTrips && selectedClient.allTrips.length > 0 && (() => {
              const latestTrip = selectedClient.allTrips[0];
              const tripCost = getTripCost(latestTrip);
              const startDate = new Date(latestTrip.start_date);
              const endDate = new Date(latestTrip.end_date);
              const now = new Date();
              const daysUntilTrip = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

              let destLabel = latestTrip.destinations || "";
              if (!destLabel && latestTrip.title) destLabel = latestTrip.title.replace(/^Trip to\s+/i, "");
              if (!destLabel) destLabel = latestTrip.starting_location || "Unknown";

              const hotelNamesList = (latestTrip.itinerary_data?.hotels || [])
                .map((h: any) => h.name).filter(Boolean).join(", ");

              return (
                <ClientUpdateSuggestions
                  clientId={selectedClient.id}
                  clientNotes={selectedClient.notes}
                  onNotesUpdate={(newNotes) => { if (onClientNotesUpdate) onClientNotesUpdate(selectedClient.id, newNotes); }}
                  clientName={selectedClient.name}
                  clientEmail={selectedClient.email}
                  tripStatus={latestTrip.status || "draft"}
                  destination={destLabel}
                  travelDates={`${startDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} - ${endDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`}
                  tripDuration={`${diffDays}D/${diffDays - 1}N`}
                  totalCost={tripCost > 0 ? formatMoney(tripCost, (agencySettings?.default_currency as any) || DEFAULT_CURRENCY) : undefined}
                  daysUntilTrip={daysUntilTrip}
                  hotelNames={hotelNamesList || undefined}
                  hasFlights={(latestTrip.itinerary_data?.flights || []).length > 0}
                />
              );
            })()}

            {/* bottom spacer */}
            <div className="h-4" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
