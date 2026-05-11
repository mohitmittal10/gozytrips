"use client";

import React, { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useCrmContext } from "../context/CrmContext";
import { useClients } from "@/lib/hooks/use-clients";
import { useAuth } from "@/contexts/auth-context";
import { useReferenceOptions } from "@/hooks/use-reference-options";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getAvatarColor } from "@/lib/utils";
import { getTripCost } from "../utils/metrics-utils";
import { History, UserPlus, Plane, Activity, Clock, Eye } from "lucide-react";

import type { SavedItinerary } from "@/components/trip-card";
import type { PdfTheme } from "@/components/pdf-template";
import type { FlatTrip } from "./TripDetailSheet";

import { ClientProfileSheet } from "./ClientProfileSheet";
import { TripDetailSheet } from "./TripDetailSheet";
import { ClientDialog } from "@/components/client-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ItineraryTimeline = dynamic(() => import("@/components/itinerary-timeline"), { ssr: false });
const PdfPreviewEditor = dynamic(() => import("@/components/pdf-preview-editor").then(mod => mod.PdfPreviewEditor), { ssr: false });
const FinancesSheet = dynamic(() => import("@/components/finances-sheet").then(mod => mod.FinancesSheet), { ssr: false });
const ImportBackupModal = dynamic(() => import("@/components/import-backup-modal").then(mod => mod.ImportBackupModal), { ssr: false });
const StandaloneBookingDialog = dynamic(() => import("@/components/standalone-bookings/booking-dialog").then(mod => mod.StandaloneBookingDialog), { ssr: false });
const BookingDetailSheet = dynamic(() => import("./BookingDetailSheet").then(mod => mod.BookingDetailSheet), { ssr: false });

