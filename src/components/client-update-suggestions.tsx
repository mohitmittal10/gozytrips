"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Send, LoaderCircle, MessageCirclePlus, CheckCircle2,
  Clock, Wallet, Pencil, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  generateUpdateSuggestions,
  generateClientUpdateEmail,
} from "@/ai/flows/generate-client-update";
import type { ClientUpdateContext, UpdateSuggestionsOutput } from "@/ai/flows/generate-client-update";

// ── Types ────────────────────────────────────────────────────────────────────

interface ClientUpdateSuggestionsProps {
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

// ── Category styling ─────────────────────────────────────────────────────────

const categoryStyles: Record<string, { icon: typeof Send; color: string; bg: string; border: string }> = {
  booking: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  reminder: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  update: { icon: Send, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  payment: { icon: Wallet, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  custom: { icon: Pencil, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
};

// ── Mailto helper ────────────────────────────────────────────────────────────

function openGmailCompose(to: string, subject: string, body: string) {
  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl, "_blank");
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ClientUpdateSuggestions({
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

  const [suggestions, setSuggestions] = useState<UpdateSuggestionsOutput["suggestions"]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Email generation state per suggestion
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedEmails, setGeneratedEmails] = useState<Record<string, { subject: string; body: string }>>({});

  // Custom message state
  const [customMessage, setCustomMessage] = useState("");

  // ── Build context ─────────────────────────────────────────────────────────

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

  // ── Fetch suggestions ─────────────────────────────────────────────────────

  const fetchSuggestions = useCallback(async () => {
    setIsLoadingSuggestions(true);
    try {
      const result = await generateUpdateSuggestions(buildContext());
      setSuggestions(result.suggestions);
      setHasFetched(true);
    } catch (err: any) {
      console.error("Failed to fetch suggestions:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to load AI suggestions." });
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [buildContext, toast]);

  // ── Generate email for a suggestion ────────────────────────────────────────

  const handleGenerateEmail = useCallback(async (suggestionId: string, suggestionTitle: string) => {
    setGeneratingId(suggestionId);
    try {
      const context = buildContext();
      const result = await generateClientUpdateEmail({
        ...context,
        suggestionTitle,
        customMessage: suggestionTitle === "Send Custom Update" ? customMessage : undefined,
      });
      setGeneratedEmails(prev => ({
        ...prev,
        [suggestionId]: { subject: result.subject, body: result.body },
      }));
    } catch (err: any) {
      console.error("Failed to generate email:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate the email." });
    } finally {
      setGeneratingId(null);
    }
  }, [buildContext, customMessage, toast]);

  // ── Send email ─────────────────────────────────────────────────────────────

  const handleSendEmail = useCallback((suggestionId: string) => {
    const email = generatedEmails[suggestionId];
    if (!email || !clientEmail) return;
    openGmailCompose(clientEmail, email.subject, email.body);
    toast({ title: "Opening Gmail", description: `Email pre-filled for ${clientName}.` });
  }, [generatedEmails, clientEmail, clientName, toast]);

  return (
    <div className="p-5 glass-main border border-white/10 rounded-xl">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          AI Client Updates
        </h3>
        <div className="flex items-center gap-1">
          {hasFetched && (
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-gray-400 hover:text-white"
              onClick={fetchSuggestions}
              disabled={isLoadingSuggestions}
              title="Refresh suggestions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSuggestions ? "animate-spin" : ""}`} />
            </Button>
          )}
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-gray-400 hover:text-white"
            onClick={() => {
              setIsExpanded(!isExpanded);
              if (!hasFetched && !isExpanded) fetchSuggestions();
            }}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      <p className="text-[11px] text-gray-500 mb-3">
        Smart suggestions to keep your client updated via email.
      </p>

      {!isExpanded ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 border-purple-500/20 bg-purple-500/5 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 text-xs gap-2"
          onClick={() => {
            setIsExpanded(true);
            if (!hasFetched) fetchSuggestions();
          }}
        >
          <MessageCirclePlus className="w-3.5 h-3.5" />
          Show AI Suggestions
        </Button>
      ) : isLoadingSuggestions && !hasFetched ? (
        <div className="flex items-center justify-center py-6 gap-2 text-gray-400 text-sm">
          <LoaderCircle className="w-4 h-4 animate-spin" />
          Loading AI suggestions...
        </div>
      ) : (
        <div className="space-y-2">
          {suggestions.map(suggestion => {
            const style = categoryStyles[suggestion.category] || categoryStyles.update;
            const Icon = style.icon;
            const email = generatedEmails[suggestion.id];
            const isGenerating = generatingId === suggestion.id;
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
                    {isCustom && !email && (
                      <div className="mt-2">
                        <Input
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          placeholder="Type your custom message..."
                          className="h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                        />
                      </div>
                    )}

                    {/* Generated email preview */}
                    {email && (
                      <div className="mt-2 p-2 rounded-md bg-black/20 border border-white/5 space-y-1">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Subject:</p>
                        <p className="text-xs text-gray-200 font-medium">{email.subject}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-1.5">Body:</p>
                        <p className="text-[11px] text-gray-300 line-clamp-3 whitespace-pre-wrap">{email.body}</p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1 shrink-0">
                    {!email ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-2 text-xs ${style.color} hover:bg-white/10 gap-1`}
                        onClick={() => handleGenerateEmail(suggestion.id, suggestion.title)}
                        disabled={isGenerating || (isCustom && !customMessage.trim())}
                      >
                        {isGenerating ? (
                          <LoaderCircle className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            Generate
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-blue-400 hover:bg-blue-500/10 gap-1"
                          onClick={() => handleSendEmail(suggestion.id)}
                          disabled={!clientEmail}
                        >
                          <Send className="w-3 h-3" />
                          Send
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-gray-400 hover:bg-white/10 gap-1"
                          onClick={() => handleGenerateEmail(suggestion.id, suggestion.title)}
                        >
                          <RefreshCw className="w-3 h-3" />
                          Redo
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* No client email warning */}
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
