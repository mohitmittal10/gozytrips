"use client";

import { useState, useEffect } from "react";
import { type ClientItinerary } from "@/lib/hooks/use-client-itineraries";
import { useAuth } from "@/contexts/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Download, Save, Plane, DollarSign, Eye } from "lucide-react";
import { PdfPreviewEditor } from "@/components/pdf-preview-editor";
import ItineraryTimeline from "@/components/itinerary-timeline";
import HotelFlightEditor, { type HotelInfo, type FlightInfo } from "@/components/hotel-flight-editor";
import PricingModule from "@/components/pricing-module";
import { type PricingConfig } from "@/types/pricing";
import { type PdfTheme } from "@/components/pdf-template";
import { useToast } from "@/hooks/use-toast";

interface ClientItineraryEditorProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    trip: ClientItinerary | null;
    onSave: (id: string, newData: any, newStatus?: string) => Promise<void>;
    clientName?: string;
}

export function ClientItineraryEditor({ isOpen, onOpenChange, trip, onSave, clientName }: ClientItineraryEditorProps) {
    const { userProfile } = useAuth();
    const { toast } = useToast();

    // Local state for edits
    const [itinerary, setItinerary] = useState<any | null>(null);
    const [hotels, setHotels] = useState<HotelInfo[]>([]);
    const [flights, setFlights] = useState<FlightInfo[]>([]);
    const [pricing, setPricing] = useState<PricingConfig | undefined>(undefined);
    const [status, setStatus] = useState<string>("draft");

    const [isSaving, setIsSaving] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState<PdfTheme>('classic');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Initialize state when a trip is selected
    useEffect(() => {
        if (trip && isOpen) {
            setItinerary(trip.itinerary_data?.itinerary || []);
            setHotels((trip.itinerary_data as any)?.hotels || []);
            setFlights((trip.itinerary_data as any)?.flights || []);
            setPricing((trip.itinerary_data as any)?.pricing || undefined);
            setStatus(trip.status || "draft");
        }
    }, [trip, isOpen]);

    if (!trip) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const mergedData = {
                ...trip.itinerary_data,
                itinerary,
                hotels,
                flights,
                pricing
            };

            await onSave(trip.id, mergedData, status);

            toast({
                title: "Quote Updated",
                description: "Your changes have been saved to this client's profile.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save itinerary modifications.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const pdfFilename = `${clientName ? `${clientName.replace(/\s+/g, '_')}_` : ''}${trip.title.replace(/\s+/g, '_')}_Quote.pdf`;

    // Base cost calculation for the PricingModule dynamically responding inside the modal
    const baseCost = (() => {
        let cost = 0;
        // Add activities
        itinerary?.forEach((day: any) => {
            day.activities?.forEach((acc: any) => {
                if (acc.cost) cost += Number(acc.cost);
            });
        });
        // Add Hotels
        hotels.forEach((h: any) => {
            if (h.costAdult) cost += Number(h.costAdult);
            if (h.costChild) cost += Number(h.costChild);
            if (h.costInfant) cost += Number(h.costInfant);
        });
        // Add Flights
        flights.forEach((f: any) => {
            if (f.costAdult) cost += Number(f.costAdult);
            if (f.costChild) cost += Number(f.costChild);
            if (f.costInfant) cost += Number(f.costInfant);
        });

        return cost;
    })();

    const activeThemeProps = {
        itinerary: { ...trip.itinerary_data, itinerary },
        title: trip.title,
        userProfile: userProfile,
        theme: selectedTheme,
        hotels: hotels,
        flights: flights,
        pricing: pricing,
        baseCost: baseCost
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full overflow-y-auto glass-main border-white/10 p-0 flex flex-col rounded-xl">

                {/* Sticky Header */}
                <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <DialogTitle className="text-xl md:text-2xl text-white">{trip.title}</DialogTitle>
                        <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-400">
                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {trip.starting_location}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                            <span className="flex items-center gap-1.5 capitalize"><span className="w-3.5 h-3.5 flex items-center justify-center text-xs">📋</span> Status: {status}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-[140px] h-9 glass-button border-white/20">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="sent">Sent to Client</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button onClick={handleSave} disabled={isSaving} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>

                        <div className="w-px h-6 bg-white/20 hidden md:block mx-1"></div>

                        <Select defaultValue="classic" onValueChange={(value) => setSelectedTheme(value as PdfTheme)}>
                            <SelectTrigger className="w-[130px] h-9 glass-button border-white/20 hidden md:flex">
                                <SelectValue placeholder="PDF Format" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="classic">Classic</SelectItem>
                                <SelectItem value="editorial">Editorial</SelectItem>
                                <SelectItem value="minimalist">Minimalist</SelectItem>
                                <SelectItem value="corporate">Corporate</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button onClick={() => setIsPreviewOpen(true)} className="h-9 glass-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0">
                            <Eye className="w-4 h-4 mr-2" />
                            Preview & Export
                        </Button>
                    </div>
                </div>

                {/* Scrolling Workspace */}
                <div className="flex-1 p-6 md:p-8 bg-gradient-to-b from-transparent to-black/40">
                    <Tabs defaultValue="timeline" className="w-full">
                        <div className="flex justify-center mb-8">
                            <TabsList className="glass-main border-white/10 p-1">
                                <TabsTrigger value="timeline" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex gap-2">
                                    <span className="w-4 h-4 flex items-center justify-center text-xs">●</span> Outline
                                </TabsTrigger>
                                <TabsTrigger value="logistics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex gap-2">
                                    <Plane className="w-4 h-4" /> Flights & Hotels
                                </TabsTrigger>
                                <TabsTrigger value="pricing" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white flex gap-2">
                                    <DollarSign className="w-4 h-4" /> Costing & Markup
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="timeline" className="mt-0 outline-none">
                            <div className="max-w-4xl mx-auto">
                                <ItineraryTimeline
                                    itinerary={itinerary || []}
                                    showDecorations={false}
                                    editable={true}
                                    onItineraryChange={setItinerary}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="logistics" className="mt-0 outline-none">
                            <div className="max-w-4xl mx-auto">
                                <HotelFlightEditor
                                    hotels={hotels}
                                    flights={flights}
                                    onHotelsChange={setHotels}
                                    onFlightsChange={setFlights}
                                    totalDays={itinerary?.length || 1}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="pricing" className="mt-0 outline-none">
                            <div className="max-w-4xl mx-auto">
                                <PricingModule
                                    pricing={pricing}
                                    onChange={setPricing}
                                    baseCost={baseCost}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* PDF Preview & Export */}
                <PdfPreviewEditor
                    isOpen={isPreviewOpen}
                    onOpenChange={setIsPreviewOpen}
                    templateProps={activeThemeProps}
                    initialTheme={selectedTheme}
                    filename={pdfFilename}
                />
            </DialogContent>
        </Dialog>
    );
}
