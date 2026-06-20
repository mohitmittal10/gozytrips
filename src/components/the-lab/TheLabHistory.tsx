import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { 
  History, 
  Calendar, 
  ChevronRight, 
  ChevronLeft,
  Clock,
  Sparkles,
  Search,
  Users,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActiveLabTab } from '@/types/the-lab';
import { useAuth } from '@/contexts/auth-context';
import { getCurrencySymbol, formatMoney } from "@/lib/utils/currency";
import { DEFAULT_CURRENCY } from "@/types/pricing";
import UniqueLoading from '../ui/morph-loading';

interface ItineraryRecord {
  id: string;
  trip_id: string;
  status: string;
  title?: string;
  destinations?: string;
  start_date?: string;
  last_activity_at: string;
  generation_preferences: any;
  // Financial columns
  client_price?: number | null;
  markup_value?: number | null;
  markup_type?: string | null;
  tax_percentage?: number | null;
  adult_pax?: number | null;
  child_pax?: number | null;
  infant_pax?: number | null;
  currency?: string | null;
  costing_type?: string | null;
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { agencySettings } = useAuth();
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
        .select(
          "id, trip_id, status, title, destinations, start_date, last_activity_at, generation_preferences, " +
          "client_price, markup_value, markup_type, tax_percentage, adult_pax, child_pax, infant_pax, currency, costing_type"
        )
        .eq("user_id", session.user.id)
        .order("last_activity_at", { ascending: false });

      if (error) throw error;
      setItineraries((data as any) || []);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleLoad = (id: string) => {
    setCurrentTripId(id);
    setActiveLabTab('itinerary');
  };

  const filteredItineraries = itineraries.filter(item => {
    const title = (item.title || "").toLowerCase();
    const dest = (item.destinations || "").toLowerCase();
    return title.includes(searchQuery.toLowerCase()) || dest.includes(searchQuery.toLowerCase());
  });

