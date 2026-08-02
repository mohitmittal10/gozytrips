import React from 'react';
import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';
import type { HotelInfo, FlightInfo, CabInfo, BusInfo } from '@/components/hotel-flight-editor';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { getCurrencySymbol, formatCurrency } from '@/lib/utils/currency';
import { getAgentInfo, getTotalBudget, getCoverImage, getDayImage, formatTitleCase, formatDistance, formatDate } from '../utils';
import { getThematicBackground, glassStyles } from '../styles';
import { PdfDaywiseIndex } from '../pages';
import { groupHotelsByName, formatHotelStays } from '../shared-blocks';
import { calcPricingFromBaseCost } from '@/services/financial';

export type ThemeProps = {
    itinerary: TravelItineraryOutput;
    title: string;
    clientName?: string;
    agencySettings?: any;
    agent: ReturnType<typeof getAgentInfo>;
    hotels?: HotelInfo[];
    flights?: FlightInfo[];
    cabs?: CabInfo[];
    buses?: BusInfo[];
    pricing?: any;
    baseCost?: number;
    finalTotal?: number;
    showTimestamps?: boolean;
    inclusions?: string;
    exclusions?: string;
    termsAndConditions?: string;
    cancellationPolicy?: string;
    paymentMethods?: string;
    daySummaries?: string[];
    aboutPlace?: any;
};

const parseList = (text?: string) => {
    if (!text) return [];
    return text.split('\n').map(s => s.trim()).filter(s => s.length > 0 && s !== '-');
};

function hexToRgb(hex: string): string {
    const s = hex.replace('#', '');
    if (s.length === 3) {
        return `${parseInt(s[0] + s[0], 16)}, ${parseInt(s[1] + s[1], 16)}, ${parseInt(s[2] + s[2], 16)}`;
    }
    if (s.length === 6) {
        return `${parseInt(s.substring(0, 2), 16)}, ${parseInt(s.substring(2, 4), 16)}, ${parseInt(s.substring(4, 6), 16)}`;
    }
    return "168, 85, 247";
}

const CONTENT_PADDING_X = "50px";
const TIMELINE_COL_WIDTH = 82;
const TIMELINE_GAP = 24;

