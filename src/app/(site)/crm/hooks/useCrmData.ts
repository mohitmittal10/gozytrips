"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useClients } from "@/lib/hooks/use-clients";
import { createClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/audit-logger";
import { updateItineraryStatus } from "@/lib/services/itinerary-status";
import { useToast } from "@/hooks/use-toast";
import { 
    isBookedTripStatus, 
    computeTopDestinations, 
    computeSeasonalityDepartures, 
    computeDurationBuckets,
    getTripCost,
    type EnrichedClient
} from "../utils/metrics-utils";
import { getCurrencySymbol } from "@/types/financial";
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
                .select("id, client_id, title, status, destinations, start_date, end_date, budget, client_price, currency, commission_rate, markup_value, markup_type, tax_percentage, adult_pax, child_pax, infant_pax, created_at, updated_at, itinerary_data, starting_location, ending_location")
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

            const bookedItineraryIds = (itineraries || [])
                .filter((t: { status?: string }) => isBookedTripStatus(t.status || ""))
                .map((t: { id: string }) => t.id);

            let tripLineNet = 0; let tripLineMarkup = 0; let tripLineGross = 0;
            const LINE_CHUNK = 60;
            for (let i = 0; i < bookedItineraryIds.length; i += LINE_CHUNK) {
                const slice = bookedItineraryIds.slice(i, i + LINE_CHUNK);
                const { data: lineItems, error: lineErr } = await supabase
                    .from("trip_line_items")
                    .select("net_cost, markup_percentage")
                    .in("itinerary_id", slice);
                if (!lineErr && lineItems) {
                    lineItems.forEach((item: { net_cost?: number; markup_percentage?: number }) => {
                        const net = Number(item.net_cost) || 0;
                        const m = Number(item.markup_percentage) || 0;
                        tripLineNet += net;
                        tripLineMarkup += net * (m / 100);
                        tripLineGross += net * (1 + m / 100);
                    });
                }
            }

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

            const combined = clients.map((client) => {
                const clientTrips = itineraries?.filter(it => it.client_id === client.id) || [];
                const totalBookedRevenue = clientTrips
                    .filter(t => t.status.toLowerCase() === 'booked' || t.status.toLowerCase() === 'confirmed')
                    .reduce((acc, t) => acc + getTripCost(t), 0);
                
                const latestTrip = clientTrips[0];
                const latestCalculatedBudget = latestTrip ? getTripCost(latestTrip) : 0;

                const bookedTrips = clientTrips.filter(t => t.status.toLowerCase() === 'booked' || t.status.toLowerCase() === 'confirmed');
                
                const tripsToRender = bookedTrips.length > 0 ? bookedTrips : (latestTrip ? [latestTrip] : []);
                const bookedDestinations = tripsToRender.map(t => {
                    let label = t.destinations && t.destinations !== "" ? t.destinations : "";
                    if (!label && t.title) label = t.title.replace(/^Trip to\s+/i, "");
                    if (!label && t.itinerary_data?.itinerary) {
                        const cities = t.itinerary_data.itinerary
                            .map((day: any) => day.areaFocus?.split(',')[0]?.trim())
                            .filter(Boolean);
                        const uniqueCities = Array.from(new Set(cities));
                        if (uniqueCities.length > 0) label = uniqueCities.join(", ");
                    }
                    if (!label) label = (t.starting_location === t.ending_location || !t.ending_location 
                            ? t.starting_location : `${t.starting_location} to ${t.ending_location}`);
                    return { id: t.id, label };
                });

                return {
                    ...client,
                    tags: client.tags || [],
                    latestStatus: latestTrip?.status || "No Active Trips",
                    latestDestination: bookedDestinations.length > 0 ? bookedDestinations.map(d => d.label).join(", ") : "N/A",
                    bookedDestinations: bookedDestinations,
                    latestBudget: totalBookedRevenue > 0 
                        ? `${getCurrencySymbol(agencySettings?.default_currency || DEFAULT_CURRENCY)}${totalBookedRevenue.toLocaleString()}` 
                        : (latestCalculatedBudget > 0 
                            ? `${getCurrencySymbol(agencySettings?.default_currency || DEFAULT_CURRENCY)}${latestCalculatedBudget.toLocaleString()}` 
                            : "N/A"),
                    latestRawBudget: totalBookedRevenue > 0 ? totalBookedRevenue : latestCalculatedBudget,
                    latestContact: new Date(client.updated_at).toLocaleDateString(),
                    latestTripId: latestTrip?.id,
                    allTrips: clientTrips
                };
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

    // Metrics useMemos
    const activeTripsCount = useMemo(() => enrichedClients.filter(c => c.latestStatus.toLowerCase() !== "no active trips" && c.latestStatus.toLowerCase() !== "completed" && c.latestStatus.toLowerCase() !== "rejected").length, [enrichedClients]);
    const bookedCount = useMemo(() => enrichedClients.filter(c => c.latestStatus.toLowerCase() === "booked" || c.latestStatus.toLowerCase() === "confirmed").length, [enrichedClients]);
    const totalProposals = useMemo(() => enrichedClients.reduce((acc, c) => acc + c.allTrips.length, 0), [enrichedClients]);
    const conversionRate = useMemo(() => totalProposals === 0 ? 0 : Math.round((bookedCount / totalProposals) * 100), [bookedCount, totalProposals]);
    const bookedRevenue = dashboardFinanceRollup.tripLineGross;
    const standaloneRevenue = dashboardFinanceRollup.standaloneGross;
    const newClientsThisMonth = useMemo(() => {
        const now = new Date();
        return clients.filter(c => {
            const created = new Date(c.created_at);
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).length;
    }, [clients]);
    const repeatClientStats = useMemo(() => {
        const repeatCount = enrichedClients.filter(c => c.allTrips.length > 1).length;
        const pct = enrichedClients.length > 0 ? (repeatCount / enrichedClients.length) * 100 : 0;
        return { repeat: repeatCount, pct: Math.round(pct) };
    }, [enrichedClients]);
    const avgBookedTripValue = useMemo(() => bookedCount === 0 ? 0 : (bookedRevenue + standaloneRevenue) / bookedCount, [bookedCount, bookedRevenue, standaloneRevenue]);
    const blendedMarginPct = useMemo(() => {
        const totalGross = dashboardFinanceRollup.tripLineGross + dashboardFinanceRollup.standaloneGross;
        const totalMarkup = dashboardFinanceRollup.tripLineMarkup + dashboardFinanceRollup.standaloneMarkup;
        return totalGross === 0 ? 0 : Math.round((totalMarkup / totalGross) * 100);
    }, [dashboardFinanceRollup]);
    const packageVsStandaloneMix = useMemo(() => {
        const total = dashboardFinanceRollup.tripLineGross + dashboardFinanceRollup.standaloneGross;
        if (total === 0) return { packageRev: 0, standaloneRev: 0, packagePct: 0, standalonePct: 0 };
        return {
            packageRev: dashboardFinanceRollup.tripLineGross, standaloneRev: dashboardFinanceRollup.standaloneGross,
            packagePct: Math.round((dashboardFinanceRollup.tripLineGross / total) * 100), standalonePct: Math.round((dashboardFinanceRollup.standaloneGross / total) * 100)
        };
    }, [dashboardFinanceRollup]);

    const topDestinationsChart = useMemo(() => computeTopDestinations(enrichedClients), [enrichedClients]);
    const seasonalityChart = useMemo(() => computeSeasonalityDepartures(enrichedClients), [enrichedClients]);
    const durationBucketsChart = useMemo(() => computeDurationBuckets(enrichedClients), [enrichedClients]);
    const durationMax = useMemo(() => Math.max(1, ...durationBucketsChart.map(b => b.count)), [durationBucketsChart]);

    const departureCalendarStats = useMemo(() => {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const thisMonthCount = enrichedClients.reduce((acc, c) => acc + c.allTrips.filter(t => {
            if (!t.start_date) return false;
            const d = new Date(t.start_date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && isBookedTripStatus(t.status);
        }).length, 0);
        const nextMonthCount = enrichedClients.reduce((acc, c) => acc + c.allTrips.filter(t => {
            if (!t.start_date) return false;
            const d = new Date(t.start_date);
            return d.getMonth() === nextMonth.getMonth() && d.getFullYear() === nextMonth.getFullYear() && isBookedTripStatus(t.status);
        }).length, 0);
        return { thisMonth: thisMonthCount, nextMonth: nextMonthCount };
    }, [enrichedClients]);

    const revenueByMonth = useMemo(() => {
        const months: Record<string, number> = {};
        enrichedClients.forEach(c => {
            c.allTrips.forEach(t => {
                if (t.start_date && isBookedTripStatus(t.status)) {
                    const m = new Date(t.start_date).toLocaleString('default', { month: 'short' });
                    months[m] = (months[m] || 0) + getTripCost(t);
                }
            });
        });
        return Object.entries(months).map(([month, revenue]) => ({ month, revenue }));
    }, [enrichedClients]);

    const recentActivity = useMemo(() => {
        const activities: any[] = [];
        enrichedClients.forEach(c => {
            activities.push({ id: `client-${c.id}`, type: 'client_added', label: `New client added: ${c.name}`, time: new Date(c.created_at), icon: 'user' });
            c.allTrips.forEach(t => {
                activities.push({ id: `trip-${t.id}`, type: 'trip_created', label: `New trip for ${c.name}: ${t.title}`, time: new Date(t.created_at), icon: 'plane' });
            });
        });
        return activities.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 50);
    }, [enrichedClients]);

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
        metrics: {
            activeTripsCount, bookedCount, totalProposals, conversionRate, bookedRevenue, standaloneRevenue,
            newClientsThisMonth, repeatClientStats, avgBookedTripValue, blendedMarginPct, packageVsStandaloneMix,
            topDestinationsChart, seasonalityChart, durationBucketsChart, durationMax,
            departureCalendarStats, revenueByMonth
        },
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
