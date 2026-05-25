import React from 'react';
import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';
import type { HotelInfo, FlightInfo, CabInfo, BusInfo } from '@/components/hotel-flight-editor';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { getCurrencySymbol, formatCurrency } from '@/lib/utils/currency';
import { getAgentInfo, getTotalBudget, getCoverImage, getDayImage, formatTitleCase, formatDistance, formatDate } from '../utils';
import { calcPricingFromBaseCost } from '@/services/financial';

export type TropicalThemeProps = {
    itinerary: TravelItineraryOutput;
    title: string;
    agent: ReturnType<typeof getAgentInfo>;
    clientName?: string;
    agencySettings?: any;
    hotels?: HotelInfo[];
    flights?: FlightInfo[];
    cabs?: CabInfo[];
    buses?: BusInfo[];
    pricing?: any;
    baseCost?: number;
    finalTotal?: number;
    showTimestamps?: boolean;
    showPrices?: boolean;
    inclusions?: string;
    exclusions?: string;
    termsAndConditions?: string;
    cancellationPolicy?: string;
    paymentMethods?: string;
    daySummaries?: string[];
    aboutPlace?: any;
};

export const TropicalTheme = ({
    itinerary,
    title,
    agent,
    clientName,
    agencySettings,
    hotels = [],
    flights = [],
    cabs = [],
    buses = [],
    pricing,
    baseCost = 0,
    finalTotal = 0,
    showTimestamps = true,
    showPrices = true,
    inclusions,
    exclusions,
    termsAndConditions,
    cancellationPolicy,
    paymentMethods,
    daySummaries,
    aboutPlace
}: TropicalThemeProps) => {
    
    // Parse pax from pricing
    const adultPax = Number(pricing?.adultPax || 2);
    const childPax = Number(pricing?.childPax || 0);
    
    // Calculate total days
    const totalDays = Array.isArray(itinerary.itinerary) ? itinerary.itinerary.length : 0;
    const totalNights = Math.max(0, totalDays - 1);

    // Format inclusions/exclusions string into arrays
    const parseList = (text: string) => text ? text.split('\n').filter(l => l.trim().length > 0) : [];
    const inclusionsList = parseList(inclusions || '');
    const exclusionsList = parseList(exclusions || '');

    const { costWithMarkup, taxAmount } = pricing ? calcPricingFromBaseCost(baseCost || 0, pricing) : { costWithMarkup: finalTotal, taxAmount: 0 };
    const currency = pricing?.currency || DEFAULT_CURRENCY;
    const isManual = pricing?.costingType === "manual";
    
    // Parse list for cancellation policy which was added below earlier
    const parseListPolicy = (str: string) => str.split('\n').filter(s => s.trim().length > 0).map(s => s.replace(/^- /, ''));

    return (
        <div style={{ width: "100%", backgroundColor: "var(--bg)" }}>
            <style>
                {`
                .tropical-wrap *, .tropical-wrap *::before, .tropical-wrap *::after { box-sizing: border-box; margin: 0; padding: 0; }

                .tropical-wrap {
                    --blue: #7caed6;
                    --blue-dark: #538ab8;
                    --blue-deep: #446d91;
                    --blue-navy: #294e75;
                    --bg: #fcfbfa;
                    --white: #ffffff;
                    --stone-50: #fafaf9;
                    --stone-100: #f5f5f4;
                    --stone-200: #e7e5e4;
                    --stone-400: #a8a29e;
                    --stone-500: #78716c;
                    --stone-600: #57534e;
                    --stone-700: #44403c;
                    --stone-800: #292524;
                    --font-serif: 'Playfair Display', Georgia, serif;
                    --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
                    --font-mono: 'JetBrains Mono', monospace;

                    background: var(--bg);
                    color: var(--stone-800);
                    font-family: var(--font-sans);
                    font-feature-settings: "cv02","cv03","cv04","cv11";
                    -webkit-font-smoothing: antialiased;
                }

                .tropical-wrap .hero {
                    position: relative;
                    height: 480px;
                    overflow: hidden;
                }
                .tropical-wrap .hero img {
                    width: 100%; height: 100%;
                    object-fit: cover;
                    filter: brightness(0.85);
                }
                .tropical-wrap .hero-overlay {
                    position: absolute; inset: 0;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 50%, var(--bg) 100%);
                }

                .tropical-wrap .header-card-wrap {
                    position: relative;
                    z-index: 10;
                    max-width: 800px;
                    margin: -260px auto 0;
                    padding: 0 24px;
                }
                .tropical-wrap .header-card {
                    background: rgba(255,255,255,0.96);
                    backdrop-filter: blur(12px);
                    border-radius: 24px;
                    padding: 40px 48px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.12);
                    border: 1px solid var(--stone-100);
                    text-align: center;
                }

                .tropical-wrap .stars { color: #f59e0b; font-size: 18px; letter-spacing: 2px; margin-bottom: 14px; }

                .tropical-wrap .header-card h1 {
                    font-family: var(--font-serif);
                    font-size: clamp(28px, 5vw, 46px);
                    font-weight: 500;
                    color: var(--stone-800);
                    letter-spacing: -0.5px;
                    margin-bottom: 14px;
                }
                .tropical-wrap .header-card p {
                    font-size: 14px;
                    color: var(--stone-600);
                    max-width: 560px;
                    margin: 0 auto 28px;
                    line-height: 1.7;
                    font-weight: 500;
                }

                .tropical-wrap .pills { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
                .tropical-wrap .pill {
                    display: inline-flex; align-items: center;
                    background: var(--blue);
                    color: white;
                    border-radius: 999px;
                    padding: 8px 20px;
                    font-size: 12px;
                    font-weight: 700;
                    font-family: var(--font-sans);
                }

                .tropical-wrap .meta-grid {
                    max-width: 800px;
                    margin: 36px auto 0;
                    padding: 0 24px;
                }
                .tropical-wrap .meta-box {
                    background: #f0f6fc;
                    border: 1px solid #c8dff3;
                    border-radius: 16px;
                    padding: 28px 32px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0;
                }
                .tropical-wrap .meta-col {
                    padding: 0 20px;
                }
                .tropical-wrap .meta-col + .meta-col {
                    border-left: 1px solid var(--stone-200);
                    padding-left: 28px;
                }
                .tropical-wrap .meta-label {
                    font-family: var(--font-mono);
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    color: var(--blue);
                    display: block;
                    margin-bottom: 6px;
                }
                .tropical-wrap .meta-col h3 {
                    font-family: var(--font-serif);
                    font-size: 18px;
                    color: var(--stone-800);
                    margin-bottom: 14px;
                }
                .tropical-wrap .meta-list { list-style: none; }
                .tropical-wrap .meta-list li {
                    display: flex; align-items: center; gap: 8px;
                    font-size: 12px;
                    color: var(--stone-600);
                    margin-bottom: 8px;
                    font-weight: 500;
                }
                .tropical-wrap .meta-list .icon {
                    width: 16px; height: 16px;
                    color: var(--blue);
                    flex-shrink: 0;
                }

                .tropical-wrap section {
                    padding: 64px 40px;
                    border-top: 1px solid var(--stone-100);
                    background: var(--bg);
                }

                .tropical-wrap .about-grid {
                    max-width: 820px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: 5fr 7fr;
                    gap: 48px;
                    align-items: center;
                }
                .tropical-wrap .about-img-wrap {
                    position: relative;
                }
                .tropical-wrap .about-img {
                    width: 100%;
                    aspect-ratio: 4/5;
                    object-fit: cover;
                    border-radius: 24px;
                    border: 4px solid white;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.12);
                }
                .tropical-wrap .about-glow {
                    position: absolute;
                    bottom: -24px; left: -24px;
                    width: 120px; height: 120px;
                    background: rgba(124,174,214,0.15);
                    border-radius: 50%;
                    filter: blur(24px);
                    z-index: -1;
                }
                .tropical-wrap .capsule-badge {
                    display: inline-flex;
                    background: rgba(124,174,214,0.15);
                    color: var(--blue-dark);
                    border-radius: 999px;
                    padding: 4px 16px;
                    font-family: var(--font-mono);
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    margin-bottom: 14px;
                }
                .tropical-wrap .about-content h2 {
                    font-family: var(--font-serif);
                    font-size: clamp(24px, 3.5vw, 36px);
                    font-weight: 600;
                    color: var(--stone-800);
                    margin-bottom: 20px;
                    line-height: 1.25;
                    letter-spacing: -0.3px;
                }
                .tropical-wrap .about-content p {
                    font-size: 13px;
                    color: var(--stone-600);
                    line-height: 1.75;
                    margin-bottom: 28px;
                    font-weight: 500;
                }
                .tropical-wrap .highlights { list-style: none; }
                .tropical-wrap .highlights li {
                    display: flex; align-items: flex-start; gap: 10px;
                    margin-bottom: 14px;
                    font-size: 12px;
                    color: var(--stone-700);
                    font-weight: 600;
                }
                .tropical-wrap .check-icon {
                    width: 20px; height: 20px;
                    background: rgba(124,174,214,0.2);
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                    margin-top: 1px;
                }
                .tropical-wrap .check-icon svg { width: 10px; height: 10px; color: var(--blue-dark); stroke-width: 3; }

                .tropical-wrap .brief-box {
                    max-width: 820px;
                    margin: 0 auto;
                    background: var(--white);
                    border: 1px solid var(--stone-200);
                    border-radius: 24px;
                    padding: 48px;
                    box-shadow: 0 2px 16px rgba(0,0,0,0.04);
                }
                .tropical-wrap .brief-box h2 {
                    font-family: var(--font-serif);
                    font-size: 30px;
                    font-weight: 500;
                    margin-bottom: 40px;
                    letter-spacing: -0.3px;
                }
                .tropical-wrap .timeline { list-style: none; }
                .tropical-wrap .timeline li {
                    display: flex; align-items: center; gap: 16px;
                    padding: 12px 0;
                    border-radius: 8px;
                }
                .tropical-wrap .day-pill {
                    display: inline-flex; align-items: center; justify-content: center;
                    background: var(--blue);
                    color: white;
                    border-radius: 999px;
                    padding: 6px 16px;
                    font-family: var(--font-mono);
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                .tropical-wrap .timeline-info h4 {
                    font-family: var(--font-serif);
                    font-size: 17px;
                    font-weight: 500;
                    color: var(--stone-800);
                }
                .tropical-wrap .timeline-info p {
                    font-size: 11px;
                    color: var(--stone-400);
                    font-family: var(--font-sans);
                    margin-top: 2px;
                }

                .tropical-wrap .section-badge {
                    display: inline-flex;
                    background: var(--blue-dark);
                    color: white;
                    border-radius: 999px;
                    padding: 5px 16px;
                    font-family: var(--font-mono);
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    margin-bottom: 12px;
                }
                .tropical-wrap .itinerary-heading {
                    font-family: var(--font-serif);
                    font-size: clamp(28px, 4vw, 44px);
                    font-weight: 500;
                    color: var(--stone-800);
                    letter-spacing: -0.5px;
                    text-align: center;
                    margin-bottom: 0;
                }
                .tropical-wrap .divider { width: 80px; height: 1px; background: var(--stone-200); margin: 20px auto 0; }

                .tropical-wrap .day-cards { max-width: 820px; margin: 64px auto 0; display: flex; flex-direction: column; gap: 80px; }

                .tropical-wrap .day-card {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 48px;
                    align-items: center;
                }
                .tropical-wrap .day-card.reversed .day-img-col { order: -1; }

                .tropical-wrap .day-badge {
                    display: inline-flex;
                    background: rgba(191,209,229,0.4);
                    color: var(--blue-deep);
                    border-radius: 999px;
                    padding: 4px 14px;
                    font-size: 11px;
                    font-weight: 700;
                    font-family: var(--font-sans);
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    margin-bottom: 14px;
                }
                .tropical-wrap .day-card h3 {
                    font-family: var(--font-serif);
                    font-size: clamp(22px, 3vw, 30px);
                    font-weight: 600;
                    color: var(--stone-800);
                    margin-bottom: 24px;
                    letter-spacing: -0.3px;
                    line-height: 1.25;
                }
                .tropical-wrap .day-items { list-style: none; }
                .tropical-wrap .day-items li {
                    display: flex; gap: 10px;
                    margin-bottom: 14px;
                    font-size: 12px;
                    color: var(--stone-600);
                    line-height: 1.6;
                    font-weight: 500;
                }
                .tropical-wrap .day-items .num {
                    color: var(--stone-400);
                    font-family: var(--font-mono);
                    font-size: 12px;
                    flex-shrink: 0;
                    width: 65px;
                }
                .tropical-wrap .day-img {
                    width: 100%;
                    aspect-ratio: 1;
                    object-fit: cover;
                    border-radius: 80px 15px 80px 15px;
                    border: 4px solid white;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                }

                .tropical-wrap .inc-exc-grid {
                    max-width: 820px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 28px;
                }
                .tropical-wrap .card {
                    background: var(--white);
                    border-radius: 24px;
                    padding: 32px;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
                }
                .tropical-wrap .card.sky { border: 1px solid #c8dff3; }
                .tropical-wrap .card.neutral { border: 1px solid var(--stone-200); }
                .tropical-wrap .card h3 {
                    font-family: var(--font-serif);
                    font-size: 16px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    text-align: center;
                    padding-bottom: 20px;
                    margin-bottom: 20px;
                    border-bottom: 1px solid var(--stone-200);
                    color: var(--stone-800);
                }
                .tropical-wrap .card-list { list-style: none; }
                .tropical-wrap .card-list li {
                    display: flex; gap: 10px;
                    margin-bottom: 14px;
                    font-size: 12px;
                    color: var(--stone-600);
                    line-height: 1.6;
                    font-weight: 500;
                }
                .tropical-wrap .card-list .n-blue { color: var(--blue-dark); font-family: var(--font-mono); font-size: 12px; font-weight: 700; flex-shrink: 0; width: 14px; }
                .tropical-wrap .card-list .n-grey { color: var(--stone-400); font-family: var(--font-mono); font-size: 12px; font-weight: 700; flex-shrink: 0; width: 14px; }

                .tropical-wrap .acc-heading {
                    font-family: var(--font-serif);
                    font-size: 20px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: var(--stone-800);
                    border-bottom: 2px solid rgba(41,37,36,0.8);
                    padding-bottom: 16px;
                    margin-bottom: 32px;
                    max-width: 820px;
                    margin-left: auto;
                    margin-right: auto;
                }
                .tropical-wrap .acc-grid {
                    max-width: 820px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                }
                .tropical-wrap .acc-card {
                    background: white;
                    border: 1px solid var(--stone-200);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                    display: flex;
                    flex-direction: column;
                }
                .tropical-wrap .acc-card img {
                    width: 100%;
                    height: 180px;
                    object-fit: cover;
                }
                .tropical-wrap .acc-card-body {
                    padding: 24px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .tropical-wrap .acc-card h4 {
                    font-family: var(--font-serif);
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--stone-800);
                    margin-bottom: 8px;
                }
                .tropical-wrap .acc-subtitle {
                    display: block;
                    background: #e6f0fa;
                    color: var(--blue-deep);
                    font-family: var(--font-sans);
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    border-radius: 8px;
                    padding: 6px 10px;
                }

                .tropical-wrap .invoice-section { background: var(--bg); }
                .tropical-wrap .invoice-wrap { max-width: 820px; margin: 0 auto; }
                .tropical-wrap .invoice-wrap h2 {
                    font-family: var(--font-serif);
                    font-size: clamp(20px, 3vw, 28px);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--stone-800);
                    margin-bottom: 4px;
                }
                .tropical-wrap .invoice-wrap > p {
                    font-size: 12px;
                    color: var(--stone-400);
                    margin-bottom: 20px;
                }

                .tropical-wrap .table-wrap {
                    overflow-x: auto;
                    border-radius: 12px;
                    border: 1px solid var(--stone-200);
                    background: var(--white);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                    margin-bottom: 20px;
                }
                .tropical-wrap table { width: 100%; border-collapse: collapse; table-layout: fixed; display: table; }
                .tropical-wrap thead { background: var(--bg); border-bottom: 1px solid var(--stone-200); display: table-header-group; }
                .tropical-wrap tbody { display: table-row-group; }
                .tropical-wrap tr { display: table-row; }
                .tropical-wrap th {
                    padding: 14px 20px;
                    font-family: var(--font-mono);
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--stone-800);
                    text-align: left;
                    display: table-cell;
                }
                .tropical-wrap th:last-child { text-align: right; }
                .tropical-wrap th:nth-child(2), .tropical-wrap th:nth-child(3) { text-align: center; }
                .tropical-wrap td {
                    padding: 16px 20px;
                    font-size: 12px;
                    color: var(--stone-600);
                    font-weight: 500;
                    border-bottom: 1px solid var(--stone-100);
                    vertical-align: middle;
                    display: table-cell;
                }
                .tropical-wrap tbody tr:last-child td { border-bottom: none; }
                .tropical-wrap td:first-child { font-weight: 700; color: var(--stone-800); }
                .tropical-wrap td:nth-child(2), .tropical-wrap td:nth-child(3) { text-align: center; font-family: var(--font-mono); color: var(--stone-500); }
                .tropical-wrap td:last-child { text-align: right; font-family: var(--font-mono); font-weight: 700; color: var(--stone-800); }

                .tropical-wrap .invoice-table th:nth-child(1) { width: 55%; }
                .tropical-wrap .invoice-table th:nth-child(2) { width: 10%; }
                .tropical-wrap .invoice-table th:nth-child(3) { width: 15%; }
                .tropical-wrap .invoice-table th:nth-child(4) { width: 20%; }

                .tropical-wrap .payment-table th:nth-child(1) { width: 40%; }
                .tropical-wrap .payment-table th:nth-child(2) { width: 20%; }
                .tropical-wrap .payment-table th:nth-child(3) { width: 20%; }
                .tropical-wrap .payment-table th:nth-child(4) { width: 20%; }

                .tropical-wrap .totals {
                    display: flex; flex-direction: column; align-items: flex-end;
                    gap: 10px;
                    padding-right: 4px;
                    margin-top: 20px;
                }
                .tropical-wrap .total-row {
                    display: flex; justify-content: space-between;
                    width: 240px;
                    font-size: 12px;
                    color: var(--stone-600);
                    font-weight: 500;
                }
                .tropical-wrap .total-row span:last-child { font-family: var(--font-mono); font-weight: 700; }
                .tropical-wrap .total-divider { width: 240px; height: 1px; background: var(--stone-200); margin: 4px 0; }
                .tropical-wrap .total-grand {
                    display: flex; justify-content: space-between;
                    width: 240px;
                    font-size: 14px;
                    font-weight: 700;
                    color: var(--stone-800);
                }
                .tropical-wrap .total-grand span:last-child { font-family: var(--font-mono); }

                .tropical-wrap .payment-section { border-top: 1px solid var(--stone-200); padding-top: 40px; margin-top: 40px; }
                .tropical-wrap .payment-section h2 {
                    display: flex; align-items: center; gap: 8px;
                    font-family: var(--font-serif);
                    font-size: 20px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--stone-800);
                    margin-bottom: 24px;
                }
                .tropical-wrap .payment-section h2 svg { color: var(--blue-dark); width: 20px; height: 20px; }

                .tropical-wrap .policy-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0;
                    margin-top: 32px;
                    border-top: 1px solid var(--stone-200);
                    padding-top: 24px;
                }
                .tropical-wrap .policy-col { padding: 0 20px; }
                .tropical-wrap .policy-col + .policy-col { border-left: 1px solid var(--stone-200); padding-left: 28px; }
                .tropical-wrap .policy-label {
                    font-family: var(--font-mono);
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--blue-dark);
                    margin-bottom: 12px;
                    display: block;
                }
                .tropical-wrap .policy-list { list-style: disc; padding-left: 16px; }
                .tropical-wrap .policy-list li {
                    font-size: 11px;
                    color: var(--stone-500);
                    font-weight: 500;
                    margin-bottom: 6px;
                    line-height: 1.5;
                }

                .tropical-wrap footer {
                    position: relative;
                    background: linear-gradient(135deg, #4f80b5, #1e3c72);
                    color: white;
                    padding: 64px 40px;
                    margin-top: -1px; /* Remove any gap */
                }
                .tropical-wrap .footer-wave {
                    position: absolute;
                    top: -1px;
                    left: 0;
                    width: 100%;
                    height: 50px;
                    overflow: hidden;
                    line-height: 0;
                    z-index: 10;
                }
                .tropical-wrap .footer-wave svg {
                    display: block;
                    width: calc(100% + 1.3px);
                    height: 100%;
                }
                .tropical-wrap .footer-wave .shape-fill {
                    fill: var(--bg);
                }
                .tropical-wrap footer h2 {
                    font-family: var(--font-serif);
                    font-size: 26px;
                    font-weight: 500;
                    text-align: center;
                    color: rgba(255,255,255,0.95);
                    margin-bottom: 40px;
                    letter-spacing: -0.3px;
                }
                .tropical-wrap .footer-grid {
                    max-width: 820px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                }
                .tropical-wrap .footer-card {
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 16px;
                    padding: 24px 20px;
                    text-align: center;
                }
                .tropical-wrap .footer-card svg { width: 24px; height: 24px; color: rgba(255,255,255,0.6); margin: 0 auto 12px; display: block; }
                .tropical-wrap .footer-card h4 {
                    font-family: var(--font-sans);
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    color: #a8c6e2;
                    margin-bottom: 12px;
                }
                .tropical-wrap .footer-card p, .tropical-wrap .footer-card span {
                    font-family: var(--font-mono);
                    font-size: 11px;
                    color: rgba(255,255,255,0.8);
                    line-height: 1.7;
                }
                .tropical-wrap .footer-card .bank-name {
                    font-family: var(--font-sans);
                    font-weight: 700;
                    color: white;
                    font-size: 13px;
                    display: block;
                    margin-bottom: 6px;
                }
                .tropical-wrap .footer-tag {
                    display: inline-block;
                    background: rgba(0,0,0,0.1);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 8px;
                    padding: 6px 14px;
                    font-family: var(--font-mono);
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    color: rgba(255,255,255,0.9);
                    margin-top: 8px;
                }
                `}
            </style>

            <div className="tropical-wrap">
                {/* ── HEADER ── */}
                <div className="hero" data-pdf-section="cover">
                    <img src={getCoverImage(itinerary)} alt="Resort Banner" crossOrigin="anonymous" />
                    <div className="hero-overlay"></div>
                </div>

                <div style={{ background: "var(--bg)", paddingBottom: "48px" }}>
                    <div className="header-card-wrap">
                        <div className="header-card">
                            <div className="stars">★★★★★</div>
                            <h1>{title}</h1>
                            <p>An exquisite escape perfectly designed for you.</p>
                            <div className="pills">
                                <span className="pill">{totalDays} Days • {totalNights} Nights</span>
                                {showPrices !== false && (
                                    <span className="pill">Total {formatCurrency(finalTotal, pricing?.currency || DEFAULT_CURRENCY)}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="meta-grid">
                        <div className="meta-box">
                            <div className="meta-col">
                                <span className="meta-label">Agency Details</span>
                                <h3>🌴 {agent.companyName}</h3>
                                <ul className="meta-list">
                                    {agent.agentEmail && (
                                        <li>
                                            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                                            {agent.agentEmail}
                                        </li>
                                    )}
                                    {agent.agentPhone && (
                                        <li>
                                            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.64 4.38 2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.07 6.07l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                            {agent.agentPhone}
                                        </li>
                                    )}
                                    {agent.agentWebsite && (
                                        <li>
                                            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                                            {agent.agentWebsite}
                                        </li>
                                    )}
                                </ul>
                            </div>
                            <div className="meta-col">
                                <span className="meta-label">Client Information</span>
                                <h3>Client Details</h3>
                                <ul className="meta-list">
                                    <li>
                                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        Client Name: <strong>{clientName || "Valued Guest"}</strong>
                                    </li>
                                    <li>
                                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                        Adults: <strong>{adultPax}</strong>
                                    </li>
                                    <li>
                                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                        Children: <strong>{childPax}</strong>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── ABOUT THE DESTINATION ── */}
                <section data-pdf-section="about">
                    <div className="about-grid">
                        <div className="about-img-wrap">
                            <img className="about-img" src={Array.isArray(itinerary.itinerary) && itinerary.itinerary.length > 0 ? getDayImage(itinerary.itinerary[0]) : "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop"} alt="Destination" crossOrigin="anonymous" />
                            <div className="about-glow"></div>
                        </div>
                        <div className="about-content">
                            <span className="capsule-badge">About The Destination</span>
                            <h2>{aboutPlace?.title || `Discover ${itinerary.itinerary?.[0]?.areaFocus?.split(',')[0] || "Your Destination"}`}</h2>
                            <p>{aboutPlace?.description || "Immerse yourself in the breathtaking landscapes, vibrant culture, and unforgettable experiences that await you. Every corner of this beautiful destination offers a new adventure and lasting memories."}</p>
                            <ul className="highlights">
                                {aboutPlace?.highlights ? (
                                    aboutPlace.highlights.map((highlight: string, idx: number) => (
                                        <li key={idx}>
                                            <div className="check-icon">
                                                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="2,6 5,9 10,3"/></svg>
                                            </div>
                                            {highlight}
                                        </li>
                                    ))
                                ) : (
                                    <>
                                        <li><div className="check-icon"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="2,6 5,9 10,3"/></svg></div>Breathtaking natural landscapes</li>
                                        <li><div className="check-icon"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="2,6 5,9 10,3"/></svg></div>Rich local history and culture</li>
                                        <li><div className="check-icon"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="2,6 5,9 10,3"/></svg></div>Unforgettable guided experiences</li>
                                        <li><div className="check-icon"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="2,6 5,9 10,3"/></svg></div>Vibrant culinary scenes</li>
                                        <li><div className="check-icon"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="2,6 5,9 10,3"/></svg></div>Perfect blend of relaxation and adventure</li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ── BRIEF PLAN ── */}
                <section data-pdf-section="brief-plan">
                    <div className="brief-box">
                        <h2>Brief Plan</h2>
                        <ul className="timeline">
                            {Array.isArray(itinerary.itinerary) && itinerary.itinerary.map((day, i) => (
                                <li key={i}>
                                    <span className="day-pill">Day {i + 1}</span>
                                    <div className="timeline-info">
                                        <h4>{formatTitleCase(day.areaFocus)}</h4>
                                        <p>{daySummaries && daySummaries[i] ? daySummaries[i] : `Highlights of ${day.areaFocus}`}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* ── DETAILED ITINERARY ── */}
                <section style={{ background: "#fbfaf8" }}>
                    <div style={{ textAlign: "center", marginBottom: 0 }}>
                        <span className="section-badge">OVERVIEW</span>
                        <h2 className="itinerary-heading">
                            {(() => {
                                const daysCount = Array.isArray(itinerary.itinerary) ? itinerary.itinerary.length : 0;
                                const words = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"];
                                const daysStr = daysCount <= 20 ? words[daysCount] : daysCount.toString();
                                return `${daysStr} Days of Wonder`;
                            })()}
                        </h2>
                        <div className="divider"></div>
                    </div>

                    <div className="day-cards">
                        {Array.isArray(itinerary.itinerary) && itinerary.itinerary.map((day, index) => (
                            <div key={index} className={`day-card ${index % 2 !== 0 ? 'reversed' : ''}`} data-pdf-section={`day-${index}`}>
                                <div>
                                    <span className="day-badge">Day {index + 1} • {formatDate(day.date)}</span>
                                    <h3>{formatTitleCase(day.areaFocus)}</h3>
                                    <ul className="day-items">
                                        {Array.isArray(day.timeline) && day.timeline.map((step, si) => (
                                            <li key={si}>
                                                {showTimestamps !== false ? (
                                                    <span className="num">{step.time}</span>
                                                ) : (
                                                    <span className="num" style={{width: '20px'}}>•</span>
                                                )}
                                                <span>{step.details}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="day-img-col">
                                    <img className="day-img" src={getDayImage(day)} alt={`Day ${index + 1}`} crossOrigin="anonymous" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── INCLUSIONS / EXCLUSIONS ── */}
                <section data-pdf-section="inclusions">
                    <div className="inc-exc-grid">
                        <div className="card sky">
                            <h3>Inclusions</h3>
                            <ul className="card-list">
                                {inclusionsList.length > 0 ? (
                                    inclusionsList.map((inc, i) => (
                                        <li key={i}><span className="n-blue">{i + 1}.</span><span>{inc}</span></li>
                                    ))
                                ) : (
                                    <li><span className="n-blue">-</span><span>Standard inclusions apply.</span></li>
                                )}
                            </ul>
                        </div>
                        <div className="card neutral">
                            <h3>Exclusions</h3>
                            <ul className="card-list">
                                {exclusionsList.length > 0 ? (
                                    exclusionsList.map((exc, i) => (
                                        <li key={i}><span className="n-grey">{i + 1}.</span><span>{exc}</span></li>
                                    ))
                                ) : (
                                    <li><span className="n-grey">-</span><span>Personal expenses not included.</span></li>
                                )}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ── TRAVEL & ACCOMMODATIONS ── */}
                {(hotels.length > 0 || flights.length > 0 || cabs.length > 0 || buses.length > 0) && (
                    <section data-pdf-section="accommodations">
                        <h2 className="acc-heading">Travel & Logistics</h2>
                        <div className="acc-grid">
                            {hotels.map((hotel, i) => (
                                <div key={`hotel-${i}`} className="acc-card">
                                    <img src={hotel.imageUrls && hotel.imageUrls.length > 0 ? hotel.imageUrls[0] : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop'} alt={hotel.name} crossOrigin="anonymous" />
                                    <div className="acc-card-body">
                                        <h4>{hotel.name}</h4>
                                        <span className="acc-subtitle">🏨 Hotel • Day {hotel.dayIndex + 1}</span>
                                        <div className="logistics-details">
                                            <div className="logistics-row"><span className="label">Check-in</span><span className="value">{hotel.checkIn}</span></div>
                                            <div className="logistics-row"><span className="label">Check-out</span><span className="value">{hotel.checkOut}</span></div>
                                            {hotel.bookingRef && <div className="logistics-row"><span className="label">Booking Ref</span><span className="value">{hotel.bookingRef}</span></div>}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {flights.map((flight, i) => (
                                <div key={`flight-${i}`} className="acc-card">
                                    <div style={{ height: '180px', background: 'var(--stone-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--stone-200)' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '48px', height: '48px', color: 'var(--stone-400)' }}>
                                            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 5-4 4-3.5-.5L1 18l5 2 2 5 1.5-1.5-.5-3.5 4-4 5 6 1.2-.7c.4-.2.7-.6.6-1.1z"/>
                                        </svg>
                                    </div>
                                    <div className="acc-card-body">
                                        <h4>{flight.airline}</h4>
                                        <span className="acc-subtitle">✈️ Flight • Day {flight.dayIndex + 1}</span>
                                        <div className="logistics-details">
                                            <div className="logistics-row"><span className="label">Route</span><span className="value">{flight.departureAirport} → {flight.arrivalAirport}</span></div>
                                            <div className="logistics-row"><span className="label">Departure</span><span className="value">{flight.departure}</span></div>
                                            {flight.pnr && <div className="logistics-row"><span className="label">PNR</span><span className="value">{flight.pnr}</span></div>}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {cabs.map((cab, i) => (
                                <div key={`cab-${i}`} className="acc-card">
                                    <div style={{ height: '180px', background: 'var(--stone-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--stone-200)' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '48px', height: '48px', color: 'var(--stone-400)' }}>
                                            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>
                                        </svg>
                                    </div>
                                    <div className="acc-card-body">
                                        <h4>{cab.vehicleType || 'Private Transfer'}</h4>
                                        <span className="acc-subtitle">🚕 Cab/Transfer • Day {cab.dayIndex + 1}</span>
                                        <div className="logistics-details">
                                            <div className="logistics-row"><span className="label">Route</span><span className="value">{cab.route || 'Local'}</span></div>
                                            <div className="logistics-row"><span className="label">Pickup</span><span className="value">{cab.pickupTime}</span></div>
                                            {cab.driverName && <div className="logistics-row"><span className="label">Driver</span><span className="value">{cab.driverName}</span></div>}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {buses.map((bus, i) => (
                                <div key={`bus-${i}`} className="acc-card">
                                    <div style={{ height: '180px', background: 'var(--stone-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--stone-200)' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '48px', height: '48px', color: 'var(--stone-400)' }}>
                                            <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
                                        </svg>
                                    </div>
                                    <div className="acc-card-body">
                                        <h4>{bus.busType || 'Tourist Bus'}</h4>
                                        <span className="acc-subtitle">🚌 Bus • Day {bus.dayIndex + 1}</span>
                                        <div className="logistics-details">
                                            <div className="logistics-row"><span className="label">Route</span><span className="value">{bus.route}</span></div>
                                            <div className="logistics-row"><span className="label">Departure</span><span className="value">{bus.departureTime}</span></div>
                                            {bus.pnr && <div className="logistics-row"><span className="label">PNR</span><span className="value">{bus.pnr}</span></div>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── INVOICE & PAYMENT ── */}
                <section className="invoice-section" data-pdf-section="pricing">
                        <div className="invoice-wrap">
                            <h2>Package Invoice</h2>
                            <p>Complete package breakdown</p>

                            <div className="table-wrap">
                                <table className="invoice-table">
                                    <colgroup>
                                        <col style={{ width: '55%' }} />
                                        <col style={{ width: '10%' }} />
                                        <col style={{ width: '15%' }} />
                                        <col style={{ width: '20%' }} />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th>Qty</th>
                                            <th>Rate</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>{isManual ? "Consolidated Package Cost" : "Package Cost (Incl. Accommodations, Flights, Activities)"} for {adultPax} Adults{childPax ? `, ${childPax} Children` : ''}</td>
                                            <td>1</td>
                                            <td>{formatCurrency(costWithMarkup, currency)}</td>
                                            <td>{formatCurrency(costWithMarkup, currency)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="totals">
                                <div className="total-row"><span>Subtotal:</span><span>{formatCurrency(costWithMarkup, currency)}</span></div>
                                <div className="total-row"><span>Taxes & Fees:</span><span>{formatCurrency(taxAmount, currency)}</span></div>
                                <div className="total-divider"></div>
                                <div className="total-grand"><span>Grand Total:</span><span>{formatCurrency(finalTotal, currency)}</span></div>
                            </div>

                            {/* Payment Schedule */}
                            <div className="payment-section">
                                <h2>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
                                    Payment Schedule
                                </h2>
                                <div className="table-wrap">
                                    <table className="payment-table">
                                        <colgroup>
                                            <col style={{ width: '40%' }} />
                                            <col style={{ width: '20%' }} />
                                            <col style={{ width: '20%' }} />
                                            <col style={{ width: '20%' }} />
                                        </colgroup>
                                        <thead>
                                            <tr>
                                                <th>Installment</th>
                                                <th>Due Date</th>
                                                <th>Percentage</th>
                                                <th>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(pricing?.milestones && pricing.milestones.length > 0 ? pricing.milestones : [{ id: 'fallback', name: isManual ? 'Package Cost' : 'Advance Payment', percentage: 100, dueDate: 'At Booking' }]).map((m: any, i: number, arr: any[]) => {
                                                const amount = m.id === 'fallback' ? finalTotal : (finalTotal * m.percentage) / 100;
                                                return (
                                                    <tr key={m.id || i}>
                                                        <td>{m.name}</td>
                                                        <td style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontWeight: 600, color: "var(--stone-500)" }}>{m.dueDate}</td>
                                                        <td style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--stone-500)" }}>{m.id === 'fallback' ? '-' : `${m.percentage}%`}</td>
                                                        <td>{formatCurrency(amount, currency)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="policy-grid">
                                    <div className="policy-col">
                                        <span className="policy-label">Payment Methods</span>
                                        <ul className="policy-list">
                                            {paymentMethods ? (
                                                parseList(paymentMethods).map((pol, i) => (
                                                    <li key={i}>{pol}</li>
                                                ))
                                            ) : agent?.bankDetails ? (
                                                <li>{agent.bankDetails}</li>
                                            ) : (
                                                <li>Standard payment terms apply.</li>
                                            )}
                                        </ul>
                                    </div>
                                    <div className="policy-col">
                                        <span className="policy-label">Cancellation Policy</span>
                                        <ul className="policy-list">
                                            {cancellationPolicy ? (
                                                parseList(cancellationPolicy).map((pol, i) => (
                                                    <li key={i}>{pol}</li>
                                                ))
                                            ) : (
                                                <>
                                                    <li>45+ days prior: 100% refund of total package.</li>
                                                    <li>30-44 days prior: 75% refund of total package.</li>
                                                    <li>15-29 days prior: 50% refund of total package.</li>
                                                    <li>Less than 15 days prior: Standard service fees apply, non-refundable.</li>
                                                </>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                {/* ── FOOTER ── */}
                <footer data-pdf-section="footer">
                    <div className="footer-wave">
                        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                            <path d="M0,0 L1200,0 L1200,80 C800,0 400,120 0,80 Z" className="shape-fill"></path>
                        </svg>
                    </div>
                    <h2>Agency Account Details</h2>
                    <div className="footer-grid">
                        <div className="footer-card">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
                            <h4>Bank Details</h4>
                            <span className="bank-name">{agencySettings?.bankName || 'HDFC Bank'}</span>
                            <p>ACC: {agencySettings?.bankAccountNumber || '1234567890'}<br/>IFSC: {agencySettings?.bankIfscCode || 'HDFC0001234'}</p>
                        </div>
                        <div className="footer-card">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            <h4>GST / Tax ID Number</h4>
                            <span className="footer-tag">{agencySettings?.gstNumber || '29GGGGG1314R9Z6'}</span>
                        </div>
                        <div className="footer-card">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                            <h4>UPI ID</h4>
                            <span className="footer-tag">{agencySettings?.upiId || 'YOUR-AGENCY@UP9Z6'}</span>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};
