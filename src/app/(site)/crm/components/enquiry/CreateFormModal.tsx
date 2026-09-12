"use client";

import React, { useState } from "react";
import { X, Link, Loader, AlertCircle, Check, Calendar, MapPin, Compass, Users, Plane, DollarSign, MessageSquare, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CreateEnquiryFormPayload } from "@/types/enquiry";

interface CreateFormModalProps {
  onClose: () => void;
  onCreated: (form: any) => void;
  createForm: (payload: CreateEnquiryFormPayload) => Promise<any>;
}

export function CreateFormModal({ onClose, onCreated, createForm }: CreateFormModalProps) {
  const [title, setTitle] = useState("Travel Enquiry Form");
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdForm, setCreatedForm] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const portalBase = typeof window !== "undefined" ? window.location.origin : "";

  const handleCreate = async () => {
    if (!title.trim() || title.trim().length < 2) {
      setError("Title must be at least 2 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const form = await createForm({
        title: title.trim(),
        description: description.trim() || undefined,
        expires_at: expiresAt || undefined,
      });
      setCreatedForm(form);
      onCreated(form);
    } catch (err: any) {
      setError(err.message || "Failed to create form.");
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = createdForm
    ? `${portalBase}/client-portal/${createdForm.share_token}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0c0c0e]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-base font-bold text-white">Create Enquiry Form</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Generate a shareable link for your client</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {!createdForm ? (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                  Form Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. European Honeymoon Enquiry"
                  className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                  Description <span className="text-zinc-400 font-normal normal-case tracking-normal">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief message shown to the client on the form page"
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                  <Calendar className="inline w-3.5 h-3.5 mr-1 text-primary" />
                  Expiry Date <span className="text-zinc-400 font-normal normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm [color-scheme:dark] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Form Fields Included
                </label>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 p-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-zinc-300">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary shrink-0" /> <span>Start/End Locations</span></div>
                  <div className="flex items-center gap-1.5"><Compass className="w-3.5 h-3.5 text-primary shrink-0" /> <span>Destinations</span></div>
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary shrink-0" /> <span>Travel Dates</span></div>
                  <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-primary shrink-0" /> <span>Passenger Counts</span></div>
                  <div className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-primary shrink-0" /> <span>Trip Style Preference</span></div>
                  <div className="flex items-center gap-1.5"><Plane className="w-3.5 h-3.5 text-primary shrink-0" /> <span>Travel Methods</span></div>
                  <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-primary shrink-0" /> <span>Approx. Budget</span></div>
                  <div className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-primary shrink-0" /> <span>Special Requests</span></div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <p className="text-xs text-rose-300">{error}</p>
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full h-11 rounded-xl aurora-gradient text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary/25 cursor-pointer hover:brightness-110 active:scale-98"
              >
                {loading ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Creating…</>
                ) : (
                  <><Link className="w-4 h-4" /> Create & Get Link</>
                )}
              </button>
            </>
          ) : (
            /* Success state — show the shareable link */
            <div className="space-y-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 mx-auto">
                <Check className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-center text-white font-bold text-base">Form created!</p>
              <p className="text-center text-zinc-400 text-xs">Share this link with your client:</p>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2">
                <p className="flex-1 text-xs text-primary font-mono truncate">{shareUrl}</p>
                <button
                  onClick={handleCopy}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    copied
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-primary/20 text-white border border-primary/30 hover:bg-primary/30"
                  )}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white transition-colors text-sm font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
