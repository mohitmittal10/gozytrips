// Mobile bottom/top navigation links and client/status selections.
import React from 'react';
import { Calendar as CalendarIcon, Plane, DollarSign, Settings, History, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ActiveLabTab } from '@/types/the-lab';
import { useReferenceOptions } from '@/hooks/use-reference-options';

type Client = any;

interface TheLabMobileTabsProps {
  activeLabTab: ActiveLabTab;
  setActiveLabTab: (tab: ActiveLabTab) => void;
  clients: Client[];
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  handleCreateNew: () => void;
}

const TheLabMobileTabs = React.memo(function TheLabMobileTabs({
  activeLabTab, setActiveLabTab,
  clients, selectedClientId, setSelectedClientId,
  selectedStatus, setSelectedStatus, handleCreateNew
}: TheLabMobileTabsProps) {
  const { options: itineraryStatuses } = useReferenceOptions('itinerary_status');

  return (
    <>
      <div className="lg:hidden flex items-center gap-1 p-1.5 mb-4 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl overflow-x-auto hide-scrollbar">
        {[
          { id: 'new' as const, icon: Plus, label: 'New' },
          { id: 'itinerary' as const, icon: CalendarIcon, label: 'Timeline' },
          { id: 'flights-hotels' as const, icon: Plane, label: 'Logistics' },
          { id: 'pricing' as const, icon: DollarSign, label: 'Financials' },
          { id: 'history' as const, icon: History, label: 'History' },
          { id: 'settings' as const, icon: Settings, label: 'Settings' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'new') handleCreateNew();
              else setActiveLabTab(item.id);
            }}
            className={cn(
              "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap flex-1 min-w-[70px] min-h-[44px]",
              activeLabTab === item.id
                ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-gray-500 hover:text-white hover:bg-white/[0.06]'
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      {!['history','settings'].includes(activeLabTab) && (
        <div className="sm:hidden flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 w-12 flex-shrink-0">Client</label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="border-none bg-white/5 text-zinc-300 rounded-lg text-xs font-medium focus:ring-zinc-700 h-9 flex-1">
                <SelectValue placeholder="No Client" />
              </SelectTrigger>
              <SelectContent className="bg-obsidian-dark border-white/5 text-zinc-300">
                <SelectItem value="none">No Client</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 w-12 flex-shrink-0">Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="border-none bg-white/5 text-zinc-300 rounded-lg text-xs font-medium focus:ring-zinc-700 h-9 flex-1">
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
        </div>
      )}
    </>
  );
});

export default TheLabMobileTabs;


