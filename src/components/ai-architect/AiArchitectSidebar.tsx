// Collapsible desktop side navigation
import React from 'react';
import { ArrowLeft, Calendar as CalendarIcon, Plane, DollarSign, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { ActiveArchitectTab } from '@/types/ai-architect';

interface AiArchitectSidebarProps {
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
  activeArchitectTab: ActiveArchitectTab;
  setActiveArchitectTab: (tab: ActiveArchitectTab) => void;
  isEditing: boolean;
  setShowBackConfirm: (show: boolean) => void;
  setItinerary: (itinerary: null) => void;
  setCurrentStep: (step: number) => void;
}

const AiArchitectSidebar = React.memo(function AiArchitectSidebar({
  isSidebarExpanded, setIsSidebarExpanded,
  activeArchitectTab, setActiveArchitectTab,
  isEditing, setShowBackConfirm, setItinerary, setCurrentStep
}: AiArchitectSidebarProps) {
  return (
    <div className={cn(
      "hidden lg:flex flex-col shrink-0 sticky top-24 self-start h-[calc(100vh-120px)] transition-all duration-300 z-40",
      isSidebarExpanded ? "w-64" : "w-16"
    )}>
      <div className="flex flex-col items-center h-full py-4 px-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        
        {/* Back Button */}
        <button
          onClick={() => {
            if (isEditing) setShowBackConfirm(true);
            else {
              setItinerary(null);
              setCurrentStep(0);
            }
          }}
          className={cn(
            "group relative flex items-center transition-all duration-200 text-zinc-500 hover:text-white mb-2",
            isSidebarExpanded ? "w-full px-4 gap-3 h-10" : "justify-center w-10 h-10"
          )}
          title={isSidebarExpanded ? undefined : "Back to Form"}
        >
          <ArrowLeft className={cn(isSidebarExpanded ? "w-3.5 h-3.5" : "w-4 h-4")} />
          {isSidebarExpanded && <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Back</span>}
          
          {!isSidebarExpanded && (
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1a1a2e] border border-white/10 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl pointer-events-none">
              Back to Form
              <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-[#1a1a2e] border-l border-b border-white/10 rotate-45" />
            </div>
          )}
        </button>

        <div className={cn("w-8 h-px bg-white/5 my-2 mx-auto", isSidebarExpanded && "w-full px-4")} />

        {/* Top Navigation */}
        <div className="flex flex-col items-center gap-1 w-full">
          {[
            { id: 'itinerary' as const, icon: CalendarIcon, label: 'Timeline' },
            { id: 'flights-hotels' as const, icon: Plane, label: 'Logistics' },
            { id: 'pricing' as const, icon: DollarSign, label: 'Financials' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveArchitectTab(item.id)}
              className={cn(
                "relative group flex items-center rounded-xl transition-all duration-200",
                isSidebarExpanded ? "w-full px-4 gap-3 h-11" : "justify-center w-10 h-10",
                activeArchitectTab === item.id
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-gray-500 hover:text-white hover:bg-white/[0.06]'
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

        {/* Bottom Toggle & Settings */}
        <div className="flex flex-col items-center gap-1 w-full">
          <button
            onClick={() => setActiveArchitectTab('settings')}
            className={cn(
              "relative group flex items-center rounded-xl transition-all duration-200",
              isSidebarExpanded ? "w-full px-4 gap-3 h-11" : "justify-center w-10 h-10",
              activeArchitectTab === 'settings'
                ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-gray-500 hover:text-white hover:bg-white/[0.06]'
            )}
            title={isSidebarExpanded ? undefined : "Settings"}
          >
            <Settings className={cn(isSidebarExpanded ? "w-4 h-4" : "w-[18px] h-[18px]")} />
            {isSidebarExpanded && <span className="text-sm font-medium whitespace-nowrap">Settings</span>}
            {!isSidebarExpanded && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1a1a2e] border border-white/10 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl pointer-events-none">
                Settings
                <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-[#1a1a2e] border-l border-b border-white/10 rotate-45" />
              </div>
            )}
          </button>

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

export default AiArchitectSidebar;
