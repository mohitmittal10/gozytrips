import React from 'react';
import type { PricingConfig } from '@/types/pricing';
import type { HotelInfo, FlightInfo } from '@/components/hotel-flight-editor';
import { formatMoneyWithDecimals } from '@/lib/utils/currency';
import { formatPlural, getAgentInfo } from './utils';
import { PdfFlightBlock, PdfHotelBlock } from './shared-blocks';
import { calcPricingFromBaseCost } from '@/services/financial';

export const PdfPricingPage = ({ pricing, baseCost = 0, agent }: { pricing: PricingConfig; baseCost?: number; agent: ReturnType<typeof getAgentInfo> }) => {
    const { costWithMarkup, taxAmount, finalTotal, milestoneAmounts } = calcPricingFromBaseCost(baseCost, pricing);
    const currency = pricing.currency;
    const isManual = pricing.costingType === "manual";

    const totalPax = (pricing.adultPax || 0) + (pricing.childPax || 0) + (pricing.infantPax || 0);

    return (
        <div data-pdf-section="pricing" style={{ padding: "60px 50px", fontFamily: "'Inter', sans-serif", color: "#1e293b", backgroundColor: "#ffffff" }}>
            <h2 style={{ fontSize: "28px", color: agent.primaryColor, marginBottom: "30px", borderBottom: `2px solid ${agent.primaryColor}`, paddingBottom: "15px" }}>
                Costing & Payment Schedule
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "30px", marginBottom: "40px" }}>
                <div style={{ flex: 1, backgroundColor: "#f8fafc", padding: "25px", borderRadius: "12px", border: "1px solid #e2e8f0", pageBreakInside: "avoid" }}>
                    <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Client Quote</h3>

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "15px", color: "#475569" }}>
                        <span>{isManual ? "Consolidated Package Cost" : "Package Cost (Incl. Accommodations, Flights, Activities)"}</span>
                        <span>{formatMoneyWithDecimals(costWithMarkup, currency)}</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "15px", color: "#475569" }}>
                        <span>Taxes & Fees</span>
                        <span>{formatMoneyWithDecimals(taxAmount, currency)}</span>
                    </div>

                    <div style={{ marginTop: "20px", paddingTop: "15px", borderTop: "2px solid #cbd5e1", display: "flex", justifyContent: "space-between", fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>
                        <span>Total Quote</span>
                        <span>{formatMoneyWithDecimals(finalTotal, currency)}</span>
                    </div>
                    <div style={{ marginTop: "10px", fontSize: "13px", color: "#64748b" }}>
                        Pricing is valid for the specified dates and {formatPlural(pricing.adultPax, 'Adult', 'Adults')}{pricing.childPax > 0 ? `, ${formatPlural(pricing.childPax, 'Child', 'Children')}` : ''}{pricing.infantPax > 0 ? `, ${formatPlural(pricing.infantPax, 'Infant', 'Infants')}` : ''} only.
                    </div>
                </div>
            </div>

            {pricing.milestones && pricing.milestones.length > 0 && (
                <div style={{ pageBreakInside: "avoid" }}>
                    <h3 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "20px", fontWeight: "bold" }}>Payment Schedule</h3>
                    <div style={{ width: "100%", fontSize: "14px", display: "flex", flexDirection: "column" }}>
                        {/* Header Row */}
                        <div style={{ display: "flex", width: "100%", backgroundColor: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
                            <div style={{ padding: "12px 15px", flex: "0 0 40%", color: "#475569", fontWeight: "bold", textAlign: "left" }}>Milestone</div>
                            <div style={{ padding: "12px 15px", flex: "0 0 35%", color: "#475569", fontWeight: "bold", textAlign: "left" }}>Timeline / Due Date</div>
                            <div style={{ padding: "12px 15px", flex: "0 0 25%", color: "#475569", fontWeight: "bold", textAlign: "right" }}>Amount</div>
                        </div>
                        {/* Body Rows */}
                        {pricing.milestones.map((m, i) => {
                            const amount = (finalTotal * m.percentage) / 100;
                            return (
                                <div key={i} style={{ display: "flex", width: "100%", borderBottom: "1px solid #e2e8f0" }}>
                                    <div style={{ padding: "15px", flex: "0 0 40%", color: "#0f172a", fontWeight: 500 }}>{m.name} ({m.percentage}%)</div>
                                    <div style={{ padding: "15px", flex: "0 0 35%", color: "#64748b" }}>{m.dueDate}</div>
                                    <div style={{ padding: "15px", flex: "0 0 25%", textAlign: "right", color: "#0f172a", fontWeight: "bold" }}>{formatMoneyWithDecimals(amount, currency)}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export const PdfFlightAndHotelSummary = ({ flights, hotels, accentColor }: { flights: FlightInfo[], hotels: HotelInfo[], accentColor: string }) => {
    if ((!flights || flights.length === 0) && (!hotels || hotels.length === 0)) return null;
    return (
        <div data-pdf-section="flights-hotels-summary" style={{ padding: "40px 50px", fontFamily: "'Inter', sans-serif", color: "#1e293b", backgroundColor: "#ffffff" }}>
            <h2 style={{ fontSize: "28px", color: accentColor, marginBottom: "30px", borderBottom: `2px solid ${accentColor}`, paddingBottom: "15px" }}>
                Flights & Accommodations
            </h2>
            {flights && flights.length > 0 && (
                <div style={{ marginBottom: "30px" }}>
                    <h3 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "15px", fontWeight: "bold" }}>Flight Details</h3>
                    {flights.map((flight, fi) => (
                        <PdfFlightBlock key={fi} flight={flight} accentColor={accentColor} bgColor="#f8fafc" textColor="#475569" />
                    ))}
                </div>
            )}
            {hotels && hotels.length > 0 && (
                <div>
                    <h3 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "15px", fontWeight: "bold" }}>Hotel Details</h3>
                    {hotels.map((hotel, hi) => (
                        <PdfHotelBlock key={hi} hotel={hotel} accentColor={accentColor} bgColor="#f8fafc" textColor="#475569" />
                    ))}
                </div>
            )}
        </div>
    );
};

