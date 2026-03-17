"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Users, Calendar, MapPin, CheckCircle2, Clock, ArrowRight, Search, Plus, ListFilter, Compass, FileText, Settings, LayoutDashboard, Send, TrendingUp, Activity, CalendarDays, UserPlus, Plane, ArrowUpDown, ChevronLeft, ChevronRight, Download, Columns3, ArrowUp, ArrowDown, GripVertical, Archive, Save, X, Sliders, LayoutGrid, List, History, DollarSign, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/header";
import { useClients, type Client } from "@/lib/hooks/use-clients";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { TripCard, type SavedItinerary } from "@/components/trip-card";
import ItineraryTimeline from "@/components/itinerary-timeline";
import { PdfPreviewEditor } from "@/components/pdf-preview-editor";
import { type PdfTheme } from "@/components/pdf-template";
import { ClientDialog } from "@/components/client-dialog";
import { getAvatarColor, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import FinancialTracker from "@/components/financial-tracker";
import { Eye } from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// A combined type taking our client and adding the dynamic trip data
interface EnrichedClient extends Client {
    latestStatus: string;
    latestDestination: string;
    latestBudget: string;
    latestRawBudget: number;
    latestContact: string;
    latestTripId?: string;
    allTrips: any[];
}

export default function CRMLitePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [enrichedClients, setEnrichedClients] = useState<EnrichedClient[]>([]);
    const [isComputing, setIsComputing] = useState(true);
    const [activeTab, setActiveTab] = useState("dashboard");
    // All Clients tab: filter by client activity
    const [clientsActivityFilter, setClientsActivityFilter] = useState<string>("all");
    const [clientsTagFilter, setClientsTagFilter] = useState<string>("all");
    // Active Trips tab: filter by pipeline stage
    const [tripsPipelineFilter, setTripsPipelineFilter] = useState<string>("all");

    // Add Client Dialog State
    const [isAddClientOpen, setIsAddClientOpen] = useState(false);
    const [newClientName, setNewClientName] = useState("");
    const [newClientEmail, setNewClientEmail] = useState("");
    const [newClientPhone, setNewClientPhone] = useState("");
    const [newClientNotes, setNewClientNotes] = useState("");
    const [isAddingClient, setIsAddingClient] = useState(false);

    // View Client Sheet State
    const [selectedClient, setSelectedClient] = useState<EnrichedClient | null>(null);

    const router = useRouter();
    const [deleting, setDeleting] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedTripForModal, setSelectedTripForModal] = useState<SavedItinerary | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState<PdfTheme>('classic');
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    // Table UX: sorting
    const [sortColumn, setSortColumn] = useState<'name' | 'status' | 'budget' | 'date'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Table UX: pagination
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 15;

    // Table UX: bulk selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Table UX: column visibility
    const [visibleColumns, setVisibleColumns] = useState({
        status: true,
        destination: true,
        budget: true,
        lastUpdated: true,
    });

    // Kanban view toggle
    const [tripsViewMode, setTripsViewMode] = useState<'table' | 'kanban'>('table');

    // Date range filter
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Budget range filter
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');

    // Saved filter presets
    interface FilterPreset {
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
    const [savedPresets, setSavedPresets] = useState<FilterPreset[]>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('crm_filter_presets');
            return stored ? JSON.parse(stored) : [];
        }
        return [];
    });
    const [presetName, setPresetName] = useState('');
    const [showPresetSave, setShowPresetSave] = useState(false);

    // Activity Feed State
    const [isActivitySheetOpen, setIsActivitySheetOpen] = useState(false);
    const [activityFilter, setActivityFilter] = useState<string>("all");
    const [lastViewedActivity, setLastViewedActivity] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('crm_last_viewed_activity');
            return stored ? parseInt(stored, 10) : 0;
        }
        return 0;
    });

    // Status audit trail (in-memory for this session, builds from trip data)
    const [statusHistory, setStatusHistory] = useState<Record<string, { status: string; timestamp: string; by: string }[]>>({});

    // Helper function to extract total trip cost from itinerary data
    const getTripCost = (trip: any): number => {
        // If it's just a number (backwards compatibility)
        if (typeof trip === 'number') return trip;
        if (!trip) return 0;

        let totalBaseCost = 0;
        const data = trip.itinerary_data || {};

        // 1. Calculate Activity Costs from itinerary or days
        const itineraryDays = data.itinerary || data.days || [];
        if (Array.isArray(itineraryDays)) {
            itineraryDays.forEach((day: any) => {
                if (Array.isArray(day.timeline)) {
                    day.timeline.forEach((item: any) => {
                        if (typeof item.cost === 'number') {
                            totalBaseCost += item.cost;
                        }
                    });
                } else if (day.dailyStats?.totalCost) {
                    // Fallback for days-based structure
                    const costStr = day.dailyStats.totalCost.toString();
                    const costNum = parseInt(costStr.replace(/[^\d]/g, ''), 10);
                    totalBaseCost += isNaN(costNum) ? 0 : costNum;
                }
            });
        }

        // 2. Add Hotel Costs
        const pax = {
            adult: data.pricing?.adultPax || 2,
            child: data.pricing?.childPax || 0,
            infant: data.pricing?.infantPax || 0
        };

        if (Array.isArray(data.hotels)) {
            data.hotels.forEach((h: any) => {
                if (h.costAdult) totalBaseCost += h.costAdult * pax.adult;
                if (h.costChild) totalBaseCost += h.costChild * pax.child;
                if (h.costInfant) totalBaseCost += h.costInfant * pax.infant;
            });
        }

        // 3. Add Flight Costs
        if (Array.isArray(data.flights)) {
            data.flights.forEach((f: any) => {
                if (f.costAdult) totalBaseCost += f.costAdult * pax.adult;
                if (f.costChild) totalBaseCost += f.costChild * pax.child;
                if (f.costInfant) totalBaseCost += f.costInfant * pax.infant;
            });
        }

        // 4. Apply Markup and Tax
        const pricing = data.pricing || {};
        const markupValue = pricing.markupValue || 0;
        const markupType = pricing.markupType || 'percentage';
        const taxPercentage = pricing.taxPercentage || 0;

        const markupAmount = markupType === 'percentage'
            ? (totalBaseCost * markupValue) / 100
            : markupValue;

        const costWithMarkup = totalBaseCost + markupAmount;
        const taxAmount = (costWithMarkup * taxPercentage) / 100;

        const finalTotal = costWithMarkup + taxAmount;

        // If we have a finalTotal > 0, return it. Otherwise fall back to trip.budget
        if (finalTotal > 0) return finalTotal;
        return trip.budget || 0;
    };

    const { clients, loading: clientsLoading, createClient: _createClient, fetchClients, updateClient } = useClients();
    const { user, userProfile } = useAuth();
    const supabase = createClient();
    const { toast } = useToast();

    useEffect(() => {
        async function fetchTripsAndCombine() {
            if (!user || clientsLoading) return;
            setIsComputing(true);

            try {
                // Fetch all itineraries for this user
                const { data: itineraries, error } = await supabase
                    .from("itineraries")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("updated_at", { ascending: false });

                if (error) throw error;

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
                        // 1. Check destinations column
                        let label = t.destinations && t.destinations !== "" ? t.destinations : "";
                        
                        // 2. If empty, check title (removing "Trip to " prefix)
                        if (!label && t.title) {
                            label = t.title.replace(/^Trip to\s+/i, "");
                        }
                        
                        // 3. If still empty, check itinerary_data areaFocus
                        if (!label && t.itinerary_data?.itinerary) {
                            const cities = t.itinerary_data.itinerary
                                .map((day: any) => day.areaFocus?.split(',')[0]?.trim())
                                .filter(Boolean);
                            const uniqueCities = Array.from(new Set(cities));
                            if (uniqueCities.length > 0) {
                                label = uniqueCities.join(", ");
                            }
                        }

                        // 4. Default fallback to starting_location
                        if (!label) {
                            label = (t.starting_location === t.ending_location || !t.ending_location 
                                ? t.starting_location 
                                : `${t.starting_location} to ${t.ending_location}`);
                        }
                        
                        return { id: t.id, label };
                    });

                    return {
                        ...client,
                        tags: client.tags || [],
                        latestStatus: latestTrip?.status || "No Active Trips",
                        bookedDestinations: bookedDestinations,
                        latestBudget: totalBookedRevenue > 0 ? `₹${totalBookedRevenue.toLocaleString()}` : (latestCalculatedBudget > 0 ? `₹${latestCalculatedBudget.toLocaleString()}` : "N/A"),
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
        }

        fetchTripsAndCombine();
    }, [user, clients, clientsLoading, supabase]);

    const handleStatusChange = async (clientId: string, tripId: string | undefined, newStatus: string) => {
        if (!user || !tripId) return;

        // Simplify Confirmed and Booked to just Booked
        const statusToSave = newStatus.toLowerCase() === 'confirmed' ? 'booked' : newStatus;

        // Optimistic UI Update
        setEnrichedClients(prev => prev.map(c => {
            if (c.id === clientId) {
                const updatedTrips = c.allTrips.map(t =>
                    t.id === tripId ? { ...t, status: statusToSave } : t
                );
                return {
                    ...c,
                    latestStatus: statusToSave,
                    allTrips: updatedTrips
                };
            }
            return c;
        }));

        // Also update selected client if sheet is open
        if (selectedClient && selectedClient.id === clientId) {
            setSelectedClient(prev => {
                if (!prev) return null;
                const updatedTrips = prev.allTrips.map(t =>
                    t.id === tripId ? { ...t, status: statusToSave } : t
                );
                return {
                    ...prev,
                    latestStatus: statusToSave,
                    allTrips: updatedTrips
                };
            });
        }

        try {
            const { error } = await supabase
                .from("itineraries")
                .update({ status: statusToSave })
                .eq("id", tripId)
                .eq("user_id", user.id);

            if (error) throw error;

            // Record in audit trail
            setStatusHistory(prev => {
                const existing = prev[tripId] || [];
                return {
                    ...prev,
                    [tripId]: [...existing, {
                        status: statusToSave,
                        timestamp: new Date().toISOString(),
                        by: userProfile?.full_name || user.email || 'Unknown'
                    }]
                };
            });

            toast({
                title: "Status Updated",
                description: "The trip status has been successfully changed.",
            });
        } catch (err: any) {
            console.error("Failed to update status:", err);
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "Could not update the trip status.",
            });
        }
    };

    const handleAddClient = async () => {
        if (!newClientName.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Client name is required." });
            return;
        }

        setIsAddingClient(true);
        try {
            await _createClient({
                name: newClientName,
                email: newClientEmail || null,
                phone: newClientPhone || null,
                notes: newClientNotes || null,
                tags: []
            });

            toast({ title: "Success", description: "Client added successfully." });
            setIsAddClientOpen(false);
            setNewClientName("");
            setNewClientEmail("");
            setNewClientPhone("");
            setNewClientNotes("");
            // Component should auto-re-fetch and merge dynamically triggered by useClients update
        } catch (err: any) {
            toast({ variant: "destructive", title: "Error", description: err.message || "Failed to add client." });
        } finally {
            setIsAddingClient(false);
        }
    }

    // Multi-field search: name, email, phone, destination, notes
    let filteredClients = enrichedClients.filter(
        (c) => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return c.name.toLowerCase().includes(q)
                || (c.email && c.email.toLowerCase().includes(q))
                || (c.phone && c.phone.toLowerCase().includes(q))
                || c.latestDestination.toLowerCase().includes(q)
                || (c.notes && c.notes.toLowerCase().includes(q));
        }
    );

    const handleDeleteTrip = async (id: string) => {
        setDeleting(id);
        try {
            const { error } = await supabase
                .from('itineraries')
                .delete()
                .eq('id', id)
                .eq('user_id', user?.id);

            if (error) {
                toast({ title: 'Error', description: error.message, variant: 'destructive' });
                return;
            }

            // Update local state
            setEnrichedClients(prev => prev.map(c => ({
                ...c,
                allTrips: c.allTrips.filter(t => t.id !== id)
            })));
            if (selectedClient) {
                setSelectedClient(prev => prev ? {
                    ...prev,
                    allTrips: prev.allTrips.filter(t => t.id !== id)
                } : null);
            }
            toast({ title: 'Success', description: 'Trip deleted successfully.' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Failed to delete trip', variant: 'destructive' });
        } finally {
            setDeleting(null);
        }
    };

    const handleToggleFavourite = async (trip: SavedItinerary) => {
        try {
            const newStatus = !trip.is_favourite;

            // Optimistic update
            const updateTrips = (trips: any[]) => trips.map(t => t.id === trip.id ? { ...t, is_favourite: newStatus } : t);

            setEnrichedClients(prev => prev.map(c => ({ ...c, allTrips: updateTrips(c.allTrips) })));
            if (selectedClient) {
                setSelectedClient(prev => prev ? { ...prev, allTrips: updateTrips(prev.allTrips) } : null);
            }

            const { error } = await supabase
                .from('itineraries')
                .update({ is_favourite: newStatus })
                .eq('id', trip.id)
                .eq('user_id', user?.id);

            if (error) throw error;
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Failed to update favourite status', variant: 'destructive' });
        }
    };

    const handleDuplicateTrip = async (trip: SavedItinerary) => {
        try {
            const { hotels, flights, pricing, ...coreItinerary } = trip.itinerary_data as any;
            localStorage.setItem('travelItinerary', JSON.stringify(coreItinerary));
            if (hotels) localStorage.setItem('travelHotels', JSON.stringify(hotels));
            if (flights) localStorage.setItem('travelFlights', JSON.stringify(flights));
            if (pricing) localStorage.setItem('travelPricing', JSON.stringify(pricing));

            localStorage.removeItem('draft_client_id');
            localStorage.setItem('draft_status', 'draft');

            toast({ title: 'Duplicating Trip', description: 'Opening a copy in the AI Architect...' });
            router.push('/ai-architect');
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to duplicate trip', variant: 'destructive' });
        }
    };

    const handleDownloadPdf = () => {
        if (!selectedTripForModal) return;
        setIsPreviewOpen(true);
    };

    let displayClients = filteredClients;

    const uniqueTags = Array.from(new Set(clients.flatMap(c => c.tags || []))).sort();

    // Dashboard: no extra filtering — it's an overview showing everything

    // All Clients: filter by client activity
    if (activeTab === 'clients') {
        if (clientsActivityFilter === "has_trips") {
            displayClients = displayClients.filter(c => c.allTrips.length > 0);
        } else if (clientsActivityFilter === "no_trips") {
            displayClients = displayClients.filter(c => c.allTrips.length === 0);
        } else if (clientsActivityFilter === "new_this_month") {
            const now = new Date();
            displayClients = displayClients.filter(c => {
                const created = new Date(c.created_at);
                return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
            });
        }
        if (clientsTagFilter !== "all") {
            displayClients = displayClients.filter(c => c.tags && c.tags.includes(clientsTagFilter));
        }
    }

    // Active Trips: only show clients with active trips, then filter by pipeline stage
    if (activeTab === 'trips') {
        displayClients = displayClients.filter(c =>
            c.latestStatus.toLowerCase() !== "no active trips" &&
            c.latestStatus.toLowerCase() !== "completed" &&
            c.latestStatus.toLowerCase() !== "rejected"
        );
        if (tripsPipelineFilter !== "all") {
            displayClients = displayClients.filter(c => c.latestStatus.toLowerCase() === tripsPipelineFilter.toLowerCase() || (c.latestStatus.toLowerCase() === 'confirmed' && tripsPipelineFilter.toLowerCase() === 'booked'));
        }
    }

    // Date range filter (on latest trip dates)
    if (dateFrom) {
        const from = new Date(dateFrom);
        displayClients = displayClients.filter(c => {
            const tripDate = c.allTrips[0]?.start_date;
            return tripDate && new Date(tripDate) >= from;
        });
    }
    if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59);
        displayClients = displayClients.filter(c => {
            const tripDate = c.allTrips[0]?.start_date;
            return tripDate && new Date(tripDate) <= to;
        });
    }

    // Budget range filter
    if (budgetMin) {
        const min = parseFloat(budgetMin);
        displayClients = displayClients.filter(c => (c.latestRawBudget || 0) >= min);
    }
    if (budgetMax) {
        const max = parseFloat(budgetMax);
        displayClients = displayClients.filter(c => (c.latestRawBudget || 0) <= max);
    }

    // Completed / Archive clients
    const archivedClients = enrichedClients.filter(c =>
        c.latestStatus.toLowerCase() === 'completed'
    );

    // Filter preset helpers
    const saveCurrentPreset = () => {
        if (!presetName.trim()) return;
        const preset: FilterPreset = {
            name: presetName, searchQuery, clientsActivityFilter, clientsTagFilter,
            tripsPipelineFilter, dateFrom, dateTo, budgetMin, budgetMax
        };
        const updated = [...savedPresets, preset];
        setSavedPresets(updated);
        localStorage.setItem('crm_filter_presets', JSON.stringify(updated));
        setPresetName('');
        setShowPresetSave(false);
        toast({ title: 'Preset Saved', description: `Filter preset "${presetName}" saved.` });
    };

    const applyPreset = (p: FilterPreset) => {
        setSearchQuery(p.searchQuery);
        setClientsActivityFilter(p.clientsActivityFilter);
        setClientsTagFilter(p.clientsTagFilter);
        setTripsPipelineFilter(p.tripsPipelineFilter);
        setDateFrom(p.dateFrom);
        setDateTo(p.dateTo);
        setBudgetMin(p.budgetMin);
        setBudgetMax(p.budgetMax);
        toast({ title: 'Preset Applied', description: `Applied "${p.name}" filter preset.` });
    };

    const deletePreset = (idx: number) => {
        const updated = savedPresets.filter((_, i) => i !== idx);
        setSavedPresets(updated);
        localStorage.setItem('crm_filter_presets', JSON.stringify(updated));
    };

    const clearAllFilters = () => {
        setSearchQuery(''); setClientsActivityFilter('all'); setClientsTagFilter('all');
        setTripsPipelineFilter('all'); setDateFrom(''); setDateTo('');
        setBudgetMin(''); setBudgetMax('');
    };

    const hasActiveFilters = searchQuery || clientsActivityFilter !== 'all' || clientsTagFilter !== 'all' || tripsPipelineFilter !== 'all' || dateFrom || dateTo || budgetMin || budgetMax;

    // Kanban columns
    const kanbanColumns = useMemo(() => {
        const cols = { draft: [] as EnrichedClient[], proposed: [] as EnrichedClient[], sent: [] as EnrichedClient[], booked: [] as EnrichedClient[] };
        enrichedClients.forEach(c => {
            const s = c.latestStatus.toLowerCase();
            if (s === 'draft') cols.draft.push(c);
            else if (s === 'proposed') cols.proposed.push(c);
            else if (s === 'sent') cols.sent.push(c);
            else if (s === 'booked' || s === 'confirmed') cols.booked.push(c);
        });
        return cols;
    }, [enrichedClients]);

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [activeTab, clientsActivityFilter, clientsTagFilter, tripsPipelineFilter, searchQuery, dateFrom, dateTo, budgetMin, budgetMax]);

    // Sort displayClients
    const handleSort = (col: typeof sortColumn) => {
        if (sortColumn === col) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(col);
            setSortDirection('asc');
        }
    };

    const sortedClients = useMemo(() => {
        return [...displayClients].sort((a, b) => {
            const dir = sortDirection === 'asc' ? 1 : -1;
            switch (sortColumn) {
                case 'name': return a.name.localeCompare(b.name) * dir;
                case 'status': return a.latestStatus.localeCompare(b.latestStatus) * dir;
                case 'budget': return ((a.latestRawBudget || 0) - (b.latestRawBudget || 0)) * dir;
                case 'date': return (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()) * dir;
                default: return 0;
            }
        });
    }, [displayClients, sortColumn, sortDirection]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(sortedClients.length / PAGE_SIZE));
    const paginatedClients = sortedClients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // Bulk selection helpers
    const toggleSelectAll = () => {
        if (selectedIds.size === paginatedClients.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginatedClients.map(c => c.id)));
        }
    };

    const toggleSelectOne = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleBulkStatusChange = async (newStatus: string) => {
        const ids = Array.from(selectedIds);
        for (const id of ids) {
            const client = enrichedClients.find(c => c.id === id);
            if (client?.latestTripId) {
                await handleStatusChange(id, client.latestTripId, newStatus);
            }
        }
        setSelectedIds(new Set());
        toast({ title: 'Bulk Update', description: `Updated ${ids.length} client(s) to ${newStatus}.` });
    };

    const handleExportCSV = () => {
        const targets = selectedIds.size > 0
            ? sortedClients.filter(c => selectedIds.has(c.id))
            : sortedClients;
        const header = 'Name,Email,Phone,Status,Destination,Budget,Last Updated';
        const rows = targets.map(c =>
            `"${c.name}","${c.email || ''}","${c.phone || ''}","${c.latestStatus}","${c.latestDestination}","${c.latestRawBudget || 0}","${c.latestContact}"`
        );
        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'clients_export.csv'; a.click();
        URL.revokeObjectURL(url);
        toast({ title: 'Export', description: `Exported ${targets.length} client(s).` });
    };

    const toggleColumn = (col: keyof typeof visibleColumns) => {
        setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
    };

    const SortIcon = ({ col }: { col: typeof sortColumn }) => {
        if (sortColumn !== col) return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-600" />;
        return sortDirection === 'asc'
            ? <ArrowUp className="w-3 h-3 ml-1 text-purple-400" />
            : <ArrowDown className="w-3 h-3 ml-1 text-purple-400" />;
    };

    // Dynamic Metrics
    const activeTripsCount = enrichedClients.filter(c =>
        c.latestStatus.toLowerCase() !== "no active trips" &&
        c.latestStatus.toLowerCase() !== "booked" &&
        c.latestStatus.toLowerCase() !== "confirmed" &&
        c.latestStatus.toLowerCase() !== "rejected" &&
        c.latestStatus.toLowerCase() !== "completed"
    ).length;

    const bookedRevenue = enrichedClients.reduce((acc, client) => {
        const clientBookedRevenue = client.allTrips.reduce((tripAcc: number, trip: any) => {
            const s = (trip.status || "").toLowerCase();
            if (s === "booked" || s === "confirmed") {
                return tripAcc + getTripCost(trip);
            }
            return tripAcc;
        }, 0);
        return acc + clientBookedRevenue;
    }, 0);

    const proposalsSentCount = enrichedClients.filter(c =>
        c.latestStatus.toLowerCase() === "sent" || c.latestStatus.toLowerCase() === "proposed"
    ).length;

    // Conversion Rate
    const bookedCount = enrichedClients.filter(c =>
        c.latestStatus.toLowerCase() === "booked" || c.latestStatus.toLowerCase() === "confirmed"
    ).length;
    const totalProposals = enrichedClients.filter(c =>
        c.latestStatus.toLowerCase() !== "no active trips"
    ).length;
    const conversionRate = totalProposals > 0 ? Math.round((bookedCount / totalProposals) * 100) : 0;

    // Pipeline counts
    const pipelineCounts = useMemo(() => {
        const counts = { draft: 0, proposed: 0, sent: 0, booked: 0 };
        enrichedClients.forEach(c => {
            const s = c.latestStatus.toLowerCase();
            if (s === 'draft') counts.draft++;
            else if (s === 'proposed') counts.proposed++;
            else if (s === 'sent') counts.sent++;
            else if (s === 'booked' || s === 'confirmed') counts.booked++;
        });
        return counts;
    }, [enrichedClients]);

    const pipelineMax = Math.max(pipelineCounts.draft, pipelineCounts.proposed, pipelineCounts.sent, pipelineCounts.booked, 1);

    // Revenue by month (last 6 months)
    const revenueByMonth = useMemo(() => {
        const now = new Date();
        const months: { name: string; revenue: number; monthDate: Date }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ name: d.toLocaleString('default', { month: 'short' }), revenue: 0, monthDate: d });
        }
        enrichedClients.forEach(c => {
            c.allTrips.forEach((trip: any) => {
                if (trip.status === 'booked' || trip.status === 'confirmed') {
                    const tripCost = getTripCost(trip);
                    if (tripCost > 0) {
                        const tripDate = new Date(trip.updated_at || trip.created_at);
                        const monthIdx = months.findIndex(m =>
                            tripDate.getMonth() === m.monthDate.getMonth() && tripDate.getFullYear() === m.monthDate.getFullYear()
                        );
                        if (monthIdx >= 0) months[monthIdx].revenue += tripCost;
                    }
                }
            });
        });
        return months.map(({ name, revenue }) => ({ name, revenue }));
    }, [enrichedClients]);

    // Upcoming deadlines
    const [deadlineRange, setDeadlineRange] = useState(7);
    const upcomingTrips = useMemo(() => {
        const now = new Date();
        const cutoff = new Date(now.getTime() + deadlineRange * 24 * 60 * 60 * 1000);
        const trips: { clientName: string; destination: string; startDate: string; daysLeft: number; tripId: string }[] = [];
        enrichedClients.forEach(c => {
            c.allTrips.forEach((trip: any) => {
                const sd = new Date(trip.start_date);
                if (sd >= now && sd <= cutoff) {
                    const daysLeft = Math.ceil((sd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    trips.push({
                        clientName: c.name,
                        destination: trip.starting_location + (trip.ending_location ? ` \u2192 ${trip.ending_location}` : ''),
                        startDate: sd.toLocaleDateString(),
                        daysLeft,
                        tripId: trip.id,
                    });
                }
            });
        });
        return trips.sort((a, b) => a.daysLeft - b.daysLeft);
    }, [enrichedClients, deadlineRange]);

    // Recent activity feed
    const allActivity = useMemo(() => {
        const events: { type: string; label: string; time: Date; icon: string; id: string }[] = [];
        enrichedClients.forEach(c => {
            events.push({ type: 'client_added', label: `${c.name} was added as a client`, time: new Date(c.created_at), icon: 'user', id: `client-${c.id}` });
            c.allTrips.forEach((trip: any) => {
                const tripTitle = trip.title || trip.starting_location || 'Untitled Trip';
                events.push({ type: 'trip_created', label: `Trip "${tripTitle}" created for ${c.name}`, time: new Date(trip.created_at), icon: 'plane', id: `trip-create-${trip.id}` });
                if (trip.status && trip.status !== 'draft') {
                    events.push({ type: 'status_changed', label: `${c.name}'s trip status \u2192 ${trip.status}`, time: new Date(trip.updated_at), icon: 'activity', id: `trip-status-${trip.id}-${trip.updated_at}` });
                }
            });
        });
        return events.sort((a, b) => b.time.getTime() - a.time.getTime());
    }, [enrichedClients]);

    const recentActivity = allActivity.slice(0, 15);
    const unreadActivitiesCount = allActivity.filter(a => a.time.getTime() > lastViewedActivity).length;

    const handleOpenActivitySheet = () => {
        setIsActivitySheetOpen(true);
        const now = Date.now();
        setLastViewedActivity(now);
        localStorage.setItem('crm_last_viewed_activity', now.toString());
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white pt-24 pb-12">
            <Header />
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Left Navigation Panel */}
                    <div className="w-full lg:w-64 shrink-0 space-y-2">
                        <div className="p-4 glass-main border border-white/10 rounded-xl space-y-2">
                            <Button
                                variant="ghost"
                                className={`w-full justify-start gap-3 rounded-lg ${activeTab === 'dashboard' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                onClick={() => setActiveTab('dashboard')}
                            >
                                <LayoutDashboard className="w-5 h-5" /> Dashboard
                            </Button>
                            <Button
                                variant="ghost"
                                className={`w-full justify-start gap-3 rounded-lg ${activeTab === 'clients' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                onClick={() => setActiveTab('clients')}
                            >
                                <Users className="w-5 h-5" /> All Clients
                            </Button>
                            <Button
                                variant="ghost"
                                className={`w-full justify-start gap-3 rounded-lg ${activeTab === 'trips' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                onClick={() => setActiveTab('trips')}
                            >
                                <MapPin className="w-5 h-5" /> Active Trips
                            </Button>
                            <Button
                                variant="ghost"
                                className={`w-full justify-start gap-3 rounded-lg ${activeTab === 'archive' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                onClick={() => setActiveTab('archive')}
                            >
                                <Archive className="w-5 h-5" /> Archive
                                {archivedClients.length > 0 && <span className="ml-auto text-xs text-gray-500">{archivedClients.length}</span>}
                            </Button>
                            <Button
                                variant="ghost"
                                className={`w-full justify-start gap-3 rounded-lg ${activeTab === 'finance' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                onClick={() => setActiveTab('finance')}
                            >
                                <DollarSign className="w-5 h-5" /> Finance
                            </Button>
                            <Button
                                variant="ghost"
                                className={`w-full justify-start gap-3 rounded-lg ${activeTab === 'templates' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                onClick={() => setActiveTab('templates')}
                            >
                                <FileText className="w-5 h-5" /> Templates
                            </Button>
                        </div>

                        <div className="p-4 glass-main border border-white/10 rounded-xl space-y-2">
                            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Settings</p>
                            <Button
                                variant="ghost"
                                className={`w-full justify-start gap-3 rounded-lg ${activeTab === 'settings' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                onClick={() => setActiveTab('settings')}
                            >
                                <Settings className="w-5 h-5" /> Preferences
                            </Button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 space-y-8">

                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                                    {activeTab === 'dashboard' ? 'CRM Overview' : activeTab === 'clients' ? 'Client Management' : activeTab === 'trips' ? 'Trip Pipeline' : activeTab === 'archive' ? 'Completed Archive' : activeTab === 'finance' ? 'Financial Tracking' : activeTab === 'templates' ? 'Templates' : 'Preferences'}
                                </h1>
                                <p className="text-gray-400 mt-2">Manage your clients, preferences, and active trips.</p>
                            </div>

                            <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-white text-black hover:bg-gray-200">
                                        <Plus className="w-4 h-4 mr-2" /> Add New Client
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#0A0A0A] border border-white/10 text-white sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl">Add New Client</DialogTitle>
                                        <DialogDescription className="text-gray-400">
                                            Add a new client to your CRM. You can add more details later.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="name" className="text-right text-gray-300">
                                                Name
                                            </Label>
                                            <Input
                                                id="name"
                                                value={newClientName}
                                                onChange={(e) => setNewClientName(e.target.value)}
                                                className="col-span-3 bg-white/5 border-white/10 text-white focus-visible:ring-purple-500"
                                                placeholder="e.g. Acme Corp"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="email" className="text-right text-gray-300">
                                                Email
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={newClientEmail}
                                                onChange={(e) => setNewClientEmail(e.target.value)}
                                                className="col-span-3 bg-white/5 border-white/10 text-white focus-visible:ring-purple-500"
                                                placeholder="e.g. acme@example.com"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="phone" className="text-right text-gray-300">
                                                Phone
                                            </Label>
                                            <Input
                                                id="phone"
                                                type="text"
                                                value={newClientPhone}
                                                onChange={(e) => setNewClientPhone(e.target.value)}
                                                className="col-span-3 bg-white/5 border-white/10 text-white focus-visible:ring-purple-500"
                                                placeholder="e.g. +1 234 567 8900"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="notes" className="text-right text-gray-300">
                                                Notes
                                            </Label>
                                            <Input
                                                id="notes"
                                                type="text"
                                                value={newClientNotes}
                                                onChange={(e) => setNewClientNotes(e.target.value)}
                                                className="col-span-3 bg-white/5 border-white/10 text-white focus-visible:ring-purple-500"
                                                placeholder="e.g. VIP client, prefers window seats"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsAddClientOpen(false)} className="border-white/10 bg-transparent text-gray-300 hover:bg-white/5 hover:text-white">
                                            Cancel
                                        </Button>
                                        <Button onClick={handleAddClient} disabled={isAddingClient} className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 hover:opacity-90 transition-opacity">
                                            {isAddingClient ? "Adding..." : "Add Client"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Interactive Views */}
                        {(activeTab === 'templates' || activeTab === 'settings') ? (
                            <div className="glass-main border border-white/10 rounded-xl p-16 text-center text-gray-400 flex flex-col items-center justify-center">
                                {activeTab === 'templates' ? <FileText className="w-12 h-12 text-gray-600 mb-4" /> : <Settings className="w-12 h-12 text-gray-600 mb-4" />}
                                <h3 className="text-xl font-medium text-white mb-2">{activeTab === 'templates' ? 'Templates' : 'Settings'}</h3>
                                <p>This module is currently under development. Check back soon for full AI integration!</p>
                            </div>
                        ) : (
                            <>
                                {/* Stats Section */}
                                {activeTab === 'dashboard' && (
                                    <>
                                        {/* Metric Cards Row */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="glass-main border border-white/10 rounded-xl p-6 relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-400 font-medium">Total Clients</p>
                                                        <p className="text-3xl font-bold mt-1">{clientsLoading ? "..." : clients.length}</p>
                                                    </div>
                                                    <div className="p-3 bg-purple-500/20 rounded-lg">
                                                        <Users className="w-6 h-6 text-purple-400" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="glass-main border border-white/10 rounded-xl p-6 relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-400 font-medium">Active Trips</p>
                                                        <p className="text-3xl font-bold mt-1">{isComputing ? "..." : activeTripsCount}</p>
                                                    </div>
                                                    <div className="p-3 bg-blue-500/20 rounded-lg">
                                                        <MapPin className="w-6 h-6 text-blue-400" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="glass-main border border-white/10 rounded-xl p-6 relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-400 font-medium">Conversion Rate</p>
                                                        <p className="text-3xl font-bold mt-1">{isComputing ? "..." : `${conversionRate}%`}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{bookedCount}/{totalProposals} proposals</p>
                                                    </div>
                                                    <div className="p-3 bg-amber-500/20 rounded-lg">
                                                        <TrendingUp className="w-6 h-6 text-amber-400" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="glass-main border border-white/10 rounded-xl p-6 relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-400 font-medium">Booked Revenue</p>
                                                        <p className="text-3xl font-bold mt-1">{isComputing ? "..." : `₹${bookedRevenue.toLocaleString()}`}</p>
                                                    </div>
                                                    <div className="p-3 bg-green-500/20 rounded-lg">
                                                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Revenue Sparkline + Pipeline Funnel Row */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {/* Revenue Trend */}
                                            <div className="glass-main border border-white/10 rounded-xl p-6">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <TrendingUp className="w-4 h-4 text-purple-400" />
                                                    <h3 className="text-sm font-semibold text-gray-300">Revenue Trend (6 Months)</h3>
                                                </div>
                                                <div className="h-[120px]">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={revenueByMonth} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                                                            <defs>
                                                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                                                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: 12 }}
                                                                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                                            />
                                                            <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} fill="url(#revenueGrad)" />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* Pipeline Funnel */}
                                            <div className="glass-main border border-white/10 rounded-xl p-6">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Activity className="w-4 h-4 text-pink-400" />
                                                    <h3 className="text-sm font-semibold text-gray-300">Pipeline Funnel</h3>
                                                </div>
                                                <div className="space-y-3">
                                                    {[
                                                        { label: 'Draft', count: pipelineCounts.draft, color: 'from-purple-500 to-purple-600' },
                                                        { label: 'Proposed', count: pipelineCounts.proposed, color: 'from-pink-500 to-pink-600' },
                                                        { label: 'Sent', count: pipelineCounts.sent, color: 'from-blue-500 to-blue-600' },
                                                        { label: 'Booked', count: pipelineCounts.booked, color: 'from-green-500 to-green-600' },
                                                    ].map(stage => (
                                                        <div key={stage.label} className="flex items-center gap-3">
                                                            <span className="text-xs text-gray-400 w-16 text-right shrink-0">{stage.label}</span>
                                                            <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                                                                <div
                                                                    className={`h-full bg-gradient-to-r ${stage.color} rounded-full flex items-center justify-end pr-2 transition-all duration-500`}
                                                                    style={{ width: `${Math.max((stage.count / pipelineMax) * 100, stage.count > 0 ? 12 : 0)}%` }}
                                                                >
                                                                    {stage.count > 0 && <span className="text-[10px] font-bold text-white">{stage.count}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Upcoming Deadlines + Activity Feed Row */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {/* Upcoming Deadlines */}
                                            <div className="glass-main border border-white/10 rounded-xl p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays className="w-4 h-4 text-blue-400" />
                                                        <h3 className="text-sm font-semibold text-gray-300">Upcoming Departures</h3>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        {[7, 14, 30].map(d => (
                                                            <button
                                                                key={d}
                                                                onClick={() => setDeadlineRange(d)}
                                                                className={`text-[10px] px-2 py-1 rounded-md transition-colors ${deadlineRange === d ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                                                            >
                                                                {d}d
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                                    {upcomingTrips.length === 0 ? (
                                                        <p className="text-xs text-gray-500 text-center py-4">No trips departing in the next {deadlineRange} days.</p>
                                                    ) : (
                                                        upcomingTrips.map(trip => (
                                                            <div key={trip.tripId} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <Plane className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-medium text-white truncate">{trip.clientName}</p>
                                                                        <p className="text-[10px] text-gray-500 truncate">{trip.destination}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0 ml-2">
                                                                    <p className={`text-xs font-bold ${trip.daysLeft <= 3 ? 'text-red-400' : trip.daysLeft <= 7 ? 'text-amber-400' : 'text-gray-300'}`}>
                                                                        {trip.daysLeft === 0 ? 'Today' : trip.daysLeft === 1 ? 'Tomorrow' : `${trip.daysLeft}d`}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-500">{trip.startDate}</p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Recent Activity Feed */}
                                            <div className="glass-main border border-white/10 rounded-xl p-6 flex flex-col">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Activity className="w-4 h-4 text-green-400" />
                                                        <h3 className="text-sm font-semibold text-gray-300">Recent Activity</h3>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-[11px] text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 px-2 flex items-center gap-1.5"
                                                        onClick={handleOpenActivitySheet}
                                                    >
                                                        View All
                                                        {unreadActivitiesCount > 0 && (
                                                            <span className="bg-purple-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                                {unreadActivitiesCount} New
                                                            </span>
                                                        )}
                                                    </Button>
                                                </div>
                                                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                                    {recentActivity.length === 0 ? (
                                                        <p className="text-xs text-gray-500 text-center py-4">No recent activity.</p>
                                                    ) : (
                                                        recentActivity.map((event) => (
                                                            <div key={event.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                                                <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${event.icon === 'user' ? 'bg-purple-500/20' :
                                                                    event.icon === 'plane' ? 'bg-blue-500/20' :
                                                                        'bg-green-500/20'
                                                                    }`}>
                                                                    {event.icon === 'user' ? <UserPlus className="w-3 h-3 text-purple-400" /> :
                                                                        event.icon === 'plane' ? <Plane className="w-3 h-3 text-blue-400" /> :
                                                                            <Activity className="w-3 h-3 text-green-400" />}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-xs text-gray-200 leading-relaxed truncate">{event.label}</p>
                                                                    <p className="text-[10px] text-gray-500 mt-0.5">{event.time.toLocaleDateString()} · {event.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Search and Filter (hidden on dashboard) */}
                                {activeTab !== 'dashboard' && (<div className="space-y-3">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <Input
                                                type="text"
                                                placeholder="Search name, email, phone, destination, notes..."
                                                className="w-full pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-purple-500"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            {/* All Clients: filter by activity */}
                                            {activeTab === 'clients' && (
                                                <>
                                                    <Select value={clientsTagFilter} onValueChange={setClientsTagFilter}>
                                                        <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                                                            <ListFilter className="w-4 h-4 mr-2" />
                                                            <SelectValue placeholder="All Tags" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All Tags</SelectItem>
                                                            {uniqueTags.map((tag) => (
                                                                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    <Select value={clientsActivityFilter} onValueChange={setClientsActivityFilter}>
                                                        <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                                                            <ListFilter className="w-4 h-4 mr-2" />
                                                            <SelectValue placeholder="Filter Clients" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All Clients</SelectItem>
                                                            <SelectItem value="has_trips">Has Trips</SelectItem>
                                                            <SelectItem value="no_trips">No Trips</SelectItem>
                                                            <SelectItem value="new_this_month">New This Month</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </>
                                            )}

                                            {/* Active Trips: filter + view toggle */}
                                            {activeTab === 'trips' && (
                                                <>
                                                    <Select value={tripsPipelineFilter} onValueChange={setTripsPipelineFilter}>
                                                        <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                                                            <ListFilter className="w-4 h-4 mr-2" />
                                                            <SelectValue placeholder="Pipeline Stage" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All Stages</SelectItem>
                                                            <SelectItem value="draft">Draft</SelectItem>
                                                            <SelectItem value="proposed">Proposed</SelectItem>
                                                            <SelectItem value="sent">Sent</SelectItem>
                                                            <SelectItem value="booked">Booked</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <div className="flex border border-white/10 rounded-lg overflow-hidden">
                                                        <button
                                                            onClick={() => setTripsViewMode('table')}
                                                            className={`p-2 transition-colors ${tripsViewMode === 'table' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                                                            title="Table View"
                                                        >
                                                            <List className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setTripsViewMode('kanban')}
                                                            className={`p-2 transition-colors ${tripsViewMode === 'kanban' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                                                            title="Kanban View"
                                                        >
                                                            <LayoutGrid className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Advanced Filters Row */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Date:</span>
                                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-7 px-2 text-[11px] bg-white/5 border border-white/10 rounded-md text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                                            <span className="text-gray-600 text-[10px]">to</span>
                                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-7 px-2 text-[11px] bg-white/5 border border-white/10 rounded-md text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                                        </div>
                                        <div className="h-4 w-px bg-white/10" />
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Budget:</span>
                                            <input type="number" placeholder="Min" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} className="h-7 w-20 px-2 text-[11px] bg-white/5 border border-white/10 rounded-md text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                                            <span className="text-gray-600 text-[10px]">–</span>
                                            <input type="number" placeholder="Max" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} className="h-7 w-20 px-2 text-[11px] bg-white/5 border border-white/10 rounded-md text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                                        </div>
                                        <div className="h-4 w-px bg-white/10" />
                                        {/* Saved Presets */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-7 border-white/10 bg-transparent text-gray-400 hover:bg-white/10 text-[11px] px-2">
                                                    <Save className="w-3 h-3 mr-1" /> Presets{savedPresets.length > 0 && ` (${savedPresets.length})`}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="bg-[#1a1a2e] border-white/10 text-white w-56">
                                                <DropdownMenuLabel className="text-xs text-gray-400">Saved Filters</DropdownMenuLabel>
                                                <DropdownMenuSeparator className="bg-white/10" />
                                                {savedPresets.length === 0 ? (
                                                    <div className="px-2 py-3 text-center text-xs text-gray-500">No saved presets</div>
                                                ) : (
                                                    savedPresets.map((p, idx) => (
                                                        <div key={idx} className="flex items-center justify-between px-2 py-1.5 hover:bg-white/5 rounded-sm cursor-pointer group">
                                                            <button onClick={() => applyPreset(p)} className="text-xs text-gray-200 flex-1 text-left truncate">{p.name}</button>
                                                            <button onClick={() => deletePreset(idx)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity p-0.5">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                                <DropdownMenuSeparator className="bg-white/10" />
                                                {showPresetSave ? (
                                                    <div className="p-2 flex gap-1">
                                                        <input
                                                            type="text" placeholder="Preset name..."
                                                            value={presetName} onChange={e => setPresetName(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && saveCurrentPreset()}
                                                            className="flex-1 h-7 px-2 text-xs bg-white/5 border border-white/10 rounded text-white placeholder:text-gray-500 focus:outline-none"
                                                            autoFocus
                                                        />
                                                        <Button size="sm" className="h-7 px-2 text-xs bg-purple-500 hover:bg-purple-600" onClick={saveCurrentPreset}>Save</Button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setShowPresetSave(true)} className="w-full text-left px-2 py-1.5 text-xs text-purple-400 hover:bg-white/5 rounded-sm">+ Save current filters</button>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        {hasActiveFilters && (
                                            <Button variant="ghost" size="sm" className="h-7 text-[11px] text-gray-400 hover:text-white px-2" onClick={clearAllFilters}>
                                                <X className="w-3 h-3 mr-1" /> Clear All
                                            </Button>
                                        )}
                                    </div>
                                </div>)}

                                {/* Table view sections (hidden in kanban mode or archive tab) */}
                                {!(activeTab === 'trips' && tripsViewMode === 'kanban') && activeTab !== 'archive' && activeTab !== 'dashboard' && (<>
                                    {/* Bulk Actions Bar */}
                                    {selectedIds.size > 0 && (
                                        <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl animate-in fade-in slide-in-from-top-2">
                                            <span className="text-sm text-purple-300 font-medium">{selectedIds.size} selected</span>
                                            <div className="h-4 w-px bg-purple-500/30" />
                                            <Select onValueChange={(val) => handleBulkStatusChange(val)}>
                                                <SelectTrigger className="h-8 w-[140px] bg-white/5 border-white/10 text-white text-xs">
                                                    <SelectValue placeholder="Set Status..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="draft">Draft</SelectItem>
                                                    <SelectItem value="proposed">Proposed</SelectItem>
                                                    <SelectItem value="sent">Sent</SelectItem>
                                                    <SelectItem value="booked">Booked</SelectItem>
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
                                                    <DropdownMenuCheckboxItem checked={visibleColumns.status} onCheckedChange={() => toggleColumn('status')} className="text-xs">Status</DropdownMenuCheckboxItem>
                                                    <DropdownMenuCheckboxItem checked={visibleColumns.destination} onCheckedChange={() => toggleColumn('destination')} className="text-xs">Destination</DropdownMenuCheckboxItem>
                                                    <DropdownMenuCheckboxItem checked={visibleColumns.budget} onCheckedChange={() => toggleColumn('budget')} className="text-xs">Cost of Trip</DropdownMenuCheckboxItem>
                                                    <DropdownMenuCheckboxItem checked={visibleColumns.lastUpdated} onCheckedChange={() => toggleColumn('lastUpdated')} className="text-xs">Last Updated</DropdownMenuCheckboxItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* Client List */}
                                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
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
                                                        {visibleColumns.status && (
                                                            <th className="p-4 font-medium cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('status')}>
                                                                <span className="inline-flex items-center">Status <SortIcon col="status" /></span>
                                                            </th>
                                                        )}
                                                        {visibleColumns.destination && (
                                                            <th className="p-4 font-medium">Destination</th>
                                                        )}
                                                        {visibleColumns.budget && (
                                                            <th className="p-4 font-medium cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('budget')}>
                                                                <span className="inline-flex items-center">Cost of Trip <SortIcon col="budget" /></span>
                                                            </th>
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
                                                                                    {client.tags.map((tag, idx) => (
                                                                                        <Badge key={idx} variant="secondary" className="bg-purple-500/10 text-purple-400 border border-purple-500/20 font-normal px-1.5 py-0 text-[10px] leading-4">
                                                                                            {tag}
                                                                                        </Badge>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                {visibleColumns.status && (
                                                                    <td className="p-4">
                                                                        {client.latestStatus === "No Active Trips" || !client.latestTripId ? (
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 capitalize">
                                                                                {client.latestStatus}
                                                                            </span>
                                                                        ) : (
                                                                            <Select
                                                                                value={client.latestStatus.toLowerCase()}
                                                                                onValueChange={(val) => handleStatusChange(client.id, client.latestTripId, val)}
                                                                            >
                                                                                <SelectTrigger className={`h-8 border-0 shadow-none focus:ring-0 w-[130px] inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${client.latestStatus.toLowerCase() === 'booked' || client.latestStatus.toLowerCase() === 'confirmed' ? 'bg-green-500/10 text-green-400' :
                                                                                    client.latestStatus.toLowerCase() === 'proposed' || client.latestStatus.toLowerCase() === 'sent' ? 'bg-blue-500/10 text-blue-400' :
                                                                                        'bg-purple-500/10 text-purple-400'
                                                                                    }`}>
                                                                                    <SelectValue />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="draft">Draft</SelectItem>
                                                                                    <SelectItem value="proposed">Proposed</SelectItem>
                                                                                    <SelectItem value="sent">Sent</SelectItem>
                                                                                    <SelectItem value="booked">Booked</SelectItem>
                                                                                    <SelectItem value="rejected">Rejected</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                        )}
                                                                    </td>
                                                                )}
                                                                {visibleColumns.destination && (
                                                                    <td className="p-4 text-gray-300">
                                                                        <div className="flex flex-col gap-1.5 py-1">
                                                                            {client.bookedDestinations && client.bookedDestinations.length > 0 ? (
                                                                                client.bookedDestinations.map((dest, idx) => (
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
                                                                {visibleColumns.budget && (
                                                                    <td className="p-4 text-gray-300">{client.latestBudget}</td>
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
                                </>)}

                                {/* Kanban Board View (Active Trips tab only) */}
                                {activeTab === 'trips' && tripsViewMode === 'kanban' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                        {([
                                            { key: 'draft' as const, label: 'Draft', color: 'purple', borderColor: 'border-purple-500/30', bgColor: 'bg-purple-500/10' },
                                            { key: 'proposed' as const, label: 'Proposed', color: 'pink', borderColor: 'border-pink-500/30', bgColor: 'bg-pink-500/10' },
                                            { key: 'sent' as const, label: 'Sent', color: 'blue', borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/10' },
                                            { key: 'booked' as const, label: 'Booked', color: 'green', borderColor: 'border-green-500/30', bgColor: 'bg-green-500/10' },
                                        ]).map(col => (
                                            <div key={col.key} className={`bg-white/5 border ${col.borderColor} rounded-xl p-4 min-h-[300px]`}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const data = e.dataTransfer.getData('text/plain');
                                                    if (data) {
                                                        const { clientId, tripId } = JSON.parse(data);
                                                        handleStatusChange(clientId, tripId, col.key);
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-block w-2 h-2 rounded-full bg-${col.color}-400`} />
                                                        <h3 className="text-sm font-semibold text-gray-300">{col.label}</h3>
                                                    </div>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${col.bgColor} text-${col.color}-400`}>{kanbanColumns[col.key].length}</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {kanbanColumns[col.key].map(client => (
                                                        <div
                                                            key={client.id}
                                                            draggable
                                                            onDragStart={(e) => {
                                                                e.dataTransfer.setData('text/plain', JSON.stringify({ clientId: client.id, tripId: client.latestTripId }));
                                                            }}
                                                            className="p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/20 transition-all cursor-grab active:cursor-grabbing group"
                                                            onClick={() => setSelectedClient(client)}
                                                        >
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <GripVertical className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                <div className={cn("inline-flex w-6 h-6 rounded-full items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br shrink-0", getAvatarColor(client.name))}>
                                                                    {client.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <p className="text-xs font-medium text-white truncate">{client.name}</p>
                                                            </div>
                                                            <div className="ml-[22px] space-y-1">
                                                                <p className="text-[10px] text-gray-500 truncate">{client.latestDestination}</p>
                                                                {client.latestRawBudget > 0 && <p className="text-[10px] text-gray-400">₹{client.latestRawBudget.toLocaleString()}</p>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {kanbanColumns[col.key].length === 0 && (
                                                        <div className="flex items-center justify-center h-20 border-2 border-dashed border-white/5 rounded-lg">
                                                            <p className="text-[10px] text-gray-600">Drop here</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Archive Section (Completed trips) */}
                                {activeTab === 'archive' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-gray-500">{archivedClients.length} completed trip{archivedClients.length !== 1 ? 's' : ''}</p>
                                        </div>
                                        {archivedClients.length === 0 ? (
                                            <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                                                <Archive className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                                <p className="text-gray-500">No completed trips yet.</p>
                                                <p className="text-xs text-gray-600 mt-1">When a trip is marked as "Completed", it will appear here.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {archivedClients.map(client => (
                                                    <div
                                                        key={client.id}
                                                        className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] transition-colors cursor-pointer group"
                                                        onClick={() => setSelectedClient(client)}
                                                    >
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className={cn("inline-flex w-8 h-8 rounded-full items-center justify-center text-xs font-bold text-white bg-gradient-to-br shrink-0", getAvatarColor(client.name))}>
                                                                {client.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-white truncate">{client.name}</p>
                                                                <p className="text-xs text-gray-500">{client.email || 'No email'}</p>
                                                            </div>
                                                            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-400 shrink-0">
                                                                Completed
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                                            <div className="flex items-center gap-1">
                                                                <Compass className="w-3 h-3" />
                                                                <span className="truncate max-w-[120px]">{client.latestDestination}</span>
                                                            </div>
                                                            <span>{client.latestBudget}</span>
                                                            <span className="ml-auto">{client.latestContact}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Client Details Sheet */}
            <Sheet open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
                <SheetContent className="bg-[#0A0A0A] border-l border-white/10 text-white w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">Client Profile</SheetTitle>
                        <SheetDescription className="text-gray-400">
                            Deep profile and trip history for {selectedClient?.name}.
                        </SheetDescription>
                    </SheetHeader>

                    {selectedClient && (
                        <div className="space-y-6">
                            <div className="p-5 glass-main border border-white/10 rounded-xl space-y-4">
                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white bg-gradient-to-br", getAvatarColor(selectedClient.name))}>
                                            {selectedClient.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{selectedClient.name}</p>
                                            <p className="text-sm text-gray-400">Client since {new Date(selectedClient.created_at).getFullYear()}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 border-white/10 bg-transparent text-gray-300 hover:bg-white/10 hover:text-white"
                                        onClick={() => {
                                            setEditingClient(selectedClient);
                                            setIsEditDialogOpen(true);
                                        }}>Edit</Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                                        <p className="font-medium text-sm text-gray-200 break-all">{selectedClient.email || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                                        <p className="font-medium text-sm text-gray-200">{selectedClient.phone || "N/A"}</p>
                                    </div>
                                </div>
                                {selectedClient.notes && (
                                    <div className="pt-2 border-t border-white/10">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                                        <p className="font-medium text-sm text-gray-200 whitespace-pre-wrap">{selectedClient.notes}</p>
                                    </div>
                                )}
                                {selectedClient.tags && selectedClient.tags.length > 0 && (
                                    <div className="pt-2 border-t border-white/10">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Tags</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedClient.tags.map((tag, idx) => (
                                                <Badge key={idx} variant="secondary" className="bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 font-normal px-2 py-0.5 text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Status Audit Trail */}
                            {selectedClient.latestTripId && (statusHistory[selectedClient.latestTripId]?.length ?? 0) > 0 && (
                                <div className="p-5 glass-main border border-white/10 rounded-xl">
                                    <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                        <History className="w-4 h-4 text-blue-400" /> Status History
                                    </h3>
                                    <div className="space-y-2">
                                        {statusHistory[selectedClient.latestTripId!]?.map((entry, idx) => (
                                            <div key={idx} className="flex items-start gap-3 relative">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5" />
                                                    {idx < (statusHistory[selectedClient.latestTripId!]?.length || 0) - 1 && (
                                                        <div className="w-px h-full bg-white/10 min-h-[20px]" />
                                                    )}
                                                </div>
                                                <div className="pb-2">
                                                    <p className="text-xs text-white">
                                                        Status changed to <span className="font-medium text-purple-400 capitalize">{entry.status}</span>
                                                    </p>
                                                    <p className="text-[10px] text-gray-500">
                                                        by {entry.by} · {new Date(entry.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-purple-400" /> Trip History
                                </h3>
                                {selectedClient.allTrips && selectedClient.allTrips.length > 0 ? (
                                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse min-w-[600px]">
                                                <thead>
                                                    <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                                                        <th className="p-3">Status</th>
                                                        <th className="p-3">Destination</th>
                                                        <th className="p-3">Dates</th>
                                                        <th className="p-3">Cost</th>
                                                        <th className="p-3 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {selectedClient.allTrips.map((trip) => {
                                                        const tripCost = getTripCost(trip);
                                                        return (
                                                            <tr key={trip.id} className="hover:bg-white/5 transition-colors group">
                                                                <td className="p-3">
                                                                    <Select
                                                                        value={trip.status.toLowerCase()}
                                                                        onValueChange={(val) => handleStatusChange(selectedClient.id, trip.id, val)}
                                                                    >
                                                                        <SelectTrigger className={`h-7 border-0 shadow-none focus:ring-0 w-[110px] inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${trip.status.toLowerCase() === 'booked' || trip.status.toLowerCase() === 'confirmed' ? 'bg-green-500/10 text-green-400' :
                                                                            trip.status.toLowerCase() === 'proposed' || trip.status.toLowerCase() === 'sent' ? 'bg-blue-500/10 text-blue-400' :
                                                                                'bg-purple-500/10 text-purple-400'
                                                                            }`}>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="draft">Draft</SelectItem>
                                                                            <SelectItem value="proposed">Proposed</SelectItem>
                                                                            <SelectItem value="sent">Sent</SelectItem>
                                                                            <SelectItem value="booked">Booked</SelectItem>
                                                                            <SelectItem value="rejected">Rejected</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </td>
                                                                <td className="p-3">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <Compass className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                                                        {(() => {
                                                                            let label = trip.destinations && trip.destinations !== "" ? trip.destinations : "";
                                                                            if (!label && trip.title) {
                                                                                label = trip.title.replace(/^Trip to\s+/i, "");
                                                                            }
                                                                            if (!label && trip.itinerary_data?.itinerary) {
                                                                                const cities = trip.itinerary_data.itinerary
                                                                                    .map((day: any) => day.areaFocus?.split(',')[0]?.trim())
                                                                                    .filter(Boolean);
                                                                                const uniqueCities = Array.from(new Set(cities));
                                                                                if (uniqueCities.length > 0) {
                                                                                    label = uniqueCities.join(", ");
                                                                                }
                                                                            }
                                                                            if (!label) {
                                                                                label = trip.starting_location;
                                                                            }
                                                                            return <p className="text-xs font-medium text-white line-clamp-1">{label}</p>;
                                                                        })()}
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-500 line-clamp-1 ml-[21px]">
                                                                        {trip.starting_location}{trip.ending_location && trip.ending_location !== trip.starting_location ? ` to ${trip.ending_location}` : ''}
                                                                        {(() => {
                                                                            const start = new Date(trip.start_date);
                                                                            const end = new Date(trip.end_date);
                                                                            const diffTime = Math.abs(end.getTime() - start.getTime());
                                                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                                                            return ` \u2022 ${diffDays}D/${diffDays - 1}N`;
                                                                        })()}
                                                                    </p>
                                                                </td>
                                                                <td className="p-3">
                                                                    <div className="flex flex-col text-[10px] text-gray-400">
                                                                        <span>{new Date(trip.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                                                        <span className="text-gray-600">to {new Date(trip.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-3 text-xs font-medium text-purple-400">
                                                                    {tripCost > 0 ? `\u20B9${tripCost.toLocaleString()}` : "N/A"}
                                                                </td>
                                                                <td className="p-3 text-right">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 text-gray-400 hover:text-white hover:bg-white/10"
                                                                            onClick={() => {
                                                                                setSelectedTripForModal(trip);
                                                                                setShowModal(true);
                                                                            }}
                                                                            title="View Itinerary"
                                                                        >
                                                                            <Eye className="w-3.5 h-3.5" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 text-gray-400 hover:text-white hover:bg-white/10"
                                                                            onClick={() => handleDuplicateTrip(trip)}
                                                                            title="Duplicate Trip"
                                                                        >
                                                                            <Save className="w-3.5 h-3.5" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 text-gray-500 hover:text-red-400 hover:bg-red-400/10"
                                                                            onClick={() => handleDeleteTrip(trip.id)}
                                                                            disabled={deleting === trip.id}
                                                                            title="Delete Trip"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-12 text-center bg-white/5 border border-white/10 rounded-2xl text-gray-500">
                                        <Compass className="w-10 h-10 mx-auto mb-4 opacity-10" />
                                        <p className="text-sm font-medium">No trips planned yet for this client.</p>
                                        <p className="text-xs text-gray-600 mt-1">Start by creating a new itinerary in the AI Architect.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Modal for viewing itinerary */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-[#0A0A0A] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>{selectedTripForModal?.title}</DialogTitle>
                        <DialogDescription className="text-gray-400">{selectedTripForModal?.description}</DialogDescription>
                        <div className="flex items-center gap-4 mt-4">
                            <Select defaultValue="classic" onValueChange={(value) => setSelectedTheme(value as PdfTheme)}>
                                <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Select PDF Format" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="classic">Classic (Default)</SelectItem>
                                    <SelectItem value="editorial">Editorial (Magazine)</SelectItem>
                                    <SelectItem value="minimalist">Minimalist</SelectItem>
                                    <SelectItem value="dark">Dark Mode</SelectItem>
                                    <SelectItem value="corporate">Corporate</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleDownloadPdf} disabled={!selectedTripForModal} className="w-fit bg-white text-black hover:bg-gray-200">
                                <Eye className="mr-2 h-4 w-4" /> Preview & Export
                            </Button>
                        </div>
                    </DialogHeader>
                    {selectedTripForModal && (
                        <div className="mt-4">
                            <ItineraryTimeline
                                itinerary={selectedTripForModal.itinerary_data?.itinerary || []}
                                showDecorations={false}
                                hotels={(selectedTripForModal.itinerary_data as any)?.hotels || []}
                                flights={(selectedTripForModal.itinerary_data as any)?.flights || []}
                            />
                        </div>
                    )}
                    <PdfPreviewEditor
                        isOpen={isPreviewOpen}
                        onOpenChange={setIsPreviewOpen}
                        templateProps={{
                            itinerary: selectedTripForModal?.itinerary_data,
                            title: selectedTripForModal?.title,
                            userProfile: userProfile,
                            hotels: (selectedTripForModal?.itinerary_data as any)?.hotels || [],
                            flights: (selectedTripForModal?.itinerary_data as any)?.flights || [],
                        }}
                        initialTheme={selectedTheme}
                        filename={`${selectedTripForModal?.title || 'Itinerary'}.pdf`}
                    />
                </DialogContent>
            </Dialog>

            <ClientDialog
                isOpen={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                client={editingClient}
                onSave={async (clientData) => {
                    if (editingClient) {
                        // Update client data in Supabase
                        await updateClient(editingClient.id, clientData);

                        // Optimistic UI update for the active sheet and row
                        setEnrichedClients(prev => prev.map(c =>
                            c.id === editingClient.id ? { ...c, ...clientData } : c
                        ));
                        if (selectedClient && selectedClient.id === editingClient.id) {
                            setSelectedClient(prev => prev ? { ...prev, ...clientData } : null);
                        }
                    }
                }}
            />

            {/* Activity Center Sheet */}
            <Sheet open={isActivitySheetOpen} onOpenChange={setIsActivitySheetOpen}>
                <SheetContent className="w-[400px] sm:w-[540px] bg-[#0A0A0A] border-white/10 text-white p-0 flex flex-col">
                    <SheetHeader className="p-6 border-b border-white/10">
                        <SheetTitle className="text-xl flex items-center gap-2">
                            <History className="w-5 h-5 text-purple-400" />
                            Activity Center
                        </SheetTitle>
                        <SheetDescription className="text-gray-400">
                            A complete history of all your CRM events.
                        </SheetDescription>

                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-none">
                            {['all', 'client_added', 'trip_created', 'status_changed'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setActivityFilter(filter)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activityFilter === filter
                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-gray-200'
                                        }`}
                                >
                                    {filter === 'all' && 'All Activity'}
                                    {filter === 'client_added' && 'New Clients'}
                                    {filter === 'trip_created' && 'New Trips'}
                                    {filter === 'status_changed' && 'Status Updates'}
                                </button>
                            ))}
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {allActivity.filter(a => activityFilter === 'all' || a.type === activityFilter).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                                <History className="w-8 h-8 opacity-50" />
                                <p>No activity found for this filter.</p>
                            </div>
                        ) : (
                            allActivity
                                .filter(a => activityFilter === 'all' || a.type === activityFilter)
                                .map((event) => (
                                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className={`p-2 rounded-lg shrink-0 ${event.icon === 'user' ? 'bg-purple-500/10 border border-purple-500/20' :
                                                event.icon === 'plane' ? 'bg-blue-500/10 border border-blue-500/20' :
                                                    'bg-green-500/10 border border-green-500/20'
                                            }`}>
                                            {event.icon === 'user' ? <UserPlus className="w-4 h-4 text-purple-400" /> :
                                                event.icon === 'plane' ? <Plane className="w-4 h-4 text-blue-400" /> :
                                                    <Activity className="w-4 h-4 text-green-400" />}
                                        </div>
                                        <div className="min-w-0 flex-1 pt-0.5">
                                            <p className="text-sm text-gray-200 leading-snug">{event.label}</p>
                                            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                {event.time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {event.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
