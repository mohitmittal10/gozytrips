"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useClients } from "@/lib/hooks/use-clients";
import { createClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/audit-logger";
import { updateItineraryStatus } from "@/services/itinerary";
import { useToast } from "@/hooks/use-toast";
import {
    isBookedTripStatus,
    computeCrmMetrics,
    computeRecentActivity,
    enrichClients,
    type EnrichedClient,
    type DashboardFinanceRollup
} from "@/services/crm";
import { formatMoney } from "@/lib/utils/currency";
import { DEFAULT_CURRENCY } from "@/types/pricing";

export function useCrmData() {
    const { user, agencySettings, userProfile } = useAuth();
    const { clients, loading: clientsLoading, fetchClients } = useClients();
    const { toast } = useToast();
    
    const [isComputing, setIsComputing] = useState(true);
    const [enrichedClients, setEnrichedClients] = useState<EnrichedClient[]>([]);
    
    const [bookings, setBookings] = useState<any[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const [dashboardFinanceRollup, setDashboardFinanceRollup] = useState({
        tripLineNet: 0,
        tripLineMarkup: 0,
        tripLineGross: 0,
        standaloneNet: 0,
        standaloneMarkup: 0,
        standaloneGross: 0,
    });

    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    
    const clientsKey = useMemo(() => clients.map(c => c.id).join(','), [clients]);

    const fetchWorkspaceData = useCallback(async () => {
        if (!user || clientsLoading) return;
        setIsComputing(true);

        try {
            setDashboardFinanceRollup({
                tripLineNet: 0, tripLineMarkup: 0, tripLineGross: 0,
                standaloneNet: 0, standaloneMarkup: 0, standaloneGross: 0,
            });

            const { data: itineraries, error } = await supabase
                .from("itineraries")
                .select("id, client_id, title, status, destinations, start_date, end_date, budget, client_price, currency, commission_rate, markup_value, markup_type, tax_percentage, adult_pax, child_pax, infant_pax, created_at, updated_at, itinerary_data, starting_location, ending_location, trip_line_items(net_cost, markup_percentage)")
                .eq("user_id", user.id)
                .order("updated_at", { ascending: false });

            if (error) throw error;

            const { data: standaloneData, error: standaloneError } = await supabase
                .from('standalone_bookings')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (!standaloneError) {
                setBookings(standaloneData || []);
            }
            setBookingsLoading(false);

            let tripLineNet = 0; let tripLineMarkup = 0; let tripLineGross = 0;
            (itineraries || []).forEach((itinerary: any) => {
                if (isBookedTripStatus(itinerary.status || "")) {
                    itinerary.trip_line_items?.forEach((item: { net_cost?: number; markup_percentage?: number }) => {
                        const net = Number(item.net_cost) || 0;
                        const m = Number(item.markup_percentage) || 0;
                        tripLineNet += net;
                        tripLineMarkup += net * (m / 100);
                        tripLineGross += net * (1 + m / 100);
                    });
                }
            });

            let standaloneNet = 0; let standaloneMarkup = 0; let standaloneGross = 0;
            (standaloneData || []).forEach((b: { net_cost?: number | null; markup_percentage?: number | null }) => {
                const net = Number(b.net_cost) || 0;
                const m = Number(b.markup_percentage) || 0;
                standaloneNet += net;
                standaloneMarkup += net * (m / 100);
                standaloneGross += net * (1 + m / 100);
            });

            setDashboardFinanceRollup({
                tripLineNet, tripLineMarkup, tripLineGross,
                standaloneNet, standaloneMarkup, standaloneGross,
            });

            const combined = enrichClients({
                clients,
                itineraries: itineraries || [],
                formatBudget: (amount) =>
                    formatMoney(amount, (agencySettings?.default_currency as any) || DEFAULT_CURRENCY),
            });

            setEnrichedClients(combined);
        } catch (err) {
            console.error("Failed to combine client trips:", err);
        } finally {
            setIsComputing(false);
        }
    }, [user?.id, clientsKey, clientsLoading, clients, agencySettings?.default_currency, supabase]);

    useEffect(() => {
        fetchWorkspaceData();
    }, [fetchWorkspaceData]);

    const handleRefreshClients = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await fetchClients();
            toast({ title: "Data Refreshed", description: "Client data has been updated from the server." });
        } catch (err) {
            toast({ title: "Refresh Failed", description: "There was an error refreshing client data.", variant: "destructive" });
        } finally {
            setTimeout(() => setIsRefreshing(false), 400);
        }
    }, [fetchClients, toast]);

    const handleStatusChange = async (clientId: string, tripId: string | undefined, newStatus: string) => {
        if (!user || !tripId) return;
        const client = enrichedClients.find(c => c.id === clientId);
        const tripToUpdate = client?.allTrips.find(t => t.id === tripId);
        const oldStatus = tripToUpdate?.status || "unknown";
        const statusToSave = newStatus.toLowerCase() === 'confirmed' ? 'booked' : newStatus;

        setEnrichedClients(prev => prev.map(c => {
            if (c.id === clientId) {
                const updatedTrips = c.allTrips.map(t => t.id === tripId ? { ...t, status: statusToSave } : t);
                return { ...c, latestStatus: statusToSave, allTrips: updatedTrips };
            }
            return c;
        }));

        try {
            await updateItineraryStatus(tripId as string, statusToSave, supabase, user.id, oldStatus);
            if (user) {
                logAuditEvent(user.id, "STATUS_CHANGE", `Trip status changed to ${statusToSave}`, {
                    entityType: "itinerary", entityId: tripId as string, metadata: { old_status: oldStatus, new_status: statusToSave },
                });
            }
            toast({ title: "Status Updated", description: "The trip status has been successfully changed." });
        } catch (err: any) {
            console.error("Failed to update status:", err);
            setEnrichedClients(prev => prev.map(c => {
                if (c.id === clientId) {
                    const revertedTrips = c.allTrips.map(t => t.id === tripId ? { ...t, status: oldStatus } : t);
                    return { ...c, latestStatus: oldStatus, allTrips: revertedTrips };
                }
                return c;
            }));
            toast({ variant: "destructive", title: "Error", description: err.message || "Could not update the trip status." });
            throw err;
        }
    };

    const handleDeleteTrip = async (id: string, onDelete: (id: string) => void) => {
        try {
            const { error } = await supabase.from('itineraries').delete().eq('id', id).eq('user_id', user?.id);
            if (error) {
                toast({ title: 'Error', description: error.message, variant: 'destructive' });
                return;
            }
            setEnrichedClients(prev => prev.map(c => ({ ...c, allTrips: c.allTrips.filter(t => t.id !== id) })));
            if (user) logAuditEvent(user.id, "DELETE_TRIP", `Trip deleted from CRM`, { entityType: "itinerary", entityId: id });
            toast({ title: 'Success', description: 'Trip deleted successfully.' });
            onDelete(id);
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Failed to delete trip', variant: 'destructive' });
        }
    };

    const handleDeleteBooking = async (bookingId: string, setDeletingBookingId: (id: string | null) => void, onDeleted: () => void) => {
        if (!user || !bookingId) return;
        setDeletingBookingId(bookingId);
        try {
            const { error } = await supabase.from('standalone_bookings').delete().eq('id', bookingId);
            if (error) throw error;
            toast({ title: "Booking Deleted", description: "Standalone booking has been removed." });
            onDeleted();
            fetchWorkspaceData();
        } catch (err) {
            console.error("Failed to delete booking:", err);
            toast({ title: "Error", description: "Failed to delete standalone booking.", variant: "destructive" });
        } finally {
            setDeletingBookingId(null);
        }
    };

    // Metrics & Activity Calculation
    const metrics = useMemo(() => 
        computeCrmMetrics(enrichedClients, clients, dashboardFinanceRollup),
    [enrichedClients, clients, dashboardFinanceRollup]);

    const recentActivity = useMemo(() => 
        computeRecentActivity(enrichedClients),
    [enrichedClients]);

    const uniqueTags = useMemo(() => {
        const tags = new Set<string>();
        clients.forEach(c => c.tags?.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [clients]);

    return {
        data: {
            clients,
            enrichedClients,
            bookings,
            uniqueTags,
            recentActivity
        },
        metrics,
        loading: {
            isComputing, clientsLoading, bookingsLoading, isRefreshing
        },
        actions: {
            fetchWorkspaceData,
            handleRefreshClients,
            handleStatusChange,
            handleDeleteTrip,
            handleDeleteBooking,
            setEnrichedClients,
            setBookings
        }
    };
}

