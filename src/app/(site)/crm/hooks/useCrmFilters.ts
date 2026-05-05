"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";

export interface FilterPreset {
    name: string;
    searchQuery: string;
    clientsActivityFilter: string;
    clientsTagFilter: string;
    tripsPipelineFilter: string;
    dateFrom: string;
    dateTo: string;
    budgetMin: string;
    budgetMax: string;
}

export function useCrmFilters() {
    const { userPreferences, updatePreferences } = useAuth();
    const [hasSyncedPreferences, setHasSyncedPreferences] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [clientsActivityFilter, setClientsActivityFilter] = useState<string>("all");
    const [clientsTagFilter, setClientsTagFilter] = useState<string>("all");
    const [tripsPipelineFilter, setTripsPipelineFilter] = useState<string>("all");
    
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');

    const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);
    const [presetName, setPresetName] = useState('');
    const [showPresetSave, setShowPresetSave] = useState(false);

    const [sortColumn, setSortColumn] = useState<'name' | 'status' | 'budget' | 'date'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 15;
    
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    
    const [visibleColumns, setVisibleColumns] = useState({
        status: true,
        destination: true,
        budget: true,
        lastUpdated: true,
    });
    
    const [tripsViewMode, setTripsViewMode] = useState<'table' | 'kanban'>('table');
    
    const [activityFilter, setActivityFilter] = useState<string>("all");
    const [lastViewedActivity, setLastViewedActivity] = useState<number>(0);
    const [deadlineRange, setDeadlineRange] = useState(7);

    // Sync with user preferences
    useEffect(() => {
        if (userPreferences && !hasSyncedPreferences) {
            if (userPreferences.crm_visible_columns) {
                setVisibleColumns(prev => ({ ...prev, ...(userPreferences.crm_visible_columns as any) }));
            }
            if (userPreferences.crm_sort) {
                const sort = userPreferences.crm_sort as any;
                if (sort.column) setSortColumn(sort.column);
                if (sort.direction) setSortDirection(sort.direction);
            }
            if (userPreferences.crm_filter_presets) {
                setSavedPresets(userPreferences.crm_filter_presets as FilterPreset[]);
            }
            if (userPreferences.crm_last_viewed_activity_at) {
                setLastViewedActivity(new Date(userPreferences.crm_last_viewed_activity_at).getTime());
            }
            if ((userPreferences as any).crm_deadline_range) {
                setDeadlineRange((userPreferences as any).crm_deadline_range);
            }
            setHasSyncedPreferences(true);
        }
    }, [userPreferences, hasSyncedPreferences]);

    const handleSort = async (col: typeof sortColumn) => {
        let newDir: 'asc' | 'desc' = 'asc';
        let newCol = col;
        
        if (sortColumn === col) {
            newDir = sortDirection === 'asc' ? 'desc' : 'asc';
            setSortDirection(newDir);
        } else {
            newCol = col;
            setSortColumn(col);
            setSortDirection('asc');
        }
        
        await updatePreferences({
            crm_sort: { column: newCol, direction: newDir }
        });
    };

    const toggleColumn = async (col: string) => {
        const next = { ...visibleColumns, [col]: !visibleColumns[col as keyof typeof visibleColumns] };
        setVisibleColumns(next);
        await updatePreferences({ crm_visible_columns: next });
    };

    const toggleSelectAll = (allIds: string[]) => {
        if (selectedIds.size === allIds.length && allIds.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(allIds));
        }
    };

    const toggleSelectOne = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const clearAllFilters = () => {
        setSearchQuery(''); 
        setClientsActivityFilter('all'); 
        setClientsTagFilter('all');
        setTripsPipelineFilter('all'); 
        setDateFrom(''); 
        setDateTo('');
        setBudgetMin(''); 
        setBudgetMax('');
    };

    return {
        searchQuery, setSearchQuery,
        clientsActivityFilter, setClientsActivityFilter,
        clientsTagFilter, setClientsTagFilter,
        tripsPipelineFilter, setTripsPipelineFilter,
        dateFrom, setDateFrom,
        dateTo, setDateTo,
        budgetMin, setBudgetMin,
        budgetMax, setBudgetMax,
        savedPresets, setSavedPresets,
        presetName, setPresetName,
        showPresetSave, setShowPresetSave,
        sortColumn, setSortColumn,
        sortDirection, setSortDirection,
        currentPage, setCurrentPage,
        PAGE_SIZE,
        selectedIds, setSelectedIds,
        visibleColumns, setVisibleColumns,
        tripsViewMode, setTripsViewMode,
        activityFilter, setActivityFilter,
        lastViewedActivity, setLastViewedActivity,
        deadlineRange, setDeadlineRange,
        hasActiveFilters: searchQuery || clientsActivityFilter !== 'all' || clientsTagFilter !== 'all' || tripsPipelineFilter !== 'all' || dateFrom || dateTo || budgetMin || budgetMax,
        handleSort,
        toggleColumn,
        toggleSelectAll,
        toggleSelectOne,
        clearAllFilters
    };
}
