import React from 'react';
import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';
import type { HotelInfo, FlightInfo } from '@/components/hotel-flight-editor';
import type { PricingConfig } from '@/types/pricing';

import { getAgentInfo, getSanitizedTitle } from './pdf/utils';
import { PdfPricingPage, PdfFlightAndHotelSummary } from './pdf/pages';

import { ClassicTheme } from './pdf/themes/classic-theme';
import { EditorialTheme } from './pdf/themes/editorial-theme';
import { MinimalistTheme } from './pdf/themes/minimalist-theme';
import { DarkTheme } from './pdf/themes/dark-theme';
import { CorporateTheme } from './pdf/themes/corporate-theme';

export type PdfTheme = 'classic' | 'editorial' | 'minimalist' | 'dark' | 'corporate';

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
}

/* ═════════ MAIN EXPORTED COMPONENT ═════════ */
export const PdfTemplate = ({ itinerary, title, userProfile, agencySettings, theme = 'classic', hotels = [], flights = [], pricing, baseCost }: PdfTemplateProps) => {
    if (!itinerary || !itinerary.itinerary) return null;

    const agent = getAgentInfo(userProfile, agencySettings);
    const displayTitle = getSanitizedTitle(title || "", itinerary);

    let ThemeComponent;
    switch (theme) {
        case 'editorial':
            ThemeComponent = <EditorialTheme itinerary={itinerary} title={displayTitle} agent={agent} />;
            break;
        case 'minimalist':
            ThemeComponent = <MinimalistTheme itinerary={itinerary} title={displayTitle} agent={agent} />;
            break;
        case 'dark':
            ThemeComponent = <DarkTheme itinerary={itinerary} title={displayTitle} agent={agent} />;
            break;
        case 'corporate':
            ThemeComponent = <CorporateTheme itinerary={itinerary} title={displayTitle} agent={agent} />;
            break;
        case 'classic':
        default:
            ThemeComponent = <ClassicTheme itinerary={itinerary} title={displayTitle} agent={agent} />;
            break;
    }

    return (
        <div style={{ position: "relative" }}>
            {ThemeComponent}
            <PdfFlightAndHotelSummary flights={flights} hotels={hotels} accentColor={agent.primaryColor} />
            {pricing && <PdfPricingPage pricing={pricing} baseCost={baseCost} agent={agent} />}
        </div>
    );
};
