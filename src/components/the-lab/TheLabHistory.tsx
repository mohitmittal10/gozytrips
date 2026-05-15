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
    <div className="space-y-6">
      {/* Header Section - More Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            Itinerary Archive
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">{itineraries.length} total generation(s) found</p>
        </div>

        <div className="relative w-full sm:w-64 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500/40 transition-all"
          />
        </div>
      </div>

      {/* List Section - Professional Table-like rows */}
      <div className="space-y-2">
        {/* Table Header */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600 border-b border-white/5">
          <div className="col-span-1">Status</div>
          <div className="col-span-4">Itinerary Details</div>
          <div className="col-span-2">Departure</div>
          <div className="col-span-2">Last Modified</div>
          <div className="col-span-2">Price</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

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
                className="group relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 cursor-pointer p-4 lg:py-3"
              >
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 items-center">
                  {/* Status */}
                  <div className="col-span-1 w-full lg:w-auto">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider",
                      status === 'confirmed' 
                        ? "bg-emerald-500/10 text-emerald-400" 
                        : "bg-purple-500/10 text-purple-400"
                    )}>
                      <div className={cn("w-1 h-1 rounded-full", status === 'confirmed' ? "bg-emerald-400" : "bg-purple-400")} />
                      {status}
                    </div>
                  </div>

                  {/* Title & Destinations */}
                  <div className="col-span-4 w-full">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                        {displayTitle}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {item.trip_id}</span>
                    </div>
                  </div>

                  {/* Departure */}
                  <div className="col-span-2 w-full lg:w-auto flex items-center gap-2 text-zinc-400">
                    <Calendar className="w-3 h-3 text-zinc-600" />
                    <span className="text-xs font-medium">
                      {startDate ? format(startDate, "MMM d, yyyy") : "—"}
                    </span>
                  </div>

                  {/* Last Modified */}
                  <div className="col-span-2 w-full lg:w-auto flex items-center gap-2 text-zinc-400">
                    <Clock className="w-3 h-3 text-zinc-600" />
                    <span className="text-xs font-medium">
                       {format(new Date(item.last_activity_at), "MMM d, HH:mm")}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 w-full lg:w-auto">
                    {item.client_price ? (
                      <span className="text-xs font-bold text-emerald-400">
                        {formatMoney(item.client_price, (agencySettings as any)?.default_currency || DEFAULT_CURRENCY)}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </div>

                  {/* Action */}
                  <div className="col-span-1 w-full lg:w-auto text-right">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/5 group-hover:bg-purple-500 group-hover:border-purple-500 transition-all">
                      <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/10">
             <Search className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
             <p className="text-zinc-600 text-sm">No matches for "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};
