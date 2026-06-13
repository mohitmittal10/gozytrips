"use client";

import React, { createContext, useContext, useState } from 'react';
import type { EnrichedClient } from '../utils/metrics-utils';
import type { FlatTrip } from '../components/TripDetailSheet';
import type { Client } from '@/lib/hooks/use-clients';
import type { SavedItinerary } from '@/components/trip-card';
import type { PdfTheme } from '@/components/pdf-template';

interface CrmContextType {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isSidebarExpanded: boolean;
    setIsSidebarExpanded: (expanded: boolean) => void;

    // Modals
    isAddClientOpen: boolean;
    setIsAddClientOpen: (open: boolean) => void;
    
    selectedClient: EnrichedClient | null;
    setSelectedClient: React.Dispatch<React.SetStateAction<EnrichedClient | null>>;
    
    selectedFlatTrip: FlatTrip | null;
    setSelectedFlatTrip: React.Dispatch<React.SetStateAction<FlatTrip | null>>;
    
    showModal: boolean;
    setShowModal: (show: boolean) => void;
    
    selectedTripForModal: SavedItinerary | null;
    setSelectedTripForModal: React.Dispatch<React.SetStateAction<SavedItinerary | null>>;
    
    isPreviewOpen: boolean;
    setIsPreviewOpen: (open: boolean) => void;
    
    selectedTheme: PdfTheme;
    setSelectedTheme: (theme: PdfTheme) => void;
    
    editingClient: Client | null;
    setEditingClient: (client: Client | null) => void;
    
    isEditDialogOpen: boolean;
    setIsEditDialogOpen: (open: boolean) => void;
    
    isFinancesOpen: boolean;
    setIsFinancesOpen: (open: boolean) => void;
    
    financesTrip: SavedItinerary | null;
    setFinancesTrip: (trip: SavedItinerary | null) => void;
    
    isImportModalOpen: boolean;
    setIsImportModalOpen: (open: boolean) => void;
    
    isBookingDialogOpen: boolean;
    setIsBookingDialogOpen: (open: boolean) => void;
    
    selectedBooking: any | null;
    setSelectedBooking: (booking: any | null) => void;
    
    deletingBookingId: string | null;
    setDeletingBookingId: (id: string | null) => void;
    
    deleting: string | null;
    setDeleting: (id: string | null) => void;
    
    isActivitySheetOpen: boolean;
    setIsActivitySheetOpen: (open: boolean) => void;
    
    // Add data and filters
    filters: ReturnType<typeof import('../hooks/useCrmFilters').useCrmFilters>;
    data: ReturnType<typeof import('../hooks/useCrmData').useCrmData>;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

import { useCrmFilters } from '../hooks/useCrmFilters';
import { useCrmData } from '../hooks/useCrmData';

export function CrmProvider({ children }: { children: React.ReactNode }) {
    const [activeTab, setActiveTabState] = useState("dashboard");

    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlTab = params.get("tab");
        const storedTab = localStorage.getItem("crm_active_tab");
        if (urlTab) {
            setActiveTabState(urlTab);
        } else if (storedTab) {
            setActiveTabState(storedTab);
        }
    }, []);

    const setActiveTab = (tab: string) => {
        setActiveTabState(tab);
        localStorage.setItem("crm_active_tab", tab);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tab);
        window.history.replaceState({}, "", url.toString());
    };

    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    // Modals & Sheets
    const [isAddClientOpen, setIsAddClientOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<EnrichedClient | null>(null);
    const [selectedFlatTrip, setSelectedFlatTrip] = useState<FlatTrip | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedTripForModal, setSelectedTripForModal] = useState<SavedItinerary | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState<PdfTheme>('classic');
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isFinancesOpen, setIsFinancesOpen] = useState(false);
    const [financesTrip, setFinancesTrip] = useState<SavedItinerary | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const [isActivitySheetOpen, setIsActivitySheetOpen] = useState(false);

    // Operations states
    const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const filters = useCrmFilters();
    const data = useCrmData();

    const value = {
        activeTab, setActiveTab,
        isSidebarExpanded, setIsSidebarExpanded,
        isAddClientOpen, setIsAddClientOpen,
        selectedClient, setSelectedClient,
        selectedFlatTrip, setSelectedFlatTrip,
        showModal, setShowModal,
        selectedTripForModal, setSelectedTripForModal,
        isPreviewOpen, setIsPreviewOpen,
        selectedTheme, setSelectedTheme,
        editingClient, setEditingClient,
        isEditDialogOpen, setIsEditDialogOpen,
        isFinancesOpen, setIsFinancesOpen,
        financesTrip, setFinancesTrip,
        isImportModalOpen, setIsImportModalOpen,
        isBookingDialogOpen, setIsBookingDialogOpen,
        selectedBooking, setSelectedBooking,
        deletingBookingId, setDeletingBookingId,
        deleting, setDeleting,
        isActivitySheetOpen, setIsActivitySheetOpen,
        filters,
        data
    };

    return (
        <CrmContext.Provider value={value}>
            {children}
        </CrmContext.Provider>
    );
}

export function useCrmContext() {
    const context = useContext(CrmContext);
    if (context === undefined) {
        throw new Error('useCrmContext must be used within a CrmProvider');
    }
    return context;
}

