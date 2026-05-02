import React from "react";
import { 
    Search, RefreshCw, ListFilter, Download, Columns3, 
    ArrowRight, Clock, Compass, ChevronLeft, ChevronRight, 
    Save, X, Users, List, LayoutGrid 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useReferenceOptions } from "@/hooks/use-reference-options";

interface ClientsViewProps {
    // Data
    paginatedClients: any[];
    sortedClients: any[];
    clientsLoading: boolean;
    isComputing: boolean;
    
    // Search & Filters
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    clientsTagFilter: string;
    setClientsTagFilter: (val: string) => void;
    clientsActivityFilter: string;
    setClientsActivityFilter: (val: string) => void;
    uniqueTags: string[];
    
    // Advanced Filters
    dateFrom: string;
    setDateFrom: (val: string) => void;
    dateTo: string;
    setDateTo: (val: string) => void;
    budgetMin: string;
    setBudgetMin: (val: string) => void;
    budgetMax: string;
    setBudgetMax: (val: string) => void;
    hasActiveFilters: boolean;
    clearAllFilters: () => void;
    
    // Presets
    savedPresets: any[];
    showPresetSave: boolean;
    setShowPresetSave: (val: boolean) => void;
    presetName: string;
    setPresetName: (val: string) => void;
    saveCurrentPreset: () => void;
    applyPreset: (preset: any) => void;
    deletePreset: (idx: number) => void;
    
    // Selection
    selectedIds: Set<string>;
    toggleSelectAll: () => void;
    toggleSelectOne: (id: string) => void;
    handleBulkStatusChange: (status: string) => void;
    setSelectedIds: (ids: Set<string>) => void;
    
    // Sorting
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
    handleSort: (key: string) => void;
    
    // Pagination
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    totalPages: number;
    
    // Actions
    handleRefreshClients: () => void;
    isRefreshing: boolean;
    handleExportCSV: () => void;
    setSelectedClient: (client: any) => void;
    
    // Columns
    visibleColumns: { destination: boolean; lastUpdated: boolean };
    toggleColumn: (col: 'destination' | 'lastUpdated') => void;
    
    // Utils
    getAvatarColor: (name: string) => string;
    clients?: any[];
    totalCount?: number;
    [key: string]: any;
}

