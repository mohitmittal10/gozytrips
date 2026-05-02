"use client";

import { useState, useEffect } from "react";
import { type ClientItinerary } from "@/lib/hooks/use-client-itineraries";
import { useAuth } from "@/contexts/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Save, Plane, DollarSign, Eye, AlertCircle } from "lucide-react";
import { PdfPreviewEditor } from "@/components/pdf-preview-editor";
import ItineraryTimeline from "@/components/itinerary-timeline";
import HotelFlightEditor from "@/components/hotel-flight-editor";
import PricingModule from "@/components/pricing-module";
import { type PdfTheme } from "@/components/pdf-template";
import { useToast } from "@/hooks/use-toast";
import { useReferenceOptions } from "@/hooks/use-reference-options";
import { createClient } from "@/lib/supabase/client";

// Store
import { ItineraryProvider } from "@/contexts/itinerary-context";
import { useItinerary } from "@/hooks/use-itinerary";

// ── Inner editor (must be inside ItineraryProvider) ────────────────────────────

interface InnerEditorProps {
  trip: ClientItinerary;
  clientName?: string;
  onSave: (id: string, newData: any, newStatus?: string, newTheme?: string) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

function InnerEditor({ trip, clientName, onSave, onOpenChange }: InnerEditorProps) {
  const { userProfile, agencySettings } = useAuth();
  const { toast } = useToast();
  const { options: itineraryStatuses } = useReferenceOptions('itinerary_status');
  const { options: themeOptions } = useReferenceOptions('pdf_theme');
  const supabase = createClient();

  // Get everything from the central store
  const {
    itinerary,
    hotels,
    flights,
    pricing,
    isDirty,
    validationErrors,
    isValid,
    setItinerary,
    setHotels,
    setFlights,
    markClean,
    getSerializable,
  } = useItinerary();

  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string>(trip.status || "draft");
  const [selectedTheme, setSelectedTheme] = useState<PdfTheme>((trip.selected_theme as PdfTheme) || "classic");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // getSerializable() pulls the current canonical state
      const mergedData = {
        ...trip.itinerary_data,
        ...getSerializable(),
      };

      await onSave(trip.id, mergedData, status, selectedTheme);
      markClean();

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

  const pdfFilename = `${clientName ? `${clientName.replace(/\s+/g, "_")}_` : ""}${trip.title.replace(/\s+/g, "_")}_Quote.pdf`;

  // PDF template props — read from store (no local state)
  const activeThemeProps = {
    itinerary: { ...trip.itinerary_data, itinerary },
    title: trip.title,
    userProfile,
    theme: selectedTheme,
    hotels,
    flights,
    pricing,
    // baseCost is derived inside PdfTemplate via the same calculator
  };

  return (
    <>
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <DialogTitle className="text-xl md:text-2xl text-white">
            {trip.title}
            {isDirty && (
              <span className="ml-2 text-xs font-normal text-amber-400 align-middle">
                ● unsaved
              </span>
            )}
          </DialogTitle>
          <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {trip.starting_location}
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-500" />
            <span className="flex items-center gap-1.5 capitalize">
              <span className="w-3.5 h-3.5 flex items-center justify-center text-xs">📋</span>
              Status: {status}
            </span>
          </div>

          {/* Validation errors banner */}
          {validationErrors.length > 0 && (
            <div className="mt-2 flex items-start gap-2 text-xs text-amber-400 bg-amber-400/10 rounded-lg px-3 py-2 border border-amber-400/20 max-w-xl">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{validationErrors[0]}{validationErrors.length > 1 ? ` (+${validationErrors.length - 1} more)` : ""}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px] h-9 glass-button border-white/20">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
              {itineraryStatuses.length > 0 ? (
                itineraryStatuses.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent to Client</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          <Button
            onClick={handleSave}
            disabled={isSaving || !isValid}
            className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>

          <div className="w-px h-6 bg-white/20 hidden md:block mx-1" />

          <Select 
            value={selectedTheme} 
            onValueChange={(value) => setSelectedTheme(value as PdfTheme)}
          >
            <SelectTrigger className="w-[130px] h-9 glass-button border-white/20 hidden md:flex">
              <SelectValue placeholder="PDF Format" />
            </SelectTrigger>
            <SelectContent>
              {themeOptions.length > 0 ? (
                themeOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="editorial">Editorial</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          <Button
            onClick={() => setIsPreviewOpen(true)}
            className="h-9 glass-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview &amp; Export
          </Button>
        </div>
      </div>

      {/* Scrolling Workspace */}
      <div className="flex-1 p-6 md:p-8 bg-gradient-to-b from-transparent to-black/40">
        <Tabs defaultValue="timeline" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="glass-main border-white/10 p-1">
              <TabsTrigger
                value="timeline"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex gap-2"
              >
                <span className="w-4 h-4 flex items-center justify-center text-xs">●</span> Outline
              </TabsTrigger>
              <TabsTrigger
                value="logistics"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex gap-2"
              >
                <Plane className="w-4 h-4" /> Flights &amp; Hotels
              </TabsTrigger>
              <TabsTrigger
                value="pricing"
                className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white flex gap-2"
              >
                <DollarSign className="w-4 h-4" /> Costing &amp; Markup
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="timeline" className="mt-0 outline-none">
            <div className="max-w-4xl mx-auto">
              {/* ItineraryTimeline reads currency from the store directly */}
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
              {/* HotelFlightEditor dispatches to store via setHotels/setFlights */}
              <HotelFlightEditor
                hotels={hotels}
                flights={flights}
                onHotelsChange={setHotels}
                onFlightsChange={setFlights}
                totalDays={itinerary?.length || 1}
                currency={pricing?.currency}
              />
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="mt-0 outline-none">
            <div className="max-w-4xl mx-auto">
              {/* PricingModule now reads from store — no props needed */}
              <PricingModule />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* PDF Preview & Export */}
      <PdfPreviewEditor
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        templateProps={{
          ...activeThemeProps,
          agencySettings
        }}
        initialTheme={selectedTheme}
        itineraryId={trip.id}
        filename={pdfFilename}
      />
    </>
  );
}

// ── Outer shell — owns the Dialog and the Provider ────────────────────────────

interface ClientItineraryEditorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trip: ClientItinerary | null;
  onSave: (id: string, newData: any, newStatus?: string, newTheme?: string) => Promise<void>;
  clientName?: string;
}

export function ClientItineraryEditor({
  isOpen,
  onOpenChange,
  trip,
  onSave,
  clientName,
}: ClientItineraryEditorProps) {
  if (!trip) return null;

  // Build initial trip seed from the Supabase record
  const initialTrip = {
    id: trip.id,
    itinerary: trip.itinerary_data?.itinerary || [],
    hotels: (trip.itinerary_data as any)?.hotels || [],
    flights: (trip.itinerary_data as any)?.flights || [],
    pricing: (trip.itinerary_data as any)?.pricing || undefined,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full overflow-y-auto glass-main border-white/10 p-0 flex flex-col rounded-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{trip.title}</DialogTitle>
          <DialogDescription>Edit itinerary, logistics, and pricing for {trip.title}.</DialogDescription>
        </DialogHeader>

        {/*
          ItineraryProvider is keyed by trip.id so it fully remounts
          (and resets state) when a different trip is opened.
        */}
        <ItineraryProvider key={trip.id} initialTrip={initialTrip}>
          <InnerEditor
            trip={trip}
            clientName={clientName}
            onSave={onSave}
            onOpenChange={onOpenChange}
          />
        </ItineraryProvider>
      </DialogContent>
    </Dialog>
  );
}
