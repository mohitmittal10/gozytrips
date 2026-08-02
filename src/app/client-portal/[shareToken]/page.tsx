"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PublicEnquiryFormMeta } from "@/types/enquiry";
import { EnquiryClientForm } from "./EnquiryClientForm";
import { ClientDashboard } from "./ClientDashboard";
import { Loader2, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Auth Gate: Sign In / Sign Up
// ─────────────────────────────────────────────────────────────────────────────
function AuthGate({
  formMeta,
  onAuthenticated,
}: {
  formMeta: PublicEnquiryFormMeta;
  onAuthenticated: () => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
      onAuthenticated();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Agent branding header */}
      <div className="text-center mb-10">
        {formMeta.agent_avatar_url ? (
          <img
            src={formMeta.agent_avatar_url}
            alt="Agent"
            className="w-14 h-14 rounded-full mx-auto mb-3 border-2 border-white/10 object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full mx-auto mb-3 bg-gradient-to-br from-[#FF5C33] to-[#EC4899] flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
        )}
        <p className="text-xs uppercase tracking-widest text-[#FF5C33] font-semibold mb-1">
          {formMeta.agent_brand_name}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">{formMeta.title}</h1>
        {formMeta.description && (
          <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">{formMeta.description}</p>
        )}
      </div>

      {/* Auth card */}
      <div className="w-full max-w-md bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-1">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {mode === "signup"
            ? "Sign up to fill in your travel preferences securely."
            : "Sign in to access your trip dashboard."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#FF5C33]/60 text-sm transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#FF5C33]/60 text-sm transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#FF5C33]/60 text-sm transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-[#FF5C33] to-[#EC4899] text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Please wait…</>
            ) : mode === "signup" ? (
              "Create Account & Continue →"
            ) : (
              "Sign In & Continue →"
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(null); }}
            className="text-xs text-gray-500 hover:text-[#FF5C33] transition-colors"
          >
            {mode === "signup"
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-700 mt-6 text-center max-w-xs">
        Your information is shared only with {formMeta.agent_brand_name} and used to plan your trip.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function ClientPortalPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = React.use(params);
  const [formMeta, setFormMeta] = useState<PublicEnquiryFormMeta | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
      setCheckingAuth(false);
    }).catch(() => {
      setIsAuthenticated(false);
      setCheckingAuth(false);
    });
  }, []);

  useEffect(() => {
    fetch(`/api/enquiry-forms/public/${shareToken}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setLoadError(data.error);
        else setFormMeta(data.form);
      })
      .catch(() => setLoadError("Unable to load the form. Please try again."));
  }, [shareToken]);

  if (checkingAuth || !formMeta) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {loadError ? (
          <div className="text-center px-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-white font-semibold text-lg mb-2">Form Unavailable</h2>
            <p className="text-gray-400 text-sm max-w-sm">{loadError}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#FF5C33] animate-spin" />
            <p className="text-gray-500 text-sm">Loading your portal…</p>
          </div>
        )}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthGate
        formMeta={formMeta}
        onAuthenticated={() => setIsAuthenticated(true)}
      />
    );
  }

  return <AuthenticatedPortal formMeta={formMeta} shareToken={shareToken} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// AuthenticatedPortal — checks for existing response, routes to dashboard or form
// ─────────────────────────────────────────────────────────────────────────────
function AuthenticatedPortal({
  formMeta,
  shareToken,
}: {
  formMeta: PublicEnquiryFormMeta;
  shareToken: string;
}) {
  const supabase = createClient();
  const [checking, setChecking] = useState(true);
  const [existingResponseId, setExistingResponseId] = useState<string | null>(null);
  const [justSubmittedResponseId, setJustSubmittedResponseId] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);

  const checkExistingResponse = useCallback(async () => {
    setChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setChecking(false); return; }

      const { data } = await (supabase as any)
        .from("client_enquiry_responses")
        .select("id")
        .eq("form_id", formMeta.id)
        .eq("client_user_id", user.id)
        .neq("status", "archived")
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.id) setExistingResponseId(data.id);
    } catch {
      // fall back to showing the form
    } finally {
      setChecking(false);
    }
  }, [formMeta.id, supabase]);

  useEffect(() => {
    checkExistingResponse();
  }, [checkExistingResponse]);

  const handleSubmitted = useCallback(async (responseId?: string) => {
    setShowThankYou(true);
    setTimeout(async () => {
      if (responseId) {
        setJustSubmittedResponseId(responseId);
      } else {
        await checkExistingResponse();
      }
      setShowThankYou(false);
    }, 3000);
  }, [checkExistingResponse]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#FF5C33] animate-spin" />
          <p className="text-gray-500 text-sm">Setting up your dashboard…</p>
        </div>
      </div>
    );
  }

  if (showThankYou) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">You&apos;re all set! 🎉</h1>
        <p className="text-gray-400 text-base max-w-md mb-2">
          Your travel preferences have been shared with{" "}
          <span className="text-[#FF5C33] font-medium">{formMeta.agent_brand_name}</span>.
        </p>
        <p className="text-gray-500 text-sm max-w-sm mb-6">Opening your dashboard…</p>
        <Loader2 className="w-5 h-5 text-[#FF5C33] animate-spin" />
      </div>
    );
  }

  const dashboardResponseId = justSubmittedResponseId || existingResponseId;
  if (dashboardResponseId) {
    return (
      <ClientDashboard
        formMeta={formMeta}
        shareToken={shareToken}
        responseId={dashboardResponseId}
      />
    );
  }

  return (
    <EnquiryClientForm
      formMeta={formMeta}
      shareToken={shareToken}
      onSubmitted={handleSubmitted}
    />
  );
}