export function CrmModals() {
    const context = useCrmContext();
    const { 
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
        isAddClientOpen, setIsAddClientOpen,
        isActivitySheetOpen, setIsActivitySheetOpen,
        deleting, deletingBookingId, data
    } = context;

    const { options: itineraryStatuses } = useReferenceOptions('itinerary_status');
    const { options: themeOptions } = useReferenceOptions("pdf_theme");
    const { updateClient, createClient: _createClient, fetchClients } = useClients();
    const { user, userProfile, agencySettings, updatePreferences } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const supabase = createSupabaseClient();
    
    // Status history is mostly an in-memory audit trail, we can keep it local to Modals for now
    const [statusHistory, setStatusHistory] = useState<Record<string, { status: string; timestamp: string; by: string }[]>>({});
    const [isRefreshing, setIsRefreshing] = useState(false);

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
            toast({ title: 'Success', description: 'Opening a copy in the The Lab...' });
            router.push(`/the-lab?itineraryId=${newTrip.id}`);
        } catch (error: any) {
            console.error(error);
            toast({ title: 'Error', description: error.message || 'Failed to duplicate trip', variant: 'destructive' });
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleDownloadPdf = () => {
        if (!selectedTripForModal) return;
        setIsPreviewOpen(true);
    };

    const handleTripStatusChange = useCallback(async (tripId: string, newStatus: string) => {
        const ownerClient = data.data.enrichedClients.find(c => c.allTrips.some(t => t.id === tripId));
        if (!ownerClient) {
            toast({ variant: "destructive", title: "Error", description: "Could not find the trip's client." });
            return;
        }
        await data.actions.handleStatusChange(ownerClient.id, tripId, newStatus);
    }, [data.data.enrichedClients, data.actions]);

    const selectedClientForBooking = React.useMemo(() => {
        if (!selectedBooking || !selectedBooking.client_id) return null;
        return data.data.clients.find(c => c.id === selectedBooking.client_id) || null;
    }, [selectedBooking, data.data.clients]);

    return (
        <>
            <ClientProfileSheet
                selectedClient={selectedClient}
                setSelectedClient={setSelectedClient}
                statusHistory={statusHistory}
                itineraryStatuses={itineraryStatuses}
                handleStatusChange={data.actions.handleStatusChange}
                handleDuplicateTrip={handleDuplicateTrip}
                handleDeleteTrip={(id) => data.actions.handleDeleteTrip(id, () => {
                    setSelectedClient(prev => prev ? { ...prev, allTrips: prev.allTrips.filter(t => t.id !== id) } : null);
                })}
                deleting={deleting}
                setEditingClient={setEditingClient}
                setIsEditDialogOpen={setIsEditDialogOpen}
                setShowModal={setShowModal}
                setSelectedTripForModal={setSelectedTripForModal}

                getTripCost={getTripCost}
            />

            <TripDetailSheet
                trip={selectedFlatTrip}
                onClose={() => setSelectedFlatTrip(null)}
                itineraryStatuses={itineraryStatuses}
                onStatusChange={handleTripStatusChange}
                onViewItinerary={(flatTrip) => {
                    setSelectedTripForModal(flatTrip as unknown as SavedItinerary);
                    setShowModal(true);
                }}
                onDuplicate={async (flatTrip) => await handleDuplicateTrip(flatTrip as unknown as SavedItinerary)}
                onDelete={async (tripId) => {
                    await data.actions.handleDeleteTrip(tripId, () => setSelectedFlatTrip(null));
                }}
                deleting={deleting}
            />

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
                                        await supabase.from('itineraries').update({ selected_theme: newTheme }).eq('id', selectedTripForModal.id);
                                    }
                                }}
                            >
                                <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Select PDF Format" />
                                </SelectTrigger>
                                <SelectContent>
                                    {themeOptions.length > 0 ? (
                                        themeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)
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

            {/* Edit Client */}
            <ClientDialog
                isOpen={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                client={editingClient}
                onSave={async (clientData) => {
                    if (editingClient) {
                        await updateClient(editingClient.id, clientData);
                        data.actions.setEnrichedClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...clientData } : c));
                        if (selectedClient && selectedClient.id === editingClient.id) {
                            setSelectedClient(prev => prev ? { ...prev, ...clientData } : null);
                        }
                    }
                }}
            />

            {/* Add Client */}
            <ClientDialog
                isOpen={isAddClientOpen}
                onOpenChange={setIsAddClientOpen}
                client={null}
                onSave={async (clientData) => {
                    await _createClient(clientData);
                    toast({ title: "Success", description: "Client added successfully." });
                }}
            />

            <Sheet open={isActivitySheetOpen} onOpenChange={setIsActivitySheetOpen}>
                <SheetContent className="w-[400px] sm:w-[540px] bg-[#0A0A0A] border-white/10 text-white p-0 flex flex-col">
                    <SheetHeader className="p-6 border-b border-white/10">
                        <SheetTitle className="text-xl flex items-center gap-2"><History className="w-5 h-5 text-purple-400" />Activity Center</SheetTitle>
                        <SheetDescription className="text-gray-400">A complete history of all your CRM events.</SheetDescription>
                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-none">
                            {['all', 'client_added', 'trip_created', 'status_changed'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => context.filters.setActivityFilter(filter)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${context.filters.activityFilter === filter ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-gray-200'}`}
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
                        {data.data.recentActivity.filter(a => context.filters.activityFilter === 'all' || a.type === context.filters.activityFilter).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                                <History className="w-8 h-8 opacity-50" /><p>No activity found for this filter.</p>
                            </div>
                        ) : (
                            data.data.recentActivity.filter(a => context.filters.activityFilter === 'all' || a.type === context.filters.activityFilter).map((event) => (
                                <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className={`p-2 rounded-lg shrink-0 ${event.icon === 'user' ? 'bg-purple-500/10 border border-purple-500/20' : event.icon === 'plane' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-green-500/10 border border-green-500/20'}`}>
                                        {event.icon === 'user' ? <UserPlus className="w-4 h-4 text-purple-400" /> : event.icon === 'plane' ? <Plane className="w-4 h-4 text-blue-400" /> : <Activity className="w-4 h-4 text-amber-400" />}
                                    </div>
                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <p className="text-sm text-gray-200 leading-snug">{event.label}</p>
                                        <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1.5"><Clock className="w-3 h-3" />{event.time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {event.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <FinancesSheet isOpen={isFinancesOpen} onOpenChange={setIsFinancesOpen} trip={financesTrip} />
            
            <ImportBackupModal 
                isDataEmpty={!data.loading.clientsLoading && !data.loading.isComputing && data.data.clients.length === 0} 
                onImportSuccess={() => fetchClients()} 
                isOpen={isImportModalOpen}
                onOpenChange={setIsImportModalOpen}
            />

            <StandaloneBookingDialog
                isOpen={isBookingDialogOpen}
                onClose={() => setIsBookingDialogOpen(false)}
                onBookingCreated={() => data.actions.fetchWorkspaceData()}
            />

            <BookingDetailSheet
                booking={selectedBooking}
                onClose={() => setSelectedBooking(null)}
                onDelete={(id) => data.actions.handleDeleteBooking(id, context.setDeletingBookingId, () => setSelectedBooking(null))}
                deleting={deletingBookingId}
                client={selectedClientForBooking}
            />
        </>
    );
}

