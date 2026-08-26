// Sticky top bar including selections, toggles, back/edit buttons.
import React from 'react';
import { Eye, Undo2, Redo2, LayoutTemplate } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReferenceOptions } from '@/hooks/use-reference-options';
import { AutosaveIndicator } from './AutosaveIndicator';
import { useLabStore } from '@/store/the-lab/labStore';

type Client = any; // Fallback from useClients

interface TheLabHeaderProps {
  itinerary: any;
  clients: Client[];
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  showTimestamps: boolean;
  setShowTimestamps: (show: boolean) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  handleDownloadPdf: () => void;
  handleSaveItinerary: () => void;
  isSaving?: boolean;
  isPreRendering?: boolean;
  activeLabTab: string;
  canUndoPrevious?: boolean;
  onUndoPrevious?: () => void;
  canRedoNext?: boolean;
  onRedoNext?: () => void;
  currentTripId?: string | null;
}

const TheLabHeader = React.memo(function TheLabHeader({
  itinerary, clients, selectedClientId, setSelectedClientId,
  selectedStatus, setSelectedStatus,
  showTimestamps, setShowTimestamps,
  isEditing, setIsEditing,
  handleDownloadPdf, handleSaveItinerary, isSaving = false,
  isPreRendering = false,
  activeLabTab,
  canUndoPrevious = false,
  onUndoPrevious,
  canRedoNext = false,
  onRedoNext,
  currentTripId,
}: TheLabHeaderProps) {
  const { options: itineraryStatuses } = useReferenceOptions('itinerary_status');
  const storeIsSaving = useLabStore((state) => state.isSaving);
  const effectiveIsSaving = storeIsSaving || isSaving;
  const router = useRouter();
  
  if (!itinerary || ['history'].includes(activeLabTab)) return null;

  return (
    <div className="bg-transparent py-3 sm:py-4 z-30 mb-0 w-full">
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Controls Group */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6">
          <div className={cn("hidden sm:flex items-center gap-3 transition-all duration-500", isEditing && "blur-[1px] opacity-40 pointer-events-none")}>
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
          
          <div className={cn("hidden sm:flex items-center gap-3 transition-all duration-500", isEditing && "blur-[1px] opacity-40 pointer-events-none")}>
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
          
          <div className={cn("flex items-center gap-4 bg-black/20 rounded-xl p-1 border border-white/5 transition-all duration-500", isEditing && "blur-[1px] opacity-40 pointer-events-none")}>
            <div className="flex items-center space-x-2 px-2 py-1">
              <Switch
                id="show-timestamps-header"
                checked={showTimestamps}
                onCheckedChange={setShowTimestamps}
                className="scale-75"
              />
              <label htmlFor="show-timestamps-header" className="text-[10px] font-bold uppercase text-zinc-500 select-none cursor-pointer">
                Time
              </label>
            </div>
          </div>

          {/* Edit Mode Toggle — Never blurred */}
          <div className={cn(
            "flex items-center gap-3 bg-black/20 rounded-xl p-1 border h-10 px-3 transition-all duration-300 relative z-10",
            isEditing 
              ? "border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(255,92,51,0.15)] ring-1 ring-primary/30" 
              : "border-white/5 hover:border-white/10"
          )}>
            <label htmlFor="edit-mode-toggle" className={cn(
              "text-[10px] font-bold uppercase select-none cursor-pointer transition-colors",
              isEditing ? "text-primary font-extrabold" : "text-zinc-500"
            )}>
              Edit Mode
            </label>
            <Switch
              id="edit-mode-toggle"
              checked={isEditing}
              onCheckedChange={setIsEditing}
              className="scale-75 data-[state=checked]:bg-primary"
            />
          </div>

          {/* Undo / Redo — icon-only, always unblurred when edit mode is on */}
          {isEditing && onUndoPrevious && (
            <div className="flex items-center gap-1.5 relative z-10">
              <button
                onClick={onUndoPrevious}
                disabled={!canUndoPrevious}
                title="Undo last change"
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200",
                  canUndoPrevious
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400/60 cursor-pointer active:scale-95"
                    : "border-white/5 bg-black/20 text-zinc-700 cursor-not-allowed opacity-40"
                )}
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onRedoNext}
                disabled={!canRedoNext}
                title="Redo last change"
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200",
                  canRedoNext
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400/60 cursor-pointer active:scale-95"
                    : "border-white/5 bg-black/20 text-zinc-700 cursor-not-allowed opacity-40"
                )}
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Actions Group */}
        <div className={cn("flex items-center gap-3 transition-all duration-500", isEditing && "blur-[1px] opacity-40 pointer-events-none")}>
          <AutosaveIndicator className="inline-flex" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-white/5 border border-white/10 text-zinc-300 rounded-xl text-xs sm:text-sm font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2 h-11 sm:h-10"
          >
            <Eye className="w-4 h-4" />
            <span className="xs:inline">Preview</span>
          </Button>
          {currentTripId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/itinerary/${currentTripId}/editor`)}
              title="Open HTML editor for this itinerary"
              className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-xl text-xs sm:text-sm font-semibold hover:bg-amber-500/20 hover:border-amber-400/50 transition-all flex items-center justify-center gap-2 h-11 sm:h-10"
            >
              <LayoutTemplate className="w-4 h-4" />
              <span className="xs:inline">HTML Editor</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

export default TheLabHeader;


