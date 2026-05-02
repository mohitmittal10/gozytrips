// Right-side summary panel for status, AI optimization feedback, and client dossier
import React from 'react';
import { cn } from "@/lib/utils";
import { MorphingSquare } from "@/components/ui/morphing-square";
import { MAX_AI_OPTIMIZATIONS } from "@/constants/ai-architect";
import { useReferenceOptions } from '@/hooks/use-reference-options';

interface AiArchitectSummaryPanelProps {
  itinerary: any;
  selectedStatus: string;
  clients: any[];
  selectedClientId: string;
  optimizationCount: number;
  isGenerating: boolean;
  onOptimize: (feedback: string) => void;
}

const AiArchitectSummaryPanel = React.memo(function AiArchitectSummaryPanel({
  itinerary, selectedStatus, clients, selectedClientId,
  optimizationCount, isGenerating, onOptimize
}: AiArchitectSummaryPanelProps) {
  const { options: itineraryStatuses } = useReferenceOptions('itinerary_status');
  
  if (!itinerary || !itinerary.itinerary || itinerary.itinerary.length === 0) return null;

  const statusOption = itineraryStatuses.find(opt => opt.value === selectedStatus);

  return (
    <div className="w-[100vw] -ml-3 sm:-ml-2 md:-ml-4 lg:ml-0 lg:w-auto lg:col-span-4 space-y-3 sm:space-y-4 lg:sticky lg:top-24 order-1 lg:order-2 self-start px-3 sm:px-2 md:px-4 lg:px-0">
      
      {/* Journey Summary */}
      <div className="glass-panel rounded-xl sm:rounded-2xl p-3 mb-3 sm:mb-4 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-obsidian-dark/80 backdrop-blur-lg border border-white/5">
        <div className="w-full sm:w-auto">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2 block">Journey Summary</h3>
          <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-8">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-primary uppercase tracking-widest mb-0.5">Focus</span>
              <span className="text-white text-xs font-bold leading-none">{itinerary.itinerary[0]?.areaFocus?.split(',')[0]}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-secondary uppercase tracking-widest mb-0.5">Duration</span>
              <span className="text-white text-xs font-bold leading-none">{itinerary.itinerary.length} Days</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-tertiary uppercase tracking-widest mb-1.5">Status</span>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 transition-all">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]",
                  statusOption?.metadata?.color === 'purple' && "bg-purple-400 shadow-purple-400/20",
                  statusOption?.metadata?.color === 'pink' && "bg-pink-400 shadow-pink-400/20",
                  statusOption?.metadata?.color === 'blue' && "bg-blue-400 shadow-blue-400/20",
                  statusOption?.metadata?.color === 'green' && "bg-emerald-400 shadow-emerald-500/20",
                  statusOption?.metadata?.color === 'amber' && "bg-amber-400 shadow-amber-500/20",
                  statusOption?.metadata?.color === 'red' && "bg-rose-400 shadow-rose-500/20",
                  // Fallback for missing metadata
                  !statusOption && (
                    selectedStatus === 'draft' ? "bg-zinc-400 shadow-zinc-400/20" :
                    selectedStatus === 'sent' ? "bg-primary shadow-primary/20" :
                    selectedStatus === 'confirmed' || selectedStatus === 'booked' ? "bg-emerald-400 shadow-emerald-500/20" :
                    selectedStatus === 'rejected' ? "bg-rose-400 shadow-rose-500/20" :
                    "bg-zinc-500"
                  )
                )} />
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-wider leading-none",
                  statusOption?.metadata?.color === 'purple' && "text-purple-400",
                  statusOption?.metadata?.color === 'pink' && "text-pink-400",
                  statusOption?.metadata?.color === 'blue' && "text-blue-400",
                  statusOption?.metadata?.color === 'green' && "text-emerald-400",
                  statusOption?.metadata?.color === 'amber' && "text-amber-400",
                  statusOption?.metadata?.color === 'red' && "text-rose-400",
                  // Fallback
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
          </div>
        </div>
      </div>

      {/* AI Optimizer Section */}
      <div className="liquid-glass p-4 rounded-2xl space-y-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-extrabold text-white text-base tracking-tight">AI Optimizer</h3>
        </div>
        <div className="space-y-3">
          {itinerary.optimizations && itinerary.optimizations.length > 0 ? (
            itinerary.optimizations.map((opt: any, idx: number) => (
              <div
                key={idx}
                style={{ animationDelay: `${100 + (idx * 100)}ms` }}
                className="bg-white/5 rounded-xl p-3 border border-white/5 transition-all duration-300 hover:bg-white/10 hover:border-primary/30 group cursor-pointer animate-in fade-in slide-in-from-right-4 fill-mode-both"
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[9px] uppercase font-black text-primary/70 tracking-[0.2em]">{opt.type}</p>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded leading-none">
                    {opt.impact}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-white/90 leading-tight group-hover:text-white transition-colors">
                  {opt.message}
                </p>
              </div>
            ))
          ) : (
            <div className="py-8 text-center space-y-2 opacity-50">
              <div className="w-10 h-10 rounded-full bg-white/5 mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-zinc-500">lightbulb</span>
              </div>
              <p className="text-[10px] font-medium text-zinc-500">Generating smart insights...</p>
            </div>
          )}
        </div>
        
        <button
          onClick={() => {
            if (!itinerary.optimizations || optimizationCount >= MAX_AI_OPTIMIZATIONS) return;
            const feedback = itinerary.optimizations.map((o:any) => `${o.type}: ${o.message}`).join(". ");
            onOptimize(feedback);
          }}
          disabled={isGenerating || !itinerary || optimizationCount >= MAX_AI_OPTIMIZATIONS}
          className={cn(
            "w-full py-2.5 rounded-lg aurora-gradient text-white font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-2",
            (isGenerating || !itinerary || optimizationCount >= MAX_AI_OPTIMIZATIONS) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isGenerating ? (
            <MorphingSquare className="w-4 h-4 bg-white" message="Refining..." messagePlacement="right" />
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              {optimizationCount >= MAX_AI_OPTIMIZATIONS ? "Optimization Limit Reached" : `Apply Optimizations (${optimizationCount}/${MAX_AI_OPTIMIZATIONS})`}
            </>
          )}
        </button>
      </div>

      {/* Client Dossier */}
      <div className="liquid-glass p-4 rounded-2xl">
        <h5 className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-4">Client Dossier</h5>
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

export default AiArchitectSummaryPanel;
