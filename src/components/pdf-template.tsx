import React from 'react';
import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';
import type { HotelInfo, FlightInfo } from '@/components/hotel-flight-editor';
import type { PricingConfig } from '@/types/pricing';
import type { PdfTheme } from './pdf/theme-config';

import { getAgentInfo, getSanitizedTitle } from './pdf/utils';
import { PdfPricingPage, PdfFlightAndHotelSummary, PdfInclusionsPage } from './pdf/pages';
import { calcPricingFromBaseCost } from '@/services/financial';

import { ClassicTheme } from './pdf/themes/classic-theme';
import { EditorialTheme } from './pdf/themes/editorial-theme';
import { MinimalistTheme } from './pdf/themes/minimalist-theme';
import { DarkTheme } from './pdf/themes/dark-theme';
import { CorporateTheme } from './pdf/themes/corporate-theme';
import { DesertTheme, DesertFooter } from './pdf/themes/desert-theme';
import { defaultPricingConfig } from '@/types/pricing';

export type { PdfTheme } from './pdf/theme-config';

export interface PdfTemplateProps {
    itinerary: TravelItineraryOutput | null | undefined;
    title?: string;
    userProfile?: any;
    agencySettings?: any;
    theme?: PdfTheme;
    hotels?: HotelInfo[];
    flights?: FlightInfo[];
    pricing?: PricingConfig;
    baseCost?: number;
    showTimestamps?: boolean;
    showPrices?: boolean;
    inclusions?: string;
    exclusions?: string;
    /** AI-generated one-sentence summaries per day, indexed by day order. */
    daySummaries?: string[];
}

/* ═════════ MAIN EXPORTED COMPONENT ═════════ */
export const PdfTemplate = ({ itinerary, title, userProfile, agencySettings, theme = 'classic', hotels = [], flights = [], pricing, baseCost = 0, showTimestamps = true, showPrices = true, inclusions, exclusions, daySummaries }: PdfTemplateProps) => {
    if (!itinerary || !itinerary.itinerary) return null;

    const agent = getAgentInfo(userProfile, agencySettings);
    const displayTitle = getSanitizedTitle(title || "", itinerary);

    // Calculate the definitive final total for display across all themes
    const pricingCfg = pricing || (itinerary as any).pricing || defaultPricingConfig;
    const { finalTotal } = calcPricingFromBaseCost(baseCost, pricingCfg);

    let ThemeComponent;
    switch (theme) {
        case 'editorial':
            ThemeComponent = <EditorialTheme itinerary={itinerary} title={displayTitle} agent={agent} hotels={hotels} flights={flights} finalTotal={finalTotal} showTimestamps={showTimestamps} showPrices={showPrices} daySummaries={daySummaries} />;
            break;
        case 'minimalist':
            ThemeComponent = <MinimalistTheme itinerary={itinerary} title={displayTitle} agent={agent} hotels={hotels} flights={flights} finalTotal={finalTotal} showTimestamps={showTimestamps} showPrices={showPrices} daySummaries={daySummaries} />;
            break;
        case 'dark':
            ThemeComponent = <DarkTheme itinerary={itinerary} title={displayTitle} agent={agent} hotels={hotels} flights={flights} finalTotal={finalTotal} showTimestamps={showTimestamps} showPrices={showPrices} daySummaries={daySummaries} />;
            break;
        case 'corporate':
            ThemeComponent = <CorporateTheme itinerary={itinerary} title={displayTitle} agent={agent} hotels={hotels} flights={flights} finalTotal={finalTotal} showTimestamps={showTimestamps} showPrices={showPrices} daySummaries={daySummaries} />;
            break;
        case 'desert':
            ThemeComponent = <DesertTheme itinerary={itinerary} title={displayTitle} agent={agent} hotels={hotels} flights={flights} finalTotal={finalTotal} showTimestamps={showTimestamps} showPrices={showPrices} daySummaries={daySummaries} />;
            break;
        case 'classic':
        default:
            ThemeComponent = <ClassicTheme itinerary={itinerary} title={displayTitle} agent={agent} hotels={hotels} flights={flights} finalTotal={finalTotal} showTimestamps={showTimestamps} showPrices={showPrices} daySummaries={daySummaries} />;
            break;
    }

    return (
        <div style={{ position: "relative" }}>
            {ThemeComponent}
            <PdfFlightAndHotelSummary flights={flights} hotels={hotels} accentColor={agent.primaryColor} theme={theme} />
            <PdfInclusionsPage inclusions={inclusions} exclusions={exclusions} accentColor={agent.primaryColor} theme={theme} />
            {pricingCfg && <PdfPricingPage pricing={pricingCfg} baseCost={baseCost} agent={agent} theme={theme} />}
            {theme === 'desert' && <DesertFooter agent={agent} />}
        </div>
    );
};

