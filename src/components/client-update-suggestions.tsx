"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles, Send, MessageCirclePlus, CheckCircle2,
  Clock, Wallet, Pencil, RefreshCw, ChevronDown, ChevronUp,
  Copy, Check
} from "lucide-react";
import UniqueLoading from "./ui/morph-loading";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  generateSuggestionsWithEmails,
  generateClientUpdateEmail,
} from "@/ai/flows/generate-client-update";
import type { ClientUpdateContext, SuggestionWithEmail } from "@/ai/flows/generate-client-update";
import { useClients } from "@/lib/hooks/use-clients";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClientUpdateSuggestionsProps {
  clientId: string;
  clientNotes: string | null;
  onNotesUpdate?: (newNotes: string) => void;
  clientName: string;
  clientEmail: string | null;
  tripStatus: string;
  destination: string;
  travelDates: string;
  tripDuration?: string;
  totalCost?: string;
  daysUntilTrip?: number;
  hotelNames?: string;
  hasFlights?: boolean;
}

// ── Category styling ──────────────────────────────────────────────────────────

const categoryStyles: Record<string, { icon: typeof Send; color: string; bg: string; border: string }> = {
  booking: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  reminder: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  update: { icon: Send, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  payment: { icon: Wallet, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  custom: { icon: Pencil, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
};

// ── Session cache (avoids regenerating for the same trip context) ─────────────

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function buildCacheKey(ctx: ClientUpdateContext): string {
  return `cu_${ctx.tripStatus}_${ctx.destination}_${ctx.travelDates}`.replace(/\s+/g, "_").toLowerCase();
}

function readCache(key: string): SuggestionWithEmail[] | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) { sessionStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

function writeCache(key: string, data: SuggestionWithEmail[]) {
  try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch { /* ignore */ }
}

// ── Mailto helper ─────────────────────────────────────────────────────────────

function openGmailCompose(to: string, subject: string, body: string) {
  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl, "_blank");
}

function sanitizeForCrmNotes(text: string): string {
  let s = text
    .replace(/₹/g, "INR ")
    .replace(/\$/g, "USD ")
    .replace(/"/g, "'")
    .replace(/;/g, ",")
    .replace(/=/g, "-")
    .replace(/\*/g, "-")
    .replace(/_/g, "-")
    .replace(/\[/g, "(")
    .replace(/\]/g, ")")
    .replace(/\{/g, "(")
    .replace(/\}/g, ")")
    .replace(/</g, "(")
    .replace(/>/g, ")")
    .replace(/\\/g, "/")
    .replace(/\/\*/g, "/")
    .replace(/\*\//g, "/")
    .replace(/union\s+select/gi, "union and select");
  s = s.replace(/-{2,}/g, "-");
  const forbiddenCharRegex = /[^\p{L}\p{M}\p{N}\s.,'':/()#&!?%+\-@]/gu;
  return s.replace(forbiddenCharRegex, "");
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClientUpdateSuggestions({
  clientId,
  clientNotes,
  onNotesUpdate,
  clientName,
  clientEmail,
  tripStatus,
  destination,
  travelDates,
  tripDuration,
  totalCost,
  daysUntilTrip,
  hotelNames,
  hasFlights,
}: ClientUpdateSuggestionsProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const { updateClient } = useClients();

  const [suggestions, setSuggestions] = useState<SuggestionWithEmail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Per-suggestion overrides (after Redo)
  const [emailOverrides, setEmailOverrides] = useState<Record<string, { subject: string; body: string }>>({});
  const [redoingId, setRedoingId] = useState<string | null>(null);

  // Custom message state
  const [customMessage, setCustomMessage] = useState("");

  // Edit/Copy State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleEmailChange = useCallback((id: string, field: "subject" | "body", value: string) => {
    setEmailOverrides(prev => {
      const defaultEmail = suggestions.find(s => s.id === id);
      const existing = prev[id] ?? { subject: defaultEmail?.subject || "", body: defaultEmail?.body || "" };
      return {
        ...prev,
        [id]: {
          ...existing,
          [field]: value,
        }
      };
    });
  }, [suggestions]);

  const handleCopy = useCallback((id: string, subject: string, body: string) => {
    const fullText = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopiedId(id);
      toast({ title: "Copied!", description: "Draft copied to clipboard." });
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(err => {
      console.error("Failed to copy text:", err);
      toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy text to clipboard." });
    });
  }, [toast]);

  // ── Build context ──────────────────────────────────────────────────────────

  const buildContext = useCallback((): ClientUpdateContext => ({
    clientName,
    agentName: userProfile?.full_name || "Travel Agent",
    agentCompany: userProfile?.company_name || undefined,
    tripStatus,
    destination,
    travelDates,
    tripDuration,
    totalCost,
    daysUntilTrip,
    hotelNames,
    hasFlights,
  }), [clientName, userProfile, tripStatus, destination, travelDates, tripDuration, totalCost, daysUntilTrip, hotelNames, hasFlights]);

  // ── Fetch (cache-first) ────────────────────────────────────────────────────

  const fetchSuggestions = useCallback(async (bustCache = false) => {
    const ctx = buildContext();
    const cacheKey = buildCacheKey(ctx);

    if (!bustCache) {
      const cached = readCache(cacheKey);
      if (cached) {
        setSuggestions(cached);
        setHasFetched(true);
        return;
      }
    }

    setIsLoading(true);
    try {
      const result = await generateSuggestionsWithEmails(ctx);
      setSuggestions(result.suggestions);
      setEmailOverrides({});
      writeCache(cacheKey, result.suggestions);
      setHasFetched(true);
    } catch (err: any) {
      console.error("Failed to fetch suggestions:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to load AI suggestions." });
    } finally {
      setIsLoading(false);
    }
  }, [buildContext, toast]);

  // ── Redo a single email ────────────────────────────────────────────────────

  const handleRedo = useCallback(async (suggestion: SuggestionWithEmail) => {
    setRedoingId(suggestion.id);
    try {
      const ctx = buildContext();
      const result = await generateClientUpdateEmail({
        ...ctx,
        suggestionTitle: suggestion.title,
        customMessage: suggestion.category === "custom" ? customMessage : undefined,
      });
      setEmailOverrides(prev => ({ ...prev, [suggestion.id]: result }));
    } catch (err: any) {
      console.error("Failed to redo email:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to regenerate email." });
    } finally {
      setRedoingId(null);
    }
  }, [buildContext, customMessage, toast]);

  // ── Send email + log to CRM ───────────────────────────────────────────────

  const handleSend = useCallback(async (suggestion: SuggestionWithEmail) => {
    const email = emailOverrides[suggestion.id] ?? { subject: suggestion.subject, body: suggestion.body };
    if (!clientEmail) return;
    openGmailCompose(clientEmail, email.subject, email.body);

    try {
      // Sanitize only email content — NOT the divider itself.
      // The @@ delimiter uses only allowed chars and survives sanitization intact.
      const safeSubject = sanitizeForCrmNotes(email.subject);
      const safeBody    = sanitizeForCrmNotes(email.body);
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-GB");                // DD/MM/YYYY
      const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); // HH:MM
      const divider = `\n\n@@EMAIL:${dateStr} ${timeStr}@@`;
      const newEntry = `${divider}\nSubject: ${safeSubject}\n\n${safeBody}`;

      const combined  = clientNotes ? `${clientNotes}${newEntry}` : newEntry.trim();
      let newNotes = combined;
      if (newNotes.length > 1000) newNotes = newNotes.slice(-1000);

      await updateClient(clientId, { notes: newNotes });
      if (onNotesUpdate) onNotesUpdate(newNotes);
      toast({ title: "Communication Logged", description: "AI update logged in client notes." });
    } catch (err: any) {
      console.error("Failed to log client update:", err);
      toast({ variant: "destructive", title: "Log Failed", description: "Email opened, but failed to log." });
    }
  }, [emailOverrides, clientEmail, clientId, clientNotes, onNotesUpdate, updateClient, toast]);

  // ── Expand handler ─────────────────────────────────────────────────────────

  const handleExpand = () => {
    setIsExpanded(true);
    if (!hasFetched) fetchSuggestions();
  };

  return (
    <div className="p-5 glass-main border border-white/10 rounded-xl">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Smart Email Drafts
        </h3>
        <div className="flex items-center gap-1">
          {hasFetched && (
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-gray-400 hover:text-white"
              onClick={() => fetchSuggestions(true)}
              disabled={isLoading}
              title="Refresh suggestions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          )}
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-gray-400 hover:text-white"
            onClick={() => {
              if (!isExpanded) { handleExpand(); } else { setIsExpanded(false); }
            }}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      <p className="text-[11px] text-gray-500 mb-3">
        Ready-to-send emails tailored to your client's current trip.
      </p>

      {!isExpanded ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 border-purple-500/20 bg-purple-500/5 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 text-xs gap-2"
          onClick={handleExpand}
        >
          <MessageCirclePlus className="w-3.5 h-3.5" />
          Draft an Email for This Client
        </Button>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-gray-400 text-sm">
          <UniqueLoading variant="morph" size="sm" />
          <p className="text-[11px] animate-pulse">Writing email drafts...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {suggestions.map(suggestion => {
            const style = categoryStyles[suggestion.category] || categoryStyles.update;
            const Icon = style.icon;
            const email = emailOverrides[suggestion.id] ?? { subject: suggestion.subject, body: suggestion.body };
            const isEditing = editingId === suggestion.id;
            const isRedo = redoingId === suggestion.id;
            const isCustom = suggestion.category === "custom";

            return (
              <div
                key={suggestion.id}
                className={`rounded-lg border ${style.border} ${style.bg} p-3 transition-all duration-200`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-md ${style.bg} border ${style.border} shrink-0 mt-0.5`}>
                    <Icon className={`w-3.5 h-3.5 ${style.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">{suggestion.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{suggestion.preview}</p>

                    {/* Custom message input */}
                    {isCustom && (
                      <div className="mt-2">
                        <Input
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          placeholder="Type your custom message..."
                          className="h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                        />
                      </div>
                    )}

                    {/* Email preview / Editor */}
                    {isEditing ? (
                      <div className="mt-3 p-3 rounded-lg bg-black/40 border border-white/10 space-y-3">
                        <div>
                          <label className="text-[9px] text-gray-400 uppercase tracking-wider font-bold block mb-1">Subject</label>
                          <input
                            type="text"
                            value={email.subject}
                            onChange={(e) => handleEmailChange(suggestion.id, "subject", e.target.value)}
                            className="w-full text-xs text-white bg-white/5 border border-white/10 rounded px-2.5 py-1.5 focus:outline-none focus:border-purple-500/50"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400 uppercase tracking-wider font-bold block mb-1">Email Body</label>
                          <textarea
                            rows={6}
                            value={email.body}
                            onChange={(e) => handleEmailChange(suggestion.id, "body", e.target.value)}
                            className="w-full text-xs text-gray-300 bg-white/5 border border-white/10 rounded px-2.5 py-1.5 focus:outline-none focus:border-purple-500/50 resize-y whitespace-pre-wrap font-sans"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 text-[10px] text-gray-400 hover:text-white hover:bg-white/5"
                            onClick={() => setEditingId(null)}
                          >
                            Close Editor
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setEditingId(suggestion.id)}
                        className="mt-2 p-2 rounded-md bg-black/20 border border-white/5 hover:border-white/10 cursor-pointer space-y-1 group relative transition-colors duration-150"
                        title="Click to edit draft"
                      >
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex gap-1">
                          <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300">Click to Edit</span>
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Subject:</p>
                        <p className="text-xs text-gray-200 font-medium line-clamp-1">{email.subject}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-1.5">Preview:</p>
                        <p className="text-[11px] text-gray-300 line-clamp-2 whitespace-pre-wrap">{email.body}</p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-blue-400 hover:bg-blue-500/10 gap-1"
                      onClick={() => handleSend(suggestion)}
                      disabled={!clientEmail || isRedo || (isCustom && !customMessage.trim())}
                    >
                      <Send className="w-3 h-3" />
                      Send
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-gray-400 hover:bg-white/10 gap-1"
                      onClick={() => handleRedo(suggestion)}
                      disabled={isRedo}
                    >
                      {isRedo ? (
                        <UniqueLoading variant="morph" size="sm" className="w-3.5 h-3.5" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      Redo
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 px-2 text-xs gap-1 ${isEditing ? "text-purple-400 bg-purple-500/10" : "text-gray-400 hover:bg-white/10"}`}
                      onClick={() => setEditingId(isEditing ? null : suggestion.id)}
                    >
                      <Pencil className="w-3 h-3" />
                      {isEditing ? "Editing" : "Edit"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-emerald-400 hover:bg-emerald-500/10 gap-1"
                      onClick={() => handleCopy(suggestion.id, email.subject, email.body)}
                    >
                      {copiedId === suggestion.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {!clientEmail && (
            <p className="text-[11px] text-amber-400 mt-2 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Add a client email to use the Send feature.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
