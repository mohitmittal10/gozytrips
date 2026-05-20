import React from 'react';
import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { getCurrencySymbol, formatCurrency } from '@/lib/utils/currency';
import { getAgentInfo, getTotalBudget, getCoverImage, getDayImage, formatTitleCase, formatDistance, formatDate } from '../utils';
import { getThematicBackground, glassStyles } from '../styles';

export type ThemeProps = { 
    itinerary: TravelItineraryOutput; 
    title: string; 
    agent: ReturnType<typeof getAgentInfo>;
    finalTotal?: number;
    showTimestamps?: boolean;
    showPrices?: boolean;
};

function hexToRgb(hex: string): string {
    const s = hex.replace('#', '');
    if (s.length === 3) {
        return `${parseInt(s[0]+s[0], 16)}, ${parseInt(s[1]+s[1], 16)}, ${parseInt(s[2]+s[2], 16)}`;
    }
    if (s.length === 6) {
        return `${parseInt(s.substring(0, 2), 16)}, ${parseInt(s.substring(2, 4), 16)}, ${parseInt(s.substring(4, 6), 16)}`;
    }
    return "168, 85, 247";
}

export const ClassicTheme = ({ itinerary, title, agent, finalTotal = 0, showTimestamps = true, showPrices = true }: ThemeProps) => {
    const rgbAccent = hexToRgb(agent.primaryColor || "#a855f7");
    
    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", backgroundColor: "#f8fafc", backgroundImage: `url("${getThematicBackground(itinerary, 'classic', agent.primaryColor)}")`, backgroundRepeat: "repeat", color: "#1e293b", width: "100%" }}>
            {/* Hero — cover section */}
            <div data-pdf-section="cover" style={{ paddingBottom: "10px" }}>
                <div style={{ position: "relative", height: "320px", overflow: "hidden", marginBottom: "35px", borderRadius: "0 0 24px 24px" }}>
                    <img src={getCoverImage(itinerary)} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: `linear-gradient(135deg, rgba(${rgbAccent}, 0.85), rgba(15, 23, 42, 0.8))` }} />
                    <div style={{ position: "absolute", bottom: "45px", left: "45px", right: "45px", zIndex: 1, color: "white" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "3px", color: `#ffffff`, background: `rgba(${rgbAccent}, 0.45)`, padding: "5px 12px", borderRadius: "20px", display: "inline-block", marginBottom: "14px", border: "1px solid rgba(255,255,255,0.2)" }}>
                            Exclusive Itinerary
                        </span>
                        <h1 style={{ fontSize: "44px", fontWeight: 900, margin: "0 0 10px 0", textShadow: "0 4px 12px rgba(0,0,0,0.35)", fontFamily: "'Outfit', sans-serif", letterSpacing: "-1.5px", lineHeight: "1.08" }}>{title}</h1>
                        <p style={{ fontSize: "16px", opacity: 0.9, margin: 0, fontWeight: 500, letterSpacing: "0.2px" }}>Your custom travel blueprint, prepared by experts.</p>
                    </div>
                </div>

                <div style={{ padding: "0 45px", background: "rgba(248,250,252,0.18)" }}>
                    {/* Agent details */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "30px", marginBottom: "35px", pageBreakInside: "avoid" }}>
                        <div style={{ maxWidth: "60%" }}>
                            {agent.agentBio && (
                                <div style={{ padding: "16px 22px", borderRadius: "12px", borderLeft: `4px solid ${agent.primaryColor}`, fontStyle: "italic", color: "#475569", fontSize: "13.5px", lineHeight: "1.65", ...glassStyles }}>
                                    &quot;{agent.agentBio}&quot;
                                </div>
                            )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <h2 style={{ fontSize: "20px", margin: "0 0 4px 0", color: "#0f172a", fontWeight: 800, letterSpacing: "-0.5px" }}>{agent.companyName}</h2>
                            <p style={{ color: agent.primaryColor, fontSize: "13.5px", margin: "0 0 8px 0", fontWeight: 700 }}>{agent.agentName}</p>
                            {agent.agentPhone && <p style={{ color: "#64748b", fontSize: "12px", margin: "2px 0" }}>{agent.agentPhone}</p>}
                            {agent.agentEmail && <p style={{ color: "#64748b", fontSize: "12px", margin: "2px 0" }}>{agent.agentEmail}</p>}
                            {agent.agentWebsite && <p style={{ color: agent.primaryColor, fontSize: "12.5px", margin: "4px 0 0 0", fontWeight: 600, textDecoration: "underline" }}>{agent.agentWebsite}</p>}
                        </div>
                    </div>

                    {/* Stat cards */}
                    <div style={{ display: "flex", gap: "20px", marginBottom: "40px", pageBreakInside: "avoid" }}>
                        <div style={{ ...glassStyles, flex: 1, borderRadius: "16px", padding: "20px 24px", borderLeft: `4px solid ${agent.primaryColor}`, boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)" }}>
                            <h3 style={{ margin: "0 0 6px 0", fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800 }}>Duration</h3>
                            <p style={{ margin: 0, fontSize: "26px", fontWeight: 900, color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>{itinerary.itinerary?.length || 0} Days</p>
                        </div>
                        <div style={{ ...glassStyles, flex: 1, borderRadius: "16px", padding: "20px 24px", borderLeft: "4px solid #ec4899", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)" }}>
                            <h3 style={{ margin: "0 0 6px 0", fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800 }}>Total Budget</h3>
                            <p style={{ margin: 0, fontSize: "26px", fontWeight: 900, color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>{formatCurrency(finalTotal || getTotalBudget(itinerary), (itinerary as any).pricing?.currency || DEFAULT_CURRENCY)}</p>
                        </div>
                    </div>
                </div>{/* end cover section */}
            </div>

            {/* Daily itineraries */}
            <div style={{ padding: "0 45px 45px 45px" }}>
                {Array.isArray(itinerary.itinerary) && itinerary.itinerary.map((day, index) => (
                    <div key={index} data-pdf-section={`day-${index}`} style={{ marginBottom: "35px", display: "block" }}>

                        {/* Photo + header block */}
                        <div style={{ display: "block", border: "1px solid #e2e8f0", borderBottom: "none", borderRadius: "20px 20px 0 0", pageBreakInside: "avoid", pageBreakAfter: "avoid", breakInside: "avoid" }}>
                            <div style={{ height: "200px", display: "block", position: "relative" }}>
                                <img src={getDayImage(day)} alt={formatTitleCase(day.areaFocus)} style={{ width: "100%", height: "200px", objectFit: "cover", display: "block", borderRadius: "20px 20px 0 0" }} crossOrigin="anonymous" />
                                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }} />
                            </div>
                            <div style={{ background: `linear-gradient(135deg, ${agent.primaryColor || "#a855f7"} 0%, #ec4899 100%)`, padding: "20px 30px", color: "white" }}>
                                <span style={{ fontSize: "12px", opacity: 0.95, textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800 }}>Day {index + 1} • {formatDate(day.date)}</span>
                                <h3 style={{ margin: "5px 0 0 0", fontSize: "24px", fontWeight: 900, letterSpacing: "-0.5px", fontFamily: "'Outfit', sans-serif" }}>{formatTitleCase(day.areaFocus)}</h3>
                            </div>
                        </div>

                        {/* Timeline steps */}
                        <div style={{ ...glassStyles, borderRadius: "0 0 20px 20px", padding: "30px 35px", border: "1px solid rgba(148,163,184,0.18)", borderTop: "none", position: "relative", background: "rgba(255,255,255,0.58)" }}>
                            {/* Vertical timeline connector */}
                            {showTimestamps !== false && day.timeline?.length > 1 && (
                                <div style={{ position: "absolute", left: "76px", top: "38px", bottom: "38px", width: "2px", background: "linear-gradient(to bottom, #cbd5e1 30%, rgba(203,213,225,0.2) 100%)" }} />
                            )}
                            
                            {Array.isArray(day.timeline) && day.timeline.map((step, si) => (
                                <div key={si} className="pdf-no-cut" style={{ display: "flex", alignItems: "flex-start", gap: "24px", marginBottom: si === day.timeline.length - 1 ? "0" : "24px", position: "relative", pageBreakInside: "avoid", breakInside: "avoid" }}>
                                    {showTimestamps !== false ? (
                                        <span style={{ 
                                            fontWeight: 800, 
                                            color: agent.primaryColor || "#a855f7", 
                                            fontSize: "12px", 
                                            background: "#ffffff", 
                                            border: `2px solid ${agent.primaryColor || "#a855f7"}`,
                                            padding: "6px 12px", 
                                            borderRadius: "30px", 
                                            display: "inline-flex", 
                                            alignItems: "center", 
                                            justifyContent: "center", 
                                            flexShrink: 0, 
                                            width: "82px", 
                                            textAlign: "center",
                                            zIndex: 1,
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                                        }}>
                                            {step.time}
                                        </span>
                                    ) : (
                                        <span style={{
                                            width: "10px",
                                            height: "10px",
                                            borderRadius: "50%",
                                            background: `linear-gradient(135deg, ${agent.primaryColor || "#a855f7"}, #ec4899)`,
                                            marginTop: "6px",
                                            flexShrink: 0,
                                            alignSelf: "flex-start",
                                            boxShadow: "0 0 0 4px rgba(236,72,153,0.15)"
                                        }} />
                                    )}
                                    <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.75", color: "#334155", flex: 1, fontWeight: 500 }}>
                                        {step.details}
                                    </p>
                                </div>
                            ))}
                            {showPrices !== false && (day as any).dailyStats?.totalCost && (!(itinerary as any).pricing || (itinerary as any).pricing.costingType !== 'manual') && (
                                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "20px", fontSize: "13px", color: "#64748b", fontWeight: 700, pageBreakInside: "avoid", breakInside: "avoid" }}>
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
            <div data-pdf-section="footer" style={{ padding: "40px 45px", background: "linear-gradient(180deg, rgba(15,23,42,0.82), rgba(15,23,42,0.92))", color: "white", textAlign: "center" }}>
                <div style={{ fontSize: "22px", fontWeight: 900, marginBottom: "8px", background: `linear-gradient(to right, ${agent.primaryColor || "#a855f7"}, #ec4899)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "'Outfit', sans-serif" }}>{agent.companyName}</div>
                <p style={{ margin: "0 0 6px 0", color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>Bespoke Travel Solutions</p>
                <p style={{ margin: 0, color: "#475569", fontSize: "11px" }}>Generated on {new Date().toLocaleDateString()} • Designed in The Lab</p>
            </div>
        </div>
    );
};


