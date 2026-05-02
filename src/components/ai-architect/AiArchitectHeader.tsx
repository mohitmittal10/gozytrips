// Sticky top bar including selections, toggles, back/edit buttons.
import React from 'react';
import { ArrowLeft, Pencil, Plus, Eye, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReferenceOptions } from '@/hooks/use-reference-options';

type Client = any; // Fallback from useClients

interface AiArchitectHeaderProps {
  itinerary: any;
  clients: Client[];
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  showTimestamps: boolean;
  setShowTimestamps: (show: boolean) => void;
  showPrices: boolean;
  setShowPrices: (show: boolean) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  handleCreateNew: () => void;
  handleDownloadPdf: () => void;
  handleSaveItinerary: () => void;
  isSaving: boolean;
  setShowBackConfirm: (show: boolean) => void;
  setItinerary: (itinerary: null) => void;
  activeArchitectTab: string;
}

const AiArchitectHeader = React.memo(function AiArchitectHeader({
  itinerary, clients, selectedClientId, setSelectedClientId,
  selectedStatus, setSelectedStatus, showTimestamps, setShowTimestamps,
  showPrices, setShowPrices, isEditing, setIsEditing,
  handleCreateNew, handleDownloadPdf, handleSaveItinerary, isSaving, setShowBackConfirm, setItinerary,
  activeArchitectTab
}: AiArchitectHeaderProps) {
  const { options: itineraryStatuses } = useReferenceOptions('itinerary_status');
  
  if (!itinerary || ['history','settings'].includes(activeArchitectTab)) return null;

  return (
    <div className="bg-transparent py-2 sm:py-3 z-30 mb-0 w-full">
      <div className="w-full flex flex-wrap justify-between items-center gap-2 sm:gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 md:space-x-6">
          <button
            onClick={() => {
              if (itinerary) {
                setShowBackConfirm(true);
              } else {
                setItinerary(null);
                setIsEditing(false);
              }
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-[10px] sm:text-xs font-bold uppercase tracking-widest min-h-[44px] sm:min-h-0"
            title="Return to form"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Client</label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="border-none bg-white/5 text-zinc-300 rounded-lg text-xs sm:text-sm font-medium focus:ring-zinc-700 h-9 min-w-[140px] sm:min-w-[180px]">
                <SelectValue placeholder="No Client Assigned" />
              </SelectTrigger>
              <SelectContent className="bg-obsidian-dark border-white/5 text-zinc-300">
                <SelectItem value="none">No Client Assigned</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="border-none bg-white/5 text-zinc-300 rounded-lg text-xs sm:text-sm font-medium focus:ring-zinc-700 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-obsidian-dark border-white/5 text-zinc-300">
                {itineraryStatuses.length > 0 ? (
                  itineraryStatuses.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-1.5 sm:space-x-2 px-1.5 sm:px-2 py-1 rounded-md border border-white/5 bg-black/20">
            <Switch
              id="show-timestamps-main"
              checked={showTimestamps}
              onCheckedChange={setShowTimestamps}
              className="scale-75 origin-right"
            />
            <label htmlFor="show-timestamps-main" className="text-[9px] sm:text-[10px] font-bold uppercase text-zinc-600 select-none whitespace-nowrap cursor-pointer">
              Time
            </label>
          </div>
          
          <div className="flex items-center space-x-1.5 sm:space-x-2 px-1.5 sm:px-2 py-1 rounded-md border border-white/5 bg-black/20">
            <Switch
              id="show-prices-main"
              checked={showPrices}
              onCheckedChange={setShowPrices}
              className="scale-75 origin-right"
            />
            <label htmlFor="show-prices-main" className="text-[9px] sm:text-[10px] font-bold uppercase text-zinc-600 select-none whitespace-nowrap cursor-pointer">
              Price
            </label>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "p-2 rounded-lg transition-all duration-300 flex items-center justify-center",
              isEditing
                ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(255,92,51,0.2)]"
                : "bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10 hover:text-zinc-300"
            )}
            title={isEditing ? "Editing Mode Active" : "Edit Itinerary"}
          >
            {isEditing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
                <path d="M9 11c0 2-1 3-3 4-1.5.75-2 2-2 3s.5 2.25 2 3c1 0 1.5-.5 2-1s1-1.5 1-2" stroke="currentColor" fill="currentColor" fillOpacity="0.2" className="animate-bounce" />
                <circle cx="6" cy="18" r="1.5" fill="currentColor" />
              </svg>
            ) : (
              <Pencil className="w-[18px] h-[18px]" />
            )}
          </button>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateNew}
            className="px-3 sm:px-5 py-2 sm:py-2.5 bg-white/5 border border-white/10 text-zinc-300 rounded-lg text-xs sm:text-sm font-semibold hover:bg-white/10 transition-all flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 min-h-[44px] sm:min-h-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Create New</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            className="px-3 sm:px-5 py-2 sm:py-2.5 bg-white/5 border border-white/10 text-zinc-300 rounded-lg text-xs sm:text-sm font-semibold hover:bg-white/10 transition-all flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 min-h-[44px] sm:min-h-0"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden xs:inline">Preview</span>
          </Button>
          <Button
            size="sm"
            onClick={handleSaveItinerary}
            disabled={isSaving}
            className="px-3 sm:px-6 py-2 sm:py-2.5 aurora-gradient text-white rounded-lg text-xs sm:text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 border-none min-h-[44px] sm:min-h-0"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
});

export default AiArchitectHeader;
