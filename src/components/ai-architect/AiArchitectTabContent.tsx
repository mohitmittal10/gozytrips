// Handles the conditional rendering of the 4 tabs, each wrapped in an Error Boundary
import React, { useEffect, useRef } from 'react';
import type { ActiveArchitectTab } from '@/types/ai-architect';
import { ItineraryErrorBoundary } from './ItineraryErrorBoundary';

// Components
import ItineraryTimeline from "@/components/itinerary-timeline";
import HotelFlightEditor from "@/components/hotel-flight-editor";
import PricingModule from "@/components/pricing-module";
import { CrmSettings } from "@/components/crm-settings";
import { ItineraryProvider } from "@/contexts/itinerary-context";

// Memoized versions
const MemoizedItineraryTimeline = React.memo(ItineraryTimeline);
const MemoizedHotelFlightEditor = React.memo(HotelFlightEditor);
const MemoizedPricingModule = React.memo(PricingModule);

// Internal helper for Pricing context sync
const PricingSync = React.memo(({ onChange, pricing }: { onChange: (pricing: any) => void; pricing: any }) => {
  const lastPricingRef = useRef<string>(JSON.stringify(pricing));
  
  useEffect(() => {
    const currentPricingStr = JSON.stringify(pricing);
    if (lastPricingRef.current !== currentPricingStr) {
      onChange(pricing);
      lastPricingRef.current = currentPricingStr;
    }
  }, [pricing, onChange]);
  
  return null;
});

interface AiArchitectTabContentProps {
  activeArchitectTab: ActiveArchitectTab;
  isGenerating: boolean;
  itinerary: any;
  setItinerary: (val: any) => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  hotels: any[];
  setHotels: (val: any[]) => void;
  flights: any[];
  setFlights: (val: any[]) => void;
  cabs: any[];
  setCabs: (val: any[]) => void;
  buses: any[];
  setBuses: (val: any[]) => void;
  showTimestamps: boolean;
  showPrices: boolean;
  pricing: any;
  setPricing: (val: any) => void;
  agencySettings: any;
  handleSaveItinerary: () => void;
  isSaving: boolean;
}

const AiArchitectTabContent = React.memo(function AiArchitectTabContent({
  activeArchitectTab, isGenerating, itinerary, setItinerary,
  isEditing, setIsEditing, hotels, setHotels, flights, setFlights, cabs, setCabs, buses, setBuses,
  showTimestamps, showPrices, pricing, setPricing, 
  agencySettings, handleSaveItinerary, isSaving
}: AiArchitectTabContentProps) {

  return (
    <>
      {/* Tab Content - Timeline */}
      {activeArchitectTab === 'itinerary' && (
        <ItineraryErrorBoundary onReset={() => setItinerary(null)} fallbackMessage="Timeline failed to render.">
          <div className="relative rounded-xl sm:rounded-2xl border border-white/[0.06] p-2 sm:p-4 md:p-6 backdrop-blur-sm overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(10,10,11,0.9) 0%, rgba(18,18,20,0.95) 50%, rgba(10,10,11,0.9) 100%)' }}>
            <MemoizedItineraryTimeline
              itinerary={itinerary?.itinerary || []}
              isLoading={isGenerating}
              editable={isEditing}
              onEditingChange={setIsEditing}
              onItineraryChange={(updatedItinerary) => {
                if (itinerary) {
                  setItinerary({ ...itinerary, itinerary: updatedItinerary });
                }
              }}
              hotels={hotels}
              flights={flights}
              cabs={cabs}
              buses={buses}
              showTimestamps={showTimestamps}
              showPrices={showPrices}
            />
          </div>
        </ItineraryErrorBoundary>
      )}

      {/* Tab Content - Logistics (Hotels & Flights) */}
      {activeArchitectTab === 'flights-hotels' && !isGenerating && (
        <ItineraryErrorBoundary onReset={() => {}} fallbackMessage="Logistics editor failed to load.">
          <MemoizedHotelFlightEditor
            hotels={hotels}
            flights={flights}
            cabs={cabs}
            buses={buses}
            totalDays={itinerary?.itinerary?.length || 0}
            onHotelsChange={setHotels}
            onFlightsChange={setFlights}
            onCabsChange={setCabs}
            onBusesChange={setBuses}
          />
        </ItineraryErrorBoundary>
      )}

      {/* Tab Content - Financials (Pricing) */}
      {activeArchitectTab === 'pricing' && !isGenerating && (
        <ItineraryErrorBoundary onReset={() => setPricing(undefined)} fallbackMessage="Pricing module failed to load.">
          <ItineraryProvider
            key={JSON.stringify(itinerary?.itinerary?.length)}
            initialTrip={{
              itinerary: itinerary?.itinerary || [],
              hotels,
              flights,
              cabs,
              buses,
              pricing: pricing || (agencySettings ? {
                currency: agencySettings.default_currency,
                markupType: agencySettings.default_markup_type,
                markupValue: agencySettings.default_markup_value,
                taxPercentage: agencySettings.default_tax_percentage,
                adultPax: 2,
                childPax: 0,
                infantPax: 0,
                milestones: [],
              } as any : undefined),
            }}
          >
            <PricingSync onChange={setPricing} pricing={pricing} />
            <MemoizedPricingModule onSave={handleSaveItinerary} isSaving={isSaving} />
          </ItineraryProvider>
        </ItineraryErrorBoundary>
      )}

      {/* Tab Content - Settings */}
      {activeArchitectTab === 'settings' && (
        <ItineraryErrorBoundary onReset={() => {}} fallbackMessage="Settings failed to load.">
          <div className="mt-4">
            <CrmSettings />
          </div>
        </ItineraryErrorBoundary>
      )}
    </>
  );
});

export default AiArchitectTabContent;
