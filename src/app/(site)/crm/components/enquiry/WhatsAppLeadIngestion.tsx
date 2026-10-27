"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  MessageSquare, Sparkles, Send, Copy, Check, ArrowRight, ExternalLink,
  Calendar, Users, DollarSign, MapPin, Trash2, RefreshCw, FileText,
  Upload, AlertCircle, Clock, CheckCircle2, ChevronDown, ChevronUp,
  Info, HelpCircle, Phone, Mail, Compass, Shield, Plus, Loader2,
  X, Filter, Search, Zap, Plane, CheckCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useWhatsAppIngest } from "@/hooks/use-whatsapp-ingest";
import { useWhatsAppMetaIntegration } from "@/hooks/use-whatsapp-meta-integration";
import { useClients } from "@/lib/hooks/use-clients";
import { useCrmContext } from "../../context/CrmContext";
import { WhatsAppMetaConnectBar } from "./WhatsAppMetaConnectBar";
import type { ExtractedWhatsAppLead, IngestedWhatsAppLeadRecord, TripType } from "@/types/enquiry";

// ── Sample WhatsApp Transcripts for Instant Testing ──────────────────────────
const SAMPLE_CHATS = [
  {
    label: "🏝️ Bali Honeymoon",
    desc: "Couple with pool villa & romantic requests",
    text: `[21/10/26, 11:15 AM] Vikram Malhotra: Hi WanderLabs! My wife and I are planning our honeymoon to Bali in early December.
[21/10/26, 11:16 AM] Vikram Malhotra: Looking for 6 nights / 7 days around Dec 5th to Dec 11th. Flying from Mumbai.
[21/10/26, 11:18 AM] Vikram Malhotra: Budget is around ₹2,50,000. We really want 3 nights in a private pool villa in Ubud and 3 nights in a beachfront luxury resort in Seminyak.
[21/10/26, 11:20 AM] Vikram Malhotra: Must include candlelight dinner, couple spa, and floating breakfast. Avoid crowded group tours.
[21/10/26, 11:21 AM] Vikram Malhotra: Please contact me on this number or vikram.malhotra91@gmail.com. Thanks!`,
  },
  {
    label: "🏔️ Kashmir Family Trip",
    desc: "4 Pax family with houseboat & Gulmarg Gondola",
    text: `[21/10/26, 2:30 PM] Priya Sharma: Hello! We want a customized Kashmir package for our family.
2 adults and 2 kids (ages 7 and 10).
Dates: 18th November to 24th November 2026.
Origin: New Delhi.
Destinations: Srinagar, Gulmarg, and Pahalgam.
We need 4-star hotels and 1 night on Dal Lake luxury houseboat with MAP meal plan (breakfast + dinner).
Must have: Gondola Phase 2 tickets in Gulmarg and Shikara ride.
Budget: Approx 1.8 Lakhs INR.
Phone: 9811223344. Please send a quote soon!`,
  },
  {
    label: "🏙️ Dubai Luxury Getaway",
    desc: "Friends group with desert safari & yacht",
    text: `Hey, need a 5-day Dubai itinerary for 3 adults traveling around 10th January 2027.
Flying from Bangalore. Budget is $3,500 total.
Looking for 5-star hotel near Downtown or Marina.
Must include private desert safari with VIP seating, yacht cruise, and Burj Khalifa 148th floor.
Pure vegetarian breakfast needed for 1 person.
Contact Rahul: +91 9741001122.`,
  },
];

interface WhatsAppLeadIngestionProps {
  onSwitchToVendorEnquiry?: (prefillData: {
    destination: string;
    travelDates: string;
    adults: string;
    children: string;
    infants: string;
    specialRequests: string;
  }) => void;
}