export const ClassicTheme = ({
    itinerary, title, clientName, agencySettings, agent, hotels = [], flights = [], cabs = [], buses = [], pricing, baseCost = 0, finalTotal = 0, showTimestamps = true, inclusions, exclusions, termsAndConditions, cancellationPolicy, paymentMethods, daySummaries, aboutPlace
}: ThemeProps) => {
    const rgbAccent = hexToRgb(agent.primaryColor || "#a855f7");
    const currency = pricing?.currency || DEFAULT_CURRENCY;
    const adultPax = Number(pricing?.adultPax || 2);
    const childPax = Number(pricing?.childPax || 0);
    const infantPax = Number(pricing?.infantPax || 0);
    const totalPax = adultPax + childPax + infantPax;
    const resolvedBase = baseCost || 0;
    const { baseCost: resolvedBaseCost, markupAmount, costWithMarkup, taxAmount, finalTotal: calculatedFinalTotal } = calcPricingFromBaseCost(resolvedBase, pricing);
    
    const inclusionsList = parseList(inclusions);
    const exclusionsList = parseList(exclusions);
    const paymentMethodsList = parseList(paymentMethods);
    const cancellationPolicyList = parseList(cancellationPolicy);
    const termsAndConditionsList = parseList(termsAndConditions);

    const tagline = agent.agentBio || agencySettings?.tagline || agencySettings?.brand_tagline || "Your custom travel blueprint, prepared by experts.";

    return (
        <div className="classic-wrap" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", backgroundColor: "#f8fafc", backgroundImage: `url("${getThematicBackground(itinerary, 'classic', agent.primaryColor)}")`, backgroundRepeat: "repeat", color: "#1e293b", width: "100%" }}>
            <style>
                {`
                .classic-wrap *, .classic-wrap *::before, .classic-wrap *::after { box-sizing: border-box; }

                .classic-wrap .table-wrap {
                    overflow-x: auto;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    margin-bottom: 20px;
                }
                .classic-wrap table { width: 100%; border-collapse: collapse; table-layout: fixed; display: table !important; }
                .classic-wrap thead { background: rgba(15,23,42,0.03); border-bottom: 1px solid #e2e8f0; display: table-header-group !important; }
                .classic-wrap tbody { display: table-row-group !important; }
                .classic-wrap tr { display: table-row !important; }
                .classic-wrap th {
                    padding: 16px 24px;
                    font-size: 12px;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-weight: 800;
                    border-bottom: 1px solid #e2e8f0;
                    text-align: left;
                    display: table-cell !important;
                }
                .classic-wrap th:last-child { text-align: right; }
                .classic-wrap th:nth-child(2), .classic-wrap th:nth-child(3) { text-align: center; }
                .classic-wrap td {
                    padding: 20px 24px;
                    font-size: 15px;
                    color: #334155;
                    font-weight: 500;
                    border-bottom: 1px solid #e2e8f0;
                    vertical-align: middle;
                    display: table-cell !important;
                }
                .classic-wrap tbody tr:last-child td { border-bottom: none; }
                .classic-wrap td:first-child { font-weight: 700; color: #0f172a; text-align: left; }
                .classic-wrap td:nth-child(2), .classic-wrap td:nth-child(3) { text-align: center; color: #475569; }
                .classic-wrap td:last-child { text-align: right; font-family: var(--font-mono); font-weight: 700; color: #0f172a; }

                .classic-wrap .invoice-table th:nth-child(1) { width: 55%; }
                .classic-wrap .invoice-table th:nth-child(2) { width: 10%; }
                .classic-wrap .invoice-table th:nth-child(3) { width: 15%; }
                .classic-wrap .invoice-table th:nth-child(4) { width: 20%; }

                .classic-wrap .payment-table th:nth-child(1) { width: 40%; }
                .classic-wrap .payment-table th:nth-child(2) { width: 20%; }
                .classic-wrap .payment-table th:nth-child(3) { width: 20%; }
                .classic-wrap .payment-table th:nth-child(4) { width: 20%; }
                `}
            </style>
            {/* Hero — cover section */}
            <div data-pdf-section="cover" style={{ paddingBottom: "10px" }}>
                <div style={{ position: "relative", height: "320px", overflow: "hidden", marginBottom: "35px", borderRadius: "0 0 24px 24px", background: `linear-gradient(135deg, rgba(${rgbAccent}, 0.95), rgba(15, 23, 42, 0.95))` }}>
                    {getCoverImage(itinerary) ? (
                        <img src={getCoverImage(itinerary)} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
                    ) : null}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: `linear-gradient(135deg, rgba(${rgbAccent}, 0.85), rgba(15, 23, 42, 0.8))` }} />
                    {/* Agency logo badge — top right (logo only) */}
                    {(agent.logoUrl || agent.companyName) && (
                        <div style={{ position: "absolute", top: "22px", right: "30px", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.14)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.28)", borderRadius: "12px", padding: "9px 14px" }}>
                            {agent.logoUrl ? (
                                <img src={agent.logoUrl} alt={agent.companyName} crossOrigin="anonymous" style={{ maxHeight: "32px", maxWidth: "90px", objectFit: "contain", display: "block", filter: "brightness(0) invert(1)" }} />
                            ) : (
                                <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "13px" }}>
                                    {(agent.companyName || "T").substring(0, 1).toUpperCase()}
                                </div>
                            )}
                        </div>
                    )}
                    <div style={{ position: "absolute", bottom: "45px", left: 0, right: 0, width: "100%", padding: `0 ${CONTENT_PADDING_X}`, boxSizing: "border-box", zIndex: 1, color: "white", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <h1 style={{ fontSize: "44px", fontWeight: 900, margin: "0 auto 10px auto", textShadow: "0 4px 12px rgba(0,0,0,0.35)", fontFamily: "'Outfit', sans-serif", letterSpacing: "-1.5px", lineHeight: "1.08", textAlign: "center" }}>{title}</h1>
                        <p style={{ fontSize: "16px", opacity: 0.9, margin: "0 auto", fontWeight: 500, letterSpacing: "0.2px", textAlign: "center" }}>{tagline}</p>
                    </div>
                </div>

                <div style={{ padding: `0 ${CONTENT_PADDING_X}`, background: "rgba(248,250,252,0.18)" }}>
                    {/* Header info row: Client & Agent details */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "24px", borderBottom: "1px solid #e2e8f0", paddingBottom: "30px", marginBottom: "35px" }}>
                        {/* Client details */}
                        <div style={{ flex: "1 1 280px", minWidth: "220px", display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ fontSize: "11px", color: agent.primaryColor, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800, marginBottom: "2px" }}>Prepared For</span>
                            <h2 style={{ fontSize: "22px", margin: 0, color: "#0f172a", fontWeight: 800, letterSpacing: "-0.5px" }}>{clientName || "Valued Guest"}</h2>
                            <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0 0", fontWeight: 600 }}>
                                {adultPax} Adult{adultPax !== 1 ? 's' : ''}
                                {childPax > 0 ? `, ${childPax} Child${childPax !== 1 ? 'ren' : ''}` : ''}
                                {infantPax > 0 ? `, ${infantPax} Infant${infantPax !== 1 ? 's' : ''}` : ''}
                            </p>
                        </div>

                        {/* Agency details */}
                        <div style={{ flex: "1 1 280px", minWidth: "200px", textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                            <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800, marginBottom: "2px" }}>Prepared By</span>
                            <h2 style={{ fontSize: "20px", margin: 0, color: "#0f172a", fontWeight: 800, letterSpacing: "-0.5px" }}>{agent.companyName}</h2>
                            <p style={{ color: agent.primaryColor, fontSize: "13.5px", margin: "2px 0 4px 0", fontWeight: 700 }}>{agent.agentName}</p>
                            {agent.agentPhone && <p style={{ color: "#64748b", fontSize: "12px", margin: "1px 0" }}>{agent.agentPhone}</p>}
                            {agent.agentEmail && <p style={{ color: "#64748b", fontSize: "12px", margin: "1px 0" }}>{agent.agentEmail}</p>}
                            {agent.agentWebsite && <p style={{ color: agent.primaryColor, fontSize: "12.5px", margin: "4px 0 0 0", fontWeight: 600, textDecoration: "underline" }}>{agent.agentWebsite}</p>}
                        </div>
                    </div>

                    {/* Stat cards */}
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "stretch", gap: "20px", marginBottom: "40px" }}>
                        <div style={{ ...glassStyles, flex: "1 1 180px", borderRadius: "16px", padding: "20px 24px", borderLeft: `4px solid ${agent.primaryColor}`, boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)" }}>
                            <h3 style={{ margin: "0 0 6px 0", fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800 }}>Client</h3>
                            <p style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "#0f172a", fontFamily: "'Outfit', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clientName || "Valued Guest"}</p>
                        </div>
                        <div style={{ ...glassStyles, flex: "1 1 180px", borderRadius: "16px", padding: "20px 24px", borderLeft: "4px solid #3b82f6", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)" }}>
                            <h3 style={{ margin: "0 0 6px 0", fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800 }}>Duration</h3>
                            <p style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>{itinerary.itinerary?.length || 0} Days</p>
                        </div>
                        <div style={{ ...glassStyles, flex: "1 1 180px", borderRadius: "16px", padding: "20px 24px", borderLeft: "4px solid #ec4899", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)" }}>
                            <h3 style={{ margin: "0 0 6px 0", fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800 }}>Total Budget</h3>
                            <p style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>{formatCurrency(finalTotal || getTotalBudget(itinerary), (itinerary as any).pricing?.currency || DEFAULT_CURRENCY)}</p>
                        </div>
                    </div>
                </div>{/* end cover section */}
            </div>

            {/* About The Destination */}
            {aboutPlace && (
                <div data-pdf-section="about" style={{ padding: `20px ${CONTENT_PADDING_X} 45px ${CONTENT_PADDING_X}` }}>
                    <div style={{ ...glassStyles, borderRadius: "24px", padding: "40px", display: "flex", gap: "40px", alignItems: "stretch", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)", borderLeft: `6px solid ${agent.primaryColor}` }}>
                        {Array.isArray(itinerary.itinerary) && itinerary.itinerary.length > 0 && getDayImage(itinerary.itinerary[0]) ? (
                            <div style={{ flex: "0 0 320px", borderRadius: "16px", overflow: "hidden", position: "relative" }}>
                                <img src={getDayImage(itinerary.itinerary[0])} alt="Destination" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }} crossOrigin="anonymous" />
                            </div>
                        ) : null}
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", color: agent.primaryColor, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800 }}>About The Destination</h3>
                            <h2 style={{ margin: "0 0 20px 0", fontSize: "28px", color: "#0f172a", fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: "-0.5px" }}>{aboutPlace.title}</h2>
                            <p style={{ margin: "0 0 24px 0", color: "#475569", fontSize: "15px", lineHeight: "1.7" }}>{aboutPlace.description}</p>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                {(aboutPlace.highlights || []).map((hl: string, i: number) => (
                                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                                        <div style={{ flexShrink: 0, width: "20px", height: "20px", borderRadius: "50%", background: `rgba(${rgbAccent}, 0.1)`, display: "flex", alignItems: "center", justifyContent: "center", color: agent.primaryColor, marginTop: "2px" }}>✓</div>
                                        <span style={{ fontSize: "14px", color: "#334155", fontWeight: 500, lineHeight: "1.5" }}>{hl}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PdfDaywiseIndex itinerary={itinerary} accentColor={agent.primaryColor} theme="classic" daySummaries={daySummaries} />

            {/* Daily itineraries */}
            <div style={{ padding: `45px ${CONTENT_PADDING_X} 45px ${CONTENT_PADDING_X}` }}>
                {Array.isArray(itinerary.itinerary) && itinerary.itinerary.map((day, index) => {
                    const dayImg = getDayImage(day);
                    return (
                    <div key={index} data-pdf-section={`day-${index}`} style={{ marginBottom: "35px", display: "block" }}>

                        {/* Photo + header block */}
                        <div style={{ display: "block", border: "1px solid #e2e8f0", borderBottom: "none", borderRadius: "20px 20px 0 0", overflow: "hidden" }}>
                            {dayImg ? (
                                <div style={{ height: "200px", display: "block", position: "relative" }}>
                                    <img src={dayImg} alt={formatTitleCase(day.areaFocus)} style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }} crossOrigin="anonymous" />
                                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.1), transparent)" }} />
                                </div>
                            ) : null}
                            <div style={{ background: `linear-gradient(135deg, ${agent.primaryColor || "#a855f7"} 0%, #ec4899 100%)`, padding: "20px 30px", color: "white" }}>
                                <span style={{ fontSize: "12px", opacity: 0.95, textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800 }}>Day {index + 1} • {formatDate(day.date)}</span>
                                <h3 style={{ margin: "5px 0 0 0", fontSize: "24px", fontWeight: 900, letterSpacing: "-0.5px", fontFamily: "'Outfit', sans-serif" }}>{formatTitleCase(day.areaFocus)}</h3>
                            </div>
                        </div>

                        {/* Timeline steps */}
                        <div style={{ ...glassStyles, borderRadius: "0 0 20px 20px", padding: "30px 35px", border: "1px solid rgba(148,163,184,0.18)", borderTop: "none", position: "relative", background: "rgba(255,255,255,0.58)" }}>
                            {Array.isArray(day.timeline) && day.timeline.map((step, si) => (
                                <div key={si} style={{ display: "flex", alignItems: "flex-start", gap: `${TIMELINE_GAP}px`, marginBottom: si === day.timeline.length - 1 ? "0" : "20px", position: "relative" }}>
                                    {si < day.timeline.length - 1 && (
                                        <div style={{
                                            position: "absolute",
                                            left: showTimestamps !== false ? `${TIMELINE_COL_WIDTH / 2 - 1}px` : `${24 / 2 - 1}px`,
                                            top: showTimestamps !== false ? "28px" : "16px",
                                            bottom: showTimestamps !== false ? "-20px" : "-26px",
                                            width: "2px",
                                            background: "#cbd5e1",
                                            zIndex: 0,
                                        }} />
                                    )}
                                    {showTimestamps !== false ? (
                                        <div style={{
                                            position: "relative",
                                            width: `${TIMELINE_COL_WIDTH}px`,
                                            height: "28px",
                                            flexShrink: 0,
                                            background: "#ffffff",
                                            border: `2px solid ${agent.primaryColor || "#a855f7"}`,
                                            borderRadius: "30px",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                                            boxSizing: "border-box",
                                            zIndex: 1,
                                        }}>
                                            <span style={{
                                                position: "absolute",
                                                top: "50%",
                                                left: "50%",
                                                transform: "translate(-50%, -50%)",
                                                fontWeight: 800,
                                                color: agent.primaryColor || "#a855f7",
                                                fontSize: "11px",
                                                lineHeight: 1,
                                                whiteSpace: "nowrap",
                                                textAlign: "center",
                                            }}>
                                                {step.time}
                                            </span>
                                        </div>
                                    ) : (
                                        <div style={{ width: "24px", flexShrink: 0, display: "flex", justifyContent: "center", paddingTop: "10px" }}>
                                            <span style={{
                                                width: "10px",
                                                height: "10px",
                                                borderRadius: "50%",
                                                background: `linear-gradient(135deg, ${agent.primaryColor || "#a855f7"}, #ec4899)`,
                                                flexShrink: 0,
                                                boxShadow: "0 0 0 4px rgba(236,72,153,0.15)",
                                                zIndex: 1,
                                                display: "block",
                                            }} />
                                        </div>
                                    )}
                                    <p style={{ margin: 0, paddingTop: showTimestamps !== false ? "4px" : "0", fontSize: "14px", lineHeight: "1.75", color: "#334155", flex: 1, minWidth: 0, wordBreak: "break-word", fontWeight: 500 }}>
                                        {step.details}
                                    </p>

                                </div>
                            ))}
                            {(day as any).dailyStats?.totalCost && (
                                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "20px", fontSize: "13px", color: "#64748b", fontWeight: 700 }}>
                                    <div style={{ background: "rgba(15, 23, 42, 0.04)", padding: "6px 16px", borderRadius: "8px", display: "inline-flex", alignItems: "center" }}>
                                        💰 Day Cost: {formatCurrency((day as any).dailyStats?.totalCost, (itinerary as any).pricing?.currency || DEFAULT_CURRENCY)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ); })}
            </div>

            {/* Travel & Logistics */}
            {(hotels.length > 0 || flights.length > 0 || cabs.length > 0 || buses.length > 0) && (
                <div data-pdf-section="accommodations" style={{ padding: `20px ${CONTENT_PADDING_X} 45px ${CONTENT_PADDING_X}` }}>
                    <h2 style={{ margin: "0 0 30px 0", fontSize: "28px", color: "#0f172a", fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: "-0.5px" }}>Travel & Logistics</h2>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
                        {groupHotelsByName(hotels).map((h, i) => {
                            const validImages = h.imageUrls ? h.imageUrls.filter(url => url && url.trim().length > 0) : [];
                            const hasPhoto = validImages.length > 0;
                            return (
                                <div key={`hotel-${i}`} style={{ ...glassStyles, borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column", borderLeft: !hasPhoto ? `4px solid ${agent.primaryColor}` : undefined }}>
                                    {hasPhoto ? (
                                        <img src={validImages[0]} alt={h.name} style={{ width: "100%", height: "160px", objectFit: "cover" }} crossOrigin="anonymous" />
                                    ) : (
                                        <div style={{ padding: "20px 24px 0 24px", display: "flex", alignItems: "center", gap: "10px" }}>
                                            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `${agent.primaryColor}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🏨</div>
                                            <div style={{ flex: 1, height: "2px", background: `linear-gradient(to right, ${agent.primaryColor}30, transparent)` }} />
                                        </div>
                                    )}
                                    <div style={{ padding: "24px" }}>
                                        <h4 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#0f172a", fontWeight: 800 }}>{h.name}</h4>
                                        <div style={{ color: agent.primaryColor, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>Hotel • {formatHotelStays(h.stays)}</div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Check-in</span><span style={{ fontWeight: 600 }}>{h.checkIn}</span></div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Check-out</span><span style={{ fontWeight: 600 }}>{h.checkOut}</span></div>
                                            {h.bookingRef && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Booking Ref</span><span style={{ fontWeight: 600 }}>{h.bookingRef}</span></div>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {flights.map((f, i) => (
                            <div key={`flight-${i}`} style={{ ...glassStyles, borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                                <div style={{ height: "160px", background: "rgba(15,23,42,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "40px" }}>✈️</span></div>
                                <div style={{ padding: "24px" }}>
                                    <h4 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#0f172a", fontWeight: 800 }}>{f.airline} {f.flightNumber}</h4>
                                    <div style={{ color: agent.primaryColor, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>Flight • Day {f.dayIndex + 1}</div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Route</span><span style={{ fontWeight: 600 }}>{f.departureAirport} → {f.arrivalAirport}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Type</span><span style={{ fontWeight: 600 }}>{f.flightType === 'connecting' ? 'Connecting' : 'Direct'}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Departure / Arrival</span><span style={{ fontWeight: 600 }}>{f.departure} – {f.arrival}</span></div>
                                        {f.layover && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Layover</span><span style={{ fontWeight: 600, color: "#f59e0b" }}>{f.layover}</span></div>}
                                        {f.flightType === 'connecting' && f.connectingDepartureAirport && (
                                            <>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Connecting Route</span><span style={{ fontWeight: 600 }}>{f.connectingDepartureAirport} → {f.connectingArrivalAirport}</span></div>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Connecting Flight</span><span style={{ fontWeight: 600 }}>{f.connectingAirline} {f.connectingFlightNumber}</span></div>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Connecting Time</span><span style={{ fontWeight: 600 }}>{f.connectingDeparture} – {f.connectingArrival}</span></div>
                                                {f.connectingPnr && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Connecting PNR</span><span style={{ fontWeight: 600 }}>{f.connectingPnr}</span></div>}
                                            </>
                                        )}
                                        {f.pnr && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>PNR</span><span style={{ fontWeight: 600 }}>{f.pnr}</span></div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {cabs.map((c, i) => (
                            <div key={`cab-${i}`} style={{ ...glassStyles, borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                                <div style={{ height: "160px", background: "rgba(15,23,42,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "40px" }}>🚕</span></div>
                                <div style={{ padding: "24px" }}>
                                    <h4 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#0f172a", fontWeight: 800 }}>{c.vehicleType || "Private Transfer"}</h4>
                                    <div style={{ color: agent.primaryColor, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>Cab • Day {c.dayIndex + 1}</div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Route</span><span style={{ fontWeight: 600 }}>{c.route || "Local"}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Pickup</span><span style={{ fontWeight: 600 }}>{c.pickupTime}</span></div>
                                        {c.driverName && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Driver</span><span style={{ fontWeight: 600 }}>{c.driverName}</span></div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {buses.map((b, i) => (
                            <div key={`bus-${i}`} style={{ ...glassStyles, borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                                <div style={{ height: "160px", background: "rgba(15,23,42,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "40px" }}>🚌</span></div>
                                <div style={{ padding: "24px" }}>
                                    <h4 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#0f172a", fontWeight: 800 }}>{b.busType || "Tourist Bus"}</h4>
                                    <div style={{ color: agent.primaryColor, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>Bus • Day {b.dayIndex + 1}</div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Route</span><span style={{ fontWeight: 600 }}>{b.route}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Departure</span><span style={{ fontWeight: 600 }}>{b.departureTime}</span></div>
                                        {b.pnr && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>PNR</span><span style={{ fontWeight: 600 }}>{b.pnr}</span></div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Inclusions & Exclusions */}
            {(inclusionsList.length > 0 || exclusionsList.length > 0) && (
                <div data-pdf-section="inclusions" style={{ padding: `20px ${CONTENT_PADDING_X} 45px ${CONTENT_PADDING_X}` }}>
                    <div style={{ display: "flex", gap: "24px" }}>
                        {inclusionsList.length > 0 && (
                            <div style={{ flex: 1, ...glassStyles, borderRadius: "20px", padding: "30px", borderTop: `4px solid ${agent.primaryColor}` }}>
                                <h3 style={{ margin: "0 0 20px 0", fontSize: "20px", color: "#0f172a", fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>Inclusions</h3>
                                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {inclusionsList.map((inc, i) => (
                                        <li key={i} style={{ display: "flex", gap: "12px", fontSize: "14px", color: "#334155" }}><span style={{ color: agent.primaryColor, fontWeight: 800 }}>+</span> <span>{inc}</span></li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {exclusionsList.length > 0 && (
                            <div style={{ flex: 1, ...glassStyles, borderRadius: "20px", padding: "30px", borderTop: `4px solid #94a3b8` }}>
                                <h3 style={{ margin: "0 0 20px 0", fontSize: "20px", color: "#0f172a", fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>Exclusions</h3>
                                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {exclusionsList.map((exc, i) => (
                                        <li key={i} style={{ display: "flex", gap: "12px", fontSize: "14px", color: "#334155" }}><span style={{ color: "#94a3b8", fontWeight: 800 }}>-</span> <span>{exc}</span></li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Pricing & Invoice */}
            <div data-pdf-section="pricing" style={{ padding: `20px ${CONTENT_PADDING_X} 60px ${CONTENT_PADDING_X}` }}>
                <div style={{ ...glassStyles, borderRadius: "24px", padding: "40px" }}>
                    <h2 style={{ margin: "0 0 10px 0", fontSize: "28px", color: "#0f172a", fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: "-0.5px", textAlign: "center" }}>Package Invoice</h2>
                    <p style={{ margin: "0 0 40px 0", color: "#64748b", fontSize: "15px", textAlign: "center" }}>Complete cost breakdown & payment schedule</p>

                    <div style={{ border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden", marginBottom: "40px" }}>
                        <div className="table-wrap" style={{ border: "none", borderRadius: 0, boxShadow: "none", margin: 0 }}>
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
                                    {pricing?.manualOptions && pricing.manualOptions.length > 0 ? (
                                        pricing.manualOptions.map((item: any, idx: number) => {
                                            const qty = item.type === 'per-person' ? totalPax : 1;
                                            const rate = Number(item.amount) || 0;
                                            const amount = qty * rate;
                                            return (
                                                <tr key={item.id || idx}>
                                                    <td>{item.name} {item.type === 'per-person' ? `(Per Person)` : ''}</td>
                                                    <td>{qty}</td>
                                                    <td>{formatCurrency(rate, currency)}</td>
                                                    <td>{formatCurrency(amount, currency)}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td>{"Consolidated Package Cost"} (for {adultPax} Adults{childPax ? `, ${childPax} Children` : ''})</td>
                                            <td>1</td>
                                            <td>{formatCurrency(costWithMarkup, currency)}</td>
                                            <td>{formatCurrency(costWithMarkup, currency)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ background: "rgba(15,23,42,0.02)", padding: "24px", display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-end" }}>
                            {pricing?.manualOptions && pricing.manualOptions.length > 0 ? (
                                <>
                                    <div style={{ display: "flex", gap: "40px", fontSize: "14px", color: "#475569" }}><span style={{ width: "160px" }}>Subtotal (Base Cost):</span><span style={{ width: "120px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{formatCurrency(resolvedBaseCost, currency)}</span></div>
                                    {markupAmount > 0 && (
                                        <div style={{ display: "flex", gap: "40px", fontSize: "14px", color: "#475569" }}><span style={{ width: "160px" }}>Service Fee / Markup:</span><span style={{ width: "120px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600 }}>+ {formatCurrency(markupAmount, currency)}</span></div>
                                    )}
                                    {taxAmount > 0 && (
                                        <div style={{ display: "flex", gap: "40px", fontSize: "14px", color: "#475569" }}><span style={{ width: "160px" }}>Taxes & Fees ({pricing.taxPercentage}%):</span><span style={{ width: "120px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600 }}>+ {formatCurrency(taxAmount, currency)}</span></div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div style={{ display: "flex", gap: "40px", fontSize: "14px", color: "#475569" }}><span style={{ width: "160px" }}>Subtotal:</span><span style={{ width: "120px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{formatCurrency(costWithMarkup, currency)}</span></div>
                                    <div style={{ display: "flex", gap: "40px", fontSize: "14px", color: "#475569" }}><span style={{ width: "160px" }}>Taxes & Fees:</span><span style={{ width: "120px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{formatCurrency(taxAmount, currency)}</span></div>
                                </>
                            )}
                            <div style={{ width: "280px", height: "1px", background: "#cbd5e1", margin: "8px 0" }}></div>
                            <div style={{ display: "flex", gap: "40px", fontSize: "18px", color: "#0f172a", fontWeight: 800 }}><span style={{ width: "160px" }}>Grand Total:</span><span style={{ width: "120px", textAlign: "right", fontFamily: "var(--font-mono)", color: agent.primaryColor }}>{formatCurrency(calculatedFinalTotal, currency)}</span></div>
                        </div>
                    </div>

                    {/* Payment Schedule — full width */}
                    {pricing?.milestones && pricing.milestones.length > 0 && (
                        <>
                            <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", color: "#0f172a", fontWeight: 800 }}>Payment Schedule</h3>
                            <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", marginBottom: "40px" }}>
                                <div className="table-wrap" style={{ border: "none", borderRadius: 0, boxShadow: "none", margin: 0 }}>
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
                                            {pricing.milestones.map((m: any, i: number) => {
                                                const amount = (calculatedFinalTotal * m.percentage) / 100;
                                                return (
                                                    <tr key={m.id || i}>
                                                        <td>{m.name}</td>
                                                        <td>{m.dueDate}</td>
                                                        <td>{m.percentage}%</td>
                                                        <td>{formatCurrency(amount, currency)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Policies & Methods — below, side by side */}
                    {(paymentMethodsList.length > 0 || cancellationPolicyList.length > 0) && (
                        <div style={{ display: "flex", gap: "40px" }}>
                            {paymentMethodsList.length > 0 && (
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#0f172a", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Payment Methods</h3>
                                    <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
                                        {paymentMethodsList.map((p, i) => <div key={i}>• {p}</div>)}
                                    </div>
                                </div>
                            )}
                            {cancellationPolicyList.length > 0 && (
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#0f172a", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Cancellation Policy</h3>
                                    <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
                                        {cancellationPolicyList.map((p, i) => <div key={i}>• {p}</div>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {termsAndConditionsList.length > 0 && (
                        <div style={{ marginTop: "32px", borderTop: "1px solid #e2e8f0", paddingTop: "24px" }}>
                            <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#0f172a", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Terms & Conditions</h3>
                            <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
                                {termsAndConditionsList.map((p, i) => <div key={i}>• {p}</div>)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div data-pdf-section="footer" style={{ padding: `40px ${CONTENT_PADDING_X} 60px ${CONTENT_PADDING_X}`, background: "#0f172a", color: "white" }}>
                {(agencySettings?.bankAccountNumber || agencySettings?.gstNumber || agencySettings?.upiId) && (
                    <>
                        <h2 style={{ textAlign: "center", fontSize: "24px", fontWeight: 800, margin: "0 0 40px 0", fontFamily: "'Outfit', sans-serif" }}>Agency Account Details</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", maxWidth: "900px", margin: "0 auto" }}>
                            {agencySettings?.bankAccountNumber && (
                                <div style={{ background: "rgba(255,255,255,0.05)", padding: "24px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
                                    <div style={{ fontSize: "11px", color: agent.primaryColor, textTransform: "uppercase", fontWeight: 800, letterSpacing: "1px", marginBottom: "12px" }}>Bank Details</div>
                                    <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>{agencySettings?.bankName || ''}</div>
                                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-mono)" }}>ACC: {agencySettings?.bankAccountNumber}</div>
                                    {agencySettings?.bankIfscCode && (
                                        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-mono)" }}>IFSC: {agencySettings?.bankIfscCode}</div>
                                    )}
                                </div>
                            )}
                            {agencySettings?.gstNumber && (
                                <div style={{ background: "rgba(255,255,255,0.05)", padding: "24px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
                                    <div style={{ fontSize: "11px", color: agent.primaryColor, textTransform: "uppercase", fontWeight: 800, letterSpacing: "1px", marginBottom: "12px" }}>GST Number</div>
                                    <div style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-mono)", background: "rgba(0,0,0,0.2)", padding: "8px 16px", borderRadius: "8px", display: "inline-block" }}>{agencySettings?.gstNumber}</div>
                                </div>
                            )}
                            {agencySettings?.upiId && (
                                <div style={{ background: "rgba(255,255,255,0.05)", padding: "24px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
                                    <div style={{ fontSize: "11px", color: agent.primaryColor, textTransform: "uppercase", fontWeight: 800, letterSpacing: "1px", marginBottom: "12px" }}>UPI ID</div>
                                    <div style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-mono)", background: "rgba(0,0,0,0.2)", padding: "8px 16px", borderRadius: "8px", display: "inline-block" }}>{agencySettings?.upiId}</div>
                                </div>
                            )}
                        </div>
                    </>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "60px", paddingTop: "40px", borderTop: "1px solid rgba(255,255,255,0.1)", flexWrap: "wrap", gap: "24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <div style={{ fontSize: "24px", fontWeight: 900, background: `linear-gradient(to right, ${agent.primaryColor || "#a855f7"}, #ec4899)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "'Outfit', sans-serif" }}>{agent.companyName}</div>
                        <p style={{ margin: "4px 0 0 0", color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>{tagline}</p>
                        <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "11px" }}>Curated by {agent.agentName}</p>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end", textAlign: "right" }}>
                        {agent.agentPhone && <p style={{ margin: 0, color: "#cbd5e1", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}><span>📞</span> {agent.agentPhone}</p>}
                        {agent.agentEmail && <p style={{ margin: 0, color: "#cbd5e1", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}><span>✉️</span> {agent.agentEmail}</p>}
                        {agent.agentWebsite && <p style={{ margin: 0, color: agent.primaryColor || "#a855f7", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}><span>🌐</span> {agent.agentWebsite}</p>}
                    </div>
                </div>
                <div style={{ textAlign: "center", marginTop: "30px", fontSize: "10px", color: "#475569" }}>
                    Generated on {new Date().toLocaleDateString()} • Designed in The Lab
                </div>
            </div>
        </div>
    );
};


