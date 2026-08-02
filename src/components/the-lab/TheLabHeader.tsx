// Sticky top bar including selections, toggles, back/edit buttons.
import React from 'react';
import { Pencil, Eye, Check } from 'lucide-react';
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
}

const TheLabHeader = React.memo(function TheLabHeader({
  itinerary, clients, selectedClientId, setSelectedClientId,
  selectedStatus, setSelectedStatus,
  showTimestamps, setShowTimestamps,
  isEditing, setIsEditing,
  handleDownloadPdf, handleSaveItinerary, isSaving = false,
  isPreRendering = false,
  activeLabTab
}: TheLabHeaderProps) {
  const { options: itineraryStatuses } = useReferenceOptions('itinerary_status');
  const storeIsSaving = useLabStore((state) => state.isSaving);
  const effectiveIsSaving = storeIsSaving || isSaving;
  
  if (!itinerary || ['history'].includes(activeLabTab)) return null;

  return (
    <div className="bg-transparent py-3 sm:py-4 z-30 mb-0 w-full">
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Controls Group */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6">
          <div className="hidden sm:flex items-center gap-3">
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
          
          <div className="hidden sm:flex items-center gap-3">
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
          
          <div className="flex items-center gap-4 bg-black/20 rounded-xl p-1 border border-white/5">
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

          <div className="flex items-center gap-3 bg-black/20 rounded-xl p-1 border border-white/5 h-10 px-3 transition-all duration-300">
            <label htmlFor="edit-mode-toggle" className="text-[10px] font-bold uppercase text-zinc-500 select-none cursor-pointer">
              Edit Mode
            </label>
            <Switch
              id="edit-mode-toggle"
              checked={isEditing}
              onCheckedChange={setIsEditing}
              className="scale-75 data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-3">
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
        </div>
      </div>
    </div>
  );
});

export default TheLabHeader;


