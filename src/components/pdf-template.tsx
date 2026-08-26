import React from 'react';
import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';
import type { HotelInfo, FlightInfo, CabInfo, BusInfo } from '@/components/hotel-flight-editor';
import type { PricingConfig } from '@/types/pricing';
import type { PdfTheme } from './pdf/theme-config';

import { getAgentInfo, getSanitizedTitle } from './pdf/utils';
import { PdfPricingPage, PdfFlightAndHotelSummary, PdfInclusionsPage } from './pdf/pages';
import { calcPricingFromBaseCost, calcBaseCost } from '@/services/financial';

import { ClassicTheme } from './pdf/themes/classic-theme';
import { EditorialTheme } from './pdf/themes/editorial-theme';
import { MinimalistTheme } from './pdf/themes/minimalist-theme';
import { DarkTheme } from './pdf/themes/dark-theme';
import { CorporateTheme } from './pdf/themes/corporate-theme';
import { DesertTheme, DesertFooter } from './pdf/themes/desert-theme';
import { TropicalTheme } from './pdf/themes/tropical-theme';
import { LuxuryTheme } from './pdf/themes/luxury-theme';
import { defaultPricingConfig } from '@/types/pricing';
import { filterCompleteEntriesForExport } from '@/lib/validation/logistics-validation';

export type { PdfTheme } from './pdf/theme-config';

export interface PdfTemplateProps {
    itinerary: TravelItineraryOutput | null | undefined;
    title?: string;
    clientName?: string;
    userProfile?: any;
    agencySettings?: any;
    theme?: PdfTheme;
    hotels?: HotelInfo[];
    flights?: FlightInfo[];
    cabs?: CabInfo[];
    buses?: BusInfo[];
    pricing?: PricingConfig;
    baseCost?: number;
    showTimestamps?: boolean;
    inclusions?: string;
    exclusions?: string;
    termsAndConditions?: string;
    cancellationPolicy?: string;
    paymentMethods?: string;
    /** AI-generated one-sentence summaries per day, indexed by day order. */
    daySummaries?: string[];
    aboutPlace?: any;
}

/* ═════════ MAIN EXPORTED COMPONENT ═════════ */
export const PdfTemplate = ({ itinerary, title, clientName, userProfile, agencySettings, theme = 'classic', hotels = [], flights = [], cabs = [], buses = [], pricing, baseCost = 0, showTimestamps = true, inclusions, exclusions, termsAndConditions, cancellationPolicy, paymentMethods, daySummaries, aboutPlace }: PdfTemplateProps) => {
    if (!itinerary || !itinerary.itinerary) return null;

    const agent = getAgentInfo(userProfile, agencySettings);
    const displayTitle = getSanitizedTitle(title || "", itinerary);

    // Filter out incomplete entries so only fully-completed items appear in the exported PDF
    const validHotels = filterCompleteEntriesForExport(hotels.length > 0 ? hotels : ((itinerary as any).hotels || []), "hotel");
    const validFlights = filterCompleteEntriesForExport(flights.length > 0 ? flights : ((itinerary as any).flights || []), "flight");
    const validCabs = filterCompleteEntriesForExport(cabs.length > 0 ? cabs : ((itinerary as any).cabs || []), "cab");
    const validBuses = filterCompleteEntriesForExport(buses.length > 0 ? buses : ((itinerary as any).buses || []), "bus");

    // Calculate the definitive final total for display across all themes
    const pricingCfg = pricing || (itinerary as any).pricing || defaultPricingConfig;
    const resolvedBaseCost = baseCost || calcBaseCost({
        itinerary: itinerary.itinerary || [],
        hotels: validHotels,
        flights: validFlights,
        cabs: validCabs,
        buses: validBuses,
        pricing: pricingCfg
    });
    const { finalTotal } = calcPricingFromBaseCost(resolvedBaseCost, pricingCfg);

    const resolvedInclusions = inclusions ?? (itinerary as any).inclusions;
    const resolvedExclusions = exclusions ?? (itinerary as any).exclusions;
    const resolvedTerms = termsAndConditions ?? (itinerary as any).termsAndConditions;
    const resolvedCancellation = cancellationPolicy ?? (itinerary as any).cancellationPolicy;
    const resolvedPaymentMethods = paymentMethods ?? (itinerary as any).paymentMethods;

    const themeProps = {
        itinerary, title: displayTitle, clientName, agencySettings, agent, hotels: validHotels, flights: validFlights, cabs: validCabs, buses: validBuses, finalTotal, showTimestamps, inclusions: resolvedInclusions, exclusions: resolvedExclusions, termsAndConditions: resolvedTerms, cancellationPolicy: resolvedCancellation, paymentMethods: resolvedPaymentMethods, pricing: pricingCfg, baseCost: resolvedBaseCost, daySummaries, aboutPlace
    };

    let ThemeComponent;
    switch (theme) {
        case 'editorial':
            ThemeComponent = <EditorialTheme {...themeProps} />;
            break;
        case 'minimalist':
            ThemeComponent = <MinimalistTheme {...themeProps} />;
            break;
        case 'dark':
            ThemeComponent = <DarkTheme {...themeProps} />;
            break;
        case 'corporate':
            ThemeComponent = <CorporateTheme {...themeProps} />;
            break;
        case 'desert':
            ThemeComponent = <DesertTheme {...themeProps} />;
            break;
        case 'tropical':
            ThemeComponent = <TropicalTheme {...themeProps} />;
            break;
        case 'luxury':
            ThemeComponent = <LuxuryTheme {...themeProps} />;
            break;
        case 'classic':
        default:
            ThemeComponent = <ClassicTheme {...themeProps} />;
            break;
    }

    return (
        <div style={{ position: "relative" }}>
            {ThemeComponent}
        </div>
    );
};
