"use client";

import React, { useState, useEffect } from "react";
import {
  X, Zap, Check, Sparkles, MessageSquare, Globe, Shield,
  Layers, Copy, ExternalLink, HelpCircle, AlertCircle, Loader2,
  RefreshCw, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { fetchJson } from "@/lib/fetch-json";
import type { WhatsAppMetaIntegration } from "@/types/enquiry";

interface ConnectMetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  integration: WhatsAppMetaIntegration | null;
  onConnect: (params: any) => Promise<boolean>;
  onDisconnect?: () => Promise<boolean>;
  connecting: boolean;
}

export function ConnectMetaModal({
  isOpen,
  onClose,
  integration,
  onConnect,
  onDisconnect,
  connecting,
}: ConnectMetaModalProps) {
  // Form states
  const [accountName, setAccountName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaPageName, setMetaPageName] = useState("");
  const [metaPageId, setMetaPageId] = useState("");
  const [metaFormId, setMetaFormId] = useState("");
  const [metaFormName, setMetaFormName] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [autoSync, setAutoSync] = useState(true);

  // Dynamic discovery states from Meta Graph API
  const [loadingResources, setLoadingResources] = useState(false);
  const [discoveredPages, setDiscoveredPages] = useState<Array<{ id: string; name: string; pageAccessToken?: string }>>([]);
  const [discoveredForms, setDiscoveredForms] = useState<Array<{ id: string; name: string; status: string; leadsCount: number }>>([]);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [discoverySuccess, setDiscoverySuccess] = useState<string | null>(null);

  const [copiedWebhook, setCopiedWebhook] = useState(false);

  useEffect(() => {
    if (integration) {
      setAccountName(integration.accountName || "");
      setPhoneNumber(integration.phoneNumber || "");
      setMetaPageName(integration.metaPageName || "");
      setMetaFormId(integration.metaFormId || "");
      setPhoneNumberId(integration.phoneNumberId || "");
      setAutoSync(integration.autoSync ?? true);
    } else {
      setAccountName("");
      setPhoneNumber("");
      setMetaAccessToken("");
      setMetaPageName("");
      setMetaFormId("");
      setPhoneNumberId("");
      setAutoSync(true);
    }
    setDiscoveryError(null);
    setDiscoverySuccess(null);
  }, [integration, isOpen]);

  if (!isOpen) return null;

  // Dynamically fetch actual Facebook Pages & Lead Forms from Meta Graph API
  const handleDiscoverResources = async (tokenToUse?: string) => {
    const token = (tokenToUse || metaAccessToken).trim();
    if (!token) {
      setDiscoveryError("Please enter your Meta User or System User Access Token first.");
      return;
    }

    setLoadingResources(true);
    setDiscoveryError(null);
    setDiscoverySuccess(null);

    try {
      const res = await fetchJson<{
        success: boolean;
        user?: { id: string; name: string };
        pages: Array<{ id: string; name: string; pageAccessToken?: string }>;
        forms: Array<{ id: string; name: string; status: string; leadsCount: number }>;
      }>("/api/integrations/whatsapp-meta/meta-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token }),
      });

      if (res.pages && res.pages.length > 0) {
        setDiscoveredPages(res.pages);
        if (!metaPageId) {
          setMetaPageId(res.pages[0].id);
          setMetaPageName(res.pages[0].name);
        }
      }

      if (res.forms && res.forms.length > 0) {
        setDiscoveredForms(res.forms);
        if (!metaFormId) {
          setMetaFormId(res.forms[0].id);
          setMetaFormName(res.forms[0].name);
        }
      }

      setDiscoverySuccess(
        `Connected to Meta as "${res.user?.name || "Business User"}". Found ${res.pages?.length || 0} Pages and ${res.forms?.length || 0} Lead Forms.`
      );
    } catch (err: any) {
      setDiscoveryError(err.message || "Failed to connect to Meta Graph API. Please verify token permissions.");
    } finally {
      setLoadingResources(false);
    }
  };

  // When user selects a different Page, dynamically load that Page's forms
  const handlePageChange = async (selectedPageId: string) => {
    setMetaPageId(selectedPageId);
    const matched = discoveredPages.find((p) => p.id === selectedPageId);
    if (matched) setMetaPageName(matched.name);

    if (!metaAccessToken && !integration) return;

    setLoadingResources(true);
    try {
      const res = await fetchJson<{
        success: boolean;
        forms: Array<{ id: string; name: string; status: string; leadsCount: number }>;
      }>("/api/integrations/whatsapp-meta/meta-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: metaAccessToken || undefined,
          pageId: selectedPageId,
        }),
      });

      setDiscoveredForms(res.forms || []);
      if (res.forms && res.forms.length > 0) {
        setMetaFormId(res.forms[0].id);
        setMetaFormName(res.forms[0].name);
      } else {
        setMetaFormId("");
        setMetaFormName("");
      }
    } catch (e) {
      // ignore
    } finally {
      setLoadingResources(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    const success = await onConnect({
      accountName: accountName.trim() || metaPageName || "My WhatsApp & Meta Hub",
      phoneNumber: phoneNumber.trim(),
      provider: "meta_whatsapp",
      metaPageName: metaPageName.trim() || undefined,
      metaFormId: metaFormId.trim() || undefined,
      metaAccessToken: metaAccessToken.trim() || undefined,
      phoneNumberId: phoneNumberId.trim() || undefined,
      autoSync,
    });

    if (success) {
      onClose();
    }
  };

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/integrations/meta/webhook`
    : "/api/integrations/meta/webhook";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 text-white flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {integration ? "Manage WhatsApp & Meta Connection" : "Connect WhatsApp & Meta for Actual Leads"}
                <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[10px] font-semibold">
                  Zero POST Requests
                </Badge>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Directly fetch live submitted leads from Meta Lead Ads & incoming WhatsApp chats
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Section 1: WhatsApp Business Details */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-zinc-200">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              1. WhatsApp Business Channel
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  Business WhatsApp Number <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  Agency / Brand Display Name
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. GozyTrips Luxury Concierge"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Meta Lead Ads (Real Form Connection) */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-zinc-200">
                <Globe className="w-4 h-4 text-blue-500" />
                2. Meta Lead Ads (Facebook & Instagram)
              </div>
              <span className="text-[10px] text-slate-400">Pulls real traveler leads</span>
            </div>

            {/* Access Token Input & Auto-Discovery */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  Meta System / Graph API Access Token
                </Label>
                <a
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"
                >
                  Generate in Graph Explorer <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="EAABw... (paste token to discover your actual pages & forms)"
                  value={metaAccessToken}
                  onChange={(e) => setMetaAccessToken(e.target.value)}
                  className="h-8 text-xs font-mono flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDiscoverResources()}
                  disabled={loadingResources || (!metaAccessToken && !integration)}
                  className="h-8 text-xs shrink-0 font-semibold gap-1 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                >
                  {loadingResources ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Discover Forms
                </Button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                Requires <code className="text-emerald-500 font-mono">pages_show_list</code> and <code className="text-emerald-500 font-mono">leads_retrieval</code> permissions.
              </p>
            </div>

            {/* Discovery Status Message */}
            {discoverySuccess && (
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                {discoverySuccess}
              </div>
            )}
            {discoveryError && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                {discoveryError}
              </div>
            )}

            {/* Discovered Pages Dropdown */}
            {discoveredPages.length > 0 ? (
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  Select Facebook / Instagram Page
                </Label>
                <select
                  value={metaPageId}
                  onChange={(e) => handlePageChange(e.target.value)}
                  className="w-full h-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {discoveredPages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.name} (ID: {page.id})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  Facebook Page Name / ID (Manual)
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. GozyTrips Luxury Holidays"
                  value={metaPageName}
                  onChange={(e) => setMetaPageName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            )}

            {/* Discovered Forms Dropdown */}
            {discoveredForms.length > 0 ? (
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  Select Actual Lead Generation Form
                </Label>
                <select
                  value={metaFormId}
                  onChange={(e) => {
                    setMetaFormId(e.target.value);
                    const matched = discoveredForms.find((f) => f.id === e.target.value);
                    if (matched) setMetaFormName(matched.name);
                  }}
                  className="w-full h-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  {discoveredForms.map((form) => (
                    <option key={form.id} value={form.id}>
                      {form.name} — {form.leadsCount} leads submitted ({form.status})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  Meta Lead Gen Form ID (Manual)
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. 1092837465910293"
                  value={metaFormId}
                  onChange={(e) => setMetaFormId(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            )}
          </div>

          {/* Section 3: Live Auto-Sync Configuration */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Auto-Sync Inbound Leads</p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">Regularly query Meta Graph API and ingest new traveler submissions automatically</p>
            </div>
            <Switch
              checked={autoSync}
              onCheckedChange={setAutoSync}
            />
          </div>

          {/* Optional Webhook URL Display */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Automatic Webhook Receiver (Optional for Real-time Push)
              </span>
              <span className="text-[9px] text-emerald-500 font-semibold">Auto-challenge ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <code className="flex-1 p-1.5 rounded-lg bg-black text-emerald-400 text-[10px] font-mono select-all overflow-x-auto">
                {webhookUrl}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  setCopiedWebhook(true);
                  setTimeout(() => setCopiedWebhook(false), 2000);
                }}
                className="h-7 text-xs px-2 shrink-0"
              >
                {copiedWebhook ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
            {integration && onDisconnect ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={async () => {
                  if (confirm("Are you sure you want to disconnect this WhatsApp & Meta account?")) {
                    await onDisconnect();
                    onClose();
                  }
                }}
                className="text-xs h-8"
              >
                Disconnect Account
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={connecting || !phoneNumber.trim()}
                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold text-xs h-8 gap-1.5 shadow-md"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    {integration ? "Save & Sync Actual Leads" : "Connect & Fetch Actual Leads"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
