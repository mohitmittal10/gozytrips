import React from 'react';
import type { PricingConfig } from '@/types/pricing';
import type { HotelInfo, FlightInfo } from '@/components/hotel-flight-editor';
import type { PdfTheme } from './theme-config';
import { formatMoneyWithDecimals } from '@/lib/utils/currency';
import { formatPlural, getAgentInfo, formatDate, formatTitleCase } from './utils';
import { PdfFlightBlock, PdfHotelBlock, type PdfLogisticsBlockStyle, groupHotelsByName } from './shared-blocks';
import { calcPricingFromBaseCost } from '@/services/financial';
import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';

const getPricingThemeStyles = (theme: PdfTheme, accentColor: string) => {
    const shared = {
        pageTextColor: "#1e293b",
        headingColor: accentColor,
        sectionHeadingColor: "#0f172a",
        mutedTextColor: "#64748b",
        bodyTextColor: "#475569",
        totalTextColor: "#0f172a",
    };

    switch (theme) {
        case 'desert':
            return {
                ...shared,
                pageBackground: "#433429",
                pageTextColor: "#ffffff",
                headingColor: "#ffffff",
                sectionHeadingColor: "#ffffff",
                mutedTextColor: "rgba(254,215,170,0.68)",
                bodyTextColor: "rgba(255,255,255,0.82)",
                totalTextColor: "#ffffff",
                headerBorder: "1px solid rgba(255,255,255,0.18)",
                quoteCardBackground: "transparent",
                quoteCardBorder: "none",
                quoteCardRadius: "0px",
                totalBorder: "1px solid rgba(255,255,255,0.18)",
                tableBackground: "transparent",
                tableBorder: "1px solid rgba(255,255,255,0.2)",
                tableHeaderBackground: "rgba(0,0,0,0.1)",
                tableHeaderBorder: "1px solid rgba(255,255,255,0.1)",
                tableRowBorder: "1px solid rgba(255,255,255,0.1)",
            };
        case 'dark':
            return {
                ...shared,
                pageBackground: "#070a13",
                pageTextColor: "#e2e8f0",
                sectionHeadingColor: "#ffffff",
                mutedTextColor: "#94a3b8",
                bodyTextColor: "#cbd5e1",
                totalTextColor: "#ffffff",
                headerBorder: `2px solid rgba(255,255,255,0.12)`,
                quoteCardBackground: "rgba(255,255,255,0.025)",
                quoteCardBorder: "1px solid rgba(255,255,255,0.08)",
                quoteCardRadius: "12px",
                totalBorder: "2px solid rgba(255,255,255,0.12)",
                tableBackground: "rgba(255,255,255,0.02)",
                tableBorder: "1px solid rgba(255,255,255,0.08)",
                tableHeaderBackground: "rgba(255,255,255,0.05)",
                tableHeaderBorder: "2px solid rgba(255,255,255,0.12)",
                tableRowBorder: "1px solid rgba(255,255,255,0.08)",
            };
        case 'minimalist':
            return {
                ...shared,
                pageBackground: "#f8fafc",
                headerBorder: `1px solid rgba(148,163,184,0.2)`,
                quoteCardBackground: "#ffffff",
                quoteCardBorder: "1px solid rgba(148,163,184,0.18)",
                quoteCardRadius: "8px",
                totalBorder: "2px solid #cbd5e1",
                tableBackground: "#ffffff",
                tableBorder: "1px solid rgba(148,163,184,0.18)",
                tableHeaderBackground: "#f1f5f9",
                tableHeaderBorder: "2px solid #cbd5e1",
                tableRowBorder: "1px solid rgba(226,232,240,0.9)",
            };
        case 'corporate':
            return {
                ...shared,
                pageBackground: "#f8fafc",
                headerBorder: `2px solid ${accentColor}`,
                quoteCardBackground: "#ffffff",
                quoteCardBorder: "1px solid rgba(148,163,184,0.2)",
                quoteCardRadius: "8px",
                totalBorder: "2px solid #cbd5e1",
                tableBackground: "#ffffff",
                tableBorder: "1px solid rgba(148,163,184,0.18)",
                tableHeaderBackground: "rgba(15,23,42,0.04)",
                tableHeaderBorder: `2px solid ${accentColor}`,
                tableRowBorder: "1px solid rgba(148,163,184,0.18)",
            };
        case 'editorial':
            return {
                ...shared,
                pageBackground: "#fdfcfa",
                pageTextColor: "#2c2c2c",
                sectionHeadingColor: "#2c2c2c",
                mutedTextColor: "#6b7280",
                bodyTextColor: "#4b5563",
                totalTextColor: "#2c2c2c",
                headerBorder: `2px solid ${accentColor}`,
                quoteCardBackground: "rgba(255,255,255,0.22)",
                quoteCardBorder: "1px solid rgba(184,134,11,0.08)",
                quoteCardRadius: "16px",
                totalBorder: "2px solid rgba(184,134,11,0.18)",
                tableBackground: "rgba(255,255,255,0.18)",
                tableBorder: "1px solid rgba(184,134,11,0.08)",
                tableHeaderBackground: "rgba(255,255,255,0.24)",
                tableHeaderBorder: "1px solid rgba(184,134,11,0.14)",
                tableRowBorder: "1px solid rgba(184,134,11,0.08)",
            };
        case 'luxury':
            return {
                ...shared,
                pageBackground: "#0a0a09",
                pageTextColor: "#f5f0e8",
                headingColor: "#c9a84c",
                sectionHeadingColor: "#f5f0e8",
                mutedTextColor: "#7a756a",
                bodyTextColor: "rgba(245,240,232,0.61)",
                totalTextColor: "#f5f0e8",
                headerBorder: "1px solid rgba(201,168,76,0.2)",
                quoteCardBackground: "#14120f",
                quoteCardBorder: "1px solid rgba(245,240,232,0.06)",
                quoteCardRadius: "0px",
                totalBorder: "1px solid rgba(201,168,76,0.2)",
                tableBackground: "#14120f",
                tableBorder: "1px solid rgba(245,240,232,0.06)",
                tableHeaderBackground: "rgba(201,168,76,0.05)",
                tableHeaderBorder: "1px solid rgba(201,168,76,0.2)",
                tableRowBorder: "1px solid rgba(245,240,232,0.03)",
            };
        case 'classic':
        default:
            return {
                ...shared,
                pageBackground: "#f8fafc",
                headerBorder: `2px solid ${accentColor}`,
                quoteCardBackground: "rgba(255,255,255,0.58)",
                quoteCardBorder: "1px solid rgba(148,163,184,0.18)",
                quoteCardRadius: "16px",
                totalBorder: "2px solid #cbd5e1",
                tableBackground: "rgba(255,255,255,0.52)",
                tableBorder: "1px solid rgba(148,163,184,0.18)",
                tableHeaderBackground: "rgba(241,245,249,0.9)",
                tableHeaderBorder: "2px solid #cbd5e1",
                tableRowBorder: "1px solid rgba(226,232,240,0.9)",
            };
    }
};

