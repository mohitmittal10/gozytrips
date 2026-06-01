"use client";

import React, { useMemo } from "react";
import { useCrmContext } from "../context/CrmContext";
import { useAuth } from "@/contexts/auth-context";
import { useReferenceOptions } from "@/hooks/use-reference-options";

import { DashboardView } from "./DashboardView";
import { CRMTableView } from "./CRMTableView";
import { KanbanView } from "./KanbanView";
import { ArchiveView } from "./ArchiveView";
import { BookingsView } from "./BookingsView";
import { TimelineView } from "./TimelineView";
import { FinanceView } from "./FinanceView";
import { EnquiryView } from "./EnquiryView";
import { ClientFormsView } from "./ClientFormsView";
import { EditItineraryView } from "./EditItineraryView";
import { TripsView } from "./TripsView";
import { getAvatarColor } from "@/lib/utils";

export function CrmTabRouter() {
    const context = useCrmContext();
    const { activeTab, filters, data: dataHook } = context;
    const { data, metrics, loading, actions } = dataHook;
    const { user, userProfile, agencySettings } = useAuth();
    const { options: itineraryStatuses } = useReferenceOptions('itinerary_status');

    // -------------------------------------------------------------------------
    // FILTER LOGIC (Extracted from page.tsx)
    // -------------------------------------------------------------------------
    const filteredClients = useMemo(() => {
        return data.enrichedClients.filter((c) => {
            if (!filters.searchQuery) return true;
            const q = filters.searchQuery.toLowerCase();
            return c.name.toLowerCase().includes(q)
                || (c.email && c.email.toLowerCase().includes(q))
                || (c.phone && c.phone.toLowerCase().includes(q))
                || (c.latestDestination && c.latestDestination.toLowerCase().includes(q))
                || (c.notes && c.notes.toLowerCase().includes(q));
        });
    }, [data.enrichedClients, filters.searchQuery]);

    const displayClients = useMemo(() => {
        let result = filteredClients;

        if (activeTab === 'clients') {
            if (filters.clientsActivityFilter === "has_trips") result = result.filter(c => c.allTrips.length > 0);
            else if (filters.clientsActivityFilter === "no_trips") result = result.filter(c => c.allTrips.length === 0);
            else if (filters.clientsActivityFilter === "new_this_month") {
                const now = new Date();
                result = result.filter(c => {
                    const created = new Date(c.created_at);
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                });
            }
            if (filters.clientsTagFilter !== "all") {
                result = result.filter(c => c.tags && c.tags.includes(filters.clientsTagFilter));
            }
        }

        if (activeTab === 'trips') {
            result = result.filter(c => {
                const s = c.latestStatus.toLowerCase();
                return s !== "no active trips" && s !== "completed" && s !== "rejected";
            });
            if (filters.tripsPipelineFilter !== "all") {
                result = result.filter(c => {
                    const s = c.latestStatus.toLowerCase();
                    const filter = filters.tripsPipelineFilter.toLowerCase();
                    return s === filter || (s === 'confirmed' && filter === 'booked');
                });
            }
        }

        if (filters.dateFrom) {
            const from = new Date(filters.dateFrom);
            result = result.filter(c => 
                c.allTrips.some(t => t.start_date && new Date(t.start_date) >= from)
            );
        }
        if (filters.dateTo) {
            const to = new Date(filters.dateTo);
            to.setHours(23, 59, 59);
            result = result.filter(c => 
                c.allTrips.some(t => t.start_date && new Date(t.start_date) <= to)
            );
        }

        if (filters.budgetMin) {
            const min = parseFloat(filters.budgetMin);
            result = result.filter(c => 
                c.allTrips.some(t => (t.client_price || t.budget || 0) >= min)
            );
        }
        if (filters.budgetMax) {
            const max = parseFloat(filters.budgetMax);
            result = result.filter(c => 
                c.allTrips.some(t => (t.client_price || t.budget || 0) <= max)
            );
        }

        return result;
    }, [filteredClients, activeTab, filters.clientsActivityFilter, filters.clientsTagFilter, filters.tripsPipelineFilter, filters.dateFrom, filters.dateTo, filters.budgetMin, filters.budgetMax]);

    const sortedClients = useMemo(() => {
        return [...displayClients].sort((a, b) => {
            const dir = filters.sortDirection === 'asc' ? 1 : -1;
            switch (filters.sortColumn) {
                case 'name': return a.name.localeCompare(b.name) * dir;
                case 'status': return a.latestStatus.localeCompare(b.latestStatus) * dir;
                case 'budget': return ((a.latestRawBudget || 0) - (b.latestRawBudget || 0)) * dir;
                case 'date': return (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()) * dir;
                default: return 0;
            }
        });
    }, [displayClients, filters.sortColumn, filters.sortDirection]);

    const totalPages = Math.max(1, Math.ceil(sortedClients.length / filters.PAGE_SIZE));
    const paginatedClients = sortedClients.slice((filters.currentPage - 1) * filters.PAGE_SIZE, filters.currentPage * filters.PAGE_SIZE);

    const handleBulkStatusChange = async (newStatus: string) => {
        const ids = Array.from(filters.selectedIds);
        for (const id of ids) {
            const client = data.enrichedClients.find(c => c.id === id);
            if (client?.latestTripId) {
                await actions.handleStatusChange(id, client.latestTripId, newStatus);
            }
        }
        filters.setSelectedIds(new Set());
    };

    const handleExportCSV = () => {
        const targets = filters.selectedIds.size > 0 ? sortedClients.filter(c => filters.selectedIds.has(c.id)) : sortedClients;
        const header = 'Name,Email,Phone,Status,Destination,Budget,Last Updated';
        const rows = targets.map(c => `"${c.name}","${c.email || ''}","${c.phone || ''}","${c.latestStatus}","${c.latestDestination}","${c.latestRawBudget || 0}","${c.latestContact}"`);
        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'clients_export.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const archivedClients = displayClients.filter(c => c.latestStatus.toLowerCase() === 'completed');

    const handleTripStatusChange = React.useCallback(async (tripId: string, newStatus: string) => {
        const ownerClient = data.enrichedClients.find(c => c.allTrips.some(t => t.id === tripId));
        if (!ownerClient) return;
        await actions.handleStatusChange(ownerClient.id, tripId, newStatus);
    }, [data.enrichedClients, actions]);

    // -------------------------------------------------------------------------
    // RENDER LOGIC
    // -------------------------------------------------------------------------
    if (activeTab === 'dashboard') {
        const unreadActivitiesCount = data.recentActivity.filter(a => a.time.getTime() > filters.lastViewedActivity).length;
        
        return <DashboardView 
            agencySettings={agencySettings}
            clients={data.clients}
            clientsLoading={loading.clientsLoading}
            enrichedClients={data.enrichedClients}
            itineraryStatuses={itineraryStatuses}
            activeTripsCount={metrics.activeTripsCount}
            conversionRate={metrics.conversionRate}
            bookedCount={metrics.bookedCount}
            totalProposals={metrics.totalProposals}
            bookedRevenue={metrics.bookedRevenue}
            standaloneRevenue={metrics.standaloneRevenue}
            bookings={data.bookings}
            bookingsCount={data.bookings.length}
            newClientsThisMonth={metrics.newClientsThisMonth}
            repeatClientStats={metrics.repeatClientStats}
            avgBookedTripValue={metrics.avgBookedTripValue}
            blendedMarginPct={metrics.blendedMarginPct}
            packageVsStandaloneMix={metrics.packageVsStandaloneMix}
            departureCalendarStats={metrics.departureCalendarStats}
            topDestinationsChart={metrics.topDestinationsChart}
            seasonalityChart={metrics.seasonalityChart}
            durationBucketsChart={metrics.durationBucketsChart}
            durationMax={metrics.durationMax}
            revenueByMonth={metrics.revenueByMonth}
            recentActivity={data.recentActivity}
            unreadActivitiesCount={unreadActivitiesCount}
            handleOpenActivitySheet={() => context.setIsActivitySheetOpen(true)}
            isComputing={loading.isComputing}
        />;
    }

    if (activeTab === 'enquiry') return <EnquiryView />;
    if (activeTab === 'client-forms') return <ClientFormsView />;
    
    if (activeTab === 'bookings') return <BookingsView
        bookings={data.bookings}
        bookingsLoading={loading.bookingsLoading}
        setIsBookingDialogOpen={context.setIsBookingDialogOpen}
        setBookings={actions.setBookings}
        setSelectedBooking={context.setSelectedBooking}
        user={user}
    />;

    if (activeTab === 'timeline') return <TimelineView
        enrichedClients={data.enrichedClients}
        hasTrips={data.enrichedClients.some(c => c.allTrips.length > 0)}
        setSelectedTheme={context.setSelectedTheme as any}
        selectedTripForModal={context.selectedTripForModal}
        setSelectedTripForModal={context.setSelectedTripForModal}
        handleDownloadPdf={() => {
            if (context.selectedTripForModal) context.setIsPreviewOpen(true);
        }}
    />;

    if (activeTab === 'edit-itinerary') return <EditItineraryView
        itineraryStatuses={itineraryStatuses}
        setSelectedTripForModal={context.setSelectedTripForModal}
        setShowModal={context.setShowModal}
        handleDuplicateTrip={() => {}} // Moved to Modals, but passed here to avoid errors. EditItineraryView calls duplicate directly or via modal.
        handleDeleteTrip={(id) => actions.handleDeleteTrip(id, () => {})}
        deleting={context.deleting}
    />;

    if (activeTab === 'finance') return <FinanceView
        enrichedClients={data.enrichedClients}
        user={user}
        userProfile={userProfile}
        userEmail={user?.email || ''}
        userName={userProfile?.full_name || user?.email || ''}
        setFinancesTrip={context.setFinancesTrip}
        setIsFinancesOpen={context.setIsFinancesOpen}
    />;

    if (activeTab === 'archive') return <ArchiveView
        archivedClients={archivedClients}
        setSelectedClient={context.setSelectedClient}

    />;

    if (activeTab === 'trips') return <TripsView
        enrichedClients={data.enrichedClients}
        tripsPipelineFilter={filters.tripsPipelineFilter}
        searchQuery={filters.searchQuery}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        budgetMin={filters.budgetMin}
        budgetMax={filters.budgetMax}
        viewMode={filters.tripsViewMode}
        itineraryStatuses={itineraryStatuses}
        loading={loading.clientsLoading || loading.isComputing}
        onTripClick={context.setSelectedFlatTrip}
        onStatusChange={handleTripStatusChange}
    />;

    // Default to CRMTableView for 'clients' or any remaining tabs
    return <CRMTableView
        activeTab={activeTab as any}
        clients={data.enrichedClients}
        paginatedClients={paginatedClients}
        sortedClients={sortedClients}
        setSelectedIds={filters.setSelectedIds}
        clientsLoading={loading.clientsLoading}
        isComputing={loading.isComputing}
        itineraryStatuses={itineraryStatuses}
        selectedIds={filters.selectedIds}
        toggleSelectAll={() => filters.toggleSelectAll(paginatedClients.map(c => c.id))}
        toggleSelectOne={filters.toggleSelectOne}
        visibleColumns={filters.visibleColumns}
        toggleColumn={filters.toggleColumn}
        handleSort={filters.handleSort}
        sortConfig={{ key: filters.sortColumn, direction: filters.sortDirection }}
        sortDirection={filters.sortDirection}
        currentPage={filters.currentPage}
        totalPages={totalPages}
        setCurrentPage={filters.setCurrentPage}
        setSelectedClient={context.setSelectedClient}
        handleBulkStatusChange={handleBulkStatusChange}
        handleExportCSV={handleExportCSV}
        totalCount={sortedClients.length}
        handleRefreshClients={actions.handleRefreshClients}
        isRefreshing={loading.isRefreshing}

    />;
}

