// Collapsible desktop side navigation
import React from 'react';
import { Calendar as CalendarIcon, Plane, DollarSign, ChevronLeft, ChevronRight, History, Plus, List } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { ActiveLabTab } from '@/types/the-lab';
import Logo from '../layout/logo';

interface TheLabSidebarProps {
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
  activeLabTab: ActiveLabTab;
  setActiveLabTab: (tab: ActiveLabTab) => void;
  handleCreateNew: () => void;
  onSubmit?: (values: any) => void;
  isGenerating?: boolean;
  isLoading?: boolean;
}

const TheLabSidebar = React.memo(function TheLabSidebar({
  activeLabTab, setActiveLabTab,
  isSidebarExpanded, setIsSidebarExpanded,
  handleCreateNew, isGenerating, isLoading
}: TheLabSidebarProps) {
  const isFormOpened = activeLabTab === 'new';

  return (
    <div className={cn(
      "hidden lg:flex flex-col shrink-0 sticky top-24 self-start transition-all duration-300 z-40",
      isSidebarExpanded ? "w-64" : "w-16"
    )}>
      <div className={cn(
        "flex flex-col items-center w-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 overflow-x-hidden",
        "h-[calc(100vh-110px)] max-h-[900px] py-4 px-2"
      )}>
        {/* Logo Section */}
        <div className={cn(
          "mb-6 transition-all duration-300 flex items-center",
          isSidebarExpanded ? "px-4 w-full" : "justify-center w-10"
        )}>
          <Logo 
            className={cn(isSidebarExpanded ? "gap-3" : "gap-0")} 
            isLoading={isGenerating || isLoading} 
            hideText={!isSidebarExpanded}
          />
        </div>

        {/* Plus Button */}
        <button
          onClick={handleCreateNew}
          className={cn(
            "group relative flex items-center transition-all duration-200 rounded-xl mb-4",
            isSidebarExpanded ? "w-full px-4 gap-3 h-12" : "justify-center w-10 h-10",
            activeLabTab === 'new'
              ? 'bg-primary/20 text-primary shadow-lg shadow-primary/15'
              : 'text-primary hover:text-primary/80 hover:bg-primary/10'
          )}
          title={isSidebarExpanded ? undefined : "New Itinerary"}
        >
          <div className={cn(
            "flex items-center justify-center rounded-lg transition-colors",
            activeLabTab === 'new' ? "bg-primary/20" : "bg-primary/10",
            isSidebarExpanded ? "p-1.5" : "w-8 h-8"
          )}>
            <Plus className={cn(isSidebarExpanded ? "w-4 h-4" : "w-5 h-5")} />
          </div>
          {isSidebarExpanded && <span className="text-sm font-bold tracking-tight">New Itinerary</span>}
          
          {!isSidebarExpanded && (
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1a1a2e] border border-white/10 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl pointer-events-none">
              New Itinerary
              <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-[#1a1a2e] border-l border-b border-white/10 rotate-45" />
            </div>
          )}
        </button>

        <div className={cn("w-8 h-px bg-white/5 my-2 mx-auto", isSidebarExpanded && "w-full px-4")} />

        {/* Top Navigation - Scrollable Area */}
        <div className="flex flex-col items-center gap-1 w-full overflow-y-auto overflow-x-hidden no-scrollbar py-1">
          {[
            { id: 'itinerary' as const, icon: CalendarIcon, label: 'Timeline' },
            { id: 'flights-hotels' as const, icon: Plane, label: 'Logistics' },
            { id: 'inclusions' as const, icon: List, label: 'Inclusions' },
            { id: 'pricing' as const, icon: DollarSign, label: 'Financials' },
            { id: 'history' as const, icon: History, label: 'History' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveLabTab(item.id)}
              className={cn(
                "relative group flex items-center rounded-xl transition-all duration-200",
                isSidebarExpanded ? "w-full px-4 gap-3 h-11" : "justify-center w-10 h-10",
                activeLabTab === item.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-500 hover:text-primary hover:bg-white/[0.06]'
              )}
              title={isSidebarExpanded ? undefined : item.label}
            >
              <item.icon className={cn(isSidebarExpanded ? "w-4 h-4" : "w-[18px] h-[18px]")} />
              {isSidebarExpanded && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
              {!isSidebarExpanded && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1a1a2e] border border-white/10 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl pointer-events-none">
                  {item.label}
                  <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-[#1a1a2e] border-l border-b border-white/10 rotate-45" />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="flex-grow" />

        {/* Bottom Toggle */}
        <div className="flex flex-col items-center gap-1 w-full mt-auto pt-4 border-t border-white/5">
          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className={cn(
              "relative group flex items-center transition-all duration-200 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-xl mt-1",
              isSidebarExpanded ? "w-full px-4 gap-3 h-11" : "justify-center w-10 h-10"
            )}
            title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarExpanded ? (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            ) : (
              <>
                <ChevronRight className="w-[18px] h-[18px]" />
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1a1a2e] border border-white/10 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl pointer-events-none">
                  Expand Sidebar
                  <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-[#1a1a2e] border-l border-b border-white/10 rotate-45" />
                </div>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
});

export default TheLabSidebar;


