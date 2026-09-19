// Right-side summary panel for status, trip requirements editing & dynamic AI regeneration
import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { MorphingSquare } from "@/components/ui/morphing-square";
import { useReferenceOptions } from '@/hooks/use-reference-options';
import { 
  Sliders, MapPin, Calendar, Compass, Sparkles, ChevronDown, Plus, 
  Edit3, Save, X, RotateCcw, Check, MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { TripMetadata } from '@/types/the-lab';

interface TheLabSummaryPanelProps {
  itinerary: any;
  selectedStatus: string;
  clients: any[];
  selectedClientId: string;
  isGenerating: boolean;
  finalTotal?: number;
  currencySymbol?: string;
  tripMetadata?: TripMetadata | any;
  onOpenAddClient?: () => void;
  onRegenerateItinerary?: (updatedMetadata: TripMetadata, feedbackPrompt?: string) => Promise<void>;
  onUpdateTripMetadata?: (updatedMetadata: TripMetadata) => Promise<void> | void;
}

const TRIP_STYLES = [
  { id: "relaxed", label: "Relaxed" },
  { id: "adventurous", label: "Adventure" },
  { id: "scenic", label: "Scenic" },
  { id: "cultural", label: "Cultural" },
  { id: "romantic", label: "Romantic" },
  { id: "family", label: "Family" },
  { id: "foodie", label: "Foodie" },
];

const TIMING_PREFS = [
  { id: "no_preference", label: "No Preference" },
  { id: "prefer_morning_travel", label: "Morning" },
  { id: "prefer_afternoon_travel", label: "Afternoon" },
  { id: "prefer_night_travel", label: "Night" },
  { id: "avoid_night_travel", label: "Avoid Night" },
];

const ALL_TRAVEL_METHODS = ["Flight", "Train", "Cab", "Bus", "Ferry"];

const TheLabSummaryPanel = React.memo(function TheLabSummaryPanel({
  itinerary, selectedStatus, clients, selectedClientId,
  isGenerating,
  finalTotal, currencySymbol, tripMetadata,
  onOpenAddClient,
  onRegenerateItinerary,
  onUpdateTripMetadata,
}: TheLabSummaryPanelProps) {
  const { options: itineraryStatuses } = useReferenceOptions('itinerary_status');
  const { toast } = useToast();
  
  const [isInputsOpen, setIsInputsOpen] = useState(true);
  const [isEditingRequirements, setIsEditingRequirements] = useState(false);
  const [quickPrompt, setQuickPrompt] = useState("");

  // Local state for requirement form edits
  const [editForm, setEditForm] = useState({
    startingLocation: "",
    destinations: "",
    endingLocation: "",
    startDate: "",
    endDate: "",
    tripType: "relaxed",
    travelTimePreference: "no_preference",
    leisureTime: false,
    leisureDay: "",
    travelMethods: [] as string[],
    daywiseDestinations: "",
    mustInclude: "",
    avoid: "",
    feedbackPrompt: "",
  });

  // Sync editForm with incoming tripMetadata when NOT actively editing
  useEffect(() => {
    if (isEditingRequirements || !tripMetadata) return;

    let startDateStr = "";
    if (tripMetadata.startDate) {
      try {
        const d = tripMetadata.startDate instanceof Date ? tripMetadata.startDate : new Date(tripMetadata.startDate);
        if (!isNaN(d.getTime())) startDateStr = format(d, "yyyy-MM-dd");
      } catch (e) {}
    }

    let endDateStr = "";
    if (tripMetadata.endDate) {
      try {
        const d = tripMetadata.endDate instanceof Date ? tripMetadata.endDate : new Date(tripMetadata.endDate);
        if (!isNaN(d.getTime())) endDateStr = format(d, "yyyy-MM-dd");
      } catch (e) {}
    }

    setEditForm({
      startingLocation: tripMetadata.startingLocation || "",
      destinations: tripMetadata.destinations || "",
      endingLocation: tripMetadata.endingLocation || "",
      startDate: startDateStr,
      endDate: endDateStr,
      tripType: tripMetadata.tripType || "relaxed",
      travelTimePreference: tripMetadata.travelTimePreference || "no_preference",
      leisureTime: !!tripMetadata.leisureTime,
      leisureDay: tripMetadata.leisureDay !== undefined && tripMetadata.leisureDay !== null ? String(tripMetadata.leisureDay) : "",
      travelMethods: Array.isArray(tripMetadata.travelMethods) ? tripMetadata.travelMethods : [],
      daywiseDestinations: tripMetadata.daywiseDestinations || "",
      mustInclude: tripMetadata.mustInclude || "",
      avoid: tripMetadata.avoid || "",
      feedbackPrompt: "",
    });
  }, [tripMetadata, isEditingRequirements]);

  if (!itinerary || !itinerary.itinerary || itinerary.itinerary.length === 0) return null;

  const statusOption = itineraryStatuses.find(opt => opt.value === selectedStatus);

  const toggleTravelMethod = (method: string) => {
    setEditForm(prev => {
      const exists = prev.travelMethods.includes(method);
      return {
        ...prev,
        travelMethods: exists
          ? prev.travelMethods.filter(m => m !== method)
          : [...prev.travelMethods, method]
      };
    });
  };

  const MAX_WORDS = 25;
  const getWordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  const quickPromptWordCount = getWordCount(quickPrompt);
  const isQuickPromptOverLimit = quickPromptWordCount > MAX_WORDS;

  const feedbackPromptWordCount = getWordCount(editForm.feedbackPrompt);
  const isFeedbackPromptOverLimit = feedbackPromptWordCount > MAX_WORDS;

  const handleQuickRegenerate = async () => {
    if (!onRegenerateItinerary) return;
    if (!quickPrompt.trim()) {
      toast({
        variant: "destructive",
        title: "Prompt Required",
        description: "Please enter instructions for AI to regenerate the itinerary.",
      });
      return;
    }
    if (isQuickPromptOverLimit) {
      toast({
        variant: "destructive",
        title: "Prompt Too Long",
        description: `Please keep instructions under ${MAX_WORDS} words (currently ${quickPromptWordCount} words).`,
      });
      return;
    }
    await onRegenerateItinerary(tripMetadata || {}, quickPrompt.trim());
    setQuickPrompt("");
  };

  const handleSaveEditForm = async (shouldRegenerate: boolean) => {
    if (!editForm.startingLocation.trim()) {
      toast({ variant: "destructive", title: "Missing Starting Location", description: "Starting location is required." });
      return;
    }
    if (!editForm.destinations.trim()) {
      toast({ variant: "destructive", title: "Missing Destinations", description: "At least one destination is required." });
      return;
    }
    if (!editForm.startDate || !editForm.endDate) {
      toast({ variant: "destructive", title: "Missing Dates", description: "Please specify both start date and end date." });
      return;
    }

    const sDate = new Date(`${editForm.startDate}T00:00:00`);
    const eDate = new Date(`${editForm.endDate}T00:00:00`);

    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      toast({ variant: "destructive", title: "Invalid Dates", description: "Please enter valid start and end dates." });
      return;
    }

    if (eDate <= sDate) {
      toast({ variant: "destructive", title: "Invalid Dates", description: "End date must be strictly after start date." });
      return;
    }

    if (shouldRegenerate && isFeedbackPromptOverLimit) {
      toast({
        variant: "destructive",
        title: "Prompt Too Long",
        description: `Regeneration instructions cannot exceed ${MAX_WORDS} words (currently ${feedbackPromptWordCount} words).`,
      });
      return;
    }

    const updatedMetadata: TripMetadata = {
      ...tripMetadata,
      startingLocation: editForm.startingLocation.trim(),
      destinations: editForm.destinations.trim(),
      endingLocation: editForm.endingLocation.trim() || editForm.startingLocation.trim(),
      startDate: sDate,
      endDate: eDate,
      tripType: editForm.tripType as any,
      travelTimePreference: editForm.travelTimePreference as any,
      leisureTime: editForm.leisureTime,
      leisureDay: editForm.leisureTime && editForm.leisureDay ? Number(editForm.leisureDay) : undefined,
      travelMethods: editForm.travelMethods,
      daywiseDestinations: editForm.daywiseDestinations.trim(),
      mustInclude: editForm.mustInclude.trim(),
      avoid: editForm.avoid.trim(),
    };

    if (shouldRegenerate && onRegenerateItinerary) {
      await onRegenerateItinerary(updatedMetadata, editForm.feedbackPrompt.trim() || undefined);
      setIsEditingRequirements(false);
    } else if (onUpdateTripMetadata) {
      await onUpdateTripMetadata(updatedMetadata);
      setIsEditingRequirements(false);
    }
  };

  // Helper for duration calculation preview
  const getDurationText = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return null;
    const s = new Date(`${startStr}T00:00:00`);
    const e = new Date(`${endStr}T00:00:00`);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return null;
    const nights = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return `${nights + 1} Days / ${nights} Nights`;
  };

  return (
    <div className="w-full lg:col-span-4 space-y-3 sm:space-y-4 lg:sticky lg:top-24 order-1 lg:order-2 self-start">
      
      {/* Journey Summary */}
      <div className="glass-panel relative rounded-xl sm:rounded-2xl p-3 mb-3 sm:mb-4 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-obsidian-dark/80 backdrop-blur-lg border border-white/5 overflow-hidden">
        {/* Status Badge - Top Right */}
        <div className="absolute top-0 right-0">
          <div className={cn(
            "px-3 py-1 rounded-bl-xl border-l border-b border-white/5 flex items-center gap-2",
            statusOption?.metadata?.color === 'purple' && "bg-purple-500/10",
            statusOption?.metadata?.color === 'pink' && "bg-zinc-500/10",
            statusOption?.metadata?.color === 'blue' && "bg-blue-500/10",
            statusOption?.metadata?.color === 'green' && "bg-emerald-500/10",
            statusOption?.metadata?.color === 'amber' && "bg-amber-500/10",
            statusOption?.metadata?.color === 'red' && "bg-rose-500/10",
            !statusOption && "bg-white/5"
          )}>
            <div className={cn(
              "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]",
              statusOption?.metadata?.color === 'purple' && "bg-purple-400 shadow-purple-400/20",
              statusOption?.metadata?.color === 'pink' && "bg-zinc-400 shadow-zinc-400/20",
              statusOption?.metadata?.color === 'blue' && "bg-blue-400 shadow-blue-400/20",
              statusOption?.metadata?.color === 'green' && "bg-emerald-400 shadow-emerald-500/20",
              statusOption?.metadata?.color === 'amber' && "bg-amber-400 shadow-amber-500/20",
              statusOption?.metadata?.color === 'red' && "bg-rose-400 shadow-rose-500/20",
              !statusOption && (
                selectedStatus === 'draft' ? "bg-zinc-400 shadow-zinc-400/20" :
                selectedStatus === 'sent' ? "bg-primary shadow-primary/20" :
                selectedStatus === 'confirmed' || selectedStatus === 'booked' ? "bg-emerald-400 shadow-emerald-500/20" :
                selectedStatus === 'rejected' ? "bg-rose-400 shadow-rose-500/20" :
                "bg-zinc-500"
              )
            )} />
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest leading-none",
              statusOption?.metadata?.color === 'purple' && "text-purple-400",
              statusOption?.metadata?.color === 'pink' && "text-zinc-400",
              statusOption?.metadata?.color === 'blue' && "text-blue-400",
              statusOption?.metadata?.color === 'green' && "text-emerald-400",
              statusOption?.metadata?.color === 'amber' && "text-amber-400",
              statusOption?.metadata?.color === 'red' && "text-rose-400",
              !statusOption && (
                selectedStatus === 'draft' ? "text-zinc-400" :
                selectedStatus === 'sent' ? "text-primary" :
                selectedStatus === 'confirmed' || selectedStatus === 'booked' ? "text-emerald-400" :
                selectedStatus === 'rejected' ? "text-rose-400" :
                "text-zinc-500"
              )
            )}>
              {statusOption?.label || selectedStatus}
            </span>
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2 block">Journey Summary</h3>
          <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-8">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-primary uppercase tracking-widest mb-0.5">Focus</span>
              <span className="text-white text-xs font-bold leading-none">{itinerary.itinerary[0]?.areaFocus?.split(',')[0]}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-primary/80 uppercase tracking-widest mb-0.5">Duration</span>
              <span className="text-white text-xs font-bold leading-none">
                {itinerary.itinerary.length} Days / {Math.max(0, itinerary.itinerary.length - 1)} Nights
              </span>
            </div>
            {finalTotal !== undefined && finalTotal > 0 && (
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-primary/80 uppercase tracking-widest mb-0.5">Total Cost</span>
                <span className="text-white text-xs font-bold leading-none">
                  {currencySymbol}{Math.round(finalTotal).toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trip Requirements Section */}
      <div className={cn(
        "liquid-glass p-3.5 rounded-2xl space-y-3 transition-all duration-300 border",
        isEditingRequirements 
          ? "border-primary/40 bg-obsidian-dark/95 shadow-[0_0_25px_rgba(255,92,51,0.12)]" 
          : "border-white/5 bg-obsidian-dark/80"
      )}>
        {/* Accordion / Header Bar */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIsInputsOpen(!isInputsOpen)}
            className="flex items-center gap-2 text-white hover:text-primary transition-colors focus:outline-none min-w-0"
          >
            <Sliders className="w-4 h-4 text-primary shrink-0" />
            <h4 className="font-extrabold text-sm tracking-tight truncate">
              Trip Requirements
            </h4>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            {isEditingRequirements ? (
              <span className="px-2 py-0.5 text-[9px] rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold uppercase tracking-wider">
                Editing
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsEditingRequirements(true);
                  setIsInputsOpen(true);
                }}
                className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white/5 border border-white/10 hover:bg-primary/20 hover:text-white hover:border-primary/40 text-primary transition-all flex items-center gap-1 cursor-pointer"
                title="Edit Trip Requirements"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsInputsOpen(!isInputsOpen)}
              className="p-1 text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronDown 
                className="w-4 h-4 transition-transform duration-300"
                style={{ transform: isInputsOpen ? 'rotate(180deg)' : 'none' }}
              />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isInputsOpen && (
          <div className="pt-2 border-t border-white/5 space-y-3.5 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
            
            {/* EDIT MODE FORM */}
            {isEditingRequirements ? (
              <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2 border-b border-white/5 pb-2">
                
                {/* Route Locations */}
                <div className="space-y-2 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                  <span className="text-[9px] text-primary font-black uppercase tracking-widest flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Route & Locations
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-zinc-400 font-bold block mb-1">Starting From *</label>
                      <input
                        type="text"
                        value={editForm.startingLocation}
                        onChange={(e) => setEditForm(prev => ({ ...prev, startingLocation: e.target.value }))}
                        placeholder="e.g. Mumbai"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-400 font-bold block mb-1">Destinations *</label>
                      <input
                        type="text"
                        value={editForm.destinations}
                        onChange={(e) => setEditForm(prev => ({ ...prev, destinations: e.target.value }))}
                        placeholder="e.g. Bali, Ubud, Seminyak"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-zinc-400 font-bold block mb-1">Ending Location (Optional)</label>
                    <input
                      type="text"
                      value={editForm.endingLocation}
                      onChange={(e) => setEditForm(prev => ({ ...prev, endingLocation: e.target.value }))}
                      placeholder="e.g. Denpasar (defaults to starting location)"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Dates & Duration */}
                <div className="space-y-2 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-primary font-black uppercase tracking-widest flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Dates & Duration
                    </span>
                    {getDurationText(editForm.startDate, editForm.endDate) && (
                      <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        {getDurationText(editForm.startDate, editForm.endDate)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-zinc-400 font-bold block mb-1">Start Date *</label>
                      <input
                        type="date"
                        value={editForm.startDate}
                        onChange={(e) => setEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-400 font-bold block mb-1">End Date *</label>
                      <input
                        type="date"
                        value={editForm.endDate}
                        onChange={(e) => setEditForm(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Trip Style & Preferences */}
                <div className="space-y-2.5 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                  <span className="text-[9px] text-primary font-black uppercase tracking-widest flex items-center gap-1">
                    <Compass className="w-3 h-3" /> Trip Preferences
                  </span>

                  {/* Trip Style */}
                  <div>
                    <label className="text-[9px] text-zinc-400 font-bold block mb-1.5">Travel Style</label>
                    <div className="flex flex-wrap gap-1.5">
                      {TRIP_STYLES.map(style => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, tripType: style.id }))}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer",
                            editForm.tripType === style.id
                              ? "bg-primary text-white shadow-md shadow-primary/20"
                              : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                          )}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timing Preference */}
                  <div>
                    <label className="text-[9px] text-zinc-400 font-bold block mb-1.5">Travel Timing</label>
                    <div className="flex flex-wrap gap-1.5">
                      {TIMING_PREFS.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, travelTimePreference: t.id }))}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer",
                            editForm.travelTimePreference === t.id
                              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                              : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                          )}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Leisure Day */}
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                      <input
                        type="checkbox"
                        checked={editForm.leisureTime}
                        onChange={(e) => setEditForm(prev => ({ ...prev, leisureTime: e.target.checked }))}
                        className="rounded border-white/10 bg-white/5 text-primary focus:ring-0"
                      />
                      <span>Include Leisure Day</span>
                    </label>

                    {editForm.leisureTime && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-400 font-bold">On Day:</span>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={editForm.leisureDay}
                          onChange={(e) => setEditForm(prev => ({ ...prev, leisureDay: e.target.value }))}
                          placeholder="e.g. 3"
                          className="w-14 bg-white/5 border border-white/10 rounded-md px-2 py-0.5 text-xs text-white text-center focus:outline-none focus:border-primary"
                        />
                      </div>
                    )}
                  </div>

                  {/* Travel Methods */}
                  <div>
                    <label className="text-[9px] text-zinc-400 font-bold block mb-1.5">Travel Methods</label>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_TRAVEL_METHODS.map(method => {
                        const isSelected = editForm.travelMethods.includes(method);
                        return (
                          <button
                            key={method}
                            type="button"
                            onClick={() => toggleTravelMethod(method)}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1",
                              isSelected
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                                : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                            )}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                            <span>{method}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Custom Daywise Plan */}
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-400 font-bold block">Custom Daywise Plan (Optional)</label>
                  <textarea
                    rows={2}
                    value={editForm.daywiseDestinations}
                    onChange={(e) => setEditForm(prev => ({ ...prev, daywiseDestinations: e.target.value }))}
                    placeholder="e.g. Day 1: Kuta beach sunset, Day 2-3: Ubud waterfalls, Day 4: Nusa Penida tour"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                {/* Constraints */}
                <div className="space-y-2">
                  <div>
                    <label className="text-[9px] text-emerald-400 font-bold block mb-1 uppercase tracking-wider">Must Include Notes</label>
                    <textarea
                      rows={2}
                      value={editForm.mustInclude}
                      onChange={(e) => setEditForm(prev => ({ ...prev, mustInclude: e.target.value }))}
                      placeholder="e.g. Beachfront villa stay, Candlelight dinner, Scuba diving"
                      className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-rose-400 font-bold block mb-1 uppercase tracking-wider">Must Exclude / Avoid</label>
                    <textarea
                      rows={2}
                      value={editForm.avoid}
                      onChange={(e) => setEditForm(prev => ({ ...prev, avoid: e.target.value }))}
                      placeholder="e.g. Long boat rides, Pork/non-halal food, Strenuous trekking"
                      className="w-full bg-rose-500/5 border border-rose-500/20 rounded-lg p-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/50 resize-none"
                    />
                  </div>
                </div>

                {/* AI Regeneration Custom Prompt Instructions */}
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] text-purple-300 font-black uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" /> AI Regeneration Instructions
                    </label>
                    <span className={cn(
                      "text-[10px] font-semibold",
                      isFeedbackPromptOverLimit ? "text-red-400" : "text-zinc-400"
                    )}>
                      {feedbackPromptWordCount} / {MAX_WORDS} words
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={editForm.feedbackPrompt}
                    onChange={(e) => setEditForm(prev => ({ ...prev, feedbackPrompt: e.target.value }))}
                    placeholder="Specific requests for AI generation (e.g. 'Replace seafood spots with vegetarian cafes' or 'Focus Day 3 on water activities')..."
                    className={cn(
                      "w-full bg-black/40 border rounded-lg p-2 text-xs text-white placeholder:text-purple-300/40 focus:outline-none resize-none transition-colors",
                      isFeedbackPromptOverLimit ? "border-red-500/60 focus:border-red-500" : "border-purple-500/20 focus:border-purple-400"
                    )}
                  />
                  {isFeedbackPromptOverLimit && (
                    <p className="text-[10px] text-red-400 font-medium">
                      Prompt is too long (limit: {MAX_WORDS} words)
                    </p>
                  )}
                </div>

                {/* Form Action Controls */}
                <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingRequirements(false)}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>

                  <div className="w-full sm:w-auto flex items-center gap-2">
                    {onUpdateTripMetadata && (
                      <button
                        type="button"
                        onClick={() => handleSaveEditForm(false)}
                        className="w-full sm:w-auto px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5 text-zinc-300" /> Save Only
                      </button>
                    )}

                    {onRegenerateItinerary && (
                      <Button
                        type="button"
                        disabled={isGenerating || isFeedbackPromptOverLimit}
                        onClick={() => handleSaveEditForm(true)}
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-600 via-indigo-600 to-primary text-white font-bold px-4 py-1.5 h-auto rounded-lg border border-purple-400/40 shadow-md shadow-purple-900/40 hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGenerating ? (
                          <>
                            <MorphingSquare className="w-3.5 h-3.5 text-white" />
                            <span>Regenerating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                            <span>Save & Regenerate</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              /* VIEW MODE DISPLAY */
              <>
                {/* Route Locations */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-2 w-full">
                      <div>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">Starting Location</span>
                        <span className="text-zinc-200 font-semibold">{tripMetadata.startingLocation || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">Destinations</span>
                        <span className="text-zinc-200 font-semibold">{tripMetadata.destinations || "—"}</span>
                      </div>
                      {tripMetadata.endingLocation && (
                        <div>
                          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">Ending Location</span>
                          <span className="text-zinc-200 font-semibold">{tripMetadata.endingLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dates & Duration */}
                {(tripMetadata.startDate || tripMetadata.endDate) && (
                  <div className="flex gap-2 border-t border-white/[0.03] pt-2">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1 w-full">
                      <div>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">Dates</span>
                        <span className="text-zinc-200 font-semibold">
                          {tripMetadata.startDate ? format(new Date(tripMetadata.startDate), "eee, MMM dd, yyyy") : "—"}
                          <span className="text-zinc-500 px-1 font-bold">to</span>
                          {tripMetadata.endDate ? format(new Date(tripMetadata.endDate), "eee, MMM dd, yyyy") : "—"}
                        </span>
                      </div>
                      {(() => {
                        if (!tripMetadata.startDate || !tripMetadata.endDate) return null;
                        const s = new Date(tripMetadata.startDate);
                        const e = new Date(tripMetadata.endDate);
                        if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return null;
                        const nights = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
                        const days = nights + 1;
                        return (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">
                              {days} Days / {nights} Nights
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Trip Preferences */}
                <div className="flex gap-2 border-t border-white/[0.03] pt-2">
                  <Compass className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-2 w-full">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">Preferences</span>
                    <div className="flex flex-wrap gap-2">
                      {tripMetadata.tripType && (
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                          <span className="text-primary/70 font-black uppercase tracking-widest text-[8px]">Style</span>
                          <span className="text-white font-bold capitalize text-[10px]">{tripMetadata.tripType}</span>
                        </div>
                      )}
                      {tripMetadata.travelTimePreference && tripMetadata.travelTimePreference !== "no_preference" && (
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                          <span className="text-primary/70 font-black uppercase tracking-widest text-[8px]">Timing</span>
                          <span className="text-white font-bold capitalize text-[10px]">{tripMetadata.travelTimePreference.replace(/_/g, ' ')}</span>
                        </div>
                      )}
                      {tripMetadata.leisureTime && (
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                          <span className="text-primary/70 font-black uppercase tracking-widest text-[8px]">Leisure</span>
                          <span className="text-white font-bold text-[10px]">Day {tripMetadata.leisureDay || "N/A"}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Travel Methods */}
                    {tripMetadata.travelMethods && tripMetadata.travelMethods.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider block">Travel Methods</span>
                        <div className="flex flex-wrap gap-1">
                          {tripMetadata.travelMethods.map((method: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-semibold text-zinc-300">
                              {method}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Daywise plan if custom */}
                {tripMetadata.daywiseDestinations && (
                  <div className="flex gap-2 border-t border-white/[0.03] pt-2">
                    <Sliders className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-0.5 w-full">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block font-sans">Custom Daywise Plan</span>
                      <p className="text-zinc-300 text-[10px] leading-relaxed bg-white/5 border border-white/5 rounded-lg p-2 mt-1">
                        {tripMetadata.daywiseDestinations}
                      </p>
                    </div>
                  </div>
                )}

                {/* Constraints */}
                {(tripMetadata.mustInclude || tripMetadata.avoid) && (
                  <div className="flex gap-2 border-t border-white/[0.03] pt-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-2 w-full">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">Constraints</span>
                      {tripMetadata.mustInclude && (
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-2.5 py-1.5">
                          <span className="text-emerald-400 font-bold block mb-0.5 uppercase tracking-widest text-[8px]">Must Include</span>
                          <span className="text-zinc-300 leading-normal text-[10px]">{tripMetadata.mustInclude}</span>
                        </div>
                      )}
                      {tripMetadata.avoid && (
                        <div className="bg-rose-500/5 border border-rose-500/10 rounded-lg px-2.5 py-1.5">
                          <span className="text-rose-400 font-bold block mb-0.5 uppercase tracking-widest text-[8px]">Must Exclude (Avoid)</span>
                          <span className="text-zinc-300 leading-normal text-[10px]">{tripMetadata.avoid}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick AI Regeneration Box in View Mode */}
                {onRegenerateItinerary && (
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <div className="space-y-1">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={quickPrompt}
                          onChange={(e) => setQuickPrompt(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isGenerating && !isQuickPromptOverLimit) handleQuickRegenerate();
                          }}
                          placeholder="Ask AI to refine (e.g. Add Day 2 beach club)..."
                          className={cn(
                            "w-full bg-white/5 border rounded-xl px-3 py-2 pr-9 text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-colors",
                            isQuickPromptOverLimit ? "border-red-500/60 focus:border-red-500" : "border-white/10 focus:border-purple-500/50"
                          )}
                        />
                        <MessageSquare className="w-3.5 h-3.5 text-zinc-500 absolute right-3 pointer-events-none" />
                      </div>
                      
                      {quickPrompt.trim().length > 0 && (
                        <div className="flex justify-between items-center text-[10px] px-1">
                          <span className={cn(
                            "font-semibold",
                            isQuickPromptOverLimit ? "text-red-400" : "text-zinc-400"
                          )}>
                            {quickPromptWordCount} / {MAX_WORDS} words
                          </span>
                          {isQuickPromptOverLimit && (
                            <span className="text-red-400 font-medium">Prompt is too long (limit: {MAX_WORDS} words)</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        disabled={isGenerating || isQuickPromptOverLimit}
                        onClick={handleQuickRegenerate}
                        className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-primary text-white font-bold py-2 h-auto rounded-xl border border-purple-400/30 shadow-lg shadow-purple-900/30 hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGenerating ? (
                          <>
                            <MorphingSquare className="w-3.5 h-3.5 text-white" />
                            <span>Regenerating Itinerary...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                            <span>Regenerate Itinerary</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        )}
      </div>

      {/* Client Details */}
      <div className="liquid-glass p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Client Details</h5>
          {onOpenAddClient && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenAddClient}
              className="h-6 text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-white/5 px-2 rounded-md font-semibold gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add Client</span>
            </Button>
          )}
        </div>
        {(() => {
          const selectedClient = clients.find(c => c.id === selectedClientId);
          if (!selectedClient) {
            return (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[18px] text-zinc-600">person_off</span>
                </div>
                <p className="text-[11px] font-bold text-zinc-500">No Client Assigned</p>
                <p className="text-[9px] text-zinc-600 mt-0.5 mb-3">Assign a client from the dropdown above or create a new client.</p>
                {onOpenAddClient && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenAddClient}
                    className="h-7 text-[10px] bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg gap-1.5 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Create New Client</span>
                  </Button>
                )}
              </div>
            );
          }
          const initials = selectedClient.name
            .split(' ')
            .map((n:string) => n.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
          const memberSince = new Date(selectedClient.created_at).getFullYear();
          const tagList = selectedClient.tags || [];
          const dietaryTag = tagList.find((t:string) => /vegan|vegetarian|halal|kosher|gluten|dietary|gf|non.?veg/i.test(t));
          const paceTag = tagList.find((t:string) => /relaxed|adventure|luxury|budget|fast|slow|moderate|pace/i.test(t));
          
          return (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 ring-2 ring-primary/40 flex items-center justify-center text-sm font-black text-white">
                    {initials}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-white text-base truncate">{selectedClient.name}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                    Client since {memberSince}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {selectedClient.email && (
                  <div className="p-3 rounded-xl border border-white/5 bg-white/5 flex flex-col justify-center col-span-2">
                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Email</p>
                    <p className="text-[10px] font-bold text-slate-300 truncate">{selectedClient.email}</p>
                  </div>
                )}
                {selectedClient.phone && (
                  <div className="p-3 rounded-xl border border-white/5 bg-white/5 flex flex-col justify-center col-span-2">
                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Phone</p>
                    <p className="text-[10px] font-bold text-slate-300">{selectedClient.phone}</p>
                  </div>
                )}
                <div className="p-3 rounded-xl border border-white/5 bg-white/5 flex flex-col justify-center">
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Dietary</p>
                  <p className="text-[10px] font-bold text-tertiary">{dietaryTag || "—"}</p>
                </div>
                <div className="p-3 rounded-xl border border-white/5 bg-white/5 flex flex-col justify-center">
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Pace</p>
                  <p className="text-[10px] font-bold text-tertiary">{paceTag || "—"}</p>
                </div>
              </div>
              {selectedClient.notes && (
                <div className="p-3 rounded-xl border border-white/5 bg-white/5">
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Notes</p>
                  <p className="text-[10px] leading-relaxed text-slate-400 line-clamp-3">{selectedClient.notes}</p>
                </div>
              )}
              {tagList.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {tagList.map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[8px] font-bold text-primary uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
});

export default TheLabSummaryPanel;



