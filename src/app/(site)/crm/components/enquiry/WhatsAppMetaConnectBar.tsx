"use client";

import React, { useState } from "react";
import {
  MessageSquare, Globe, Zap, RefreshCw, CheckCircle2,
  Settings, Radio, Layers, ExternalLink, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ConnectMetaModal } from "./ConnectMetaModal";
import type { WhatsAppMetaIntegration } from "@/types/enquiry";

interface WhatsAppMetaConnectBarProps {
  integration: WhatsAppMetaIntegration | null;
  loading: boolean;
  syncing: boolean;
  connecting: boolean;
  onConnect: (params: any) => Promise<boolean>;
  onDisconnect: () => Promise<boolean>;
  onUpdateSettings: (updates: Partial<WhatsAppMetaIntegration>) => Promise<boolean>;
  onSync: () => Promise<any>;
}

export function WhatsAppMetaConnectBar({
  integration,
  loading,
  syncing,
  connecting,
  onConnect,
  onDisconnect,
  onUpdateSettings,
  onSync,
}: WhatsAppMetaConnectBarProps) {
  const [modalOpen, setModalOpen] = useState(false);

  // Formatting last synced text
  const formatLastSynced = (isoDate?: string | null) => {
    if (!isoDate) return "Never synced";
    try {
      const diffMs = Date.now() - new Date(isoDate).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ago`;
    } catch {
      return "Recently";
    }
  };

  const isConnected = Boolean(integration && integration.status === "connected");

  return (
    <>
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl p-4 shadow-sm transition-all">
        {!isConnected ? (
          /* ── NOT CONNECTED: Dynamic Connection Call-to-Action ────────────────── */
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shadow-sm">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-500 border border-blue-500/30 flex items-center justify-center font-bold text-xs shadow-sm">
                    <Globe className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Connect WhatsApp & Meta for Actual Leads
                  </h3>
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold py-0.5">
                    Zero POST Requests
                  </Badge>
                  <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] font-semibold py-0.5">
                    Live Meta Graph API
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xl leading-relaxed">
                  Link your Meta Lead Ads form and WhatsApp Business. The system automatically fetches actual submitted traveler leads and incoming chats without any manual curl or POST requests.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => setModalOpen(true)}
                className="h-8 text-xs font-bold bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white shadow-md gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                Connect Account & Fetch Leads
              </Button>
            </div>
          </div>
        ) : (
          /* ── CONNECTED: Live Active Dashboard Bar ────────────────────────────── */
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Status & Identity */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950 animate-ping" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950" />
              </div>

              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {integration.accountName}
                  </span>
                  <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] font-bold py-0.5">
                    ● Connected & Live
                  </Badge>
                  {integration.phoneNumber && (
                    <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                      {integration.phoneNumber}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
                  {integration.metaPageName && (
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-zinc-300">
                      <Globe className="w-3 h-3 text-blue-500" />
                      Page: {integration.metaPageName}
                    </span>
                  )}
                  {integration.metaFormId && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-slate-600 dark:text-zinc-400">
                        Form ID: {integration.metaFormId}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>Last synced: <strong className="text-slate-700 dark:text-zinc-300">{formatLastSynced(integration.lastSyncedAt)}</strong></span>
                  <span>•</span>
                  <span>Leads: <strong className="text-emerald-500">{integration.leadsIngestedCount || 0}</strong></span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Auto sync switch */}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-xs">
                <span className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">Auto-Sync</span>
                <Switch
                  checked={integration.autoSync}
                  onCheckedChange={(checked) => onUpdateSettings({ autoSync: checked })}
                  className="scale-75"
                />
              </div>

              {/* Fetch Actual Leads button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSync()}
                disabled={syncing}
                className="h-8 text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Fetching Actual Leads..." : "Fetch Actual Leads from Meta"}
              </Button>

              {/* Settings / Edit connection */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalOpen(true)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                title="Manage Connection & Meta Form"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <ConnectMetaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        integration={integration}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        connecting={connecting}
      />
    </>
  );
}
