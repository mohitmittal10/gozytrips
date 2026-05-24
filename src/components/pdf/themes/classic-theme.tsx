import React from 'react';
import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';
import type { HotelInfo, FlightInfo } from '@/components/hotel-flight-editor';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { getCurrencySymbol, formatCurrency } from '@/lib/utils/currency';
import { getAgentInfo, getTotalBudget, getCoverImage, getDayImage, formatTitleCase, formatDistance, formatDate } from '../utils';
import { getThematicBackground, glassStyles } from '../styles';
import { PdfDaywiseIndex } from '../pages';

export type ThemeProps = {
    itinerary: TravelItineraryOutput;
    title: string;
    agent: ReturnType<typeof getAgentInfo>;
    hotels?: HotelInfo[];
    flights?: FlightInfo[];
    finalTotal?: number;
    showTimestamps?: boolean;
    showPrices?: boolean;
    /** AI-generated one-sentence summaries per day, indexed by day order. */
    daySummaries?: string[];
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

export const ClassicTheme = ({ itinerary, title, agent, finalTotal = 0, showTimestamps = true, showPrices = true, daySummaries }: ThemeProps) => {
    const rgbAccent = hexToRgb(agent.primaryColor || "#a855f7");

    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", backgroundColor: "#f8fafc", backgroundImage: `url("${getThematicBackground(itinerary, 'classic', agent.primaryColor)}")`, backgroundRepeat: "repeat", color: "#1e293b", width: "100%" }}>
            {/* Hero — cover section */}
            <div data-pdf-section="cover" style={{ paddingBottom: "10px" }}>
                <div style={{ position: "relative", height: "320px", overflow: "hidden", marginBottom: "35px", borderRadius: "0 0 24px 24px" }}>
                    <img src={getCoverImage(itinerary)} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: `linear-gradient(135deg, rgba(${rgbAccent}, 0.85), rgba(15, 23, 42, 0.8))` }} />
                    <div style={{ position: "absolute", bottom: "45px", left: 0, right: 0, width: "100%", padding: `0 ${CONTENT_PADDING_X}`, boxSizing: "border-box", zIndex: 1, color: "white", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>

                        <h1 style={{ fontSize: "44px", fontWeight: 900, margin: "0 auto 10px auto", textShadow: "0 4px 12px rgba(0,0,0,0.35)", fontFamily: "'Outfit', sans-serif", letterSpacing: "-1.5px", lineHeight: "1.08", textAlign: "center" }}>{title}</h1>
                        <p style={{ fontSize: "16px", opacity: 0.9, margin: "0 auto", fontWeight: 500, letterSpacing: "0.2px", textAlign: "center" }}>Your custom travel blueprint, prepared by experts.</p>
                    </div>
                </div>

                <div style={{ padding: `0 ${CONTENT_PADDING_X}`, background: "rgba(248,250,252,0.18)" }}>
                    {/* Agent details */}
                    <div style={{ display: "flex", justifyContent: agent.agentBio ? "space-between" : "flex-end", alignItems: "flex-start", flexWrap: "wrap", gap: "24px", borderBottom: "1px solid #e2e8f0", paddingBottom: "30px", marginBottom: "35px" }}>
                        {agent.agentBio && (
                            <div style={{ flex: "1 1 320px", maxWidth: "600px" }}>
                                <div style={{ padding: "16px 22px", borderRadius: "12px", borderLeft: `4px solid ${agent.primaryColor}`, fontStyle: "italic", color: "#475569", fontSize: "13.5px", lineHeight: "1.65", ...glassStyles }}>
                                    &quot;{agent.agentBio}&quot;
                                </div>
                            </div>
                        )}
                        <div style={{ flex: agent.agentBio ? "0 1 auto" : "1 1 auto", minWidth: "200px", textAlign: "right", marginLeft: agent.agentBio ? undefined : "auto" }}>
                            <h2 style={{ fontSize: "20px", margin: "0 0 4px 0", color: "#0f172a", fontWeight: 800, letterSpacing: "-0.5px" }}>{agent.companyName}</h2>
                            <p style={{ color: agent.primaryColor, fontSize: "13.5px", margin: "0 0 8px 0", fontWeight: 700 }}>{agent.agentName}</p>
                            {agent.agentPhone && <p style={{ color: "#64748b", fontSize: "12px", margin: "2px 0" }}>{agent.agentPhone}</p>}
                            {agent.agentEmail && <p style={{ color: "#64748b", fontSize: "12px", margin: "2px 0" }}>{agent.agentEmail}</p>}
                            {agent.agentWebsite && <p style={{ color: agent.primaryColor, fontSize: "12.5px", margin: "4px 0 0 0", fontWeight: 600, textDecoration: "underline" }}>{agent.agentWebsite}</p>}
                        </div>
                    </div>

                    {/* Stat cards */}
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "stretch", gap: "20px", marginBottom: "40px" }}>
                        <div style={{ ...glassStyles, flex: "1 1 200px", borderRadius: "16px", padding: "20px 24px", borderLeft: `4px solid ${agent.primaryColor}`, boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)" }}>
                            <h3 style={{ margin: "0 0 6px 0", fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800 }}>Duration</h3>
                            <p style={{ margin: 0, fontSize: "26px", fontWeight: 900, color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>{itinerary.itinerary?.length || 0} Days</p>
                        </div>
                        <div style={{ ...glassStyles, flex: "1 1 200px", borderRadius: "16px", padding: "20px 24px", borderLeft: "4px solid #ec4899", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)" }}>
                            <h3 style={{ margin: "0 0 6px 0", fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800 }}>Total Budget</h3>
                            <p style={{ margin: 0, fontSize: "26px", fontWeight: 900, color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>{formatCurrency(finalTotal || getTotalBudget(itinerary), (itinerary as any).pricing?.currency || DEFAULT_CURRENCY)}</p>
                        </div>
                    </div>
                </div>{/* end cover section */}
            </div>

            <PdfDaywiseIndex itinerary={itinerary} accentColor={agent.primaryColor} theme="classic" daySummaries={daySummaries} />

            {/* Daily itineraries */}
            <div style={{ padding: `45px ${CONTENT_PADDING_X} 45px ${CONTENT_PADDING_X}` }}>
                {Array.isArray(itinerary.itinerary) && itinerary.itinerary.map((day, index) => (
                    <div key={index} data-pdf-section={`day-${index}`} style={{ marginBottom: "35px", display: "block" }}>

                        {/* Photo + header block */}
                        <div style={{ display: "block", border: "1px solid #e2e8f0", borderBottom: "none", borderRadius: "20px 20px 0 0" }}>
                            <div style={{ height: "200px", display: "block", position: "relative" }}>
                                <img src={getDayImage(day)} alt={formatTitleCase(day.areaFocus)} style={{ width: "100%", height: "200px", objectFit: "cover", display: "block", borderRadius: "20px 20px 0 0" }} crossOrigin="anonymous" />
                                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.1), transparent)" }} />
                            </div>
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
                            {showPrices !== false && (day as any).dailyStats?.totalCost && (!(itinerary as any).pricing || (itinerary as any).pricing.costingType !== 'manual') && (
                                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "20px", fontSize: "13px", color: "#64748b", fontWeight: 700 }}>
                                    <div style={{ background: "rgba(15, 23, 42, 0.04)", padding: "6px 16px", borderRadius: "8px", display: "inline-flex", alignItems: "center" }}>
                                        💰 Day Cost: {formatCurrency((day as any).dailyStats?.totalCost, (itinerary as any).pricing?.currency || DEFAULT_CURRENCY)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div data-pdf-section="footer" style={{ padding: `40px ${CONTENT_PADDING_X}`, background: "#0f172a", color: "white", textAlign: "center" }}>
                <div style={{ fontSize: "22px", fontWeight: 900, marginBottom: "8px", background: `linear-gradient(to right, ${agent.primaryColor || "#a855f7"}, #ec4899)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "'Outfit', sans-serif" }}>{agent.companyName}</div>
                <p style={{ margin: "0 0 6px 0", color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>Bespoke Travel Solutions</p>
                <p style={{ margin: 0, color: "#475569", fontSize: "11px" }}>Generated on {new Date().toLocaleDateString()} • Designed in The Lab</p>
            </div>
        </div>
    );
};


