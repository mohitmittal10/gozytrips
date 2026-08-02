// Right-side summary panel for status, AI optimization feedback, and client detail
import React from 'react';
import { cn } from "@/lib/utils";
import { MorphingSquare } from "@/components/ui/morphing-square";
import { MAX_AI_OPTIMIZATIONS } from "@/constants/the-lab";
import { useReferenceOptions } from '@/hooks/use-reference-options';
import { Sliders, MapPin, Calendar, Compass, Sparkles, ChevronDown } from "lucide-react";
import { format } from "date-fns";

interface TheLabSummaryPanelProps {
  itinerary: any;
  selectedStatus: string;
  clients: any[];
  selectedClientId: string;
  optimizationCount: number;
  isGenerating: boolean;
  onOptimize: (feedback: string) => void;
  finalTotal?: number;
  currencySymbol?: string;
  tripMetadata?: any;
}

const TheLabSummaryPanel = React.memo(function TheLabSummaryPanel({
  itinerary, selectedStatus, clients, selectedClientId,
  optimizationCount, isGenerating, onOptimize,
  finalTotal, currencySymbol, tripMetadata
}: TheLabSummaryPanelProps) {
  const { options: itineraryStatuses } = useReferenceOptions('itinerary_status');
  const [isInputsOpen, setIsInputsOpen] = React.useState(false);
  
  if (!itinerary || !itinerary.itinerary || itinerary.itinerary.length === 0) return null;

  const statusOption = itineraryStatuses.find(opt => opt.value === selectedStatus);

  return (
    <div className="w-[100vw] -ml-3 sm:-ml-2 md:-ml-4 lg:ml-0 lg:w-auto lg:col-span-4 space-y-3 sm:space-y-4 lg:sticky lg:top-24 order-1 lg:order-2 self-start px-3 sm:px-2 md:px-4 lg:px-0">
      
      {/* Journey Summary */}
      <div className="glass-panel relative rounded-xl sm:rounded-2xl p-3 mb-3 sm:mb-4 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-obsidian-dark/80 backdrop-blur-lg border border-white/5 overflow-hidden">
        {/* Status Badge - Top Right */}
        <div className="absolute top-0 right-0">
          <div className={cn(
            "px-3 py-1 rounded-bl-xl border-l border-b border-white/5 flex items-center gap-2",
            statusOption?.metadata?.color === 'purple' && "bg-purple-500/10",
            statusOption?.metadata?.color === 'pink' && "bg-pink-500/10",
            statusOption?.metadata?.color === 'blue' && "bg-blue-500/10",
            statusOption?.metadata?.color === 'green' && "bg-emerald-500/10",
            statusOption?.metadata?.color === 'amber' && "bg-amber-500/10",
            statusOption?.metadata?.color === 'red' && "bg-rose-500/10",
            !statusOption && "bg-white/5"
          )}>
            <div className={cn(
              "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]",
              statusOption?.metadata?.color === 'purple' && "bg-purple-400 shadow-purple-400/20",
              statusOption?.metadata?.color === 'pink' && "bg-pink-400 shadow-pink-400/20",
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
              statusOption?.metadata?.color === 'pink' && "text-pink-400",
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

      {/* Original Requirements / Input Parameters */}
      {tripMetadata && (
        <div className="liquid-glass p-3.5 rounded-2xl space-y-3">
          <button
            type="button"
            onClick={() => setIsInputsOpen(!isInputsOpen)}
            className="w-full flex items-center justify-between text-white hover:text-primary transition-colors focus:outline-none"
          >
            <h4 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary shrink-0" />
              Trip Requirements
            </h4>
            <ChevronDown 
              className="w-4 h-4 transition-transform duration-300"
              style={{ transform: isInputsOpen ? 'rotate(180deg)' : 'none' }}
            />
          </button>

          {isInputsOpen && (
            <div className="pt-2 border-t border-white/5 space-y-3.5 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
              
              {/* Route Locations */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-2 w-full">
                    <div>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">Starting Location</span>
                      <span className="text-zinc-200 font-semibold">{tripMetadata.startingLocation}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">Destinations</span>
                      <span className="text-zinc-200 font-semibold">{tripMetadata.destinations}</span>
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
            </div>
          )}
        </div>
      )}

      {/* AI Optimizer Section */}
      <div className="liquid-glass p-4 rounded-2xl space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[14px] text-primary">auto_awesome</span>
            </div>
            <h3 className="font-extrabold text-white text-sm tracking-tight">AI Optimizer</h3>
          </div>
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
            {optimizationCount}/{MAX_AI_OPTIMIZATIONS} used
          </span>
        </div>

        {/* Optimization Cards */}
        <div className="space-y-2">
          {itinerary.optimizations && itinerary.optimizations.length > 0 ? (
            itinerary.optimizations.map((opt: any, idx: number) => {
              const isDisabled = optimizationCount >= MAX_AI_OPTIMIZATIONS || isGenerating;
              const impactColor =
                /high/i.test(opt.impact) ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" :
                /medium/i.test(opt.impact) ? "text-amber-400 bg-amber-400/10 border-amber-400/20" :
                "text-sky-400 bg-sky-400/10 border-sky-400/20";
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (isDisabled) return;
                    onOptimize(`${opt.type}: ${opt.message}`);
                  }}
                  title={optimizationCount >= MAX_AI_OPTIMIZATIONS ? "Optimization limit reached" : "Click to apply this optimization"}
                  style={{ animationDelay: `${80 + (idx * 80)}ms` }}
                  className={cn(
                    "rounded-xl border-l-2 border border-white/5 bg-white/[0.03] p-3 transition-all duration-200 group animate-in fade-in slide-in-from-right-3 fill-mode-both",
                    isDisabled
                      ? "opacity-40 cursor-not-allowed border-l-white/10"
                      : "hover:bg-white/[0.07] hover:border-white/10 cursor-pointer border-l-primary/40 hover:border-l-primary"
                  )}
                >
                  {/* Card top row: type label + impact badge + bolt icon */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-[9px] uppercase font-black text-primary/60 tracking-[0.18em] flex-1 min-w-0 truncate">
                      {opt.type}
                    </p>
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border leading-none shrink-0",
                      impactColor
                    )}>
                      {opt.impact}
                    </span>
                    {!isDisabled && (
                      <span className="material-symbols-outlined text-[13px] text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        bolt
                      </span>
                    )}
                  </div>
                  {/* Message */}
                  <p className="text-[11px] font-semibold text-white/75 leading-snug group-hover:text-white/95 transition-colors">
                    {opt.message}
                  </p>
                  {/* Apply hint on hover */}
                  {!isDisabled && (
                    <p className="text-[9px] text-primary/50 font-bold mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to apply →
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-7 text-center space-y-2">
              <div className="w-9 h-9 rounded-full bg-white/5 mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-zinc-600">lightbulb</span>
              </div>
              <p className="text-[10px] font-semibold text-zinc-600">Generating smart insights…</p>
            </div>
          )}
        </div>

        {/* Apply All Button */}
        <button
          onClick={() => {
            if (optimizationCount >= MAX_AI_OPTIMIZATIONS) return;
            const opts = itinerary.optimizations;
            const feedback =
              opts && opts.length > 0
                ? opts.map((o: any) => `${o.type}: ${o.message}`).join(". ")
                : "Please refine and improve the itinerary flow, timing, and activity variety while keeping the same destinations and dates.";
            onOptimize(feedback);
          }}
          disabled={isGenerating || !itinerary || optimizationCount >= MAX_AI_OPTIMIZATIONS}
          className={cn(
            "w-full py-2.5 rounded-xl aurora-gradient text-white font-bold text-xs shadow-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-1.5",
            (isGenerating || !itinerary || optimizationCount >= MAX_AI_OPTIMIZATIONS) && "opacity-40 cursor-not-allowed"
          )}
        >
          {isGenerating ? (
            <MorphingSquare className="w-3.5 h-3.5 bg-white" message="Refining itinerary…" messagePlacement="right" />
          ) : (
            <>
              <span className="material-symbols-outlined text-[15px]">bolt</span>
              {optimizationCount >= MAX_AI_OPTIMIZATIONS
                ? "Optimization Limit Reached"
                : "Apply All Optimizations"}
            </>
          )}
        </button>
      </div>

      {/* Client Details */}
      <div className="liquid-glass p-4 rounded-2xl">
        <h5 className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-4">Client Details</h5>
        {(() => {
          const selectedClient = clients.find(c => c.id === selectedClientId);
          if (!selectedClient) {
            return (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[18px] text-zinc-600">person_off</span>
                </div>
                <p className="text-[11px] font-bold text-zinc-500">No Client Assigned</p>
                <p className="text-[9px] text-zinc-600 mt-0.5">Assign a client from the dropdown above</p>
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