export function WhatsAppLeadIngestion({ onSwitchToVendorEnquiry }: WhatsAppLeadIngestionProps) {
  const router = useRouter();
  const { clients } = useClients();
  let crmContext: any = null;
  try {
    crmContext = useCrmContext();
  } catch (e) {
    // context optional
  }

  const {
    leads,
    loading: leadsLoading,
    extracting,
    saving,
    extractedLead,
    setExtractedLead,
    handleExtractLead,
    handleSaveLead,
    handleDeleteLead,
    fetchLeads,
  } = useWhatsAppIngest();

  const {
    integration,
    loading: integrationLoading,
    connecting: integrationConnecting,
    syncing: integrationSyncing,
    connectAccount,
    disconnectAccount,
    updateSettings,
    syncLeads,
  } = useWhatsAppMetaIntegration(fetchLeads);

  // Local Form state for extraction input
  const [chatInput, setChatInput] = useState("");
  const [senderPhoneOverride, setSenderPhoneOverride] = useState("");
  const [senderNameOverride, setSenderNameOverride] = useState("");
  const [showAdvancedInput, setShowAdvancedInput] = useState(false);
  const [copiedReply, setCopiedReply] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);
  const [viewingLeadChat, setViewingLeadChat] = useState<IngestedWhatsAppLeadRecord | null>(null);

  // Editable Lead State (allows modifying extracted values before saving)
  const [editedLead, setEditedLead] = useState<ExtractedWhatsAppLead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "converted">("all");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [createAsNewClient, setCreateAsNewClient] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync editedLead whenever extractedLead changes
  React.useEffect(() => {
    if (extractedLead) {
      setEditedLead(extractedLead);

      // Auto-check if client exists by phone
      if (extractedLead.phone && clients.length > 0) {
        const cleanPhone = extractedLead.phone.replace(/[^0-9]/g, "");
        const match = clients.find(c => {
          if (!c.phone) return false;
          const cp = c.phone.replace(/[^0-9]/g, "");
          return cp.includes(cleanPhone.slice(-10)) || cleanPhone.includes(cp.slice(-10));
        });

        if (match) {
          setSelectedClientId(match.id);
          setCreateAsNewClient(false);
        } else {
          setSelectedClientId(null);
          setCreateAsNewClient(true);
        }
      }
    } else {
      setEditedLead(null);
    }
  }, [extractedLead, clients]);

  // Handle File Upload (.txt WhatsApp export)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setChatInput(text);
      }
    };
    reader.readAsText(file);
  };

  // Run AI Extraction
  const onExtract = async () => {
    if (!chatInput.trim()) return;
    await handleExtractLead(chatInput, {
      defaultPhone: senderPhoneOverride.trim() || undefined,
      defaultName: senderNameOverride.trim() || undefined,
    });
  };

  // Copy AI Suggested Reply
  const handleCopyReply = (textToCopy?: string) => {
    const text = textToCopy || editedLead?.suggestedWhatsAppReply;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedReply(true);
    setTimeout(() => setCopiedReply(false), 2000);
  };

  // Save Lead only
  const handleSaveOnly = async () => {
    if (!editedLead) return;
    await handleSaveLead(editedLead, {
      linkExistingClientId: !createAsNewClient && selectedClientId ? selectedClientId : undefined,
      createClient: createAsNewClient,
    });
  };

  // Save Lead and 1-Click Convert to Itinerary in The Lab
  const handleSaveAndConvert = async () => {
    if (!editedLead) return;
    try {
      const res = await handleSaveLead(editedLead, {
        linkExistingClientId: !createAsNewClient && selectedClientId ? selectedClientId : undefined,
        createClient: createAsNewClient,
      });

      if (res.redirectUrl) {
        router.push(res.redirectUrl);
      }
    } catch (err) {
      console.error("Failed to convert lead:", err);
    }
  };

  // Pre-fill Vendor Enquiry
  const handlePushToVendorEnquiry = () => {
    if (!editedLead || !onSwitchToVendorEnquiry) return;
    const dates = [editedLead.startDate, editedLead.endDate].filter(Boolean).join(" to ") ||
      (editedLead.durationDays ? `${editedLead.durationDays} Days` : "Flexible dates");

    onSwitchToVendorEnquiry({
      destination: editedLead.destinations,
      travelDates: dates,
      adults: String(editedLead.adultPax || 2),
      children: String(editedLead.childPax || 0),
      infants: String(editedLead.infantPax || 0),
      specialRequests: [
        editedLead.hotelPreference ? `Hotel Preference: ${editedLead.hotelPreference}` : "",
        editedLead.mealPlan ? `Meal Plan: ${editedLead.mealPlan}` : "",
        editedLead.mustInclude ? `Must Include: ${editedLead.mustInclude}` : "",
        editedLead.specialRequests || "",
      ].filter(Boolean).join("\n"),
    });
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch =
        !searchQuery ||
        l.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.destinations.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.phone.includes(searchQuery) ||
        (l.summary && l.summary.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "converted" && l.status === "converted") ||
        (statusFilter === "pending" && l.status !== "converted");

      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = leads.length;
    const converted = leads.filter(l => l.status === "converted").length;
    const pending = total - converted;
    return { total, converted, pending };
  }, [leads]);

  return (
    <div className="space-y-6">
      {/* ── Banner & Overview ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <MessageSquare className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                WhatsApp Chat to Lead Ingestion
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-semibold py-0.5">
                  Zero Verification Required
                </Badge>
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-2xl">
              Paste customer WhatsApp messages or chat transcripts. AI extracts destination, dates, pax, budget, and preferences—then pre-fills your CRM leads and generates itineraries in The Lab in 1 click.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWebhookGuide(true)}
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 h-9 gap-1.5 text-xs font-semibold"
            >
              <Zap className="w-3.5 h-3.5" /> Webhook / Auto-Forwarding
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-emerald-500/15">
          <div className="bg-white/60 dark:bg-black/30 backdrop-blur rounded-xl p-3 border border-emerald-500/10">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Ingested Leads</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.total}</p>
          </div>
          <div className="bg-white/60 dark:bg-black/30 backdrop-blur rounded-xl p-3 border border-emerald-500/10">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Converted to Itineraries</p>
            <p className="text-2xl font-bold text-emerald-500 mt-0.5">{stats.converted}</p>
          </div>
          <div className="bg-white/60 dark:bg-black/30 backdrop-blur rounded-xl p-3 border border-emerald-500/10">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Pending Action</p>
            <p className="text-2xl font-bold text-amber-400 mt-0.5">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* ── WhatsApp & Meta Integration Control Hub ─────────────────────── */}
      <WhatsAppMetaConnectBar
        integration={integration}
        loading={integrationLoading}
        syncing={integrationSyncing}
        connecting={integrationConnecting}
        onConnect={connectAccount}
        onDisconnect={disconnectAccount}
        onUpdateSettings={updateSettings}
        onSync={syncLeads}
      />

      {/* ── Extraction Workspace Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Chat Input & Dropzone (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-200 dark:border-white/10 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  Paste WhatsApp Chat
                </CardTitle>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt"
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload .txt
                </Button>
              </div>
              <CardDescription className="text-xs text-slate-500 dark:text-zinc-400">
                Copy text from WhatsApp Web/App, or load a sample scenario below.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Sample Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  Quick Test Scenarios:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_CHATS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setChatInput(sample.text);
                        setSenderPhoneOverride("");
                        setSenderNameOverride("");
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-slate-700 dark:text-zinc-300 transition-all text-left"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Textarea */}
              <div className="relative">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Paste customer WhatsApp message or export transcript...\n\nExample:\n"Hi, we need a 5-day package to Bali for 2 adults in early December. Budget 2 lakhs. Contact Rohit at 9876543210."`}
                  rows={8}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/40 p-3 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y font-mono leading-relaxed"
                />
                {chatInput && (
                  <button
                    onClick={() => setChatInput("")}
                    className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                    title="Clear"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Advanced Sender Overrides Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedInput(!showAdvancedInput)}
                  className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-medium transition-all"
                >
                  {showAdvancedInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {showAdvancedInput ? "Hide optional sender overrides" : "Add sender phone/name manually"}
                </button>

                {showAdvancedInput && (
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-white/10 animate-in fade-in duration-200">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase">Sender Phone</label>
                      <input
                        type="text"
                        value={senderPhoneOverride}
                        onChange={(e) => setSenderPhoneOverride(e.target.value)}
                        placeholder="+91 98765..."
                        className="w-full h-8 mt-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 px-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase">Sender Name</label>
                      <input
                        type="text"
                        value={senderNameOverride}
                        onChange={(e) => setSenderNameOverride(e.target.value)}
                        placeholder="John Doe"
                        className="w-full h-8 mt-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 px-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Extract Action Button */}
              <Button
                onClick={onExtract}
                disabled={extracting || !chatInput.trim()}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/20 gap-2 transition-all cursor-pointer"
              >
                {extracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Chat with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    Extract Lead with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Extracted Lead Review & Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {editedLead ? (
            <Card className="border-emerald-500/30 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-xl animate-in fade-in duration-300">
              <CardHeader className="pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> AI Extracted Lead
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {editedLead.confidenceScore}% Confidence
                      </Badge>
                      <Badge
                        className={cn(
                          "text-xs capitalize",
                          editedLead.urgency === "urgent" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                          editedLead.urgency === "high" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                          "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        )}
                      >
                        {editedLead.urgency} Urgency
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                      {editedLead.clientName} → {editedLead.destinations}
                    </CardTitle>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setExtractedLead(null);
                      setEditedLead(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white h-8 text-xs"
                  >
                    Clear Review
                  </Button>
                </div>

                {/* Key Summary Box */}
                {editedLead.keySummary && (
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                    <span>{editedLead.keySummary}</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* Client Link / New Client Selector */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary" /> CRM Client Association
                    </span>
                    {selectedClientId && (
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                        Matched Existing Client
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-zinc-300">
                      <input
                        type="radio"
                        checked={createAsNewClient}
                        onChange={() => setCreateAsNewClient(true)}
                        className="text-primary focus:ring-primary"
                      />
                      Create as New Client
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-zinc-300">
                      <input
                        type="radio"
                        checked={!createAsNewClient}
                        onChange={() => setCreateAsNewClient(false)}
                        className="text-primary focus:ring-primary"
                      />
                      Link to Existing Client
                    </label>
                  </div>

                  {!createAsNewClient && (
                    <select
                      value={selectedClientId || ""}
                      onChange={(e) => setSelectedClientId(e.target.value || null)}
                      className="w-full h-8 mt-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-800 px-2.5 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">Select a client...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Editable Lead Parameters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-zinc-400">Client Name</label>
                    <input
                      type="text"
                      value={editedLead.clientName}
                      onChange={(e) => setEditedLead({ ...editedLead, clientName: e.target.value })}
                      className="w-full h-9 mt-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 dark:text-zinc-400">Phone Number</label>
                    <input
                      type="text"
                      value={editedLead.phone}
                      onChange={(e) => setEditedLead({ ...editedLead, phone: e.target.value })}
                      className="w-full h-9 mt-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 dark:text-zinc-400">Destinations</label>
                    <input
                      type="text"
                      value={editedLead.destinations}
                      onChange={(e) => setEditedLead({ ...editedLead, destinations: e.target.value })}
                      className="w-full h-9 mt-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 dark:text-zinc-400">Starting City (Origin)</label>
                    <input
                      type="text"
                      value={editedLead.startingLocation}
                      onChange={(e) => setEditedLead({ ...editedLead, startingLocation: e.target.value })}
                      className="w-full h-9 mt-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 dark:text-zinc-400">Start Date</label>
                    <input
                      type="date"
                      value={editedLead.startDate || ""}
                      onChange={(e) => setEditedLead({ ...editedLead, startDate: e.target.value || null })}
                      className="w-full h-9 mt-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 dark:text-zinc-400">End Date</label>
                    <input
                      type="date"
                      value={editedLead.endDate || ""}
                      onChange={(e) => setEditedLead({ ...editedLead, endDate: e.target.value || null })}
                      className="w-full h-9 mt-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Pax Trio */}
                  <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                    <div>
                      <label className="font-semibold text-slate-600 dark:text-zinc-400">Adults (12+)</label>
                      <input
                        type="number"
                        min={1}
                        value={editedLead.adultPax}
                        onChange={(e) => setEditedLead({ ...editedLead, adultPax: parseInt(e.target.value, 10) || 1 })}
                        className="w-full h-9 mt-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 px-3 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 dark:text-zinc-400">Children (2-11)</label>
                      <input
                        type="number"
                        min={0}
                        value={editedLead.childPax}
                        onChange={(e) => setEditedLead({ ...editedLead, childPax: parseInt(e.target.value, 10) || 0 })}
                        className="w-full h-9 mt-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 px-3 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 dark:text-zinc-400">Infants (&lt;2)</label>
                      <input
                        type="number"
                        min={0}
                        value={editedLead.infantPax}
                        onChange={(e) => setEditedLead({ ...editedLead, infantPax: parseInt(e.target.value, 10) || 0 })}
                        className="w-full h-9 mt-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 px-3 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Budget & Trip Type */}
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-zinc-400">Budget</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={editedLead.currency}
                        onChange={(e) => setEditedLead({ ...editedLead, currency: e.target.value.toUpperCase() })}
                        className="w-16 h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 px-2 text-xs font-bold text-slate-900 dark:text-white uppercase"
                      />
                      <input
                        type="number"
                        value={editedLead.budget || ""}
                        placeholder="e.g. 150000"
                        onChange={(e) => setEditedLead({ ...editedLead, budget: parseFloat(e.target.value) || null })}
                        className="flex-1 h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 px-3 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 dark:text-zinc-400">Trip Style</label>
                    <select
                      value={editedLead.tripType || "relaxed"}
                      onChange={(e) => setEditedLead({ ...editedLead, tripType: e.target.value as TripType })}
                      className="w-full h-9 mt-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 px-2.5 text-xs text-slate-900 dark:text-white capitalize"
                    >
                      <option value="romantic">Romantic / Honeymoon</option>
                      <option value="family">Family Holiday</option>
                      <option value="adventurous">Adventurous</option>
                      <option value="scenic">Scenic & Nature</option>
                      <option value="relaxed">Relaxed Leisure</option>
                      <option value="cultural">Cultural & Heritage</option>
                      <option value="foodie">Foodie</option>
                    </select>
                  </div>
                </div>

                {/* Preferences & Highlights */}
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-zinc-400">Must Include Highlights</label>
                    <input
                      type="text"
                      value={editedLead.mustInclude || ""}
                      placeholder="e.g. Shikara ride, Gondola Phase 2, Dal Lake Houseboat"
                      onChange={(e) => setEditedLead({ ...editedLead, mustInclude: e.target.value || null })}
                      className="w-full h-9 mt-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 px-3 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  {editedLead.specialRequests && (
                    <div>
                      <label className="font-semibold text-slate-600 dark:text-zinc-400">Special Notes & Constraints</label>
                      <textarea
                        value={editedLead.specialRequests}
                        rows={2}
                        onChange={(e) => setEditedLead({ ...editedLead, specialRequests: e.target.value || null })}
                        className="w-full mt-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 p-2.5 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                {/* AI Suggested WhatsApp Reply Box */}
                {editedLead.suggestedWhatsAppReply && (
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> AI WhatsApp Reply Generator
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyReply()}
                        className="h-7 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 gap-1.5 font-semibold"
                      >
                        {copiedReply ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy Reply</>}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-zinc-300 font-mono bg-white/60 dark:bg-black/40 p-2.5 rounded-lg border border-emerald-500/10 whitespace-pre-wrap leading-relaxed">
                      {editedLead.suggestedWhatsAppReply}
                    </p>
                  </div>
                )}

                {/* One-Click Action Toolbar */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                  <Button
                    onClick={handleSaveAndConvert}
                    disabled={saving}
                    className="w-full sm:flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold shadow-lg shadow-emerald-500/20 gap-2 cursor-pointer"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-emerald-200" />
                        Convert to Itinerary in The Lab
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleSaveOnly}
                    disabled={saving}
                    className="w-full sm:w-auto h-11 rounded-xl border-slate-300 dark:border-white/20 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 font-semibold gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Save as Lead
                  </Button>

                  {onSwitchToVendorEnquiry && (
                    <Button
                      variant="ghost"
                      onClick={handlePushToVendorEnquiry}
                      className="w-full sm:w-auto h-11 text-xs text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white"
                      title="Prefill Vendor Enquiry form"
                    >
                      Send Vendor Quote
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Empty State / Welcome card */
            <div className="h-full min-h-[380px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 p-8 flex flex-col items-center justify-center text-center space-y-3 bg-white/30 dark:bg-white/[0.01]">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Chat Analyzed Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm leading-relaxed">
                Paste a WhatsApp chat message or pick one of the sample scenarios on the left. Gemini will extract destinations, dates, budgets, and prefill your itinerary form instantly.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Badge variant="outline" className="text-[11px] text-slate-500 dark:text-zinc-400 border-dashed">
                  100% Client-Side / Secure
                </Badge>
                <Badge variant="outline" className="text-[11px] text-slate-500 dark:text-zinc-400 border-dashed">
                  Auto-Detects Currency & Dates
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Ingested WhatsApp Leads Pipeline Table ─────────────────────────── */}
      <Card className="border-slate-200 dark:border-white/10 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl shadow-lg mt-8">
        <CardHeader className="pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Ingested WhatsApp Leads Pipeline
                <Badge variant="secondary" className="ml-1 text-xs">
                  {filteredLeads.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-zinc-400">
                All WhatsApp customer requests parsed and saved to this agency workspace.
              </CardDescription>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search lead or destination..."
                  className="w-44 sm:w-56 h-8 pl-8 pr-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 p-0.5 text-xs">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-all",
                    statusFilter === "all" ? "bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white font-bold" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-all",
                    statusFilter === "pending" ? "bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white font-bold" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter("converted")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-all",
                    statusFilter === "converted" ? "bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white font-bold" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  Converted
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {leadsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <p className="text-xs">Loading WhatsApp leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-zinc-500 space-y-1">
              <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-sm font-semibold">No WhatsApp leads found</p>
              <p className="text-xs">Paste and extract a WhatsApp conversation above to populate this list.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Traveler & Contact</th>
                    <th className="py-3 px-4">Destination & Route</th>
                    <th className="py-3 px-4">Travelers & Dates</th>
                    <th className="py-3 px-4">Budget</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                  {filteredLeads.map((lead) => {
                    const isConverted = lead.status === "converted";
                    const paxSummary = `${lead.adultPax}A` + (lead.childPax ? ` + ${lead.childPax}C` : "") + (lead.infantPax ? ` + ${lead.infantPax}I` : "");

                    return (
                      <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group">
                        {/* Traveler */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {lead.clientName}
                            {lead.urgency === "urgent" && (
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Urgent lead" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                            {lead.phone && (
                              <span className="flex items-center gap-0.5">
                                <Phone className="w-3 h-3 text-emerald-500" /> {lead.phone}
                              </span>
                            )}
                            {lead.channelSource === "meta_lead_ad" ? (
                              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[9px] font-semibold py-0 px-1.5 h-4">
                                Meta Ad
                              </Badge>
                            ) : lead.channelSource === "whatsapp_cloud" ? (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-semibold py-0 px-1.5 h-4">
                                WhatsApp Cloud
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-white/10 text-[9px] font-semibold py-0 px-1.5 h-4">
                                WhatsApp
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Destination */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{lead.destinations}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            From {lead.startingLocation || "New Delhi"}
                          </div>
                        </td>

                        {/* Pax & Dates */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-zinc-300">
                            <Users className="w-3 h-3 text-primary" /> {paxSummary}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {lead.startDate ? new Date(lead.startDate).toLocaleDateString() : (lead.durationDays ? `${lead.durationDays} Days` : "Dates Flexible")}
                          </div>
                        </td>

                        {/* Budget */}
                        <td className="py-3 px-4">
                          {lead.budget ? (
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {lead.currency} {lead.budget.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {isConverted ? (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-semibold">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Converted
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-semibold">
                              <Clock className="w-3 h-3 mr-1" /> Pending Lead
                            </Badge>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1-Click WhatsApp Reply */}
                            {lead.phone && (
                              <a
                                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}${lead.suggestedWhatsAppReply ? `?text=${encodeURIComponent(lead.suggestedWhatsAppReply)}` : ""}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-8 px-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-md flex items-center gap-1 font-semibold text-xs transition-colors"
                                title="Open WhatsApp Web with AI suggested reply"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">WhatsApp</span>
                              </a>
                            )}

                            {/* Convert to Itinerary in The Lab */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/the-lab?enquiry=${lead.id}`)}
                              className="h-8 px-2.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold gap-1"
                              title="Generate Itinerary in The Lab"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              The Lab
                            </Button>

                            {/* View Raw Chat & Breakdown */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingLeadChat(lead)}
                              className="h-8 px-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                              title="View Chat & Extraction Details"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </Button>

                            {/* Delete */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLead(lead.id)}
                              className="h-8 px-2 text-slate-400 hover:text-red-500"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal: View Full Lead & Raw Chat ───────────────────────────────── */}
      {viewingLeadChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  {viewingLeadChat.clientName} — WhatsApp Lead
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Ingested on {new Date(viewingLeadChat.submittedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setViewingLeadChat(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Summary */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300 font-medium">
                {viewingLeadChat.summary}
              </div>

              {/* Trip Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Destination</span>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{viewingLeadChat.destinations}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Starting From</span>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{viewingLeadChat.startingLocation || "N/A"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Pax</span>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {viewingLeadChat.adultPax} Adults, {viewingLeadChat.childPax} Children
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Dates</span>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {viewingLeadChat.startDate ? new Date(viewingLeadChat.startDate).toLocaleDateString() : "Flexible"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Budget</span>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {viewingLeadChat.budget ? `${viewingLeadChat.currency} ${viewingLeadChat.budget.toLocaleString()}` : "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Contact</span>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{viewingLeadChat.phone || viewingLeadChat.clientEmail}</p>
                </div>
              </div>

              {/* Suggested Reply */}
              {viewingLeadChat.suggestedWhatsAppReply && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-700 dark:text-zinc-300">Suggested WhatsApp Reply:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyReply(viewingLeadChat.suggestedWhatsAppReply)}
                      className="h-6 text-[11px] gap-1 text-emerald-500"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </Button>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 font-mono whitespace-pre-wrap text-slate-800 dark:text-zinc-200">
                    {viewingLeadChat.suggestedWhatsAppReply}
                  </pre>
                </div>
              )}

              {/* Original Chat Transcript */}
              {viewingLeadChat.rawChat && (
                <div>
                  <span className="font-bold text-slate-700 dark:text-zinc-300 block mb-1.5">Original WhatsApp Transcript:</span>
                  <pre className="p-3 rounded-lg bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 font-mono whitespace-pre-wrap text-slate-600 dark:text-zinc-400 max-h-48 overflow-y-auto">
                    {viewingLeadChat.rawChat}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-white/[0.01]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingLeadChat(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setViewingLeadChat(null);
                  router.push(`/the-lab?enquiry=${viewingLeadChat.id}`);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" /> Open in The Lab
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Webhook & Zero-Verification Automation Guide ─────────────── */}
      {showWebhookGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Automate WhatsApp Ingestion (Zero Legal Work)
                </h3>
              </div>
              <button
                onClick={() => setShowWebhookGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              You do <strong>not</strong> need Meta verification or business approval to automatically send WhatsApp messages into this CRM. You can use standard automation tools:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-1.5">
                <span className="font-bold text-slate-800 dark:text-white block">1. Personal WhatsApp Web / Mobile Shortcut</span>
                <p className="text-slate-600 dark:text-zinc-400">
                  Select any chat text in WhatsApp Web or on iPhone/Android, and trigger a shortcut to POST the message directly into this CRM.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-1.5">
                <span className="font-bold text-slate-800 dark:text-white block">2. No-Code Webhook (Make.com / Zapier / MacroDroid)</span>
                <p className="text-slate-600 dark:text-zinc-400">
                  Whenever an incoming notification arrives on your business phone, send a webhook POST to:
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 p-2 rounded-lg bg-black text-emerald-400 text-[11px] font-mono select-all overflow-x-auto">
                    {typeof window !== "undefined" ? `${window.location.origin}/api/enquiry/whatsapp-ingest` : "/api/enquiry/whatsapp-ingest"}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = typeof window !== "undefined" ? `${window.location.origin}/api/enquiry/whatsapp-ingest` : "/api/enquiry/whatsapp-ingest";
                      navigator.clipboard.writeText(url);
                      setCopiedWebhook(true);
                      setTimeout(() => setCopiedWebhook(false), 2000);
                    }}
                    className="h-8 text-xs shrink-0"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setShowWebhookGuide(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
