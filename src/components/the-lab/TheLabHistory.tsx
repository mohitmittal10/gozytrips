import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { 
  History, 
  Calendar, 
  ChevronRight, 
  Loader2, 
  Clock,
  Sparkles,
  Search,
  ArrowUpRight,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActiveLabTab } from '@/types/the-lab';
import { useAuth } from '@/contexts/auth-context';
import { getCurrencySymbol, formatMoney } from "@/lib/utils/currency";
import { DEFAULT_CURRENCY } from "@/types/pricing";

interface ItineraryRecord {
  id: string;
  trip_id: string;
  status: string;
  title?: string;
  destinations?: string;
  start_date?: string;
  last_activity_at: string;
  generation_preferences: any;
  client_price?: number;
}

interface TheLabHistoryProps {
  setCurrentTripId: (id: string | null) => void;
  setActiveLabTab: (tab: ActiveLabTab) => void;
  handleCreateNew: () => void;
}

export const TheLabHistory: React.FC<TheLabHistoryProps> = ({ 
  setCurrentTripId, 
  setActiveLabTab,
  handleCreateNew
}) => {
  const [itineraries, setItineraries] = useState<ItineraryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { agencySettings } = useAuth();
  const currencySymbol = getCurrencySymbol((agencySettings as any)?.default_currency || DEFAULT_CURRENCY);
  const supabase = createClient();

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("itineraries")
        .select("*")
        .eq("user_id", session.user.id)
        .order("last_activity_at", { ascending: false });

      if (error) throw error;
      setItineraries(data || []);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch itinerary history:", err);
      setError(err.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleLoad = (id: string) => {
    setCurrentTripId(id);
    setActiveLabTab('itinerary');
  };

  const filteredItineraries = itineraries.filter(item => {
    const title = (item.title || "").toLowerCase();
    const dest = (item.destinations || "").toLowerCase();
    return title.includes(searchQuery.toLowerCase()) || dest.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
          <div className="absolute inset-0 blur-xl bg-purple-500/20 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-white font-medium tracking-tight">Retrieving Archive</p>
          <p className="text-zinc-500 text-xs uppercase tracking-widest font-black opacity-50">Syncing with cloud repository</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 rounded-[2.5rem] border border-red-500/20 bg-red-500/5 text-center backdrop-blur-xl">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 text-red-500">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Access Denied</h3>
        <p className="text-red-400/80 text-sm mb-6 max-w-xs mx-auto">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all uppercase tracking-widest"
        >
          Re-authenticate
        </button>
      </div>
    );
  }

  if (itineraries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-4 animate-in fade-in duration-1000">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-zinc-500/10 to-zinc-800/10 flex items-center justify-center mb-8 border border-white/5 shadow-2xl relative">
          <History className="w-10 h-10 text-zinc-700" />
          <div className="absolute inset-0 rounded-full border border-zinc-700/20 scale-125 animate-ping opacity-20" />
        </div>
        <h3 className="text-3xl font-serif font-bold text-white mb-4 uppercase tracking-wider">The Archive is Empty</h3>
        <p className="text-zinc-500 max-w-sm mx-auto text-sm leading-relaxed mb-10">
          Your travel masterpieces await. Start a new generation to begin cataloging your travel experiences.
        </p>
        <button 
          onClick={handleCreateNew}
          className="px-8 py-3 rounded-full aurora-gradient text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          Initialize First Draft
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-white/5">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <History className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-3xl font-serif font-extrabold text-white tracking-tight uppercase">Archive</h2>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Cataloging {itineraries.length} generation(s)</p>
            </div>
          </div>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-purple-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search archive..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40 transition-all"
          />
        </div>
      </div>

      {/* List Section */}
      <div className="grid gap-6">
        {filteredItineraries.length > 0 ? (
          filteredItineraries.map((item, idx) => {
            const prefs = item.generation_preferences || {};
            const displayTitle = item.title || item.destinations || prefs.destinations || "Untitled Project";
            const startDate = item.start_date ? new Date(item.start_date) : (prefs.startDate ? new Date(prefs.startDate) : null);
            const status = item.status || 'draft';
            
            return (
              <div 
                key={item.id}
                onClick={() => handleLoad(item.id)}
                className="group relative overflow-hidden rounded-[2.5rem] border border-white/[0.06] bg-[#0d0d0e]/40 hover:bg-[#121214]/60 transition-all duration-700 cursor-pointer p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-8"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Visual Accent */}
                <div className={cn(
                  "absolute top-0 left-0 w-1 h-full transition-all duration-700",
                  status === 'confirmed' ? "bg-emerald-500 shadow-[2px_0_15px_rgba(16,185,129,0.4)]" : "bg-purple-500 shadow-[2px_0_15px_rgba(168,85,247,0.4)]"
                )} />

                {/* Background Gradient Pulse */}
                <div className={cn(
                  "absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] opacity-0 group-hover:opacity-20 transition-opacity duration-1000",
                  status === 'confirmed' ? "bg-emerald-500" : "bg-purple-500"
                )} />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                  <div className="flex-1 space-y-6">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className={cn(
                        "flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border",
                        status === 'confirmed' 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]" 
                          : "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)]"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", status === 'confirmed' ? "bg-emerald-400" : "bg-purple-400")} />
                        {status}
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                        <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Job ID</span>
                        <span className="text-[10px] text-zinc-400 font-mono font-bold tracking-wider">{item.trip_id}</span>
                      </div>
                      {item.client_price && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                           <span className="text-[10px] text-emerald-400/80 font-black">{formatMoney(item.client_price, (agencySettings as any)?.default_currency || DEFAULT_CURRENCY)}</span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-2xl sm:text-4xl font-serif font-bold text-white leading-tight group-hover:translate-x-1 transition-transform duration-700 line-clamp-2 max-w-2xl">
                      {displayTitle}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
                      <div className="flex items-center gap-3 group/meta">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover/meta:border-purple-500/30 transition-colors">
                          <Calendar className="w-4 h-4 text-zinc-500 group-hover/meta:text-purple-400 transition-colors" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 font-black mb-0.5">Departure</span>
                          <span className="text-xs font-bold text-zinc-300">
                            {startDate ? format(startDate, "MMMM d, yyyy") : "TBD"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 group/meta">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover/meta:border-purple-500/30 transition-colors">
                          <Clock className="w-4 h-4 text-zinc-500 group-hover/meta:text-purple-400 transition-colors" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 font-black mb-0.5">Last Modification</span>
                          <span className="text-xs font-bold text-zinc-300">
                             {format(new Date(item.last_activity_at), "MMM d, HH:mm")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-10">
                    <div className="flex flex-col items-end opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-x-12 group-hover:translate-x-0 hidden sm:flex">
                       <span className="text-[10px] text-purple-400 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                        Launch The Lab <ArrowUpRight className="w-3 h-3" />
                       </span>
                       <span className="text-[10px] text-zinc-600 font-semibold mt-1 italic">Ready for optimization</span>
                    </div>
                    <div className="w-16 h-16 rounded-[1.25rem] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:border-white transition-all duration-700 shadow-2xl group-hover:shadow-purple-500/40 relative overflow-hidden">
                      <ChevronRight className="w-8 h-8 text-zinc-600 group-hover:text-black transition-colors duration-700" />
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center space-y-4 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
             <Search className="w-10 h-10 text-zinc-800 mx-auto" />
             <p className="text-zinc-600 font-medium">No archived projects found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};


