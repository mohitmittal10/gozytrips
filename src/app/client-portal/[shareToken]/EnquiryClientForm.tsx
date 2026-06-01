"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PublicEnquiryFormMeta, SubmitEnquiryResponsePayload, TripType, TravelTimePreference } from "@/types/enquiry";
import {
  MapPin, Calendar, Users, Compass, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, Check, Plane, Train, Bus, Car, Ship,
  Star, Heart, Mountain, Utensils, Camera, Palmtree, Backpack,
  DollarSign, MessageSquare, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TRIP_TYPES: { value: TripType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "adventurous", label: "Adventure",  icon: <Mountain className="w-4 h-4" />,  desc: "Hikes, treks & thrills" },
  { value: "scenic",      label: "Scenic",     icon: <Camera className="w-4 h-4" />,    desc: "Landscapes & views" },
  { value: "relaxed",     label: "Relaxed",    icon: <Palmtree className="w-4 h-4" />,  desc: "Slow travel, rejuvenate" },
  { value: "cultural",    label: "Cultural",   icon: <Compass className="w-4 h-4" />,   desc: "History & heritage" },
  { value: "romantic",    label: "Romantic",   icon: <Heart className="w-4 h-4" />,     desc: "Couples getaway" },
  { value: "family",      label: "Family",     icon: <Users className="w-4 h-4" />,     desc: "Fun for everyone" },
  { value: "foodie",      label: "Foodie",     icon: <Utensils className="w-4 h-4" />,  desc: "Cuisine & culture" },
];

const TRAVEL_METHODS: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: "Flight", label: "Flight", icon: <Plane className="w-4 h-4" /> },
  { value: "Train",  label: "Train",  icon: <Train className="w-4 h-4" /> },
  { value: "Bus",    label: "Bus",    icon: <Bus className="w-4 h-4" /> },
  { value: "Cab",    label: "Cab",    icon: <Car className="w-4 h-4" /> },
  { value: "Ferry",  label: "Ferry",  icon: <Ship className="w-4 h-4" /> },
];

const STEPS = [
  { id: 1, label: "Destinations" },
  { id: 2, label: "Dates & Pax" },
  { id: 3, label: "Style" },
  { id: 4, label: "Budget" },
];

const LabelClass = "block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2";
const InputClass =
  "w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/60 text-sm transition-colors";