  const totalPages = Math.ceil(filteredItineraries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItineraries = filteredItineraries.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-8">
        <div className="relative group">
          <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
          <UniqueLoading variant="morph" size="lg" className="relative z-10" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-white font-medium tracking-tight">Retrieving Archive</p>
          <p className="text-zinc-500 text-xs uppercase tracking-widest font-black opacity-30">Syncing with cloud repository</p>
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
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center mb-8 border border-primary/10 shadow-2xl relative">
          <History className="w-10 h-10 text-primary/70" />
          <div className="absolute inset-0 rounded-full border border-primary/20 scale-125 animate-ping opacity-20" />
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Itinerary Archive
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">{itineraries.length} total generation(s) found</p>
        </div>

        <div className="relative w-full sm:w-64 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/50" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {/* Table Header */}
        <div className="hidden xl:grid grid-cols-12 gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600 border-b border-white/5">
          <div className="col-span-1">Status</div>
          <div className="col-span-3">Itinerary Details</div>
          <div className="col-span-2">Departure</div>
          <div className="col-span-2">Last Modified</div>
          <div className="col-span-3">Financials</div>
          <div className="col-span-1 text-right">Open</div>
        </div>

        {paginatedItineraries.length > 0 ? (
          paginatedItineraries.map((item) => {
            const prefs = item.generation_preferences || {};
            const displayTitle = item.title || item.destinations || prefs.destinations || "Untitled Project";
            const startDate = item.start_date ? new Date(`${item.start_date}T00:00:00`) : (prefs.startDate ? new Date(prefs.startDate) : null);
            const status = item.status || 'draft';

            // Financial resolution
            const currency = item.currency || (agencySettings as any)?.default_currency || DEFAULT_CURRENCY;
            const currencySymbol = getCurrencySymbol(currency as any);
            const clientPrice   = item.client_price ?? null;
            const markupValue   = item.markup_value ?? null;
            const markupType    = item.markup_type ?? 'percentage';
            const taxPct        = item.tax_percentage ?? null;
            const adultPax      = item.adult_pax ?? null;
            const childPax      = item.child_pax ?? 0;
            const infantPax     = item.infant_pax ?? 0;
            const totalPax      = (adultPax ?? 0) + childPax + infantPax;
            const hasFinancials = clientPrice !== null && clientPrice > 0;

            return (
              <div 
                key={item.id}
                onClick={() => handleLoad(item.id)}
                className="group relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer p-4 xl:py-3"
              >
                <div className="flex flex-col xl:grid xl:grid-cols-12 gap-3 items-start xl:items-center">
                  
                  {/* Status */}
                  <div className="col-span-1 w-full xl:w-auto">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider",
                      status === 'confirmed' 
                        ? "bg-emerald-500/10 text-emerald-400" 
                        : "bg-primary/10 text-primary"
                    )}>
                      <div className={cn("w-1 h-1 rounded-full", status === 'confirmed' ? "bg-emerald-400" : "bg-primary")} />
                      {status}
                    </div>
                  </div>

                  {/* Title & Destinations */}
                  <div className="col-span-3 w-full">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors truncate">
                        {displayTitle}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {item.trip_id}</span>
                    </div>
                  </div>

                  {/* Departure */}
                  <div className="col-span-2 w-full xl:w-auto flex items-center gap-2 text-zinc-400">
                    <Calendar className="w-3 h-3 text-primary/70 shrink-0" />
                    <span className="text-xs font-medium">
                      {startDate ? format(startDate, "MMM d, yyyy") : "—"}
                    </span>
                  </div>

                  {/* Last Modified */}
                  <div className="col-span-2 w-full xl:w-auto flex items-center gap-2 text-zinc-400">
                    <Clock className="w-3 h-3 text-primary/70 shrink-0" />
                    <span className="text-xs font-medium">
                      {format(new Date(item.last_activity_at), "MMM d, HH:mm")}
                    </span>
                  </div>

                  {/* ── Financials ── */}
                  <div className="col-span-3 w-full">
                    {hasFinancials ? (
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 items-center">
                        {/* Client Price */}
                        <div className="flex items-center gap-1.5">
                          <Receipt className="w-3 h-3 text-primary/70 shrink-0" />
                          <div className="flex flex-col leading-none">
                            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Client Price</span>
                            <span className="text-sm font-bold text-emerald-400">
                              {formatMoney(clientPrice!, currency as any)}
                            </span>
                          </div>
                        </div>

                        {/* Markup */}
                        {markupValue !== null && (
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-3 h-3 text-primary/70 shrink-0" />
                            <div className="flex flex-col leading-none">
                              <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Markup</span>
                              <span className="text-xs font-semibold text-blue-400">
                                {markupType === 'flat'
                                  ? `${currencySymbol}${markupValue.toLocaleString()}`
                                  : `${markupValue}%`}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Tax */}
                        {taxPct !== null && taxPct > 0 && (
                          <div className="flex flex-col leading-none">
                            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Tax</span>
                            <span className="text-xs font-semibold text-amber-400">{taxPct}%</span>
                          </div>
                        )}

                        {/* Pax */}
                        {totalPax > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-primary/70 shrink-0" />
                            <div className="flex flex-col leading-none">
                              <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Pax</span>
                              <span className="text-xs font-semibold text-zinc-300">
                                {adultPax}A{childPax > 0 ? ` ${childPax}C` : ''}{infantPax > 0 ? ` ${infantPax}I` : ''}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-700 italic">No financial data saved yet</span>
                    )}
                  </div>

                  {/* Action */}
                  <div className="col-span-1 w-full xl:w-auto xl:text-right">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/5 group-hover:bg-primary group-hover:border-primary transition-all">
                      <ChevronRight className="w-4 h-4 text-primary/60 group-hover:text-white" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/10">
            <Search className="w-8 h-8 text-primary/40 mx-auto mb-3" />
            <p className="text-zinc-600 text-sm">No matches for "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] backdrop-blur-sm mt-4">
          <p className="text-xs text-zinc-500 font-medium">
            Showing <span className="text-zinc-300 font-bold">{startIndex + 1}</span>-
            <span className="text-zinc-300 font-bold">{Math.min(startIndex + itemsPerPage, filteredItineraries.length)}</span> of{" "}
            <span className="text-zinc-300 font-bold">{filteredItineraries.length}</span> generations
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-zinc-400 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, idx) => {
                const pageNum = idx + 1;
                
                // Keep only first, last, current, and surrounding pages
                if (totalPages > 5) {
                  if (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                    if (pageNum === 2 && currentPage > 3) {
                      return <span key="dots-start" className="text-zinc-600 px-1 text-xs select-none">...</span>;
                    }
                    if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                      return <span key="dots-end" className="text-zinc-600 px-1 text-xs select-none">...</span>;
                    }
                    return null;
                  }
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "h-8 min-w-[2rem] px-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer",
                      currentPage === pageNum
                        ? "bg-primary/20 border border-primary/40 text-primary shadow-[0_0_12px_rgba(255,92,51,0.15)] font-bold"
                        : "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-zinc-400 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
