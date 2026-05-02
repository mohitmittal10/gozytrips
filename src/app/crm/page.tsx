"use client";
import "./crm-responsive.css";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { 
    Users, Calendar, MapPin, CheckCircle2, Clock, ArrowRight, Search, Plus, 
    ListFilter, Compass, FileText, Settings, LayoutDashboard, Send, TrendingUp, 
    Activity, CalendarDays, UserPlus, Plane, ArrowUpDown, ChevronLeft, 
    ChevronRight, Download, Columns3, ArrowUp, ArrowDown, GripVertical, 
    Archive, Save, X, Sliders, LayoutGrid, List, History, DollarSign, 
    Trash2, Shield, Mail, Tag, Car, Bus, Hotel, DownloadCloud, 
    BarChart, Percent, Timer, RefreshCw, HelpCircle, Filter, Ticket, CloudDownload
} from "lucide-react";
import { useReferenceOptions } from "@/hooks/use-reference-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/header";
import { useClients, type Client } from "@/lib/hooks/use-clients";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { logAuditEvent } from "@/lib/audit-logger";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SavedItinerary } from "@/components/trip-card";
import dynamic from "next/dynamic";
const ItineraryTimeline = dynamic(() => import("@/components/itinerary-timeline"), { ssr: false });
const PdfPreviewEditor = dynamic(() => import("@/components/pdf-preview-editor").then(mod => mod.PdfPreviewEditor), { ssr: false });
import { updateItineraryStatus } from "@/lib/services/itinerary-status";
import { type PdfTheme } from "@/components/pdf-template";
import { ClientDialog } from "@/components/client-dialog";
import { getAvatarColor, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
const FinancialTracker = dynamic(() => import("@/components/financial-tracker"), { ssr: false });
import { Eye } from "lucide-react";
import { 
    isBookedTripStatus, 
    computeTopDestinations, 
    computeSeasonalityDepartures, 
    computeDurationBuckets,
    getTripCost,
    type EnrichedClient
} from "./utils/metrics-utils";
import { getCurrencySymbol } from "@/types/financial";
import { DEFAULT_CURRENCY } from "@/types/pricing";
const StandaloneBookingDialog = dynamic(() => import("@/components/standalone-bookings/booking-dialog").then(mod => mod.StandaloneBookingDialog), { ssr: false });
import type { BookingServiceType } from '@/types/standalone-bookings';
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
const FinancesSheet = dynamic(() => import("@/components/finances-sheet").then(mod => mod.FinancesSheet), { ssr: false });
const VendorEnquiry = dynamic(() => import("@/components/vendor-enquiry"), { ssr: false });

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
const CrmSettings = dynamic(() => import("@/components/crm-settings").then(mod => mod.CrmSettings), { ssr: false });
const ImportBackupModal = dynamic(() => import("@/components/import-backup-modal").then(mod => mod.ImportBackupModal), { ssr: false });

// Modularized View Components
import { DashboardView } from "./components/DashboardView";
import { CRMTableView } from "./components/CRMTableView";
import { KanbanView } from "./components/KanbanView";
import { ArchiveView } from "./components/ArchiveView";
import { BookingsView } from "./components/BookingsView";
import { TimelineView } from "./components/TimelineView";
import { FinanceView } from "./components/FinanceView";
import { EnquiryView } from "./components/EnquiryView";
import { EditItineraryView } from "./components/EditItineraryView";
import { ClientProfileSheet } from "./components/ClientProfileSheet";
import { TripsView } from "./components/TripsView";
import { TripDetailSheet, type FlatTrip } from "./components/TripDetailSheet";


// A combined type taking our client and adding the dynamic trip data


export default function CRMLitePage() {
    const { options: itineraryStatuses } = useReferenceOptions('itinerary_status');
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

    // View Trip Sheet State (Trips tab)
    const [selectedFlatTrip, setSelectedFlatTrip] = useState<FlatTrip | null>(null);

    const router = useRouter();
    const [deleting, setDeleting] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedTripForModal, setSelectedTripForModal] = useState<SavedItinerary | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState<PdfTheme>('classic');
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const { userPreferences, updatePreferences, agencySettings, user, userProfile } = useAuth();
    const { options: themeOptions } = useReferenceOptions("pdf_theme");
    const [hasSyncedPreferences, setHasSyncedPreferences] = useState(false);
    
    // Sync with user preferences
    useEffect(() => {
        if (userPreferences && !hasSyncedPreferences) {
            if (userPreferences.default_pdf_theme) {
                setSelectedTheme(userPreferences.default_pdf_theme as PdfTheme);
            }
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
            if (userPreferences.crm_deadline_range) {
                setDeadlineRange(userPreferences.crm_deadline_range);
            }
            setHasSyncedPreferences(true);
        }
    }, [userPreferences, hasSyncedPreferences]);
    const [isFinancesOpen, setIsFinancesOpen] = useState(false);
    const [financesTrip, setFinancesTrip] = useState<SavedItinerary | null>(null);

    // Sidebar Expansion State
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    // Lazy load full itinerary data when a trip is selected for viewing
    useEffect(() => {
        const fetchFullTrip = async () => {
            if (selectedTripForModal && !selectedTripForModal.itinerary_data) {
                try {
                    const { data, error } = await supabase
                        .from('itineraries')
                        .select('*')
                        .eq('id', selectedTripForModal.id)
                        .single();
                    if (!error && data) {
                        setSelectedTripForModal(data as SavedItinerary);
                    }
                } catch (err) {
                    console.error("Error fetching full itinerary data:", err);
                }
            }
        };
        fetchFullTrip();
    }, [selectedTripForModal, supabase]);

    // Standalone Bookings State
    const [bookings, setBookings] = useState<any[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    /** Aggregated from trip_line_items (booked trips) + standalone_bookings net/markup — for dashboard margin */
    const [dashboardFinanceRollup, setDashboardFinanceRollup] = useState({
        tripLineNet: 0,
        tripLineMarkup: 0,
        tripLineGross: 0,
        standaloneNet: 0,
        standaloneMarkup: 0,
        standaloneGross: 0,
    });
    const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
    const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);

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
    const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);
    const [presetName, setPresetName] = useState('');
    const [showPresetSave, setShowPresetSave] = useState(false);

    // Activity Feed State
    const [isActivitySheetOpen, setIsActivitySheetOpen] = useState(false);
    const [activityFilter, setActivityFilter] = useState<string>("all");
    const [lastViewedActivity, setLastViewedActivity] = useState<number>(0);

    // Status audit trail (in-memory for this session, builds from trip data)
    const [statusHistory, setStatusHistory] = useState<Record<string, { status: string; timestamp: string; by: string }[]>>({});

    const { clients, loading: clientsLoading, createClient: _createClient, fetchClients, updateClient } = useClients();
    const { toast } = useToast();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const getAvatarColor = useCallback((name: string) => {
        const colors = [
            'bg-purple-500/20 text-purple-400',
            'bg-blue-500/20 text-blue-400',
            'bg-amber-500/20 text-amber-400',
            'bg-rose-500/20 text-rose-400',
            'bg-emerald-500/20 text-emerald-400',
            'bg-cyan-500/20 text-cyan-400',
            'bg-indigo-500/20 text-indigo-400'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }, []);

    // Track clients by length + ids to avoid re-running enrichment on every render
    const clientsKey = useMemo(() => clients.map(c => c.id).join(','), [clients]);
    
    // DASHBOARD METRICS
    const activeTripsCount = useMemo(() => {
        return enrichedClients.filter(c => 
            c.latestStatus.toLowerCase() !== "no active trips" && 
            c.latestStatus.toLowerCase() !== "completed" && 
            c.latestStatus.toLowerCase() !== "rejected"
        ).length;
    }, [enrichedClients]);

    const bookedCount = useMemo(() => {
        return enrichedClients.filter(c => 
            c.latestStatus.toLowerCase() === "booked" || 
            c.latestStatus.toLowerCase() === "confirmed"
        ).length;
    }, [enrichedClients]);

    const totalProposals = useMemo(() => {
        return enrichedClients.reduce((acc, c) => acc + c.allTrips.length, 0);
    }, [enrichedClients]);

    const conversionRate = useMemo(() => {
        if (totalProposals === 0) return 0;
        return Math.round((bookedCount / totalProposals) * 100);
    }, [bookedCount, totalProposals]);

    const bookedRevenue = useMemo(() => {
        return dashboardFinanceRollup.tripLineGross;
    }, [dashboardFinanceRollup.tripLineGross]);

    const standaloneRevenue = useMemo(() => {
        return dashboardFinanceRollup.standaloneGross;
    }, [dashboardFinanceRollup.standaloneGross]);

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

    const avgBookedTripValue = useMemo(() => {
        if (bookedCount === 0) return 0;
        return (bookedRevenue + standaloneRevenue) / bookedCount;
    }, [bookedCount, bookedRevenue, standaloneRevenue]);

    const blendedMarginPct = useMemo(() => {
        const totalGross = dashboardFinanceRollup.tripLineGross + dashboardFinanceRollup.standaloneGross;
        const totalMarkup = dashboardFinanceRollup.tripLineMarkup + dashboardFinanceRollup.standaloneMarkup;
        if (totalGross === 0) return 0;
        return Math.round((totalMarkup / totalGross) * 100);
    }, [dashboardFinanceRollup]);

    const packageVsStandaloneMix = useMemo(() => {
        const total = dashboardFinanceRollup.tripLineGross + dashboardFinanceRollup.standaloneGross;
        if (total === 0) return { packageRev: 0, standaloneRev: 0, packagePct: 0, standalonePct: 0 };
        return {
            packageRev: dashboardFinanceRollup.tripLineGross,
            standaloneRev: dashboardFinanceRollup.standaloneGross,
            packagePct: Math.round((dashboardFinanceRollup.tripLineGross / total) * 100),
            standalonePct: Math.round((dashboardFinanceRollup.standaloneGross / total) * 100)
        };
    }, [dashboardFinanceRollup]);

    const allBookedTrips = useMemo(() => {
        const list: any[] = [];
        enrichedClients.forEach((c) => {
            c.allTrips.forEach((t: any) => {
                if (isBookedTripStatus(t.status)) list.push(t);
            });
        });
        return list;
    }, [enrichedClients]);

    const topDestinationsChart = useMemo(() => computeTopDestinations(enrichedClients), [enrichedClients]);
    const seasonalityChart = useMemo(() => computeSeasonalityDepartures(enrichedClients), [enrichedClients]);
    const durationBucketsChart = useMemo(() => computeDurationBuckets(enrichedClients), [enrichedClients]);
    const durationMax = useMemo(() => Math.max(1, ...durationBucketsChart.map(b => b.count)), [durationBucketsChart]);

    const departureCalendarStats = useMemo(() => {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        
        const thisMonthCount = enrichedClients.reduce((acc, c) => {
            return acc + c.allTrips.filter(t => {
                if (!t.start_date) return false;
                const d = new Date(t.start_date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && isBookedTripStatus(t.status);
            }).length;
        }, 0);

        const nextMonthCount = enrichedClients.reduce((acc, c) => {
            return acc + c.allTrips.filter(t => {
                if (!t.start_date) return false;
                const d = new Date(t.start_date);
                return d.getMonth() === nextMonth.getMonth() && d.getFullYear() === nextMonth.getFullYear() && isBookedTripStatus(t.status);
            }).length;
        }, 0);

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
            activities.push({
                id: `client-${c.id}`,
                type: 'client_added',
                label: `New client added: ${c.name}`,
                time: new Date(c.created_at),
                icon: 'user'
            });
            c.allTrips.forEach(t => {
                activities.push({
                    id: `trip-${t.id}`,
                    type: 'trip_created',
                    label: `New trip for ${c.name}: ${t.title}`,
                    time: new Date(t.created_at),
                    icon: 'plane'
                });
            });
        });
        return activities.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 50);
    }, [enrichedClients]);

    const unreadActivitiesCount = useMemo(() => {
        return recentActivity.filter(a => a.time.getTime() > lastViewedActivity).length;
    }, [recentActivity, lastViewedActivity]);

    const uniqueTags = useMemo(() => {
        const tags = new Set<string>();
        clients.forEach(c => c.tags?.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [clients]);

    useEffect(() => {
        async function fetchTripsAndCombine() {
            if (!user || clientsLoading) return;
            setIsComputing(true);

            try {
                setDashboardFinanceRollup({
                    tripLineNet: 0,
                    tripLineMarkup: 0,
                    tripLineGross: 0,
                    standaloneNet: 0,
                    standaloneMarkup: 0,
                    standaloneGross: 0,
                });

                // Fetch all itineraries for this user - selecting only required columns to avoid heavy itinerary_data
                const { data: itineraries, error } = await supabase
                    .from("itineraries")
                    .select("id, client_id, title, status, destinations, start_date, end_date, budget, client_price, currency, commission_rate, markup_value, markup_type, tax_percentage, adult_pax, child_pax, infant_pax, created_at, updated_at")
                    .eq("user_id", user.id)
                    .order("updated_at", { ascending: false });

                if (error) throw error;

                // Also fetch standalone bookings
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
                    .filter((t: { status?: string }) => isBookedTripStatus(t.status))
                    .map((t: { id: string }) => t.id);

                let tripLineNet = 0;
                let tripLineMarkup = 0;
                let tripLineGross = 0;
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

                let standaloneNet = 0;
                let standaloneMarkup = 0;
                let standaloneGross = 0;
                (standaloneData || []).forEach((b: { net_cost?: number | null; markup_percentage?: number | null }) => {
                    const net = Number(b.net_cost) || 0;
                    const m = Number(b.markup_percentage) || 0;
                    standaloneNet += net;
                    standaloneMarkup += net * (m / 100);
                    standaloneGross += net * (1 + m / 100);
                });

                setDashboardFinanceRollup({
                    tripLineNet,
                    tripLineMarkup,
                    tripLineGross,
                    standaloneNet,
                    standaloneMarkup,
                    standaloneGross,
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
        }

        fetchTripsAndCombine();
    }, [user?.id, clientsKey, clientsLoading]);

    // Manual refresh: re-fetches clients (which triggers enrichment via clientsKey change)
    const handleRefreshClients = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await fetchClients();
            toast({
                title: "Data Refreshed",
                description: "Client data has been updated from the server.",
            });
        } catch (err) {
            toast({
                title: "Refresh Failed",
                description: "There was an error refreshing client data.",
                variant: "destructive",
            });
        } finally {
            // Small delay so spinner is visible even on fast fetches
            setTimeout(() => setIsRefreshing(false), 400);
        }
    }, [fetchClients, toast]);

    const handleStatusChange = async (clientId: string, tripId: string | undefined, newStatus: string) => {
        if (!user || !tripId) return;

        // Find the old status before updating state
        const client = enrichedClients.find(c => c.id === clientId);
        const tripToUpdate = client?.allTrips.find(t => t.id === tripId);
        const oldStatus = tripToUpdate?.status || "unknown";

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

        // Also update the flat trip sheet if open
        if (selectedFlatTrip && selectedFlatTrip.id === tripId) {
            setSelectedFlatTrip(prev => prev ? { ...prev, status: statusToSave } : null);
        }

        try {
            await updateItineraryStatus(tripId, statusToSave, supabase, user.id, oldStatus);

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

            // Audit log (fire-and-forget)
            if (user) {
                logAuditEvent(user.id, "STATUS_CHANGE", `Trip status changed to ${statusToSave}`, {
                    entityType: "itinerary",
                    entityId: tripId,
                    metadata: { old_status: oldStatus, new_status: statusToSave },
                });
            }

            toast({
                title: "Status Updated",
                description: "The trip status has been successfully changed.",
            });
        } catch (err: any) {
            console.error("Failed to update status:", err);
            // Revert optimistic update on failure
            setEnrichedClients(prev => prev.map(c => {
                if (c.id === clientId) {
                    const revertedTrips = c.allTrips.map(t =>
                        t.id === tripId ? { ...t, status: oldStatus } : t
                    );
                    return { ...c, latestStatus: oldStatus, allTrips: revertedTrips };
                }
                return c;
            }));
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "Could not update the trip status.",
            });
        }
    };

    /**
     * Status change handler for the Trips tab flat view — resolves clientId from enrichedClients.
     */
    const handleTripStatusChange = useCallback(async (tripId: string, newStatus: string) => {
        const ownerClient = enrichedClients.find(c => c.allTrips.some(t => t.id === tripId));
        if (!ownerClient) {
            toast({ variant: "destructive", title: "Error", description: "Could not find the trip's client." });
            return;
        }
        await handleStatusChange(ownerClient.id, tripId, newStatus);
    }, [enrichedClients]);



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

            // Audit log (fire-and-forget)
            if (user) {
                logAuditEvent(user.id, "CREATE_CLIENT", `Client "${newClientName}" was added`, {
                    entityType: "client",
                    metadata: { name: newClientName, email: newClientEmail },
                });
            }

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
    const filteredClients = useMemo(() => {
        return enrichedClients.filter(
            (c) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return c.name.toLowerCase().includes(q)
                    || (c.email && c.email.toLowerCase().includes(q))
                    || (c.phone && c.phone.toLowerCase().includes(q))
                    || (c.latestDestination && c.latestDestination.toLowerCase().includes(q))
                    || (c.notes && c.notes.toLowerCase().includes(q));
            }
        );
    }, [enrichedClients, searchQuery]);

    const displayClients = useMemo(() => {
        let result = filteredClients;

        // Dashboard: no extra filtering — it's an overview showing everything

        // All Clients: filter by client activity
        if (activeTab === 'clients') {
            if (clientsActivityFilter === "has_trips") {
                result = result.filter(c => c.allTrips.length > 0);
            } else if (clientsActivityFilter === "no_trips") {
                result = result.filter(c => c.allTrips.length === 0);
            } else if (clientsActivityFilter === "new_this_month") {
                const now = new Date();
                result = result.filter(c => {
                    const created = new Date(c.created_at);
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                });
            }
            if (clientsTagFilter !== "all") {
                result = result.filter(c => c.tags && c.tags.includes(clientsTagFilter));
            }
        }

        // Active Trips: only show clients with active trips, then filter by pipeline stage
        if (activeTab === 'trips') {
            result = result.filter(c => {
                const s = c.latestStatus.toLowerCase();
                return s !== "no active trips" && s !== "completed" && s !== "rejected";
            });
            if (tripsPipelineFilter !== "all") {
                result = result.filter(c => {
                    const s = c.latestStatus.toLowerCase();
                    const filter = tripsPipelineFilter.toLowerCase();
                    return s === filter || (s === 'confirmed' && filter === 'booked');
                });
            }
        }

        // Date range filter (on latest trip dates)
        if (dateFrom) {
            const from = new Date(dateFrom);
            result = result.filter(c => {
                const tripDate = c.allTrips[0]?.start_date;
                return tripDate && new Date(tripDate) >= from;
            });
        }
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59);
            result = result.filter(c => {
                const tripDate = c.allTrips[0]?.start_date;
                return tripDate && new Date(tripDate) <= to;
            });
        }

        // Budget range filter
        if (budgetMin) {
            const min = parseFloat(budgetMin);
            result = result.filter(c => (c.latestRawBudget || 0) >= min);
        }
        if (budgetMax) {
            const max = parseFloat(budgetMax);
            result = result.filter(c => (c.latestRawBudget || 0) <= max);
        }

        return result;
    }, [filteredClients, activeTab, clientsActivityFilter, clientsTagFilter, tripsPipelineFilter, dateFrom, dateTo, budgetMin, budgetMax]);

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
            // Audit log is also recorded by the database trigger, but we add frontend context
            if (user) {
                logAuditEvent(user.id, "DELETE_TRIP", `Trip deleted from CRM`, {
                    entityType: "itinerary",
                    entityId: id,
                });
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
            setIsRefreshing(true);
            
            const { data: newTrip, error } = await supabase
                .from('itineraries')
                .insert([{
                    user_id: user?.id,
                    title: `Copy of ${trip.title}`,
                    itinerary_data: trip.itinerary_data,
                    status: 'draft',
                    client_id: null,
                    trip_id: `DRF-${Date.now()}`,
                    draft_source_itinerary_id: trip.id,
                    generation_preferences: (trip as any).generation_preferences || {},
                    selected_theme: (trip as any).selected_theme || 'classic',
                    show_timestamps: (trip as any).show_timestamps ?? true,
                    show_prices: (trip as any).show_prices ?? true
                }])
                .select()
                .single();

            if (error) throw error;

            toast({ title: 'Success', description: 'Opening a copy in the AI Architect...' });
            router.push(`/ai-architect?itineraryId=${newTrip.id}`);
        } catch (error: any) {
            console.error(error);
            toast({ title: 'Error', description: error.message || 'Failed to duplicate trip', variant: 'destructive' });
        } finally {
            setIsRefreshing(false);
        }
    };

    /**
     * Duplicate handler that accepts a FlatTrip (used from TripDetailSheet).
     * Defined after handleDuplicateTrip to avoid temporal dead zone.
     */
    const handleDuplicateFlatTrip = useCallback(async (flatTrip: FlatTrip) => {
        await handleDuplicateTrip(flatTrip as unknown as SavedItinerary);
    }, [handleDuplicateTrip]);

    const handleDownloadPdf = () => {
        if (!selectedTripForModal) return;
        setIsPreviewOpen(true);
    };


    // Completed / Archive clients
    const archivedClients = enrichedClients.filter(c =>
        c.latestStatus.toLowerCase() === 'completed'
    );

    // Filter preset helpers
    const saveCurrentPreset = async () => {
        if (!presetName.trim()) return;
        const preset: FilterPreset = {
            name: presetName, searchQuery, clientsActivityFilter, clientsTagFilter,
            tripsPipelineFilter, dateFrom, dateTo, budgetMin, budgetMax
        };
        const updated = [...savedPresets, preset];
        setSavedPresets(updated);
        await updatePreferences({ crm_filter_presets: updated });
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

    const deletePreset = async (idx: number) => {
        const updated = savedPresets.filter((_, i) => i !== idx);
        setSavedPresets(updated);
        await updatePreferences({ crm_filter_presets: updated });
    };

    const clearAllFilters = () => {
        setSearchQuery(''); setClientsActivityFilter('all'); setClientsTagFilter('all');
        setTripsPipelineFilter('all'); setDateFrom(''); setDateTo('');
        setBudgetMin(''); setBudgetMax('');
    };

    const hasActiveFilters = searchQuery || clientsActivityFilter !== 'all' || clientsTagFilter !== 'all' || tripsPipelineFilter !== 'all' || dateFrom || dateTo || budgetMin || budgetMax;

    // Kanban columns
    const kanbanColumns = useMemo(() => {
        const cols: Record<string, EnrichedClient[]> = {};
        
        // Use authoritative statuses for columns if available, fallback to defaults
        const targetStatuses = itineraryStatuses.length > 0 
            ? itineraryStatuses.filter(opt => ['draft', 'proposed', 'sent', 'booked'].includes(opt.value)).map(opt => opt.value)
            : ['draft', 'proposed', 'sent', 'booked'];
            
        targetStatuses.forEach(status => {
            cols[status] = [];
        });

        enrichedClients.forEach(c => {
            let s = c.latestStatus.toLowerCase();
            if (s === 'confirmed') s = 'booked';
            
            if (cols[s]) {
                cols[s].push(c);
            }
        });
        return cols;
    }, [enrichedClients, itineraryStatuses]);

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [activeTab, clientsActivityFilter, clientsTagFilter, tripsPipelineFilter, searchQuery, dateFrom, dateTo, budgetMin, budgetMax]);

    // Sort displayClients
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
        // Audit log the export action
        if (user) {
            logAuditEvent(user.id, "EXPORT_CSV", `Exported ${targets.length} client(s) to CSV`, {
                entityType: "client",
                metadata: { count: targets.length },
            });
        }

        toast({ title: 'Export', description: `Exported ${targets.length} client(s).` });
    };

    const toggleColumn = async (col: string) => {
        const next = { ...visibleColumns, [col]: !visibleColumns[col as keyof typeof visibleColumns] };
        setVisibleColumns(next);
        await updatePreferences({ crm_visible_columns: next });
    };



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


    const handleOpenActivitySheet = async () => {
        setIsActivitySheetOpen(true);
        const now = Date.now();
        setLastViewedActivity(now);
        await updatePreferences({ crm_last_viewed_activity_at: new Date(now).toISOString() });
    };

    return (
        <div className="crm-page">
            <Header />
            <div className="crm-container">
                <div className="crm-layout">

                    {/* Glassmorphism Icon Sidebar */}
                    <div className={cn(
                        "hidden lg:flex flex-col shrink-0 sticky top-24 self-start transition-all duration-300 z-40",
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
                                <Button onClick={() => setActiveTab('dashboard')} variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'} className={cn("w-full justify-start h-10 px-3 hover:bg-white/10 transition-all group", activeTab === 'dashboard' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white", isSidebarExpanded ? "" : "w-10 px-0 justify-center")}>
                                    <LayoutDashboard className={cn("w-4 h-4 shrink-0", activeTab === 'dashboard' ? "text-purple-400" : "text-gray-500 group-hover:text-purple-400")} />
                                    {isSidebarExpanded && <span className="ml-3 text-sm font-medium">Dashboard</span>}
                                </Button>
                                <Button onClick={() => setActiveTab('clients')} variant={activeTab === 'clients' ? 'secondary' : 'ghost'} className={cn("w-full justify-start h-10 px-3 hover:bg-white/10 transition-all group", activeTab === 'clients' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white", isSidebarExpanded ? "" : "w-10 px-0 justify-center")}>
                                    <Users className={cn("w-4 h-4 shrink-0", activeTab === 'clients' ? "text-purple-400" : "text-gray-500 group-hover:text-purple-400")} />
                                    {isSidebarExpanded && <span className="ml-3 text-sm font-medium">Clients</span>}
                                </Button>
                                <Button onClick={() => setActiveTab('trips')} variant={activeTab === 'trips' ? 'secondary' : 'ghost'} className={cn("w-full justify-start h-10 px-3 hover:bg-white/10 transition-all group", activeTab === 'trips' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white", isSidebarExpanded ? "" : "w-10 px-0 justify-center")}>
                                    <TrendingUp className={cn("w-4 h-4 shrink-0", activeTab === 'trips' ? "text-purple-400" : "text-gray-500 group-hover:text-purple-400")} />
                                    {isSidebarExpanded && <span className="ml-3 text-sm font-medium">Trips</span>}
                                </Button>
                                <Button onClick={() => setActiveTab('bookings')} variant={activeTab === 'bookings' ? 'secondary' : 'ghost'} className={cn("w-full justify-start h-10 px-3 hover:bg-white/10 transition-all group", activeTab === 'bookings' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white", isSidebarExpanded ? "" : "w-10 px-0 justify-center")}>
                                    <Ticket className={cn("w-4 h-4 shrink-0", activeTab === 'bookings' ? "text-purple-400" : "text-gray-500 group-hover:text-purple-400")} />
                                    {isSidebarExpanded && <span className="ml-3 text-sm font-medium">Bookings</span>}
                                </Button>
                                <Button onClick={() => setActiveTab('timeline')} variant={activeTab === 'timeline' ? 'secondary' : 'ghost'} className={cn("w-full justify-start h-10 px-3 hover:bg-white/10 transition-all group", activeTab === 'timeline' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white", isSidebarExpanded ? "" : "w-10 px-0 justify-center")}>
                                    <Calendar className={cn("w-4 h-4 shrink-0", activeTab === 'timeline' ? "text-purple-400" : "text-gray-500 group-hover:text-purple-400")} />
                                    {isSidebarExpanded && <span className="ml-3 text-sm font-medium">Timeline</span>}
                                </Button>
                                <Button onClick={() => setActiveTab('finance')} variant={activeTab === 'finance' ? 'secondary' : 'ghost'} className={cn("w-full justify-start h-10 px-3 hover:bg-white/10 transition-all group", activeTab === 'finance' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white", isSidebarExpanded ? "" : "w-10 px-0 justify-center")}>
                                    <DollarSign className={cn("w-4 h-4 shrink-0", activeTab === 'finance' ? "text-purple-400" : "text-gray-500 group-hover:text-purple-400")} />
                                    {isSidebarExpanded && <span className="ml-3 text-sm font-medium">Finances</span>}
                                </Button>
                                <Button onClick={() => setActiveTab('enquiry')} variant={activeTab === 'enquiry' ? 'secondary' : 'ghost'} className={cn("w-full justify-start h-10 px-3 hover:bg-white/10 transition-all group", activeTab === 'enquiry' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white", isSidebarExpanded ? "" : "w-10 px-0 justify-center")}>
                                    <Mail className={cn("w-4 h-4 shrink-0", activeTab === 'enquiry' ? "text-purple-400" : "text-gray-500 group-hover:text-purple-400")} />
                                    {isSidebarExpanded && <span className="ml-3 text-sm font-medium">Enquiry</span>}
                                </Button>
                                <Button onClick={() => setActiveTab('archive')} variant={activeTab === 'archive' ? 'secondary' : 'ghost'} className={cn("w-full justify-start h-10 px-3 hover:bg-white/10 transition-all group", activeTab === 'archive' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white", isSidebarExpanded ? "" : "w-10 px-0 justify-center")}>
                                    <Archive className={cn("w-4 h-4 shrink-0", activeTab === 'archive' ? "text-purple-400" : "text-gray-500 group-hover:text-purple-400")} />
                                    {isSidebarExpanded && <span className="ml-3 text-sm font-medium">Archive</span>}
                                </Button>
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
                    <div className="lg:hidden block sticky top-16 z-30 mb-6 -mx-2 -mt-4 bg-[#0A0A0B]/80 backdrop-blur-md">
                        <div className="premium-nav-mask px-4 relative overflow-hidden">
                            <div className="flex overflow-x-auto crm-nav-scroll py-4 gap-2 no-scrollbar">
                                {[
                                    { id: 'dashboard', icon: LayoutDashboard, label: 'Dash' },
                                    { id: 'clients', icon: Users, label: 'Clients' },
                                    { id: 'trips', icon: TrendingUp, label: 'Trips' },
                                    { id: 'bookings', icon: Ticket, label: 'Book' },
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
                    <div className="crm-main-content p-4 sm:p-6 lg:p-8">
                        {/* Header View Portion */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                                    {activeTab === 'dashboard' && <LayoutDashboard className="w-8 h-8 text-purple-400" />}
                                    {activeTab === 'clients' && <Users className="w-8 h-8 text-purple-400" />}
                                    {activeTab === 'trips' && <Compass className="w-8 h-8 text-purple-400" />}
                                    {activeTab === 'bookings' && <Ticket className="w-8 h-8 text-purple-400" />}
                                    {activeTab === 'archive' && <Archive className="w-8 h-8 text-purple-400" />}
                                    {activeTab === 'finance' && <DollarSign className="w-8 h-8 text-purple-400" />}
                                    {activeTab === 'enquiry' && <HelpCircle className="w-8 h-8 text-purple-400" />}
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
                                        if (activeTab === 'bookings') setIsBookingDialogOpen(true);
                                        else setIsAddClientOpen(true);
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
                            {activeTab === 'dashboard' && (
                                <DashboardView 
                                    agencySettings={agencySettings}
                                    clients={clients}
                                    clientsLoading={clientsLoading}
                                    enrichedClients={enrichedClients}
                                    itineraryStatuses={itineraryStatuses}
                                    activeTripsCount={activeTripsCount}
                                    conversionRate={conversionRate}
                                    bookedCount={bookedCount}
                                    totalProposals={totalProposals}
                                    bookedRevenue={bookedRevenue}
                                    standaloneRevenue={standaloneRevenue}
                                    bookings={bookings}
                                    bookingsCount={bookings.length}
                                    newClientsThisMonth={newClientsThisMonth}
                                    repeatClientStats={repeatClientStats}
                                    avgBookedTripValue={avgBookedTripValue}
                                    blendedMarginPct={blendedMarginPct}
                                    packageVsStandaloneMix={packageVsStandaloneMix}
                                    departureCalendarStats={departureCalendarStats}
                                    topDestinationsChart={topDestinationsChart}
                                    seasonalityChart={seasonalityChart}
                                    durationBucketsChart={durationBucketsChart}
                                    durationMax={durationMax}
                                    revenueByMonth={revenueByMonth}
                                    recentActivity={recentActivity}
                                    unreadActivitiesCount={unreadActivitiesCount}
                                    handleOpenActivitySheet={handleOpenActivitySheet}
                                    isComputing={isComputing}
                                />
                            )}

                            {activeTab === 'enquiry' && <EnquiryView />}
                            {activeTab === 'bookings' && (
                                <BookingsView
                                    bookings={bookings}
                                    bookingsLoading={bookingsLoading}
                                    setIsBookingDialogOpen={setIsBookingDialogOpen}
                                    setBookings={setBookings}
                                    user={user}
                                />
                            )}
                            {activeTab === 'settings' && <CrmSettings />}
                            {activeTab === 'timeline' && (
                                <TimelineView
                                    enrichedClients={enrichedClients}
                                    hasTrips={enrichedClients.some(c => c.allTrips.length > 0)}
                                    selectedTheme={selectedTheme}
                                    setSelectedTheme={setSelectedTheme}
                                    selectedTripForModal={selectedTripForModal}
                                    setSelectedTripForModal={setSelectedTripForModal}
                                    handleDownloadPdf={handleDownloadPdf}
                                />
                            )}
                            {activeTab === 'edit-itinerary' && (
                                <EditItineraryView
                                    itineraryStatuses={itineraryStatuses}
                                    setSelectedTripForModal={setSelectedTripForModal}
                                    setShowModal={setShowModal}
                                    handleDuplicateTrip={handleDuplicateTrip}
                                    handleDeleteTrip={handleDeleteTrip}
                                    deleting={deleting}
                                />
                            )}
                            {activeTab === 'finance' && (
                                <FinanceView
                                    enrichedClients={enrichedClients}
                                    user={user}
                                    userProfile={userProfile}
                                    setFinancesTrip={setFinancesTrip}
                                    setIsFinancesOpen={setIsFinancesOpen}
                                />
                            )}

                            {/* Clients / Trips / Archive Views (Shared Table/Kanban logic) */}
                            {(activeTab === 'clients' || activeTab === 'trips' || activeTab === 'archive') && (
                                <div className="space-y-6">
                                    {/* Responsive Modern Filter Block */}
                                    <div className="bg-[#13131A]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 lg:p-5 shadow-lg relative overflow-hidden">
                                        {/* Subtle gradient background effect */}
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                                        {/* Primary Search row */}
                                        <div className="flex flex-col lg:flex-row gap-4 relative z-10 w-full mb-4">
                                            {/* Unified Search Input */}
                                            <div className="relative flex-1 w-full min-w-0">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                                                <Input
                                                    placeholder={activeTab === 'clients' ? "Search clients by name, email, phone, tags..." : "Search trips, destinations, notes..."}
                                                    className="w-full pl-11 h-12 bg-black/40 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-purple-500/50 rounded-xl shadow-inner text-sm transition-all hover:bg-black/60 focus:bg-black/80"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>

                                            {/* Primary Actions (Right side of search) */}
                                            <div className="flex flex-wrap items-center gap-3 shrink-0">
                                                {activeTab === 'clients' && (
                                                    <Select value={clientsActivityFilter} onValueChange={setClientsActivityFilter}>
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
                                                        <Select value={tripsPipelineFilter} onValueChange={setTripsPipelineFilter}>
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
                                                        
                                                        {/* Trips View Toggle */}
                                                        <div className="flex border border-white/10 rounded-xl overflow-hidden h-12 bg-white/5">
                                                            <button
                                                                onClick={() => setTripsViewMode('table')}
                                                                className={cn("px-4 transition-colors flex items-center justify-center", tripsViewMode === 'table' ? "bg-purple-500/20 text-purple-400 font-medium" : "text-gray-500 hover:text-white hover:bg-white/5")}
                                                                title="List View"
                                                            >
                                                                <List className="w-[18px] h-[18px]" />
                                                            </button>
                                                            <div className="w-px h-full bg-white/10" />
                                                            <button
                                                                onClick={() => setTripsViewMode('kanban')}
                                                                className={cn("px-4 transition-colors flex items-center justify-center", tripsViewMode === 'kanban' ? "bg-purple-500/20 text-purple-400 font-medium" : "text-gray-500 hover:text-white hover:bg-white/5")}
                                                                title="Kanban Board"
                                                            >
                                                                <LayoutGrid className="w-[18px] h-[18px]" />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}

                                                <Button
                                                    variant="outline"
                                                    onClick={handleRefreshClients}
                                                    disabled={isRefreshing || clientsLoading}
                                                    className="border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white h-12 px-4 rounded-xl shrink-0"
                                                >
                                                    <RefreshCw className={cn("w-4 h-4", (isRefreshing || clientsLoading) ? "animate-spin" : "mr-2")} />
                                                    <span className="hidden sm:inline">Refresh</span>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />

                                        {/* Advanced Filters & Tags Row */}
                                        <div className="flex flex-col xl:flex-row justify-between gap-4 relative z-10 w-full pb-1">
                                            {/* Left: Tags (Only active on Clients) */}
                                            <div className="flex-1 overflow-hidden min-w-0 flex items-center">
                                                {activeTab === 'clients' && uniqueTags.length > 0 && (
                                                    <div 
                                                        className="flex gap-2 w-full overflow-x-auto no-scrollbar items-center px-4 -mx-4 py-1"
                                                        style={{
                                                            WebkitMaskImage: 'linear-gradient(to right, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)',
                                                            maskImage: 'linear-gradient(to right, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)'
                                                        }}
                                                    >
                                                        <span className="text-xs text-gray-500 uppercase tracking-wider mr-2 font-medium shrink-0 flex items-center"><Tag className="w-3 h-3 mr-1" /> Tags</span>
                                                        <button
                                                            onClick={(e) => {
                                                                setClientsTagFilter('all');
                                                                e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                                                            }}
                                                            className={cn(
                                                                "px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap shrink-0",
                                                                clientsTagFilter === 'all'
                                                                    ? "bg-purple-500 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                                                                    : "bg-white/5 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10"
                                                            )}
                                                        >
                                                            All
                                                        </button>
                                                        {uniqueTags.map(tag => (
                                                            <button
                                                                key={tag}
                                                                onClick={(e) => {
                                                                    setClientsTagFilter(tag);
                                                                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                                                                }}
                                                                className={cn(
                                                                    "px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap shrink-0",
                                                                    clientsTagFilter === tag
                                                                        ? "bg-purple-500 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                                                                        : "bg-white/5 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10"
                                                                )}
                                                            >
                                                                {tag}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* If not clients, just show a label for advanced filters if needed or leave structural space */}
                                                {(activeTab === 'trips' || activeTab === 'archive') && (
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium flex items-center"><Sliders className="w-3 h-3 mr-1" /> Advanced Filters</span>
                                                )}
                                            </div>

                                            {/* Right: Dates, Budget, Presets */}
                                            <div className="flex flex-wrap items-center gap-4 xl:gap-3 shrink-0">
                                                {/* Dates */}
                                                <div className="flex items-center bg-black/20 border border-white/10 rounded-lg h-9 px-1">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-500 ml-2 mr-1" />
                                                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-full px-2 text-[11px] sm:text-xs bg-transparent text-gray-300 focus:outline-none placeholder-gray-600 [&::-webkit-calendar-picker-indicator]:invert-[0.6] w-[110px]" />
                                                    <span className="text-gray-600 text-[10px] mx-1">to</span>
                                                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-full px-2 text-[11px] sm:text-xs bg-transparent text-gray-300 focus:outline-none placeholder-gray-600 [&::-webkit-calendar-picker-indicator]:invert-[0.6] w-[110px]" />
                                                </div>

                                                {/* Budget */}
                                                <div className="flex items-center bg-black/20 border border-white/10 rounded-lg h-9 px-1">
                                                    <DollarSign className="w-3.5 h-3.5 text-gray-500 ml-2 mr-1" />
                                                    <input type="number" placeholder="Min Budget" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} className="w-[75px] h-full px-1 text-[11px] sm:text-xs bg-transparent text-gray-300 placeholder:text-gray-600 focus:outline-none text-right" />
                                                    <span className="text-gray-600 text-[12px] mx-1.5">-</span>
                                                    <input type="number" placeholder="Max" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} className="w-[60px] h-full px-1 text-[11px] sm:text-xs bg-transparent text-gray-300 placeholder:text-gray-600 focus:outline-none" />
                                                </div>

                                                {/* Saved Presets */}
                                                <div className="flex items-center gap-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-9 border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white px-3 rounded-lg">
                                                                <Save className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                                                                Presets {savedPresets.length > 0 && <span className="ml-1 bg-purple-500/20 text-purple-400 text-[10px] px-1.5 rounded-full">{savedPresets.length}</span>}
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-white/10 text-white w-64 p-1 rounded-xl shadow-2xl overflow-hidden">
                                                            <DropdownMenuLabel className="text-xs font-semibold text-gray-400 px-2 py-1.5 uppercase tracking-wider">Saved Filters</DropdownMenuLabel>
                                                            <div className="h-px bg-white/10 my-1 mx-2" />
                                                            {savedPresets.length === 0 ? (
                                                                <div className="px-3 py-4 text-center text-xs text-gray-500">No saved presets</div>
                                                            ) : (
                                                                <div className="max-h-48 overflow-y-auto no-scrollbar space-y-0.5 px-1">
                                                                    {savedPresets.map((p, idx) => (
                                                                        <div key={idx} className="flex items-center justify-between px-2 py-2 hover:bg-white/5 rounded-lg cursor-pointer group transition-colors">
                                                                            <button onClick={() => applyPreset(p)} className="text-xs text-gray-200 flex-1 text-left truncate pr-2 font-medium">{p.name}</button>
                                                                            <button onClick={(e) => { e.stopPropagation(); deletePreset(idx); }} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity p-1 bg-transparent hover:bg-red-400/10 rounded">
                                                                                <X className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div className="h-px bg-white/10 my-1 mx-2" />
                                                            {showPresetSave ? (
                                                                <div className="p-2 pt-1 flex flex-col gap-2">
                                                                    <div className="flex gap-1">
                                                                        <input
                                                                            type="text" placeholder="Preset name..."
                                                                            value={presetName} onChange={e => setPresetName(e.target.value)}
                                                                            onKeyDown={e => e.key === 'Enter' && saveCurrentPreset()}
                                                                            className="flex-1 h-8 px-2.5 text-xs bg-black/40 border border-white/10 rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50"
                                                                            autoFocus
                                                                        />
                                                                        <Button size="sm" className="h-8 px-3 text-xs bg-purple-500 hover:bg-purple-600 rounded-md" onClick={saveCurrentPreset}>Save</Button>
                                                                    </div>
                                                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-gray-500 hover:text-gray-300" onClick={() => setShowPresetSave(false)}>Cancel</Button>
                                                                </div>
                                                            ) : (
                                                                <div className="p-1">
                                                                    <button onClick={() => setShowPresetSave(true)} className="w-full text-left px-2 py-2 text-xs text-purple-400 hover:bg-white/5 rounded-lg font-medium flex items-center transition-colors">
                                                                        <Plus className="w-3.5 h-3.5 mr-1" /> Save current filters
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>

                                                    {hasActiveFilters && (
                                                        <Button variant="ghost" size="sm" className="h-9 px-3 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors" onClick={clearAllFilters}>
                                                            <X className="w-3.5 h-3.5 mr-1" /> Clear
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* View Content */}
                                    {activeTab === 'archive' ? (
                                        <ArchiveView
                                            archivedClients={archivedClients}
                                            setSelectedClient={setSelectedClient}
                                            getAvatarColor={getAvatarColor}
                                        />
                                    ) : activeTab === 'trips' ? (
                                        /* Trips tab: show individual trips, not clients */
                                        <TripsView
                                            enrichedClients={enrichedClients}
                                            tripsPipelineFilter={tripsPipelineFilter}
                                            searchQuery={searchQuery}
                                            viewMode={tripsViewMode}
                                            itineraryStatuses={itineraryStatuses}
                                            loading={clientsLoading || isComputing}
                                            onTripClick={setSelectedFlatTrip}
                                            onStatusChange={handleTripStatusChange}
                                        />
                                    ) : (
                                        <CRMTableView
                                            clients={paginatedClients}
                                            clientsLoading={clientsLoading}
                                            isComputing={isComputing}
                                            itineraryStatuses={itineraryStatuses}
                                            selectedIds={selectedIds}
                                            toggleSelectAll={toggleSelectAll}
                                            toggleSelectOne={toggleSelectOne}
                                            visibleColumns={visibleColumns}
                                            toggleColumn={toggleColumn}
                                            handleSort={handleSort}
                                            sortConfig={sortConfig}
                                            sortDirection={sortConfig?.direction}
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            setCurrentPage={setCurrentPage}
                                            setSelectedClient={setSelectedClient}
                                            handleBulkStatusChange={handleBulkStatusChange}
                                            handleExportCSV={handleExportCSV}
                                            totalCount={sortedClients.length}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ClientProfileSheet
                selectedClient={selectedClient}
                setSelectedClient={setSelectedClient}
                statusHistory={statusHistory}
                itineraryStatuses={itineraryStatuses}
                handleStatusChange={handleStatusChange}
                handleDuplicateTrip={handleDuplicateTrip}
                handleDeleteTrip={handleDeleteTrip}
                deleting={deleting}
                setEditingClient={setEditingClient}
                setIsEditDialogOpen={setIsEditDialogOpen}
                setShowModal={setShowModal}
                setSelectedTripForModal={setSelectedTripForModal}
                getAvatarColor={getAvatarColor}
                getTripCost={getTripCost}
            />

            {/* Trip Detail Sheet — opened from Trips tab */}
            <TripDetailSheet
                trip={selectedFlatTrip}
                onClose={() => setSelectedFlatTrip(null)}
                itineraryStatuses={itineraryStatuses}
                onStatusChange={handleTripStatusChange}
                onViewItinerary={(flatTrip) => {
                    setSelectedTripForModal(flatTrip as unknown as SavedItinerary);
                    setShowModal(true);
                }}
                onDuplicate={handleDuplicateFlatTrip}
                onDelete={async (tripId) => {
                    await handleDeleteTrip(tripId);
                    setSelectedFlatTrip(null);
                }}
                deleting={deleting}
            />

            {/* Modal for viewing itinerary */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-[#0A0A0A] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>{selectedTripForModal?.title}</DialogTitle>
                        <DialogDescription className="text-gray-400">{selectedTripForModal?.description}</DialogDescription>
                        <div className="flex items-center gap-4 mt-4">
                            <Select 
                                value={selectedTheme} 
                                onValueChange={async (value) => {
                                    const newTheme = value as PdfTheme;
                                    setSelectedTheme(newTheme);
                                    await updatePreferences({ default_pdf_theme: newTheme });
                                    if (selectedTripForModal) {
                                        await supabase
                                            .from('itineraries')
                                            .update({ selected_theme: newTheme })
                                            .eq('id', selectedTripForModal.id);
                                    }
                                }}
                            >
                                <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Select PDF Format" />
                                </SelectTrigger>
                                <SelectContent>
                                    {themeOptions.length > 0 ? (
                                        themeOptions.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))
                                    ) : (
                                        <>
                                            <SelectItem value="classic">Classic (Default)</SelectItem>
                                            <SelectItem value="editorial">Editorial (Magazine)</SelectItem>
                                            <SelectItem value="minimalist">Minimalist</SelectItem>
                                            <SelectItem value="dark">Dark Mode</SelectItem>
                                            <SelectItem value="corporate">Corporate</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleDownloadPdf} disabled={!selectedTripForModal} className="w-fit bg-white text-black hover:bg-gray-200">
                                <Eye className="mr-2 h-4 w-4" /> Preview & Export
                            </Button>
                        </div>
                    </DialogHeader>
                    {selectedTripForModal && (
                        <div className="space-y-4">
                            <ItineraryTimeline
                                itinerary={selectedTripForModal.itinerary_data?.itinerary || []}
                                editable={false}
                                showDecorations={true}
                                showPrices={true}
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
                            agencySettings: agencySettings,
                            hotels: (selectedTripForModal?.itinerary_data as any)?.hotels || [],
                            flights: (selectedTripForModal?.itinerary_data as any)?.flights || [],
                        }}
                        initialTheme={selectedTheme}
                        itineraryId={selectedTripForModal?.id}
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
                        {recentActivity.filter(a => activityFilter === 'all' || a.type === activityFilter).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                                <History className="w-8 h-8 opacity-50" />
                                <p>No activity found for this filter.</p>
                            </div>
                        ) : (
                            recentActivity
                                .filter(a => activityFilter === 'all' || a.type === activityFilter)
                                .map((event) => (
                                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className={`p-2 rounded-lg shrink-0 ${event.icon === 'user' ? 'bg-purple-500/10 border border-purple-500/20' :
                                                event.icon === 'plane' ? 'bg-blue-500/10 border border-blue-500/20' :
                                                    'bg-green-500/10 border border-green-500/20'
                                            }`}>
                                            {event.icon === 'user' ? <UserPlus className="w-4 h-4 text-purple-400" /> :
                                                event.icon === 'plane' ? <Plane className="w-4 h-4 text-blue-400" /> :
                                                    <Activity className="w-4 h-4 text-amber-400" />}
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

            <FinancesSheet
                isOpen={isFinancesOpen}
                onOpenChange={setIsFinancesOpen}
                trip={financesTrip}
            />

            <ImportBackupModal 
                isDataEmpty={!clientsLoading && !isComputing && clients.length === 0} 
                onImportSuccess={() => fetchClients()} 
                isOpen={isImportModalOpen}
                onOpenChange={setIsImportModalOpen}
            />
        </div>
    );
}
