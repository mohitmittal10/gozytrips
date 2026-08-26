import React from 'react';
import type { ThemeProps } from './classic-theme';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { getCurrencySymbol, formatCurrency } from '@/lib/utils/currency';
import { getAgentInfo, getCoverImage, getDayImage, formatDate } from '../utils';
import { calcPricingFromBaseCost, calcBaseCost, extractTripCost } from '@/services/financial';

const parseList = (text?: any): string[] => {
    if (!text) return [];
    if (Array.isArray(text)) {
        return text.map(s => String(s).trim().replace(/^[-•◆✓✕]\s*/, '')).filter(s => s.length > 0 && s !== '-');
    }
    if (typeof text !== 'string') return [String(text)];
    return text.split('\n').map(s => s.trim().replace(/^[-•◆✓✕]\s*/, '')).filter(s => s.length > 0 && s !== '-');
};

const parseCancellationPoints = (text?: any): string[] => {
    if (!text) return [
        '60+ days pre-departure: 10% cancellation fee',
        '30–59 days pre-departure: 40% cancellation fee',
        '15–29 days pre-departure: 70% cancellation fee',
        'Less than 15 days pre-departure: 100% cancellation fee'
    ];
    if (Array.isArray(text)) {
        const cleanArr = text.map(s => String(s).trim().replace(/^[-•◆✓✕]\s*/, '')).filter(Boolean);
        if (cleanArr.length > 0) return cleanArr;
    }
    if (typeof text !== 'string') {
        return [String(text)];
    }
    const parts = text.split(/\s*[\n·;•]\s*/).map(s => s.trim().replace(/^[-•◆✓✕]\s*/, '')).filter(Boolean);
    if (parts.length > 0) return parts;
    return [text];
};

const formatAccountNumber = (val: string) => {
    const clean = val.trim();
    const digitsOnly = clean.replace(/[\s-]/g, '');
    if (/^\d{9,18}$/.test(digitsOnly)) {
        return digitsOnly.replace(/(.{4})/g, '$1 ').trim();
    }
    return clean;
};

const formatIfscCode = (val: string) => {
    return val.trim().toUpperCase();
};

interface ParsedBankDetails {
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
    iban?: string;
    swiftCode?: string;
    sortCode?: string;
    branch?: string;
    extraRows: { k: string; v: string }[];
}

const parseBankDetails = (
    data: any,
    agencySettings?: any,
    agentCompanyName?: string,
    upiFallback?: string
): ParsedBankDetails => {
    let bankName = '';
    let accountName = '';
    let accountNumber = '';
    let ifscCode = '';
    let upiId = upiFallback || agencySettings?.upi || agencySettings?.upi_id || agencySettings?.upiId || '';
    let iban = '';
    let swiftCode = '';
    let sortCode = '';
    let branch = '';
    const extraRows: { k: string; v: string }[] = [];

    // 1. If data is object
    const obj = (typeof data === 'object' && data !== null)
        ? data
        : (typeof agencySettings?.bank_details === 'object' && agencySettings?.bank_details !== null)
            ? agencySettings.bank_details
            : null;

    if (obj) {
        bankName = String(obj.bankName || obj.bank_name || obj.bank || '').trim();
        accountName = String(obj.accountName || obj.account_name || obj.account || obj.accountHolder || obj.holder_name || '').trim();
        const rawAcc = String(obj.accountNumber || obj.account_number || obj.accountNo || obj.accNo || obj.bankAccountNumber || '').trim();
        if (rawAcc) accountNumber = formatAccountNumber(rawAcc);
        const rawIfsc = String(obj.ifsc || obj.ifscCode || obj.ifsc_code || obj.bankIfscCode || '').trim();
        if (rawIfsc) ifscCode = formatIfscCode(rawIfsc);
        const rawUpi = String(obj.upi || obj.upiId || obj.upi_id || '').trim();
        if (rawUpi) upiId = rawUpi;
        if (obj.iban) iban = String(obj.iban).trim().toUpperCase();
        if (obj.swift || obj.swiftCode || obj.swift_code) swiftCode = String(obj.swift || obj.swiftCode || obj.swift_code).trim().toUpperCase();
        if (obj.sortCode || obj.sort_code) sortCode = String(obj.sortCode || obj.sort_code).trim();
        if (obj.branch) branch = String(obj.branch).trim();
    }

    // 2. If data is formatted text
    const textData = (typeof data === 'string' && data.trim())
        ? data
        : (typeof agencySettings?.bank_details === 'string' && agencySettings.bank_details.trim())
            ? agencySettings.bank_details
            : '';

    if (textData) {
        const lines = textData.split('\n').map((l: string) => l.trim()).filter(Boolean);
        lines.forEach((line: string) => {
            const parts = line.split(':');
            if (parts.length >= 2) {
                const rawK = parts[0].trim().toLowerCase();
                const rawV = parts.slice(1).join(':').trim();

                if (/bank\s*(name)?/i.test(rawK)) {
                    if (!bankName) bankName = rawV;
                } else if (/acc(ount)?\s*(name|holder)/i.test(rawK)) {
                    if (!accountName) accountName = rawV;
                } else if (/acc(ount)?\s*(no|num|number)?|a\/c\s*(no|num|number)?/i.test(rawK)) {
                    if (!accountNumber) accountNumber = formatAccountNumber(rawV);
                } else if (/ifsc\s*(code)?/i.test(rawK)) {
                    if (!ifscCode) ifscCode = formatIfscCode(rawV);
                } else if (/upi\s*(id)?/i.test(rawK)) {
                    if (!upiId) upiId = rawV;
                } else if (/iban/i.test(rawK)) {
                    if (!iban) iban = rawV.toUpperCase();
                } else if (/swift|bic/i.test(rawK)) {
                    if (!swiftCode) swiftCode = rawV.toUpperCase();
                } else if (/sort\s*(code)?/i.test(rawK)) {
                    if (!sortCode) sortCode = rawV;
                } else if (/branch\s*(name)?/i.test(rawK)) {
                    if (!branch) branch = rawV;
                } else {
                    extraRows.push({ k: parts[0].trim(), v: rawV });
                }
            } else if (line) {
                extraRows.push({ k: 'Bank Details', v: line });
            }
        });
    }

    // 3. Fallbacks from agencySettings or agent company name
    if (!bankName) bankName = String(agencySettings?.bank_name || agencySettings?.bankName || agencySettings?.brand_name || agentCompanyName || '').trim();
    if (!accountName) accountName = String(agencySettings?.account_name || agencySettings?.accountName || agentCompanyName || agencySettings?.brand_name || '').trim();
    if (!accountNumber) {
        const raw = String(agencySettings?.account_number || agencySettings?.accountNumber || '').trim();
        if (raw) accountNumber = formatAccountNumber(raw);
    }
    if (!ifscCode) {
        const raw = String(agencySettings?.ifsc_code || agencySettings?.ifscCode || '').trim();
        if (raw) ifscCode = formatIfscCode(raw);
    }
    if (!iban) iban = String(agencySettings?.iban || '').trim().toUpperCase();
    if (!swiftCode) swiftCode = String(agencySettings?.swift_code || agencySettings?.swiftCode || '').trim().toUpperCase();

    return {
        bankName,
        accountName,
        accountNumber,
        ifscCode,
        upiId,
        iban,
        swiftCode,
        sortCode,
        branch,
        extraRows
    };
};

