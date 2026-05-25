// Handles the conditional rendering of the 4 tabs, each wrapped in an Error Boundary
import React, { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import type { ActiveLabTab } from '@/types/the-lab';
import { ItineraryErrorBoundary } from './ItineraryErrorBoundary';

// Components
import ItineraryTimeline from "@/components/itinerary-timeline";
import HotelFlightEditor from "@/components/hotel-flight-editor";
import PricingModule from "@/components/pricing-module";

import { ItineraryProvider, ItineraryContext } from "@/contexts/itinerary-context";
import { TheLabHistory } from "./TheLabHistory";
import TheLabForm from "./TheLabForm";
import { TheLabInclusions } from "./TheLabInclusions";

// Memoized versions
const MemoizedItineraryTimeline = React.memo(ItineraryTimeline);
const MemoizedHotelFlightEditor = React.memo(HotelFlightEditor);
const MemoizedPricingModule = React.memo(PricingModule);

// Internal helper for Pricing context sync
// Syncs pricing from the ItineraryProvider context back UP to the parent state.
// This is necessary because the PricingModule dispatches UPDATE_PRICING to the
// context, but the parent (index.tsx) needs the updated pricing in its own state
// so that saveAll can persist it to the database.
const PricingSync = React.memo(({ onChange }: { onChange: (pricing: any) => void }) => {
  const ctx = React.useContext(ItineraryContext);
  const contextPricing = ctx?.state?.pricing;
  const lastPricingRef = useRef<string>("");
  
  useEffect(() => {
    if (!contextPricing) return;
    const currentPricingStr = JSON.stringify(contextPricing);
    if (lastPricingRef.current !== currentPricingStr) {
      onChange(contextPricing);
      lastPricingRef.current = currentPricingStr;
    }
  }, [contextPricing, onChange]);
  
  return null;
});

interface TheLabTabContentProps {
  activeLabTab: ActiveLabTab;
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
  setCurrentTripId: (id: string | null) => void;
  setActiveLabTab: (tab: ActiveLabTab) => void;
  // Form props
  form: any;
  currentStep: number;
  setCurrentStep: (val: number) => void;
  onNext: () => void;
  onSubmit: (values: any) => void;
  handleCreateNew: () => void;
  inclusions: string;
  setInclusions: (val: string) => void;
  exclusions: string;
  setExclusions: (val: string) => void;
  termsAndConditions: string;
  setTermsAndConditions: (val: string) => void;
  cancellationPolicy: string;
  setCancellationPolicy: (val: string) => void;
  paymentMethods: string;
  setPaymentMethods: (val: string) => void;
}

const TheLabTabContent = React.memo(function TheLabTabContent({
  activeLabTab, isGenerating, itinerary, setItinerary,
  isEditing, setIsEditing, hotels, setHotels, flights, setFlights, cabs, setCabs, buses, setBuses,
  showTimestamps, showPrices, pricing, setPricing, 
  agencySettings, handleSaveItinerary, isSaving,
  setCurrentTripId, setActiveLabTab,
  form, currentStep, setCurrentStep, onNext, onSubmit,
  handleCreateNew,
  inclusions,
  setInclusions,
  exclusions,
  setExclusions,
  termsAndConditions,
  setTermsAndConditions,
  cancellationPolicy,
  setCancellationPolicy,
  paymentMethods,
  setPaymentMethods,
}: TheLabTabContentProps) {

  return (
    <>
      {/* Tab Content - Timeline */}
      {activeLabTab === 'itinerary' && itinerary?.itinerary?.length > 0 && (
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
              currency={pricing?.currency}
              destinations={form?.getValues?.()?.destinations || itinerary?.destinations}
            />
          </div>
        </ItineraryErrorBoundary>
      )}

      {/* Tab Content - Inclusions */}
      {activeLabTab === 'inclusions' && (
        <ItineraryErrorBoundary onReset={() => {}} fallbackMessage="Inclusions editor failed to load.">
          <TheLabInclusions
            inclusions={inclusions}
            setInclusions={setInclusions}
            exclusions={exclusions}
            setExclusions={setExclusions}
            termsAndConditions={termsAndConditions}
            setTermsAndConditions={setTermsAndConditions}
            cancellationPolicy={cancellationPolicy}
            setCancellationPolicy={setCancellationPolicy}
            paymentMethods={paymentMethods}
            setPaymentMethods={setPaymentMethods}
          />
        </ItineraryErrorBoundary>
      )}

      {/* Tab Content - Logistics (Hotels & Flights) */}
      {activeLabTab === 'flights-hotels' && !isGenerating && (
        <ItineraryErrorBoundary onReset={() => {}} fallbackMessage="Logistics editor failed to load.">
          <MemoizedHotelFlightEditor
            hotels={hotels}
            flights={flights}
            cabs={cabs}
            buses={buses}
            totalDays={itinerary?.itinerary?.length || 0}
            currency={pricing?.currency}
            onHotelsChange={setHotels}
            onFlightsChange={setFlights}
            onCabsChange={setCabs}
            onBusesChange={setBuses}
          />
        </ItineraryErrorBoundary>
      )}

      {/* Tab Content - Financials (Pricing) */}
      {activeLabTab === 'pricing' && !isGenerating && (
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
            <PricingSync onChange={setPricing} />
            <MemoizedPricingModule onSave={handleSaveItinerary} isSaving={isSaving} />
          </ItineraryProvider>
        </ItineraryErrorBoundary>
      )}

      {/* Tab Content - History */}
      {activeLabTab === 'history' && (
        <ItineraryErrorBoundary onReset={() => {}} fallbackMessage="History failed to load.">
          <TheLabHistory 
            setCurrentTripId={setCurrentTripId} 
            setActiveLabTab={setActiveLabTab} 
            handleCreateNew={handleCreateNew}
          />
        </ItineraryErrorBoundary>
      )}

      {/* Tab Content - New Trip */}
      {activeLabTab === 'new' && (
        <ItineraryErrorBoundary onReset={() => {}} fallbackMessage="Form failed to load.">
          <div className="mt-4 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-full max-w-3xl bg-[#0a0a0b]/80 border border-white/[0.08] backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-8 lg:p-12 shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-serif font-bold text-white uppercase tracking-tight">Plan Your Escape</h2>
                <p className="text-zinc-500 text-sm mt-3">Define the parameters of your next unforgettable journey.</p>
              </div>
              <TheLabForm 
                form={form} 
                currentStep={currentStep} 
                setCurrentStep={setCurrentStep} 
                onNext={onNext} 
                onSubmit={onSubmit} 
                isGenerating={isGenerating} 
              />
            </div>
          </div>
        </ItineraryErrorBoundary>
      )}

      {/* Tab Content - Empty/Welcome State */}
      {(!itinerary || !itinerary?.itinerary?.length) && !isGenerating && activeLabTab !== 'history' && activeLabTab !== 'new' && (
        <div className="flex flex-col items-center justify-center py-24 text-center px-4 animate-in fade-in duration-1000">
           <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-emerald-500/20 flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
              <Sparkles className="w-10 h-10 text-purple-400 animate-pulse" />
           </div>
           <h2 className="text-3xl font-serif font-bold text-white mb-4 uppercase tracking-wider">Wander Labs</h2>
           <p className="text-zinc-500 max-w-md mx-auto text-sm leading-relaxed mb-8">
             Select a trip from your history or click the Plus button to start designing your next journey.
           </p>
        </div>
      )}
    </>
  );
});

export default TheLabTabContent;


