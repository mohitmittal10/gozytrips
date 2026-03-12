"use client";

import React, { useState, useEffect } from "react";
import { Users, Calendar, MapPin, CheckCircle2, Clock, ArrowRight, Search, Plus, ListFilter, Compass, FileText, Settings, LayoutDashboard, Send } from "lucide-react";
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
import { Eye } from "lucide-react";
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

    const { clients, loading: clientsLoading, createClient: _createClient, fetchClients } = useClients();
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
                    const latestTrip = clientTrips[0]; // Assuming already ordered by updated_at descending

                    return {
                        ...client,
                        latestStatus: latestTrip?.status || "No Active Trips",
                        latestDestination: latestTrip ? `${latestTrip.starting_location}${latestTrip.ending_location ? ` to ${latestTrip.ending_location}` : ''}` : "N/A",
                        latestBudget: latestTrip?.budget ? `₹${latestTrip.budget.toLocaleString()}` : "N/A",
                        latestRawBudget: latestTrip?.budget || 0,
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
        setEnrichedClients(prev => prev.map(c =>
            c.id === clientId ? { ...c, latestStatus: statusToSave } : c
        ));

        // Also update selected client if sheet is open
        if (selectedClient && selectedClient.id === clientId) {
            setSelectedClient(prev => prev ? { ...prev, latestStatus: statusToSave } : null);
        }

        try {
            const { error } = await supabase
                .from("itineraries")
                .update({ status: statusToSave })
                .eq("id", tripId)
                .eq("user_id", user.id);

            if (error) throw error;

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

    let filteredClients = enrichedClients.filter(
        (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
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

    // Dashboard: no extra filtering — it's an overview showing everything

    // All Clients: filter by client activity
    if (activeTab === 'clients' && clientsActivityFilter !== "all") {
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

    // Dynamic Metrics
    const activeTripsCount = enrichedClients.filter(c =>
        c.latestStatus.toLowerCase() !== "no active trips" &&
        c.latestStatus.toLowerCase() !== "booked" &&
        c.latestStatus.toLowerCase() !== "confirmed" &&
        c.latestStatus.toLowerCase() !== "rejected" &&
        c.latestStatus.toLowerCase() !== "completed"
    ).length;

    const bookedRevenue = enrichedClients.reduce((acc, client) => {
        if (client.latestStatus.toLowerCase() === "booked" || client.latestStatus.toLowerCase() === "confirmed") {
            return acc + (client.latestRawBudget || 0);
        }
        return acc;
    }, 0);

    const proposalsSentCount = enrichedClients.filter(c =>
        c.latestStatus.toLowerCase() === "sent" || c.latestStatus.toLowerCase() === "proposed"
    ).length;

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
                                    {activeTab === 'dashboard' ? 'CRM Overview' : activeTab === 'clients' ? 'Client Management' : activeTab === 'trips' ? 'Trip Pipeline' : activeTab === 'templates' ? 'Templates' : 'Preferences'}
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
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-400 font-medium">Proposals Sent</p>
                                                    <p className="text-3xl font-bold mt-1">{isComputing ? "..." : proposalsSentCount}</p>
                                                </div>
                                                <div className="p-3 bg-indigo-500/20 rounded-lg">
                                                    <Send className="w-6 h-6 text-indigo-400" />
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
                                )}

                                {/* Search and Filter */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            type="text"
                                            placeholder="Search clients..."
                                            className="w-full pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-purple-500"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        {/* Dashboard: no filter dropdown */}

                                        {/* All Clients: filter by activity */}
                                        {activeTab === 'clients' && (
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
                                        )}

                                        {/* Active Trips: filter by pipeline stage */}
                                        {activeTab === 'trips' && (
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
                                        )}
                                    </div>
                                </div>

                                {/* Client List */}
                                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/10 text-sm text-gray-400">
                                                    <th className="p-4 font-medium">Client Info</th>
                                                    <th className="p-4 font-medium">Latest Status</th>
                                                    <th className="p-4 font-medium">Destination</th>
                                                    <th className="p-4 font-medium">Cost of Trip</th>
                                                    <th className="p-4 font-medium">Last Updated</th>
                                                    <th className="p-4 font-medium"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {clientsLoading || isComputing ? (
                                                    <tr>
                                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                                            <div className="animate-pulse flex flex-col items-center gap-2">
                                                                <div className="h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                                                Loading client data...
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : displayClients.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="p-8 text-center text-gray-500 bg-white/5">
                                                            <div className="flex flex-col items-center justify-center py-6">
                                                                <Users className="w-12 h-12 text-gray-600 mb-3" />
                                                                <p>No clients found matching your criteria.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    displayClients.map((client) => (
                                                        <tr key={client.id} className="hover:bg-white/5 transition-colors group">
                                                            <td className="p-4">
                                                                <div>
                                                                    <p className="font-medium text-white">{client.name}</p>
                                                                    <p className="text-sm text-gray-500">{client.email || 'No email provided'}</p>
                                                                </div>
                                                            </td>
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
                                                            <td className="p-4 text-gray-300">
                                                                <div className="flex items-center gap-2">
                                                                    {client.latestDestination !== "N/A" && <Compass className="w-3.5 h-3.5 text-gray-500" />}
                                                                    <span className="truncate max-w-[150px]">{client.latestDestination}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-gray-300">{client.latestBudget}</td>
                                                            <td className="p-4 text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {client.latestContact}
                                                            </td>
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
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Client Details Sheet */}
            <Sheet open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
                <SheetContent className="bg-[#0A0A0A] border-l border-white/10 text-white w-full sm:max-w-md overflow-y-auto">
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
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-lg font-bold">
                                            {selectedClient.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{selectedClient.name}</p>
                                            <p className="text-sm text-gray-400">Client since {new Date(selectedClient.created_at).getFullYear()}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 border-white/10 bg-transparent text-gray-300 hover:bg-white/10 hover:text-white">Edit</Button>
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
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-purple-400" /> Trip History
                                </h3>
                                {selectedClient.allTrips && selectedClient.allTrips.length > 0 ? (
                                    <div className="space-y-4">
                                        {selectedClient.allTrips.map((trip) => (
                                            <TripCard
                                                key={trip.id}
                                                trip={trip as any}
                                                onToggleFavourite={handleToggleFavourite}
                                                onDuplicate={handleDuplicateTrip}
                                                onView={(trip) => {
                                                    setSelectedTripForModal(trip);
                                                    setShowModal(true);
                                                }}
                                                onDelete={handleDeleteTrip}
                                                deletingId={deleting}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-white/5 border border-white/10 rounded-xl text-gray-500">
                                        <Compass className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm">No trips planned yet for this client.</p>
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

        </div>
    );
}