export const PdfPricingPage = ({ pricing, baseCost = 0, agent, theme }: { pricing: PricingConfig; baseCost?: number; agent: ReturnType<typeof getAgentInfo>; theme: PdfTheme }) => {
    const { costWithMarkup, taxAmount, finalTotal, milestoneAmounts } = calcPricingFromBaseCost(baseCost, pricing);
    const currency = pricing.currency;
    const isManual = true;
    const styles = getPricingThemeStyles(theme, agent.primaryColor);

    if (theme === 'desert') {
        return (
            <div data-pdf-section="pricing" style={{ padding: "80px 50px", fontFamily: "'Inter', sans-serif", color: styles.pageTextColor, background: styles.pageBackground }}>
                <div style={{ textAlign: "center", marginBottom: "56px" }}>
                    <p style={{ margin: "0 0 16px 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "4px", color: styles.mutedTextColor, fontWeight: 700 }}>
                        Culinary Journey
                    </p>
                    <h2 style={{ margin: 0, fontSize: "32px", textTransform: "uppercase", letterSpacing: "4px", color: styles.headingColor, fontWeight: 500 }}>
                        Costing and Payment Schedule
                    </h2>
                </div>

                <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "40px", marginBottom: "80px", backdropFilter: "blur(4px)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "24px" }}>
                            <p style={{ margin: 0, fontSize: "20px", lineHeight: "1.6", color: "rgba(255,255,255,0.9)" }}>
                                {isManual ? "Consolidated Package Cost" : "Package Cost (Incl. Accommodations, Flights, Activities)"}
                            </p>
                            <p style={{ margin: 0, fontSize: "20px", color: "rgba(255,255,255,0.9)" }}>
                                {formatMoneyWithDecimals(costWithMarkup, currency)}
                            </p>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "24px" }}>
                            <p style={{ margin: 0, fontSize: "20px", lineHeight: "1.6", color: "rgba(255,255,255,0.9)" }}>
                                Taxes & Fees
                            </p>
                            <p style={{ margin: 0, fontSize: "20px", color: "rgba(255,255,255,0.9)" }}>
                                {formatMoneyWithDecimals(taxAmount, currency)}
                            </p>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "24px", paddingTop: "8px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <p style={{ margin: 0, fontSize: "24px", color: "#ffffff" }}>
                                    Total Quote
                                </p>
                                <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
                                    Pricing is valid for the specified dates and {formatPlural(pricing.adultPax, 'Adult', 'Adults')}{pricing.childPax > 0 ? `, ${formatPlural(pricing.childPax, 'Child', 'Children')}` : ''}{pricing.infantPax > 0 ? `, ${formatPlural(pricing.infantPax, 'Infant', 'Infants')}` : ''} only.
                                </p>
                            </div>
                            <p style={{ margin: 0, fontSize: "24px", color: "#ffffff" }}>
                                {formatMoneyWithDecimals(finalTotal, currency)}
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ width: "100%" }}>
                    <div style={{ display: "flex", paddingBottom: "16px", borderBottom: "1px solid rgba(254,215,170,0.3)", textAlign: "center" }}>
                        <p style={{ flex: 1, margin: 0, fontSize: "20px", color: "rgba(255,255,255,0.9)" }}>Milestone</p>
                        <p style={{ flex: 1, margin: 0, fontSize: "20px", color: "rgba(255,255,255,0.9)" }}>Timeline / Due Date</p>
                        <p style={{ flex: 1, margin: 0, fontSize: "20px", color: "rgba(255,255,255,0.9)" }}>Amount</p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {(pricing.milestones && pricing.milestones.length > 0 ? pricing.milestones : [{ id: 'fallback', name: isManual ? 'Package Cost' : 'Advance', percentage: 100, dueDate: 'At booking' }]).map((m, i, arr) => {
                            const amount = m.id === 'fallback' ? finalTotal : (finalTotal * m.percentage) / 100;
                            return (
                                <div key={m.id || i} style={{ display: "flex", padding: "32px 0", textAlign: "center", alignItems: "center", borderBottom: i === arr.length - 1 ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
                                    <p style={{ flex: 1, margin: 0, fontSize: "20px", color: "rgba(255,255,255,0.8)" }}>
                                        {m.name}{m.id === 'fallback' ? '' : `(${m.percentage}%)`}
                                    </p>
                                    <p style={{ flex: 1, margin: 0, fontSize: "20px", color: "rgba(255,255,255,0.8)", fontStyle: "italic" }}>
                                        {m.dueDate}
                                    </p>
                                    <p style={{ flex: 1, margin: 0, fontSize: "20px", color: "rgba(255,255,255,0.8)" }}>
                                        {formatMoneyWithDecimals(amount, currency)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div data-pdf-section="pricing" style={{ padding: "60px 50px", fontFamily: "'Inter', sans-serif", color: styles.pageTextColor, background: styles.pageBackground }}>
            <h2 style={{ fontSize: "28px", color: styles.headingColor, marginBottom: "30px", borderBottom: styles.headerBorder, paddingBottom: "15px" }}>
                Costing & Payment Schedule
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "30px", marginBottom: "40px" }}>
                <div style={{ flex: 1, background: styles.quoteCardBackground, padding: "25px", borderRadius: styles.quoteCardRadius, border: styles.quoteCardBorder }}>
                    <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", color: styles.mutedTextColor, textTransform: "uppercase", letterSpacing: "1px" }}>Client Quote</h3>

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "15px", color: styles.bodyTextColor }}>
                        <span>{isManual ? "Consolidated Package Cost" : "Package Cost (Incl. Accommodations, Flights, Activities)"}</span>
                        <span>{formatMoneyWithDecimals(costWithMarkup, currency)}</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "15px", color: styles.bodyTextColor }}>
                        <span>Taxes & Fees</span>
                        <span>{formatMoneyWithDecimals(taxAmount, currency)}</span>
                    </div>

                    <div style={{ marginTop: "20px", paddingTop: "15px", borderTop: styles.totalBorder, display: "flex", justifyContent: "space-between", fontSize: "20px", fontWeight: "bold", color: styles.totalTextColor }}>
                        <span>Total Quote</span>
                        <span>{formatMoneyWithDecimals(finalTotal, currency)}</span>
                    </div>
                    <div style={{ marginTop: "10px", fontSize: "13px", color: styles.mutedTextColor }}>
                        Pricing is valid for the specified dates and {formatPlural(pricing.adultPax, 'Adult', 'Adults')}{pricing.childPax > 0 ? `, ${formatPlural(pricing.childPax, 'Child', 'Children')}` : ''}{pricing.infantPax > 0 ? `, ${formatPlural(pricing.infantPax, 'Infant', 'Infants')}` : ''} only.
                    </div>
                </div>
            </div>

            {pricing.milestones && pricing.milestones.length > 0 && (
                <div>
                    <h3 style={{ fontSize: "20px", color: styles.sectionHeadingColor, marginBottom: "20px", fontWeight: "bold" }}>Payment Schedule</h3>
                    <div style={{ width: "100%", fontSize: "14px", display: "flex", flexDirection: "column", background: styles.tableBackground, border: styles.tableBorder, borderRadius: styles.quoteCardRadius, overflow: "hidden" }}>
                        {/* Header Row */}
                        <div style={{ display: "flex", width: "100%", background: styles.tableHeaderBackground, borderBottom: styles.tableHeaderBorder }}>
                            <div style={{ padding: "12px 15px", flex: "0 0 40%", color: styles.bodyTextColor, fontWeight: "bold", textAlign: "left" }}>Milestone</div>
                            <div style={{ padding: "12px 15px", flex: "0 0 35%", color: styles.bodyTextColor, fontWeight: "bold", textAlign: "left" }}>Timeline / Due Date</div>
                            <div style={{ padding: "12px 15px", flex: "0 0 25%", color: styles.bodyTextColor, fontWeight: "bold", textAlign: "right" }}>Amount</div>
                        </div>
                        {/* Body Rows */}
                        {pricing.milestones.map((m, i) => {
                            const amount = (finalTotal * m.percentage) / 100;
                            return (
                                <div key={i} style={{ display: "flex", width: "100%", borderBottom: i === pricing.milestones.length - 1 ? "none" : styles.tableRowBorder }}>
                                    <div style={{ padding: "15px", flex: "0 0 40%", color: styles.totalTextColor, fontWeight: 500 }}>{m.name} ({m.percentage}%)</div>
                                    <div style={{ padding: "15px", flex: "0 0 35%", color: styles.mutedTextColor }}>{m.dueDate}</div>
                                    <div style={{ padding: "15px", flex: "0 0 25%", textAlign: "right", color: styles.totalTextColor, fontWeight: "bold" }}>{formatMoneyWithDecimals(amount, currency)}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {agent?.bankDetails && (
                <div style={{ marginTop: "40px" }}>
                    <h3 style={{ fontSize: "20px", color: styles.sectionHeadingColor, marginBottom: "15px", fontWeight: "bold" }}>Payment Details</h3>
                    <div style={{ 
                        background: styles.quoteCardBackground, 
                        border: styles.quoteCardBorder, 
                        borderRadius: styles.quoteCardRadius, 
                        padding: "20px",
                        fontSize: "14px",
                        color: styles.bodyTextColor,
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.6"
                    }}>
                        {agent.bankDetails}
                    </div>
                </div>
            )}
        </div>
    );
};

const getLogisticsThemeStyles = (theme: PdfTheme, accentColor: string) => {
    const shared = {
        headingColor: accentColor,
        sectionHeadingColor: "#0f172a",
        textColor: "#475569",
    };

    switch (theme) {
        case 'desert':
            return {
                ...shared,
                headingColor: "#b7793e",
                sectionHeadingColor: "#6f4b2c",
                textColor: "#7a5b43",
                pageBackground: "#f5ebdc",
                pageTextColor: "#5f452c",
                headerBorder: "2px solid rgba(183,121,62,0.28)",
                blockStyle: {
                    cardBackground: "rgba(255,249,240,0.92)",
                    border: "1px solid rgba(183,121,62,0.18)",
                    borderRadius: "20px",
                    accentBadgeBackground: "rgba(183,121,62,0.12)",
                    accentBadgeColor: "#9a6330",
                    titleColor: "#8c5a2d",
                } satisfies PdfLogisticsBlockStyle,
            };
        case 'dark':
            return {
                ...shared,
                pageBackground: "#070a13",
                pageTextColor: "#e2e8f0",
                sectionHeadingColor: "#ffffff",
                textColor: "#cbd5e1",
                headerBorder: `2px solid rgba(255,255,255,0.12)`,
                blockStyle: {
                    cardBackground: "rgba(255,255,255,0.025)",
                    border: `1px solid rgba(255,255,255,0.08)`,
                    borderRadius: "10px",
                    accentBadgeBackground: `rgba(255,255,255,0.08)`,
                    accentBadgeColor: accentColor,
                    titleColor: accentColor,
                } satisfies PdfLogisticsBlockStyle,
            };
        case 'minimalist':
            return {
                ...shared,
                pageBackground: "#f8fafc",
                pageTextColor: "#0f172a",
                headerBorder: `1px solid rgba(148,163,184,0.2)`,
                blockStyle: {
                    cardBackground: "#ffffff",
                    border: `1px solid rgba(148,163,184,0.18)`,
                    borderRadius: "8px",
                    accentBadgeBackground: `${accentColor}18`,
                    titleColor: accentColor,
                } satisfies PdfLogisticsBlockStyle,
            };
        case 'corporate':
            return {
                ...shared,
                pageBackground: "#f8fafc",
                pageTextColor: "#1e293b",
                headerBorder: `2px solid ${accentColor}`,
                blockStyle: {
                    cardBackground: "#ffffff",
                    border: `1px solid rgba(148,163,184,0.2)`,
                    borderRadius: "8px",
                    accentBadgeBackground: `${accentColor}14`,
                    titleColor: accentColor,
                } satisfies PdfLogisticsBlockStyle,
            };
        case 'editorial':
            return {
                ...shared,
                pageBackground: "#fdfcfa",
                pageTextColor: "#2c2c2c",
                sectionHeadingColor: "#2c2c2c",
                textColor: "#4b5563",
                headerBorder: `2px solid ${accentColor}`,
                blockStyle: {
                    useGlass: true,
                    cardBackground: "rgba(255,255,255,0.22)",
                    border: `1px solid rgba(184,134,11,0.08)`,
                    borderRadius: "16px",
                    accentBadgeBackground: `${accentColor}12`,
                    titleColor: "#2c2c2c",
                } satisfies PdfLogisticsBlockStyle,
            };
        case 'luxury':
            return {
                ...shared,
                headingColor: "#c9a84c",
                sectionHeadingColor: "#f5f0e8",
                textColor: "rgba(245,240,232,0.61)",
                pageBackground: "#0a0a09",
                pageTextColor: "#f5f0e8",
                headerBorder: "1px solid rgba(201,168,76,0.2)",
                blockStyle: {
                    cardBackground: "#14120f",
                    border: "1px solid rgba(245,240,232,0.06)",
                    borderRadius: "0px",
                    accentBadgeBackground: "rgba(201,168,76,0.15)",
                    accentBadgeColor: "#c9a84c",
                    titleColor: "#c9a84c",
                } satisfies PdfLogisticsBlockStyle,
            };
        case 'classic':
        default:
            return {
                ...shared,
                pageBackground: "#f8fafc",
                pageTextColor: "#1e293b",
                headerBorder: `2px solid ${accentColor}`,
                blockStyle: {
                    useGlass: true,
                    cardBackground: "rgba(255,255,255,0.58)",
                    border: `1px solid rgba(148,163,184,0.18)`,
                    borderRadius: "16px",
                    accentBadgeBackground: `${accentColor}20`,
                    titleColor: accentColor,
                } satisfies PdfLogisticsBlockStyle,
            };
    }
};

export const PdfFlightAndHotelSummary = ({ flights, hotels, accentColor, theme }: { flights: FlightInfo[], hotels: HotelInfo[], accentColor: string, theme: PdfTheme }) => {
    if ((!flights || flights.length === 0) && (!hotels || hotels.length === 0)) return null;
    const styles = getLogisticsThemeStyles(theme, accentColor);

    return (
        <div data-pdf-section="flights-hotels-summary" style={{ padding: "40px 50px", fontFamily: "'Inter', sans-serif", color: styles.pageTextColor, background: styles.pageBackground }}>
            <h2 style={{ fontSize: "28px", color: styles.headingColor, marginBottom: "30px", borderBottom: styles.headerBorder, paddingBottom: "15px" }}>
                Flights & Accommodations
            </h2>
            {flights && flights.length > 0 && (
                <div style={{ marginBottom: "30px" }}>
                    <h3 style={{ fontSize: "20px", color: styles.sectionHeadingColor, marginBottom: "15px", fontWeight: "bold" }}>Flight Details</h3>
                    {flights.map((flight, fi) => (
                        <PdfFlightBlock key={fi} flight={flight} accentColor={accentColor} textColor={styles.textColor} styleVariant={styles.blockStyle} />
                    ))}
                </div>
            )}
            {hotels && hotels.length > 0 && (
                <div>
                    <h3 style={{ fontSize: "20px", color: styles.sectionHeadingColor, marginBottom: "15px", fontWeight: "bold" }}>Hotel Details</h3>
                    {groupHotelsByName(hotels).map((hotel, hi) => (
                        <PdfHotelBlock key={hi} hotel={hotel} accentColor={accentColor} textColor={styles.textColor} styleVariant={styles.blockStyle} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const PdfInclusionsPage = ({ inclusions, exclusions, termsAndConditions, cancellationPolicy, accentColor, theme }: { inclusions?: string, exclusions?: string, termsAndConditions?: string, cancellationPolicy?: string, accentColor: string, theme: PdfTheme }) => {
    const parseList = (text?: string) => {
        if (!text) return [];
        return text.split('\n').map(s => s.trim().replace(/^- /, '')).filter(s => s.length > 0 && s !== '-');
    };

    const inclusionsList = parseList(inclusions);
    const exclusionsList = parseList(exclusions);
    const termsList = parseList(termsAndConditions);
    const cancellationList = parseList(cancellationPolicy);

    if (inclusionsList.length === 0 && exclusionsList.length === 0 && termsList.length === 0 && cancellationList.length === 0) return null;
    const styles = getPricingThemeStyles(theme, accentColor);

    return (
        <div data-pdf-section="inclusions-exclusions" style={{ padding: "60px 50px", fontFamily: "'Inter', sans-serif", color: styles.pageTextColor, background: styles.pageBackground }}>
            <h2 style={{ fontSize: "28px", color: styles.headingColor, marginBottom: "30px", borderBottom: styles.headerBorder, paddingBottom: "15px" }}>
                Inclusions & Exclusions
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                {inclusionsList.length > 0 && (
                    <div style={{ background: styles.quoteCardBackground, padding: "25px", borderRadius: styles.quoteCardRadius, border: styles.quoteCardBorder }}>
                        <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#10b981", textTransform: "uppercase", letterSpacing: "1px" }}>Included</h3>
                        <div style={{ fontSize: "15px", color: styles.bodyTextColor, whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                            {inclusions}
                        </div>
                    </div>
                )}
                {exclusionsList.length > 0 && (
                    <div style={{ background: styles.quoteCardBackground, padding: "25px", borderRadius: styles.quoteCardRadius, border: styles.quoteCardBorder }}>
                        <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#f43f5e", textTransform: "uppercase", letterSpacing: "1px" }}>Not Included</h3>
                        <div style={{ fontSize: "15px", color: styles.bodyTextColor, whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                            {exclusions}
                        </div>
                    </div>
                )}
                {termsList.length > 0 && (
                    <div style={{ background: styles.quoteCardBackground, padding: "25px", borderRadius: styles.quoteCardRadius, border: styles.quoteCardBorder }}>
                        <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "1px" }}>Terms & Conditions</h3>
                        <div style={{ fontSize: "15px", color: styles.bodyTextColor, whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                            {termsAndConditions}
                        </div>
                    </div>
                )}
                {cancellationList.length > 0 && (
                    <div style={{ background: styles.quoteCardBackground, padding: "25px", borderRadius: styles.quoteCardRadius, border: styles.quoteCardBorder }}>
                        <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#f97316", textTransform: "uppercase", letterSpacing: "1px" }}>Cancellation Policy</h3>
                        <div style={{ fontSize: "15px", color: styles.bodyTextColor, whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                            {cancellationPolicy}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const PdfDaywiseIndex = ({ 
    itinerary, 
    accentColor, 
    theme,
    daySummaries,
}: { 
    itinerary: TravelItineraryOutput; 
    accentColor: string; 
    theme: PdfTheme;
    /** AI-generated one-sentence summaries per day, indexed by day order. */
    daySummaries?: string[];
}) => {
    if (!itinerary || !Array.isArray(itinerary.itinerary) || itinerary.itinerary.length === 0) {
        return null;
    }
    const styles = getPricingThemeStyles(theme, accentColor);

    return (
        <div data-pdf-section="daywise-index" style={{ padding: "60px 50px", fontFamily: "'Inter', sans-serif", color: styles.pageTextColor, background: styles.pageBackground }}>
            <h2 style={{ fontSize: "28px", color: styles.headingColor, marginBottom: "30px", borderBottom: styles.headerBorder, paddingBottom: "15px" }}>
                Itinerary at a Glance
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {itinerary.itinerary.map((day, index) => {
                    // Priority: AI-generated summary → first timeline detail (truncated) → fallback label
                    const summary = (daySummaries && daySummaries[index] && daySummaries[index].trim())
                        ? daySummaries[index]
                        : day.timeline?.[0]?.details
                            ? day.timeline[0].details.length > 80
                                ? `${day.timeline[0].details.substring(0, 77)}…`
                                : day.timeline[0].details
                            : 'Leisure & free exploration';

                    return (
                        <div key={index} style={{ 
                            background: styles.quoteCardBackground, 
                            border: styles.quoteCardBorder, 
                            borderRadius: styles.quoteCardRadius, 
                            padding: "18px 22px",
                            display: "flex",
                            alignItems: "center",
                            gap: "20px",
                            pageBreakInside: "avoid"
                        }}>
                            {/* Day Badge */}
                            <div style={{ 
                                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                                color: "#ffffff",
                                padding: "10px 16px",
                                borderRadius: "10px",
                                minWidth: "72px",
                                textAlign: "center",
                                fontWeight: "bold",
                                flexShrink: 0,
                            }}>
                                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.85 }}>Day</div>
                                <div style={{ fontSize: "22px", lineHeight: "1", fontFamily: "'Outfit', sans-serif" }}>{index + 1}</div>
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "5px", flexWrap: "wrap" }}>
                                    <span style={{ fontSize: "15px", fontWeight: "700", color: styles.sectionHeadingColor }}>
                                        {formatTitleCase(day.areaFocus)}
                                    </span>
                                    {day.date && (
                                        <span style={{ fontSize: "11px", color: styles.mutedTextColor, fontWeight: 500 }}>
                                            • {formatDate(day.date)}
                                        </span>
                                    )}
                                </div>
                                <p style={{ margin: 0, fontSize: "13px", color: styles.bodyTextColor, lineHeight: "1.6", fontStyle: "italic" }}>
                                    {summary}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
