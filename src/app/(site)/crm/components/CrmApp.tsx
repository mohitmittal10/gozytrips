"use client";

import React from "react";
import { 
    Users, Calendar, CheckCircle2, Clock, Search, Plus, 
    ListFilter, Compass, FileText, Settings, LayoutDashboard, TrendingUp, 
    Archive, Sliders, LayoutGrid, List, DollarSign, Mail, RefreshCw, Info, Filter, Bookmark, Save, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useReferenceOptions } from "@/hooks/use-reference-options";

import { useCrmContext } from "../context/CrmContext";
import { CrmTabRouter } from "./CrmTabRouter";
import { CrmModals } from "./CrmModals";
import dynamic from "next/dynamic";
const CrmSettings = dynamic(() => import("@/components/crm-settings").then(mod => mod.CrmSettings), { ssr: false });

export function CrmApp() {
    const context = useCrmContext();
    const { activeTab, setActiveTab, isSidebarExpanded, setIsSidebarExpanded, filters, data: dataHook } = context;
    const { options: itineraryStatuses } = useReferenceOptions('itinerary_status');
    
    const saveCurrentPreset = async () => {
        if (!filters.presetName.trim()) return;
        const preset = {
            name: filters.presetName, searchQuery: filters.searchQuery, clientsActivityFilter: filters.clientsActivityFilter, clientsTagFilter: filters.clientsTagFilter,
            tripsPipelineFilter: filters.tripsPipelineFilter, dateFrom: filters.dateFrom, dateTo: filters.dateTo, budgetMin: filters.budgetMin, budgetMax: filters.budgetMax
        };
        const updated = [...filters.savedPresets, preset];
        filters.setSavedPresets(updated);
        filters.setPresetName('');
        filters.setShowPresetSave(false);
    };

    const applyPreset = (p: any) => {
        filters.setSearchQuery(p.searchQuery);
        filters.setClientsActivityFilter(p.clientsActivityFilter);
        filters.setClientsTagFilter(p.clientsTagFilter);
        filters.setTripsPipelineFilter(p.tripsPipelineFilter);
        filters.setDateFrom(p.dateFrom);
        filters.setDateTo(p.dateTo);
        filters.setBudgetMin(p.budgetMin);
        filters.setBudgetMax(p.budgetMax);
    };

    return (
        <div className="crm-page">
            <div className="crm-container">
                <div className="crm-layout">
                    {/* Glassmorphism Icon Sidebar */}
                    <div className={cn(
                        "hidden lg:flex flex-col shrink-0 sticky top-16 self-start transition-all duration-300 z-40",
                        isSidebarExpanded ? "w-64" : "w-16"
                    )}>
                        <div className={cn(
                            "flex flex-col w-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300",
                            "h-[calc(100vh-110px)] max-h-[900px] py-4 px-2"
                        )}>
                            <div className="space-y-1.5 pb-4 px-1 border-b border-white/[0.08]">
                                <Button variant="ghost" size="icon" onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="h-9 w-9 text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                                    <Sliders className="w-4 h-4" />
                                </Button>
                            </div>
                            <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto crm-nav-scroll px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {[
                                    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                                    { id: 'clients', icon: Users, label: 'Clients' },
                                    { id: 'trips', icon: TrendingUp, label: 'Trips' },
                                    { id: 'bookings', icon: Bookmark, label: 'Bookings' },
                                    { id: 'timeline', icon: Calendar, label: 'Timeline' },
                                    { id: 'finance', icon: DollarSign, label: 'Finances' },
                                    { id: 'enquiry', icon: Mail, label: 'Enquiry' },
                                    { id: 'archive', icon: Archive, label: 'Archive' }
                                ].map((tab) => (
                                    <Button key={tab.id} onClick={() => setActiveTab(tab.id)} variant={activeTab === tab.id ? 'secondary' : 'ghost'} className={cn("w-full justify-start h-10 px-3 hover:bg-white/10 transition-all group", activeTab === tab.id ? "bg-white/10 text-white" : "text-gray-400 hover:text-white", isSidebarExpanded ? "" : "w-10 px-0 justify-center")}>
                                        <tab.icon className={cn("w-4 h-4 shrink-0", activeTab === tab.id ? "text-purple-400" : "text-gray-500 group-hover:text-purple-400")} />
                                        {isSidebarExpanded && <span className="ml-3 text-sm font-medium">{tab.label}</span>}
                                    </Button>
                                ))}
                            </nav>
                            <div className="pt-4 border-t border-white/[0.08] px-1 space-y-1.5 mt-auto">
                                <Button onClick={() => setActiveTab('settings')} variant={activeTab === 'settings' ? 'secondary' : 'ghost'} className={cn("w-full justify-start h-10 px-3 hover:bg-white/10 transition-all group", activeTab === 'settings' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white", isSidebarExpanded ? "" : "w-10 px-0 justify-center")}>
                                    <Settings className={cn("w-4 h-4 shrink-0", activeTab === 'settings' ? "text-purple-400" : "text-gray-500 group-hover:text-purple-400")} />
                                    {isSidebarExpanded && <span className="ml-3 text-sm font-medium">Settings</span>}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    <div className="lg:hidden block sticky top-14 z-30 mb-2 -mx-2 bg-[#0A0A0B]/80 backdrop-blur-md">
                        <div className="premium-nav-mask px-4 relative overflow-hidden">
                            <div className="flex overflow-x-auto crm-nav-scroll py-4 gap-2 no-scrollbar">
                                {[
                                    { id: 'dashboard', icon: LayoutDashboard, label: 'Dash' },
                                    { id: 'clients', icon: Users, label: 'Clients' },
                                    { id: 'trips', icon: TrendingUp, label: 'Trips' },
                                    { id: 'bookings', icon: Bookmark, label: 'Book' },
                                    { id: 'timeline', icon: Calendar, label: 'Timeline' },
                                    { id: 'finance', icon: DollarSign, label: 'Fin' },
                                    { id: 'enquiry', icon: Mail, label: 'Enquiry' },
                                    { id: 'archive', icon: Archive, label: 'Archive' },
                                    { id: 'settings', icon: Settings, label: 'Set' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all shrink-0 border",
                                            activeTab === tab.id
                                                ? "bg-purple-500 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                                                : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-gray-200"
                                        )}
                                    >
                                        <tab.icon className="w-3.5 h-3.5" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="crm-main-content px-4 pt-0 pb-8 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                                    {activeTab === 'dashboard' && <LayoutDashboard className="w-8 h-8 text-purple-400" />}
                                    {activeTab === 'clients' && <Users className="w-8 h-8 text-purple-400" />}
                                    {activeTab === 'trips' && <Compass className="w-8 h-8 text-purple-400" />}
                                    {activeTab === 'bookings' && <Bookmark className="w-8 h-8 text-purple-400" />}
                                    {activeTab === 'archive' && <Archive className="w-8 h-8 text-purple-400" />}
                                    {activeTab === 'finance' && <DollarSign className="w-8 h-8 text-purple-400" />}
                                    {activeTab === 'enquiry' && <Info className="w-8 h-8 text-purple-400" />}
                                    {activeTab === 'timeline' && <Calendar className="w-8 h-8 text-purple-400" />}
                                    {activeTab === 'edit-itinerary' && <FileText className="w-8 h-8 text-purple-400" />}
                                    {activeTab === 'settings' && <Settings className="w-8 h-8 text-purple-400" />}
                                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}
                                </h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    {activeTab === 'dashboard' ? 'Overview of your workspace performance' :
                                     activeTab === 'clients' ? 'Manage your client base and contact details' :
                                     activeTab === 'trips' ? 'Monitor your active trip pipeline' :
                                     'Manage your travel operations efficiency'}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                {activeTab === 'trips' && (
                                    <Button variant="outline" size="sm" onClick={() => setActiveTab('edit-itinerary')} className="border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 h-10 px-4">
                                        <FileText className="w-4 h-4 mr-2" /> Edit Itinerary
                                    </Button>
                                )}
                                <Button 
                                    onClick={() => {
                                        if (activeTab === 'bookings') context.setIsBookingDialogOpen(true);
                                        else context.setIsAddClientOpen(true);
                                    }} 
                                    className="px-6 py-2.5 aurora-gradient text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2 h-10 border-none"
                                >
                                    <Plus className="w-4 h-4" /> 
                                    {activeTab === 'bookings' ? 'New Booking' : 'Add Client'}
                                </Button>
                            </div>
                        </div>

                        {/* TAB VIEWS */}
                        <div className="min-h-[60vh]">
                            {activeTab === 'settings' ? <CrmSettings /> : (
                                <div className="space-y-6">
                                    {/* Responsive Modern Filter Block (only for clients/trips/archive) */}
                                    {(activeTab === 'clients' || activeTab === 'trips' || activeTab === 'archive') && (
                                    <div className="bg-[#13131A]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 lg:p-5 shadow-lg relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                                        <div className="flex flex-col lg:flex-row gap-4 relative z-10 w-full mb-4">
                                            <div className="relative flex-1 w-full min-w-0">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                                                <Input
                                                    placeholder={activeTab === 'clients' ? "Search clients by name, email, phone, tags..." : "Search trips, destinations, notes..."}
                                                    className="w-full pl-11 h-12 bg-black/40 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-purple-500/50 rounded-xl shadow-inner text-sm transition-all hover:bg-black/60 focus:bg-black/80"
                                                    value={filters.searchQuery}
                                                    onChange={(e) => filters.setSearchQuery(e.target.value)}
                                                />
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 shrink-0">
                                                {activeTab === 'clients' && (
                                                    <Select value={filters.clientsActivityFilter} onValueChange={filters.setClientsActivityFilter}>
                                                        <SelectTrigger className="w-[150px] lg:w-[160px] bg-white/5 border-white/10 text-white h-12 rounded-xl">
                                                            <Filter className="w-4 h-4 mr-2 text-gray-400" />
                                                            <SelectValue placeholder="All Activity" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-[#1a1a2e] border-white/10">
                                                            <SelectItem value="all">All Activity</SelectItem>
                                                            <SelectItem value="has_trips">Has Trips</SelectItem>
                                                            <SelectItem value="no_trips">No Trips</SelectItem>
                                                            <SelectItem value="new_this_month">New This Month</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}

                                                {activeTab === 'trips' && (
                                                    <>
                                                        <Select value={filters.tripsPipelineFilter} onValueChange={filters.setTripsPipelineFilter}>
                                                            <SelectTrigger className="w-[150px] lg:w-[170px] bg-white/5 border-white/10 text-white h-12 rounded-xl">
                                                                <ListFilter className="w-4 h-4 mr-2 text-gray-400" />
                                                                <SelectValue placeholder="Pipeline Stage" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-[#1a1a2e] border-white/10">
                                                                <SelectItem value="all">All Stages</SelectItem>
                                                                {itineraryStatuses.length > 0 ? (
                                                                    itineraryStatuses.filter(opt => ['draft', 'proposed', 'sent', 'booked'].includes(opt.value)).map(opt => (
                                                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                                    ))
                                                                ) : (
                                                                    <>
                                                                        <SelectItem value="draft">Draft</SelectItem>
                                                                        <SelectItem value="proposed">Proposed</SelectItem>
                                                                        <SelectItem value="sent">Sent</SelectItem>
                                                                        <SelectItem value="booked">Booked</SelectItem>
                                                                    </>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        
                                                        <div className="flex border border-white/10 rounded-xl overflow-hidden h-12 bg-white/5">
                                                            <button
                                                                onClick={() => filters.setTripsViewMode('table')}
                                                                className={cn("px-4 transition-colors flex items-center justify-center", filters.tripsViewMode === 'table' ? "bg-purple-500/20 text-purple-400 font-medium" : "text-gray-500 hover:text-white hover:bg-white/5")}
                                                                title="List View"
                                                            >
                                                                <List className="w-[18px] h-[18px]" />
                                                            </button>
                                                            <div className="w-px h-full bg-white/10" />
                                                            <button
                                                                onClick={() => filters.setTripsViewMode('kanban')}
                                                                className={cn("px-4 transition-colors flex items-center justify-center", filters.tripsViewMode === 'kanban' ? "bg-purple-500/20 text-purple-400 font-medium" : "text-gray-500 hover:text-white hover:bg-white/5")}
                                                                title="Kanban Board"
                                                            >
                                                                <LayoutGrid className="w-[18px] h-[18px]" />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}

                                                <Button
                                                    variant="outline"
                                                    onClick={dataHook.actions.handleRefreshClients}
                                                    disabled={dataHook.loading.isRefreshing || dataHook.loading.clientsLoading}
                                                    className="border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white h-12 px-4 rounded-xl shrink-0"
                                                >
                                                    <RefreshCw className={cn("w-4 h-4", (dataHook.loading.isRefreshing || dataHook.loading.clientsLoading) ? "animate-spin" : "mr-2")} />
                                                    <span className="hidden sm:inline">Refresh</span>
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />

                                        <div className="flex flex-col xl:flex-row justify-between gap-4 relative z-10 w-full pb-1">
                                            <div className="flex-1 overflow-hidden min-w-0 flex items-center">
                                                {activeTab === 'clients' && dataHook.data.uniqueTags.length > 0 && (
                                                    <div className="flex gap-2 w-full overflow-x-auto no-scrollbar items-center px-4 -mx-4 py-1" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)', maskImage: 'linear-gradient(to right, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)' }}>
                                                        <span className="text-xs text-gray-500 uppercase tracking-wider mr-2 font-medium shrink-0 flex items-center"><Filter className="w-3 h-3 mr-1" /> Tags</span>
                                                        <button onClick={(e) => { filters.setClientsTagFilter('all'); e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }} className={cn("px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap shrink-0", filters.clientsTagFilter === 'all' ? "bg-purple-500 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]" : "bg-white/5 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10")}>All</button>
                                                        {dataHook.data.uniqueTags.map((tag: string) => (
                                                            <button key={tag} onClick={(e) => { filters.setClientsTagFilter(tag); e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }} className={cn("px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap shrink-0", filters.clientsTagFilter === tag ? "bg-purple-500 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]" : "bg-white/5 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10")}>{tag}</button>
                                                        ))}
                                                    </div>
                                                )}
                                                {(activeTab === 'trips' || activeTab === 'archive') && (
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium flex items-center"><Sliders className="w-3 h-3 mr-1" /> Advanced Filters</span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 xl:gap-3 shrink-0">
                                                <div className="flex items-center bg-black/20 border border-white/10 rounded-lg h-9 px-1">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-500 ml-2 mr-1" />
                                                    <input type="date" value={filters.dateFrom} onChange={e => filters.setDateFrom(e.target.value)} className="h-full px-2 text-[11px] sm:text-xs bg-transparent text-gray-300 focus:outline-none placeholder-gray-600 [&::-webkit-calendar-picker-indicator]:invert-[0.6] w-[110px]" />
                                                    <span className="text-gray-600 text-[10px] mx-1">to</span>
                                                    <input type="date" value={filters.dateTo} onChange={e => filters.setDateTo(e.target.value)} className="h-full px-2 text-[11px] sm:text-xs bg-transparent text-gray-300 focus:outline-none placeholder-gray-600 [&::-webkit-calendar-picker-indicator]:invert-[0.6] w-[110px]" />
                                                </div>

                                                <div className="flex items-center bg-black/20 border border-white/10 rounded-lg h-9 px-1">
                                                    <DollarSign className="w-3.5 h-3.5 text-gray-500 ml-2 mr-1" />
                                                    <input type="number" placeholder="Min Budget" value={filters.budgetMin} onChange={e => filters.setBudgetMin(e.target.value)} className="w-[75px] h-full px-1 text-[11px] sm:text-xs bg-transparent text-gray-300 placeholder:text-gray-600 focus:outline-none text-right" />
                                                    <span className="text-gray-600 text-[12px] mx-1.5">-</span>
                                                    <input type="number" placeholder="Max" value={filters.budgetMax} onChange={e => filters.setBudgetMax(e.target.value)} className="w-[60px] h-full px-1 text-[11px] sm:text-xs bg-transparent text-gray-300 placeholder:text-gray-600 focus:outline-none" />
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-9 border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white px-3 rounded-lg">
                                                                <Save className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                                                                Presets {filters.savedPresets.length > 0 && <span className="ml-1 bg-purple-500/20 text-purple-400 text-[10px] px-1.5 rounded-full">{filters.savedPresets.length}</span>}
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-white/10 text-white w-64 p-1 rounded-xl shadow-2xl overflow-hidden">
                                                            <DropdownMenuLabel className="text-xs font-semibold text-gray-400 px-2 py-1.5 uppercase tracking-wider">Saved Filters</DropdownMenuLabel>
                                                            <div className="h-px bg-white/10 my-1 mx-2" />
                                                            {filters.savedPresets.length === 0 ? (
                                                                <div className="px-3 py-4 text-center text-xs text-gray-500">No saved presets</div>
                                                            ) : (
                                                                <div className="max-h-48 overflow-y-auto no-scrollbar space-y-0.5 px-1">
                                                                    {filters.savedPresets.map((p, idx) => (
                                                                        <div key={idx} className="flex items-center justify-between px-2 py-2 hover:bg-white/5 rounded-lg cursor-pointer group transition-colors">
                                                                            <button onClick={() => applyPreset(p)} className="text-xs text-gray-200 flex-1 text-left truncate pr-2 font-medium">{p.name}</button>
                                                                            <button onClick={(e) => { e.stopPropagation(); filters.setSavedPresets(filters.savedPresets.filter((_, i) => i !== idx)); }} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity p-1 bg-transparent hover:bg-red-400/10 rounded">
                                                                                <X className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div className="h-px bg-white/10 my-1 mx-2" />
                                                            {filters.showPresetSave ? (
                                                                <div className="p-2 pt-1 flex flex-col gap-2">
                                                                    <div className="flex gap-1">
                                                                        <input type="text" placeholder="Preset name..." value={filters.presetName} onChange={e => filters.setPresetName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveCurrentPreset()} className="flex-1 h-8 px-2.5 text-xs bg-black/40 border border-white/10 rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50" autoFocus />
                                                                        <Button size="sm" className="h-8 px-3 text-xs bg-purple-500 hover:bg-purple-600 rounded-md" onClick={saveCurrentPreset}>Save</Button>
                                                                    </div>
                                                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-gray-500 hover:text-gray-300" onClick={() => filters.setShowPresetSave(false)}>Cancel</Button>
                                                                </div>
                                                            ) : (
                                                                <div className="p-1">
                                                                    <button onClick={() => filters.setShowPresetSave(true)} className="w-full text-left px-2 py-2 text-xs text-purple-400 hover:bg-white/5 rounded-lg font-medium flex items-center transition-colors">
                                                                        <Plus className="w-3.5 h-3.5 mr-1" /> Save current filters
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>

                                                    {filters.hasActiveFilters && (
                                                        <Button variant="ghost" size="sm" className="h-9 px-3 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors" onClick={filters.clearAllFilters}>
                                                            <X className="w-3.5 h-3.5 mr-1" /> Clear
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    )}

                                    <CrmTabRouter />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <CrmModals />
        </div>
    );
}