export const ClientsView = (props: ClientsViewProps) => {
    const { options: itineraryStatuses } = useReferenceOptions('itinerary_status');
    const {
        activeTab = 'clients',
        paginatedClients = props.clients || [],
        sortedClients = [],
        clientsLoading = false,
        isComputing = false,
        searchQuery = '',
        setSearchQuery = () => {},
        clientsTagFilter = 'all',
        setClientsTagFilter = () => {},
        clientsActivityFilter = 'all',
        setClientsActivityFilter = () => {},
        uniqueTags = [],
        dateFrom = '',
        setDateFrom = () => {},
        dateTo = '',
        setDateTo = () => {},
        budgetMin = '',
        setBudgetMin = () => {},
        budgetMax = '',
        setBudgetMax = () => {},
        hasActiveFilters = false,
        clearAllFilters = () => {},
        savedPresets = [],
        showPresetSave = false,
        setShowPresetSave = () => {},
        presetName = '',
        setPresetName = () => {},
        saveCurrentPreset = () => {},
        applyPreset = () => {},
        deletePreset = () => {},
        selectedIds = new Set<string>(),
        toggleSelectAll = () => {},
        toggleSelectOne = () => {},
        handleBulkStatusChange = () => {},
        setSelectedIds = () => {},
        sortConfig = null,
        handleSort = () => {},
        currentPage = 1,
        setCurrentPage = () => {},
        totalPages = 1,
        handleRefreshClients = () => {},
        isRefreshing = false,
        handleExportCSV = () => {},
        setSelectedClient = () => {},
        visibleColumns = { destination: true, lastUpdated: true },
        toggleColumn = () => {},
        getAvatarColor = () => 'bg-purple-500/10 text-purple-400'
    } = props;

    const SortIcon = ({ col }: { col: string }) => {
        if (sortConfig?.key !== col) return null;
        return <span className="ml-1 text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    };

    return (
        <div className="mt-4 space-y-4">
            {/* Filter Bar (Moved to page.tsx for centralized state) */}

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <span className="text-sm text-purple-300 font-medium">{selectedIds.size} selected</span>
                    <div className="h-4 w-px bg-purple-500/30" />
                    <Select onValueChange={(val) => handleBulkStatusChange(val)}>
                        <SelectTrigger className="h-8 w-[140px] bg-white/5 border-white/10 text-white text-xs">
                            <SelectValue placeholder="Set Status..." />
                        </SelectTrigger>
                        <SelectContent className="bg-obsidian-dark border-white/10 text-white">
                            {itineraryStatuses.length > 0 ? (
                                itineraryStatuses.map(opt => (
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
                    <Button variant="outline" size="sm" className="h-8 border-white/10 bg-transparent text-gray-300 hover:bg-white/10 text-xs" onClick={handleExportCSV}>
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-gray-400 hover:text-white text-xs ml-auto" onClick={() => setSelectedIds(new Set())}>
                        Clear
                    </Button>
                </div>
            )}

            {/* Table Toolbar */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{sortedClients.length} client{sortedClients.length !== 1 ? 's' : ''}</p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 border-white/10 bg-transparent text-gray-300 hover:bg-white/10 text-xs" onClick={handleExportCSV}>
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 border-white/10 bg-transparent text-gray-300 hover:bg-white/10 text-xs">
                                <Columns3 className="w-3.5 h-3.5 mr-1.5" /> Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-white/10 text-white">
                            <DropdownMenuLabel className="text-xs text-gray-400">Toggle Columns</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuCheckboxItem checked={visibleColumns.destination} onCheckedChange={() => toggleColumn('destination')} className="text-xs">Destination</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleColumns.lastUpdated} onCheckedChange={() => toggleColumn('lastUpdated')} className="text-xs">Last Updated</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="crm-table-wrapper">
                    <table className="w-full text-left border-collapse min-w-[520px]">
                        <thead>
                            <tr className="border-b border-white/10 text-sm text-gray-400">
                                <th className="p-4 w-10">
                                    <Checkbox
                                        checked={paginatedClients.length > 0 && selectedIds.size === paginatedClients.length}
                                        onCheckedChange={toggleSelectAll}
                                        className="border-white/20 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                                    />
                                </th>
                                <th className="p-4 font-medium cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('name')}>
                                    <span className="inline-flex items-center">Client Info <SortIcon col="name" /></span>
                                </th>
                                {visibleColumns.destination && (
                                    <th className="p-4 font-medium">Destination</th>
                                )}
                                {visibleColumns.lastUpdated && (
                                    <th className="p-4 font-medium cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('date')}>
                                        <span className="inline-flex items-center">Last Updated <SortIcon col="date" /></span>
                                    </th>
                                )}
                                <th className="p-4 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {clientsLoading || isComputing ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        <div className="animate-pulse flex flex-col items-center gap-2">
                                            <div className="h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                            Loading client data...
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedClients.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500 bg-white/5">
                                        <div className="flex flex-col items-center justify-center py-6">
                                            <Users className="w-12 h-12 text-gray-600 mb-3" />
                                            <p>No clients found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedClients.map((client) => (
                                    <tr key={client.id} className={cn("hover:bg-white/5 transition-colors group", selectedIds.has(client.id) && "bg-purple-500/5")}>
                                        <td className="p-4 w-10">
                                            <Checkbox
                                                checked={selectedIds.has(client.id)}
                                                onCheckedChange={() => toggleSelectOne(client.id)}
                                                className="border-white/20 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("inline-flex w-8 h-8 rounded-full items-center justify-center text-xs font-bold text-white bg-gradient-to-br shrink-0", getAvatarColor(client.name))}>
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{client.name}</p>
                                                    <p className="text-sm text-gray-500">{client.email || 'No email provided'}</p>
                                                    {client.tags && client.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {client.tags.map((tag: string, idx: number) => (
                                                                <Badge key={idx} variant="secondary" className="bg-purple-500/10 text-purple-400 border border-purple-500/20 font-normal px-1.5 py-0 text-[10px] leading-4">
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        {visibleColumns.destination && (
                                            <td className="p-4 text-gray-300">
                                                <div className="flex flex-col gap-1.5 py-1">
                                                    {client.bookedDestinations && client.bookedDestinations.length > 0 ? (
                                                        client.bookedDestinations.map((dest: any, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-2 group/dest">
                                                                <Compass className="w-3.5 h-3.5 text-purple-400 group-hover/dest:text-purple-300 transition-colors shrink-0" />
                                                                <span className="truncate max-w-[180px] text-xs font-medium text-gray-200 group-hover/dest:text-white transition-colors">{dest.label}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-600">N/A</span>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.lastUpdated && (
                                            <td className="p-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {client.latestContact}
                                                </div>
                                            </td>
                                        )}
                                        <td className="p-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="group-hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                                onClick={() => setSelectedClient(client)}
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-white/10">
                        <p className="text-xs text-gray-500">
                            Page {currentPage} of {totalPages} ({sortedClients.length} total)
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-white disabled:opacity-30"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let page: number;
                                if (totalPages <= 5) {
                                    page = i + 1;
                                } else if (currentPage <= 3) {
                                    page = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    page = totalPages - 4 + i;
                                } else {
                                    page = currentPage - 2 + i;
                                }
                                return (
                                    <Button
                                        key={page}
                                        variant="ghost"
                                        size="icon"
                                        className={cn("h-8 w-8 text-xs", page === currentPage ? "bg-purple-500/20 text-purple-400" : "text-gray-400 hover:text-white")}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </Button>
                                );
                            })}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-white disabled:opacity-30"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