function PaxCounter({
  label, sub, value, onChange,
}: { label: string; sub: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-600">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded-full border border-white/10 bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-colors text-lg font-light disabled:opacity-30"
          disabled={value <= 0}
        >
          −
        </button>
        <span className="text-white font-semibold w-4 text-center tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(99, value + 1))}
          className="w-8 h-8 rounded-full border border-white/10 bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-colors text-lg font-light"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  formMeta: PublicEnquiryFormMeta;
  shareToken: string;
  onSubmitted: (responseId?: string) => void;
}

export function EnquiryClientForm({ formMeta, shareToken, onSubmitted }: Props) {
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state
  const [startingLocation, setStartingLocation] = useState("");
  const [destinations, setDestinations] = useState("");
  const [endingLocation, setEndingLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adultPax, setAdultPax] = useState(1);
  const [childPax, setChildPax] = useState(0);
  const [infantPax, setInfantPax] = useState(0);
  const [tripType, setTripType] = useState<TripType>("relaxed");
  const [travelMethods, setTravelMethods] = useState<string[]>([]);
  const [mustInclude, setMustInclude] = useState("");
  const [avoid, setAvoid] = useState("");
  const [leisureTime, setLeisureTime] = useState(false);
  const [travelTimePreference, setTravelTimePreference] = useState<TravelTimePreference>("no_preference");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [specialRequests, setSpecialRequests] = useState("");

  const toggleMethod = (m: string) =>
    setTravelMethods((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );

  // Step validation
  const stepValid = [
    startingLocation.trim().length >= 2 && destinations.trim().length >= 2,
    startDate && endDate && new Date(endDate) > new Date(startDate),
    true, // style step is always valid (trip type has default)
    true, // budget is optional
  ];

  const canProceed = stepValid[step];

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the form_id from the share token
      const metaRes = await fetch(`/api/enquiry-forms/public/${shareToken}`);
      const metaData = await metaRes.json();
      if (!metaRes.ok || !metaData.form?.id) throw new Error("Could not load form.");

      const payload: SubmitEnquiryResponsePayload & { client_email: string } = {
        client_email: user.email!,
        client_name: user.user_metadata?.full_name || undefined,
        starting_location: startingLocation.trim(),
        destinations: destinations.trim(),
        ending_location: endingLocation.trim() || undefined,
        start_date: startDate,
        end_date: endDate,
        adult_pax: adultPax,
        child_pax: childPax,
        infant_pax: infantPax,
        trip_type: tripType,
        travel_methods: travelMethods,
        must_include: mustInclude || undefined,
        avoid: avoid || undefined,
        leisure_time: leisureTime,
        travel_time_preference: travelTimePreference,
        budget: budget ? parseFloat(budget) : undefined,
        currency,
        special_requests: specialRequests || undefined,
      };

      const res = await fetch(`/api/enquiry-forms/${metaData.form.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Submission failed.");

      onSubmitted(result.response_id);
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step content ────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">
            <div>
              <label className={LabelClass}>Starting Location <span className="text-red-400">*</span></label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
                <input
                  autoFocus
                  type="text"
                  value={startingLocation}
                  onChange={(e) => setStartingLocation(e.target.value)}
                  placeholder="e.g. Mumbai, India"
                  className={cn(InputClass, "pl-10")}
                />
              </div>
            </div>
            <div>
              <label className={LabelClass}>Where do you want to go? <span className="text-red-400">*</span></label>
              <div className="relative">
                <Compass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
                <input
                  type="text"
                  value={destinations}
                  onChange={(e) => setDestinations(e.target.value)}
                  placeholder="e.g. Paris, Rome, Barcelona"
                  className={cn(InputClass, "pl-10")}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1.5 ml-1">Separate multiple destinations with commas</p>
            </div>
            <div>
              <label className={LabelClass}>Ending Location <span className="text-gray-600 font-normal normal-case tracking-normal">(optional)</span></label>
              <input
                type="text"
                value={endingLocation}
                onChange={(e) => setEndingLocation(e.target.value)}
                placeholder="Leave blank to return to starting point"
                className={InputClass}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LabelClass}><Calendar className="inline w-3 h-3 mr-1" />Start Date <span className="text-red-400">*</span></label>
                <input
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={cn(InputClass, "[color-scheme:dark]")}
                />
              </div>
              <div>
                <label className={LabelClass}><Calendar className="inline w-3 h-3 mr-1" />End Date <span className="text-red-400">*</span></label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || new Date().toISOString().split("T")[0]}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={cn(InputClass, "[color-scheme:dark]")}
                />
              </div>
            </div>

            <div>
              <label className={LabelClass}><Users className="inline w-3 h-3 mr-1" />Travellers</label>
              <div className="bg-black/30 border border-white/10 rounded-xl px-4 py-1">
                <PaxCounter label="Adults" sub="Age 12+" value={adultPax} onChange={setAdultPax} />
                <PaxCounter label="Children" sub="Age 2–11" value={childPax} onChange={setChildPax} />
                <PaxCounter label="Infants" sub="Under 2" value={infantPax} onChange={setInfantPax} />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">
            <div>
              <label className={LabelClass}>Trip Style</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TRIP_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTripType(t.value)}
                    className={cn(
                      "flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all duration-200",
                      tripType === t.value
                        ? "bg-purple-500/20 border-purple-500/50 text-white shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                        : "bg-white/[0.03] border-white/[0.07] text-gray-400 hover:bg-white/[0.07] hover:text-white"
                    )}
                  >
                    <span className={cn("p-1.5 rounded-lg", tripType === t.value ? "bg-purple-500/30 text-purple-300" : "bg-white/5 text-gray-500")}>
                      {t.icon}
                    </span>
                    <span className="text-sm font-semibold">{t.label}</span>
                    <span className="text-[10px] text-gray-600 leading-tight">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={LabelClass}>How do you prefer to travel?</label>
              <div className="flex flex-wrap gap-2">
                {TRAVEL_METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => toggleMethod(m.value)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200",
                      travelMethods.includes(m.value)
                        ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LabelClass}>Must Include</label>
                <textarea
                  value={mustInclude}
                  onChange={(e) => setMustInclude(e.target.value)}
                  placeholder="e.g. Eiffel Tower, Gondola ride…"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/60 text-sm transition-colors resize-none"
                />
              </div>
              <div>
                <label className={LabelClass}>Things to Avoid</label>
                <textarea
                  value={avoid}
                  onChange={(e) => setAvoid(e.target.value)}
                  placeholder="e.g. Long queues, spicy food…"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/60 text-sm transition-colors resize-none"
                />
              </div>
            </div>

            <div>
              <label className={LabelClass}><Clock className="inline w-3 h-3 mr-1" />Timing Preference</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { value: "no_preference", label: "No Preference" },
                  { value: "avoid_night_travel", label: "Avoid Night" },
                  { value: "prefer_morning_travel", label: "Morning" },
                  { value: "prefer_afternoon_travel", label: "Afternoon" },
                  { value: "prefer_night_travel", label: "Night OK" },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTravelTimePreference(t.value as TravelTimePreference)}
                    className={cn(
                      "py-2 px-3 rounded-xl border text-xs font-medium transition-all",
                      travelTimePreference === t.value
                        ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                        : "bg-white/5 border-white/10 text-gray-500 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.07] rounded-xl">
              <div>
                <p className="text-sm font-medium text-white">Include leisure time?</p>
                <p className="text-xs text-gray-600 mt-0.5">A free day to explore on your own</p>
              </div>
              <button
                type="button"
                onClick={() => setLeisureTime(!leisureTime)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                  leisureTime ? "bg-purple-600" : "bg-white/10"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200",
                    leisureTime ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">
            <div>
              <label className={LabelClass}><DollarSign className="inline w-3 h-3 mr-1" />Approximate Budget <span className="text-gray-600 font-normal normal-case tracking-normal">(optional)</span></label>
              <div className="flex gap-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-11 px-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/60 transition-colors shrink-0"
                >
                  {["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 150000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className={cn(InputClass, "flex-1")}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1.5 ml-1">Total budget for all travellers</p>
            </div>

            <div>
              <label className={LabelClass}><MessageSquare className="inline w-3 h-3 mr-1" />Special Requests <span className="text-gray-600 font-normal normal-case tracking-normal">(optional)</span></label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Any dietary requirements, accessibility needs, specific hotels, celebrations, or anything else you'd like us to know…"
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/60 text-sm transition-colors resize-none"
              />
            </div>

            {/* Summary card */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-3">Trip Summary</p>
              {[
                { label: "From", value: startingLocation },
                { label: "To", value: destinations },
                { label: "Dates", value: startDate && endDate ? `${startDate} → ${endDate}` : "—" },
                { label: "Travellers", value: `${adultPax} adult${adultPax !== 1 ? "s" : ""}${childPax > 0 ? `, ${childPax} child${childPax !== 1 ? "ren" : ""}` : ""}${infantPax > 0 ? `, ${infantPax} infant${infantPax !== 1 ? "s" : ""}` : ""}` },
                { label: "Style", value: TRIP_TYPES.find((t) => t.value === tripType)?.label || tripType },
              ].map((item) => (
                <div key={item.label} className="flex gap-2 text-sm">
                  <span className="text-gray-500 w-20 shrink-0">{item.label}</span>
                  <span className="text-gray-200 font-medium truncate">{item.value}</span>
                </div>
              ))}
            </div>

            {submitError && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{submitError}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A0A0B]/90 backdrop-blur-md border-b border-white/5 px-4 py-4">
        <div className="max-w-xl mx-auto">
          <p className="text-xs text-purple-400 font-semibold uppercase tracking-widest mb-0.5">
            {formMeta.agent_brand_name}
          </p>
          <h1 className="text-sm font-semibold text-white truncate">{formMeta.title}</h1>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-[#0A0A0B] border-b border-white/5 px-4 py-3">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all duration-300",
                    i < step
                      ? "bg-purple-500 text-white"
                      : i === step
                      ? "bg-white text-black"
                      : "bg-white/10 text-gray-600"
                  )}
                >
                  {i < step ? <Check className="w-3 h-3" strokeWidth={3} /> : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="h-[1px] w-8 sm:w-16 mx-1 overflow-hidden bg-white/10">
                    <div
                      className="h-full bg-purple-500 transition-all duration-500"
                      style={{ width: i < step ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">Step {step + 1} of {STEPS.length} — {STEPS[step].label}</p>
        </div>
      </div>

      {/* Form content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 py-8">
          {renderStep()}
        </div>
      </div>

      {/* Nav footer */}
      <div className="sticky bottom-0 bg-[#0A0A0B]/95 backdrop-blur-md border-t border-white/5 px-4 py-4">
        <div className="max-w-xl mx-auto flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="h-12 px-5 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
              ) : (
                <><Check className="w-4 h-4" /> Send to Agent</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
