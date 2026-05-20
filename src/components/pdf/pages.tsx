import React from 'react';
import type { PricingConfig } from '@/types/pricing';
import type { HotelInfo, FlightInfo } from '@/components/hotel-flight-editor';
import type { PdfTheme } from '@/components/pdf-template';
import { formatMoneyWithDecimals } from '@/lib/utils/currency';
import { formatPlural, getAgentInfo } from './utils';
import { PdfFlightBlock, PdfHotelBlock, type PdfLogisticsBlockStyle } from './shared-blocks';
import { calcPricingFromBaseCost } from '@/services/financial';

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
                pageBackground: "rgba(255,255,255,0.42)",
                headerBorder: `1px solid rgba(148,163,184,0.2)`,
                quoteCardBackground: "rgba(255,255,255,0.58)",
                quoteCardBorder: "1px solid rgba(148,163,184,0.18)",
                quoteCardRadius: "8px",
                totalBorder: "2px solid #cbd5e1",
                tableBackground: "rgba(255,255,255,0.5)",
                tableBorder: "1px solid rgba(148,163,184,0.18)",
                tableHeaderBackground: "rgba(241,245,249,0.9)",
                tableHeaderBorder: "2px solid #cbd5e1",
                tableRowBorder: "1px solid rgba(226,232,240,0.9)",
            };
        case 'corporate':
            return {
                ...shared,
                pageBackground: "rgba(255,255,255,0.46)",
                headerBorder: `2px solid ${accentColor}`,
                quoteCardBackground: "rgba(255,255,255,0.72)",
                quoteCardBorder: "1px solid rgba(148,163,184,0.2)",
                quoteCardRadius: "8px",
                totalBorder: "2px solid #cbd5e1",
                tableBackground: "rgba(255,255,255,0.62)",
                tableBorder: "1px solid rgba(148,163,184,0.18)",
                tableHeaderBackground: "rgba(15,23,42,0.04)",
                tableHeaderBorder: `2px solid ${accentColor}`,
                tableRowBorder: "1px solid rgba(148,163,184,0.18)",
            };
        case 'editorial':
            return {
                ...shared,
                pageBackground: "rgba(253,252,250,0.18)",
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
        case 'classic':
        default:
            return {
                ...shared,
                pageBackground: "rgba(248,250,252,0.18)",
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
    const isManual = pricing.costingType === "manual";
    const styles = getPricingThemeStyles(theme, agent.primaryColor);

    return (
        <div data-pdf-section="pricing" style={{ padding: "60px 50px", fontFamily: "'Inter', sans-serif", color: styles.pageTextColor, background: styles.pageBackground }}>
            <h2 style={{ fontSize: "28px", color: styles.headingColor, marginBottom: "30px", borderBottom: styles.headerBorder, paddingBottom: "15px" }}>
                Costing & Payment Schedule
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "30px", marginBottom: "40px" }}>
                <div style={{ flex: 1, background: styles.quoteCardBackground, padding: "25px", borderRadius: styles.quoteCardRadius, border: styles.quoteCardBorder, pageBreakInside: "avoid" }}>
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
                <div style={{ pageBreakInside: "avoid" }}>
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
                pageBackground: "rgba(255,255,255,0.42)",
                pageTextColor: "#0f172a",
                headerBorder: `1px solid rgba(148,163,184,0.2)`,
                blockStyle: {
                    cardBackground: "rgba(255,255,255,0.58)",
                    border: `1px solid rgba(148,163,184,0.18)`,
                    borderRadius: "8px",
                    accentBadgeBackground: `${accentColor}18`,
                    titleColor: accentColor,
                } satisfies PdfLogisticsBlockStyle,
            };
        case 'corporate':
            return {
                ...shared,
                pageBackground: "rgba(255,255,255,0.46)",
                pageTextColor: "#1e293b",
                headerBorder: `2px solid ${accentColor}`,
                blockStyle: {
                    cardBackground: "rgba(255,255,255,0.72)",
                    border: `1px solid rgba(148,163,184,0.2)`,
                    borderRadius: "8px",
                    accentBadgeBackground: `${accentColor}14`,
                    titleColor: accentColor,
                } satisfies PdfLogisticsBlockStyle,
            };
        case 'editorial':
            return {
                ...shared,
                pageBackground: "rgba(253,252,250,0.18)",
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
        case 'classic':
        default:
            return {
                ...shared,
                pageBackground: "rgba(248,250,252,0.18)",
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
                    {hotels.map((hotel, hi) => (
                        <PdfHotelBlock key={hi} hotel={hotel} accentColor={accentColor} textColor={styles.textColor} styleVariant={styles.blockStyle} />
                    ))}
                </div>
            )}
        </div>
    );
};

