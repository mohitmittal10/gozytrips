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
      <div className="relative w-full max-w-md bg-[#14141E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.07]">
          <div>
            <h2 className="text-base font-semibold text-white">Create Enquiry Form</h2>
            <p className="text-xs text-gray-500 mt-0.5">Generate a shareable link for your client</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {!createdForm ? (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Form Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. European Honeymoon Enquiry"
                  className="w-full h-10 px-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-zinc-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Description <span className="text-gray-500 font-normal normal-case tracking-normal">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief message shown to the client on the form page"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-zinc-600 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  <Calendar className="inline w-3 h-3 mr-1" />
                  Expiry Date <span className="text-gray-500 font-normal normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-purple-500/50 text-sm [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Form Fields Included
                </label>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 p-3.5 bg-black/35 border border-white/[0.06] rounded-xl text-xs text-gray-400">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" /> <span>Start/End Locations</span></div>
                  <div className="flex items-center gap-1.5"><Compass className="w-3.5 h-3.5 text-purple-400 shrink-0" /> <span>Destinations</span></div>
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" /> <span>Travel Dates</span></div>
                  <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-purple-400 shrink-0" /> <span>Passenger Counts</span></div>
                  <div className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-purple-400 shrink-0" /> <span>Trip Style Preference</span></div>
                  <div className="flex items-center gap-1.5"><Plane className="w-3.5 h-3.5 text-purple-400 shrink-0" /> <span>Travel Methods</span></div>
                  <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-purple-400 shrink-0" /> <span>Approx. Budget</span></div>
                  <div className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-purple-400 shrink-0" /> <span>Special Requests</span></div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2 shadow-sm"
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
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-500/20 border border-green-500/30 mx-auto">
                <Check className="w-7 h-7 text-green-400" />
              </div>
              <p className="text-center text-white font-semibold">Form created!</p>
              <p className="text-center text-gray-500 text-xs">Share this link with your client:</p>

              <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center gap-2">
                <p className="flex-1 text-xs text-purple-300 font-mono truncate">{shareUrl}</p>
                <button
                  onClick={handleCopy}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    copied
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
                  )}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full h-10 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 transition-colors text-sm font-medium"
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