export const LuxuryTheme = ({
    itinerary,
    title,
    clientName,
    agencySettings,
    agent,
    hotels = [],
    flights = [],
    cabs = [],
    buses = [],
    pricing,
    baseCost = 0,
    finalTotal = 0,
    showTimestamps = true,
    inclusions,
    exclusions,
    termsAndConditions,
    cancellationPolicy,
    paymentMethods,
    daySummaries,
    aboutPlace
}: ThemeProps) => {
    const currency = pricing?.currency || DEFAULT_CURRENCY;
    const currencySymbol = getCurrencySymbol(currency);
    const adultPax = Number(pricing?.adultPax || 2);
    const childPax = Number(pricing?.childPax || 0);
    const infantPax = Number(pricing?.infantPax || 0);
    const totalPax = Math.max(1, adultPax + childPax + infantPax);

    // Extract financial data dynamically from client_price, budget, itinerary_data, hotels/flights, or dailyStats
    const extractedCost = extractTripCost({
        client_price: (itinerary as any)?.client_price || pricing?.clientPrice || pricing?.finalTotal,
        budget: (itinerary as any)?.budget || pricing?.budget,
        itinerary_data: (itinerary as any)?.itinerary_data || itinerary
    });

    const resolvedBase = baseCost || calcBaseCost({
        itinerary: (itinerary?.itinerary ? itinerary.itinerary : []) as any,
        hotels,
        flights,
        cabs,
        buses,
        pricing
    });

    const { baseCost: resolvedBaseCost, markupAmount, costWithMarkup: calcCostWithMarkup, taxAmount: calcTaxAmount, finalTotal: calculatedFinalTotal } = calcPricingFromBaseCost(resolvedBase, pricing);

    const displayFinalTotal = finalTotal || extractedCost || calculatedFinalTotal || 0;
    const taxRate = Number(pricing?.taxPercentage || pricing?.taxRate || 0);
    const taxAmount = calcTaxAmount || (taxRate > 0 ? (displayFinalTotal * taxRate) / (100 + taxRate) : 0);
    const costWithMarkup = calcCostWithMarkup || (displayFinalTotal - taxAmount);

    // Derived passenger string
    const travellerSummary = [
        adultPax > 0 ? `${adultPax} Adult${adultPax > 1 ? 's' : ''}` : null,
        childPax > 0 ? `${childPax} Child${childPax > 1 ? 'ren' : ''}` : null,
        infantPax > 0 ? `${infantPax} Infant${infantPax > 1 ? 's' : ''}` : null,
    ].filter(Boolean).join(', ') || '2 Adults';

    // Derived agency & consultant overrides
    const agencyOverrides = (itinerary as any)?.agencyOverrides || {};
    const consultantOverrides = (itinerary as any)?.consultant || {};
    const bookingOverrides = (itinerary as any)?.bookingDetails || {};

    const companyName = agencyOverrides.companyName || agent.companyName || agencySettings?.brand_name || '';
    const brandTagline = agencyOverrides.tagline || agent.tagline || agencySettings?.brand_tagline || '';
    const agentEmail = agencyOverrides.email || agent.agentEmail || '';
    const agentPhone = agencyOverrides.phone || agent.agentPhone || '';
    const agentWebsite = agencyOverrides.website || agent.agentWebsite || '';
    const agentAddress = agencyOverrides.address || agencySettings?.address || (agent as any).address || '';

    const consultantName = consultantOverrides.name || agent.agentName || agencySettings?.consultant_name || agencySettings?.consultantName || '';
    const consultantTitle = consultantOverrides.title || agencySettings?.consultantTitle || (agent as any).role || '';

    const clientNameResolved = (itinerary as any)?.clientDetails?.name
        || (itinerary as any)?.client_name
        || (itinerary as any)?.clientName
        || clientName
        || (itinerary as any)?.guestNames
        || bookingOverrides.guestNames
        || '';

    const clientEmail = (itinerary as any)?.clientDetails?.email
        || (itinerary as any)?.client_email
        || (itinerary as any)?.clientEmail
        || '';

    const clientPhone = (itinerary as any)?.clientDetails?.phone
        || (itinerary as any)?.client_phone
        || (itinerary as any)?.clientPhone
        || '';

    const travellerSummaryStr = (itinerary as any)?.travellerSummary || travellerSummary;

    const bookingRef = (itinerary as any)?.referenceNo
        || (itinerary as any)?.bookingRef
        || bookingOverrides.reference
        || '';

    const issueDate = (itinerary as any)?.issueDate
        || bookingOverrides.issueDate
        || ((itinerary as any)?.created_at ? new Date((itinerary as any).created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

    const departureDate = (itinerary as any)?.departureDate
        || (itinerary as any)?.tripMetadata?.startDate
        || bookingOverrides.departureDate
        || (Array.isArray(itinerary?.itinerary) && itinerary.itinerary[0]?.date ? itinerary.itinerary[0].date : null)
        || '';

    const returnDate = (itinerary as any)?.returnDate
        || (itinerary as any)?.tripMetadata?.endDate
        || bookingOverrides.returnDate
        || (Array.isArray(itinerary?.itinerary) && itinerary.itinerary.length > 0 && itinerary.itinerary[itinerary.itinerary.length - 1]?.date ? itinerary.itinerary[itinerary.itinerary.length - 1].date : null)
        || '';

    const inclusionsList = parseList((itinerary as any)?.inclusions || inclusions);
    const exclusionsList = parseList((itinerary as any)?.exclusions || exclusions);
    const termsAndConditionsList = parseList((itinerary as any)?.termsAndConditions || termsAndConditions);
    const paymentMethodsList = parseList((itinerary as any)?.paymentMethods || paymentMethods);
    const cancellationPoints = parseCancellationPoints((itinerary as any)?.cancellationPolicy || cancellationPolicy);

    // Days array
    const days = Array.isArray(itinerary?.itinerary) ? itinerary.itinerary : [];

    // Highlights logic
    const highlightsList = parseList(
        (itinerary as any)?.highlights || aboutPlace?.highlights || daySummaries || days.map(d => (d as any).themeTitle || (d as any).title).filter(Boolean)
    );

    // Hero & About details
    const coverImage = aboutPlace?.heroImageUrl || getCoverImage(itinerary) || 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600';
    const aboutText = (itinerary as any)?.aboutPlace?.aboutText || aboutPlace?.aboutText || (itinerary as any)?.summary || (itinerary as any)?.overview || 'A land of staggering extremes — ancient glaciers, wind-carved peaks, and skies that never quite go dark.';

    // Installments derived from pricing config or milestones
    const installments = pricing?.installments && pricing.installments.length > 0
        ? pricing.installments
        : pricing?.milestones && pricing.milestones.length > 0
            ? pricing.milestones.map((m: any) => ({
                amount: formatCurrency((displayFinalTotal * (m.percentage || 0)) / 100, currency),
                dueDate: m.label || m.dueDate || 'Milestone',
                note: `${m.percentage}% payment milestone`
            }))
            : [
                {
                    amount: formatCurrency(displayFinalTotal * 0.3, currency),
                    dueDate: 'On Confirmation',
                    note: '30% deposit to secure booking'
                },
                {
                    amount: formatCurrency(displayFinalTotal * 0.7, currency),
                    dueDate: '14 Days Pre-Departure',
                    note: 'Balance payment 14 days pre-departure'
                }
            ];

    // Bank details
    const rawBankData = (itinerary as any)?.bankDetails || agencySettings?.bank_details || agent.bankDetails || agencySettings || null;
    const upiFallback = (itinerary as any)?.upi || (typeof rawBankData === 'object' ? rawBankData?.upi || rawBankData?.upiId : null) || agencySettings?.upi || agencySettings?.upiId || agencySettings?.upi_id || '';
    const bankDetailsObj = parseBankDetails(rawBankData, agencySettings, companyName, upiFallback);

    return (
        <div className="luxury-wrap" style={{ width: "100%", backgroundColor: "#0a0a09" }}>
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Mono:wght@400;500&display=swap');

                .luxury-wrap {
                    --bg:            #0a0a09;
                    --bg-panel:      #14120f;
                    --cream:         #f5f0e8;
                    --cream-soft:    rgba(245,240,232,0.61);
                    --cream-softer:  rgba(245,240,232,0.56);
                    --cream-hair:    rgba(245,240,232,0.06);
                    --cream-hair-2:  rgba(245,240,232,0.03);
                    --cream-hair-3:  rgba(245,240,232,0.02);
                    --muted:         #7a756a;
                    --label:         #aeaaa3;
                    --gold:          #c9a84c;
                    --gold-hair:     rgba(201,168,76,0.13);
                    --green:         #4ade80;
                    --red:           #f87171;

                    --font-display:  'Abril Fatface', serif;
                    --font-serif:    'Crimson Pro', serif;
                    --font-mono:     'DM Mono', monospace;

                    background: var(--bg);
                    color: var(--cream);
                    font-family: var(--font-serif);
                    line-height: 1.5;
                    -webkit-font-smoothing: antialiased;
                }

                .luxury-wrap *, .luxury-wrap *::before, .luxury-wrap *::after {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                .luxury-wrap .doc {
                    max-width: 1056px;
                    margin: 0 auto;
                    background: var(--bg);
                }

                /* Section alternating themes */
                .luxury-wrap section.sec-bg-main {
                    background: var(--bg);
                    padding: 0 74px;
                }
                .luxury-wrap section.sec-bg-panel {
                    background: var(--bg-panel);
                    border-top: 1px solid var(--cream-hair-3);
                    border-bottom: 1px solid var(--cream-hair-3);
                    padding: 0 74px;
                }

                @media (max-width: 900px){
                    .luxury-wrap section.sec-bg-main,
                    .luxury-wrap section.sec-bg-panel { padding: 0 24px; }
                }

                .luxury-wrap .section-inner { padding: 62px 0; }

                .luxury-wrap .eyebrow {
                    font-family: var(--font-serif);
                    font-size: 13px;
                    letter-spacing: 3.3px;
                    text-transform: uppercase;
                    color: var(--gold);
                    font-weight: 700;
                }

                .luxury-wrap h1.display, .luxury-wrap h2.display, .luxury-wrap h3.display {
                    font-family: var(--font-display);
                    font-weight: 400;
                    color: var(--cream);
                    line-height: 1.1;
                }

                .luxury-wrap .rule {
                    width: 48px;
                    height: 1px;
                    background: var(--gold);
                    margin: 20px 0;
                    border: none;
                }

                .luxury-wrap .hairline {
                    border: none;
                    border-top: 1px solid var(--cream-hair-2);
                }

                .luxury-wrap a { color: inherit; text-decoration: none; }

                /* ---------- COVER (HERO WITH IMAGE) ---------- */
                .luxury-wrap .cover {
                    min-height: 580px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    background-position: center;
                    background-size: cover;
                    background-repeat: no-repeat;
                    position: relative;
                    overflow: hidden;
                    background-color: #0a0a09;
                }
                .luxury-wrap .cover::after {
                    content: "";
                    position: absolute; inset: 0;
                    background: linear-gradient(to bottom, rgba(10,10,9,0.35) 0%, rgba(10,10,9,0.75) 70%, rgba(10,10,9,1) 100%);
                }
                .luxury-wrap .cover .cover-inner {
                    position: relative;
                    z-index: 2;
                    padding: 60px 24px;
                    max-width: 800px;
                }
                .luxury-wrap .cover .cover-inner h1 {
                    font-size: clamp(38px, 6vw, 64px);
                    color: var(--cream);
                }
                .luxury-wrap .cover .cover-inner p {
                    margin-top: 16px;
                    color: var(--cream-soft);
                    font-style: italic;
                    font-size: 20px;
                }

                /* ---------- AGENCY / BOOKING DETAILS (STRICTLY SIDE BY SIDE) ---------- */
                .luxury-wrap .two-col {
                    display: flex;
                    flex-direction: row;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 58px;
                    width: 100%;
                }
                .luxury-wrap .two-col > div {
                    flex: 1 1 0px;
                    min-width: 0;
                }
                @media (max-width: 768px) {
                    .luxury-wrap .two-col {
                        flex-direction: column;
                        gap: 36px;
                    }
                }

                .luxury-wrap .agency h2.display { font-size: 54px; margin-bottom: 0; }
                .luxury-wrap .agency .co-name { font-size: 17px; margin-top: 8px; }
                .luxury-wrap .agency .co-tagline { font-size: 14px; color: var(--gold); font-style: italic; margin-top: 4px; }

                .luxury-wrap .contact-list { margin-top: 24px; border-top: 1px solid transparent; }
                .luxury-wrap .contact-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 0;
                    font-size: 14px;
                    color: var(--muted);
                }
                .luxury-wrap .contact-row .icon { width: 12px; height: 12px; flex: none; opacity: .8; }

                .luxury-wrap .consultant-block {
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid var(--gold-hair);
                }
                .luxury-wrap .consultant-block .label {
                    font-family: var(--font-mono);
                    font-size: 10px;
                    letter-spacing: 2.6px;
                    text-transform: uppercase;
                    color: var(--gold);
                }
                .luxury-wrap .consultant-block .name {
                    font-family: var(--font-display);
                    font-size: 23px;
                    margin-top: 6px;
                }
                .luxury-wrap .consultant-block .title {
                    font-size: 13px;
                    font-style: italic;
                    color: var(--muted);
                    margin-top: 4px;
                }

                .luxury-wrap .booking-details .label {
                    font-family: var(--font-mono);
                    font-size: 10px;
                    letter-spacing: 2.6px;
                    text-transform: uppercase;
                    color: var(--gold);
                    font-weight: 700;
                }
                .luxury-wrap .booking-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 0;
                    border-bottom: 1px solid var(--cream-hair-2);
                }
                .luxury-wrap .booking-row .k {
                    font-family: var(--font-mono);
                    font-size: 10px;
                    letter-spacing: 1.2px;
                    text-transform: uppercase;
                    color: var(--label);
                }
                .luxury-wrap .booking-row .v { font-size: 16px; }
                .luxury-wrap .booking-row .v.strong { font-weight: 700; }

                /* ---------- ABOUT THE PLACE & HIGHLIGHTS ---------- */
                .luxury-wrap .about-hero {
                    position: relative;
                    width: 100%;
                    height: 393px;
                    overflow: hidden;
                    background-position: center;
                    background-size: cover;
                    background-repeat: no-repeat;
                }
                .luxury-wrap .about-hero::after {
                    content: "";
                    position: absolute; inset: 0;
                    background: linear-gradient(to bottom, rgba(10,10,9,.3), rgba(10,10,9,.85));
                }
                .luxury-wrap .about-hero .about-copy {
                    position: relative;
                    z-index: 1;
                    max-width: 580px;
                    margin: 0 auto;
                    text-align: center;
                    padding-top: 110px;
                }
                .luxury-wrap .about-hero .rule { margin: 20px auto; }
                .luxury-wrap .about-hero h2.display { font-size: 42px; }
                .luxury-wrap .about-hero p.about-text {
                    margin-top: 20px;
                    font-style: italic;
                    color: var(--cream-soft);
                    font-size: 17px;
                }

                .luxury-wrap .highlights {
                    padding: 50px 74px;
                    max-width: 850px;
                    margin-left: 0;
                }
                @media (max-width: 900px) {
                    .luxury-wrap .highlights { padding: 40px 24px; }
                }
                .luxury-wrap .highlights .eyebrow { display:block; margin-bottom: 16px; }
                .luxury-wrap .highlight-item {
                    display: flex;
                    gap: 12px;
                    padding: 10px 0;
                }
                .luxury-wrap .highlight-item .bullet { color: var(--gold); font-size: 10px; margin-top: 6px; flex: none; }
                .luxury-wrap .highlight-item .text { font-size: 16px; color: var(--cream); }

                /* ---------- DAY BY DAY OVERVIEW GRID ---------- */
                .luxury-wrap .journey-heading { padding-top: 0; }
                .luxury-wrap .journey-heading h2.display { font-size: 40px; margin-top: 8px; }

                .luxury-wrap .day-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 0;
                    margin-top: 30px;
                    border-top: 1px solid var(--cream-hair-3);
                    border-left: 1px solid var(--cream-hair-3);
                }
                @media (max-width: 768px) {
                    .luxury-wrap .day-grid { grid-template-columns: repeat(2, 1fr); }
                }
                .luxury-wrap .day-grid .day-tile {
                    border-right: 1px solid var(--cream-hair-3);
                    border-bottom: 1px solid var(--cream-hair-3);
                    padding: 22px 20px;
                    background: var(--bg-panel);
                }
                .luxury-wrap .day-tile .num {
                    font-family: var(--font-display);
                    font-size: 32px;
                    color: var(--gold);
                }
                .luxury-wrap .day-tile .date {
                    font-family: var(--font-mono);
                    font-size: 11px;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    color: var(--label);
                    margin-top: 14px;
                }
                .luxury-wrap .day-tile .title { font-size: 16px; margin-top: 4px; }
                .luxury-wrap .day-tile .loc { font-size: 14px; color: var(--muted); margin-top: 2px; }

                /* ---------- ITINERARY DAY CARDS ---------- */
                .luxury-wrap .itinerary-days { padding: 0 0 40px; }
                .luxury-wrap .itinerary-heading h2.display { font-size: 40px; margin-top: 8px; }

                .luxury-wrap .day-card {
                    display: flex;
                    border-bottom: 1px solid var(--cream-hair-3);
                    min-height: 332px;
                }
                @media (max-width: 768px) {
                    .luxury-wrap .day-card, .luxury-wrap .day-card.reverse { flex-direction: column; }
                    .luxury-wrap .day-card .photo { flex: none; height: 260px; }
                }
                .luxury-wrap .day-card.reverse { flex-direction: row-reverse; }
                .luxury-wrap .day-card .photo {
                    position: relative;
                    flex: 0 0 372px;
                    background-position: center;
                    background-size: cover;
                    background-repeat: no-repeat;
                    background-color: #1c1a17;
                }
                .luxury-wrap .day-card .photo .day-tag {
                    position: absolute;
                    left: 20px; bottom: 20px;
                    font-family: var(--font-mono);
                    font-size: 9px;
                    letter-spacing: 1.8px;
                    text-transform: uppercase;
                    color: var(--gold);
                    background: rgba(10,10,9,.85);
                    padding: 4px 8px;
                }
                .luxury-wrap .day-card .content {
                    flex: 1;
                    padding: 33px 41px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .luxury-wrap .day-card:nth-child(even) .content {
                    background: var(--bg-panel);
                }
                .luxury-wrap .day-card:nth-child(odd) .content {
                    background: var(--bg);
                }
                .luxury-wrap .day-card .content .loc-label {
                    font-size: 10px;
                    letter-spacing: 2.6px;
                    text-transform: uppercase;
                    color: var(--gold);
                }
                .luxury-wrap .day-card .content h3.display {
                    font-size: 25px;
                    margin-top: 8px;
                }
                .luxury-wrap .activity-list { margin-top: 12px; }
                .luxury-wrap .activity-row {
                    display: flex;
                    gap: 10px;
                    font-size: 16px;
                    color: var(--cream-soft);
                    padding: 5px 0;
                }
                .luxury-wrap .activity-row .dash { color: var(--gold); }

                .luxury-wrap .day-meta {
                    display: flex;
                    gap: 40px;
                    margin-top: 20px;
                    padding-top: 16px;
                    border-top: 1px solid var(--cream-hair-2);
                    flex-wrap: wrap;
                }
                .luxury-wrap .day-meta .col { flex: 1; min-width: 140px; max-width: 294px; }
                .luxury-wrap .day-meta .label {
                    font-family: var(--font-mono);
                    font-size: 8px;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    color: var(--gold);
                }
                .luxury-wrap .day-meta .name { font-size: 13px; margin-top: 6px; }
                .luxury-wrap .day-meta .note { font-size: 11px; font-style: italic; color: var(--muted); margin-top: 6px; }
                .luxury-wrap .day-meta .meal-line { font-size: 13px; color: var(--cream); margin-top: 4px; }

                /* ---------- LOGISTICS SUMMARY ---------- */
                .luxury-wrap .logistics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin-top: 24px;
                }
                .luxury-wrap .logistics-card {
                    padding: 20px;
                    border: 1px solid var(--cream-hair-2);
                    background: var(--bg);
                }
                .luxury-wrap .logistics-card .card-type {
                    font-family: var(--font-mono);
                    font-size: 9px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    color: var(--gold);
                }
                .luxury-wrap .logistics-card .card-title {
                    font-size: 16px;
                    font-weight: 600;
                    margin-top: 4px;
                }
                .luxury-wrap .logistics-card .card-detail {
                    font-size: 13px;
                    color: var(--muted);
                    margin-top: 4px;
                }

                /* ---------- INCLUSIONS / EXCLUSIONS (STRICTLY SIDE BY SIDE) ---------- */
                .luxury-wrap .incl-heading h2.display { font-size: 40px; margin-top: 8px; }
                .luxury-wrap .incl-grid {
                    display: flex;
                    flex-direction: row;
                    gap: 48px;
                    margin-top: 30px;
                    width: 100%;
                }
                .luxury-wrap .incl-col {
                    flex: 1 1 0px;
                    min-width: 0;
                }
                @media (max-width: 768px) {
                    .luxury-wrap .incl-grid {
                        flex-direction: column;
                        gap: 32px;
                    }
                }
                .luxury-wrap .incl-col .col-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 20px;
                    letter-spacing: 1.7px;
                    text-transform: uppercase;
                    padding-bottom: 12px;
                    border-bottom: 1px solid var(--cream-hair-2);
                }
                .luxury-wrap .incl-col.included .col-title { color: var(--green); }
                .luxury-wrap .incl-col.excluded .col-title { color: var(--red); }
                .luxury-wrap .incl-row {
                    display: flex;
                    gap: 12px;
                    padding: 10px 0;
                    border-bottom: 1px solid var(--cream-hair-3);
                    font-size: 15px;
                    color: var(--cream-softer);
                }
                .luxury-wrap .incl-col.included .incl-row .bullet { color: var(--green); }
                .luxury-wrap .incl-col.excluded .incl-row .bullet { color: var(--red); }
                .luxury-wrap .incl-row .bullet { font-size: 10px; margin-top: 6px; flex: none; }

                /* ---------- TERMS & CONDITIONS / PAYMENT METHODS / CANCELLATION (SIDE BY SIDE & POINTS) ---------- */
                .luxury-wrap .terms-heading h2.display { font-size: 40px; margin-top: 8px; }
                .luxury-wrap .terms-grid {
                    display: flex;
                    flex-direction: row;
                    gap: 40px;
                    margin-top: 30px;
                    width: 100%;
                }
                .luxury-wrap .terms-col {
                    flex: 1 1 0px;
                    min-width: 0;
                }
                @media (max-width: 768px) {
                    .luxury-wrap .terms-grid { flex-direction: column; gap: 32px; }
                }
                .luxury-wrap .terms-col .group-title {
                    font-family: var(--font-mono);
                    font-size: 12px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    color: var(--label);
                    margin-bottom: 12px;
                }
                .luxury-wrap .term-line {
                    font-size: 15px;
                    padding: 8px 0 8px 15px;
                    position: relative;
                    color: var(--cream-softer);
                }
                .luxury-wrap .term-line::before {
                    content: "—";
                    position: absolute; left: 0; color: var(--gold);
                }

                .luxury-wrap .cancel-card {
                    padding: 24px;
                    border: 1px solid var(--cream-hair-2);
                    background: var(--bg);
                    height: 100%;
                }
                .luxury-wrap .cancel-card .title {
                    font-family: var(--font-mono);
                    font-size: 12px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    color: var(--label);
                    margin-bottom: 16px;
                }
                .luxury-wrap .cancel-points {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .luxury-wrap .cancel-point-row {
                    display: flex;
                    gap: 10px;
                    font-size: 14px;
                    color: var(--cream-softer);
                    line-height: 1.4;
                }
                .luxury-wrap .cancel-point-row .bullet {
                    color: var(--gold);
                    font-size: 10px;
                    margin-top: 4px;
                    flex: none;
                }

                /* ---------- COSTING & PAYMENT ---------- */
                .luxury-wrap .pay-heading h2.display { font-size: 40px; margin-top: 8px; }
                .luxury-wrap .pay-grid {
                    display: flex;
                    flex-direction: row;
                    gap: 48px;
                    margin-top: 30px;
                    width: 100%;
                }
                .luxury-wrap .pay-col { flex: 1 1 0px; min-width: 0; }
                @media (max-width: 768px) {
                    .luxury-wrap .pay-grid { flex-direction: column; gap: 32px; }
                }

                .luxury-wrap .cost-line {
                    display: flex; justify-content: space-between;
                    padding: 12px 0;
                    border-bottom: 1px solid var(--cream-hair-2);
                    font-size: 17px;
                }
                .luxury-wrap .cost-total {
                    text-align: center;
                    padding: 25px 0;
                }
                .luxury-wrap .cost-total .label { font-size: 13px; color: var(--muted); }
                .luxury-wrap .cost-total .amount { font-family: var(--font-display); font-size: 40px; margin-top: 8px; }
                .luxury-wrap .cost-total .per { font-size: 14px; color: var(--muted); margin-top: 4px; }

                .luxury-wrap .installments { display: flex; gap: 0; margin-top: 20px; flex-wrap: wrap; }
                .luxury-wrap .installment {
                    flex: 1;
                    min-width: 160px;
                    text-align: center;
                    padding: 17px;
                    border: 1px solid var(--cream-hair-2);
                    background: var(--bg-panel);
                }
                .luxury-wrap .installment .amt { font-size: 20px; font-weight: 600; }
                .luxury-wrap .installment .due { font-size: 14px; color: var(--label); margin-top: 8px; }
                .luxury-wrap .installment .note { font-size: 12px; color: var(--muted); margin-top: 6px; }

                /* ---------- TABULAR BANK DETAILS & PAYMENT ---------- */
                .luxury-wrap .bank-title {
                    font-family: var(--font-mono);
                    font-size: 12px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    color: var(--label);
                    margin-bottom: 12px;
                }

                .luxury-wrap .luxury-bank-container {
                    border: 1px solid var(--gold-hair);
                    background: var(--bg-panel);
                    overflow: hidden;
                }

                .luxury-wrap .luxury-bank-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 18px;
                    background: rgba(201, 168, 76, 0.06);
                    border-bottom: 1px solid var(--cream-hair-2);
                }

                .luxury-wrap .luxury-bank-header .bank-title-text {
                    font-family: var(--font-mono);
                    font-size: 11px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    color: var(--gold);
                    font-weight: 600;
                }

                .luxury-wrap .luxury-bank-header .bank-badge {
                    font-family: var(--font-mono);
                    font-size: 9px;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    color: var(--label);
                    border: 1px solid var(--gold-hair);
                    padding: 2px 8px;
                }

                .luxury-wrap .luxury-bank-table {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .luxury-wrap .bank-table-row {
                    display: flex;
                    width: 100%;
                    border-bottom: 1px solid var(--cream-hair-2);
                }

                .luxury-wrap .bank-table-row:last-child {
                    border-bottom: none;
                }

                .luxury-wrap .bank-cell {
                    padding: 14px 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    border-right: 1px solid var(--cream-hair-2);
                    box-sizing: border-box;
                }

                .luxury-wrap .bank-cell:last-child {
                    border-right: none;
                }

                .luxury-wrap .bank-cell.cell-half {
                    flex: 1 1 50%;
                    min-width: 0;
                }

                .luxury-wrap .bank-cell.cell-third {
                    flex: 1 1 33.333%;
                    min-width: 0;
                }

                .luxury-wrap .bank-cell.cell-full {
                    flex: 1 1 100%;
                    width: 100%;
                }

                .luxury-wrap .bank-cell .cell-label {
                    font-family: var(--font-mono);
                    font-size: 10px;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    color: var(--label);
                    font-weight: 500;
                }

                .luxury-wrap .bank-cell .cell-val {
                    font-family: var(--font-mono);
                    font-size: 14px;
                    color: var(--cream);
                    font-weight: 500;
                    word-break: break-all;
                }

                .luxury-wrap .bank-cell .cell-val.primary {
                    font-family: var(--font-serif);
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--cream);
                    word-break: normal;
                }

                .luxury-wrap .bank-cell.highlight {
                    background: rgba(245, 240, 232, 0.02);
                }

                .luxury-wrap .bank-cell .cell-val.mono-accent {
                    font-family: var(--font-mono);
                    font-size: 15px;
                    font-weight: 600;
                    color: var(--cream);
                    letter-spacing: 0.8px;
                }

                .luxury-wrap .bank-cell .cell-val.upi-val {
                    font-family: var(--font-mono);
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--gold);
                    letter-spacing: 0.5px;
                }

                @media (max-width: 600px) {
                    .luxury-wrap .bank-table-row {
                        flex-direction: column;
                    }
                    .luxury-wrap .bank-cell {
                        border-right: none;
                        border-bottom: 1px solid var(--cream-hair-2);
                        width: 100% !important;
                        flex: 1 1 100% !important;
                    }
                    .luxury-wrap .bank-cell:last-child {
                        border-bottom: none;
                    }
                }

                /* ---------- FOOTER (CENTER ALIGNED & DYNAMIC AGENT LOGO) ---------- */
                .luxury-wrap footer {
                    text-align: center;
                    padding: 80px 24px;
                    border-top: 1px solid var(--cream-hair-3);
                    background: var(--bg-panel);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                .luxury-wrap footer .badge-container {
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .luxury-wrap footer .badge {
                    width: 66px; height: 66px;
                    border-radius: 50%;
                    background: var(--gold);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: var(--font-display);
                    font-size: 24px;
                    color: var(--bg);
                    font-weight: 700;
                }
                .luxury-wrap footer .agent-logo-img {
                    max-height: 66px;
                    max-width: 220px;
                    object-fit: contain;
                    display: block;
                }
                .luxury-wrap footer .brand {
                    font-family: var(--font-display);
                    font-size: 36px;
                    margin-top: 4px;
                }
                .luxury-wrap footer .contact {
                    margin-top: 8px;
                    font-size: 14px;
                    color: var(--muted);
                }
                `}
            </style>

            <div className="doc">

                {/* COVER / HERO (WITH VISIBLE IMAGE) */}
                <section
                    className="cover sec-bg-main"
                    data-pdf-section="cover"
                    style={{ backgroundImage: `url('${coverImage}')` }}
                >
                    <div className="cover-inner">
                        <h1 className="display" data-field="itinerary.title">
                            {title || (itinerary as any)?.tripTitle || (itinerary as any)?.destination || 'Your Journey'}
                        </h1>
                        <p>
                            {(itinerary as any)?.subtitle || (clientNameResolved ? `A bespoke travel itinerary prepared for ${clientNameResolved}` : 'A bespoke luxury travel itinerary')}
                        </p>
                    </div>
                </section>

                {/* AGENCY DETAILS + CLIENT DETAILS (SIDE BY SIDE & PANEL BG) */}
                <section className="sec-bg-panel" data-pdf-section="overview">
                    <div className="section-inner two-col">
                        <div className="agency">
                            <h2 className="display" data-field="agency.name">
                                {companyName}
                            </h2>
                            <hr className="rule" />
                            <p className="co-name" data-field="agency.companyName">
                                {companyName}
                            </p>
                            <p className="co-tagline" data-field="agency.tagline">
                                {brandTagline}
                            </p>

                            <div className="contact-list">
                                {agentEmail && (
                                    <div className="contact-row">
                                        <span className="icon">✉</span>
                                        <span data-field="agency.email">{agentEmail}</span>
                                    </div>
                                )}
                                {agentPhone && (
                                    <div className="contact-row">
                                        <span className="icon">☎</span>
                                        <span data-field="agency.phone">{agentPhone}</span>
                                    </div>
                                )}
                                {agentWebsite && (
                                    <div className="contact-row">
                                        <span className="icon">🌐</span>
                                        <span data-field="agency.website">{agentWebsite}</span>
                                    </div>
                                )}
                                {agentAddress && (
                                    <div className="contact-row">
                                        <span className="icon">📍</span>
                                        <span data-field="agency.address">{agentAddress}</span>
                                    </div>
                                )}
                            </div>

                            <div className="consultant-block">
                                <div className="label">Consultant</div>
                                <div className="name" data-field="consultant.name">
                                    {consultantName}
                                </div>
                                <div className="title" data-field="consultant.title">
                                    {consultantTitle}
                                </div>
                            </div>
                        </div>

                        <div className="client-details">
                            <div className="label">Client Details</div>

                            {clientNameResolved && (
                                <div className="booking-row">
                                    <span className="k">Client Name</span>
                                    <span className="v">{clientNameResolved}</span>
                                </div>
                            )}
                            {clientEmail && (
                                <div className="booking-row">
                                    <span className="k">Email</span>
                                    <span className="v">{clientEmail}</span>
                                </div>
                            )}
                            {clientPhone && (
                                <div className="booking-row">
                                    <span className="k">Phone</span>
                                    <span className="v">{clientPhone}</span>
                                </div>
                            )}
                            {travellerSummaryStr && (
                                <div className="booking-row">
                                    <span className="k">Travellers</span>
                                    <span className="v">{travellerSummaryStr}</span>
                                </div>
                            )}
                            {departureDate && (
                                <div className="booking-row">
                                    <span className="k">Departure</span>
                                    <span className="v">{departureDate}</span>
                                </div>
                            )}
                            {returnDate && (
                                <div className="booking-row">
                                    <span className="k">Return</span>
                                    <span className="v">{returnDate}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ABOUT THE PLACE + HIGHLIGHTS (MAIN DARK BG) */}
                <section className="sec-bg-main" style={{ padding: 0 }} data-pdf-section="about">
                    <div
                        className="about-hero"
                        data-field="destination.heroImageUrl"
                        style={{ backgroundImage: `url('${coverImage}')` }}
                    >
                        <div className="about-copy">
                            <hr className="rule" />
                            <h2 className="display">About the place</h2>
                            <p className="about-text" data-field="destination.aboutText">
                                &ldquo;{aboutText}&rdquo;
                            </p>
                            <hr className="rule" />
                        </div>
                    </div>

                    {highlightsList.length > 0 && (
                        <div className="section-inner highlights">
                            <span className="eyebrow">Highlights</span>
                            {highlightsList.map((highlight, idx) => (
                                <div className="highlight-item" key={idx}>
                                    <span className="bullet">◆</span>
                                    <span className="text" data-field={`highlights[${idx}].text`}>{highlight}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* DAY BY DAY -- OVERVIEW GRID (PANEL BG) */}
                {days.length > 0 && (
                    <section className="sec-bg-panel" data-pdf-section="journey">
                        <div className="section-inner journey-heading">
                            <span className="eyebrow">The Journey</span>
                            <h2 className="display">Day by Day</h2>

                            <div className="day-grid">
                                {days.map((day, idx) => {
                                    const dayNumStr = String(idx + 1).padStart(2, '0');
                                    const dayShortDate = day.date ? formatDate(day.date) : `Day ${idx + 1}`;
                                    const dayTitle = (day as any).themeTitle || (day as any).title || `Day ${idx + 1}`;
                                    const dayLoc = day.areaFocus || (day as any).location || '';

                                    return (
                                        <div className="day-tile" key={idx}>
                                            <div className="num">{dayNumStr}</div>
                                            <div className="date">{dayShortDate}</div>
                                            <div className="title">{dayTitle}</div>
                                            <div className="loc">{dayLoc}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* THE PROGRAMME -- FULL DAY-BY-DAY CARDS (MAIN BG) */}
                {days.length > 0 && (
                    <section className="itinerary-days sec-bg-main" data-pdf-section="itinerary">
                        <div className="section-inner" style={{ paddingBottom: 0 }}>
                            <span className="eyebrow">The Programme</span>
                            <h2 className="display itinerary-heading">The Itinerary</h2>
                        </div>

                        {days.map((day, idx) => {
                            const isReverse = idx % 2 === 1;
                            const dayImg = getDayImage(day) || coverImage;
                            const dayTagStr = `Day ${idx + 1}${day.date ? ` · ${formatDate(day.date)}` : ''}`;
                            const locStr = day.areaFocus || (day as any).location || `Destination`;
                            const titleStr = (day as any).title || (day as any).themeTitle || `Day ${idx + 1} Program`;

                            // Extract activities timeline
                            const activities = Array.isArray(day.timeline) && day.timeline.length > 0
                                ? day.timeline.map((act: any) => act.activityTitle || act.title || act.details || act)
                                : parseList((day as any).activities);

                            // Meals
                            const mealsObj = (day as any).meals || {};
                            const bMeal = mealsObj.breakfast || ((day as any).mealPlan?.toLowerCase().includes('b') ? 'Included' : null);
                            const lMeal = mealsObj.lunch || ((day as any).mealPlan?.toLowerCase().includes('l') ? 'Included' : null);
                            const dMeal = mealsObj.dinner || ((day as any).mealPlan?.toLowerCase().includes('d') ? 'Included' : null);

                            // Stay info
                            const matchingHotel = hotels[idx] || hotels[0];
                            const stayName = (day as any).stay?.name || (day as any).accommodation || matchingHotel?.name || '';
                            const stayNote = (day as any).stay?.note || (day as any).accommodationNotes || (matchingHotel as any)?.roomType || matchingHotel?.address || '';

                            return (
                                <div className={`day-card ${isReverse ? 'reverse' : ''}`} key={idx}>
                                    <div
                                        className="photo"
                                        style={{ backgroundImage: `url('${dayImg}')` }}
                                    >
                                        <span className="day-tag">{dayTagStr}</span>
                                    </div>
                                    <div className="content">
                                        <div className="loc-label" data-field={`days[${idx}].location`}>{locStr}</div>
                                        <h3 className="display" data-field={`days[${idx}].title`}>{titleStr}</h3>

                                        {activities.length > 0 && (
                                            <div className="activity-list">
                                                {activities.map((actItem: any, aIdx: number) => (
                                                    <div className="activity-row" key={aIdx}>
                                                        <span className="dash">—</span>
                                                        <span data-field={`days[${idx}].activities[${aIdx}]`}>{String(actItem)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="day-meta">
                                            {(bMeal || lMeal || dMeal) && (
                                                <div className="col">
                                                    <div className="label">Meals</div>
                                                    {bMeal && <div className="meal-line">B {bMeal}</div>}
                                                    {lMeal && <div className="meal-line">L {lMeal}</div>}
                                                    {dMeal && <div className="meal-line">D {dMeal}</div>}
                                                </div>
                                            )}
                                            {stayName && (
                                                <div className="col">
                                                    <div className="label">Stay</div>
                                                    <div className="name">{stayName}</div>
                                                    {stayNote && <div className="note">{stayNote}</div>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </section>
                )}

                {/* LOGISTICS SUMMARY (PANEL BG) */}
                {(hotels.length > 0 || flights.length > 0) && (
                    <section className="sec-bg-panel" data-pdf-section="logistics">
                        <div className="section-inner">
                            <span className="eyebrow">Accommodations &amp; Flights</span>
                            <h2 className="display incl-heading">Logistics Overview</h2>

                            <div className="logistics-grid">
                                {hotels.map((h, i) => (
                                    <div className="logistics-card" key={`h-${i}`}>
                                        <div className="card-type">Hotel Accommodation</div>
                                        <div className="card-title">{h.name || 'Luxury Hotel'}</div>
                                        {(h as any).roomType && <div className="card-detail">Room: {(h as any).roomType}</div>}
                                        {h.checkIn && <div className="card-detail">Check-in: {h.checkIn}</div>}
                                        {h.checkOut && <div className="card-detail">Check-out: {h.checkOut}</div>}
                                    </div>
                                ))}

                                {flights.map((f, i) => (
                                    <div className="logistics-card" key={`f-${i}`}>
                                        <div className="card-type">Flight Transfer</div>
                                        <div className="card-title">{f.airline || 'Flight'} {f.flightNumber ? `#${f.flightNumber}` : ''}</div>
                                        {(f.departureAirport || f.arrivalAirport) && (
                                            <div className="card-detail">{f.departureAirport || ''} → {f.arrivalAirport || ''}</div>
                                        )}
                                        {(f.departure || (f as any).departureTime) && (
                                            <div className="card-detail">Dep: {f.departure || (f as any).departureTime}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* INCLUSIONS & EXCLUSIONS (SIDE BY SIDE & MAIN BG) */}
                {(inclusionsList.length > 0 || exclusionsList.length > 0) && (
                    <section className="sec-bg-main" data-pdf-section="inclusions">
                        <div className="section-inner">
                            <span className="eyebrow">Package</span>
                            <h2 className="display incl-heading">Inclusions &amp; Exclusions</h2>

                            <div className="incl-grid">
                                {inclusionsList.length > 0 && (
                                    <div className="incl-col included">
                                        <div className="col-title">✓ Included</div>
                                        {inclusionsList.map((inc, i) => (
                                            <div className="incl-row" key={i}>
                                                <span className="bullet">◆</span>
                                                <span data-field={`inclusions[${i}]`}>{inc}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {exclusionsList.length > 0 && (
                                    <div className="incl-col excluded">
                                        <div className="col-title">✕ Excluded</div>
                                        {exclusionsList.map((exc, i) => (
                                            <div className="incl-row" key={i}>
                                                <span className="bullet">◆</span>
                                                <span data-field={`exclusions[${i}]`}>{exc}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* TERMS & CONDITIONS / PAYMENT METHODS / CANCELLATION (SIDE BY SIDE & POINTS & PANEL BG) */}
                {(termsAndConditionsList.length > 0 || cancellationPoints.length > 0 || paymentMethodsList.length > 0) && (
                    <section className="sec-bg-panel" data-pdf-section="terms">
                        <div className="section-inner">
                            <span className="eyebrow">Practical</span>
                            <h2 className="display terms-heading">Terms &amp; Guidelines</h2>

                            <div className="terms-grid">
                                {termsAndConditionsList.length > 0 && (
                                    <div className="terms-col">
                                        <div className="group-title">Terms</div>
                                        {termsAndConditionsList.map((term, i) => (
                                            <div className="term-line" data-field={`terms[${i}]`} key={i}>{term}</div>
                                        ))}
                                    </div>
                                )}

                                {paymentMethodsList.length > 0 && (
                                    <div className="terms-col">
                                        <div className="group-title">Payment Guidelines</div>
                                        {paymentMethodsList.map((pm, i) => (
                                            <div className="term-line" data-field={`conditions[${i}]`} key={i}>{pm}</div>
                                        ))}
                                    </div>
                                )}

                                {cancellationPoints.length > 0 && (
                                    <div className="terms-col">
                                        <div className="cancel-card">
                                            <div className="title">Cancellation Policy</div>
                                            <div className="cancel-points">
                                                {cancellationPoints.map((point, i) => (
                                                    <div className="cancel-point-row" key={i}>
                                                        <span className="bullet">◆</span>
                                                        <span data-field={`cancellationPolicy[${i}]`}>{point}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* COSTING & PAYMENT (MAIN BG) */}
                <section className="sec-bg-main" data-pdf-section="pricing">
                    <div className="section-inner">
                        <span className="eyebrow">Financial</span>
                        <h2 className="display pay-heading">Costing &amp; Payment</h2>

                        <div className="pay-grid">
                            <div className="pay-col">
                                <div className="cost-line">
                                    <span>
                                        {pricing?.packageCostLabel || `Package Cost (${totalPax} Pax)`}
                                    </span>
                                    <span>
                                        {pricing?.customPackageCost || pricing?.packageCost || formatCurrency(costWithMarkup, currency)}
                                    </span>
                                </div>
                                {(taxAmount > 0 || pricing?.customTaxesAmount || pricing?.taxesAmount) && (
                                    <div className="cost-line">
                                        <span>
                                            {pricing?.taxesLabel || `Taxes & Fees (${pricing?.taxRate || 0}%)`}
                                        </span>
                                        <span>
                                            {pricing?.customTaxesAmount || pricing?.taxesAmount || formatCurrency(taxAmount, currency)}
                                        </span>
                                    </div>
                                )}

                                <div className="cost-total">
                                    <div className="label">Total Investment</div>
                                    <div className="amount">
                                        {pricing?.customTotalAmount || pricing?.totalAmount || (typeof displayFinalTotal === 'number' ? formatCurrency(displayFinalTotal, currency) : String(displayFinalTotal))}
                                    </div>
                                    <div className="per">
                                        {pricing?.perPersonLabel || (totalPax > 1 ? `per person (${formatCurrency(displayFinalTotal / totalPax, currency)})` : 'total price')}
                                    </div>
                                </div>

                                {installments.length > 0 && (
                                    <div className="installments">
                                        {installments.map((inst: any, idx: number) => (
                                            <div className="installment" key={idx}>
                                                <div className="amt">
                                                    {typeof inst.amount === 'number' ? formatCurrency(inst.amount, currency) : inst.amount}
                                                </div>
                                                <div className="due">
                                                    {inst.dueDate || inst.date || 'Due'}
                                                </div>
                                                {inst.note && (
                                                    <div className="note">
                                                        {inst.note}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="pay-col">
                                <div className="bank-title">Bank &amp; Payment Details</div>

                                <div className="luxury-bank-container">
                                    <div className="luxury-bank-header">
                                        <span className="bank-title-text">Official Remittance Details</span>
                                        <span className="bank-badge">Direct Transfer / UPI</span>
                                    </div>

                                    <div className="luxury-bank-table">
                                        <div className="bank-table-row">
                                            <div className="bank-cell cell-half">
                                                <span className="cell-label">Account Name</span>
                                                <span className="cell-val primary">{bankDetailsObj.accountName}</span>
                                            </div>
                                            <div className="bank-cell cell-half">
                                                <span className="cell-label">Bank Name</span>
                                                <span className="cell-val primary">{bankDetailsObj.bankName}</span>
                                            </div>
                                        </div>

                                        <div className="bank-table-row key-fields-row">
                                            {bankDetailsObj.accountNumber && (
                                                <div className="bank-cell cell-third highlight">
                                                    <span className="cell-label">Bank A/C No.</span>
                                                    <span className="cell-val mono-accent">{bankDetailsObj.accountNumber}</span>
                                                </div>
                                            )}
                                            {bankDetailsObj.ifscCode && (
                                                <div className="bank-cell cell-third highlight">
                                                    <span className="cell-label">IFSC Code</span>
                                                    <span className="cell-val mono-accent">{bankDetailsObj.ifscCode}</span>
                                                </div>
                                            )}
                                            {bankDetailsObj.upiId && (
                                                <div className="bank-cell cell-third highlight upi-highlight">
                                                    <span className="cell-label">UPI ID</span>
                                                    <span className="cell-val upi-val">{bankDetailsObj.upiId}</span>
                                                </div>
                                            )}
                                        </div>

                                        {(bankDetailsObj.iban || bankDetailsObj.swiftCode) && (
                                            <div className="bank-table-row">
                                                {bankDetailsObj.iban && (
                                                    <div className="bank-cell cell-half">
                                                        <span className="cell-label">IBAN</span>
                                                        <span className="cell-val mono-accent">{bankDetailsObj.iban}</span>
                                                    </div>
                                                )}
                                                {bankDetailsObj.swiftCode && (
                                                    <div className="bank-cell cell-half">
                                                        <span className="cell-label">SWIFT / BIC Code</span>
                                                        <span className="cell-val mono-accent">{bankDetailsObj.swiftCode}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {(bankDetailsObj.sortCode || bankDetailsObj.branch) && (
                                            <div className="bank-table-row">
                                                {bankDetailsObj.sortCode && (
                                                    <div className="bank-cell cell-half">
                                                        <span className="cell-label">Sort Code</span>
                                                        <span className="cell-val mono-accent">{bankDetailsObj.sortCode}</span>
                                                    </div>
                                                )}
                                                {bankDetailsObj.branch && (
                                                    <div className="bank-cell cell-half">
                                                        <span className="cell-label">Branch</span>
                                                        <span className="cell-val primary">{bankDetailsObj.branch}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {bankDetailsObj.extraRows.map((extra, eIdx) => (
                                            <div className="bank-table-row" key={eIdx}>
                                                <div className="bank-cell cell-full">
                                                    <span className="cell-label">{extra.k}</span>
                                                    <span className="cell-val mono-accent">{extra.v}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FOOTER (CENTER ALIGNED & DYNAMIC LOGO) */}
                <footer>
                    <div className="badge-container">
                        {agent.logoUrl ? (
                            <img
                                src={agent.logoUrl}
                                alt={agent.companyName}
                                className="agent-logo-img"
                                crossOrigin="anonymous"
                            />
                        ) : (
                            <div className="badge">
                                {(agent.companyName || 'G').substring(0, 1).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="brand" data-field="footer.brandName">
                        {agent.companyName || agencySettings?.brand_name || 'GozyTrips'}
                    </div>
                    {agent.agentEmail && (
                        <div className="contact" data-field="footer.email">{agent.agentEmail}</div>
                    )}
                    {agent.agentPhone && (
                        <div className="contact" data-field="footer.phone">{agent.agentPhone}</div>
                    )}
                </footer>

            </div>
        </div>
    );
};
